#!/usr/bin/env python3
"""Prepare an exercise after `lab start` has copied its starter files, and put it away at `lab finish`.

The exercise catalog (graders.json) lists the setup actions and the cleanup ("finish") actions.
The catalog supplies values only: this file owns what each action does. Nothing here runs a
command taken from the catalog. Control-node actions work inside the project folder or under
~/git-repos. Host actions build a fixed shell script from validated, quoted values and run it as
root on the named lab servers over SSH, the way grading reaches them.
"""
import argparse
import json
import os
import re
import shlex
import shutil
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path

CATALOG_VERSION = 2
COLLECTION_DIRS = ('/usr/share/ansible/collections/ansible_collections', '~/.ansible/collections/ansible_collections')


class SetupError(Exception):
    pass


def say(text):
    print('  ' + text)


def tool(args, **kw):
    try:
        return subprocess.run(args, text=True, capture_output=True, check=True, timeout=300, **kw)
    except FileNotFoundError:
        raise SetupError('%s is not installed on workstation' % args[0])
    except subprocess.CalledProcessError as error:
        raise SetupError('%s failed: %s' % (args[0], (error.stderr or '').strip()[:300]))


def inside(project, relative):
    """A path in the project; refuses anything that would leave it."""
    target = (project / relative).resolve()
    if project.resolve() not in target.parents and target != project.resolve():
        raise SetupError('unsafe path ' + str(relative))
    return target


def published(relative):
    """Where the compiler publishes a project file: dotfile name parts gain a "_", and ".lab" is added."""
    return '/'.join('_' + part if part.startswith('.') else part for part in relative.split('/')) + '.lab'


def fetch(base, relative):
    if '..' in relative.split('/') or relative.startswith('/'):
        raise SetupError('unsafe download path')
    with urllib.request.urlopen(base.rstrip('/') + '/' + relative, timeout=60) as response:
        return response.read()


def password_hash(password, salt=None):
    args = ['openssl', 'passwd', '-6', '-stdin'] + (['-salt', salt] if salt else [])
    return tool(args, input=password + '\n').stdout.strip()


# ---------------------------------------------------------------------------------------

def self_signed_cert(a, ctx):
    common = a['commonName']
    short = common.split('.')[0]
    key, cert = inside(ctx.project, a['key']), inside(ctx.project, a['cert'])
    tool(['openssl', 'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', str(a.get('days', 3650)), '-subj', '/CN=' + common,
          '-addext', 'subjectAltName=DNS:%s,DNS:%s' % (common, short), '-keyout', str(key), '-out', str(cert)])
    key.chmod(0o600)
    say('created %s and %s (self-signed, for %s)' % (a['cert'], a['key'], common))


def htpasswd(a, ctx):
    target = inside(ctx.project, a['path'])
    hashed = tool(['openssl', 'passwd', '-apr1', '-stdin'], input=a['password'] + '\n').stdout.strip()
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text('%s:%s\n' % (a['user'], hashed))
    say('created %s (user %s, password %s)' % (a['path'], a['user'], a['password']))


def password_hash_var(a, ctx):
    target = inside(ctx.project, a['path'])
    hashed = password_hash(a['password'], a.get('salt'))
    prefix = '#' if a.get('commented') else ''
    lines = list(a.get('before', [])) + ['%s%s: %s' % (prefix, a['variable'], hashed)]
    if not a.get('commented'):
        lines.insert(0, '---')
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text('\n'.join(lines) + '\n')


def vault_encrypt(a, ctx):
    target = inside(ctx.project, a['path'])
    with tempfile.NamedTemporaryFile('w', delete=False) as handle:
        handle.write(a['password'] + '\n')
        passfile = handle.name
    try:
        os.chmod(passfile, 0o600)
        tool(['ansible-vault', 'encrypt', '--vault-password-file', passfile, str(target)])
    finally:
        os.unlink(passfile)
    say('created %s (encrypted; the Vault password is %s)' % (a['path'], a['password']))


