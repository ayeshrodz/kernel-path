---
title: Project, profile and extra disks
seoTitle: "Project, profile and extra disks: RHCE Home Lab Setup"
description: "Project, profile and extra disks: part of building a free RHCE practice lab at home with Rocky Linux 9 virtual machines on LXD."
kind: lab
minutes: 17
---

{% lead %}
Phases 05 to 07: give the lab its own LXD project, turn the project's default profile into a template that creates the classroom users on first boot, and create the spare disks the storage exercises need.
{% /lead %}

{% lab
  objectives=["ch01.lab-network","ch01.lab-machines","ch01.lab-tools","ch01.lab-reset"]
  id="project"
  title="Phase 05 · Create the rhce project (~2 min)"
  hosts=["LXD UI","Ubuntu host"]
  outcomes=["Keep the lab in its own LXD project so it cannot collide with anything else on the machine."] %}
  {% task id="task-a7d130d0b9c6" legacyIndex=1 title="LXD UI: create the project" %}
    Project selector (top left) → **Create project**:

    | Field | Value | Why |
    | --- | --- | --- |
    | Project name | rhce | |
    | Description | Kernel Path practice lab | |
    | Features | Customised | |
    | Allow custom profiles | ✓ on | The lab gets its own template |
    | Allow storage volumes | ✓ on | The extra disks belong to the lab |
    | Allow images | off | Share downloaded images |
    | Allow networks | off | Use `rhcebr0` from the previous section |

    {% callout type="note" title="Left Allow images on?" %}
    That works too: the project then keeps its own copy of each image it downloads. You can't change it once the project has VMs, so leave it as it is. The commands in this chapter work either way.
    {% /callout %}
  {% /task %}

  {% task id="task-86a669189995" legacyIndex=2 title="LXD UI: switch to it" %}
    Click **Create**, then switch the selector to **rhce**. Stay in it from now on.
  {% /task %}

  {% task id="task-35abc2543633" legacyIndex=3 title="Host: make the command line use it too" %}
    Then you don't need `--project rhce` on every command.

```bash {% title="Ubuntu host" %}
lxc project switch rhce
```
  {% /task %}
{% /lab %}

## The lab profile

A **profile** is a template every VM inherits. The rhce project's `default` profile becomes the lab template: disk, network, size, and a **cloud-init** script that creates the users on first boot.

| Part | What it does |
| --- | --- |
| `limits.*` | Default VM size. You raise it for workstation only. |
| `users:` / `chpasswd:` | Creates `student`, `devops` and root's password, as in the classroom |
| `packages:` | Python and SELinux bindings for Ansible, LVM tools for the storage tasks, manual pages and everyday tools for the system administration path, a nicer vim, plus the SELinux policy, firewalld and chrony a RHEL server has |
| `runcmd:` + `preserve_hostname` | Sets the full hostname from the VM name, e.g. `servera.lab.example.com`, and keeps it after reboots. Also switches on firewalld and chrony, and keeps `lxc exec` working under SELinux |
| `power_state:` | Reboots once after the first boot, so SELinux labels the disk and starts in enforcing mode |
| `devices:` | A 20 GiB system disk and a network card on `rhcebr0` |

{% lab
  objectives=["ch01.lab-network","ch01.lab-machines","ch01.lab-tools","ch01.lab-reset"]
  id="profile"
  title="Phase 06 · Set up the lab profile (~10 min)"
  hosts=["LXD UI"]
  outcomes=["Make every new VM boot with the classroom users, packages and hostname."] %}
  {% task id="task-37cd8e3c99ba" legacyIndex=1 title="LXD UI: open the profile editor" %}
    Project **rhce** → **Profiles** → **default** → **Configuration** → **YAML configuration** → **Edit profile**.
  {% /task %}

  {% task id="task-3940b44ba4f8" legacyIndex=2 title="LXD UI: replace everything and save" %}
    Replace the whole profile with this, then **Save changes**. Nothing needs editing.

