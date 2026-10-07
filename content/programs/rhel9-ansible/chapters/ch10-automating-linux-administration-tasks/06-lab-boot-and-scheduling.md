---
title: "Exercise: Managing the boot process and scheduled processes"
seoTitle: "Managing the boot process and scheduled processes (RHCE Practice Exercise)"
description: "Hands-on RHCE practice: managing the boot process and scheduled processes. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 25
---

{% lead %}
You will schedule a recurring job with cron and remove it again, schedule a one-off job with at, change the default boot target, and reboot a server from a playbook, checking each result on the host.
{% /lead %}

The project `~/system-process` has an `ansible.cfg` and an `inventory` with servera in `webservers`. Every playbook in this exercise has one play for `webservers`, with privilege escalation.

{% lab
  objectives=["ch10.scheduling"]
  id="process"
  title="Managing the boot process and scheduled processes"
  exercise="system-process"
  hosts=["workstation","servera.lab.example.com"]
  outcomes=["Schedule cron and at jobs.","Set the default boot target, and reboot hosts from a playbook."] %}
{% lab-notes %}

**Prerequisites:** Complete [control-node setup](#/ch01/control-node) and the preceding lessons in this chapter. Run commands as student on workstation unless a step names another machine.

{% reveal title="Verify your work" %}

From the project directory, run the relevant home-lab check. For an exercise with several checkpoints, grade each state before changing or removing it:

```bash
lab grade system-process
lab grade system-process --checkpoint scheduled
```

The grader reads project files and host state. A passing report covers the listed checks; also perform the task’s independent connection, repeat-run, and reboot checks where requested.

{% /reveal %}

{% reveal title="Try an independent variation" %}

Change the cron interval to five minutes. Inspect the resulting schedule without waiting for it.

Record the published result first. The grader checks the original requirements, so a changed name or value may intentionally fail those checks.

{% /reveal %}

{% /lab-notes %}

{% lab-challenge %}

Demonstrate recurring work, one-off work, and a persistent boot-target change on the lab hosts.

- A devops cron job must append the time to `/home/devops/my_date_time_cron_job` every two minutes during hours 09–16 on weekdays, from `/etc/cron.d/add-date-time`; later remove it.
- Queue a single devops job that writes the time to `~/my_at_date_time` one minute later, without duplicate queued jobs.
- Change the default boot target only when necessary, reboot, and prove the target persisted. Restore the original target at the end.
- Retain the named scheduling and target playbooks and capture each intermediate state before cleanup.

{% /lab-challenge %}

  {% task id="task-04bbcd8bfdf4" legacyIndex=1 title="A recurring cron job" %}
    Create `create_crontab_file.yml`. Every two minutes from 09:00 to 16:59, Monday to Friday, the job appends the date and time to `/home/devops/my_date_time_cron_job`. It runs as `devops`, from the system cron file `/etc/cron.d/add-date-time`.

```yaml {% title="create_crontab_file.yml" %}
---
- name: Recurring cron job
  hosts: webservers
  become: true

  tasks:
    - name: Crontab file exists
      ansible.builtin.cron:
        name: Add date and time to a file
        job: date >> /home/devops/my_date_time_cron_job
        minute: "*/2"
        hour: 9-16
        weekday: 1-5
        user: devops
        cron_file: add-date-time
        state: present
```

```console
[student@workstation system-process]$ ansible-navigator run -m stdout create_crontab_file.yml
...output omitted...
TASK [Crontab file exists] *****************************************************
changed: [servera.lab.example.com]

PLAY RECAP *********************************************************************
servera.lab.example.com    : ok=2    changed=1    unreachable=0    failed=0  ...
[student@workstation system-process]$ ssh devops@servera "cat /etc/cron.d/add-date-time"
#Ansible: Add date and time to a file
*/2 9-16 * * 1-5 devops date >> /home/devops/my_date_time_cron_job
```

    The `name` became the `#Ansible:` comment, and, because this is a system cron file, the user is written on the line itself.
  {% /task %}

  {% task id="task-fc6a351415e1" legacyIndex=2 title="Remove it" %}
    Create `remove_cron_job.yml` that removes the same job. It must name the same job, user and file, with `state: absent`.

```yaml {% title="remove_cron_job.yml" %}
---
- name: Remove scheduled cron job
  hosts: webservers
  become: true

  tasks:
    - name: Cron job removed
      ansible.builtin.cron:
        name: Add date and time to a file
        user: devops
        cron_file: add-date-time
        state: absent
```

```console
[student@workstation system-process]$ ansible-navigator run -m stdout remove_cron_job.yml
...output omitted...
servera.lab.example.com    : ok=2    changed=1    unreachable=0    failed=0  ...
[student@workstation system-process]$ ssh devops@servera "ls -l /etc/cron.d"
total 8
-rw-r--r--. 1 root root 128 ... 0hourly
...output omitted...
```

    The module deleted `add-date-time` when its last job was gone.
  {% /task %}

  {% task id="task-5cf43c7ac536" legacyIndex=3 title="A one-off job with at" %}
    Create `schedule_at_task.yml`. As `devops`, one minute from now, it writes the date into `~/my_at_date_time`. `unique` stops a second run from queuing the same job again.

```yaml {% title="schedule_at_task.yml" %}
---
- name: Schedule at task
  hosts: webservers
  become: true
  become_user: devops

  tasks:
    - name: Create date and time file
      ansible.posix.at:
        command: date > ~/my_at_date_time
        count: 1
        units: minutes
        unique: true
        state: present
```

    {% variant name="homelab" %}
      The home-lab servers do not have the `at` package, and the task fails with `Failed to find required executable "at"`. Install it and start its service first, with two ad hoc commands:

```console
[student@workstation system-process]$ ansible webservers -m ansible.builtin.dnf -a 'name=at state=present'
[student@workstation system-process]$ ansible webservers -m ansible.builtin.service \
> -a 'name=atd state=started enabled=true'
```
    {% /variant %}

```console
[student@workstation system-process]$ ansible-navigator run -m stdout schedule_at_task.yml
...output omitted...
servera.lab.example.com    : ok=2    changed=1    unreachable=0    failed=0  ...
```

    A minute later:

```console
[student@workstation system-process]$ ssh devops@servera "cat my_at_date_time"
Thu Oct  1 03:41:00 PM NZDT 2026
```

    `become_user: devops` makes the job belong to `devops`, so it runs as that user, in that user's home directory.
  {% /task %}

  {% task id="task-a5e977e47824" legacyIndex=4 title="Change the default boot target" %}
    Create `set_default_boot_target_graphical.yml`. It reads the current default target and sets it to `graphical.target` only if it is not already.

```yaml {% title="set_default_boot_target_graphical.yml" %}
---
- name: Change default boot target
  hosts: webservers
  become: true
  gather_facts: false
  vars:
    default_target: "graphical.target"

  tasks:
    - name: Get current boot target
      ansible.builtin.command:
        cmd: systemctl get-default
      changed_when: false
      register: target

    - name: Set default boot target
      ansible.builtin.command:
        cmd: systemctl set-default {{ default_target }}
      when: default_target not in target['stdout']
```

```console
[student@workstation system-process]$ ssh devops@servera "systemctl get-default"
multi-user.target
[student@workstation system-process]$ ansible-navigator run \
> -m stdout set_default_boot_target_graphical.yml
...output omitted...
TASK [Get current boot target] *************************************************
ok: [servera.lab.example.com]

TASK [Set default boot target] *************************************************
changed: [servera.lab.example.com]
...output omitted...
[student@workstation system-process]$ ssh devops@servera "systemctl get-default"
graphical.target
```

    {% variant name="homelab" %}
      The home-lab servers already boot to `graphical.target`, so the first run skips the second task. Copy the playbook to `set_default_boot_target_multi-user.yml` with `default_target: "multi-user.target"` and run that one first; then come back to this one.
    {% /variant %}

    `changed_when: false` keeps the reading task from reporting a change, and the `when` keeps the second task idempotent.
  {% /task %}

  {% task id="task-4ce54a83864c" legacyIndex=5 title="Reboot from a playbook" %}
    Create `reboot_hosts.yml` that reboots the web servers, and check the boot time before and after:

```yaml {% title="reboot_hosts.yml" %}
---
- name: Reboot hosts
  hosts: webservers
  become: true

  tasks:
    - name: Hosts are rebooted
      ansible.builtin.reboot:
```

```console
[student@workstation system-process]$ ssh devops@servera "who -b"
         system boot  2026-10-01 15:38
[student@workstation system-process]$ ansible-navigator run -m stdout reboot_hosts.yml
...output omitted...
TASK [Hosts are rebooted] ******************************************************
changed: [servera.lab.example.com]
...output omitted...
[student@workstation system-process]$ ssh devops@servera "who -b; systemctl get-default"
         system boot  2026-10-01 15:41
graphical.target
```

    The task waited until servera was back and answering before it finished. The new default target survived the reboot.
  {% /task %}

  {% task id="task-6a2de9585ee8" legacyIndex=6 title="Put the target back" %}
    Copy the boot target playbook to `set_default_boot_target_multi-user.yml`, set `default_target` to `multi-user.target`, and run it. (In the home lab, set it back to `graphical.target` instead.)

```console
[student@workstation system-process]$ ansible-navigator run \
> -m stdout set_default_boot_target_multi-user.yml
...output omitted...
servera.lab.example.com    : ok=2    changed=1    unreachable=0    failed=0  ...
```
  {% /task %}

  {% task id="task-a24857208bf3" legacyIndex=7 title="Finish" %}
    {% lab-finish exercise="system-process" /%}
  {% /task %}
{% /lab %}
