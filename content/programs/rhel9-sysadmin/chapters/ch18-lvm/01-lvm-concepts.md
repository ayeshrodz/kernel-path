---
title: "Logical volumes: why and how"
seoTitle: "LVM Tutorial: pvcreate, vgcreate and lvcreate"
description: "How LVM works and how to build physical volumes, volume groups and logical volumes. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 20
---

{% lead %}
A partition has a fixed size, chosen on the day you create it, and that size is wrong sooner or later. The log partition fills up, the data partition is too big, a second disk has spare room that you cannot use. **LVM** (the Logical Volume Manager) puts a flexible layer between the disks and the file systems: you pool storage, carve out volumes of any size, and resize them later, often while they are in use.
{% /lead %}

{% objectives %}
- Describe the LVM layers (physical volume, volume group, logical volume) and what each is for.
- Create a physical volume, a volume group and logical volumes, and put a file system on them.
- Inspect LVM with `pvs`, `vgs`, `lvs` and the `display` commands, and find the device names.
{% /objectives %}

## Three words to learn

{% diagram ref="stack" /%}

- A **physical volume (PV)** is a disk or partition prepared for LVM.
- A **volume group (VG)** is a pool of storage assembled from PVs.
- A **logical volume (LV)** is a slice of the pool that you use like a partition.

The pool is divided in fixed-size **physical extents** (4 MiB by default). Every size you ask for is rounded to whole extents.

## Building it

{% diagram ref="build" /%}

First give LVM something to work with. Partition the spare disk with partitions flagged for LVM (a whole disk works too):

```console
[root@servera ~]# parted -s /dev/sdb mklabel gpt mkpart pv1 1MiB 1537MiB mkpart pv2 1537MiB 3073MiB set 1 lvm on set 2 lvm on
[root@servera ~]# udevadm settle; lsblk /dev/sdb
NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS
sdb      8:16   0    5G  0 disk
├─sdb1   8:17   0  1.5G  0 part
└─sdb2   8:18   0  1.5G  0 part
```

Then the three layers:

```console
[root@servera ~]# pvcreate /dev/sdb1
  Physical volume "/dev/sdb1" successfully created.
[root@servera ~]# vgcreate vgdata /dev/sdb1
  Volume group "vgdata" successfully created
[root@servera ~]# lvcreate -n lvapp -L 1G vgdata
  Logical volume "lvapp" created.
[root@servera ~]# lvcreate -n lvlog -l 50%FREE vgdata
  Logical volume "lvlog" created.
```

`-n` names the volume. `-L` gives a size (`1G`, `500M`); `-l` gives a number of extents or a percentage (`50%FREE` is half of the free space, `100%FREE` all of it). If the disk held an old file system, `lvcreate` shows *"WARNING: xfs signature detected … Wipe it? [y/n]"*: answer `y` when you are sure the old data is not needed (or add `-y`).

Look at the result with the three summary commands:

```console
[root@servera ~]# pvs
  PV         VG     Fmt  Attr PSize  PFree
  /dev/sdb1  vgdata lvm2 a--  <1.50g 256.00m
[root@servera ~]# vgs
  VG     #PV #LV #SN Attr   VSize  VFree
  vgdata   1   2   0 wz--n- <1.50g 256.00m
[root@servera ~]# lvs
  LV    VG     Attr       LSize   Pool Origin Data%  Meta%  Move Log Cpy%Sync Convert
  lvapp vgdata -wi-a-----   1.00g
  lvlog vgdata -wi-a----- 252.00m
```

`pvs`, `vgs` and `lvs` give one line per object; `pvdisplay`, `vgdisplay` and `lvdisplay` give the full detail. The `a` in the `lvs` Attr column means the volume is active; `o` marks one that is open (mounted).

## Using the volume

An LV appears as a device, under two names that point to the same place:

```console
[root@servera ~]# ls -l /dev/vgdata/
lrwxrwxrwx. 1 root root 7 Oct  3 18:33 lvapp -> ../dm-0
lrwxrwxrwx. 1 root root 7 Oct  3 18:33 lvlog -> ../dm-1
[root@servera ~]# ls -l /dev/mapper/ | grep vgdata
lrwxrwxrwx. 1 root root       7 Oct  3 18:33 vgdata-lvapp -> ../dm-0
lrwxrwxrwx. 1 root root       7 Oct  3 18:33 vgdata-lvlog -> ../dm-1
```

From here it is the same as for a partition (previous chapter): make a file system and mount it. `df` shows the `/dev/mapper/…` name.

```console
[root@servera ~]# mkfs.xfs /dev/vgdata/lvapp > /dev/null
[root@servera ~]# mkdir -p /srv/app; mount /dev/vgdata/lvapp /srv/app
[root@servera ~]# df -hT /srv/app
Filesystem               Type  Size  Used Avail Use% Mounted on
/dev/mapper/vgdata-lvapp xfs   960M   39M  922M   5% /srv/app
```

The XFS file system is 960 MiB: a 1 GiB volume, less the space the file system keeps for itself. `lsblk -f` shows the whole stack at a glance, with the LVs below their PV.

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch18.concepts"] ref="quick" /%}
