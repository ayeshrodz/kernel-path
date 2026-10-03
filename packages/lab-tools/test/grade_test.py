"""Exercise every check against passing, broken and unavailable host responses, and check the scripts it builds."""
import base64
import json
import os
import re
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

from support import ROOT, catalog, lab_tree
import grade

CATALOG = catalog()


def all_checks():
    for name, exercise in CATALOG['exercises'].items():
        for cp_id, cp in exercise['checkpoints'].items():
            for check in cp.get('checks', []):
                yield name, cp_id, cp, check


class CatalogTests(unittest.TestCase):
    def test_every_exercise_has_a_manifest_and_a_final_checkpoint(self):
        tree = lab_tree()
        names = {p.parent.name for p in tree.glob('*/MANIFEST')}
        self.assertEqual(names, set(CATALOG['exercises']))
        for name, exercise in CATALOG['exercises'].items():
            self.assertTrue(exercise['lesson'].startswith('#/ch'))
            self.assertIn('final', exercise['checkpoints'])

    def test_checks_are_unique_and_host_checks_name_their_hosts(self):
        for name, exercise in CATALOG['exercises'].items():
            for cp_id, cp in exercise['checkpoints'].items():
                ids = [c['id'] for c in cp.get('checks', [])]
                self.assertEqual(len(ids), len(set(ids)), (name, cp_id))
                for check in cp.get('checks', []):
                    if check['on'] != 'control':
                        self.assertTrue(check['targets'], (name, check['id']))

    def test_every_host_script_is_valid_bash_and_read_only(self):
        forbidden = re.compile(r'(?<![\w./-])(reboot|rm|touch|mkdir|chmod|chown|usermod|useradd|mount|umount|mkfs|lvcreate|dnf|yum|sed -i|tee)\b|'
                               r'systemctl (restart|stop|start|enable|disable)|firewall-cmd --add|>\s*/(?!dev/null)')
        for name, cp_id, _, check in all_checks():
            if check['on'] == 'control':
                continue
            script = grade.host_script(check)
            unquoted = re.sub(r"'[^']*'", "''", script)  # values inside quotes are data, not commands
            self.assertIsNone(forbidden.search(unquoted), (name, check['id'], script))
            self.assertEqual(subprocess.run(['bash', '-n'], input=script, text=True, capture_output=True).returncode, 0, script)


