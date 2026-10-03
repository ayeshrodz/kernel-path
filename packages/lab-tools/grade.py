#!/usr/bin/env python3
"""Read-only exercise checks for the Kernel Path home lab.

Every check is a typed description from the exercise catalog (graders.json). The catalog
supplies values only: this file owns every command that runs, builds each from validated,
quoted values, and never changes the learner's project or the managed hosts.
"""
import argparse
import base64
import json
import os
import re
import shlex
import shutil
import subprocess
import tempfile
from datetime import datetime, timezone
from pathlib import Path

CATALOG_VERSION = 2
PLACEHOLDER = re.compile(r'(\{host\}|\{hostShort\})')
UNSAFE = re.compile(r'[\x00-\x1f]')


def run(args, cwd, timeout=90):
    return subprocess.run(args, cwd=cwd, text=True, capture_output=True, timeout=timeout,
                          env={**os.environ, 'ANSIBLE_NOCOLOR': '1', 'ANSIBLE_HOST_KEY_CHECKING': 'True'})


def result(check_id, status, message, lesson):
    return dict(id=check_id, status=status, message=message, lesson=lesson)


def inventory_members(inventory, group, ancestors=None):
    ancestors = set() if ancestors is None else ancestors
    if group in ancestors:
        raise ValueError('Inventory contains a cyclic group')
    node = inventory.get(group, {})
    hosts = set(node.get('hosts', []))
    for child in node.get('children', []):
        hosts.update(inventory_members(inventory, child, ancestors | {group}))
    return hosts


# ---------------------------------------------------------------------------------------
# Checks that run on the managed hosts. Each builder returns the shell conditions that must
# all hold; the script sees $H (inventory name) and $HS (its first label).

class CheckError(ValueError):
    pass


def word(text):
    """A shell word for text that may hold {host} and {hostShort}, with everything quoted."""
    if not isinstance(text, str) or UNSAFE.search(text):
        raise CheckError('unsafe value')
    out = ''
    for part in PLACEHOLDER.split(text):
        if part == '{host}':
            out += '"$H"'
        elif part == '{hostShort}':
            out += '"$HS"'
        elif part:
            out += shlex.quote(part)
    return out or "''"


def octal(mode):
    return mode.lstrip('0') or '0'


def stat_is(path, fmt, expected):
    return '[ "$(stat -c %s %s)" = %s ]' % (fmt, path, shlex.quote(expected))


def file_conditions(c, path):
    p = word(path)
    if c.get('exists', True) is False:
        return ['test ! -e ' + p]
    out = ['test -s ' + p if c.get('nonEmpty') else 'test -e ' + p]
    for literal in c.get('contains', []):
        out.append('grep -qF -- %s %s' % (word(literal), p))
    for literal in c.get('lacks', []):
        out.append('! grep -qF -- %s %s' % (word(literal), p))
    for literal in ([c['line']] if 'line' in c else []) + c.get('lines', []):
        out.append('grep -qxF -- %s %s' % (word(literal), p))
    if 'matches' in c:
        out.append('grep -Eq -- %s %s' % (word(c['matches']), p))
    if 'contentEquals' in c:
        fact = {'kernel-release': 'uname -r', 'hostname-short': 'hostname -s', 'fqdn': 'hostname -f'}[c['contentEquals']]
        out.append('[ "$(cat %s)" = "$(%s)" ]' % (p, fact))
    if 'mode' in c:
        out.append(stat_is(p, '%a', octal(c['mode'])))
    if 'owner' in c:
        out.append(stat_is(p, '%U', c['owner']))
    if 'group' in c:
        out.append(stat_is(p, '%G', c['group']))
    if 'selinuxType' in c:
        out.append('ls -Zd -- %s | grep -q %s' % (p, shlex.quote(':%s:' % c['selinuxType'])))
    if 'symlinkTo' in c:
        out.append('[ "$(readlink %s)" = %s ]' % (p, word(c['symlinkTo'])))
    if 'fileType' in c:
        out.append({'regular': 'test -f %s && test ! -L %s', 'directory': 'test -d %s && test ! -L %s',
                    'symlink': 'test -L %s && test -L %s'}[c['fileType']] % (p, p))
    if 'hardLinks' in c:
        out.append(stat_is(p, '%h', str(c['hardLinks'])))
    if 'sameFileAs' in c:
        out.append('test %s -ef %s' % (p, word(c['sameFileAs'])))
    if 'resolvesTo' in c:
        out.append('[ "$(readlink -f %s)" = %s ]' % (p, word(c['resolvesTo'])))
    return out


