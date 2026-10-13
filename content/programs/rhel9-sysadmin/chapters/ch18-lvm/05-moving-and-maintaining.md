---
title: "Replacing disks and everyday maintenance"
seoTitle: "pvmove, vgreduce and LVM Maintenance"
description: "Replace a disk without downtime with pvmove, rename volumes and put LVM mounts in fstab. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 20
---

{% lead %}
Disks age, fill up and get replaced. With plain partitions that means downtime and copying. With LVM you can move the data from an old disk to a new one while the volume is mounted and in use, then remove the old disk from the pool. This lesson covers that move, plus the everyday commands: renaming and removing volumes, using a volume for swap, and making volumes permanent in `/etc/fstab`.
{% /lead %}

{% objectives %}
- Replace a physical volume without downtime with `vgextend`, `pvmove`, `vgreduce` and `pvremove`.
- Rename and remove logical volumes, and remove a volume group safely.
- Make LVM mounts and swap permanent in `/etc/fstab`.
{% /objectives %}

## Moving data off a disk

{% diagram ref="pvmove" /%}

```console
[root@servera ~]# lvs -o lv_name,devices vgdata
  LV     Devices
  lvdata /dev/sdb1(0)
[root@servera ~]# pvcreate /dev/sdb2; vgextend vgdata /dev/sdb2
  Volume group "vgdata" successfully extended
[root@servera ~]# pvmove /dev/sdb1 /dev/sdb2
  /dev/sdb1: Moved: 30.50%
  /dev/sdb1: Moved: 100.00%
[root@servera ~]# lvs -o lv_name,devices vgdata
  LV     Devices
  lvdata /dev/sdb2(0)
[root@servera ~]# vgreduce vgdata /dev/sdb1
  Removed "/dev/sdb1" from volume group "vgdata"
[root@servera ~]# pvremove /dev/sdb1
  Labels on physical volume "/dev/sdb1" successfully wiped.
```

The `Devices` column shows where each extent lives: `/dev/sdb1(0)` means "starting at extent 0 of sdb1". `pvmove` needs enough free extents on the target; if there are not, it fails with *Insufficient free space* and nothing is changed. The volume stays usable during the move. The order matters: **move first, then reduce, then remove**. If you take a PV out of a group while it still holds data, `vgreduce` refuses (or, with `--removemissing` after the disk has really failed, the affected volumes are lost).

## Everyday maintenance

| Task | Command |
| --- | --- |
| Rename a volume | `lvrename vgdata lvdata lvstore` |
| Remove a volume (destroys its data) | `umount DIR; lvremove vgdata/lvstore` (asks to confirm; `-y` skips) |
| Remove an empty group | `vgremove vgdata` |
| Show where each LV lives | `lvs -o +devices` |
| Show the device path | `lvs -o +lv_path` |

After renaming, fix every place that uses the old name, above all `/etc/fstab`. A line that uses `UUID=` is not affected, which is one more reason for UUIDs.

## Making volumes permanent

The device path `/dev/VG/LV` is stable, so an fstab line can use it directly (or the UUID that `blkid` shows):

```console
[root@servera ~]# cp /etc/fstab /root/fstab.bak
[root@servera ~]# echo "/dev/vgdata/lvstore  /srv/data  xfs  defaults  0 0" >> /etc/fstab
[root@servera ~]# systemctl daemon-reload
[root@servera ~]# findmnt --verify | tail -1
0 parse errors, 0 errors, 1 warning
[root@servera ~]# mount -a && df -h /srv/data | tail -1
/dev/mapper/vgdata-lvstore  736M   38M  699M   6% /srv/data
```

Never use the `/dev/dm-N` names: they can change between boots. Volumes activate automatically at boot; if one does not, see the next lesson.

### Swap on a volume

Swap space works the same as on a partition, and a volume is easy to prepare:

```console
[root@servera ~]# lvcreate -n lvswap -L 256M vgdata
  Logical volume "lvswap" created.
[root@servera ~]# mkswap /dev/vgdata/lvswap
Setting up swapspace version 1, size = 256 MiB (268431360 bytes)
[root@servera ~]# echo "/dev/vgdata/lvswap  none  swap  defaults  0 0" >> /etc/fstab
[root@servera ~]# systemctl daemon-reload; swapon -a; swapon --show
NAME      TYPE      SIZE USED PRIO
/dev/dm-1 partition 256M   0B   -2
```

The list shows the kernel name (`/dev/dm-1`), but the fstab line uses the stable path. A swap volume cannot be resized in place: turn it off, extend it, run `mkswap` again, and turn it on.

{% callout type="warning" title="LVM is flexibility, not a backup" %}
Spanning volumes over several disks without redundancy means that the loss of one disk can lose the whole volume. LVM can mirror (`--type raid1`) and take snapshots (`lvcreate -s`), but neither replaces a real backup (chapter 14).
{% /callout %}

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch18.maintenance"] ref="quick" /%}
