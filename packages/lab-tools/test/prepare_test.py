"""Setup actions create what the old per-exercise scripts created, using only the platform's own code."""
import json
import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

from support import catalog, lab_tree
import prepare

CATALOG = catalog()


def run_exercise(name, project, home):
    os.environ['LAB_HOME'] = str(home)
    prepare.prepare(name, project, lab_tree().as_uri(), CATALOG)


class ActionTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.project = self.root / 'project'
        self.project.mkdir()
        self.addCleanup(self.temp.cleanup)
        self.addCleanup(os.environ.pop, 'LAB_HOME', None)

    @unittest.skipUnless(shutil.which('openssl'), 'openssl is not installed')
    def test_htpasswd(self):
        (self.project / 'files').mkdir()
        run_exercise('data-review', self.project, self.root)
        line = (self.project / 'files/htpasswd').read_text()
        self.assertRegex(line, r'^guest:\$apr1\$')

    @unittest.skipUnless(shutil.which('openssl'), 'openssl is not installed')
    def test_self_signed_certificate_names_the_host(self):
        run_exercise('control-review', self.project, self.root)
        self.assertEqual(((self.project / 'server.key').stat().st_mode & 0o777), 0o600)
        text = subprocess.run(['openssl', 'x509', '-in', str(self.project / 'server.crt'), '-noout', '-text'], capture_output=True, text=True).stdout
        self.assertIn('DNS:serverb.lab.example.com', text)
        self.assertIn('DNS:serverb', text)

    @unittest.skipUnless(shutil.which('ssh-keygen'), 'ssh-keygen is not installed')
    def test_ssh_keypairs(self):
        run_exercise('system-users', self.project, self.root)
        for n in range(1, 6):
            self.assertTrue((self.project / f'files/user{n}.key').is_file())
            self.assertTrue((self.project / f'files/user{n}.key.pub').is_file())

    @unittest.skipUnless(shutil.which('git'), 'git is not installed')
    def test_git_history_matches_the_old_hooks(self):
        run_exercise('workflow-git', self.project, self.root)
        bare = self.root / 'git-repos/ops/web-motd.git'
        log = subprocess.run(['git', '-C', str(bare), 'log', '--format=%s|%an', 'main'], capture_output=True, text=True).stdout.splitlines()
        self.assertEqual(log, ['Warn that the MOTD is managed|Operations team', 'Add the MOTD project|Operations team'])
        motd = subprocess.run(['git', '-C', str(bare), 'show', 'main:templates/motd.j2'], capture_output=True, text=True).stdout
        self.assertIn('managed by Ansible', motd)

    @unittest.skipUnless(shutil.which('git'), 'git is not installed')
    def test_git_tags_and_branches(self):
        # role-review also packs an installed collection, which a development machine does not have.
        action = next(a for a in CATALOG['exercises']['role-review']['setup'] if a['action'] == 'git-seed-remote')
        ctx = prepare.Context('role-review', self.project, lab_tree().as_uri())
        os.environ['LAB_HOME'] = str(self.root)
        prepare.git_seed_remote(action, ctx)
        tags = subprocess.run(['git', '-C', str(self.root / 'git-repos/infra/apache.git'), 'tag'], capture_output=True, text=True).stdout.split()
        self.assertEqual(sorted(tags), ['v1.3', 'v1.4'])
        action = CATALOG['exercises']['role-galaxy']['setup'][0]
        prepare.git_seed_remote(action, prepare.Context('role-galaxy', self.project, lab_tree().as_uri()))
        branches = subprocess.run(['git', '-C', str(self.root / 'git-repos/student/bash_env.git'), 'branch', '--format=%(refname:short)'],
                                  capture_output=True, text=True).stdout.split()
        self.assertEqual(sorted(branches), ['dev', 'main'])

    def test_password_hash_variable(self):
        if not shutil.which('openssl'):
            self.skipTest('openssl is not installed')
        action = {'action': 'password-hash-var', 'path': 'v.yml', 'variable': 'pwhash', 'password': 'redhat', 'salt': 'reviewsalt'}
        prepare.password_hash_var(action, prepare.Context('x', self.project, ''))
        self.assertEqual((self.project / 'v.yml').read_text().splitlines()[0], '---')
        self.assertRegex((self.project / 'v.yml').read_text(), r'pwhash: \$6\$reviewsalt\$')
        commented = {**action, 'path': 'c.yml', 'commented': True, 'before': ['#username: x']}
        prepare.password_hash_var(commented, prepare.Context('x', self.project, ''))
        lines = (self.project / 'c.yml').read_text().splitlines()
        self.assertEqual(lines[0], '#username: x')
        self.assertTrue(lines[1].startswith('#pwhash: $6$'))

    def test_collection_requirements_lists_archives_by_absolute_path(self):
        (self.project / 'redhat-rhel_system_roles-1.2.3.tar.gz').write_text('x')
        (self.project / 'community-general-9.5.13.tar.gz').write_text('x')
        action = {'action': 'collection-requirements', 'path': 'requirements.yml', 'archives': ['redhat-rhel_system_roles-', 'community-general-']}
        prepare.collection_requirements(action, prepare.Context('x', self.project, ''))
        text = (self.project / 'requirements.yml').read_text()
        self.assertIn(f'- name: {self.project}/redhat-rhel_system_roles-1.2.3.tar.gz', text)
        self.assertLess(text.index('redhat'), text.index('community'))

    def test_paths_cannot_leave_the_project(self):
        with self.assertRaises(prepare.SetupError):
            prepare.htpasswd({'path': '../escape', 'user': 'a', 'password': 'b'}, prepare.Context('x', self.project, ''))
        with self.assertRaises(prepare.SetupError):
            prepare.fetch('file:///tmp', '../etc/passwd')

    def test_an_unknown_action_asks_for_an_update(self):
        catalog_with_new_action = {'exercises': {'demo': {'setup': [{'action': 'from-the-future'}]}}}
        with self.assertRaisesRegex(prepare.SetupError, 'lab update'):
            prepare.prepare('demo', self.project, '', catalog_with_new_action)

    def test_published_names_match_the_compiler(self):
        """prepare.py finds tree files under the names the compiler publishes them as."""
        self.assertEqual(prepare.published('trees/a/.gitignore'), 'trees/a/_.gitignore.lab')
        for manifest in lab_tree().glob('*/MANIFEST'):
            for line in manifest.read_text().splitlines():
                line = line.split('#')[0].strip()
                if line and not line.startswith('@'):
                    dest, _, src = line.partition('=')
                    self.assertEqual(prepare.published(dest), src, manifest.parent.name)

    def test_every_action_in_the_catalog_is_implemented(self):
        for name, exercise in CATALOG['exercises'].items():
            for action in exercise.get('setup', []):
                self.assertIn(action['action'], prepare.ACTIONS, name)