def pack_installed_collection(a, ctx):
    namespace, name = a['namespace'], a['name']
    source = None
    for directory in COLLECTION_DIRS:
        candidate = Path(os.path.expanduser(directory)) / namespace / name
        if (candidate / 'MANIFEST.json').is_file():
            source = candidate
            break
    if source is None:
        raise SetupError('%s.%s is not installed on workstation (see section 1.6)' % (namespace, name))
    version = json.loads((source / 'MANIFEST.json').read_text())['collection_info']['version']
    archive = ctx.project / ('%s-%s-%s.tar.gz' % (namespace, name, version))
    entries = sorted(child.name for child in source.iterdir())
    tool(['tar', 'czf', str(archive), '--exclude=*.pyc', '--exclude=__pycache__', '-C', str(source), *entries])
    say('created ' + archive.name)


def build_collection(a, ctx):
    with tempfile.TemporaryDirectory() as temp:
        source = Path(temp) / 'collection'
        for relative in a['files']:
            destination = source / relative
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(fetch(ctx.base, '%s/_trees/%s' % (ctx.name, published('%s/%s' % (a['source'], relative)))))
        tool(['ansible-galaxy', 'collection', 'build', str(source), '--output-path', str(ctx.project)])
    produced = sorted(p.name for p in ctx.project.glob('*.tar.gz'))
    say('created ' + ', '.join(produced))


def collection_requirements(a, ctx):
    entries = []
    for prefix in a['archives']:
        found = sorted(ctx.project.glob(prefix + '*.tar.gz'))
        if not found:
            raise SetupError('no collection archive named %s*.tar.gz was created' % prefix)
        entries.append(found[-1])
    target = inside(ctx.project, a['path'])
    target.write_text('---\ncollections:\n' + ''.join('  - name: %s\n' % entry for entry in entries))


def git_seed_remote(a, ctx):
    root = Path(os.environ.get('LAB_HOME') or Path.home()) / 'git-repos'
    bare = root / a['remote']
    if '..' in a['remote'].split('/'):
        raise SetupError('unsafe remote')
    shutil.rmtree(bare, ignore_errors=True)
    bare.parent.mkdir(parents=True, exist_ok=True)
    tool(['git', 'init', '-q', '--bare', '-b', 'main', str(bare)])
    author = a.get('author', {'name': 'Lab', 'email': 'lab@lab.example.com'})
    with tempfile.TemporaryDirectory() as temp:
        work = Path(temp) / 'work'
        tool(['git', 'init', '-q', '-b', 'main', str(work)])
        git = lambda *args: tool(['git', '-C', str(work), *args])
        git('config', 'user.name', author['name'])
        git('config', 'user.email', author['email'])
        branches = []
        for branch in a['branches']:
            if branch['name'] != 'main' or 'from' in branch:
                git('checkout', '-q', '-b', branch['name'], branch.get('from', 'main'))
            for commit in branch['commits']:
                for child in work.iterdir():
                    if child.name != '.git':
                        shutil.rmtree(child) if child.is_dir() else child.unlink()
                for relative in commit['files']:
                    destination = work / relative
                    destination.parent.mkdir(parents=True, exist_ok=True)
                    destination.write_bytes(fetch(ctx.base, '%s/_trees/%s' % (ctx.name, published('%s/%s' % (commit['tree'], relative)))))
                git('add', '-A')
                git('commit', '-q', '-m', commit['message'])
                if 'tag' in commit:
                    git('tag', commit['tag'])
            branches.append(branch['name'])
        git('remote', 'add', 'origin', str(bare))
        git('push', '-q', 'origin', *branches, '--tags')
    say('published %s at %s (branches: %s)' % (a['remote'], bare, ', '.join(branches)))


def ssh_keypairs(a, ctx):
    directory = inside(ctx.project, a['dir'])
    directory.mkdir(parents=True, exist_ok=True)
    for name in a['names']:
        key = directory / (name + '.key')
        for old in (key, Path(str(key) + '.pub')):
            old.unlink(missing_ok=True)
        tool(['ssh-keygen', '-q', '-t', 'ed25519', '-N', '', '-C', name, '-f', str(key)])
    say('created %s/%s.key.pub ... (and their private keys)' % (a['dir'], a['names'][0]))


# ---------------------------------------------------------------------------------------
# Host actions: fixed scripts, built from validated values, run as root on lab servers.