def conditions_file(c):
    alternatives = [' && '.join(file_conditions(c, path)) for path in c['paths']]
    return alternatives if len(alternatives) == 1 else [' || '.join('( %s )' % a for a in alternatives)]


def conditions_service(c):
    out = []
    for name in c['names']:
        n = shlex.quote(name)
        if 'active' in c:
            out.append(('' if c['active'] else '! ') + 'systemctl is-active --quiet ' + n)
        if 'enabled' in c:
            out.append(('' if c['enabled'] else '! ') + 'systemctl is-enabled --quiet ' + n)
    return out


def conditions_firewall(c):
    query = '--query-service=' + shlex.quote(c['service']) if 'service' in c else '--query-port=' + shlex.quote(c['port'])
    parts = []
    if c.get('runtime', True):
        parts.append('firewall-cmd ' + query)
    if c.get('permanent', True):
        parts.append('firewall-cmd --permanent ' + query)
    if c.get('allowed', True):
        return parts
    return ['! ' + part for part in parts]


def conditions_package(c):
    names = ' '.join(shlex.quote(n) for n in c['names'])
    if c.get('installed', True):
        return ['rpm -q %s >/dev/null' % names]
    return ['! rpm -q %s >/dev/null' % shlex.quote(n) for n in c['names']]


def conditions_file_compare(c):
    return ['cmp -s %s %s' % (word(c['a']), word(c['b']))]


def conditions_archive(c):
    p = word(c['path'])
    lister = {'tar.gz': 'tar -tzf', 'tar.bz2': 'tar -tjf', 'tar.xz': 'tar -tJf', 'tar': 'tar -tf', 'zip': 'unzip -tq'}[c.get('format', 'tar.gz')]
    return ['test -s ' + p, '%s %s >/dev/null' % (lister, p)]


def conditions_user(c):
    out = []
    for name in c['names']:
        n = shlex.quote(name)
        if c.get('exists', True) is False:
            out.append('! getent passwd %s >/dev/null' % n)
            continue
        out.append('getent passwd %s >/dev/null' % n)
        for group in c.get('groups', []):
            out.append("id -nG %s | tr ' ' '\\n' | grep -qx %s" % (n, shlex.quote(group)))
        for group in c.get('notGroups', []):
            out.append("! id -nG %s | tr ' ' '\\n' | grep -qx %s" % (n, shlex.quote(group)))
        if c.get('passwordSet'):
            out.append("getent shadow %s | awk -F: '$2 ~ /^\\$/ {ok=1} END {exit !ok}'" % n)
        if 'uid' in c:
            out.append('[ "$(id -u %s)" = %s ]' % (n, shlex.quote(str(c['uid']))))
        if 'primaryGroup' in c:
            out.append('[ "$(id -gn %s)" = %s ]' % (n, shlex.quote(c['primaryGroup'])))
        for key, field in (('home', 6), ('shell', 7)):
            if key in c:
                out.append('[ "$(getent passwd %s | cut -d: -f%d)" = %s ]' % (n, field, shlex.quote(c[key])))
        shadow = 'getent shadow %s | cut -d: -f%%d' % n
        if 'locked' in c:
            out.append(('' if c['locked'] else '! ') + '{ %s | grep -q "^!"; }' % (shadow % 2))
        for key, field in (('minDays', 4), ('maxDays', 5), ('warnDays', 6)):
            if key in c:
                value = '' if c[key] == -1 else str(c[key])
                out.append('[ "$(%s)" = %s ]' % (shadow % field, shlex.quote(value)))
        if 'mustChangePassword' in c:
            out.append('[ "$(%s)" %s 0 ]' % (shadow % 3, '=' if c['mustChangePassword'] else '!='))
        if 'expires' in c:
            out.append('[ "$(%s)" = "$(( $(date -u -d %s +%%s) / 86400 ))" ]' % (shadow % 8, shlex.quote(c['expires'])))
        home = '$(getent passwd %s | cut -d: -f6)' % n
        if c.get('authorizedKeys'):
            keys = '"%s/.ssh/authorized_keys"' % home
            out.append('[ -s %s ] && [ "$(stat -c %%a:%%U %s)" = %s ]' % (keys, keys, shlex.quote('600:' + name)))
        if 'homeFile' in c:
            out.append('[ -s "%s"/%s ]' % (home, shlex.quote(c['homeFile'])))
    return out


