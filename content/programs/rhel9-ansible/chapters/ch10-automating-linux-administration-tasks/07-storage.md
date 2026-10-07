---
title: Managing storage
seoTitle: "Ansible LVM and File System Automation (lvg, lvol)"
description: "Partition disks, create LVM volumes and file systems and mount them with Ansible modules. Free RHCE (EX294) lesson with diagrams and practice."
kind: lesson
minutes: 12
---

{% lead %}
Giving an application its own file system is a stack of small jobs: partition a disk, make a volume group, carve out a logical volume, create a file system, mount it. Each has its own module, and each is idempotent, so the same play can also grow the volume later.
{% /lead %}

{% objectives %}
- Partition a disk with `community.general.parted`.
- Create LVM volume groups and logical volumes, and resize them.
- Create file systems and mount them persistently.
- Use device facts to decide what to do.
{% /objectives %}

## The storage stack

Step through the layers from a blank disk to a mounted file system:

{% diagram ref="storage-stack" /%}

{% variant name="homelab" title="The spare disk is sdb" %}
The lab VMs' spare disk is `/dev/sdb`; on many virtual machines it would be `/dev/vdb`. The storage modules live in `community.general` and `ansible.posix`, both installed on workstation.
{% /variant %}

## Two ways to do it

There are two ways to build that stack with Ansible:

- the **storage system role**, `redhat.rhel_system_roles.storage`, which takes a description of the result you want and works out every step, and is supported by Red Hat;
- one **module per layer**: `parted`, `lvg`, `lvol`, `filesystem` from `community.general` and `mount` from `ansible.posix`. These give finer control (partitions, exact options) but are community modules.

## The storage system role

The role supports two layouts: a file system directly on a whole, unpartitioned disk, and LVM with whole unpartitioned disks as physical volumes. You describe them in two variables.

`storage_volumes` puts a file system on a whole disk:

```yaml
- name: Extra disk for /opt/extra
  hosts: all
  roles:
    - name: redhat.rhel_system_roles.storage
      storage_volumes:
        - name: extra
          type: disk
          disks:
            - /dev/vdg
          fs_type: xfs
          mount_point: /opt/extra
```

`storage_pools` builds a volume group and logical volumes in it:

```yaml
- name: LVM on the spare disk
  hosts: all
  roles:
    - name: redhat.rhel_system_roles.storage
      storage_pools:
        - name: vg01
          type: lvm
          disks:
            - /dev/vdb
          volumes:
            - name: lvol01
              size: 768m
              mount_point: "/data"
              fs_type: xfs
              state: present
            - name: lvol02
              size: 1024m
              mount_point: "/backup"
              fs_type: xfs
              state: present
```

The pool's `name` is the volume group; each volume's `name` is a logical volume. The role creates the physical volume, the group and the volumes, makes the file systems, and mounts them persistently. To grow a volume, increase its `size` and run the play again: the role grows the logical volume and its file system.

A swap volume is a logical volume with `fs_type: swap`; the role adds it to `/etc/fstab` and enables it:

```yaml
          volumes:
            - name: lvswap
              size: 512m
              fs_type: swap
              state: present
```

## Partitions

```yaml
- name: The disk has one partition for LVM
  community.general.parted:
    device: /dev/sdb
    number: 1
    label: gpt
    part_start: 1MiB
    part_end: 1GiB
    flags: [lvm]
    state: present
```

`number` identifies the partition; `part_end` (and `part_start`) set its size, as a size or a percentage such as `100%`. `label: gpt` creates a GPT partition table if the disk has none. Running the task again leaves an existing, matching partition alone.

## Volume groups and logical volumes

```yaml
- name: The volume group exists
  community.general.lvg:
    vg: apps
    pvs: /dev/sdb1

- name: The logical volume exists
  community.general.lvol:
    vg: apps
    lv: data
    size: 500m
    resizefs: true
```

`lvg` initialises the physical volumes and creates the group. `lvol` creates the logical volume, `/dev/apps/data`, and grows it if `size` is later larger. With `resizefs: true` it also grows the file system on it, online.

`size` accepts `500m`, `2g`, or a share of the group such as `100%FREE` or `50%VG`.

{% callout type="warning" title="Shrinking is different" %}
`lvol` refuses to shrink a volume with a file system unless you add `force: true`, and XFS cannot be shrunk at all. Plan sizes to grow.
{% /callout %}

## File systems and mounts

```yaml
- name: The logical volume has an XFS file system
  community.general.filesystem:
    dev: /dev/apps/data
    fstype: xfs

- name: The file system is mounted on /srv/data
  ansible.posix.mount:
    path: /srv/data
    src: /dev/apps/data
    fstype: xfs
    state: mounted
```

`filesystem` creates a file system only if the device has none; it never reformats unless you set `force: true`.

| `mount` `state` | Mounted now | In `/etc/fstab` |
| --- | --- | --- |
| `mounted` | Yes (creates the directory) | Yes |
| `present` | No | Yes |
| `unmounted` | No | Unchanged |
| `absent` | No | Removed |

`mounted` is what you want almost every time.

{% callout type="tip" title="Mount by UUID" %}
Device names can change between boots. For `src`, a UUID (`UUID=…`, from the facts or `blkid`) is the most robust. LVM paths such as `/dev/apps/data` are stable, which is one more reason to use LVM.
{% /callout %}

## Deciding from facts

Facts describe the disks and volumes, so a play can check before it acts:

```yaml
- name: Only when the spare disk exists
  community.general.parted:
    device: /dev/sdb
    number: 1
    state: present
  when: "'sdb' in ansible_facts['devices']"
```

Each entry of `ansible_facts['devices']` has the disk's `size`, `model`, `sectors` and `sectorsize`, and its `partitions`, each with a size of its own: `ansible_facts['devices']['sdb']['partitions']['sdb1']['size']`. `ansible_facts['lvm']['vgs']` lists volume groups with their free space.

`ansible_facts['mounts']` is a list of the mounted file systems, with their device, type, options, and free space in blocks:

```yaml
- name: Print free space on / file system
  ansible.builtin.debug:
    msg: >
      The root file system on {{ ansible_facts['fqdn'] }} has
      {{ item['block_available'] * item['block_size'] / 1000000 }}
      megabytes free.
  loop: "{{ ansible_facts['mounts'] }}"
  when: item['mount'] == '/'
```

{% quiz
  objectives=["ch10.storage"]
  id="check"
  title="Check your understanding"
  ref="check" /%}

## Takeaway

Partition a disk with `community.general.parted`. Use the chapter lab to check this on a real host.
