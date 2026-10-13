---
title: Troubleshooting managed hosts
seoTitle: "Troubleshoot Ansible SSH and Managed Host Problems"
description: "Fix unreachable hosts, SSH and become problems, and test managed hosts with ad hoc commands. Free RHCE (EX294) lesson with diagrams and practice."
kind: lesson
minutes: 12
---

{% lead %}
Some problems are not in the playbook at all. The playbook is fine, but Ansible cannot reach a host, logs in as the wrong user, or cannot become root. Others are about the host's state: is the service really configured the way the playbook claims? Ansible's own tools answer both kinds of question quickly and safely.
{% /lead %}

{% objectives %}
- Test connections with the `ping` module and find out why a host is unreachable.
- Inspect the variables that decide how Ansible connects to a host.
- Tell a connection problem from a privilege escalation problem.
- Use ad hoc commands, facts, check mode and diffs to test a host's state before and after a change.
{% /objectives %}

## Is the host reachable?

`ansible.builtin.ping` is not ICMP ping. It connects exactly as a playbook would (SSH, the remote user, Python on the host) and replies `pong`. If it works, the connection side is fine.

```console
[student@workstation project]$ ansible all -m ansible.builtin.ping
servera.lab.example.com | SUCCESS => {
    "changed": false,
    "ping": "pong"
}
serverb.lab.example.com | UNREACHABLE! => {
    "changed": false,
    "msg": "Failed to connect to the host via ssh: ssh: connect to host 172.25.250.211 port 22: No route to host",
    "unreachable": true
}
```

The text after `ssh:` is the answer. The three you will meet most often:

| Message | Meaning | Look at |
| --- | --- | --- |
| `Could not resolve hostname` | The name is unknown | The name in the inventory; DNS or `/etc/hosts` |
| `No route to host`, `Connection timed out`, `Connection refused` | Nothing answers SSH at that address and port | `ansible_host` and `ansible_port`; is the machine up; its firewall |
| `Permission denied (publickey,…)` | SSH answered but refused the user | `remote_user`, `ansible_user`; is the key installed for that user |

## What does Ansible think it should connect to?

Connection settings can come from several places: `ansible.cfg`, the inventory file, `host_vars`, `group_vars`, the play. Ask Ansible what it ended up with for one host:

```console
[student@workstation project]$ ansible-navigator inventory -m stdout --host serverb.lab.example.com
{
    "ansible_host": "172.25.250.211"
}
```

| Variable | Overrides |
| --- | --- |
| `ansible_host` | The address or name to connect to, instead of the inventory name |
| `ansible_port` | The SSH port (default 22) |
| `ansible_user` | The user to log in as, instead of `remote_user` |
| `ansible_become` | Whether to use privilege escalation for this host |

To see exactly what Ansible runs, add `-vvv`. The connection lines show the user and the full `ssh` command:

```text
<serverc.lab.example.com> ESTABLISH SSH CONNECTION FOR USER: operator1
<serverc.lab.example.com> SSH: EXEC ssh -C -o ControlMaster=auto … -o 'User="operator1"' -o ConnectTimeout=10 … serverc.lab.example.com …
```

Then run the same `ssh` by hand. If it fails outside Ansible too, the problem is SSH, not Ansible.

## Connected, but not allowed

A host that is reachable can still fail every task that needs root. That is a `FAILED`, not an `UNREACHABLE`:

| Message | Cause |
| --- | --- |
| `Missing sudo password` | `become` is on, and the user needs a password for sudo |
| `Destination /etc not writable`, `Permission denied` | `become` is off, and the task writes something only root can |
| `user is not in the sudoers file` | The user has no sudo rights on that host |

Test privilege escalation by itself with an ad hoc command:

```console
[student@workstation project]$ ansible servera.lab.example.com -m ansible.builtin.command -a id --become
servera.lab.example.com | CHANGED | rc=0 >>
uid=0(root) gid=0(root) groups=0(root) context=unconfined_u:unconfined_r:unconfined_t:s0-s0:c0.c1023
```

## Python on the managed host

Modules are Python programs that run on the managed host. Ansible looks for an interpreter the first time it runs a module there, and if it finds none, the very first task fails:

```text
fatal: [host]: FAILED! => {"ansible_facts": {}, "changed": false, "failed_modules": {"ansible.legacy.setup": {...
"module_stdout": "/bin/sh: 1: /usr/bin/python: not found\r\n", "msg": "The module failed to execute correctly, you probably need to set the interpreter...",
"warnings": ["No python interpreters found for host host (tried ['python3.10', 'python3.9', ...
```

Install Python on that host (with the `raw` module, which needs no Python), or point Ansible at an interpreter with the `ansible_python_interpreter` variable.

## Testing with ad hoc commands

{% reveal title="Read the supporting details" %}

An ad hoc command is the fastest way to test one thing on one host, outside any playbook:

```console
[student@workstation project]$ ansible servera.lab.example.com -m ansible.builtin.ping
servera.lab.example.com | SUCCESS => {
    "ansible_facts": {
        "discovered_interpreter_python": "/usr/bin/python3"
    },
    "changed": false,
    "ping": "pong"
}
[student@workstation project]$ ansible servera.lab.example.com -m ansible.builtin.ping --become
...output omitted...
[student@workstation project]$ ansible servera.lab.example.com -m ansible.builtin.command -a 'df -h'
[student@workstation project]$ ansible servera.lab.example.com -m ansible.builtin.command -a 'free -m'
```

`ping` proves the connection and Python; with `--become` it also proves privilege escalation, and a host without passwordless sudo answers `"module_stderr": "sudo: a password is required\n"`. `df` and `free` answer the two classic questions: is a file system full, is the host out of memory?

Ad hoc commands run with the `ansible-core` installed on the control node itself, not in an execution environment, so only the collections installed there are available. Without `-m`, `ansible` runs the `command` module; name it anyway, so the command says what it does.

When `ansible` works but `ansible-navigator run` does not, the connection is fine: look at the playbook and the inventory it uses.

{% /reveal %}

## Testing a host's state with Ansible

You rarely need to log in to a managed host to check something. Ad hoc commands answer most questions from the control node, for many hosts at once:

```console
[student@workstation project]$ ansible web -m ansible.builtin.command -a 'systemctl is-active httpd'
[student@workstation project]$ ansible web -m ansible.builtin.stat -a 'path=/etc/motd'
[student@workstation project]$ ansible servera.lab.example.com -m ansible.builtin.setup -a 'filter=ansible_default_ipv4'
[student@workstation project]$ ansible localhost -m ansible.builtin.uri -a 'url=http://servera.lab.example.com'
```

Modules such as `uri`, `stat`, `script` and `assert` make these checks part of a playbook, so they run every time rather than when you remember:

```yaml
- name: The API returns a version
  ansible.builtin.uri:
    url: http://api.myapp.example.com
    return_content: true
  register: apiresponse

- name: Fail if it did not
  ansible.builtin.fail:
    msg: 'version was not provided'
  when: "'version' not in apiresponse.content"

- name: There is enough free memory
  ansible.builtin.script: scripts/check_free_memory --min 2G

- name: Check if /var/run/app.lock exists
  ansible.builtin.stat:
    path: /var/run/app.lock
  register: lock

- name: Stop if the application is running
  ansible.builtin.assert:
    that:
      - not lock['stat']['exists']
    fail_msg: The application is still running
```

`script` copies a script from the project to the host, runs it there, and fails if it exits with a non-zero code. `stat` never fails when a file is missing: it reports `exists: false`, which you then test. `assert` fails the task when any condition in `that` is false, with `fail_msg` (and `success_msg`) to say why.

{% callout type="note" title="Commands for checks, modules for changes" %}
`command` is fine for looking. For changing a host, use the module made for the job: it knows how to be idempotent, and check mode can preview it.
{% /callout %}

## Change safely: check, diff, limit

Before changing a production host, preview the change on one machine:

```console
[student@workstation project]$ ansible-navigator run -m stdout motd.yml --check --diff --limit servera.lab.example.com
...output omitted...
--- before: /etc/motd
+++ after: /home/student/.ansible/tmp/…/motd.j2
@@ -0,0 +1,2 @@
+This is servera.lab.example.com.
+Contact: ops@example.com
```

### Check mode, task by task

Not every module can predict its result; those that cannot do nothing in check mode, and say so. A task that depends on an earlier one can also fail in check mode, because the earlier change was only predicted: a service cannot be started if its package was never really installed.

The `check_mode` keyword overrides the run for one task:

```yaml
- name: Always runs, even with --check
  ansible.builtin.command: uname -a
  register: kernel
  check_mode: false

- name: Never changes anything, even without --check
  ansible.builtin.lineinfile:
    path: /etc/motd
    line: Maintenance tonight
  check_mode: true
```

`check_mode: false` is useful for tasks that only gather information the rest of the play needs. Inside a play, the variable `ansible_check_mode` is `true` during a check run, for tasks that should behave differently. Older playbooks spell `check_mode: false` as `always_run: true`, which no longer works.

{% callout type="warning" title="--check is only as safe as the playbook" %}
Tasks with `check_mode: false` run for real during `--check`. Read a playbook before trusting a check run not to change anything.
{% /callout %}

{% callout type="warning" title="Check mode does not test permissions" %}
In check mode, a `template` task writing `/etc/motd` without privilege escalation still reports `changed`: nothing is written, so nothing is refused. Only the real run fails with `Destination /etc not writable`. A clean check run is not proof that the real run will succeed.
{% /callout %}

{% quiz
  objectives=["ch09.host-errors"]
  id="check"
  title="Check your understanding"
  ref="check" /%}

## Takeaway

Test connections with the `ping` module and find out why a host is unreachable. Use the chapter lab to check this on a real host.