class ScriptTests(unittest.TestCase):
    """Run generated file conditions for real, in a temporary directory."""

    def run_script(self, check, host='servera.lab.example.com'):
        return subprocess.run(['bash', '-c', grade.host_script(check)], env={**os.environ, 'H': host, 'HS': host.split('.')[0]}).returncode

    def test_file_conditions(self):
        with tempfile.TemporaryDirectory() as temp:
            f = Path(temp) / 'motd'
            f.write_text('Welcome to servera\nServerTokens Prod\n')
            f.chmod(0o644)
            base = {'kind': 'file', 'paths': [str(f)]}
            ok = [{'nonEmpty': True}, {'contains': ['{hostShort}']}, {'lacks': ['{{']}, {'line': 'ServerTokens Prod'}, {'lines': ['ServerTokens Prod']},
                  {'matches': '^Welcome to'}, {'mode': '0644'}, {'exists': True}]
            bad = [{'contains': ['serverz']}, {'lacks': ['servera']}, {'line': 'ServerTokens'}, {'matches': '^Goodbye'}, {'mode': '0600'},
                   {'exists': False}, {'symlinkTo': '/etc/issue'}]
            for extra in ok:
                self.assertEqual(self.run_script({**base, **extra}), 0, extra)
            for extra in bad:
                self.assertNotEqual(self.run_script({**base, **extra}), 0, extra)
            self.assertEqual(self.run_script({'kind': 'file', 'paths': [str(Path(temp) / 'missing'), str(f)], 'nonEmpty': True}), 0, 'any listed path may satisfy')
            self.assertEqual(self.run_script({'kind': 'file', 'paths': [str(Path(temp) / 'missing')], 'exists': False}), 0)
            link = Path(temp) / 'issue.net'
            link.symlink_to('/etc/issue')
            self.assertEqual(self.run_script({'kind': 'file', 'paths': [str(link)], 'symlinkTo': '/etc/issue'}), 0)

    def test_link_and_type_conditions_on_hosts_and_the_control_node(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / 'dir').mkdir()
            original = root / 'dir' / 'original.txt'
            original.write_text('data\n')
            hard = root / 'hard.txt'
            os.link(original, hard)
            (root / 'relative').symlink_to('dir')
            (root / 'other.txt').write_text('data\n')
            cases = [
                ({'paths': ['hard.txt'], 'fileType': 'regular', 'hardLinks': 2, 'sameFileAs': 'dir/original.txt'}, True),
                ({'paths': ['other.txt'], 'sameFileAs': 'dir/original.txt'}, False),
                ({'paths': ['other.txt'], 'hardLinks': 2}, False),
                ({'paths': ['relative'], 'fileType': 'symlink', 'resolvesTo': 'dir'}, True),
                ({'paths': ['relative'], 'fileType': 'directory'}, False),
                ({'paths': ['dir'], 'fileType': 'directory'}, True),
                ({'paths': ['dir'], 'resolvesTo': 'other.txt'}, False),
            ]
            for check, expected in cases:
                self.assertEqual(grade.control_file({'kind': 'file', **check}, root), expected, check)
                host = {**check, 'paths': [str(root / check['paths'][0])]}
                for key in ('sameFileAs', 'resolvesTo'):
                    if key in host:
                        host[key] = str(root / host[key])
                self.assertEqual(self.run_script({'kind': 'file', **host}) == 0, expected, host)

    def test_host_facts_checks_against_this_machine(self):
        """Kinds that only read system facts agree with what this machine reports."""
        import getpass, socket
        short = socket.gethostname().split('.')[0]
        who = getpass.getuser()
        root_mount = subprocess.run(['findmnt', '-rn', '-M', '/', '-o', 'FSTYPE'], capture_output=True, text=True).stdout.strip()
        default_target = subprocess.run(['systemctl', 'get-default'], capture_output=True, text=True).stdout.strip()
        cases = [
            ({'kind': 'user', 'names': ['root'], 'groups': ['root']}, 0),
            ({'kind': 'user', 'names': ['root'], 'groups': ['no-such-group']}, 1),
            ({'kind': 'user', 'names': ['no-such-user-xyz'], 'exists': False}, 0),
            ({'kind': 'user', 'names': [who]}, 0),
            ({'kind': 'mount', 'path': '/', 'fstype': root_mount}, 0),
            ({'kind': 'mount', 'path': '/', 'fstype': 'zfs-not-here'}, 1),
            ({'kind': 'hostname', 'short': short}, 0),
            ({'kind': 'hostname', 'short': short + 'x'}, 1),
            ({'kind': 'address', 'interface': 'lo', 'cidr': '127.0.0.1/8', 'persistent': False}, 0),
            ({'kind': 'address', 'interface': 'lo', 'cidr': '10.9.9.9/8', 'persistent': False}, 1),
            ({'kind': 'boot-target', 'target': default_target}, 0 if default_target else 1),
            ({'kind': 'boot-target', 'target': 'nothing.target'}, 1),
            ({'kind': 'commands', 'names': ['bash', 'ls']}, 0),
            ({'kind': 'commands', 'names': ['bash', 'no-such-cmd-xyz']}, 1),
        ]
        for check, expected in cases:
            self.assertEqual(self.run_script(check) != 0, bool(expected), check)

    def test_http_checks_against_a_local_server(self):
        import threading
        from http.server import BaseHTTPRequestHandler, HTTPServer

        class Handler(BaseHTTPRequestHandler):
            def do_GET(self):
                code, body = (200, b'This is a test page on servera.\n') if self.path == '/' else (404, b'no')
                self.send_response(code)
                self.end_headers()
                self.wfile.write(body)

            def log_message(self, *args):
                pass

        server = HTTPServer(('127.0.0.1', 0), Handler)
        threading.Thread(target=server.serve_forever, daemon=True).start()
        try:
            base = 'http://127.0.0.1:%d/' % server.server_address[1]
            host = 'servera.lab.example.com'
            self.assertEqual(self.run_script({'kind': 'http', 'url': base}, host), 0)
            self.assertEqual(self.run_script({'kind': 'http', 'url': base, 'containsAny': ['no such text', 'test page on {hostShort}']}, host), 0)
            self.assertNotEqual(self.run_script({'kind': 'http', 'url': base, 'containsAny': ['absent']}, host), 0)
            self.assertNotEqual(self.run_script({'kind': 'http', 'url': base + 'missing'}, host), 0, 'an error status fails')
        finally:
            server.shutdown()
            server.server_close()

    def test_hostile_values_stay_inside_quotes(self):
        with tempfile.TemporaryDirectory() as temp:
            marker = Path(temp) / 'pwned'
            hostile = "x'; touch %s; echo '" % marker
            for check in [{'kind': 'file', 'paths': ['/etc/hostname'], 'contains': [hostile]},
                          {'kind': 'service', 'names': ['a.service']},
                          {'kind': 'cron', 'file': 'x', 'matches': hostile},
                          {'kind': 'http', 'url': 'http://localhost/', 'containsAny': [hostile]}]:
                subprocess.run(['bash', '-c', grade.host_script(check)], capture_output=True, env={**os.environ, 'H': 'h', 'HS': 'h'})
            self.assertFalse(marker.exists(), 'a value from the catalog was run as a command')

    def test_unknown_kinds_and_control_characters_are_refused(self):
        with self.assertRaises(grade.CheckError):
            grade.host_script({'kind': 'shell', 'command': 'id'})
        with self.assertRaises(grade.CheckError):
            grade.host_script({'kind': 'file', 'paths': ['/etc/passwd'], 'contains': ['a\nb']})

    def test_raw_command_templates_only_the_host_name(self):
        command = grade.raw_command("grep -qF -- '{{' /etc/motd")
        self.assertEqual(command.count('{{'), 1)
        self.assertIn('{{ inventory_hostname }}', command)
        payload = re.search(r'echo (\S+) \|', command).group(1)
        self.assertIn("'{{'", base64.b64decode(payload).decode())