SAFE_PATH = re.compile(r'^/(?:srv|opt|mnt|data|logs|remote|backup|tmp|root|home|var/www|var/tmp|var/log|usr/local|etc/(?:billing\.conf|httpd/conf\.d|systemd|auto\.master\.d|auto\.[a-z0-9_-]+|cron\.d|exports\.d|sudoers\.d|profile\.d|ssh/sshd_config\.d|chrony\.d|yum\.repos\.d|logrotate\.d|rsyslog\.d|security/limits\.d|sysctl\.d|NetworkManager/system-connections|containers|firewalld/(?:services|zones)))(?:/[A-Za-z0-9_.@%+=:, -]+)*$')
PROTECTED = {'/srv', '/opt', '/mnt', '/tmp', '/root', '/home', '/var/www', '/var/tmp', '/var/log', '/usr/local', '/etc/systemd', '/etc/containers'}
NAME = re.compile(r'^[a-z_][a-z0-9_-]{0,31}$')
SSH = ['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10', '-o', 'StrictHostKeyChecking=accept-new', '-o', 'LogLevel=ERROR']


def q(value):
    return shlex.quote(str(value))


def safe_path(path, removing=False):
    if not SAFE_PATH.match(path) or '..' in path.split('/'):
        raise SetupError('this version of lab will not touch ' + path)
    if removing and (path.rstrip('/') in PROTECTED or re.match(r'^/home/[^/]+/?$', path)):
        raise SetupError('refusing to remove ' + path)
    return path


def name(value):
    if not NAME.match(value):
        raise SetupError('invalid name ' + str(value))
    return value


def script_package(a):
    names = ' '.join(q(n) for n in a['names'])
    if a.get('state', 'present') == 'absent':
        return 'dnf remove -y -q %s >/dev/null 2>&1' % names
    if a.get('state') == 'reinstalled':
        return 'dnf install -y -q %s >/dev/null 2>&1; dnf reinstall -y -q %s >/dev/null 2>&1' % (names, names)
    return 'dnf install -y -q %s >/dev/null 2>&1' % names


def script_service(a):
    ctl = 'systemctl'
    pre = ''
    if 'user' in a:
        user = q(name(a['user']))
        pre = 'runuser -u %s -- env XDG_RUNTIME_DIR=/run/user/$(id -u %s) ' % (user, user)
        ctl = 'systemctl --user'
    out = []
    for unit in a['names']:
        u = q(unit)
        state = a.get('state')
        enabled = a.get('enabled')
        if enabled is True and state == 'started':
            out.append('%s%s enable --now %s%s' % (pre, ctl, u, ' 2>/dev/null || true' if a.get('tolerant') else ''))
            continue
        if enabled is False and state == 'stopped':
            out.append('%s%s disable --now %s 2>/dev/null || true' % (pre, ctl, u))
            continue
        if state:
            out.append('%s%s %s %s%s' % (pre, ctl, {'started': 'start', 'stopped': 'stop', 'restarted': 'restart'}[state], u, ' 2>/dev/null || true' if state == 'stopped' or a.get('tolerant') else ''))
        if enabled is not None:
            out.append('%s%s %s %s%s' % (pre, ctl, 'enable' if enabled else 'disable', u, '' if enabled else ' 2>/dev/null || true'))
        if a.get('masked') is not None:
            out.append('%s%s %s %s%s' % (pre, ctl, 'mask' if a['masked'] else 'unmask', u, '' if a['masked'] else ' 2>/dev/null || true'))
    return '\n'.join(out)


def script_group(a):
    n = q(name(a['name']))
    if a.get('state', 'present') == 'absent':
        return 'getent group %s >/dev/null && groupdel %s || true' % (n, n)
    gid = ' -g %d' % a['gid'] if 'gid' in a else ''
    return 'getent group %s >/dev/null || groupadd%s %s' % (n, gid, n)


def script_user(a):
    n = q(name(a['name']))
    if a.get('state', 'present') == 'absent':
        return 'if id %s >/dev/null 2>&1; then pkill -KILL -u %s 2>/dev/null || true; sleep 1; userdel -r -f %s 2>/dev/null || userdel -f %s; fi' % (n, n, n, n)
    flags = ''
    if 'uid' in a:
        flags += ' -u %d' % a['uid']
    if 'group' in a:
        flags += ' -g ' + q(name(a['group']))
    if a.get('groups'):
        flags += ' -G ' + ','.join(q(name(g)) for g in a['groups'])
    if 'shell' in a:
        flags += ' -s ' + q(a['shell'])
    flags += ' -m' if a.get('home', True) else ' -M'
    cmd = 'id %s >/dev/null 2>&1 || useradd%s %s' % (n, flags, n)
    if 'password' in a:
        cmd += ' ; echo %s | chpasswd' % q('%s:%s' % (a['name'], a['password']))
    return cmd


