---
title: "Assessment: Prepare an operations host"
seoTitle: "Prepare an operations host: RHCE Exam-Style Practice Lab"
description: "Graded RHCE exam-style lab on Ansible final review: a challenge with requirements, hints and solutions, and a grader that checks your work on your own lab."
kind: lab
minutes: 90
---

{% lead %}Prepare a host for a small operations team. Combine persistent storage, a limited account, validated sudo, scheduled reporting, a template, and a secondary network connection.{% /lead %}

{% assessment-timer id="operations" /%}

## Brief

Use a clean **serverc**, including its spare data disk, and complete chapter 10 first. Work in `~/assessment-operations`. Confirm the empty extra disk with `lsblk`: use `/dev/sdb` in the home lab or `/dev/vdb` in the classroom examples. Keep the primary network connection working.

{% lab objectives=["ch10.users","ch10.scheduling","ch10.storage","ch10.network","ch11.administration"] id="operations" title="Prepare an operations host" exercise="assessment-operations" ownExercise=true hosts=["serverc.lab.example.com"] outcomes=["Build persistent storage and a limited reporting account.","Verify scheduled reporting, network state, and reboot persistence."] %}
{% lab-notes %}

**Prerequisites:** Complete the prerequisite chapters named above. Use the specified clean host and work as student on workstation.

{% reveal title="Verify your work" %}

From the project directory, run the relevant home-lab check. For an exercise with several checkpoints, grade each state before changing or removing it:

```bash
lab grade assessment-operations
```

The grader reads project files and host state. A passing report covers the listed checks; also perform the task’s independent connection, repeat-run, and reboot checks where requested.

{% /reveal %}

{% reveal title="Try an independent variation" %}

Change the summary template and verify that storage and network tasks remain unchanged.

Record the published result first. The grader checks the original requirements, so a changed name or value may intentionally fail those checks.

{% /reveal %}

{% /lab-notes %}

{% lab-challenge %}

Prepare serverc from `site.yml` in `~/assessment-operations`, retaining management access and SELinux enforcement.

- On the empty extra disk, `vg_practice` must hold XFS volume `reports` (768 MiB), persistently mounted at `/srv/reports`. Use the storage system role and host-specific variables.
- Account `reporter` must belong to `reporting` and accept the public key saved in `files/reporter.pub`. The report directory must belong to reporter:reporting, mode `0750`.
- Root-owned `/etc/sudoers.d/reporter` (mode `0440`) must allow only `/usr/bin/du -sh /srv/reports` without a password and reject invalid replacements before installation.
- `/etc/cron.d/report-usage` must run `/usr/bin/df -h /srv/reports > /srv/reports/usage.txt` as reporter at minute 15 every six hours. Prove the command can write the report.
- The network system role must provide persistent dummy connection/interface `practice0` at `198.51.100.20/24`.
- `/srv/reports/host.txt` must identify the inventory host and report path, owned by reporter:reporting, mode `0640`.
- Verify the combined state, repeat the playbook, and verify again after reboot.

{% /lab-challenge %}