class GradingTests(unittest.TestCase):
    def test_all_checkpoints_working_broken_and_unreachable(self):
        for name, exercise in CATALOG['exercises'].items():
            for cp_id, cp in exercise['checkpoints'].items():
                with self.subTest(exercise=name, checkpoint=cp_id), tempfile.TemporaryDirectory() as temp:
                    project = Path(temp)
                    checks = cp.get('checks', [])
                    scripts = {raw: c for c in checks if c['on'] != 'control' for raw in [grade.raw_command(grade.host_script(c))]}
                    if exercise.get('transport') == 'ssh':
                        cp = {**cp, 'groups': {}}
                    for file in cp.get('files', []) + [cp.get('inventory', 'inventory')]:
                        p = project / file
                        p.parent.mkdir(parents=True, exist_ok=True)
                        p.write_text('fixture\n')

                    def control_ok(check, _project):
                        return state['control']

                    def runner_for(state_name):
                        def runner(args, cwd):
                            if args[0] == 'ssh':
                                return subprocess.CompletedProcess(args, {'pass': 0, 'broken': 1, 'unreachable': 255}[state_name], '', '')
                            if args[0] == 'ansible-inventory':
                                inventory = {g: {'hosts': hs} for g, hs in cp.get('groups', {}).items()}
                                return subprocess.CompletedProcess(args, 0, json.dumps(inventory), '')
                            tree = Path(args[args.index('--tree') + 1])
                            data = {'unreachable': True} if state_name == 'unreachable' else {'rc': 0 if state_name == 'pass' else 1}
                            check = scripts[args[args.index('-a') + 1]]
                            for host in check['targets']:
                                (tree / host).write_text(json.dumps(data))
                            return subprocess.CompletedProcess(args, 4 if state_name == 'unreachable' else 0 if state_name == 'pass' else 2, '', '')
                        return runner

                    state = {'control': True}
                    original = grade.control_check
                    grade.control_check = control_ok
                    try:
                        report, code = grade.grade(name, cp_id, project, CATALOG, runner_for('pass'))
                        self.assertEqual(code, 0, report)
                        self.assertEqual(report['app'], 'kernel-path-lab')
                        self.assertTrue(all(c['status'] == 'pass' for c in report['checks']))
                        if scripts:
                            _, code = grade.grade(name, cp_id, project, CATALOG, runner_for('broken'))
                            self.assertEqual(code, 1)
                            _, code = grade.grade(name, cp_id, project, CATALOG, runner_for('unreachable'))
                            self.assertEqual(code, 2)
                        if any(c['on'] == 'control' for c in checks):
                            state['control'] = False
                            _, code = grade.grade(name, cp_id, project, CATALOG, runner_for('pass'))
                            self.assertEqual(code, 1)
                        state['control'] = True
                        if cp.get('files'):
                            (project / cp['files'][0]).unlink()
                            _, code = grade.grade(name, cp_id, project, CATALOG, runner_for('pass'))
                            self.assertEqual(code, 1)
                    finally:
                        grade.control_check = original

    def test_a_missing_required_host_fails_instead_of_passing(self):
        cp_check = next(c for _, _, _, c in all_checks() if len(c.get('targets', [])) > 1)
        name, cp_id = next((n, i) for n, i, _, c in all_checks() if c is cp_check)
        with tempfile.TemporaryDirectory() as temp:
            project = Path(temp)
            cp = CATALOG['exercises'][name]['checkpoints'][cp_id]
            for file in cp.get('files', []) + [cp.get('inventory', 'inventory')]:
                (project / file).parent.mkdir(parents=True, exist_ok=True)
                (project / file).write_text('x\n')

            def runner(args, cwd):
                if args[0] == 'ansible-inventory':
                    return subprocess.CompletedProcess(args, 0, json.dumps({g: {'hosts': h} for g, h in cp.get('groups', {}).items()}), '')
                tree = Path(args[args.index('--tree') + 1])
                for host in cp_check['targets'][:1]:
                    (tree / host).write_text(json.dumps({'rc': 0}))
                return subprocess.CompletedProcess(args, 0, '', '')

            original = grade.control_check
            grade.control_check = lambda c, p: True
            try:
                report, code = grade.grade(name, cp_id, project, CATALOG, runner)
            finally:
                grade.control_check = original
            self.assertEqual(code, 1)
            self.assertTrue(any(c['status'] == 'fail' and 'required host was not checked' in c['message'] for c in report['checks']))


