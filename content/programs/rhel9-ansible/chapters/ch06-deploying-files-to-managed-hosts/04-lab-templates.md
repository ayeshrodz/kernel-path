---
title: "Exercise: Deploying custom files with Jinja2 templates"
seoTitle: "Deploying custom files with Jinja2 templates (RHCE Practice Exercise)"
description: "Hands-on RHCE practice: deploying custom files with Jinja2 templates. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 15
---

{% lead %}
You will write a small template for the message of the day and a playbook that deploys it, so that each machine greets its users with its own name, its distribution and the address of its owner.
{% /lead %}

The project `~/file-template` has an `ansible.cfg` and this inventory:

```ini {% title="inventory" %}
[webservers]
servera.lab.example.com

[workstations]
workstation.lab.example.com
```

{% lab
  objectives=["ch06.templates"]
  id="template"
  title="Deploying custom files with Jinja2 templates"
  exercise="file-template"
  hosts=["workstation","servera.lab.example.com"]
  outcomes=["Build a template file.","Use the template file in a playbook."] %}
{% lab-notes %}

**Prerequisites:** Complete [control-node setup](#/ch01/control-node) and the preceding lessons in this chapter. Run commands as student on workstation unless a step names another machine.

{% reveal title="Verify your work" %}

From the project directory, run the relevant home-lab check. For an exercise with several checkpoints, grade each state before changing or removing it:

```bash
lab grade file-template
```

The grader reads project files and host state. A passing report covers the listed checks; also perform the task’s independent connection, repeat-run, and reboot checks where requested.

{% /reveal %}

{% reveal title="Try an independent variation" %}

Add a host-specific owner email in host variables and verify only that host’s rendered message changes.

Record the published result first. The grader checks the original requirements, so a changed name or value may intentionally fail those checks.

{% /reveal %}

{% /lab-notes %}

{% lab-challenge %}

Publish a host-specific login message with `motd.yml` and `motd.j2`.

- Every inventory host's `/etc/motd` must identify its FQDN, distribution and version, and the `system_owner` email value.
- The file must belong to root:root with mode `0644`.
- One reusable template must produce different facts for different hosts. Verify the rendered file and the message at login; a second run must make no change.

{% /lab-challenge %}

  {% lab-setup variant="homelab" %}
    This play also manages `workstation.lab.example.com` itself, so it changes `/etc/motd` on workstation. `rht-vmctl reset servers` does not reset workstation; empty the file afterwards with `sudo truncate -s 0 /etc/motd` if you want it gone.
  {% /lab-setup %}

  {% task id="task-ef934b0a3436" legacyIndex=1 title="Review the inventory" %}

```console
[student@workstation ~]$ cd ~/file-template
[student@workstation file-template]$ cat inventory
[webservers]
servera.lab.example.com

[workstations]
workstation.lab.example.com
```
  {% /task %}

  {% task id="task-ac6c69e3ae46" legacyIndex=2 title="Write the template" %}
    Create `motd.j2` in the project directory. It should use:

    - `ansible_facts['fqdn']` for the host's full name;
    - `ansible_facts['distribution']` and `ansible_facts['distribution_version']` for the Linux distribution;
    - `system_owner`, the owner's email address, which the play will define.

    {% reveal title="Show motd.j2" %}

```jinja {% title="motd.j2" %}
This is the system {{ ansible_facts['fqdn'] }}.
This is a {{ ansible_facts['distribution'] }} version {{ ansible_facts['distribution_version'] }} system.
Only use this system with permission.
Please report issues to: {{ system_owner }}.
```
    {% /reveal %}
  {% /task %}

  {% task id="task-5f0e6664e868" legacyIndex=3 title="Write the playbook" %}
    Create `motd.yml`. The play runs on all hosts as `devops` with privilege escalation, defines `system_owner`, and deploys `motd.j2` to `/etc/motd`, owned by `root:root` with mode `0644`.

    {% reveal title="Show motd.yml" %}

```yaml {% title="motd.yml" %}
---
- name: Configure SOE
  hosts: all
  remote_user: devops
  become: true
  vars:
    - system_owner: clyde@example.com
  tasks:
    - name: Configure /etc/motd
      ansible.builtin.template:
        src: motd.j2
        dest: /etc/motd
        owner: root
        group: root
        mode: 0644
```
    {% /reveal %}
  {% /task %}

  {% task id="task-4455bea8c477" legacyIndex=4 title="Check the syntax" %}

```console
[student@workstation file-template]$ ansible-navigator run \
> -m stdout motd.yml --syntax-check
playbook: /home/student/file-template/motd.yml
```
  {% /task %}

  {% task id="task-f1b9502ddbbb" legacyIndex=5 title="Run the playbook" %}

```console
[student@workstation file-template]$ ansible-navigator run -m stdout motd.yml

PLAY [Configure SOE] ***********************************************************

TASK [Gathering Facts] *********************************************************
ok: [servera.lab.example.com]
ok: [workstation.lab.example.com]

TASK [Configure /etc/motd] *****************************************************
changed: [servera.lab.example.com]
changed: [workstation.lab.example.com]

PLAY RECAP *********************************************************************
servera.lab.example.com    : ok=2    changed=1    unreachable=0    failed=0  ...
workstation.lab.example.com : ok=2   changed=1    unreachable=0    failed=0  ...
```
  {% /task %}

  {% task id="task-d0006cddcc96" legacyIndex=6 title="Log in and read the message" %}
    Log in to servera as `devops`. The message of the day is printed at login, with servera's own values.

    {% variant-group %}
      {% variant name="classroom" %}

```console
[student@workstation file-template]$ ssh devops@servera.lab.example.com
This is the system servera.lab.example.com.
This is a RedHat version 9.0 system.
Only use this system with permission.
Please report issues to: clyde@example.com.
...output omitted...
[devops@servera ~]$ exit
```
      {% /variant %}
      {% variant name="homelab" %}

```console
[student@workstation file-template]$ ssh devops@servera.lab.example.com
This is the system servera.lab.example.com.
This is a Rocky version 9.8 system.
Only use this system with permission.
Please report issues to: clyde@example.com.
...output omitted...
[devops@servera ~]$ exit
```

        The template is identical; the facts differ because the lab runs Rocky Linux.
      {% /variant %}
    {% /variant-group %}
  {% /task %}

  {% task id="task-88ec536f00d3" legacyIndex=7 title="Run it again" %}
    Run the playbook a second time. Both hosts report `ok`, `changed=0`: the rendered text matches the file that is already there.
  {% /task %}

  {% task id="task-66570f23244d" legacyIndex=8 title="Finish" %}
    {% lab-finish exercise="file-template" /%}
  {% /task %}
{% /lab %}

## Try it again, differently

Add a line to `motd.j2` that prints the host's memory in GiB, rounded to one decimal place, from `ansible_facts['memtotal_mb']`. Then add a line that appears only on hosts in the `webservers` group. The template playground in the previous section is a quick place to work out the syntax first.