{% task id="operations-storage" title="Provide persistent report storage" %}
Create volume group `vg_practice` on the empty extra disk, a 768 MiB logical volume named `reports`, and an XFS filesystem mounted persistently at `/srv/reports`. Use the storage system role and put host-specific values in variables.
{% reveal title="Hint: verify the disk before changing it" %}Compare `lsblk -f`, `pvs`, `vgs`, and `lvs`. The root disk already has mounted filesystems. Use the extra disk only, and reset both the VM and its data volume before repeating from scratch.{% /reveal %}
{% /task %}
{% task id="operations-user" title="Create the reporting identity" %}
Create group `reporting` and user `reporter` in that group. Copy your workstation public key to `files/reporter.pub` and install it for reporter. Give reporter ownership of `/srv/reports`, group reporting, and mode `0750`.
{% /task %}
{% task id="operations-policy" title="Validate a limited sudo rule" %}
Allow reporter to run only `/usr/bin/du -sh /srv/reports` as root without a password. Write `/etc/sudoers.d/reporter` as root, mode `0440`, with `visudo` validation before replacement. Keep SELinux enforcing and retain devops access.
{% /task %}
{% task id="operations-schedule" title="Schedule a usage report" %}
Use `/etc/cron.d/report-usage` to run `/usr/bin/df -h /srv/reports > /srv/reports/usage.txt` as reporter at minute 15 every six hours. Verify the schedule without waiting for it: run the exact command once as reporter and inspect the file. This manual command is a verification action.
{% /task %}
{% task id="operations-network" title="Add an isolated secondary address" %}
Create a persistent dummy connection named `practice0`, using interface `practice0` and address `198.51.100.20/24`. Use the network system role and leave the management connection as it is.
{% /task %}
{% task id="operations-template" title="Publish the host summary" %}
Template `/srv/reports/host.txt` with the inventory name and the reporting path. Set owner reporter, group reporting, and mode `0640`. Save your complete solution in `site.yml`, using role variables for storage and networking.
{% /task %}
{% task id="operations-verify" title="Verify repeatability and persistence" %}
Run `lab grade assessment-operations`. Repeat the playbook and investigate unexpected changes. Explicitly reboot serverc, check the mount, address, login, and allowed sudo command, and grade again. Import the result into your learning dashboard.
{% /task %}
{% /lab %}

## Review your approach

Explain why a successful mount today does not establish persistence, and why validating a sudoers file differs from testing the intended user's permissions. For a variation, add a second group member with a different SSH key while preserving reporter's access.

{% reveal title="One working solution" %}

Copy your public key into `files/reporter.pub` first. The example uses the home-lab extra disk; verify its name before running.

```yaml {% title="site.yml" %}
- name: Prepare an operations host
  hosts: operations
  become: true
  vars:
    storage_pools:
      - name: vg_practice
        type: lvm
        disks: [/dev/sdb]
        volumes:
          - name: reports
            size: 768m
            fs_type: xfs
            mount_point: /srv/reports
            state: present
    network_connections:
      - name: practice0
        type: dummy
        interface_name: practice0
        state: up
        ip:
          address: [198.51.100.20/24]
  roles:
    - redhat.rhel_system_roles.storage
    - redhat.rhel_system_roles.network
  tasks:
    - name: Reporting group
      ansible.builtin.group:
        name: reporting
    - name: Reporting account
      ansible.builtin.user:
        name: reporter
        groups: reporting
        append: true
    - name: Reporting public key
      ansible.posix.authorized_key:
        user: reporter
        key: "{{ lookup('ansible.builtin.file', 'files/reporter.pub') }}"
    - name: Report directory permissions
      ansible.builtin.file:
        path: /srv/reports
        state: directory
        owner: reporter
        group: reporting
        mode: '0750'
    - name: Limited sudo policy
      ansible.builtin.copy:
        content: "reporter ALL=(root) NOPASSWD: /usr/bin/du -sh /srv/reports\n"
        dest: /etc/sudoers.d/reporter
        owner: root
        group: root
        mode: '0440'
        validate: /usr/sbin/visudo -cf %s
    - name: Keep SELinux enforcing
      ansible.posix.selinux:
        policy: targeted
        state: enforcing
    - name: Schedule disk report
      ansible.builtin.cron:
        name: Report storage usage
        cron_file: report-usage
        user: reporter
        minute: '15'
        hour: '*/6'
        job: /usr/bin/df -h /srv/reports > /srv/reports/usage.txt
    - name: Host summary
      ansible.builtin.template:
        src: host.txt.j2
        dest: /srv/reports/host.txt
        owner: reporter
        group: reporting
        mode: '0640'
```

```jinja {% title="host.txt.j2" %}
Host: {{ inventory_hostname }}
Reports: /srv/reports
```

Verify the schedule with `cat /etc/cron.d/report-usage`. On serverc as root, run `sudo -u reporter sh -c '/usr/bin/df -h /srv/reports > /srv/reports/usage.txt'` and inspect the result. Test the exact allowed sudo command as reporter. After a reboot, `findmnt /srv/reports` and `ip -4 addr show practice0` should still show the requested state.

{% /reveal %}
