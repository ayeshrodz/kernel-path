---
title: "Exercise: Getting roles and modules from content collections"
seoTitle: "Getting roles and modules from content collections (RHCE Practice Exercise)"
description: "Hands-on RHCE practice: getting roles and modules from content collections. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 25
---

{% lead %}
You will install a collection from an archive, explore what it contains, and use one of its modules and one of its roles in a playbook. Then you will install several collections at once from a requirements file and run a playbook that depends on them.
{% /lead %}

The project `~/role-collections` has an `ansible.cfg`, an `inventory` with `servera.lab.example.com`, two playbooks to complete or run, a `requirements.yml`, and collection archives.

{% lab
  objectives=["ch08.collections"]
  id="role-collections"
  title="Getting roles and modules from content collections"
  exercise="role-collections"
  hosts=["workstation","servera.lab.example.com"]
  outcomes=["Install a collection with ansible-galaxy and find its documentation.","Install several collections from a requirements file.","Use modules and roles from collections in a playbook."] %}
{% lab-notes %}

**Prerequisites:** Complete [control-node setup](#/ch01/control-node) and the preceding lessons in this chapter. Run commands as student on workstation unless a step names another machine.

{% reveal title="Verify your work" %}

From the project directory, run the relevant home-lab check. For an exercise with several checkpoints, grade each state before changing or removing it:

```bash
lab grade role-collections
```

The grader reads project files and host state. A passing report covers the listed checks; also perform the task’s independent connection, repeat-run, and reboot checks where requested.

{% /reveal %}

{% reveal title="Try an independent variation" %}

Restore the saved backup into a safe temporary directory using the collection’s restore documentation.

Record the published result first. The grader checks the original requirements, so a changed name or value may intentionally fail those checks.

{% /reveal %}

{% /lab-notes %}

{% lab-challenge %}

Use collection content from this project, without relying on an unrelated global installation.

- Install the supplied `gls.utils` archive and identify its module and role documentation.
- Complete `bck.yml`: check servera and back up `/etc/sysconfig` and `/etc/yum.repos.d` under the identifier `backup_etc` using that collection.
- Install the dependencies listed in the project's collection requirements, then run `new_system.yml` to apply its DNF setting while retaining SELinux enforcing.
- Demonstrate which collection path is used and why collection content needs its full namespace.

{% /lab-challenge %}

  {% lab-setup variant="homelab" %}
    `lab start role-collections` builds the archives in the project: `gls-utils-0.0.1.tar.gz`, a small collection written for this exercise, and copies of the `redhat.rhel_system_roles` and `community.general` collections already installed on workstation. Their versions match what section 1.6 installed, so your file names may differ slightly from the ones shown.
  {% /lab-setup %}

  {% task id="task-f8a5c12328dc" legacyIndex=1 title="Install the gls.utils collection" %}

```console
[student@workstation ~]$ cd ~/role-collections
[student@workstation role-collections]$ ansible-galaxy collection install \
> /home/student/role-collections/gls-utils-0.0.1.tar.gz -p collections
Starting galaxy collection install process
Process install dependency map
Starting collection install process
Installing 'gls.utils:0.0.1' to '/home/student/role-collections/collections/ansible_collections/gls/utils'
gls.utils:0.0.1 was installed successfully
```

    The project's `ansible.cfg` already puts `./collections` first in `collections_path`, so Ansible finds the new collection without a warning.
  {% /task %}

  {% task id="task-f36bccaaf993" legacyIndex=2 title="Explore it" %}
    Run `ansible-navigator collections`. In the interactive list, find `gls.utils` and type its number (for example `:17`). It contains two roles, `backup` and `restore`, and one module, `newping`. Select `backup` to read its documentation: it saves the files listed in `backup_files` under the name `backup_id`. Press {% kbd %}Esc{% /kbd %} to go back, and {% kbd %}Esc{% /kbd %} again to leave.

    The same documentation is available directly:

```console
[student@workstation role-collections]$ ansible-navigator doc -m stdout gls.utils.newping
> GLS.UTILS.NEWPING    (/home/student/role-collections/collections/ansible_collections/gls/utils/plugins/modules/newping.py)

        A trivial test module. It returns `pong' when Ansible can log
        in to the host and run Python there. It does not make sense in
        a real playbook, but is useful to check that a collection's
        modules are found.

OPTIONS (= is mandatory):

- data
        The value to return in `ping'. If set to `crash', the module
        fails on purpose.
...output omitted...
```
  {% /task %}

  {% task id="task-90deea7cf1cf" legacyIndex=3 title="Use a module and a role from it" %}
    Complete `bck.yml`. Its play for servera already exists; add two tasks: check the host with `gls.utils.newping`, then save `/etc/sysconfig` and `/etc/yum.repos.d` with the `gls.utils.backup` role under the name `backup_etc`.

```yaml {% title="bck.yml" %}
---
- name: Backup the system configuration
  hosts: servera.lab.example.com
  become: true
  gather_facts: false

  tasks:
    - name: Ensure the machine is up
      gls.utils.newping:
        data: pong

    - name: Ensure configuration files are saved
      ansible.builtin.include_role:
        name: gls.utils.backup
      vars:
        backup_id: backup_etc
        backup_files:
          - /etc/sysconfig
          - /etc/yum.repos.d
```

    Modules and roles from a collection are always named by their full name: `namespace.collection.name`.
  {% /task %}

  {% task id="task-0fe7e8e5180e" legacyIndex=4 title="Run it" %}

```console
[student@workstation role-collections]$ ansible-navigator run -m stdout bck.yml --syntax-check
playbook: /home/student/role-collections/bck.yml
[student@workstation role-collections]$ ansible-navigator run -m stdout bck.yml

PLAY [Backup the system configuration] *****************************************

TASK [Ensure the machine is up] ************************************************
ok: [servera.lab.example.com]

TASK [Ensure configuration files are saved] ************************************

TASK [gls.utils.backup : Ensure the backup directory exists] *******************
changed: [servera.lab.example.com]

TASK [gls.utils.backup : Ensure the backup exists] *****************************
changed: [servera.lab.example.com]

PLAY RECAP *********************************************************************
servera.lab.example.com    : ok=3    changed=2    unreachable=0    failed=0  ...
```

    The `include_role` task prints a heading but no result of its own; the role's tasks follow it.
  {% /task %}

  {% task id="task-a5096e24cfd9" legacyIndex=5 title="Install collections from a requirements file" %}
    The second playbook, `new_system.yml`, needs two more collections. Look at the requirements file the project provides:

    {% variant-group %}
      {% variant name="classroom" %}

```yaml {% title="requirements.yml" %}
---
collections:
  - name: /home/student/role-collections/redhat-insights-1.0.7.tar.gz
  - name: /home/student/role-collections/redhat-rhel_system_roles-1.19.3.tar.gz
  - name: /home/student/role-collections/community-general-5.5.0.tar.gz
```
      {% /variant %}
      {% variant name="homelab" %}

```yaml {% title="requirements.yml" %}
---
collections:
  - name: /home/student/role-collections/redhat-rhel_system_roles-1.120.5.tar.gz
  - name: /home/student/role-collections/community-general-9.5.13.tar.gz
```

        The home-lab version leaves out `redhat.insights`, which registers hosts with a Red Hat service.
      {% /variant %}
    {% /variant-group %}

```console
[student@workstation role-collections]$ ansible-galaxy collection install \
> -r requirements.yml -p collections
Starting galaxy collection install process
Process install dependency map
Starting collection install process
Installing 'redhat.rhel_system_roles:1.120.5' to '/home/student/role-collections/collections/ansible_collections/redhat/rhel_system_roles'
redhat.rhel_system_roles:1.120.5 was installed successfully
Installing 'community.general:9.5.13' to '/home/student/role-collections/collections/ansible_collections/community/general'
community.general:9.5.13 was installed successfully
[student@workstation role-collections]$ ansible-galaxy collection list
...output omitted...
```

    `collection list` now shows the project's collections and, below them, the copies in `/usr/share/ansible/collections`. The project's copy is found first.
  {% /task %}

  {% task id="task-44a364abb93c" legacyIndex=6 title="Run the playbook that needs them" %}
    Read `new_system.yml`: it sets an option in `/etc/dnf/dnf.conf` with `community.general.ini_file`, and makes sure SELinux is enforcing with the `redhat.rhel_system_roles.selinux` role. Try it in check mode first, then for real:

```console
[student@workstation role-collections]$ ansible-navigator run -m stdout new_system.yml --check
...output omitted...
PLAY RECAP *********************************************************************
servera.lab.example.com    : ok=17   changed=1    unreachable=0    failed=0    skipped=24  ...
[student@workstation role-collections]$ ansible-navigator run -m stdout new_system.yml
...output omitted...
PLAY RECAP *********************************************************************
servera.lab.example.com    : ok=18   changed=1    unreachable=0    failed=0    skipped=23  ...
```

    SELinux was already enforcing, so only the `dnf.conf` option changed. The many skipped tasks are parts of the role that do not apply to this host.
  {% /task %}

  {% task id="task-790d5a3d7218" legacyIndex=7 title="Finish" %}
    {% lab-finish exercise="role-collections" /%}
  {% /task %}
{% /lab %}
