---
title: "Exercise: Managing storage"
seoTitle: "Managing storage (RHCE Practice Exercise)"
description: "Hands-on RHCE practice: managing storage. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 20
---

{% lead %}
The web servers need separate file systems for their content and their logs. You will build both with the storage system role, from one variable, and then inspect the result: physical volume, volume group, logical volumes, mounts and `/etc/fstab`.
{% /lead %}

The project `~/system-storage` has an `ansible.cfg`, an `inventory` with servera in `webservers`, a playbook `get-storage.yml` that reports on storage, and the system roles collection archive.

{% lab
  objectives=["ch10.storage"]
  id="storage"
  title="Managing storage"
  exercise="system-storage"
  hosts=["workstation","servera.lab.example.com"]
  outcomes=["Use the storage system role to create, format and persistently mount LVM volumes."] %}
{% lab-notes %}

**Prerequisites:** Complete [control-node setup](#/ch01/control-node) and the preceding lessons in this chapter. Run commands as student on workstation unless a step names another machine.

{% reveal title="Verify your work" %}

From the project directory, run the relevant home-lab check. For an exercise with several checkpoints, grade each state before changing or removing it:

```bash
lab grade system-storage
```

The grader reads project files and host state. A passing report covers the listed checks; also perform the task’s independent connection, repeat-run, and reboot checks where requested.

{% /reveal %}

{% reveal title="Try an independent variation" %}

After a clean VM and data-volume reset, choose different volume names and update the mount verification.

Record the published result first. The grader checks the original requirements, so a changed name or value may intentionally fail those checks.

{% /reveal %}

{% /lab-notes %}

{% lab-challenge %}

Provide persistent, separate web-content and web-log filesystems on servera using `storage.yml` and the storage system role.

- Use the confirmed empty extra disk: `/dev/sdb` at home, `/dev/vdb` in the classroom. Preserve the root disk.
- Volume group `apache-vg` must contain `content-lv` (512 MiB) and `logs-lv` (768 MiB), both XFS.
- Mount them persistently on `/var/www` and `/var/log/httpd` respectively.
- Verify every storage layer, repeat without unintended changes, and check mounts after an explicit reboot.

{% /lab-challenge %}

  {% lab-setup variant="homelab" %}
    The spare disk in the home lab is `/dev/sdb`, not `/dev/vdb`: use `sdb` wherever the steps say `vdb`. `lab start system-storage` packages the system roles collection installed on workstation as `redhat-rhel_system_roles-1.120.5.tar.gz` (your version may differ).
  {% /lab-setup %}

  {% task id="task-bd8a6fcdf7e1" legacyIndex=1 title="The requirements" %}
    On servera:

    - `/dev/vdb` is the physical volume of a volume group `apache-vg`,
    - two logical volumes in it: `content-lv`, 512 MiB, and `logs-lv`, 768 MiB,
    - both formatted with XFS,
    - `content-lv` mounted persistently on `/var/www`, and `logs-lv` on `/var/log/httpd`.
  {% /task %}

  {% task id="task-7652cdac8b30" legacyIndex=2 title="Install the collection into the project" %}

```console
[student@workstation ~]$ cd ~/system-storage
[student@workstation system-storage]$ ansible-galaxy collection install \
> ./redhat-rhel_system_roles-1.120.5.tar.gz -p collections
...output omitted...
redhat.rhel_system_roles:1.120.5 was installed successfully
```
  {% /task %}

  {% task id="task-2f8f26f62b7c" legacyIndex=3 title="Describe the storage" %}
    Create `storage.yml`. One play for `webservers` applies the storage role, with a `storage_pools` entry for the volume group and its two volumes:

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

    The variables are passed as role parameters. On older cores, role variables can also be visible elsewhere in the play; use names prefixed for the role to avoid collisions. There is no task for the physical volume, the file systems or `/etc/fstab`: the role works those out from the description.
  {% /task %}

  {% task id="task-732a0b8b3f0e" legacyIndex=4 title="Run it" %}

```console
[student@workstation system-storage]$ ansible-navigator run -m stdout storage.yml
...output omitted...
TASK [redhat.rhel_system_roles.storage : Make sure blivet is available] ********
changed: [servera.lab.example.com]
...output omitted...
TASK [redhat.rhel_system_roles.storage : Set up new/current mounts] ************
changed: [servera.lab.example.com] => (item={'src': '/dev/mapper/apache--vg-content--lv', 'path': '/var/www', 'fstype': 'xfs', 'opts': 'defaults', 'dump': 0, 'passno': 0, 'state': 'mounted', ...})
changed: [servera.lab.example.com] => (item={'src': '/dev/mapper/apache--vg-logs--lv', 'path': '/var/log/httpd', 'fstype': 'xfs', 'opts': 'defaults', 'dump': 0, 'passno': 0, 'state': 'mounted', ...})
...output omitted...
PLAY RECAP *********************************************************************
servera.lab.example.com    : ok=24   changed=4    unreachable=0    failed=0    skipped=13  ...
```

    The role first installs `blivet`, the storage library it works with, then builds the stack. Run it again: `changed=0`.
  {% /task %}

  {% task id="task-ec6316ec4ff3" legacyIndex=5 title="Inspect the result" %}

```console
[student@workstation system-storage]$ ansible-navigator run -m stdout get-storage.yml
...output omitted...
TASK [Display physical volumes] ************************************************
ok: [servera.lab.example.com] => {
    "msg": [
        "  PV         VG        Fmt  Attr PSize  PFree ",
        "  /dev/sdb   apache-vg lvm2 a--  <5.00g <3.75g"
    ]
}
...output omitted...
TASK [Display logical volumes] *************************************************
ok: [servera.lab.example.com] => {
    "msg": [
        "  LV         VG        Attr       LSize   Pool Origin Data%  Meta%  Move Log Cpy%Sync Convert",
        "  content-lv apache-vg -wi-ao----  512.00m                                                    ",
        "  logs-lv    apache-vg -wi-ao---- 768.00m                                                    "
    ]
}
...output omitted...
TASK [Display mounted logical volumes] *****************************************
ok: [servera.lab.example.com] => {
    "msg": [
        "/dev/mapper/apache--vg-content--lv on /var/www type xfs (rw,relatime,seclabel,attr2,inode64,logbufs=8,logbsize=32k,noquota)",
        "/dev/mapper/apache--vg-logs--lv on /var/log/httpd type xfs (rw,relatime,seclabel,attr2,inode64,logbufs=8,logbsize=32k,noquota)"
    ]
}
...output omitted...
TASK [Display /etc/fstab contents] *********************************************
ok: [servera.lab.example.com] => {
    "msg": [
...output omitted...
        "# system_role:storage",
        "/dev/mapper/apache--vg-content--lv /var/www xfs defaults 0 0",
        "/dev/mapper/apache--vg-logs--lv /var/log/httpd xfs defaults 0 0"
    ]
}
```

    The disk sizes depend on your lab. Every layer is there, and the mounts are in `/etc/fstab`, marked by the role.
  {% /task %}

  {% task id="task-692a1b272348" legacyIndex=6 title="Finish" %}
    {% lab-finish exercise="system-storage" /%}
  {% /task %}
{% /lab %}

## Try it again, differently

Grow `content-lv` to 1024 MiB by changing its `size` and running the play again, then check with `df -h /var/www`. Then add a third volume, `swap-lv`, 64 MiB, with `fs_type: swap`, and look at `swapon --show` on servera.