class SshTransportTests(unittest.TestCase):
    """Exercises that do not use Ansible reach each host directly as root with the learner's key."""

    def test_the_remote_command_decodes_and_runs_the_check_with_the_host_name(self):
        command = grade.ssh_command('test "$H" = servera.lab.example.com && test "$HS" = servera', 'servera.lab.example.com')
        self.assertEqual(subprocess.run(['bash', '-c', command]).returncode, 0)

    def test_results_follow_the_ssh_exit_status_and_never_need_an_inventory(self):
        exercise = {'version': 1, 'lesson': '#/ch07/lab', 'transport': 'ssh', 'checkpoints': {'final': {'checks': [
            {'id': 'team', 'kind': 'file', 'on': 'servera.lab.example.com', 'targets': ['servera.lab.example.com'],
             'message': 'The team directory exists', 'paths': ['/srv/team']}]}}}
        catalog = {'version': 2, 'exercises': {'demo': exercise}}
        calls = []
        for rc, status, code in [(0, 'pass', 0), (1, 'fail', 1), (255, 'skip', 2)]:
            def runner(args, cwd, rc=rc):
                calls.append(args)
                return subprocess.CompletedProcess(args, rc, '', '')
            with tempfile.TemporaryDirectory() as temp:
                report, exit_code = grade.grade('demo', 'final', Path(temp), catalog, runner)
            self.assertEqual(exit_code, code)
            self.assertEqual([c['status'] for c in report['checks']], [status])
        self.assertTrue(all(a[0] == 'ssh' and 'root@servera.lab.example.com' in a and 'BatchMode=yes' in a for a in calls))