def owner_args(a, path):
    out = []
    if 'owner' in a or 'group' in a:
        who = (name(a['owner']) if 'owner' in a else '') + (':' + name(a['group']) if 'group' in a else '')
        out.append('chown %s %s' % (who, path))
    if 'mode' in a:
        out.append('chmod %s %s' % (a['mode'], path))
    return out


def label_args(a, path):
    if 'selinuxType' not in a:
        return ['restorecon -R %s 2>/dev/null || true' % path]
    if not re.match(r'^[a-z_]+_t$', a['selinuxType']):
        raise SetupError('unsafe SELinux type')
    return ['chcon -t %s %s' % (q(a['selinuxType']), path)]


def script_directory(a):
    path = safe_path(a['path'], a.get('state') == 'absent')
    p = q(path)
    if a.get('state', 'present') == 'absent':
        return 'rm -rf -- %s' % p
    return '\n'.join(['mkdir -p -- %s' % p] + owner_args(a, p) + label_args(a, p))


def script_file(a):
    path = safe_path(a['path'], a.get('state') == 'absent')
    p = q(path)
    if a.get('state', 'present') == 'absent':
        return 'rm -rf -- %s' % p
    import base64
    data = base64.b64encode(a.get('content', '').encode()).decode()
    lines = ['mkdir -p -- "$(dirname %s)"' % p, 'echo %s | base64 -d > %s' % (data, p)]
    return '\n'.join(lines + owner_args(a, p) + label_args(a, p))


def script_remove_lines(a):
    pattern = a['matching']
    if not re.match(r'^[A-Za-z0-9 _./:,@=^$*+?|()\[\]-]{1,120}$', pattern) or a['path'] not in ('/etc/fstab', '/etc/exports', '/etc/hosts', '/etc/chrony.conf'):
        raise SetupError('unsafe line pattern')
    return "grep -Ev -- %s %s > /tmp/.lab-lines && cat /tmp/.lab-lines > %s; rm -f /tmp/.lab-lines" % (q(pattern), a['path'], a['path'])


def script_firewall(a):
    fc = 'firewall-cmd --permanent'
    zone = ' --zone=%s' % q(name(a['zone'])) if 'zone' in a else ''
    present = a.get('state', 'present') == 'present'
    out = []
    if a.get('deleteZone'):
        z = q(name(a['zone']))
        out.append(('%s --new-zone=%s 2>/dev/null || true' % (fc, z)) if present else ('%s --delete-zone=%s 2>/dev/null || true' % (fc, z)))
    elif a.get('deleteService'):
        s = q(a['service'])
        out.append(('%s --new-service=%s 2>/dev/null || true' % (fc, s)) if present else ('%s --delete-service=%s 2>/dev/null || true' % (fc, s)))
    else:
        verb = 'add' if present else 'remove'
        for key, option in (('service', 'service'), ('port', 'port'), ('source', 'source'), ('forwardPort', 'forward-port')):
            if key in a:
                value = q(a[key])
                if key == 'source' and re.match(r'^@server[a-d]$', a[key]):
                    value = '"$(getent ahostsv4 %s.lab.example.com | awk \'NR==1{print $1}\')"' % a[key][1:]
                out.append('%s%s --%s-%s=%s%s' % (fc, zone, verb, option, value, '' if present else ' >/dev/null 2>&1 || true'))
    out.append('firewall-cmd --reload >/dev/null')
    return '\n'.join(out)


def script_selinux(a):
    present = a.get('state', 'present') == 'present'
    tail = '' if present else ' >/dev/null 2>&1 || true'
    if a['kind'] == 'port':
        return 'semanage port %s -t %s -p %s %d%s' % ('-a' if present else '-d', q(a['type']), a['proto'], a['port'], tail)
    if a['kind'] == 'fcontext':
        return ('semanage fcontext -a -t %s %s' % (q(a['type']), q(a['path']))) if present else ('semanage fcontext -d %s%s' % (q(a['path']), tail))
    return 'setsebool -P %s %s' % (q(a['name']), 'on' if a.get('value', True) else 'off')


