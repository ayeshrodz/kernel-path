---
title: "When LVM does not behave"
seoTitle: "LVM Troubleshooting: Inactive and Missing Volumes"
description: "Fix common LVM problems: inactive volumes, full volume groups, busy devices and missing disks. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 15
---

{% lead %}
LVM problems announce themselves in a few recognisable ways: a volume that "does not exist" although you can see it with `lvs`, a request for more space than the group has, a disk that LVM does not seem to know, or a command that refuses because something is still using a volume. Each has a short first check. This lesson collects them.
{% /lead %}

{% objectives %}
- Recognise an inactive volume and activate it.
- Diagnose "Insufficient free space", "in use" and missing-device messages.
- Use the LVM devices file and the metadata backups.
{% /objectives %}

## Symptoms and first checks

{% diagram ref="symptoms" /%}

## A volume that exists but cannot be mounted

```console
[root@servera ~]# lvs
  LV      VG     Attr       LSize   Pool Origin Data%  Meta%  Move Log Cpy%Sync Convert
  lvstore vgdata -wi------- 800.00m
[root@servera ~]# mount /dev/vgdata/lvstore /srv/data
mount: /srv/data: special device /dev/vgdata/lvstore does not exist.
```

Read the `Attr` column: the fifth character is `a` for **active** and `-` for inactive. This volume is defined but not active, so it has no device file. Activate it, and mount:

```console
[root@servera ~]# lvchange -ay vgdata/lvstore
[root@servera ~]# lvs | tail -1
  lvstore vgdata -wi-a----- 800.00m
[root@servera ~]# mount /dev/vgdata/lvstore /srv/data; df -h /srv/data | tail -1
/dev/mapper/vgdata-lvstore  736M   38M  699M   6% /srv/data
```

`vgchange -ay vgdata` activates all volumes of a group, and `lvchange -an` / `vgchange -an` deactivate (they fail with *"Can't deactivate volume group … with 1 open logical volume"* while a volume is mounted or in use: unmount it, check `fuser -vm`). Normally everything activates at boot; an inactive volume after boot usually means someone deactivated it or a PV was missing.

## Devices LVM knows about

RHEL 9 restricts LVM to the devices listed in a **devices file**, so that LVM does not grab disks that belong to virtual machines or other systems. A disk you prepared on another machine, or restored, might not be listed:

```console
[root@servera ~]# lvmdevices
  Device /dev/sdb2 IDTYPE=sys_serial IDNAME=lxd_disk2 DEVNAME=/dev/sdb2 PVID=TE9QQZYSY9GIHgALd0VLJHgpgzQjW0Ql PART=2
[root@servera ~]# lvmdevices --adddev /dev/sdc1       # allow a disk
[root@servera ~]# pvs -a                              # also lists devices that are not PVs
```

`pvcreate` adds a disk for you. If a PV or group that should be there is missing from `pvs`/`vgs`, check that the disk is present (`lsblk`), check the devices file, and rescan with `pvscan` and `vgscan`.

## Space

*Insufficient free space: N extents needed* means the group is smaller than your request. `vgs` shows `VFree`; the cure is `vgextend` with a new PV, a smaller request, or removing an LV you no longer need. Mind that extending needs **extents in the group**, not free space inside the file system, and that shrinking needs a file system that supports it.

## Metadata backups

Every change to the layout is saved:

```console
[root@servera ~]# ls /etc/lvm/archive | head -3
vgdata_00000-866095140.vg
vgdata_00001-2106163768.vg
vgdata_00002-1759817119.vg
[root@servera ~]# vgcfgbackup vgdata
  Volume group "vgdata" successfully backed up.
```

`/etc/lvm/backup` holds the latest copy for each group, and `/etc/lvm/archive` the history. `vgcfgrestore` can restore a layout (for example after an accidental `lvremove`, if nothing has overwritten the extents since). It is a safety net for the *layout*, not for your files: the data still needs real backups.

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch18.troubleshooting"] ref="quick" /%}