```yaml {% title="rhce project: default profile" %}
name: default
description: Kernel Path lab machine template
config:
  limits.cpu: "1"
  limits.memory: 1GiB
  security.secureboot: "false"        # avoids boot problems with Rocky VM images
  cloud-init.user-data: |
    #cloud-config
    ssh_pwauth: true                  # VM-to-VM password SSH, like the classroom
    preserve_hostname: true           # keep the FQDN set below across reboots
    users:
      - name: student
        gecos: Student User
        groups: [wheel]               # wheel = sudo with password
        shell: /bin/bash
        lock_passwd: false
        plain_text_passwd: student
      - name: devops
        gecos: Ansible User
        shell: /bin/bash
        lock_passwd: false
        plain_text_passwd: redhat
        sudo: "ALL=(ALL) NOPASSWD:ALL"  # Ansible needs passwordless sudo
    chpasswd:
      expire: false
      users:
        - name: root
          password: redhat
          type: text
    timezone: UTC                     # or your own, e.g. Europe/London
    packages:
      - python3
      - python3-libselinux
      - vim-enhanced
      - bash-completion
      - man-db                        # manual pages and everyday tools,
      - man-pages                     # also used by the system administration path
      - tree
      - tmux
      - lsof
      - nano
      - bind-utils
      - lvm2
      - tar
      - rsync                         # ansible.posix.synchronize needs it on both ends
      - selinux-policy-targeted       # the image ships without SELinux; RHEL runs it enforcing
      - policycoreutils-python-utils  # semanage; Ansible's SELinux modules need it too
      - firewalld                     # running by default, as on a RHEL server
      - chrony
    runcmd:
      - hostnamectl set-hostname "$(cloud-init query local_hostname).lab.example.com"
      - semanage fcontext -a -t bin_t "/var/run/lxd_agent(/.*)?"   # keeps lxc exec working under SELinux
      - systemctl enable --now firewalld chronyd
    power_state:                      # reboot once: SELinux labels the disk and switches on
      mode: reboot
      condition: test -e /.autorelabel
devices:
  root:
    type: disk
    path: /
    pool: default
    size: 20GiB
  eth0:
    type: nic
    name: eth0
    network: rhcebr0
```

    {% callout type="note" title="Why the SELinux lines?" %}
    The Rocky cloud image comes with SELinux switched off, but the classroom and the exam run it in **enforcing** mode, and several exam tasks are about SELinux. Installing the policy turns it on after one reboot. In enforcing mode SELinux would also block the LXD agent that `lxc exec` talks to; the `semanage fcontext` line labels the agent as a normal program so it keeps working. Nothing else is relaxed.
    {% /callout %}

    {% callout type="important" title="cloud-init runs once" %}
    These settings apply only on a VM's *first* boot. Editing the profile later doesn't change existing VMs; delete and recreate them instead (about a minute each).
    {% /callout %}
  {% /task %}
{% /lab %}

{% lab
  objectives=["ch01.lab-network","ch01.lab-machines","ch01.lab-tools","ch01.lab-reset"]
  id="disks"
  title="Phase 07 · Create the extra disks (~5 min)"
  hosts=["LXD UI"]
  outcomes=["Give each managed host an empty 5 GiB disk for the partition, LVM and filesystem exercises."] %}
  {% task id="task-1e0e320ca751" legacyIndex=1 title="LXD UI: create four block volumes" %}
    Four times, for `servera-disk2`, `serverb-disk2`, `serverc-disk2` and `serverd-disk2`: **Storage** → **Volumes** → **Create volume**.

    | Field | Value |
    | --- | --- |
    | Name | servera-disk2 |
    | Storage pool | default |
    | Size | 5 GiB |
    | Content type | block |

    {% callout type="warning" title="Content type must be block" %}
    A `filesystem` volume appears inside the VM as a shared folder, not a disk, and the LVM tasks will fail.
    {% /callout %}
  {% /task %}
{% /lab %}