if __name__ == '__main__':
    unittest.main()


class HostActionTests(unittest.TestCase):
    """Server actions build fixed scripts from validated values; nothing from the catalog runs as a command."""

    def script(self, **action):
        return prepare.HOST_SCRIPTS[action['action']](action)

    def test_values_are_quoted(self):
        text = self.script(action='package', hosts=['servera'], names=['httpd', 'tree'])
        self.assertIn("dnf install -y -q httpd tree", text)
        text = self.script(action='file', hosts=['servera'], path='/srv/web/a b.txt', content='x; rm -rf /\n')
        self.assertIn("'/srv/web/a b.txt'", text)
        self.assertNotIn('x; rm -rf /', text)  # the content travels base64 encoded

    def test_paths_outside_the_allowed_places_are_refused(self):
        for path in ('/etc/passwd', '/etc/shadow', '/usr/bin/ls', '/boot/vmlinuz', '/srv/../etc/passwd', '/var/lib/rpm'):
            with self.assertRaises(prepare.SetupError, msg=path):
                self.script(action='directory', hosts=['servera'], path=path, state='absent')

    def test_whole_top_directories_and_home_directories_are_not_removed(self):
        for path in ('/srv', '/home', '/home/student', '/opt', '/mnt', '/var/log'):
            with self.assertRaises(prepare.SetupError, msg=path):
                self.script(action='directory', hosts=['servera'], path=path, state='absent')
        self.assertIn('rm -rf', self.script(action='directory', hosts=['servera'], path='/srv/web', state='absent'))

    def test_line_removal_is_limited_to_a_few_files(self):
        with self.assertRaises(prepare.SetupError):
            self.script(action='remove-lines', hosts=['servera'], path='/etc/passwd', matching='x')
        self.assertIn('/etc/fstab', self.script(action='remove-lines', hosts=['servera'], path='/etc/fstab', matching='^/dev/sdb1'))

    def test_account_names_must_be_plain(self):
        with self.assertRaises(prepare.SetupError):
            self.script(action='user', hosts=['servera'], name='bob; reboot', state='absent')

    def test_firewall_resolves_a_server_name_for_sources(self):
        text = self.script(action='firewall', hosts=['servera'], zone='portal', source='@serverb', state='present')
        self.assertIn('getent ahostsv4 serverb.lab.example.com', text)

    def test_wipe_disk_only_touches_spare_disks(self):
        self.assertIn('/dev/sdb', self.script(action='wipe-disk', hosts=['servera'], device='/dev/sdb'))

    def test_every_published_exercise_builds_its_setup_and_cleanup(self):
        for name, exercise in CATALOG['exercises'].items():
            for key in ('setup', 'finish'):
                for action in exercise.get(key, []):
                    if action['action'] in prepare.HOST_SCRIPTS:
                        self.assertTrue(self.script(**action), '%s %s %s' % (name, key, action['action']))
                    else:
                        self.assertIn(action['action'], prepare.ACTIONS, name)

    def test_finish_runs_only_cleanup_actions(self):
        calls = []
        original = prepare.run_on_host
        prepare.run_on_host = lambda host, script, tolerant: calls.append((host, tolerant)) or True
        try:
            catalog = {'exercises': {'x': {'finish': [{'action': 'package', 'hosts': ['servera', 'serverb'], 'names': ['tree'], 'state': 'absent'}]}}}
            self.assertEqual(prepare.finish('x', Path('.'), 'file:///nowhere', catalog), 1)
        finally:
            prepare.run_on_host = original
        self.assertEqual(calls, [('servera', True), ('serverb', True)])