def script_wipe_disk(a):
    dev = q(a['device'])
    return """set +e
for s in $(swapon --noheadings --show=NAME 2>/dev/null); do
  case $s in %(d)s*|/dev/dm-*|/dev/mapper/*) swapoff $s 2>/dev/null;; esac
done
for m in $(lsblk -nrpo MOUNTPOINTS %(dev)s 2>/dev/null | grep '^/'); do umount -l "$m" 2>/dev/null; done
for v in $(pvs --noheadings -o vg_name %(d)s* 2>/dev/null | sort -u); do vgremove -ff -y "$v" >/dev/null 2>&1; done
for p in $(pvs --noheadings -o pv_name %(d)s* 2>/dev/null); do pvremove -ff -y "$p" >/dev/null 2>&1; done
wipefs -a -f %(d)s?* >/dev/null 2>&1
wipefs -a -f %(dev)s >/dev/null 2>&1
partprobe %(dev)s 2>/dev/null; udevadm settle
true""" % {'d': a['device'], 'dev': dev}


def script_systemd(a):
    return ('systemctl daemon-reload' if a.get('reload', True) else 'true') + ('\nsystemctl daemon-reexec' if a.get('daemonReexec') else '')


def script_linger(a):
    return 'loginctl %s %s' % ('enable-linger' if a.get('state', 'present') == 'present' else 'disable-linger', q(name(a['user'])))


def script_container_reset(a):
    user = q(name(a['user']))
    n = name(a['user'])
    if a.get('keepImages'):
        inner = ("systemctl --user stop '*.service' 2>/dev/null; podman rm -af -t 1; podman volume rm -af; "
                 "podman images --format '{{.Repository}}:{{.Tag}}' | grep '^localhost/' | xargs -r podman rmi -f")
    else:
        inner = "systemctl --user stop '*.service' 2>/dev/null; podman system reset -f"
    return ('id %(u)s >/dev/null 2>&1 && { runuser -l %(u)s -c %(c)s >/dev/null 2>&1 || true; rm -rf /home/%(n)s/.config/containers/systemd; '
            'runuser -l %(u)s -c "systemctl --user daemon-reload" >/dev/null 2>&1 || true; }; true') % {'u': user, 'n': n, 'c': q(inner)}


def script_restore_skel(a):
    user = name(a['user'])
    files = a.get('files') or ['.bashrc', '.bash_profile', '.bash_logout']
    return '\n'.join('install -o %s -g %s -m 644 /etc/skel/%s /home/%s/%s' % (q(user), q(user), q(x), q(user), q(x)) for x in files if re.match(r'^\.bash[a-z_]+$', x))


def script_boot(a):
    out = []
    if 'target' in a:
        out.append('systemctl set-default %s' % q(a['target']))
    for arg in a.get('removeKernelArgs', []):
        if not re.match(r'^[A-Za-z0-9_.=,-]{1,60}$', arg):
            raise SetupError('unsafe kernel argument')
        out.append('grubby --update-kernel=ALL --remove-args=%s' % q(arg))
    return '\n'.join(out) or 'true'


def script_timezone(a):
    if not re.match(r'^[A-Za-z]+(?:/[A-Za-z_+-]+)*$', a['zone']):
        raise SetupError('unsafe time zone')
    return 'timedatectl set-timezone %s' % q(a['zone'])


def script_nm_connection(a):
    return 'nmcli connection delete %s >/dev/null 2>&1 || true' % q(a['name'])


def script_hostname(a):
    if not re.match(r'^[a-z][a-z0-9.-]{1,60}$', a['name']):
        raise SetupError('unsafe host name')
    return 'hostnamectl set-hostname %s' % q(a['name'])


def script_http_server(a):
    port = int(a['port'])
    if a['bind'] not in ('127.0.0.1', '0.0.0.0'):
        raise SetupError('unsafe address')
    unit = 'lab-http-%d' % port
    stop = 'systemctl stop %s 2>/dev/null || true\nsystemctl reset-failed %s 2>/dev/null || true\npkill -f %s 2>/dev/null || true' % (unit, unit, q('http.server %d' % port))
    if a.get('state', 'started') == 'stopped':
        return stop
    return '%s\nsystemd-run --quiet --unit=%s -p WorkingDirectory=%s python3 -m http.server %d --bind %s\nsleep 1' % (
        stop, unit, q(safe_path(a['directory'])), port, a['bind'])


