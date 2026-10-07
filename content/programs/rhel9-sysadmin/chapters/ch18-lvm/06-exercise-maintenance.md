---
title: "Exercise: Move data to a new disk"
seoTitle: "Move data to a new disk (RHCSA Practice Exercise)"
description: "Hands-on RHCSA practice: move data to a new disk. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 30
---

{% lead %}
A volume holds your data on an old disk. Move it to a new disk while it stays mounted, retire the old disk, give the volume a better name, make everything permanent, add a swap volume, and prove it all with a reboot.
{% /lead %}

{% lab
  objectives=["ch18.maintenance"]
  id="maintenance"
  title="Move data to a new disk"
  exercise="sa-lvm-maintenance"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera"]
  outcomes=["Replace a PV with pvmove, vgreduce and pvremove.","Rename a volume and update fstab.","Add LVM swap and verify after a reboot."] %}

  {% task id="task-817671257cef" title="Start the exercise" %}
    On workstation, start the exercise. It builds the volume group `vgdata` from the two partitions of `/dev/sdb` on servera, with the volumes `lvapp` and `lvlog` mounted on `/srv/app` and `/srv/log`.

```console
[student@workstation ~]$ lab start sa-lvm-maintenance
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-a249cb7e09bd" title="A fresh start" %}
    On servera as root, remove the volumes from the previous exercises (unmount them first), keep the volume group `vgdata` with both PVs, and create one volume `lvdata` of 800 MiB that lives only on `/dev/sdb1`. Put XFS on it, mount it on `/srv/data`, and write a file. Note its checksum. Check on which PV it lives.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ sudo -i
[root@servera ~]# umount /srv/app /srv/log 2> /dev/null
[root@servera ~]# lvremove -y vgdata/lvapp vgdata/lvlog
  Logical volume "lvapp" successfully removed.
  Logical volume "lvlog" successfully removed.
[root@servera ~]# lvcreate -y -n lvdata -L 800M vgdata /dev/sdb1
  Wiping xfs signature on /dev/vgdata/lvdata.
  Logical volume "lvdata" created.
[root@servera ~]# mkfs.xfs -f /dev/vgdata/lvdata > /dev/null
[root@servera ~]# mkdir -p /srv/data; mount /dev/vgdata/lvdata /srv/data
[root@servera ~]# seq 1 100000 > /srv/data/numbers.txt; sha256sum /srv/data/numbers.txt | cut -c1-16
b2bc7d3f8b652d2e
[root@servera ~]# lvs -o lv_name,devices vgdata; pvs -o pv_name,pv_size,pv_free
  LV     Devices
  lvdata /dev/sdb1(0)
  PV         PSize  PFree
  /dev/sdb1  <1.50g 732.00m
  /dev/sdb2  <1.50g  <1.50g
```

    The final `/dev/sdb1` on the `lvcreate` line tells LVM which PV to allocate from. If `lvcreate` asks about wiping an old signature, answer `y`. If `sdb2` is not in the group yet, run `pvcreate /dev/sdb2; vgextend vgdata /dev/sdb2` first.
    {% /reveal %}
  {% /task %}

  {% task id="task-a0ba16090bbb" title="Move the volume to sdb2" %}
    Move all the data off `/dev/sdb1` onto `/dev/sdb2`, while `/srv/data` stays mounted. Check where the volume lives now and that the data is unchanged.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# pvmove /dev/sdb1 /dev/sdb2
  /dev/sdb1: Moved: 30.50%
  /dev/sdb1: Moved: 100.00%
[root@servera ~]# lvs -o lv_name,devices vgdata; pvs -o pv_name,pv_size,pv_free
  LV     Devices
  lvdata /dev/sdb2(0)
  PV         PSize  PFree
  /dev/sdb1  <1.50g  <1.50g
  /dev/sdb2  <1.50g 732.00m
[root@servera ~]# sha256sum /srv/data/numbers.txt | cut -c1-16
b2bc7d3f8b652d2e
```

    The extents now live on `sdb2`, `sdb1` is empty, and the checksum is the same.
    {% /reveal %}
  {% /task %}

  {% task id="task-06f828c8f297" title="Retire the old disk" %}
    Remove `/dev/sdb1` from the volume group and wipe its LVM label.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# vgreduce vgdata /dev/sdb1
  Removed "/dev/sdb1" from volume group "vgdata"
[root@servera ~]# pvremove /dev/sdb1
  Labels on physical volume "/dev/sdb1" successfully wiped.
[root@servera ~]# vgs; pvs
  VG     #PV #LV #SN Attr   VSize  VFree
  vgdata   1   1   0 wz--n- <1.50g 732.00m
  PV         VG     Fmt  Attr PSize  PFree
  /dev/sdb2  vgdata lvm2 a--  <1.50g 732.00m
```
    {% /reveal %}
  {% /task %}

  {% task id="task-a169a31f652b" title="Rename, and make it permanent" %}
    Rename `lvdata` to `lvstore`. Add an fstab line for it (by LV path), verify, and mount it from fstab.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# umount /srv/data
[root@servera ~]# lvrename vgdata lvdata lvstore
  Renamed "lvdata" to "lvstore" in volume group "vgdata"
[root@servera ~]# cp /etc/fstab /root/fstab.bak
[root@servera ~]# echo "/dev/vgdata/lvstore  /srv/data  xfs  defaults  0 0" >> /etc/fstab
[root@servera ~]# systemctl daemon-reload; findmnt --verify | tail -1
0 parse errors, 0 errors, 1 warning
[root@servera ~]# mount -a; df -h /srv/data | tail -1
/dev/mapper/vgdata-lvstore  736M   38M  699M   6% /srv/data
```
    {% /reveal %}
  {% /task %}

  {% task id="task-8b3b6a662b47" title="Swap on a volume" %}
    Create a 256 MiB volume `lvswap`, prepare it as swap, add it to fstab, and enable all swap with `swapon -a`.

    {% reveal title="Show solution" %}

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
    {% /reveal %}
  {% /task %}

  {% task id="task-786871565673" title="Reboot and check" %}
    Reboot, log in again, and check the mount, the swap, the group and the data.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# systemctl reboot
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ df -h /srv/data | tail -1; swapon --show | tail -1; sudo vgs; sha256sum /srv/data/numbers.txt | cut -c1-16
/dev/mapper/vgdata-lvstore  736M   38M  699M   6% /srv/data
/dev/dm-1 partition 256M   0B   -2
  VG     #PV #LV #SN Attr   VSize  VFree
  vgdata   1   2   0 wz--n- <1.50g 476.00m
b2bc7d3f8b652d2e
[student@servera ~]$ exit
```

    Volumes activate by themselves at boot, and the data is exactly what you wrote. Keep this layout for the troubleshooting exercise.
    {% /reveal %}
  {% /task %}

  {% task id="task-04e5d8e441d2" title="Grade and finish" %}
    {% lab-finish exercise="sa-lvm-maintenance" grade=true servers=true /%}
  {% /task %}
{% /lab %}
