---
title: "Exercise: Loops and conditional tasks"
seoTitle: "Loops and conditional tasks (RHCE Practice Exercise)"
description: "Hands-on RHCE practice: loops and conditional tasks. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 15
---

{% lead %}
You will install MariaDB with a looping task, then add a condition so the installation only happens on Red Hat Enterprise Linux, and run it against a second group.
{% /lead %}

The inventory in `~/control-flow` has two groups:

```ini {% title="inventory" %}
[database_dev]
servera.lab.example.com

[database_prod]
serverb.lab.example.com
```

{% lab
  objectives=["ch05.loops-conditions"]
  id="loops"
  title="Writing loops and conditional tasks"
  exercise="control-flow"
  hosts=["workstation","servera.lab.example.com","serverb.lab.example.com"]
  outcomes=["Implement conditionals with the when keyword.","Iterate a task with loop, together with conditionals."] %}
{% lab-notes %}

**Prerequisites:** Complete [control-node setup](#/ch01/control-node) and the preceding lessons in this chapter. Run commands as student on workstation unless a step names another machine.

{% reveal title="Verify your work" %}

From the project directory, run the relevant home-lab check. For an exercise with several checkpoints, grade each state before changing or removing it:

```bash
lab grade control-flow
```

The grader reads project files and host state. A passing report covers the listed checks; also perform the task’s independent connection, repeat-run, and reboot checks where requested.

{% /reveal %}

{% reveal title="Try an independent variation" %}

Add a host whose OS does not match the condition. Ensure later service tasks do not assume a skipped package was installed.

Record the published result first. The grader checks the original requirements, so a changed name or value may intentionally fail those checks.

{% /reveal %}

{% /lab-notes %}

{% lab-challenge %}

Configure MariaDB from the `mariadb_packages` list in `playbook.yml`.

- On `database_dev`, install `mariadb-server` and `python3-PyMySQL` through individual loop items, then start and enable MariaDB.
- Extend the exercise to `database_prod`: installation must happen only on the intended distribution. In the classroom that is Red Hat Enterprise Linux; at home use the RedHat OS family so Rocky hosts are included.
- Prove which hosts ran or skipped the installation and check service state. A skipped installation does not install dependencies for a later service task.

{% /lab-challenge %}

  {% task id="task-d5f9a74e1402" legacyIndex=1 title="Move into the project directory" %}

```console
[student@workstation ~]$ cd ~/control-flow
[student@workstation control-flow]$ cat inventory
```
  {% /task %}

  {% task id="task-67c3b2c439e7" legacyIndex=2 title="Start the play with a list variable" %}
    Create `playbook.yml` with a play, `MariaDB server is running`, for `database_dev`. Define `mariadb_packages` as a list containing `mariadb-server` and `python3-PyMySQL`.

    {% reveal title="Show solution" %}

```yaml
---
- name: MariaDB server is running
  hosts: database_dev
  vars:
    mariadb_packages:
      - mariadb-server
      - python3-PyMySQL
```
    {% /reveal %}
  {% /task %}

  {% task id="task-bf9a26906d4b" legacyIndex=3 title="Install the packages with a loop" %}
    Add a task that installs each package in `mariadb_packages`, one loop item at a time.

    {% reveal title="Show solution" %}

```yaml
  tasks:
    - name: MariaDB packages are installed
      ansible.builtin.dnf:
        name: "{{ item }}"
        state: present
      loop: "{{ mariadb_packages }}"
```
    {% /reveal %}

    {% callout type="tip" %}
    `ansible.builtin.dnf` also accepts the whole list at once (`name: "{{ mariadb_packages }}"`), which is faster because it runs one transaction. The loop is here to practise loops.
    {% /callout %}
  {% /task %}

  {% task id="task-51ccade9e547" legacyIndex=4 title="Start the service" %}

```yaml
    - name: Start MariaDB service
      ansible.builtin.service:
        name: mariadb
        state: started
        enabled: true
```
  {% /task %}

  {% task id="task-a07f008f4b12" legacyIndex=5 title="Run it and read the per-item output" %}

```console
[student@workstation control-flow]$ ansible-navigator run -m stdout playbook.yml
...output omitted...
TASK [MariaDB packages are installed] ******************************************
changed: [servera.lab.example.com] => (item=mariadb-server)
changed: [servera.lab.example.com] => (item=python3-PyMySQL)

TASK [Start MariaDB service] ***************************************************
changed: [servera.lab.example.com]

PLAY RECAP *********************************************************************
servera.lab.example.com    : ok=3    changed=2    unreachable=0    failed=0  ...
```

    Each loop item gets its own line, tagged `(item=...)`.
  {% /task %}

  {% task id="task-0d4ebcd4cf41" legacyIndex=6 title="Add a condition and target production" %}
    Change the play to target `database_prod`, and make the install task run only when the host's distribution is Red Hat Enterprise Linux.

    {% reveal title="Show solution" %}

```yaml
- name: MariaDB server is running
  hosts: database_prod
  ...output omitted...
    - name: MariaDB packages are installed
      ansible.builtin.dnf:
        name: "{{ item }}"
        state: present
      loop: "{{ mariadb_packages }}"
      when: ansible_facts['distribution'] == "RedHat"
```
    {% /reveal %}

    {% variant name="homelab" title="Use Rocky here" %}
    serverb runs Rocky Linux at home, so with `"RedHat"` the condition is false and both items are skipped. Write `when: ansible_facts['distribution'] == "Rocky"` to get the output in the next task. Then try it once with `"RedHat"` on purpose: seeing `skipping:` for each item is the other half of this exercise.
    {% /variant %}
  {% /task %}

  {% task id="task-1efb9fc5a722" legacyIndex=7 title="Run it again" %}

```console
[student@workstation control-flow]$ ansible-navigator run -m stdout playbook.yml
...output omitted...
TASK [MariaDB packages are installed] ******************************************
ok: [serverb.lab.example.com] => (item=mariadb-server)
ok: [serverb.lab.example.com] => (item=python3-PyMySQL)
...output omitted...
PLAY RECAP *********************************************************************
serverb.lab.example.com    : ok=3    changed=0    unreachable=0    failed=0  ...
```

    The shown recap is a repeat run after production is configured. Its first run can report changes. In the classroom serverb runs RHEL, so the condition is true and the task runs. On a host where the condition is false, each item shows `skipping:` instead:

```text
TASK [MariaDB packages are installed] ******************************************
skipping: [serverb.lab.example.com] => (item=mariadb-server)
skipping: [serverb.lab.example.com] => (item=python3-PyMySQL)
```
  {% /task %}

  {% task id="task-11b17def7893" legacyIndex=8 title="Finish" %}
    {% lab-finish exercise="control-flow" /%}
  {% /task %}
{% /lab %}

{% callout type="exam" title="See a skip for yourself" %}
Change the condition to `== "Fedora"` and run again. Every item reports `skipping`, and the recap counts `skipped=1` for the task. Knowing what a skip looks like helps you spot conditions that never match.
{% /callout %}
