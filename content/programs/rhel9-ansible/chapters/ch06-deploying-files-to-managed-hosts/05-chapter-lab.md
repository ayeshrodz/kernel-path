---
title: "Exercise: Deploying files to managed hosts"
seoTitle: "Ansible files and templates Practice Lab (RHCE Exam Style)"
description: "Graded RHCE exam-style lab on Ansible files and templates: a challenge with requirements, hints and solutions, and a grader that checks your work on your own lab."
kind: lab
minutes: 30
---

{% lead %}
The end-of-chapter lab combines both halves of the chapter: find the facts you need, build a template from them, deploy it, check it with `stat`, copy a second file beside it and link a third. Solutions are hidden under each task. Try each one yourself first.
{% /lead %}

The project `~/file-review` has an `ansible.cfg`, an `inventory` with one group, `servers`, that contains `serverb.lab.example.com`, and a login banner in `files/issue`.

{% lab
  objectives=["ch06.files","ch06.templates"]
  id="review"
  title="Deploying files to managed hosts"
  exercise="file-review"
  hosts=["workstation","serverb.lab.example.com"]
  outcomes=["Build a template file from host facts.","Deploy it, and other files and links, from one playbook."] %}
{% lab-notes %}

**Prerequisites:** Complete [control-node setup](#/ch01/control-node) and the preceding lessons in this chapter. Run commands as student on workstation unless a step names another machine.

{% reveal title="Verify your work" %}

From the project directory, run the relevant home-lab check. For an exercise with several checkpoints, grade each state before changing or removing it:

```bash
lab grade file-review
```

The grader reads project files and host state. A passing report covers the listed checks; also perform the task’s independent connection, repeat-run, and reboot checks where requested.

{% /reveal %}

{% reveal title="Try an independent variation" %}

Add the OS distribution to the login message. Predict which files and tasks should change.

Record the published result first. The grader checks the original requirements, so a changed name or value may intentionally fail those checks.

{% /reveal %}

{% /lab-notes %}

{% lab-challenge %}

Provide a useful login message and consistent banner on the inventory hosts.

- `serverb_facts.yml` must expose the facts needed to identify memory and processor count.
- `templates/motd.j2`, deployed by `motd.yml`, must show those host-specific values in root-owned `/etc/motd` with mode `0644`.
- Publish `files/issue` as root-owned `/etc/issue`, mode `0644`; `/etc/issue.net` must be a symbolic link to it, replacing the existing regular file.
- Record the file metadata and confirm the login message. Banner display also depends on the SSH daemon's Banner setting.

{% /lab-challenge %}

  {% task id="task-a9597a31b2fd" legacyIndex=1 title="Review the inventory" %}

```console
[student@workstation ~]$ cd ~/file-review
[student@workstation file-review]$ cat inventory
[servers]
serverb.lab.example.com
```
  {% /task %}

  {% task id="task-ce839d351809" legacyIndex=2 title="Find the facts for memory and processors" %}
    You need the names of the facts that hold serverb's total memory and its number of processors. Write a small playbook, `serverb_facts.yml`, that prints all of `ansible_facts`, run it, and find them.

    {% reveal title="Show solution" %}

```yaml {% title="serverb_facts.yml" %}
---
- name: Display ansible_facts
  hosts: serverb.lab.example.com
  tasks:
    - name: Display facts
      ansible.builtin.debug:
        var: ansible_facts
```

```console
[student@workstation file-review]$ ansible-navigator run -m stdout serverb_facts.yml
...output omitted...
        "memtotal_mb": 960,
...output omitted...
        "processor_count": 1,
...output omitted...
```

    The facts are `ansible_facts['memtotal_mb']` and `ansible_facts['processor_count']`. Your numbers depend on how the VM is sized.
    {% /reveal %}
  {% /task %}

  {% task id="task-69b6e9776e71" legacyIndex=3 title="Write the message-of-the-day template" %}
    Create the directory `templates` and, in it, `motd.j2`. When `devops` logs in to serverb, the message should show the system's total memory and processor count.

    {% reveal title="Show templates/motd.j2" %}

```jinja {% title="templates/motd.j2" %}
System total memory: {{ ansible_facts['memtotal_mb'] }} MiB.
System processor count: {{ ansible_facts['processor_count'] }}
```
    {% /reveal %}
  {% /task %}

  {% task id="task-0d77e610c323" legacyIndex=4 title="Start the playbook" %}
    Create `motd.yml` with one play for all hosts in the inventory. It logs in as `devops` and uses privilege escalation for the whole play.

    {% reveal title="Show solution" %}

```yaml {% title="motd.yml" %}
---
- name: Configure system
  hosts: all
  remote_user: devops
  become: true
  tasks:
```
    {% /reveal %}
  {% /task %}

  {% task id="task-4a20ac0a5765" legacyIndex=5 title="Deploy the template" %}
    Add a task that deploys `templates/motd.j2` to `/etc/motd`, owned by `root:root`, mode `0644`.

    {% reveal title="Show solution" %}

```yaml
    - name: Configure a custom /etc/motd
      ansible.builtin.template:
        src: templates/motd.j2
        dest: /etc/motd
        owner: root
        group: root
        mode: 0644
```
    {% /reveal %}
  {% /task %}

  {% task id="task-37f55568f8cc" legacyIndex=6 title="Check the file with stat" %}
    Add a task that uses `ansible.builtin.stat` to verify that `/etc/motd` exists and registers the result, then a task that prints the registered variable.

    {% reveal title="Show solution" %}

```yaml
    - name: Check file exists
      ansible.builtin.stat:
        path: /etc/motd
      register: motd

    - name: Display stat results
      ansible.builtin.debug:
        var: motd
```
    {% /reveal %}
  {% /task %}

  {% task id="task-e991fad92553" legacyIndex=7 title="Copy the login banner" %}
    Add a task that copies `files/issue` to `/etc/issue`, with the same owner, group and mode as `/etc/motd`.

    {% reveal title="Show solution" %}

```yaml
    - name: Copy custom /etc/issue file
      ansible.builtin.copy:
        src: files/issue
        dest: /etc/issue
        owner: root
        group: root
        mode: 0644
```
    {% /reveal %}
  {% /task %}

  {% task id="task-6a2990ed3ea5" legacyIndex=8 title="Link /etc/issue.net to /etc/issue" %}
    Add a task that makes `/etc/issue.net` a symbolic link to `/etc/issue`. `/etc/issue.net` already exists as a regular file, so the link has to replace it.

    {% reveal title="Show solution" %}

```yaml
    - name: Ensure /etc/issue.net is a symlink to /etc/issue
      ansible.builtin.file:
        src: /etc/issue
        dest: /etc/issue.net
        state: link
        owner: root
        group: root
        force: true
```

    `force: true` lets the module replace the existing regular file with the link.
    {% /reveal %}
  {% /task %}

  {% task id="task-cf55592d7c48" legacyIndex=9 title="Check the syntax and run" %}

```console
[student@workstation file-review]$ ansible-navigator run \
> -m stdout motd.yml --syntax-check
playbook: /home/student/file-review/motd.yml
[student@workstation file-review]$ ansible-navigator run -m stdout motd.yml
...output omitted...
TASK [Configure a custom /etc/motd] ********************************************
changed: [serverb.lab.example.com]

TASK [Check file exists] *******************************************************
ok: [serverb.lab.example.com]

TASK [Display stat results] ****************************************************
ok: [serverb.lab.example.com] => {
    "motd": {
        "changed": false,
        "failed": false,
...output omitted...

TASK [Copy custom /etc/issue file] *********************************************
changed: [serverb.lab.example.com]

TASK [Ensure /etc/issue.net is a symlink to /etc/issue] ************************
changed: [serverb.lab.example.com]

PLAY RECAP *********************************************************************
serverb.lab.example.com    : ok=6    changed=3    unreachable=0    failed=0  ...
```
  {% /task %}

  {% task id="task-e371cb18dcfd" legacyIndex=10 title="Confirm the result" %}
    Log in to serverb as `devops`. You should see the banner from `/etc/issue` before the login completes, and the message of the day after it.

```console
[student@workstation file-review]$ ssh devops@serverb.lab.example.com
------------------------------- PRIVATE SYSTEM -----------------------------
*   Access to this computer system is restricted to authorised users only. *
*                                                                          *
*      Customer information is confidential and must not be disclosed.     *
----------------------------------------------------------------------------
System total memory: 960 MiB.
System processor count: 1
...output omitted...
[devops@serverb ~]$ ls -l /etc/issue.net
lrwxrwxrwx. 1 root root 10 ... /etc/issue.net -> /etc/issue
[devops@serverb ~]$ logout
```

    {% variant name="homelab" title="No banner before login?" %}
    With key-based login, `sshd` prints `/etc/issue.net` only if its `Banner` option points at it, which the default configuration does not. You always see the message of the day; check the banner file with `cat /etc/issue` and the link with `ls -l /etc/issue.net`.
    {% /variant %}
  {% /task %}

  {% task id="task-cb5636853adc" legacyIndex=11 title="Grade and finish" %}
    {% lab-finish exercise="file-review" grade=true /%}
  {% /task %}
{% /lab %}

{% reveal title="Show the complete motd.yml" %}

```yaml {% title="motd.yml" %}
---
- name: Configure system
  hosts: all
  remote_user: devops
  become: true
  tasks:
    - name: Configure a custom /etc/motd
      ansible.builtin.template:
        src: templates/motd.j2
        dest: /etc/motd
        owner: root
        group: root
        mode: 0644

    - name: Check file exists
      ansible.builtin.stat:
        path: /etc/motd
      register: motd

    - name: Display stat results
      ansible.builtin.debug:
        var: motd

    - name: Copy custom /etc/issue file
      ansible.builtin.copy:
        src: files/issue
        dest: /etc/issue
        owner: root
        group: root
        mode: 0644

    - name: Ensure /etc/issue.net is a symlink to /etc/issue
      ansible.builtin.file:
        src: /etc/issue
        dest: /etc/issue.net
        state: link
        owner: root
        group: root
        force: true
```
{% /reveal %}
