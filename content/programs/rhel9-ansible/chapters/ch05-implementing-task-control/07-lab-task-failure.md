---
title: "Exercise: Handling task failure"
seoTitle: "Handling task failure (RHCE Practice Exercise)"
description: "Hands-on RHCE practice: handling task failure. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 25
---

{% lead %}
You will make a task fail on purpose, then handle that failure four different ways: ignore it, rescue it with a block, stop a read-only command from reporting changes, and invent your own failure condition.
{% /lead %}

The inventory in `~/control-errors` puts `servera.lab.example.com` in the `databases` group.

{% lab
  objectives=["ch05.failure"]
  id="failure"
  title="Handling task failure"
  exercise="control-errors"
  hosts=["workstation","servera.lab.example.com"]
  outcomes=["Ignore failed commands during playbook execution.","Override what counts as failed or changed for a task.","Implement block, rescue and always."] %}
{% lab-notes %}

**Prerequisites:** Complete [control-node setup](#/ch01/control-node) and the preceding lessons in this chapter. Run commands as student on workstation unless a step names another machine.

{% reveal title="Verify your work" %}

From the project directory, run the relevant home-lab check. For an exercise with several checkpoints, grade each state before changing or removing it:

```bash
lab grade control-errors
```

The grader reads project files and host state. A passing report covers the listed checks; also perform the task’s independent connection, repeat-run, and reboot checks where requested.

{% /reveal %}

{% reveal title="Try an independent variation" %}

Remove the artificial failure condition and compare the recap with the previous recovered run.

Record the published result first. The grader checks the original requirements, so a changed name or value may intentionally fail those checks.

{% /reveal %}

{% /lab-notes %}

{% lab-challenge %}

Explore failure reporting in `playbook.yml` without confusing it with the underlying host state.

- Use the intentionally nonexistent web package `http` to demonstrate an ordinary failure, then an ignored failure.
- Demonstrate recovery that installs MariaDB after the web task fails and a final action that starts MariaDB for both successful and recovered paths.
- Correct the package to `httpd` and prove that the recovery path is skipped.
- A read-only time check must capture and display its result without reporting a change. Finally, make the successful web task report failure deliberately and explain why recovery runs.
- Keep evidence of each stage before advancing to the next checkpoint.

{% /lab-challenge %}

  {% task id="task-4890067ca913" legacyIndex=1 title="Write a play with a deliberate mistake" %}
    In `~/control-errors`, create `playbook.yml`. The value `http` is **intentionally wrong**: there is no package with that name.

```yaml {% title="playbook.yml" %}
---
- name: Task Failure Exercise
  hosts: databases
  vars:
    web_package: http
    db_package: mariadb-server
    db_service: mariadb

  tasks:
    - name: Install {{ web_package }} package
      ansible.builtin.dnf:
        name: "{{ web_package }}"
        state: present

    - name: Install {{ db_package }} package
      ansible.builtin.dnf:
        name: "{{ db_package }}"
        state: present
```
  {% /task %}

  {% task id="task-55176e7282ae" legacyIndex=2 title="Run it and watch the play stop" %}

```console
[student@workstation control-errors]$ ansible-navigator run -m stdout playbook.yml
...output omitted...
TASK [Install http package] ****************************************************
fatal: [servera.lab.example.com]: FAILED! => {"changed": false, "failures":
["No package http available."], "msg": "Failed to install some of the specified
packages", "rc": 1, "results": []}

PLAY RECAP *********************************************************************
servera.lab.example.com    : ok=1    changed=0    unreachable=0    failed=1  ...
```

    The second task never ran.
  {% /task %}

  {% task id="task-1f58a221d68a" legacyIndex=3 title="Ignore the error" %}
    Add `ignore_errors: true` to the first task and run again. The failure is reported as `...ignoring`, the second task runs, and the recap shows `ignored=1`.

```yaml
    - name: Install {{ web_package }} package
      ansible.builtin.dnf:
        name: "{{ web_package }}"
        state: present
      ignore_errors: true
```
  {% /task %}

  {% task id="task-a19fe3ebb571" legacyIndex=4 title="Rescue the failure with a block" %}
    Remove `ignore_errors`. Put the web package task in a `block`, the database package task in `rescue`, and add an `always` section that starts the database service.

    {% reveal title="Show solution" %}

```yaml
  tasks:
    - name: Attempt to set up a webserver
      block:
        - name: Install {{ web_package }} package
          ansible.builtin.dnf:
            name: "{{ web_package }}"
            state: present
      rescue:
        - name: Install {{ db_package }} package
          ansible.builtin.dnf:
            name: "{{ db_package }}"
            state: present
      always:
        - name: Start {{ db_service }} service
          ansible.builtin.service:
            name: "{{ db_service }}"
            state: started
```
    {% /reveal %}
  {% /task %}

  {% task id="task-5e1d32f4d55c" legacyIndex=5 title="Run it: block fails, rescue and always run" %}

```console
[student@workstation control-errors]$ ansible-navigator run -m stdout playbook.yml
...output omitted...
TASK [Install http package] ****************************************************
fatal: [servera.lab.example.com]: FAILED! => {"changed": false, ...}

TASK [Install mariadb-server package] ******************************************
ok: [servera.lab.example.com]

TASK [Start mariadb service] ***************************************************
changed: [servera.lab.example.com]

PLAY RECAP *********************************************************************
servera.lab.example.com    : ok=3    changed=1    unreachable=0    failed=0
skipped=0    rescued=1    ignored=0
```

    Note `failed=0` and `rescued=1`: the rescue handled the failure.
  {% /task %}

  {% task id="task-d4c45f93bc77" legacyIndex=6 title="Fix the package name" %}
    Change `web_package` to `httpd` and run again. The block succeeds, so `rescue` is skipped, and `always` still runs.
  {% /task %}

  {% task id="task-ec894f88c687" legacyIndex=7 title="Add a read-only command" %}
    Before the block, add a task that runs `date` and registers the output, and a task that prints it.

```yaml
    - name: Check local time
      ansible.builtin.command: date
      register: command_result

    - name: Print local time
      ansible.builtin.debug:
        var: command_result.stdout
```

    Run the playbook twice: `Check local time` reports `changed` every time, although `date` changes nothing on the host. The command module cannot tell the difference between reading and changing.
  {% /task %}

  {% task id="task-fea018122f91" legacyIndex=8 title="Tell Ansible the command changes nothing" %}
    Add `changed_when: false` to `Check local time` and run again. It now reports `ok`, and the recap shows `changed=0`, while the time is still captured and printed.
  {% /task %}

  {% task id="task-8b392c47fab3" legacyIndex=9 title="Invent a failure condition" %}
    Add `failed_when: web_package == "httpd"` to the task inside the block, and run the playbook.

```yaml
      block:
        - name: Install {{ web_package }} package
          ansible.builtin.dnf:
            name: "{{ web_package }}"
            state: present
          failed_when: web_package == "httpd"
```

```text
TASK [Install httpd package] ***************************************************
fatal: [servera.lab.example.com]: FAILED! => {"changed": false,
"failed_when_result": true, "msg": "Nothing to do", "rc": 0, "results": []}

TASK [Install mariadb-server package] ******************************************
ok: [servera.lab.example.com]
...output omitted...
servera.lab.example.com    : ok=5    changed=0    unreachable=0    failed=0
skipped=0    rescued=1    ignored=0
```

    `dnf` actually succeeded ("Nothing to do", `rc: 0`), but `failed_when` changed how it was **reported**, and that report was enough to send the play into `rescue`.
  {% /task %}

  {% task id="task-2953a744268c" legacyIndex=10 title="Finish" %}
    {% lab-finish exercise="control-errors" /%}
  {% /task %}
{% /lab %}
