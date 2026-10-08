---
title: Project, profile and extra disks
seoTitle: "LXD Project, Profile and Extra VM Disks"
description: "Set up an LXD project and profile, and give each server a spare disk for storage practice. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lab
minutes: 17
---

{% lead %}
Phases 05 to 07: give the lab its own LXD project, turn the project's default profile into a template that creates the lab users on first boot, and create the two spare disks the storage chapters need.
{% /lead %}

{% lab
  objectives=["ch01.lab-network","ch01.lab-machines","ch01.lab-tools","ch01.lab-reset"]
  id="project"
  title="Phase 05 · Create the rhce project (~2 min)"
  hosts=["LXD UI","Ubuntu host"]
  outcomes=["Keep the lab in its own LXD project so it cannot collide with anything else on the machine."] %}
  {% task id="task-395d8a3402d2" legacyIndex=1 title="LXD UI: create the project" %}
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

  {% task id="task-95b892a418f1" legacyIndex=2 title="LXD UI: switch to it" %}
    Click **Create**, then switch the selector to **rhce**. Stay in it from now on.
  {% /task %}

  {% task id="task-66946060e8e1" legacyIndex=3 title="Host: make the command line use it too" %}
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
| `users:` / `chpasswd:` | Creates `student` (with sudo) and sets root's password |
| `packages:` | Manual pages and everyday tools, LVM, tar and rsync for the storage and transfer chapters, a nicer vim, plus the SELinux policy, firewalld and chrony a RHEL server has |
| `runcmd:` + `preserve_hostname` | Sets the full hostname from the VM name, e.g. `servera.lab.example.com`, and keeps it after reboots. Also switches on firewalld and chrony, and keeps `lxc exec` working under SELinux |
| `power_state:` | Reboots once after the first boot, so SELinux labels the disk and starts in enforcing mode |
| `devices:` | A 20 GiB system disk and a network card on `rhcebr0` |

{% lab
  objectives=["ch01.lab-network","ch01.lab-machines","ch01.lab-tools","ch01.lab-reset"]
  id="profile"
  title="Phase 06 · Set up the lab profile (~10 min)"
  hosts=["LXD UI"]
  outcomes=["Make every new VM boot with the lab users, packages and hostname."] %}
  {% task id="task-938be991b9a3" legacyIndex=1 title="LXD UI: open the profile editor" %}
    Project **rhce** → **Profiles** → **default** → **Configuration** → **YAML configuration** → **Edit profile**.
  {% /task %}

  {% task id="task-2890ff76686e" legacyIndex=2 title="LXD UI: replace everything and save" %}
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
    ssh_pwauth: true                  # VM-to-VM password SSH
    preserve_hostname: true           # keep the FQDN set below across reboots
    users:
      - name: student
        gecos: Student User
        groups: [wheel]               # wheel = sudo with password
        shell: /bin/bash
        lock_passwd: false
        plain_text_passwd: student
    chpasswd:
      expire: false
      users:
        - name: root
          password: redhat
          type: text
    timezone: UTC                     # or your own, e.g. Europe/London
    packages:
      - python3
      - vim-enhanced
      - bash-completion
      - man-db                        # manual pages for the help chapter
      - man-pages
      - tree
      - tmux
      - lsof
      - nano
      - bind-utils                    # dig and host, for the networking chapter
      - lvm2
      - tar
      - rsync
      - selinux-policy-targeted       # the image ships without SELinux; RHEL runs it enforcing
      - policycoreutils-python-utils  # semanage and friends
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
    The Rocky cloud image comes with SELinux switched off, but RHEL runs it in **enforcing** mode, and a later chapter is about SELinux. Installing the policy turns it on after one reboot. In enforcing mode SELinux would also block the LXD agent that `lxc exec` talks to; the `semanage fcontext` line labels the agent as a normal program so it keeps working. Nothing else is relaxed.
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
  outcomes=["Give servera and serverb an empty 5 GiB disk each for the partition, LVM, file system and NFS exercises."] %}
  {% task id="task-3c482cdb8850" legacyIndex=1 title="LXD UI: create two block volumes" %}
    Twice, for `servera-disk2` and `serverb-disk2`: **Storage** → **Volumes** → **Create volume**.

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