def conditions_mount(c):
    p = word(c['path'])
    out = ['findmnt -rn -M %s >/dev/null' % p]
    if 'fstype' in c:
        out.append('[ "$(findmnt -rn -M %s -o FSTYPE)" = %s ]' % (p, shlex.quote(c['fstype'])))
    if c.get('persistent'):
        out.append('findmnt --fstab -rn -M %s >/dev/null' % p)
    return out


def conditions_logical_volume(c):
    device = shlex.quote('/dev/%s/%s' % (c['vg'], c['lv']))
    if 'minSizeMiB' not in c:
        return ['lvs %s >/dev/null 2>&1' % device]
    return ["lvs --noheadings --units m --nosuffix -o lv_size %s | awk '$1 >= %d {ok=1} END {exit !ok}'" % (device, int(c['minSizeMiB']))]


def conditions_http(c):
    url = c['url']
    scheme, rest = url.split('://', 1)
    host, _, port = rest.split('/', 1)[0].partition(':')
    request = 'curl --fail --silent'
    if c.get('insecure'):
        request += ' --insecure'
    if c.get('resolveToLocalhost'):
        request += ' --resolve ' + word('%s:%s:127.0.0.1' % (host, port or ('443' if scheme == 'https' else '80')))
    request += ' ' + word(url)
    if 'containsAny' in c:
        request += ' | grep -qF ' + ' '.join('-e ' + word(s) for s in c['containsAny'])
    else:
        request += ' >/dev/null'
    return [request]


def conditions_selinux(c):
    out = ['[ "$(getenforce)" = %s ]' % shlex.quote(c['mode'].capitalize())]
    if c.get('persistent', True):
        out.append('grep -q %s /etc/selinux/config' % shlex.quote('^SELINUX=' + c['mode']))
    return out


def conditions_sudoers(c):
    p = word(c['path'])
    out = []
    if 'mode' in c:
        out.append(stat_is(p, '%a', octal(c['mode'])))
    if 'owner' in c:
        out.append(stat_is(p, '%U', c['owner']))
    if 'group' in c:
        out.append(stat_is(p, '%G', c['group']))
    if c.get('valid', True):
        out.append('visudo -cf %s >/dev/null' % p)
    if 'rules' in c:
        expected = '"$(printf \'%%s\\n\' %s)"' % ' '.join(word(r) for r in c['rules'])
        out.append('[ "$(grep -vE \'^ *#|^ *$\' %s)" = %s ]' % (p, expected))
    return out


def conditions_sshd(c):
    return ['sshd -T | grep -qx %s' % shlex.quote('%s %s' % (c['setting'], c['value']))]


def conditions_cron(c):
    p = shlex.quote('/etc/cron.d/' + c['file'])
    if 'line' in c:
        test = 'grep -qxF -- %s %s' % (word(c['line']), p)
    else:
        test = 'grep -Eq -- %s %s' % (word(c['matches']), p)
    return [test] if c.get('present', True) else ['! ' + test + ' 2>/dev/null']


def conditions_boot_target(c):
    return ['[ "$(systemctl get-default)" = %s ]' % shlex.quote(c['target'])]


def conditions_address(c):
    iface, cidr = shlex.quote(c['interface']), shlex.quote(c['cidr'])
    out = ['ip -4 -o addr show %s | grep -qF %s' % (iface, cidr)]
    if c.get('persistent', True):
        out.append('nmcli -g ipv4.addresses connection show %s | grep -qF %s' % (iface, cidr))
    return out


def conditions_hostname(c):
    return ['[ "$(hostname -s)" = %s ]' % shlex.quote(c['short'])]


def conditions_commands(c):
    return ['command -v %s >/dev/null' % shlex.quote(n) for n in c['names']]


HOST_CHECKS = {
    'service': conditions_service, 'firewall': conditions_firewall, 'package': conditions_package, 'file': conditions_file,
    'file-compare': conditions_file_compare, 'archive': conditions_archive, 'user': conditions_user, 'mount': conditions_mount,
    'logical-volume': conditions_logical_volume, 'http': conditions_http, 'selinux': conditions_selinux, 'sudoers': conditions_sudoers,
    'sshd': conditions_sshd, 'cron': conditions_cron, 'boot-target': conditions_boot_target, 'address': conditions_address,
    'hostname': conditions_hostname, 'commands': conditions_commands,
}


