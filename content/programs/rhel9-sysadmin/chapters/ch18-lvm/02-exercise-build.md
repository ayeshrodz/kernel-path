---
title: "Exercise: Build your first volume group"
seoTitle: "Build your first volume group (RHCSA Practice Exercise)"
description: "Hands-on RHCSA practice: build your first volume group. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 25
---

{% lead %}
Prepare two partitions of the spare disk for LVM, build a volume group on the first, cut two logical volumes from it, put file systems on them, and mount them. You use the second partition in the next exercise.
{% /lead %}

{% lab
  objectives=["ch18.concepts"]
  id="build"
  title="Build your first volume group"
  exercise="sa-lvm-build"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera"]
  outcomes=["Create PV, VG and LVs with the lvm tools.","Make and mount file systems on logical volumes.","Read pvs, vgs, lvs and lsblk -f."] %}

  {% task id="task-934bbfeee5c4" title="Start the exercise" %}
    On workstation, start the exercise. It clears the spare disk `/dev/sdb` of servera and creates two 1.5 GiB LVM partitions on it (`sdb1` and `sdb2`).

```console
[student@workstation ~]$ lab start sa-lvm-build
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-d6d2124a23eb" title="Physical volume and volume group" %}
    Make `/dev/sdb1` a physical volume, create a volume group `vgdata` on it, and look at both. How big is the pool, and how big is one extent?

    {% reveal title="Show solution" %}

```console
[root@servera ~]# pvcreate /dev/sdb1
  Physical volume "/dev/sdb1" successfully created.
[root@servera ~]# vgcreate vgdata /dev/sdb1
  Volume group "vgdata" successfully created
[root@servera ~]# pvs; vgs
  PV         VG     Fmt  Attr PSize  PFree
  /dev/sdb1  vgdata lvm2 a--  <1.50g <1.50g
  VG     #PV #LV #SN Attr   VSize  VFree
  vgdata   1   0   0 wz--n- <1.50g <1.50g
[root@servera ~]# vgdisplay vgdata | grep -E "VG Name|PE Size|Total PE|Free  PE"
  VG Name               vgdata
  PE Size               4.00 MiB
  Total PE              383
  Free  PE / Size       383 / <1.50 GiB
```

    383 extents of 4 MiB make about 1.5 GiB; all of it is free for now.
    {% /reveal %}
  {% /task %}

  {% task id="task-30b5798e970a" title="Two logical volumes" %}
    Create `lvapp` with exactly 1 GiB and `lvlog` with half of the remaining free space. How many extents did the first one use?

    {% reveal title="Show solution" %}

```console
[root@servera ~]# lvcreate -n lvapp -L 1G vgdata
  Logical volume "lvapp" created.
[root@servera ~]# lvcreate -n lvlog -l 50%FREE vgdata
  Logical volume "lvlog" created.
[root@servera ~]# lvs
  LV    VG     Attr       LSize   Pool Origin Data%  Meta%  Move Log Cpy%Sync Convert
  lvapp vgdata -wi-a-----   1.00g
  lvlog vgdata -wi-a----- 252.00m
[root@servera ~]# lvdisplay /dev/vgdata/lvapp | grep -E "LV Path|LV Size|Current LE"
  LV Path                /dev/vgdata/lvapp
  LV Size                1.00 GiB
  Current LE             256
```

    1 GiB is 256 extents of 4 MiB. `lvlog` got half of the 128 free extents (after rounding): 252 MiB.
    {% /reveal %}
  {% /task %}

  {% task id="task-835afb228035" title="File systems and mounts" %}
    Put XFS on `lvapp` and ext4 (labelled `lvlog`) on `lvlog`. Mount them on `/srv/app` and `/srv/log` and look at the stack with `lsblk -f`.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# mkfs.xfs /dev/vgdata/lvapp > /dev/null
[root@servera ~]# mkfs.ext4 -L lvlog /dev/vgdata/lvlog > /dev/null 2>&1
[root@servera ~]# mkdir -p /srv/app /srv/log
[root@servera ~]# mount /dev/vgdata/lvapp /srv/app; mount /dev/vgdata/lvlog /srv/log
[root@servera ~]# df -hT /srv/app /srv/log
Filesystem               Type  Size  Used Avail Use% Mounted on
/dev/mapper/vgdata-lvapp xfs   960M   39M  922M   5% /srv/app
/dev/mapper/vgdata-lvlog ext4  231M   14K  214M   1% /srv/log
[root@servera ~]# lsblk -f /dev/sdb
NAME             FSTYPE      FSVER    LABEL UUID                                   FSAVAIL FSUSE% MOUNTPOINTS
sdb
├─sdb1           LVM2_member LVM2 001       szSYh8-2qWE-pjM9-cQRG-MO8E-ze5d-9j7wK0
│ ├─vgdata-lvapp xfs                        c65e2645-aa4a-4f9b-8948-82338ebafd2f      921M     4% /srv/app
│ └─vgdata-lvlog ext4        1.0      lvlog c14a3b27-87ec-4cec-8337-e7b9e8fc65a5    213.5M     0% /srv/log
└─sdb2
```

    `sdb1` shows as `LVM2_member` with the two volumes nested below it, and each LV has its own file system and UUID.
    {% /reveal %}
  {% /task %}

  {% task id="task-158c8bb0828b" title="Use the volumes" %}
    Write a file into each volume and check the names of the device files of `lvapp` under `/dev`.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# echo hello > /srv/app/a.txt; echo world > /srv/log/b.txt
[root@servera ~]# ls -l /dev/vgdata/lvapp /dev/mapper/vgdata-lvapp
lrwxrwxrwx. 1 root root 7 Oct  3 18:33 /dev/mapper/vgdata-lvapp -> ../dm-0
lrwxrwxrwx. 1 root root 7 Oct  3 18:33 /dev/vgdata/lvapp -> ../dm-0
```

    Two names, one device (`dm-0`, a "device mapper" volume). Leave everything mounted for the next exercise.
    {% /reveal %}
  {% /task %}

  {% task id="task-74c98e500cd0" title="Grade and finish" %}
    {% lab-finish exercise="sa-lvm-build" grade=true servers=true /%}
  {% /task %}
{% /lab %}
