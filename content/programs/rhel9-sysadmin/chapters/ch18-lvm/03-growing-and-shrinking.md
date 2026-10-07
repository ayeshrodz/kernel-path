---
title: "Growing and shrinking volumes"
seoTitle: "lvextend and lvreduce: Resize LVM Volumes"
description: "Extend logical volumes and their file systems online with lvextend -r, and shrink ext4 safely. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 25
---

{% lead %}
This is the reason LVM exists. When a volume fills up you do not move data around or reinstall: you give the volume more space, and the file system on top of it grows with it, usually while it is mounted and in use. Shrinking is possible too, but with more care, and not for every file system.
{% /lead %}

{% objectives %}
- Grow a logical volume and its file system in one command with `lvextend -r`, and know what that command does underneath.
- Add a disk to a volume group when it has no free space left.
- Shrink an ext4 volume safely, and explain why XFS cannot shrink.
{% /objectives %}

## Growing

{% diagram ref="grow-flow" /%}

Ask for more than the group has, and LVM tells you:

```console
[root@servera ~]# lvextend -L +1G /dev/vgdata/lvapp
  Insufficient free space: 256 extents needed, but only 64 available
[root@servera ~]# vgs
  VG     #PV #LV #SN Attr   VSize  VFree
  vgdata   1   2   0 wz--n- <1.50g 256.00m
```

(Only 64 extents because 256 MiB is 64 extents of 4 MiB.) Add a disk to the pool: prepare it as a PV and add it to the group.

```console
[root@servera ~]# pvcreate /dev/sdb2
  Physical volume "/dev/sdb2" successfully created.
[root@servera ~]# vgextend vgdata /dev/sdb2
  Volume group "vgdata" successfully extended
[root@servera ~]# vgs
  VG     #PV #LV #SN Attr   VSize VFree
  vgdata   2   2   0 wz--n- 2.99g <1.75g
```

Now extend the volume. The size is absolute (`-L 2G`) or relative (`-L +512M`), and `-r` (`--resizefs`) also grows the file system:

```console
[root@servera ~]# lvextend -r -L +512M /dev/vgdata/lvapp
  Size of logical volume vgdata/lvapp changed from 1.00 GiB (256 extents) to 1.50 GiB (384 extents).
  Logical volume vgdata/lvapp successfully resized.
meta-data=/dev/mapper/vgdata-lvapp isize=512    agcount=4, agsize=65536 blks
...output omitted...
  Extended file system xfs on vgdata/lvapp.
[root@servera ~]# df -h /srv/app | tail -1
/dev/mapper/vgdata-lvapp  1.5G   43M  1.4G   3% /srv/app
```

To hand over *all* the remaining free space: `lvextend -r -l +100%FREE /dev/vgdata/lvapp`.

### What -r really does

Without `-r`, only the volume grows; the file system still thinks it has the old size:

```console
[root@servera ~]# lvextend -L +512M /dev/vgdata/lvapp
[root@servera ~]# df -h /srv/app | tail -1          # unchanged
/dev/mapper/vgdata-lvapp  960M   39M  922M   5% /srv/app
[root@servera ~]# xfs_growfs /srv/app               # grow the file system to fill the volume
[root@servera ~]# df -h /srv/app | tail -1
/dev/mapper/vgdata-lvapp  1.5G   43M  1.4G   3% /srv/app
```

`xfs_growfs` takes the **mount point**; for ext4 the tool is `resize2fs /dev/vgdata/lvlog`. `-r` runs the right one for you.

## Shrinking

{% diagram ref="fs-resize" /%}

ext4 can be shrunk, but only unmounted, and the file system must be made smaller **before** the volume. `lvreduce -r` does the sequence correctly (check, shrink the file system, shrink the volume):

```console
[root@servera ~]# umount /srv/log
[root@servera ~]# lvreduce -r -L 200M /dev/vgdata/lvlog
resize2fs done
  Reduced file system ext4 on vgdata/lvlog.
  Size of logical volume vgdata/lvlog changed from 508.00 MiB (127 extents) to 200.00 MiB (50 extents).
  Logical volume vgdata/lvlog successfully resized.
```

(It asks to run a file system check first if you have not; run `e2fsck -f /dev/vgdata/lvlog` and try again.) The new size must still hold your data: ask for less than the used space and the command refuses. **Always back up first**, because a mistake while shrinking destroys data.

XFS cannot be shrunk at all:

```console
[root@servera ~]# lvreduce -L 500M /dev/vgdata/lvapp
  File system size (<2.50 GiB) is larger than the requested size (500.00 MiB).
  File system reduce is required and not supported (xfs).
```

To make an XFS volume smaller you create a new smaller volume, copy the data (chapter 14), and remove the old one. That is one reason to choose volume sizes thoughtfully, and to prefer starting small and growing.

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch18.resize"] ref="quick" /%}
