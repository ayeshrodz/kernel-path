---
title: "Exercise: Automating Linux administration tasks"
seoTitle: "Ansible Linux automation Practice Lab (RHCE Exam Style)"
description: "Graded RHCE exam-style lab on Ansible Linux automation: a challenge with requirements, hints and solutions, and a grader that checks your work on your own lab."
kind: lab
minutes: 40
---

{% lead %}
Five small playbooks, one for each area of the chapter, prepare the web servers: a package from a signed repository, two operators in a group, storage from the storage role, a scheduled disk report, and an address on a second interface. Solutions are hidden under each task. Try each one yourself first.
{% /lead %}

The project `~/system-review` has an `ansible.cfg`, an `inventory` with servera in `webservers`, and the system roles collection archive. Every playbook targets `webservers`.

{% lab
  objectives=["ch10.software","ch10.users","ch10.scheduling","ch10.storage","ch10.network"]
  id="review"
  title="Automating Linux Administration Tasks"
  exercise="system-review"
  hosts=["workstation","servera.lab.example.com"]
  outcomes=["Configure a repository and install a package.","Create users and groups.","Configure storage and networking with system roles.","Schedule a system cron job."] %}
{% lab-notes %}

**Prerequisites:** Complete [control-node setup](#/ch01/control-node) and the preceding lessons in this chapter. Run commands as student on workstation unless a step names another machine.

{% reveal title="Verify your work" %}

From the project directory, run the relevant home-lab check. For an exercise with several checkpoints, grade each state before changing or removing it:

```bash
lab grade system-review
```

The grader reads project files and host state. A passing report covers the listed checks; also perform the task’s independent connection, repeat-run, and reboot checks where requested.

{% /reveal %}

{% reveal title="Try an independent variation" %}

Change the reporting schedule while leaving users, storage, and networking intact. Verify the isolated change.

Record the published result first. The grader checks the original requirements, so a changed name or value may intentionally fail those checks.

{% /reveal %}

{% /lab-notes %}

{% lab-challenge %}

Prepare the webservers with five focused playbooks and verify the combined result.

- `repo_playbook.yml`: configure the signed repository and install the environment's practice package (classroom `rhelver`; home `libyaml-devel` from Rocky CRB).
- `users.yml`: create `ops1` and `ops2` with supplementary group `webadmin`.
- `storage.yml`: provide `apache-vg` with XFS volumes `content-lv` (512 MiB, `/var/www`) and `logs-lv` (768 MiB, `/var/log/httpd`) on the empty extra disk.
- `create_crontab_file.yml`: a devops job in `/etc/cron.d/disk_usage` must append `df` output to `/home/devops/disk_usage` every two minutes, hours 09–16, weekdays.
- `network_playbook.yml`: configure the secondary address (`172.25.250.40/24` on classroom eth1; `192.0.2.40/24` on a home dummy eth1). Preserve management access and verify repeatability and reboot persistence.

{% /lab-challenge %}

  {% lab-setup variant="homelab" %}
    As in the earlier exercises: the repository is Rocky Linux's CRB repository with the key already on the servers, the package is `libyaml-devel` (only in CRB), the spare disk is `/dev/sdb`, and `eth1` is a dummy interface with the address `192.0.2.40/24`.
  {% /lab-setup %}

  {% task id="task-ecaab709dcab" legacyIndex=1 title="A package from a signed repository" %}
    Write `repo_playbook.yml`. On the web servers, create `/etc/yum.repos.d/example.repo` for the repository `example-internal`, described as `Example Inc. Internal YUM repo`, from `http://materials.example.com/yum/repository`, with GPG checking on. Import its key from `http://materials.example.com/yum/repository/RPM-GPG-KEY-example`, and install the package `rhelver`. Run it and check that the package is installed.

    {% reveal title="Show solution" %}

    {% variant-group %}
      {% variant name="classroom" %}

```yaml {% title="repo_playbook.yml" %}
---
- name: Installing software from a custom repository
  hosts: webservers
  tasks:
    - name: Ensure Example Repo exists
      ansible.builtin.yum_repository:
        name: example-internal
        description: Example Inc. Internal YUM repo
        file: example
        baseurl: http://materials.example.com/yum/repository/
        gpgcheck: true

    - name: Ensure Repo RPM Key is Installed
      ansible.builtin.rpm_key:
        key: http://materials.example.com/yum/repository/RPM-GPG-KEY-example
        state: present

    - name: Install the package
      ansible.builtin.dnf:
        name: rhelver
        state: present
```
      {% /variant %}
      {% variant name="homelab" %}

```yaml {% title="repo_playbook.yml" %}
---
- name: Installing software from a custom repository
  hosts: webservers
  tasks:
    - name: Ensure Example Repo exists
      ansible.builtin.yum_repository:
        name: lab-crb
        description: Rocky Linux 9 CRB (lab)
        file: lab-crb
        mirrorlist: https://mirrors.rockylinux.org/mirrorlist?arch=$basearch&repo=CRB-$releasever
        gpgcheck: true
        gpgkey: file:///etc/pki/rpm-gpg/RPM-GPG-KEY-Rocky-9

    - name: Ensure Repo RPM Key is Installed
      ansible.builtin.rpm_key:
        key: /etc/pki/rpm-gpg/RPM-GPG-KEY-Rocky-9
        state: present

    - name: Install the package
      ansible.builtin.dnf:
        name: libyaml-devel
        state: present
```
      {% /variant %}
    {% /variant-group %}

```console
[student@workstation system-review]$ ansible-navigator run -m stdout repo_playbook.yml
...output omitted...
servera.lab.example.com    : ok=4    changed=1    unreachable=0    failed=0  ...
[student@workstation system-review]$ ssh devops@servera rpm -q libyaml-devel
libyaml-devel-0.2.5-7.el9.x86_64
```
    {% /reveal %}
  {% /task %}

  {% task id="task-51479c17afe2" legacyIndex=2 title="Two operators" %}
    Write `users.yml`. On the web servers, create the group `webadmin`, and the users `ops1` and `ops2` with `webadmin` as a supplementary group. Run it and check.

    {% reveal title="Show solution" %}

```yaml {% title="users.yml" %}
---
- name: Create users and their group
  hosts: webservers
  vars:
    users:
      - username: ops1
        groups: webadmin
      - username: ops2
        groups: webadmin
  tasks:
    - name: The webadmin group exists
      ansible.builtin.group:
        name: webadmin
        state: present

    - name: The users exist
      ansible.builtin.user:
        name: "{{ item['username'] }}"
        groups: "{{ item['groups'] }}"
        append: true
      loop: "{{ users }}"
```

```console
[student@workstation system-review]$ ansible-navigator run -m stdout users.yml
...output omitted...
servera.lab.example.com    : ok=3    changed=1    unreachable=0    failed=0  ...
[student@workstation system-review]$ ssh devops@servera 'id ops1; id ops2'
uid=1007(ops1) gid=1008(ops1) groups=1008(ops1),1002(webadmin)
uid=1008(ops2) gid=1009(ops2) groups=1009(ops2),1002(webadmin)
```
    {% /reveal %}
  {% /task %}

  {% task id="task-6a19b214fcf2" legacyIndex=3 title="Storage" %}
    Install the system roles collection into `collections/`. Write `storage.yml`, which uses the storage role on the web servers: `/dev/vdb` as the physical volume of `apache-vg`; logical volumes `content-lv` (512 MiB) and `logs-lv` (768 MiB), both XFS; `content-lv` mounted on `/var/www` and `logs-lv` on `/var/log/httpd`. Run it.

    {% reveal title="Show solution" %}

```console
[student@workstation system-review]$ ansible-galaxy collection install \
> ./redhat-rhel_system_roles-1.120.5.tar.gz -p collections
...output omitted...
```

```yaml {% title="storage.yml" %}
---
- name: Configure storage on webservers
  hosts: webservers

  roles:
    - name: redhat.rhel_system_roles.storage
      storage_pools:
        - name: apache-vg
          type: lvm
          disks:
            - /dev/vdb
          volumes:
            - name: content-lv
              size: 512m
              mount_point: "/var/www"
              fs_type: xfs
              state: present
            - name: logs-lv
              size: 768m
              mount_point: "/var/log/httpd"
              fs_type: xfs
              state: present
```

    (`/dev/sdb` in the home lab.)
    {% /reveal %}
  {% /task %}

  {% task id="task-090e1ce4ddee" legacyIndex=4 title="A disk usage report" %}
    Write `create_crontab_file.yml`. It creates the system cron file `/etc/cron.d/disk_usage` on the web servers, with a job that runs as `devops` every two minutes from 09:00 to 16:59, Monday to Friday, and runs `df >> /home/devops/disk_usage`. Run it and check the file.

    {% reveal title="Show solution" %}

```yaml {% title="create_crontab_file.yml" %}
---
- name: Recurring cron job
  hosts: webservers
  tasks:
    - name: Disk usage is recorded every two minutes in working hours
      ansible.builtin.cron:
        name: Check disk usage
        job: df >> /home/devops/disk_usage
        user: devops
        cron_file: disk_usage
        minute: "*/2"
        hour: 9-16
        weekday: 1-5
```

```console
[student@workstation system-review]$ ssh devops@servera cat /etc/cron.d/disk_usage
#Ansible: Check disk usage
*/2 9-16 * * 1-5 devops df >> /home/devops/disk_usage
```

    In working hours, `/var/log/cron` on servera shows the job starting every two minutes.
    {% /reveal %}
  {% /task %}

  {% task id="task-a9a981a4e8f5" legacyIndex=5 title="A second address" %}
    Write `network_playbook.yml`, which uses the network role to give `eth1` on the web servers the address `172.25.250.40/24`. Run it.

    {% reveal title="Show solution" %}

    {% variant-group %}
      {% variant name="classroom" %}

```yaml {% title="network_playbook.yml" %}
---
- name: NIC Configuration
  hosts: webservers
  vars:
    network_connections:
      - name: eth1
        type: ethernet
        ip:
          address:
            - 172.25.250.40/24
  roles:
    - redhat.rhel_system_roles.network
```
      {% /variant %}
      {% variant name="homelab" %}

```yaml {% title="network_playbook.yml" %}
---
- name: NIC Configuration
  hosts: webservers
  vars:
    network_connections:
      - name: eth1
        type: dummy
        interface_name: eth1
        ip:
          address:
            - 192.0.2.40/24
  roles:
    - redhat.rhel_system_roles.network
```
      {% /variant %}
    {% /variant-group %}

```console
[student@workstation system-review]$ ansible-navigator run -m stdout network_playbook.yml
...output omitted...
TASK [redhat.rhel_system_roles.network : Configure networking connection profiles] ***
changed: [servera.lab.example.com]
...output omitted...
servera.lab.example.com    : ok=11   changed=1    unreachable=0    failed=0    skipped=17  ...
```
    {% /reveal %}
  {% /task %}

  {% task id="task-93bb73db41fc" legacyIndex=6 title="Check everything once more" %}
    Run each playbook a second time: all five report `changed=0`. Then check on servera:

```console
[student@workstation system-review]$ ssh devops@servera \
> 'df -h /var/www /var/log/httpd | tail -2; ip -4 -br addr show eth1'
/dev/mapper/apache--vg-content--lv   59M  3.9M   55M   7% /var/www
/dev/mapper/apache--vg-logs--lv     123M  7.6M  116M   7% /var/log/httpd
eth1             UNKNOWN        192.0.2.40/24
```
  {% /task %}

  {% task id="task-a5314cc2ed0c" legacyIndex=7 title="Grade and finish" %}
    {% lab-finish exercise="system-review" grade=true /%}
  {% /task %}
{% /lab %}
