---
title: Reusing content with system roles
seoTitle: "RHEL System Roles With Ansible (timesync, selinux)"
description: "Reuse the RHEL system roles to configure time, SELinux and more with tested content. Free RHCE (EX294) lesson with diagrams and practice."
kind: lesson
minutes: 12
---

{% lead %}
The operating system ships its own set of supported roles for everyday administration: time synchronisation, SELinux, networking, storage, the firewall, SSH and more. They hide the differences between releases behind one set of variables, so the same play configures RHEL 7, 8 and 9 hosts alike.
{% /lead %}

{% objectives %}
- Explain what system roles are and why they are worth using.
- Install the system roles, from the collection or from the RPM package.
- Find a role's variables and example playbooks.
- Configure time synchronisation and SELinux with system roles, including an SELinux change that needs a reboot.
{% /objectives %}

## Why system roles

A service is often configured differently from one release to the next. Time synchronisation is the classic case: older releases used `ntpd`, RHEL 9 uses `chronyd`. The **timesync** system role takes the same variables for both and does whatever each host needs, so you do not have to write, and keep up to date, one set of tasks per release.

The system roles are designed to keep a stable interface: the variables a role accepts today keep working with later minor and major releases. Each role is either **fully supported**, with that stable interface, or a **technology preview** that may still change; test a preview role before you rely on it.

| Role | Configures |
| --- | --- |
| `timesync` | Time synchronisation (chrony, or ntp on old releases) |
| `selinux` | SELinux mode, booleans, file contexts, ports and user mappings |
| `firewall` | firewalld services, ports and zones |
| `network` | Network interfaces and connections |
| `storage` | Partitions, LVM, file systems and mounts |
| `sshd`, `ssh` | The SSH server and client |
| `postfix` | The mail transfer agent |
| `kdump`, `logging`, `certificate`, `metrics` | Crash dumps, log forwarding, certificates, performance monitoring |

## Installing the system roles

They are published in two ways, with the same content:

| Form | How you get it | Name in a play |
| --- | --- | --- |
| The collection `redhat.rhel_system_roles` | From automation hub, with `ansible-galaxy collection install`, into the project | `redhat.rhel_system_roles.timesync` |
| The RPM package `rhel-system-roles` | `sudo dnf install rhel-system-roles`, from the AppStream repository | `redhat.rhel_system_roles.timesync`, `rhel-system-roles.timesync` or `linux-system-roles.timesync` |

As a collection, it is installed like any other:

```yaml {% title="collections/requirements.yml" %}
---
collections:
  - name: redhat.rhel_system_roles
```

```console
[student@workstation project]$ ansible-galaxy collection install -p collections/ -r collections/requirements.yml
```

The package puts the collection in `/usr/share/ansible/collections/ansible_collections/redhat/rhel_system_roles/`, and plain-role copies in `/usr/share/ansible/roles/`. Prefer the collection name in plays: it is a fully qualified name, like the module names you already use, and it works whichever way the roles were installed.

{% callout type="note" title="Without Automation Platform" %}
The `ansible-core` package in RHEL is supported for one purpose: running the system roles. On such a control node there is no `ansible-navigator` and no execution environment; you run playbooks with `ansible-playbook playbook.yml`, which takes the same options as `ansible-navigator run -m stdout`.
{% /callout %}

{% variant name="homelab" %}
Rocky Linux ships the same `rhel-system-roles` package, and section 1.6 installed it on workstation, so the collection `redhat.rhel_system_roles` is already in `/usr/share/ansible/collections`. The upstream project, with identical variables, is published on Ansible Galaxy as `fedora.linux_system_roles`.
{% /variant %}

## Reading a role's documentation

Every role documents its variables, with example playbooks beside them:

```console
[student@workstation ~]$ ls /usr/share/doc/rhel-system-roles/
ad_integration  aide  bootloader  certificate  cockpit  collection  crypto_policies  fapolicyd  firewall  ...output omitted...
[student@workstation ~]$ ls /usr/share/doc/rhel-system-roles/timesync/
CHANGELOG.md  example-multiple-ntp-servers-playbook.yml  example-single-pool-playbook.yml  README.html  README.md
```

The same `README.md` is inside the collection, in `roles/ROLE/README.md`, and `ansible-navigator collections` shows it too. Read it for the variable names, and start from an example playbook. The variable names are the role's interface: `timesync_ntp_servers` is a list of dictionaries, and a plain string there fails.

## Time synchronisation

The timesync role takes a list of servers in `timesync_ntp_servers`. Each entry has a `hostname` and optional settings such as `iburst` (faster first synchronisation, off by default) and `pool` (the name is a pool of servers):

```yaml {% title="timesync_playbook.yml" %}
---
- name: Time is synchronised
  hosts: webservers
  vars:
    timesync_ntp_servers:
      - hostname: 0.rhel.pool.ntp.org
        iburst: true
      - hostname: 1.rhel.pool.ntp.org
        iburst: true
  roles:
    - redhat.rhel_system_roles.timesync
```

The role installs chrony if it is missing, writes its configuration, and restarts the service only if the file changed.

Values like these belong to the hosts, not to the play. Move them into `group_vars` and the play shrinks to its purpose:

```text
.
├── ansible.cfg
├── group_vars
│   └── webservers
│       └── timesync.yml
├── inventory
└── timesync_playbook.yml
```

`timesync_ntp_provider` chooses between `chrony` and `ntp`. Leave it unset and the role keeps whichever service is already running, or uses the system's default.

## SELinux

The selinux role can:

- set the mode: enforcing, permissive or disabled,
- turn booleans on or off,
- add persistent file context rules, and run `restorecon` on directories,
- label network ports,
- map Linux users to SELinux users.

```yaml {% title="group_vars/webservers/selinux.yml" %}
---
selinux_state: enforcing

selinux_booleans:
  - name: 'httpd_enable_homedirs'
    state: 'on'
    persistent: 'yes'

selinux_fcontexts:
  - target: '/srv/www(/.*)?'
    setype: 'httpd_sys_content_t'
    state: 'present'

selinux_restore_dirs:
  - /srv/www

selinux_ports:
  - ports: '82'
    setype: 'http_port_t'
    proto: 'tcp'
    state: 'present'
```

A variable you leave out leaves that part of the system as it is: without `selinux_state`, the mode does not change.

### When the change needs a reboot

Switching SELinux on from `disabled` needs a reboot. The role does not reboot on its own: it sets `selinux_reboot_required` to `true` and **fails**. The pattern from the role's documentation catches that failure, reboots, and applies the role again:

```yaml
- name: Apply SELinux role
  block:
    - name: The SELinux settings are applied
      ansible.builtin.include_role:
        name: redhat.rhel_system_roles.selinux
  rescue:
    - name: Check for failure for other reasons than required reboot
      ansible.builtin.fail:
      when: not selinux_reboot_required

    - name: Restart managed host
      ansible.builtin.reboot:

    - name: Reapply SELinux role to complete changes
      ansible.builtin.include_role:
        name: redhat.rhel_system_roles.selinux
```

Any other failure still stops the play, through the `fail` task. This is the chapter 5 `block` and `rescue` pattern put to real use.

{% callout type="exam" title="Read the README, copy the example" %}
With a system role, the work is in the variables. Find the role's `README.md`, copy the closest example playbook, and change the values. Most mistakes are a variable with the wrong name or the wrong type, such as a string where the role expects a list.
{% /callout %}

{% quiz
  objectives=["ch08.system-roles"]
  id="check"
  title="Check your understanding"
  ref="check" /%}

## Takeaway

Explain what system roles are and why they are worth using. Use the chapter lab to check this on a real host.