def script_dnf_module(a):
    n = q(a['name'])
    if a['state'] == 'reset':
        return 'dnf module reset -y %s >/dev/null 2>&1' % n
    return 'dnf module enable -y %s:%s >/dev/null 2>&1' % (n, q(a['stream']))


def script_crontab(a):
    return 'crontab -r -u %s 2>/dev/null || true' % q(name(a['user']))


def script_partition_disk(a):
    dev = a['device']
    if not re.match(r'^/dev/(?:sd|vd)[b-z]$', dev):
        raise SetupError('unsafe device')
    out = ['parted -s %s mklabel gpt' % q(dev)]
    for part in a['partitions']:
        if not re.match(r'^[a-z][a-z0-9-]{0,15}$', part['name']) or part['fs'] not in ('xfs', 'ext4', 'linux-swap', 'lvm'):
            raise SetupError('unsafe partition')
        fs = 'xfs' if part['fs'] == 'lvm' else part['fs']
        out.append('parted -s %s mkpart %s %s %dMiB %dMiB' % (q(dev), q(part['name']), fs, part['startMiB'], part['endMiB']))
        if part['fs'] == 'lvm':
            out.append('parted -s %s set %d lvm on' % (q(dev), a['partitions'].index(part) + 1))
    out.append('udevadm settle')
    return '\n'.join(out)


def script_format(a):
    dev = a['device']
    if not re.match(r'^/dev/(?:sd|vd)[b-z][0-9]{1,2}$', dev):
        raise SetupError('unsafe device')
    label = ' -L %s' % q(a['label']) if a.get('label') else ''
    cmd = {'xfs': 'mkfs.xfs -f%s %s', 'ext4': 'mkfs.ext4 -q -F%s %s', 'swap': 'mkswap%s %s'}[a['type']]
    return (cmd % (label, q(dev))) + ' >/dev/null'


def script_append_line(a):
    if a['path'] not in ('/etc/fstab', '/etc/exports', '/etc/hosts') or not re.match(r'^[A-Za-z0-9 _./:,@=()*+-]{1,160}$', a['line']):
        raise SetupError('unsafe line')
    return 'grep -qxF -- %s %s || echo %s >> %s' % (q(a['line']), a['path'], q(a['line']), a['path'])


def script_mount_all(a):
    return 'systemctl daemon-reload\nmount -a\nswapon -a'


def script_lvm_build(a):
    vg = a['vg']
    if not re.match(r'^[a-z][a-z0-9_]{0,15}$', vg):
        raise SetupError('unsafe volume group name')
    pvs = ' '.join(q(x) for x in a['pvs'] if re.match(r'^/dev/(?:sd|vd)[b-z][0-9]{1,2}$', x))
    out = ['pvcreate -ff -y %s >/dev/null' % pvs, 'vgcreate %s %s >/dev/null' % (q(vg), pvs)]
    for v in a['volumes']:
        if not re.match(r'^[a-z][a-z0-9_]{0,15}$', v['name']) or not re.match(r'^(?:[0-9]{1,5}[MG]|[0-9]{1,3}%FREE)$', v['size']):
            raise SetupError('unsafe volume')
        size = ('-l ' if '%' in v['size'] else '-L ') + q(v['size'])
        dev = '/dev/%s/%s' % (vg, v['name'])
        out.append('lvcreate -y -n %s %s %s >/dev/null' % (q(v['name']), size, q(vg)))
        label = ' -L %s' % q(v['label']) if v.get('label') else ''
        if v['fs'] == 'xfs':
            out.append('mkfs.xfs -f%s %s >/dev/null' % (label, q(dev)))
        elif v['fs'] == 'ext4':
            out.append('mkfs.ext4 -q -F%s %s' % (label, q(dev)))
        else:
            out.append('mkswap %s >/dev/null' % q(dev))
        if v.get('mount'):
            out.append('mkdir -p %s && mount %s %s' % (q(safe_path(v['mount'])), q(dev), q(v['mount'])))
        if v['fs'] == 'swap':
            out.append('swapon %s' % q(dev))
    out.append('udevadm settle')
    return '\n'.join(out)


def script_unmount(a):
    return 'umount -l %s 2>/dev/null || true' % q(safe_path(a['path']))


