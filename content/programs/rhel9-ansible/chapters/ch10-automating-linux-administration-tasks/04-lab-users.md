---
title: "Exercise: Managing users and authentication"
seoTitle: "Managing users and authentication (RHCE Practice Exercise)"
description: "Hands-on RHCE practice: managing users and authentication. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 20
---

{% lead %}
The web servers need the same five administrator accounts, all in a `webadmin` group, each with an SSH key, and with sudo rights that need no password. Root must no longer be able to log in over SSH. You will do all of it from one variables file and one play.
{% /lead %}

The project `~/system-users` has an `ansible.cfg`, an `inventory` with servera in `webservers`, the variables file `vars/users_vars.yml`, and one public key per user in `files/`.

{% lab
  objectives=["ch10.users"]
  id="users"
  title="Managing users and authentication"
  exercise="system-users"
  hosts=["workstation","servera.lab.example.com"]
  outcomes=["Create users and a group from a variables file.","Install SSH keys, a sudo rule and an SSH server setting."] %}
{% lab-notes %}

**Prerequisites:** Complete [control-node setup](#/ch01/control-node) and the preceding lessons in this chapter. Run commands as student on workstation unless a step names another machine.

{% reveal title="Verify your work" %}

From the project directory, run the relevant home-lab check. For an exercise with several checkpoints, grade each state before changing or removing it:

```bash
lab grade system-users
```

The grader reads project files and host state. A passing report covers the listed checks; also perform the task’s independent connection, repeat-run, and reboot checks where requested.

{% /reveal %}

{% reveal title="Try an independent variation" %}

Add one disposable administrator and key through the data file only, then verify that account’s access.

Record the published result first. The grader checks the original requirements, so a changed name or value may intentionally fail those checks.

{% /reveal %}

{% /lab-notes %}

{% lab-challenge %}

Prepare the administrator accounts listed in `vars/users_vars.yml` on `webservers`, using `users.yml`.

- All five users must belong to `webadmin` and have their corresponding supplied public key authorized.
- Members of `webadmin` must have passwordless sudo access through a validated policy.
- Direct SSH login as root must be disabled. Keep devops access usable.
- Verify a user1 key login and sudo command, and separately demonstrate root login refusal. Policy text alone is not proof that access works.

{% /lab-challenge %}

  {% lab-setup variant="homelab" %}
    `lab start system-users` creates a key pair for each user in `files/`: `user1.key` and `user1.key.pub`, and so on. Only the `.pub` files go to the servers.
  {% /lab-setup %}

  {% task id="task-d80246856412" legacyIndex=1 title="Look at the data" %}

```yaml {% title="vars/users_vars.yml" %}
---
users:
  - username: user1
    groups: webadmin
  - username: user2
    groups: webadmin
  - username: user3
    groups: webadmin
  - username: user4
    groups: webadmin
  - username: user5
    groups: webadmin
```
  {% /task %}

  {% task id="task-21189c54416c" legacyIndex=2 title="Create the group and the users" %}
    Create `users.yml` with one play for `webservers` that loads the variables file, creates the group `webadmin`, and creates each user as a member of it.

```yaml {% title="users.yml" %}
---
- name: Create multiple local users
  hosts: webservers
  vars_files:
    - vars/users_vars.yml

  tasks:
    - name: Add webadmin group
      ansible.builtin.group:
        name: webadmin
        state: present

    - name: Create user accounts
      ansible.builtin.user:
        name: "{{ item['username'] }}"
        groups: "{{ item['groups'] }}"
      loop: "{{ users }}"
```

    The group must exist before a user can be added to it, so its task comes first.
  {% /task %}

  {% task id="task-6c2bf484133e" legacyIndex=3 title="Install each user's key" %}
    Add a task that puts each user's public key, `files/USERNAME.key.pub`, into their `authorized_keys`:

```yaml
    - name: Add authorized keys
      ansible.posix.authorized_key:
        user: "{{ item['username'] }}"
        key: "{{ lookup('file', 'files/'+ item['username'] + '.key.pub') }}"
      loop: "{{ users }}"
```

    The `file` lookup runs on the control node and returns the contents of the file; `+` joins strings to build its name for each user.
  {% /task %}

  {% task id="task-0b051f6080d4" legacyIndex=4 title="Let webadmin use sudo" %}
    Members of `webadmin` may run any command as root without a password. Put the rule in `/etc/sudoers.d/webadmin`, and have it checked before it is installed:

```yaml
    - name: Modify sudo config to allow webadmin users sudo without a password
      ansible.builtin.lineinfile:
        path: /etc/sudoers.d/webadmin
        state: present
        create: true
        mode: "0440"
        line: "%webadmin ALL=(ALL) NOPASSWD: ALL"
        validate: /usr/sbin/visudo -cf %s
```

    `%` marks a group in a sudoers rule. `validate` runs `visudo` on a temporary copy and installs the file only if the check passes: a broken sudoers file could lock everyone out of sudo.
  {% /task %}

  {% task id="task-169469b10a40" legacyIndex=5 title="Stop root logging in over SSH" %}
    Set `PermitRootLogin no` in `/etc/ssh/sshd_config`, and restart `sshd` when it changes. Put the handler before the tasks, as a reminder that order in the file does not matter:

```yaml
  handlers:
    - name: Restart sshd
      ansible.builtin.service:
        name: sshd
        state: restarted

  tasks:
    ...output omitted...
    - name: Disable root login via SSH
      ansible.builtin.lineinfile:
        dest: /etc/ssh/sshd_config
        regexp: "^PermitRootLogin"
        line: "PermitRootLogin no"
      notify: Restart sshd
```

    `regexp` finds an existing line to replace; if there is none, `lineinfile` adds `line` at the end of the file.
  {% /task %}

  {% task id="task-c6bd8aabca0d" legacyIndex=6 title="Run it" %}

```console
[student@workstation system-users]$ ansible-navigator run -m stdout users.yml

PLAY [Create multiple local users] *********************************************

TASK [Gathering Facts] *********************************************************
ok: [servera.lab.example.com]

TASK [Add webadmin group] ******************************************************
changed: [servera.lab.example.com]

TASK [Create user accounts] ****************************************************
changed: [servera.lab.example.com] => (item={'username': 'user1', 'groups': 'webadmin'})
changed: [servera.lab.example.com] => (item={'username': 'user2', 'groups': 'webadmin'})
changed: [servera.lab.example.com] => (item={'username': 'user3', 'groups': 'webadmin'})
changed: [servera.lab.example.com] => (item={'username': 'user4', 'groups': 'webadmin'})
changed: [servera.lab.example.com] => (item={'username': 'user5', 'groups': 'webadmin'})

TASK [Add authorized keys] *****************************************************
changed: [servera.lab.example.com] => (item={'username': 'user1', 'groups': 'webadmin'})
...output omitted...

TASK [Modify sudo config to allow webadmin users sudo without a password] ******
changed: [servera.lab.example.com]

TASK [Disable root login via SSH] **********************************************
changed: [servera.lab.example.com]

RUNNING HANDLER [Restart sshd] *************************************************
changed: [servera.lab.example.com]

PLAY RECAP *********************************************************************
servera.lab.example.com    : ok=7    changed=6    unreachable=0    failed=0  ...
```
  {% /task %}

  {% task id="task-97d043bbb2fc" legacyIndex=7 title="Log in as user1, and use sudo" %}

    {% variant-group %}
      {% variant name="classroom" %}

```console
[student@workstation system-users]$ ssh user1@servera
[user1@servera ~]$ sudo -i
[root@servera ~]# exit
[user1@servera ~]$ exit
```
      {% /variant %}
      {% variant name="homelab" %}
        The keys in `files/` are new, so tell `ssh` which private key to use:

```console
[student@workstation system-users]$ ssh -i files/user1.key user1@servera 'id; sudo -n id -un'
uid=1002(user1) gid=1003(user1) groups=1003(user1),1002(webadmin) ...
root
```
      {% /variant %}
    {% /variant-group %}
  {% /task %}

  {% task id="task-27d5b6a3ec19" legacyIndex=8 title="Confirm root cannot log in" %}

```console
[student@workstation system-users]$ ssh root@servera
root@servera: Permission denied (publickey,gssapi-keyex,gssapi-with-mic,password).
```

    In a classroom that also asks for a password, the answer is `Permission denied, please try again.` Either way, the root account is refused.
  {% /task %}

  {% task id="task-4909a4513b6e" legacyIndex=9 title="Finish" %}
    {% lab-finish exercise="system-users" /%}
  {% /task %}
{% /lab %}

{% callout type="warning" title="Reset afterwards in the home lab" %}
This exercise disables root's SSH login on servera, which other exercises use. Reset the servers when you finish.
{% /callout %}
