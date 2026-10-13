---
title: "Exercise: Managing Linux hosts and using system roles"
seoTitle: "Managing Linux hosts and using system roles: RHCE Exam-Style Practice Lab"
description: "Graded RHCE exam-style lab on Ansible final review: a challenge with requirements, hints and solutions, and a grader that checks your work on your own lab."
kind: lab
minutes: 45
---

{% lead %}
Use two system roles and a few modules to prepare a web server: logical volumes for its content, an administrator with sudo rights and a vaulted password, an address on a second interface, and a nightly log rotation job. Then run everything from one playbook. Solutions are hidden under each task. Try each one yourself first.
{% /lead %}

This lab covers chapters 4, 7, 8 and 10. The project `~/review-admin` has an `ansible.cfg`, an `inventory` with servera in `webservers`, the system roles collection archive, and `pass-vault.yml`, a Vault-encrypted file that defines `pwhash`, a password hash. Its Vault password is `redhat`.

{% lab
  objectives=["ch11.administration"]
  id="review-admin"
  title="Managing Linux hosts and using system roles"
  exercise="review-admin"
  hosts=["workstation","servera.lab.example.com"]
  outcomes=["Use the storage system role to create, format and persistently mount LVM volumes.","Create a user with sudo access.","Configure network settings with the network system role.","Schedule a cron job."] %}
{% lab-notes %}