def script_acl(a):
    path = q(safe_path(a['path']))
    out = []
    for entry in a['entries']:
        if not re.match(r'^(?:d:)?[ug]:[a-z_][a-z0-9_-]*:[rwxX-]{1,3}$', entry):
            raise SetupError('unsafe ACL entry')
        out.append('setfacl %s-m %s %s' % ('-d ' if entry.startswith('d:') else '', q(entry[2:] if entry.startswith('d:') else entry), path))
    return '\n'.join(out)


def script_run_as(a):
    user = q(name(a['user']))
    image = q(a['image'])
    verb = {'podman-pull': 'podman pull', 'podman-rmi': 'podman rmi -f'}[a['tool']]
    run = 'runuser -l %s -c %s >/dev/null 2>&1' % (user, q('%s %s' % (verb, image)))
    return run if a['tool'] != 'podman-pull' else '%s || { sleep 5; %s; }' % (run, run)


HOST_SCRIPTS = {
    'package': script_package, 'service': script_service, 'group': script_group, 'user': script_user, 'directory': script_directory,
    'file': script_file, 'remove-lines': script_remove_lines, 'firewall': script_firewall, 'selinux': script_selinux,
    'wipe-disk': script_wipe_disk, 'systemd': script_systemd, 'linger': script_linger, 'container-reset': script_container_reset,
    'run-as': script_run_as, 'restore-skel': script_restore_skel, 'boot': script_boot, 'timezone': script_timezone,
    'nm-connection': script_nm_connection, 'hostname': script_hostname, 'http-server': script_http_server, 'dnf-module': script_dnf_module, 'crontab': script_crontab,
    'partition-disk': script_partition_disk, 'format': script_format, 'append-line': script_append_line, 'mount-all': script_mount_all,
    'lvm-build': script_lvm_build, 'unmount': script_unmount, 'acl': script_acl,
}


def run_on_host(host, script, tolerant):
    full = 'set +e\n%s\n' % script if tolerant else 'set -e\n%s\n' % script
    target = 'root@%s.lab.example.com' % host
    try:
        done = subprocess.run([*SSH, target, 'bash -s'], input=full, text=True, capture_output=True, timeout=600)
    except subprocess.TimeoutExpired:
        raise SetupError('%s: timed out' % host)
    if done.returncode != 0 and not tolerant:
        raise SetupError('%s: %s' % (host, (done.stderr or done.stdout).strip()[:300] or 'a setup step failed'))
    return done.returncode == 0


def host_action(a, ctx):
    build = HOST_SCRIPTS[a['action']]
    script = build(a)
    for host in a['hosts']:
        if not re.match(r'^server[a-d]$', host):
            raise SetupError('unknown host ' + host)
        ok = run_on_host(host, script, ctx.tolerant)
        label = a['action'] + (' ' + a.get('name', a.get('path', '')) if a.get('name') or a.get('path') else '')
        say('%s: %s%s' % (host, label.strip(), '' if ok else ' (skipped: nothing to undo)'))


# ---------------------------------------------------------------------------------------
# Actions on workstation outside the project folder: only the learner's own home, with a deny list.

HOME_PATH = re.compile(r'^[A-Za-z0-9_.-][A-Za-z0-9_. -]*(?:/[A-Za-z0-9_.-][A-Za-z0-9_. -]*)*$')
HOME_DENIED = {'.ssh', '.ssh/authorized_keys', '.ssh/known_hosts', '.ssh/config', '.bashrc', '.bash_profile', '.bash_logout', '.profile',
               '.ssh/id_rsa', '.ssh/id_rsa.pub', '.ssh/id_ed25519', '.ssh/id_ed25519.pub', '.ssh/id_ecdsa', '.ssh/id_ecdsa.pub', '.ssh/id_dsa', '.ssh/id_dsa.pub'}


def home_dir():
    return Path(os.environ.get('LAB_HOME') or Path.home())


def home_remove(a, ctx):
    for relative in a['paths']:
        clean = relative.rstrip('/')
        if not HOME_PATH.match(clean) or '..' in clean.split('/') or clean in HOME_DENIED or clean.startswith('lab-archive'):
            raise SetupError('this version of lab will not remove ~/' + relative)
        target = home_dir() / clean
        if target.is_dir() and not target.is_symlink():
            shutil.rmtree(target, ignore_errors=True)
        elif target.exists() or target.is_symlink():
            target.unlink()
    say('removed ' + ', '.join('~/' + p for p in a['paths']))