class ControlCheckTests(unittest.TestCase):
    def test_control_file_checks(self):
        with tempfile.TemporaryDirectory() as temp:
            project = Path(temp)
            (project / 'secret.yml').write_text('$ANSIBLE_VAULT;1.1;AES256\n')
            (project / 'vault-pass').write_text('x')
            (project / 'vault-pass').chmod(0o600)
            self.assertTrue(grade.control_check({'kind': 'file', 'on': 'control', 'paths': ['secret.yml'], 'contains': ['$ANSIBLE_VAULT;']}, project))
            self.assertFalse(grade.control_check({'kind': 'file', 'on': 'control', 'paths': ['secret.yml'], 'contains': ['nope']}, project))
            self.assertTrue(grade.control_check({'kind': 'file', 'on': 'control', 'paths': ['vault-pass'], 'mode': '0600'}, project))
            self.assertFalse(grade.control_check({'kind': 'file', 'on': 'control', 'paths': ['vault-pass'], 'mode': '0644'}, project))
            self.assertFalse(grade.control_check({'kind': 'file', 'on': 'control', 'paths': ['missing.yml'], 'nonEmpty': True}, project))
            self.assertTrue(grade.control_check({'kind': 'commands', 'on': 'control', 'names': ['bash']}, project))
            self.assertFalse(grade.control_check({'kind': 'commands', 'on': 'control', 'names': ['no-such-command-xyz']}, project))

    @unittest.skipUnless(shutil.which('git'), 'git is not installed')
    def test_git_checks(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            remote = root / 'git-repos/ops/web-motd.git'
            work = root / 'work'
            run = lambda *a, cwd=None: subprocess.run(['git', *a], cwd=cwd, check=True, capture_output=True)
            run('init', '-q', '--bare', '-b', 'main', str(remote))
            run('clone', '-q', str(remote), str(work))
            run('config', 'user.name', 'T', cwd=work)
            run('config', 'user.email', 't@example.com', cwd=work)
            (work / 'a.txt').write_text('a')
            (work / '.gitignore').write_text('vault-pass\n')
            (work / 'vault-pass').write_text('secret')
            run('add', '-A', cwd=work)
            run('commit', '-q', '-m', 'one', cwd=work)
            run('push', '-q', 'origin', 'HEAD:main', cwd=work)
            check = lambda **kw: grade.control_check({'kind': 'git', 'on': 'control', **kw}, work)
            self.assertTrue(check(remoteEndsWith='git-repos/ops/web-motd.git', clean=True, pushedBranch='main', ignored=['vault-pass'], minCommits=1))
            self.assertFalse(check(minCommits=2))
            self.assertFalse(check(remoteEndsWith='git-repos/ops/other.git'))
            (work / 'b.txt').write_text('b')
            self.assertFalse(check(clean=True), 'an untracked file is not committed')
            run('add', '-A', cwd=work)
            run('commit', '-q', '-m', 'two', cwd=work)
            self.assertFalse(check(pushedBranch='main'), 'a local commit is not pushed')
            self.assertFalse(check(ignored=['a.txt']), 'a tracked file is not ignored')


if __name__ == '__main__':
    unittest.main()
