---
title: "Exercise: Grow and shrink volumes"
seoTitle: "Grow and shrink volumes (RHCSA Practice Exercise)"
description: "Hands-on RHCSA practice: grow and shrink volumes. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 30
---

{% lead %}
Run out of space on purpose, add a disk to the volume group, grow a mounted XFS volume and an ext4 volume while they hold data, and see what happens when you try to shrink each of them.
{% /lead %}

{% lab
  objectives=["ch18.resize"]
  id="resize"
  title="Grow and shrink volumes"
  exercise="sa-lvm-resize"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera"]
  outcomes=["Extend an LV and its file system online with lvextend -r.","Add a physical volume to a volume group.","Shrink ext4 and understand why XFS cannot shrink."] %}

  {% task id="task-554715ab948f" title="Start the exercise" %}
    On workstation, start the exercise. It builds the volume group `vgdata` on `/dev/sdb1` of servera with the volumes `lvapp` (1 GiB, XFS, `/srv/app`) and `lvlog` (ext4, `/srv/log`), the result of the previous exercise.

```console
[student@workstation ~]$ lab start sa-lvm-resize
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-576f1da0ffde" title="Start from the previous exercise" %}
    On servera as root, make sure `vgdata` with `lvapp` (xfs, `/srv/app`) and `lvlog` (ext4, `/srv/log`) exist and are mounted. Write a recognisable file into `/srv/app`.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ sudo -i
[root@servera ~]# vgs; lvs
  VG     #PV #LV #SN Attr   VSize  VFree
  vgdata   1   2   0 wz--n- <1.50g 256.00m
  LV    VG     Attr       LSize   Pool Origin Data%  Meta%  Move Log Cpy%Sync Convert
  lvapp vgdata -wi-ao----   1.00g
  lvlog vgdata -wi-ao---- 252.00m
[root@servera ~]# seq 1 100000 > /srv/app/numbers.txt; sha256sum /srv/app/numbers.txt | cut -c1-16
b2bc7d3f8b652d2e
```

    The checksum prefix lets you prove later that the data survived. If you reset the servers, repeat the previous exercise first.
    {% /reveal %}
  {% /task %}

  {% task id="task-4c0d756dc5ac" title="Ask for too much" %}
    Try to add 1 GiB to `lvapp`. Read the message and the free space.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# lvextend -L +1G /dev/vgdata/lvapp
  Insufficient free space: 256 extents needed, but only 64 available
[root@servera ~]# vgs
  VG     #PV #LV #SN Attr   VSize  VFree
  vgdata   1   2   0 wz--n- <1.50g 256.00m
```
    {% /reveal %}
  {% /task %}

  {% task id="task-059df39c39c6" title="Add the second disk" %}
    Turn `/dev/sdb2` into a PV and add it to `vgdata`. How much space is free now?

    {% reveal title="Show solution" %}

```console
[root@servera ~]# pvcreate /dev/sdb2
  Physical volume "/dev/sdb2" successfully created.
[root@servera ~]# vgextend vgdata /dev/sdb2
  Volume group "vgdata" successfully extended
[root@servera ~]# vgs; pvs
  VG     #PV #LV #SN Attr   VSize VFree
  vgdata   2   2   0 wz--n- 2.99g <1.75g
  PV         VG     Fmt  Attr PSize  PFree
  /dev/sdb1  vgdata lvm2 a--  <1.50g 256.00m
  /dev/sdb2  vgdata lvm2 a--  <1.50g  <1.50g
```
    {% /reveal %}
  {% /task %}

  {% task id="task-95fc50512e9f" title="Grow in two steps, then in one" %}
    Extend `lvapp` by 512 MiB **without** `-r` and compare `lvs` with `df`. Then grow the file system with `xfs_growfs`. Finally grow `lvlog` by 256 MiB with `-r` in a single command.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# lvextend -L +512M /dev/vgdata/lvapp
  Size of logical volume vgdata/lvapp changed from 1.00 GiB (256 extents) to 1.50 GiB (384 extents).
  Logical volume vgdata/lvapp successfully resized.
[root@servera ~]# lvs vgdata/lvapp | tail -1; df -h /srv/app | tail -1
  lvapp vgdata -wi-ao---- 1.50g
/dev/mapper/vgdata-lvapp  960M   39M  922M   5% /srv/app
[root@servera ~]# xfs_growfs /srv/app | head -2
meta-data=/dev/mapper/vgdata-lvapp isize=512    agcount=4, agsize=65536 blks
         =                       sectsz=512   attr=2, projid32bit=1
[root@servera ~]# df -h /srv/app | tail -1
/dev/mapper/vgdata-lvapp  1.5G   43M  1.4G   3% /srv/app
[root@servera ~]# lvextend -r -L +256M /dev/vgdata/lvlog | tail -2
  Extended file system ext4 on vgdata/lvlog.
  Logical volume vgdata/lvlog successfully resized.
[root@servera ~]# df -h /srv/log | tail -1
/dev/mapper/vgdata-lvlog  471M   14K  444M   1% /srv/log
```

    After the plain `lvextend`, `lvs` showed 1.5 GiB but `df` still 960 MiB; the file system only grew once told. `-r` combines the two steps.
    {% /reveal %}
  {% /task %}

  {% task id="task-ee4db26c170d" title="Use up the rest" %}
    Give all remaining free space to `lvapp`, with its file system. Check the data.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# lvextend -r -l +100%FREE /dev/vgdata/lvapp | tail -2
  Extended file system xfs on vgdata/lvapp.
  Logical volume vgdata/lvapp successfully resized.
[root@servera ~]# vgs; df -h /srv/app | tail -1; sha256sum /srv/app/numbers.txt | cut -c1-16
  VG     #PV #LV #SN Attr   VSize VFree
  vgdata   2   2   0 wz--n- 2.99g    0
/dev/mapper/vgdata-lvapp  2.5G   51M  2.4G   2% /srv/app
b2bc7d3f8b652d2e
```

    The group has no free space left, the volume is 2.5 GiB, and the checksum is unchanged: nothing was lost or unmounted.
    {% /reveal %}
  {% /task %}

  {% task id="task-5f9c3620e93d" title="Shrink ext4, fail to shrink XFS" %}
    Unmount `/srv/log`, shrink `lvlog` to 200 MiB with `lvreduce -r`, mount it again, and check the size. Then try to shrink `lvapp` to 500 MiB.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# umount /srv/log
[root@servera ~]# lvreduce -r -L 200M /dev/vgdata/lvlog
resize2fs done
  Reduced file system ext4 on vgdata/lvlog.
  Size of logical volume vgdata/lvlog changed from 508.00 MiB (127 extents) to 200.00 MiB (50 extents).
  Logical volume vgdata/lvlog successfully resized.
[root@servera ~]# mount /dev/vgdata/lvlog /srv/log; df -h /srv/log | tail -1
/dev/mapper/vgdata-lvlog  183M   14K  170M   1% /srv/log
[root@servera ~]# lvreduce -L 500M /dev/vgdata/lvapp
  File system size (<2.50 GiB) is larger than the requested size (500.00 MiB).
  File system reduce is required and not supported (xfs).
```

    ext4 shrank (offline); XFS refused. Your exact sizes differ slightly.
    {% /reveal %}
  {% /task %}

  {% task id="task-1d1ba5c9c5c5" title="Grade and finish" %}
    {% lab-finish exercise="sa-lvm-resize" grade=true servers=true /%}
  {% /task %}
{% /lab %}