**Prerequisites:** Complete [control-node setup](#/ch01/control-node) and the preceding lessons in this chapter. Run commands as student on workstation unless a step names another machine.

{% reveal title="Verify your work" %}

From the project directory, run the relevant home-lab check. For an exercise with several checkpoints, grade each state before changing or removing it:

```bash
lab grade review-admin
```

The grader reads project files and host state. A passing report covers the listed checks; also perform the task’s independent connection, repeat-run, and reboot checks where requested.

{% /reveal %}

{% reveal title="Try an independent variation" %}

Change the nightly schedule and prove the existing storage and account settings remain idempotent.

Record the published result first. The grader checks the original requirements, so a changed name or value may intentionally fail those checks.

{% /reveal %}

{% /lab-notes %}

{% lab-challenge %}

Prepare the webservers for an administrator and persistent web data; compose the four playbooks in `site.yml`.

- `storage.yml`: `vg_web` on the empty extra disk with XFS `lv_content` (768 MiB, `/var/www/html/content`) and `lv_uploads` (1024 MiB, `/var/www/html/uploads`).
- `dev-users.yml`: account and group `webdev`, password from the supplied vaulted hash, and validated passwordless sudo for that group.
- `network.yml`: persistent secondary address, `172.25.250.45/24` on classroom eth1 or `192.0.2.45/24` on home dummy eth1, stored in group variables.
- `log-rotate.yml`: `/etc/cron.d/rotate_web` must schedule `logrotate -f /etc/logrotate.d/httpd` as devops at midnight daily.
- Compose storage, users, network, then scheduling. Verify repeatability, access, and persistent configuration.

{% /lab-challenge %}

  {% lab-setup variant="homelab" %}
    Reset the servers first: `rht-vmctl reset servers` on the Ubuntu host. As in chapter 10, the spare disk is `/dev/sdb`, and `eth1` is a dummy interface with an address from `192.0.2.0/24`.
  {% /lab-setup %}

  {% task id="task-61498f8d8e99" legacyIndex=1 title="Install the collection" %}
    Install `redhat.rhel_system_roles` from the archive into the project's `collections` directory.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ cd ~/review-admin
[student@workstation review-admin]$ ansible-galaxy collection install \
> ./redhat-rhel_system_roles-1.120.5.tar.gz -p collections
...output omitted...
redhat.rhel_system_roles:1.120.5 was installed successfully
```
    {% /reveal %}
  {% /task %}

  {% task id="task-03eb01ff7d3c" legacyIndex=2 title="Storage" %}
    Write `storage.yml`, which uses the storage role on `webservers`:

    - a volume group `vg_web` on `/dev/vdb`,
    - a logical volume `lv_content`, 768 MiB, XFS, mounted on `/var/www/html/content`,
    - a logical volume `lv_uploads`, 1024 MiB, XFS, mounted on `/var/www/html/uploads`.

    Run it.

    {% reveal title="Show solution" %}

```yaml {% title="storage.yml" %}
---
- name: Configure storage on webservers
  hosts: webservers

  roles:
    - name: redhat.rhel_system_roles.storage
      storage_pools:
        - name: vg_web
          type: lvm
          disks:
            - /dev/vdb
          volumes:
            - name: lv_content
              size: 768m
              mount_point: "/var/www/html/content"
              fs_type: xfs
              state: present
            - name: lv_uploads
              size: 1024m
              mount_point: "/var/www/html/uploads"
              fs_type: xfs
              state: present
```

```console
[student@workstation review-admin]$ ansible-navigator run -m stdout storage.yml
...output omitted...
TASK [redhat.rhel_system_roles.storage : Set up new/current mounts] ************
changed: [servera.lab.example.com] => (item={'src': '/dev/mapper/vg_web-lv_content', 'path': '/var/www/html/content', 'fstype': 'xfs', ...})
changed: [servera.lab.example.com] => (item={'src': '/dev/mapper/vg_web-lv_uploads', 'path': '/var/www/html/uploads', 'fstype': 'xfs', ...})
...output omitted...
PLAY RECAP *********************************************************************
servera.lab.example.com    : ok=24   changed=4    unreachable=0    failed=0    skipped=13  ...
```

    (`/dev/sdb` in the home lab.)
    {% /reveal %}
  {% /task %}

  {% task id="task-a12472c928ff" legacyIndex=3 title="An administrator" %}
    Write `dev-users.yml`, which creates the user `webdev` on `webservers`:

    - its password is set from the `pwhash` variable in `pass-vault.yml`,
    - it is a member of the group `webdev`,
    - members of `webdev` can run any command with sudo without a password, from `/etc/sudoers.d/webdev`, written with `ansible.builtin.lineinfile` and validated before it is installed.

    Run it, and check that `webdev` can use sudo.

    {% reveal title="Show solution" %}

```yaml {% title="dev-users.yml" %}
---
- name: Create local users
  hosts: webservers
  vars_files:
    - pass-vault.yml
  tasks:
    - name: Add webdev group
      ansible.builtin.group:
        name: webdev
        state: present

    - name: Create user accounts
      ansible.builtin.user:
        name: webdev
        groups: webdev
        password: "{{ pwhash }}"

    - name: Modify sudo config to allow webdev members sudo without a password
      ansible.builtin.lineinfile:
        path: /etc/sudoers.d/webdev
        state: present
        create: true
        mode: "0440"
        line: "%webdev ALL=(ALL) NOPASSWD: ALL"
        validate: /usr/sbin/visudo -cf %s
```

```console
[student@workstation review-admin]$ ansible-navigator run -m stdout \
> --playbook-artifact-enable false dev-users.yml --vault-id @prompt
Vault password (default): redhat
...output omitted...
TASK [Add webdev group] ********************************************************
changed: [servera.lab.example.com]

TASK [Create user accounts] ****************************************************
changed: [servera.lab.example.com]

TASK [Modify sudo config to allow webdev members sudo without a password] ******
changed: [servera.lab.example.com]

PLAY RECAP *********************************************************************
servera.lab.example.com    : ok=4    changed=3    unreachable=0    failed=0  ...
```

    A playbook that prompts for a password cannot run with playbook artifacts on, hence `--playbook-artifact-enable false` (already the default in the home lab). The password in the hash is `redhat`:

```console
[student@workstation review-admin]$ ssh webdev@servera
webdev@servera's password: redhat
[webdev@servera ~]$ sudo -i
[root@servera ~]# exit
[webdev@servera ~]$ exit
```
    {% /reveal %}
  {% /task %}

  {% task id="task-0f0ee9b36e07" legacyIndex=4 title="A second address" %}
    Write `network.yml`, which uses the network role to give `eth1` on `webservers` the address `172.25.250.45/24`. Put the role's variable in `group_vars`. Run it.

    {% reveal title="Show solution" %}

```yaml {% title="network.yml" %}
---
- name: NIC Configuration
  hosts: webservers

  roles:
    - redhat.rhel_system_roles.network
```

    {% variant-group %}
      {% variant name="classroom" %}

```yaml {% title="group_vars/webservers/network.yml" %}
---
network_connections:
  - name: eth1
    type: ethernet
    ip:
      address:
        - 172.25.250.45/24
```
      {% /variant %}
      {% variant name="homelab" %}

```yaml {% title="group_vars/webservers/network.yml" %}
---
network_connections:
  - name: eth1
    type: dummy
    interface_name: eth1
    ip:
      address:
        - 192.0.2.45/24
```
      {% /variant %}
    {% /variant-group %}

```console
[student@workstation review-admin]$ ansible-navigator run -m stdout network.yml
...output omitted...
        "[002] <info>  #0, state:None persistent_state:present, 'eth1': add connection eth1, 9a6fd785-b4c5-41cd-bb61-54262db23b44"
...output omitted...
servera.lab.example.com    : ok=11   changed=1    unreachable=0    failed=0    skipped=17  ...
```
    {% /reveal %}
  {% /task %}

  {% task id="task-fc621d39fad9" legacyIndex=5 title="Rotate the web logs every night" %}
    Write `log-rotate.yml`, which creates the system cron file `/etc/cron.d/rotate_web` on `webservers`, with a job that runs as `devops` every night at midnight: `logrotate -f /etc/logrotate.d/httpd`. Run it and check the file.

    {% reveal title="Show solution" %}

```yaml {% title="log-rotate.yml" %}
---
- name: Recurring cron job
  hosts: webservers
  become: true

  tasks:
    - name: Crontab file exists
      ansible.builtin.cron:
        name: Rotate HTTPD logs
        minute: "0"
        hour: "0"
        weekday: "*"
        user: devops
        job: "logrotate -f /etc/logrotate.d/httpd"
        cron_file: rotate_web
        state: present
```

```console
[student@workstation review-admin]$ ansible-navigator run -m stdout log-rotate.yml
...output omitted...
servera.lab.example.com    : ok=2    changed=1    unreachable=0    failed=0  ...
[student@workstation review-admin]$ ssh devops@servera "cat /etc/cron.d/rotate_web"
#Ansible: Rotate HTTPD logs
0 0 * * * devops logrotate -f /etc/logrotate.d/httpd
```
    {% /reveal %}
  {% /task %}

  {% task id="task-fbbefa162b96" legacyIndex=6 title="One playbook for everything" %}
    Write `site.yml`, which imports the four playbooks in this order: `storage.yml`, `dev-users.yml`, `network.yml`, `log-rotate.yml`. Run it; there must be no errors.

    {% reveal title="Show solution" %}

```yaml {% title="site.yml" %}
---
- name: Storage
  ansible.builtin.import_playbook: storage.yml
- name: Users
  ansible.builtin.import_playbook: dev-users.yml
- name: Network
  ansible.builtin.import_playbook: network.yml
- name: Log rotation
  ansible.builtin.import_playbook: log-rotate.yml
```

```console
[student@workstation review-admin]$ ansible-navigator run -m stdout \
> --playbook-artifact-enable false site.yml --vault-id @prompt
Vault password (default): redhat
...output omitted...
PLAY RECAP *********************************************************************
servera.lab.example.com    : ok=40   changed=0    unreachable=0    failed=0    skipped=31  ...
[student@workstation review-admin]$ ssh devops@servera \
> 'df -h /var/www/html/content /var/www/html/uploads | tail -2; ip -4 -br addr show eth1'
/dev/mapper/vg_web-lv_content  123M  7.6M  116M   7% /var/www/html/content
/dev/mapper/vg_web-lv_uploads  251M   15M  236M   6% /var/www/html/uploads
eth1             UNKNOWN        192.0.2.45/24
```

    Everything was already in place, so nothing changed: the whole project is idempotent.
    {% /reveal %}
  {% /task %}

  {% task id="task-299205de0ccb" legacyIndex=7 title="Grade and finish" %}
    {% lab-finish exercise="review-admin" grade=true /%}
  {% /task %}
{% /lab %}
