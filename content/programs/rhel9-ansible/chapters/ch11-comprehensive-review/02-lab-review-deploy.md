---
title: "Exercise: Deploying Ansible"
seoTitle: "Deploying Ansible: RHCE Exam-Style Practice Lab"
description: "Graded RHCE exam-style lab on Ansible final review: a challenge with requirements, hints and solutions, and a grader that checks your work on your own lab."
kind: lab
minutes: 40
---

{% lead %}
Set up workstation as a control node for servera and serverb, then write, fix and extend small playbooks that use variables, facts and loops. Solutions are hidden under each task. Try each one yourself first.
{% /lead %}

This lab covers chapters 2 to 5 and 9. Your project directory is `~/review-deploy`; `lab start` puts two playbooks in it, `packages.yml` and `verify_user.yml`. You write everything else.

{% lab
  objectives=["ch11.review","ch11.deployment"]
  id="review-deploy"
  title="Deploying Ansible"
  exercise="review-deploy"
  hosts=["workstation","servera.lab.example.com","serverb.lab.example.com"]
  outcomes=["Install and configure Ansible.","Create, modify and troubleshoot playbooks."] %}
{% lab-notes %}

**Prerequisites:** Complete [control-node setup](#/ch01/control-node) and the preceding lessons in this chapter. Run commands as student on workstation unless a step names another machine.

{% reveal title="Verify your work" %}

From the project directory, run the relevant home-lab check. For an exercise with several checkpoints, grade each state before changing or removing it:

```bash
lab grade review-deploy
```

The grader reads project files and host state. A passing report covers the listed checks; also perform the task’s independent connection, repeat-run, and reboot checks where requested.

{% /reveal %}

{% reveal title="Try an independent variation" %}

Add a third disposable user through the existing list, then verify all accounts without duplicating the task.

Record the published result first. The grader checks the original requirements, so a changed name or value may intentionally fail those checks.

{% /reveal %}

{% /lab-notes %}

{% lab-challenge %}

Prepare and use a reproducible control-node project for servera and serverb.

- The project must have a discoverable inventory and configuration, with the privileged connections appropriate to the environment (root in the home walkthrough). Use the runtime appropriate to your environment.
- `users.yml` must provision `joe` and `sam` through one list-driven task.
- `packages.yml` must install the packages described in the exercise, `httpd` and `mariadb-server`, plus `redis` only on hosts with more than 10 MiB of swap.
- Repair `verify_user.yml` so it checks for `sam` without creating that account and records the result in `/home/student/verify.txt`. Confirm both hosts and repeat the playbooks.

{% /lab-challenge %}

  {% lab-setup variant="homelab" %}
    Reset the servers first: `rht-vmctl reset servers` on the Ubuntu host. `ansible-navigator` is already installed on workstation (section 1.6), and the home lab runs without an execution environment, so the first task's EE steps do not apply.
  {% /lab-setup %}

  {% task id="task-2106b05b9af3" legacyIndex=1 title="Install the control node tools" %}
    Install automation content navigator on workstation; the repository that contains it is already configured.

    {% variant-group %}
      {% variant name="classroom" %}
        {% reveal title="Show solution" %}

```console
[student@workstation ~]$ sudo dnf install ansible-navigator
...output omitted...
Complete!
```
        {% /reveal %}
      {% /variant %}
      {% variant name="homelab" %}
        Nothing to install: check that it is there.

```console
[student@workstation ~]$ ansible-navigator --version
ansible-navigator 26.9.0
```
      {% /variant %}
    {% /variant-group %}
  {% /task %}

  {% task id="task-f1b9195ad505" legacyIndex=2 title="Inventory and configuration" %}
    In `~/review-deploy`, create an `inventory` with a group `dev` containing `servera.lab.example.com` and `serverb.lab.example.com`, and an `ansible.cfg` that uses it.

    {% reveal title="Show solution" %}

```ini {% title="inventory" %}
[dev]
servera.lab.example.com
serverb.lab.example.com
```

```ini {% title="ansible.cfg" %}
[defaults]
inventory=./inventory
```
    {% /reveal %}

    {% variant name="homelab" %}
      In a classroom, `ansible-navigator` runs the playbooks inside an execution environment, which connects to the managed hosts as `root`. The home lab runs them directly on workstation, as `student`, who cannot add users. Add `remote_user=root` to `[defaults]` to get the same behaviour; section 1.6 installed `student`'s key for `root` on every server.

```ini {% title="ansible.cfg" %}
[defaults]
inventory=./inventory
remote_user=root
```
    {% /variant %}
  {% /task %}

  {% task id="task-66c287a5d8ad" legacyIndex=3 title="The execution environment" %}
    Create `ansible-navigator.yml` so that navigator uses the image `utility.lab.example.com/ee-supported-rhel8:latest`, and pulls it only if it is missing. Log in to the private automation hub on `utility.lab.example.com` (user `admin`, password `redhat`), then run `ansible-navigator` once to pull the image.

    {% variant-group %}
      {% variant name="classroom" %}
        {% reveal title="Show solution" %}

```yaml {% title="ansible-navigator.yml" %}
---
ansible-navigator:
  execution-environment:
    image: utility.lab.example.com/ee-supported-rhel8:latest
    pull:
      policy: missing
```

```console
[student@workstation review-deploy]$ podman login utility.lab.example.com
Username: admin
Password: redhat
Login Succeeded!
[student@workstation review-deploy]$ ansible-navigator
...output omitted...
Execution environment image name:     utility.lab.example.com/ee-supported-rhel8:latest
Execution environment pull policy:    missing
Execution environment pull needed:    True
...output omitted...
```
        {% /reveal %}
      {% /variant %}
      {% variant name="homelab" %}
        Skip this task: the home lab has no private automation hub and runs without an execution environment, which your `~/.ansible-navigator.yml` already says.
      {% /variant %}
    {% /variant-group %}
  {% /task %}

  {% task id="task-3f7a3c63394e" legacyIndex=4 title="Two users with one task" %}
    Write `users.yml` with one play for `dev` that adds the users `joe` and `sam`, with a single task. Run it.

    {% reveal title="Show solution" %}

```yaml {% title="users.yml" %}
---
- name: Add users
  hosts: dev

  tasks:
    - name: Add the users joe and sam
      ansible.builtin.user:
        name: "{{ item }}"
      loop:
        - joe
        - sam
```

```console
[student@workstation review-deploy]$ ansible-navigator run -m stdout users.yml

PLAY [Add users] ***************************************************************

TASK [Gathering Facts] *********************************************************
ok: [servera.lab.example.com]
ok: [serverb.lab.example.com]

TASK [Add the users joe and sam] ***********************************************
changed: [serverb.lab.example.com] => (item=joe)
changed: [servera.lab.example.com] => (item=joe)
changed: [serverb.lab.example.com] => (item=sam)
changed: [servera.lab.example.com] => (item=sam)

PLAY RECAP *********************************************************************
servera.lab.example.com    : ok=2    changed=1    unreachable=0    failed=0  ...
serverb.lab.example.com    : ok=2    changed=1    unreachable=0    failed=0  ...
```

    In the home lab without `remote_user=root`, every item fails with `useradd: Permission denied`: the playbook connected as `student`.
    {% /reveal %}
  {% /task %}

  {% task id="task-6343c0ff1318" legacyIndex=5 title="Packages from a variable" %}
    Look at `packages.yml`. In its play, define a variable `packages` with the list `httpd` and `mariadb-server`. Run it.

    {% reveal title="Show solution" %}

```yaml {% title="packages.yml" %}
---
- name: Install packages
  hosts: dev
  vars:
    packages:
      - httpd
      - mariadb-server

  tasks:
    - name: Install the required packages
      ansible.builtin.dnf:
        name: "{{ packages }}"
        state: latest
```

```console
[student@workstation review-deploy]$ ansible-navigator run -m stdout packages.yml
...output omitted...
TASK [Install the required packages] *******************************************
changed: [servera.lab.example.com]
changed: [serverb.lab.example.com]
...output omitted...
```
    {% /reveal %}
  {% /task %}

  {% task id="task-79e3e2990c8c" legacyIndex=6 title="A package that depends on a fact" %}
    Add a task to `packages.yml` that installs `redis` only if the host has more than 10 MB of swap space. Run the playbook again.

    {% reveal title="Show solution" %}

```yaml
    - name: Install redis
      ansible.builtin.dnf:
        name: redis
        state: latest
      when: ansible_facts['swaptotal_mb'] > 10
```

```console
[student@workstation review-deploy]$ ansible-navigator run -m stdout packages.yml
...output omitted...
TASK [Install redis] ***********************************************************
skipping: [servera.lab.example.com]
skipping: [serverb.lab.example.com]
...output omitted...
[student@workstation review-deploy]$ ansible dev -m ansible.builtin.setup -a 'filter=ansible_swaptotal_mb'
servera.lab.example.com | SUCCESS => {
    "ansible_facts": {
        "ansible_swaptotal_mb": 0,
...output omitted...
```

    The home-lab servers have no swap, so both skip the task. In a classroom where one server has swap, that one installs `redis`.
    {% /reveal %}
  {% /task %}

  {% task id="task-0bb61a51392a" legacyIndex=7 title="Fix verify_user.yml" %}
    `verify_user.yml` should check, without creating it, that the user `sam` exists, and then write a line to `/home/student/verify.txt`. Run it with `--check` and fix what it reports, until a check run passes. Then run it normally.

    {% reveal title="Show solution" %}

```console
[student@workstation review-deploy]$ ansible-navigator run -m stdout verify_user.yml --check
ERROR! couldn't resolve module/action 'ansible.buildin.user'. This often indicates a misspelling, missing collection, or incorrect module path.

The error appears to be in '/home/student/review-deploy/verify_user.yml': line 6, column 7, but may
be elsewhere in the file depending on the exact syntax problem.
...output omitted...
```

    The module name is misspelled: `ansible.buildin.user` should be `ansible.builtin.user`. Fix it and check again:

```console
[student@workstation review-deploy]$ ansible-navigator run -m stdout verify_user.yml --check
...output omitted...
TASK [Output sam user status to file] ******************************************
fatal: [serverb.lab.example.com]: FAILED! => {"changed": false, "msg": "Unsupported parameters for (ansible.builtin.lineinfile) module: when. Supported parameters include: attributes, backrefs, backup, create, firstmatch, group, insertafter, insertbefore, line, ...output omitted..."}
...output omitted...
```

    `when` is indented as if it were an option of `lineinfile`. It is a task keyword, so it belongs at the level of the module name:

```yaml {% title="verify_user.yml" %}
---
- name: Verify the sam user was created
  hosts: dev

  tasks:
    - name: Verify the sam user exists
      ansible.builtin.user:
        name: sam
      check_mode: true
      register: sam_check

    - name: Sam was created
      ansible.builtin.debug:
        msg: "Sam was created"
      when: sam_check['changed'] == false

    - name: Output sam user status to file
      ansible.builtin.lineinfile:
        path: /home/student/verify.txt
        line: "Sam was created"
        create: true
      when: sam_check['changed'] == false
```

```console
[student@workstation review-deploy]$ ansible-navigator run -m stdout verify_user.yml
...output omitted...
TASK [Sam was created] *********************************************************
ok: [servera.lab.example.com] => {
    "msg": "Sam was created"
}
...output omitted...
TASK [Output sam user status to file] ******************************************
changed: [servera.lab.example.com]
changed: [serverb.lab.example.com]

PLAY RECAP *********************************************************************
servera.lab.example.com    : ok=4    changed=1    unreachable=0    failed=0  ...
serverb.lab.example.com    : ok=4    changed=1    unreachable=0    failed=0  ...
```

    `check_mode: true` on the user task means it can never create `sam`: if it would have to, it reports `changed`, and that is the test.
    {% /reveal %}
  {% /task %}

  {% task id="task-19a97a244d73" legacyIndex=8 title="Grade and finish" %}
    {% lab-finish exercise="review-deploy" grade=true /%}
  {% /task %}
{% /lab %}
