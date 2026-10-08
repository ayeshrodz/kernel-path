---
title: "Exercise: Troubleshooting playbooks"
seoTitle: "Troubleshooting playbooks (RHCE Practice Exercise)"
description: "Hands-on RHCE practice: troubleshooting playbooks. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 20
---

{% lead %}
A colleague's playbook that should set up a Samba server on servera does not run. You will turn on logging, then fix it one error at a time, reading each message for the line, the column and the hint it gives.
{% /lead %}

The project `~/troubleshoot-playbook` has an `inventory` with servera in the `samba_servers` group, the playbook `samba.yml`, and a template `samba.conf.j2`. There is no `ansible.cfg` yet.

{% lab
  objectives=["ch09.playbook-errors"]
  id="troubleshoot-playbook"
  title="Troubleshooting playbooks"
  exercise="troubleshoot-playbook"
  hosts=["workstation","servera.lab.example.com"]
  outcomes=["Read error messages, find the problems in a playbook and fix them."] %}
{% lab-notes %}

**Prerequisites:** Complete [control-node setup](#/ch01/control-node) and the preceding lessons in this chapter. Run commands as student on workstation unless a step names another machine.

{% reveal title="Verify your work" %}

From the project directory, run the relevant home-lab check. For an exercise with several checkpoints, grade each state before changing or removing it:

```bash
lab grade troubleshoot-playbook
```

The grader reads project files and host state. A passing report covers the listed checks; also perform the task’s independent connection, repeat-run, and reboot checks where requested.

Starter files contain deliberate YAML, inventory, or task errors. Repair them before the final checkpoint.

{% /reveal %}

{% reveal title="Try an independent variation" %}

Break the template source path again, diagnose it from the new error message, and restore your correction.

Record the published result first. The grader checks the original requirements, so a changed name or value may intentionally fail those checks.

{% /reveal %}

{% /lab-notes %}

{% lab-challenge %}

Restore the supplied Samba deployment on servera without opening the repair walkthrough first.

- `playbook.yml` must load, connect, and complete successfully with the intended template.
- The project configuration must use its inventory and save diagnostic output in `ansible.log`.
- For each failure, record what the message tells you, your suspected cause, and the smallest correction that resolves it.
- Verify Samba's resulting configuration and service state, then run again. Do not remove failing tasks merely to obtain a green recap.

{% /lab-challenge %}

  {% task id="task-80a4185a92be" legacyIndex=1 title="Log everything" %}
    In `~/troubleshoot-playbook`, create `ansible.cfg` so that Ansible uses the project's inventory and writes a log file in the project:

```ini {% title="ansible.cfg" %}
[defaults]
log_path = /home/student/troubleshoot-playbook/ansible.log
inventory = /home/student/troubleshoot-playbook/inventory
```

    The playbook sets `remote_user` and `become` itself, so nothing else is needed.
  {% /task %}

  {% task id="task-fd8603b38adf" legacyIndex=2 title="Run it, and read the first error" %}

```console
[student@workstation ~]$ cd ~/troubleshoot-playbook
[student@workstation troubleshoot-playbook]$ ansible-navigator run -m stdout samba.yml
ERROR! We were unable to read either as JSON nor YAML, these are the errors we got from each:
JSON: Expecting value: line 1 column 1 (char 0)

Syntax Error while loading YAML.
  mapping values are not allowed in this context

The error appears to be in '/home/student/troubleshoot-playbook/samba.yml': line 8, column 30, but may
be elsewhere in the file depending on the exact syntax problem.

The offending line appears to be:

    install_state: installed
    random_var: This is colon: test
                             ^ here
Please review the log for errors.
```

    The same message is in the log, with a time stamp on each line:

```console
[student@workstation troubleshoot-playbook]$ tail ansible.log
...output omitted...
```

    The value of `random_var` contains a colon followed by a space, which YAML reads as the start of another key. Quote the value:

```yaml
    random_var: "This is colon: test"
```
  {% /task %}

  {% task id="task-2ff7488d5d2c" legacyIndex=3 title="Check the syntax again" %}

```console
[student@workstation troubleshoot-playbook]$ ansible-navigator run \
> -m stdout samba.yml --syntax-check
ERROR! We were unable to read either as JSON nor YAML, these are the errors we got from each:
JSON: Expecting value: line 1 column 1 (char 0)

Syntax Error while loading YAML.
  did not find expected '-' indicator

The error appears to be in '/home/student/troubleshoot-playbook/samba.yml': line 38, column 6, but may
be elsewhere in the file depending on the exact syntax problem.

The offending line appears to be:

     - name: Deliver samba config
     ^ here
```

    The `Deliver samba config` task is indented one space more than the tasks around it. Line it up with the others:

```yaml
    - name: Deliver samba config
      ansible.builtin.template:
        src: samba.j2
        dest: /etc/samba/smb.conf
        owner: root
        group: root
        mode: "0644"
```
  {% /task %}

  {% task id="task-a14970323f16" legacyIndex=4 title="And again" %}

```console
[student@workstation troubleshoot-playbook]$ ansible-navigator run \
> -m stdout samba.yml --syntax-check
...output omitted...
Syntax Error while loading YAML.
  found unacceptable key (unhashable type: 'AnsibleMapping')

The error appears to be in '/home/student/troubleshoot-playbook/samba.yml': line 14, column 17, but may
be elsewhere in the file depending on the exact syntax problem.

The offending line appears to be:

        name: samba
        state: {{ install_state }}
                ^ here
We could be wrong, but this one looks like it might be an issue with
missing quotes. Always quote template expression brackets when they
start a value. For instance:

    with_items:
      - {{ foo }}

Should be written as:

    with_items:
      - "{{ foo }}"
```

    This time the message even suggests the fix. A value that starts with `{{` must be quoted:

```yaml
    - name: Install samba
      ansible.builtin.dnf:
        name: samba
        state: "{{ install_state }}"
```

```console
[student@workstation troubleshoot-playbook]$ ansible-navigator run \
> -m stdout samba.yml --syntax-check
playbook: /home/student/troubleshoot-playbook/samba.yml
```
  {% /task %}

  {% task id="task-5216423f395d" legacyIndex=5 title="Run it" %}

```console
[student@workstation troubleshoot-playbook]$ ansible-navigator run -m stdout samba.yml

PLAY [Install a samba server] **************************************************

TASK [Gathering Facts] *********************************************************
ok: [servera.lab.example.com]

TASK [Install samba] ***********************************************************
changed: [servera.lab.example.com]

TASK [Install firewalld] *******************************************************
ok: [servera.lab.example.com]

TASK [Debug install_state variable] ********************************************
ok: [servera.lab.example.com] => {
    "msg": "The state for the samba service is installed"
}

TASK [Start firewalld] *********************************************************
ok: [servera.lab.example.com]

TASK [Configure firewall for samba] ********************************************
changed: [servera.lab.example.com]

TASK [Deliver samba config] ****************************************************
An exception occurred during task execution. To see the full traceback, use -vvv. The error was: If you are using a module and expect the file to exist on the remote, see the remote_src option
fatal: [servera.lab.example.com]: FAILED! => {"changed": false, "msg": "Could not find or access 'samba.j2'\nSearched in:\n\t/home/student/troubleshoot-playbook/templates/samba.j2\n\t/home/student/troubleshoot-playbook/samba.j2\n\t/home/student/troubleshoot-playbook/templates/samba.j2\n\t/home/student/troubleshoot-playbook/samba.j2 on the Ansible Controller.\nIf you are using a module and expect the file to exist on the remote, see the remote_src option"}

PLAY RECAP *********************************************************************
servera.lab.example.com    : ok=6    changed=2    unreachable=0    failed=1  ...
```

    The syntax is right now, and the play gets as far as the template. The message lists every place Ansible looked for `samba.j2`; the project has `samba.conf.j2`. Fix the `src` line:

```yaml
        src: samba.conf.j2
```
  {% /task %}

  {% task id="task-ccf984f523b1" legacyIndex=6 title="Run it once more" %}

```console
[student@workstation troubleshoot-playbook]$ ansible-navigator run -m stdout samba.yml
...output omitted...
TASK [Deliver samba config] ****************************************************
changed: [servera.lab.example.com]

TASK [Start samba] *************************************************************
changed: [servera.lab.example.com]

PLAY RECAP *********************************************************************
servera.lab.example.com    : ok=8    changed=2    unreachable=0    failed=0  ...
```

    Every task succeeds. A further run reports `changed=0`.
  {% /task %}

  {% task id="task-9c4142f6314d" legacyIndex=7 title="Finish" %}
    {% lab-finish exercise="troubleshoot-playbook" /%}
  {% /task %}
{% /lab %}

## What you practised

Four errors, each found by a different clue: the column marker under a colon, a `-` that did not line up, a hint about quoting, and a list of search paths. Fix one, run again, read the next. The syntax check found three of them without touching servera; only the missing file needed a real run.
