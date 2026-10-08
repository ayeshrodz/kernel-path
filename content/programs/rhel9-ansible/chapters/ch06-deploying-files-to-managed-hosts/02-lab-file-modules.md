---
title: "Exercise: Modifying and copying files to hosts"
seoTitle: "Modifying and copying files to hosts (RHCE Practice Exercise)"
description: "Hands-on RHCE practice: modifying and copying files to hosts. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 25
---

{% lead %}
You will collect a log file from every managed host, copy a file out with a specific owner, mode and SELinux type, reset that SELinux context to the default, add a line and then a block to the file, and finally remove it.
{% /lead %}

The project `~/file-manage` has an `ansible.cfg`, an `inventory` that lists `servera.lab.example.com` and `serverb.lab.example.com`, and `files/users.txt`.

{% lab
  objectives=["ch06.files"]
  id="files"
  title="Modifying and copying files to hosts"
  exercise="file-manage"
  hosts=["workstation","servera.lab.example.com","serverb.lab.example.com"]
  outcomes=["Fetch files from managed hosts and store them by host name.","Use copy, file, lineinfile and blockinfile to create, change and remove files."] %}
{% lab-notes %}

**Prerequisites:** Complete [control-node setup](#/ch01/control-node) and the preceding lessons in this chapter. Run commands as student on workstation unless a step names another machine.

{% reveal title="Verify your work" %}

From the project directory, run the relevant home-lab check. For an exercise with several checkpoints, grade each state before changing or removing it:

```bash
lab grade file-manage
lab grade file-manage --checkpoint copied
lab grade file-manage --checkpoint edited
```

The grader reads project files and host state. A passing report covers the listed checks; also perform the task’s independent connection, repeat-run, and reboot checks where requested.

{% /reveal %}

{% reveal title="Try an independent variation" %}

Repeat the line and block edits before deletion. Prove neither operation duplicates the managed content.

Record the published result first. The grader checks the original requirements, so a changed name or value may intentionally fail those checks.

{% /reveal %}

{% /lab-notes %}

{% lab-challenge %}

Manage a file through several deliberate states, keeping evidence before each later change.

- Fetch `/var/log/secure` from each inventory host into a host-separated `secure-backups` tree.
- Deploy `files/users.txt` to `/home/devops/users.txt` as devops, with user read/write access, no group write/execute or other access, and SELinux type `samba_share_t`.
- Restore the policy-default SELinux context. Then add one line and one managed block without duplicates on repeat runs.
- Remove the managed file at the end. Preserve the seven named playbooks used for fetching, copying, relabeling, editing, and removal so each state can be inspected.

{% /lab-challenge %}

  {% lab-setup variant="homelab" %}
    The first three playbooks connect as `root`. That uses the SSH key for `root` from [section 1.6](#/ch01/control-node). The `tree` command is installed there too.
  {% /lab-setup %}

  {% task id="task-1f00314d7200" legacyIndex=1 title="Fetch the secure log from every host" %}
    In `~/file-manage`, create `secure_log_backups.yml`. One play, for all hosts, connecting as `root`, with a task that fetches `/var/log/secure` into a `secure-backups` directory. `flat: false` keeps the default layout of one subdirectory per host.

```yaml {% title="secure_log_backups.yml" %}
---
- name: Use the fetch module to retrieve secure log files
  hosts: all
  remote_user: root
  tasks:
    - name: Fetch the /var/log/secure log file from managed hosts
      ansible.builtin.fetch:
        src: /var/log/secure
        dest: secure-backups
        flat: false
```

    Check the syntax, then run it:

```console
[student@workstation file-manage]$ ansible-navigator run \
> -m stdout secure_log_backups.yml --syntax-check
playbook: /home/student/file-manage/secure_log_backups.yml
[student@workstation file-manage]$ ansible-navigator run \
> -m stdout secure_log_backups.yml
...output omitted...
TASK [Fetch the /var/log/secure log file from managed hosts] *******************
changed: [serverb.lab.example.com]
changed: [servera.lab.example.com]

PLAY RECAP *********************************************************************
servera.lab.example.com    : ok=2    changed=1    unreachable=0    failed=0  ...
serverb.lab.example.com    : ok=2    changed=1    unreachable=0    failed=0  ...
```
  {% /task %}

  {% task id="task-b47b78fa45fe" legacyIndex=2 title="Look at what was fetched" %}
    The module created `secure-backups` and a directory tree for each host:

```console
[student@workstation file-manage]$ tree -F secure-backups
secure-backups
├── servera.lab.example.com/
│   └── var/
│       └── log/
│           └── secure
└── serverb.lab.example.com/
    └── var/
        └── log/
            └── secure
```
  {% /task %}

  {% task id="task-de0a26458857" legacyIndex=3 title="Copy a file with owner, mode and SELinux type" %}
    Create `copy_file.yml`. It connects as `root` and copies `files/users.txt` to `/home/devops/users.txt` on every host with these attributes:

    | Parameter | Value |
    | --- | --- |
    | `src` | `files/users.txt` |
    | `dest` | `/home/devops/users.txt` |
    | `owner` | `devops` |
    | `group` | `devops` |
    | `mode` | `u+rw,g-wx,o-rwx` |
    | `setype` | `samba_share_t` |

    {% reveal title="Show copy_file.yml" %}

```yaml {% title="copy_file.yml" %}
---
- name: Using the copy module
  hosts: all
  remote_user: root
  tasks:
    - name: Copy a file to managed hosts and set attributes
      ansible.builtin.copy:
        src: files/users.txt
        dest: /home/devops/users.txt
        owner: devops
        group: devops
        mode: u+rw,g-wx,o-rwx
        setype: samba_share_t
```
    {% /reveal %}

    Syntax-check it, run it, then look at the result on servera:

```console
[student@workstation file-manage]$ ansible-navigator run \
> -m stdout copy_file.yml
...output omitted...
[student@workstation file-manage]$ ssh devops@servera 'ls -Z'
unconfined_u:object_r:samba_share_t:s0 users.txt
```
  {% /task %}

  {% task id="task-3bfb21831b34" legacyIndex=4 title="Reset the SELinux context to the policy default" %}
    Create `selinux_defaults.yml`. It uses `ansible.builtin.file` to set the user, role, type and level fields of `/home/devops/users.txt` back to `_default`.

    {% reveal title="Show selinux_defaults.yml" %}

```yaml {% title="selinux_defaults.yml" %}
---
- name: Using the file module to ensure SELinux file context
  hosts: all
  remote_user: root
  tasks:
    - name: SELinux file context is set to defaults
      ansible.builtin.file:
        path: /home/devops/users.txt
        seuser: _default
        serole: _default
        setype: _default
        selevel: _default
```
    {% /reveal %}

```console
[student@workstation file-manage]$ ansible-navigator run \
> -m stdout selinux_defaults.yml
...output omitted...
TASK [SELinux file context is set to defaults] *********************************
changed: [serverb.lab.example.com]
changed: [servera.lab.example.com]
...output omitted...
[student@workstation file-manage]$ ssh devops@servera 'ls -Z'
unconfined_u:object_r:user_home_t:s0 users.txt
```

    The type is back to `user_home_t`, the policy's default for files in a home directory.

    {% callout type="note" title="In real playbooks, fix the cause" %}
    If you ran `copy_file.yml` again, it would set `samba_share_t` again, and the two playbooks would undo each other for ever. Normally you would remove `setype` from the copy task. The exercise skips that to stay short.
    {% /callout %}
  {% /task %}

  {% task id="task-1e91b319aa60" legacyIndex=5 title="Add a line to the file" %}
    Create `add_line.yml`. This play connects as `devops` (the file is theirs, so no privilege escalation is needed) and appends one line.

```yaml {% title="add_line.yml" %}
---
- name: Add text to an existing file
  hosts: all
  remote_user: devops
  tasks:
    - name: Add a single line of text to a file
      ansible.builtin.lineinfile:
        path: /home/devops/users.txt
        line: This line was added by the lineinfile module.
        state: present
```

```console
[student@workstation file-manage]$ ansible-navigator run -m stdout add_line.yml
...output omitted...
[student@workstation file-manage]$ ssh devops@servera 'cat users.txt'
This line was added by the lineinfile module.
```

    At home you see the starter file's own line first, then the new one.
  {% /task %}

  {% task id="task-36985cfb9ab6" legacyIndex=6 title="Add a block of text" %}
    Create `add_block.yml` to append two lines as a managed block.

    {% reveal title="Show add_block.yml" %}

```yaml {% title="add_block.yml" %}
---
- name: Add block of text to a file
  hosts: all
  remote_user: devops
  tasks:
    - name: Add a block of text to an existing file
      ansible.builtin.blockinfile:
        path: /home/devops/users.txt
        block: |
          This block of text consists of two lines.
          They have been added by the blockinfile module.
        state: present
```
    {% /reveal %}

```console
[student@workstation file-manage]$ ansible-navigator run -m stdout add_block.yml
...output omitted...
[student@workstation file-manage]$ ssh devops@servera 'cat users.txt'
This line was added by the lineinfile module.
# BEGIN ANSIBLE MANAGED BLOCK
This block of text consists of two lines.
They have been added by the blockinfile module.
# END ANSIBLE MANAGED BLOCK
```

    Run `add_block.yml` a second time: `changed=0`. The markers told Ansible the block was already there.
  {% /task %}

  {% task id="task-d4b0ef381355" legacyIndex=7 title="Remove the file" %}
    Create `remove_file.yml` and use `ansible.builtin.file` with `state: absent`.

    {% reveal title="Show remove_file.yml" %}

```yaml {% title="remove_file.yml" %}
---
- name: Use the file module to remove a file
  hosts: all
  remote_user: devops
  tasks:
    - name: Remove a file from managed hosts
      ansible.builtin.file:
        path: /home/devops/users.txt
        state: absent
```
    {% /reveal %}

```console
[student@workstation file-manage]$ ansible-navigator run -m stdout remove_file.yml
...output omitted...
[student@workstation file-manage]$ ssh devops@servera 'ls -l'
total 0
```
  {% /task %}

  {% task id="task-0b1024ec09da" legacyIndex=8 title="Finish" %}
    {% lab-finish exercise="file-manage" /%}
  {% /task %}
{% /lab %}

## Try it again, differently

Without looking at the solutions: write one playbook that creates `/srv/reports` (owner `devops`, mode `0750`), copies `files/users.txt` into it only if it is not already there, and registers a `stat` of the copied file to print its size.