def ssh_config_block(a, ctx):
    path = home_dir() / '.ssh' / 'config'
    if not path.exists():
        return
    kept, skipping = [], False
    for line in path.read_text().splitlines():
        words = line.split()
        if words[:1] and words[0].lower() == 'host':
            skipping = a['host'] in words[1:]
        if not skipping:
            kept.append(line)
    path.write_text('\n'.join(kept).rstrip('\n') + '\n' if kept else '')
    say('removed the ssh alias ' + a['host'])


def ssh_identity(a, ctx):
    key = home_dir() / '.ssh' / a['name']
    (home_dir() / '.ssh').mkdir(mode=0o700, exist_ok=True)
    for old in (key, Path(str(key) + '.pub')):
        old.unlink(missing_ok=True)
    tool(['ssh-keygen', '-q', '-t', 'ed25519', '-N', '', '-C', 'student@workstation (%s)' % a['user'], '-f', str(key)])
    public = Path(str(key) + '.pub').read_text().strip()
    user = name(a['user'])
    script = ('install -d -m 700 -o %(u)s -g %(u)s ~%(u)s/.ssh\necho %(k)s >> ~%(u)s/.ssh/authorized_keys\n'
              'chown %(u)s:%(u)s ~%(u)s/.ssh/authorized_keys; chmod 600 ~%(u)s/.ssh/authorized_keys') % {'u': user, 'k': q(public)}
    for host in a['hosts']:
        run_on_host(host, script, False)
    say('created ~/.ssh/%s and installed it for %s on %s' % (a['name'], user, ', '.join(a['hosts'])))


ACTIONS = {
    'self-signed-cert': self_signed_cert, 'htpasswd': htpasswd, 'password-hash-var': password_hash_var, 'vault-encrypt': vault_encrypt,
    'pack-installed-collection': pack_installed_collection, 'build-collection': build_collection,
    'collection-requirements': collection_requirements, 'git-seed-remote': git_seed_remote, 'ssh-keypairs': ssh_keypairs,
}
ACTIONS.update({'home-remove': home_remove, 'ssh-config-block': ssh_config_block, 'ssh-identity': ssh_identity})
ACTIONS.update({kind: host_action for kind in HOST_SCRIPTS})
CONTROL_ACTIONS = set(ACTIONS) - set(HOST_SCRIPTS) - {'home-remove', 'ssh-config-block', 'ssh-identity'}


class Context:
    def __init__(self, name, project, base, tolerant=False):
        self.name, self.project, self.base, self.tolerant = name, project, base, tolerant


def prepare(name, project, base, catalog):
    exercise = catalog['exercises'][name]
    ctx = Context(name, project, base)
    for action in exercise.get('setup', []):
        handler = ACTIONS.get(action.get('action'))
        if handler is None:
            raise SetupError('this version of lab does not know the setup action %r; run: lab update' % action.get('action'))
        handler(action, ctx)


def finish(name, project, base, catalog):
    """Undo what the exercise did on the servers. Best effort: every action runs."""
    exercise = catalog['exercises'][name]
    ctx = Context(name, project, base, tolerant=True)
    count = 0
    for action in exercise.get('finish', []):
        handler = ACTIONS.get(action.get('action'))
        if handler is None or action.get('action') in CONTROL_ACTIONS:
            say('skipped an action this version of lab does not know (run: lab update)')
            continue
        try:
            handler(action, ctx)
        except SetupError as error:
            say('could not run %s: %s' % (action['action'], error))
        count += 1
    return count


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('name')
    parser.add_argument('--project', type=Path, required=True)
    parser.add_argument('--catalog', type=Path, required=True)
    parser.add_argument('--base', required=True)
    parser.add_argument('--finish', action='store_true', help='run the cleanup actions instead of the setup')
    args = parser.parse_args()
    try:
        catalog = json.loads(args.catalog.read_text())
        if catalog['version'] != CATALOG_VERSION or args.name not in catalog['exercises']:
            raise SetupError('unknown exercise or unsupported catalog; run: lab update')
        if args.finish:
            finish(args.name, args.project, args.base, catalog)
        else:
            prepare(args.name, args.project, args.base, catalog)
    except (SetupError, OSError, ValueError, KeyError) as error:
        print('xx ' + str(error), file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