def host_script(check):
    """The read-only shell script for a check on managed hosts."""
    build = HOST_CHECKS.get(check['kind'])
    if build is None:
        raise CheckError('unknown check kind ' + str(check['kind']))
    return ' && '.join(c for c in build(check) if c) or 'true'


def ssh_command(script, host):
    """The remote command for the ssh transport: the host name is a validated literal; the script travels encoded."""
    payload = base64.b64encode(script.encode()).decode()
    short = host.split('.')[0]
    return "echo %s | base64 -d | H=%s HS=%s bash" % (payload, shlex.quote(host), shlex.quote(short))


SSH_OPTIONS = ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10', '-o', 'StrictHostKeyChecking=accept-new', '-o', 'LogLevel=ERROR']


def raw_command(script):
    """The text for ansible's raw module: only the host name is templated; the script travels encoded."""
    payload = base64.b64encode(script.encode()).decode()
    return "H='{{ inventory_hostname }}'; HS=${H%%.*}; echo " + payload + ' | base64 -d | H="$H" HS="$HS" bash'


# ---------------------------------------------------------------------------------------
# Checks on the control node (the learner's project directory).

def pick(c, key, default=None):
    return c.get(key, default)


def control_file(c, project):
    for path in c['paths']:
        target = project / path
        if c.get('exists', True) is False:
            if not target.exists():
                return True
            continue
        if not target.exists() or (c.get('nonEmpty') and target.stat().st_size == 0):
            continue
        text = target.read_text(errors='replace') if target.is_file() else ''
        lines = text.splitlines()
        good = all(s in text for s in c.get('contains', [])) and not any(s in text for s in c.get('lacks', []))
        good = good and all(s in lines for s in ([c['line']] if 'line' in c else []) + c.get('lines', []))
        good = good and ('matches' not in c or re.search(c['matches'], text, re.M) is not None)
        if 'mode' in c:
            good = good and (target.stat().st_mode & 0o777) == int(c['mode'], 8)
        if 'symlinkTo' in c:
            good = good and target.is_symlink() and os.readlink(target) == c['symlinkTo']
        if 'fileType' in c:
            good = good and {'regular': target.is_file() and not target.is_symlink(),
                             'directory': target.is_dir() and not target.is_symlink(),
                             'symlink': target.is_symlink()}[c['fileType']]
        if 'hardLinks' in c:
            good = good and target.stat().st_nlink == c['hardLinks']
        if 'sameFileAs' in c:
            other = project / c['sameFileAs']
            good = good and other.exists() and os.path.samefile(target, other)
        if 'resolvesTo' in c:
            good = good and str(target.resolve()) == str((project / c['resolvesTo']).resolve())
        if good:
            return True
    return False


def git(project, *args):
    return subprocess.run(['git', *args], cwd=project, text=True, capture_output=True, timeout=60)


def control_git(c, project):
    if git(project, 'rev-parse', '--is-inside-work-tree').returncode != 0:
        return False
    if 'remoteEndsWith' in c:
        url = git(project, 'remote', 'get-url', 'origin')
        if url.returncode != 0 or not url.stdout.strip().endswith(c['remoteEndsWith']):
            return False
    if 'minCommits' in c:
        count = git(project, 'rev-list', '--count', 'HEAD')
        if count.returncode != 0 or int(count.stdout) < c['minCommits']:
            return False
    if c.get('clean') and git(project, 'status', '--porcelain').stdout.strip():
        return False
    if 'pushedBranch' in c:
        head = git(project, 'rev-parse', 'HEAD').stdout.strip()
        remote = git(project, 'ls-remote', 'origin', 'refs/heads/' + c['pushedBranch']).stdout.split('\t')[0]
        if not head or head != remote:
            return False
    for path in c.get('ignored', []):
        if not (project / path).is_file() or git(project, 'check-ignore', '-q', path).returncode != 0:
            return False
        if git(project, 'ls-files', '--error-unmatch', path).returncode == 0:
            return False
    for path in c.get('remoteHasPaths', []):
        branch = c.get('pushedBranch', 'main')
        if git(project, 'cat-file', '-e', 'origin/%s:%s' % (branch, path)).returncode != 0:
            return False
    return True


