---
title: "Exercise: Reusing content with system roles"
seoTitle: "Reusing content with system roles (RHCE Practice Exercise)"
description: "Hands-on RHCE practice: reusing content with system roles. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 25
---

{% lead %}
You will install the system roles collection into a project, read the timesync role's documentation, and use the role to synchronise time on two database servers. Then you will set a different time zone for each data centre with tasks after the role and a handler that reboots the host.
{% /lead %}

The project `~/role-system` has an `ansible.cfg`, an `inventory`, and the collection archive. Its inventory puts servera and serverb in `database_servers`, servera in `na_datacenter` and serverb in `europe_datacenter`.

{% lab
  objectives=["ch08.system-roles"]
  id="role-system"
  title="Reusing content with system roles"
  exercise="role-system"
  hosts=["workstation","servera.lab.example.com","serverb.lab.example.com"]
  outcomes=["Install the system roles collection into a project.","Find and read a system role’s documentation.","Configure time synchronisation and time zones with a system role and tasks."] %}
{% lab-notes %}

**Prerequisites:** Complete [control-node setup](#/ch01/control-node) and the preceding lessons in this chapter. Run commands as student on workstation unless a step names another machine.

{% reveal title="Verify your work" %}

From the project directory, run the relevant home-lab check. For an exercise with several checkpoints, grade each state before changing or removing it:

```bash
lab grade role-system
```

The grader reads project files and host state. A passing report covers the listed checks; also perform the task’s independent connection, repeat-run, and reboot checks where requested.

{% /reveal %}

{% reveal title="Try an independent variation" %}

Give one lab host a different time zone through host variables and explain how it overrides the group value.

Record the published result first. The grader checks the original requirements, so a changed name or value may intentionally fail those checks.

{% /reveal %}

{% /lab-notes %}

{% lab-challenge %}

Configure time on `database_servers` with `configure_time.yml`.

- The project's system-roles collection must be discoverable from `collections/`.
- Use the timesync role with the time source described for your environment below; at home, use the public pool rather than the classroom's private source.
- Hosts in `na_datacenter` must use `America/Chicago`; hosts in `europe_datacenter` must use `Europe/Helsinki`.
- Change zones only when needed and reboot after a zone change. Verify synchronization configuration and each zone after reboot; another run must make no change.

{% /lab-challenge %}

  {% lab-setup variant="homelab" %}
    `lab start role-system` packages the `redhat.rhel_system_roles` collection that section 1.6 installed on workstation as `redhat-rhel_system_roles-1.120.5.tar.gz` (your version may differ). This exercise reboots servera and serverb at the end.
  {% /lab-setup %}

  {% task id="task-bfa9fbeb97de" legacyIndex=1 title="Install the collection into the project" %}

```console
[student@workstation ~]$ cd ~/role-system
[student@workstation role-system]$ mkdir -p collections
```

    Add `collections_path` to the `[defaults]` section of `ansible.cfg`, with the project's directory first:

```ini {% title="ansible.cfg" %}
[defaults]
inventory = ./inventory
remote_user = devops
interpreter_python = auto_silent
collections_path = ./collections:~/.ansible/collections:/usr/share/ansible/collections
...output omitted...
```

```console
[student@workstation role-system]$ ansible-galaxy collection install \
> -p collections/ redhat-rhel_system_roles-1.120.5.tar.gz
Starting galaxy collection install process
Process install dependency map
Starting collection install process
Installing 'redhat.rhel_system_roles:1.120.5' to '/home/student/role-system/collections/ansible_collections/redhat/rhel_system_roles'
redhat.rhel_system_roles:1.120.5 was installed successfully
[student@workstation role-system]$ ansible-galaxy collection list

# /home/student/role-system/collections/ansible_collections
Collection               Version
------------------------ -------
redhat.rhel_system_roles 1.120.5
...output omitted...
```
  {% /task %}

  {% task id="task-ad84fa56fa53" legacyIndex=2 title="Start the playbook" %}
    Create `configure_time.yml` with one play for `database_servers` that applies the timesync role:

```yaml {% title="configure_time.yml" %}
---
- name: Time Synchronization
  hosts: database_servers

  roles:
    - redhat.rhel_system_roles.timesync
```
  {% /task %}

  {% task id="task-d58a2fee515c" legacyIndex=3 title="Read the role's documentation" %}

```console
[student@workstation role-system]$ less \
> collections/ansible_collections/redhat/rhel_system_roles/roles/timesync/README.md
```

    The Role Variables section describes the two you need:

```yaml
timesync_ntp_servers:
  - hostname: foo.example.com   # Hostname or address of the server
    minpoll: 4                  # Minimum polling interval (default 6)
    maxpoll: 8                  # Maximum polling interval (default 10)
    iburst: true                # Flag enabling fast initial synchronization
                                # (default false)
    pool: false                 # Flag indicating that each resolved address
                                # of the hostname is a separate NTP server
                                # (default false)
...output omitted...
# Possible values are "chrony" and "ntp". If not defined, the currently active
# or enabled service will be configured. If no service is active or enabled, a
# package specific to the system and its version will be selected.
timesync_ntp_provider: chrony
```
  {% /task %}

  {% task id="task-5fafbf366f82" legacyIndex=4 title="Set the time source for all hosts" %}
    These settings apply to every host, so they go in `group_vars/all`:

```console
[student@workstation role-system]$ mkdir -pv group_vars/all
mkdir: created directory 'group_vars'
mkdir: created directory 'group_vars/all'
```

    {% variant-group %}
      {% variant name="classroom" %}

```yaml {% title="group_vars/all/timesync.yml" %}
---
#redhat.rhel_system_roles.timesync variables for all hosts

timesync_ntp_provider: chrony

timesync_ntp_servers:
  - hostname: classroom.example.com
    iburst: true
```
      {% /variant %}
      {% variant name="homelab" %}

```yaml {% title="group_vars/all/timesync.yml" %}
---
#redhat.rhel_system_roles.timesync variables for all hosts

timesync_ntp_provider: chrony

timesync_ntp_servers:
  - hostname: 0.rocky.pool.ntp.org
    iburst: true
```
      {% /variant %}
    {% /variant-group %}
  {% /task %}

  {% task id="task-812669625a37" legacyIndex=5 title="Set the time zone after the role" %}
    Add `post_tasks` and a handler to the play. The first task reads the current time zone; the second changes it only if it differs from `host_timezone`, and notifies a handler that reboots the host.

```yaml {% title="configure_time.yml" %}
---
- name: Time Synchronization
  hosts: database_servers

  roles:
    - redhat.rhel_system_roles.timesync

  post_tasks:
    - name: Get time zone
      ansible.builtin.command: timedatectl show
      register: current_timezone
      changed_when: false

    - name: Set time zone
      ansible.builtin.command: "timedatectl set-timezone {{ host_timezone }}"
      when: host_timezone not in current_timezone.stdout
      notify: reboot host

  handlers:
    - name: reboot host
      ansible.builtin.reboot:
```

    The `when` condition is what keeps the `command` task idempotent: on the second run the zone already matches, so the task is skipped.
  {% /task %}

  {% task id="task-9b6763d184ec" legacyIndex=6 title="One time zone per data centre" %}
    Find the zone names, then give each data centre group its own value:

```console
[student@workstation role-system]$ timedatectl list-timezones | grep Chicago
America/Chicago
[student@workstation role-system]$ timedatectl list-timezones | grep Helsinki
Europe/Helsinki
[student@workstation role-system]$ mkdir -pv group_vars/{na_datacenter,europe_datacenter}
mkdir: created directory 'group_vars/na_datacenter'
mkdir: created directory 'group_vars/europe_datacenter'
[student@workstation role-system]$ echo "host_timezone: America/Chicago" > \
> group_vars/na_datacenter/timezone.yml
[student@workstation role-system]$ echo "host_timezone: Europe/Helsinki" > \
> group_vars/europe_datacenter/timezone.yml
```
  {% /task %}

  {% task id="task-c6ad14d8e0c1" legacyIndex=7 title="Run it" %}

```console
[student@workstation role-system]$ ansible-navigator run -m stdout configure_time.yml --syntax-check
playbook: /home/student/role-system/configure_time.yml
[student@workstation role-system]$ ansible-navigator run -m stdout configure_time.yml
...output omitted...
RUNNING HANDLER [redhat.rhel_system_roles.timesync : Restart chronyd] **********
changed: [servera.lab.example.com]
changed: [serverb.lab.example.com]

TASK [Get time zone] ***********************************************************
ok: [servera.lab.example.com]
ok: [serverb.lab.example.com]

TASK [Set time zone] ***********************************************************
changed: [servera.lab.example.com]
changed: [serverb.lab.example.com]

RUNNING HANDLER [reboot host] **************************************************
changed: [serverb.lab.example.com]
changed: [servera.lab.example.com]

PLAY RECAP *********************************************************************
servera.lab.example.com    : ok=23   changed=6    unreachable=0    failed=0    skipped=32  ...
serverb.lab.example.com    : ok=23   changed=6    unreachable=0    failed=0    skipped=32  ...
```

    The role's own handler restarts chronyd after its tasks; your handler reboots the hosts at the end of the play. A second run reports `changed=0`.
  {% /task %}

  {% task id="task-4e5b60e9a15b" legacyIndex=8 title="Check the time zones" %}

```console
[student@workstation role-system]$ ssh devops@servera date
Wed Sep 30 06:37:55 PM CDT 2026
[student@workstation role-system]$ ssh devops@serverb date
Thu Oct  1 02:37:56 AM EEST 2026
```

    The same moment, shown in two time zones.
  {% /task %}

  {% task id="task-a319f6f39b76" legacyIndex=9 title="Finish" %}
    {% lab-finish exercise="role-system" /%}
  {% /task %}
{% /lab %}