def control_lint(c, project):
    if shutil.which('podman') is None:
        raise OSError('podman is not installed')
    args = ['podman', 'run', '--rm', '--pull=never', '--security-opt', 'label=disable', '-v', '%s:/workdir:ro' % project,
            '-w', '/workdir', c['image'], c['tool'], '-q', *c['files']]
    return subprocess.run(args, cwd=project, text=True, capture_output=True, timeout=300).returncode == 0


def control_check(c, project):
    """True or False; raises OSError when the tools needed are missing (reported as SKIP)."""
    kind = c['kind']
    if kind == 'file':
        return control_file(c, project)
    if kind == 'commands':
        return all(shutil.which(n) for n in c['names'])
    if kind == 'git':
        return control_git(c, project)
    if kind == 'lint':
        return control_lint(c, project)
    raise CheckError('check kind %s cannot run on the control node' % kind)


# ---------------------------------------------------------------------------------------

def grade(exercise_id, checkpoint_id, project, catalog, runner=run):
    exercise = catalog['exercises'][exercise_id]
    cp = exercise['checkpoints'][checkpoint_id]
    lesson = exercise['lesson']
    checks = []

    def add(cid, status, message):
        checks.append(result(cid, status, message, lesson))

    for filename in cp.get('files', []):
        file = project / filename
        good = file.is_file() and file.stat().st_size > 0
        add('file:' + filename, 'pass' if good else 'fail', f'{filename}: ' + ('present' if good else 'missing or empty'))

    environment_problem = False
    for check in [c for c in cp.get('checks', []) if c['on'] == 'control']:
        try:
            good = control_check(check, project)
            add(check['id'], 'pass' if good else 'fail', check['message'])
        except (OSError, subprocess.TimeoutExpired, CheckError, ValueError) as error:
            environment_problem = True
            add(check['id'], 'skip', check['message'] + '; ' + type(error).__name__)

    host_checks = [c for c in cp.get('checks', []) if c['on'] != 'control']
    if exercise.get('transport') == 'ssh':
        # Exercises that do not use Ansible: each check names one host, reached as root with the
        # learner's SSH key, as the lab setup arranges on every server.
        for check in host_checks:
            try:
                script = host_script(check)
            except (CheckError, KeyError, ValueError) as error:
                environment_problem = True
                add(check['id'], 'skip', check['message'] + '; the check is not valid: ' + str(error))
                continue
            host = check['on']
            try:
                executed = runner(['ssh', *SSH_OPTIONS, 'root@' + host, ssh_command(script, host)], project)
            except (OSError, subprocess.TimeoutExpired) as error:
                environment_problem = True
                add(check['id'] + ':' + host, 'skip', host + ': ' + check['message'] + '; ' + type(error).__name__)
                continue
            if executed.returncode == 255:
                environment_problem = True
                add(check['id'] + ':' + host, 'skip', host + ': cannot log in as root with your SSH key; run lab check')
            else:
                add(check['id'] + ':' + host, 'pass' if executed.returncode == 0 else 'fail', host + ': ' + check['message'])
        host_checks = []
    inventory_file = cp.get('inventory', 'inventory')
    inv = None
    if cp.get('groups') or host_checks:
        if not (project / inventory_file).is_file():
            add('inventory', 'fail', f'{inventory_file} is missing; host checks cannot run')
        else:
            try:
                resolved = runner(['ansible-inventory', '-i', inventory_file, '--list'], project)
                inv = json.loads(resolved.stdout) if resolved.returncode == 0 else None
                if inv is None:
                    environment_problem = True
                    add('inventory', 'skip', 'Inventory could not be resolved; check Ansible and inventory syntax')
            except (OSError, subprocess.TimeoutExpired, ValueError):
                environment_problem = True
                add('inventory', 'skip', 'Inventory could not be resolved; check Ansible and inventory syntax')
    for group, expected in cp.get('groups', {}).items():
        if inv is None:
            add('group:' + group, 'skip', 'Inventory unavailable')
            continue
        try:
            actual = inventory_members(inv, group)
            good = actual == set(expected)
            add('group:' + group, 'pass' if good else 'fail', f'{group}: expected ' + ', '.join(expected) + '; found ' + ', '.join(sorted(actual)))
        except ValueError as error:
            add('group:' + group, 'fail', str(error))

    for check in host_checks:
        if inv is None:
            add(check['id'], 'skip', check['message'] + '; inventory unavailable')
            continue
        try:
            command = raw_command(host_script(check))
        except (CheckError, KeyError, ValueError) as error:
            environment_problem = True
            add(check['id'], 'skip', check['message'] + '; the check is not valid: ' + str(error))
            continue
        with tempfile.TemporaryDirectory(prefix='kernel-path-grade-') as tree:
            # raw bypasses Python module transfer. Checks are fixed read-only commands built here;
            # grading never runs a learner's playbook, restarts a service or repairs state.
            args = ['ansible', check['on'], '-i', inventory_file, '-m', 'ansible.builtin.raw', '-a', command, '--tree', tree,
                    '-b', '-e', 'ansible_become_ask_pass=false', '-e', 'ansible_ssh_timeout=10']
            try:
                executed = runner(args, project)
                reports = sorted(Path(tree).iterdir())
                if not reports:
                    environment_problem = environment_problem or executed.returncode != 0
                    add(check['id'], 'skip' if executed.returncode else 'fail', check['message'] + '; no hosts matched or connection/tooling unavailable')
                    continue
                returned = {p.name for p in reports}
                for missing in sorted(set(check.get('targets', [])) - returned):
                    add(check['id'] + ':' + missing, 'fail', missing + ': required host was not checked; restore its inventory membership')
                for report in reports:
                    data = json.loads(report.read_text())
                    if data.get('unreachable') or 'rc' not in data:
                        status = 'skip'
                        environment_problem = True
                        message = 'Connection or execution problem; check SSH, sudo and host readiness'
                    else:
                        status = 'pass' if data['rc'] == 0 else 'fail'
                        message = check['message']
                    add(check['id'] + ':' + report.name, status, report.name + ': ' + message)
                if executed.returncode not in (0, 2) and all(c['status'] != 'skip' for c in checks):
                    environment_problem = True
                    add(check['id'] + ':execution', 'skip', 'Ansible reported an execution problem')
            except (OSError, subprocess.TimeoutExpired, ValueError) as error:
                environment_problem = True
                add(check['id'], 'skip', check['message'] + '; ' + type(error).__name__)
    code = 2 if environment_problem else 1 if any(c['status'] == 'fail' for c in checks) else 0
    return dict(app='kernel-path-lab', version=1, exerciseId=exercise_id,
                exerciseVersion=exercise['version'], checkpointId=checkpoint_id,
                checkedAt=datetime.now(timezone.utc).isoformat(), checks=checks), code


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('name')
    parser.add_argument('--checkpoint', default='final')
    parser.add_argument('--json', action='store_true')
    parser.add_argument('--catalog', type=Path, required=True)
    parser.add_argument('--project', type=Path)
    args = parser.parse_args()
    try:
        catalog = json.loads(args.catalog.read_text())
        if catalog['version'] != CATALOG_VERSION or args.name not in catalog['exercises']:
            raise ValueError('Unknown exercise or unsupported catalog; run: lab update')
        exercise = catalog['exercises'][args.name]
        if args.checkpoint not in exercise['checkpoints']:
            raise ValueError('Unknown checkpoint; choose ' + ', '.join(exercise['checkpoints']))
        project = args.project or Path.home() / args.name
        if not project.is_dir() and args.name != 'intro-install':
            raise ValueError('Project directory missing; start the exercise first')
        report, code = grade(args.name, args.checkpoint, project if project.is_dir() else Path.home(), catalog)
    except (OSError, ValueError, KeyError) as error:
        parser.exit(2, str(error) + '\n')
    if args.json:
        print(json.dumps(report, indent=2))
    else:
        print(f"{args.name} / {args.checkpoint} — read-only checks")
        for check in report['checks']:
            print(f"{check['status'].upper():4} {check['message']}\n     Review: {check['lesson']}")
        if exercise.get('transport') == 'ssh':
            print('Grading only reads. Fix any FAIL and grade again; for lasting changes, reboot the server and grade once more.')
        else:
            print('Run your playbook again to check repeatability. Perform any requested reboot check yourself.')
    return code


if __name__ == '__main__':
    raise SystemExit(main())
