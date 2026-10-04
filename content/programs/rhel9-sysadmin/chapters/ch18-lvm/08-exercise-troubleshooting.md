---
title: "Exercise: Fix three LVM problems"
kind: lab
minutes: 25
---

{% lead %}
Three problems, each with a different message. Diagnose each from its message, fix it with the smallest command, and verify.
{% /lead %}

{% lab
  objectives=["ch18.troubleshooting"]
  id="troubleshooting"
  title="Fix three LVM problems"
  exercise="sa-lvm-troubleshooting"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera"]
  outcomes=["Activate an inactive volume.","Respond to Insufficient free space.","Resolve a group that cannot be deactivated."] %}

  {% task id="task-1c291d41ff72" title="Start the exercise" %}
    On workstation, start the exercise. It builds the volume group `vgdata` on `/dev/sdb2` of servera with the XFS volume `lvstore` (800 MiB, mounted on `/srv/data`) and the swap volume `lvswap`, both in `/etc/fstab`.

```console
[student@workstation ~]$ lab start sa-lvm-troubleshooting
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-733227e1e67f" title="The starting point" %}
    On servera as root, make sure `vgdata` has the mounted volume `lvstore` on `/srv/data` (as left by the previous exercise).

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ sudo -i
[root@servera ~]# lvs
  LV      VG     Attr       LSize   Pool Origin Data%  Meta%  Move Log Cpy%Sync Convert
  lvstore vgdata -wi-ao---- 800.00m
  lvswap  vgdata -wi-ao---- 256.00m
[root@servera ~]# df -h /srv/data | tail -1
/dev/mapper/vgdata-lvstore  736M   38M  699M   6% /srv/data
```
    {% /reveal %}
  {% /task %}

  {% task id="task-f125f910a0be" title="Problem 1: the volume that does not exist" %}
    Unmount `/srv/data` and deactivate the volume `lvstore` (this simulates a volume that was not activated). Try `mount -a`. What does the error say, and what does `lvs` show in the `Attr` column? Fix it.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# umount /srv/data
[root@servera ~]# lvchange -an vgdata/lvstore
[root@servera ~]# lvs vgdata/lvstore
  LV      VG     Attr       LSize   Pool Origin Data%  Meta%  Move Log Cpy%Sync Convert
  lvstore vgdata -wi------- 800.00m
[root@servera ~]# mount -a
mount: /srv/data: special device /dev/vgdata/lvstore does not exist.
[root@servera ~]# ls /dev/vgdata/
lvswap
[root@servera ~]# lvchange -ay vgdata/lvstore
[root@servera ~]# mount -a; df -h /srv/data | tail -1
/dev/mapper/vgdata-lvstore  736M   38M  699M   6% /srv/data
```

    The `a` is missing from `-wi-------`: inactive, so no device file. After `lvchange -ay` it works.
    {% /reveal %}
  {% /task %}

  {% task id="task-1a9ace581ec2" title="Problem 2: not enough room" %}
    Try to extend `lvstore` by 2 GiB. Read the message, look at the group, and then extend it by what is possible, using `+100%FREE`.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# lvextend -r -L +2G /dev/vgdata/lvstore
  Insufficient free space: 512 extents needed, but only 119 available
[root@servera ~]# vgs
  VG     #PV #LV #SN Attr   VSize  VFree
  vgdata   1   2   0 wz--n- <1.50g 476.00m
[root@servera ~]# lvextend -r -l +100%FREE /dev/vgdata/lvstore | tail -1
  Logical volume vgdata/lvstore successfully resized.
[root@servera ~]# df -h /srv/data | tail -1
/dev/mapper/vgdata-lvstore  1.2G   42M  1.2G   4% /srv/data
```

    The message says what the group has (119 extents of 4 MiB). To get more you would add a PV to the group; here we use what is there.
    {% /reveal %}
  {% /task %}

  {% task id="task-329d0ac2c41f" title="Problem 3: it will not deactivate" %}
    Try to deactivate the whole group `vgdata` while `/srv/data` is mounted and while swap is on. What does LVM tell you? Find out what is in use, free it, and deactivate the group. Then activate it again and restore the mounts.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# vgchange -an vgdata
  Can't deactivate volume group "vgdata" with 2 open logical volume(s)
[root@servera ~]# lvs -o lv_name,lv_attr
  LV      Attr
  lvstore -wi-ao----
  lvswap  -wi-ao----
[root@servera ~]# swapoff /dev/vgdata/lvswap; umount /srv/data
[root@servera ~]# vgchange -an vgdata
  0 logical volume(s) in volume group "vgdata" now active
[root@servera ~]# vgchange -ay vgdata
  2 logical volume(s) in volume group "vgdata" now active
[root@servera ~]# mount -a; swapon -a; df -h /srv/data | tail -1; swapon --show | tail -1
/dev/mapper/vgdata-lvstore  1.2G   42M  1.2G   4% /srv/data
/dev/dm-1 partition 256M   0B   -2
```

    The `o` in `-wi-ao----` means open: mounted or used as swap. The group deactivates only when nothing uses its volumes.
    {% /reveal %}
  {% /task %}

  {% task id="task-d2bdedc5e1db" title="Save the layout, then clean up" %}
    Save the layout of the group with `vgcfgbackup`. Then remove everything you built in this chapter: unmount, remove the fstab lines (restore your backup), turn off swap, remove the volumes, the group and the physical volumes, and wipe the disk.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# vgcfgbackup vgdata
  Volume group "vgdata" successfully backed up.
  Logical volume "lvstore" successfully removed.
  Logical volume "lvswap" successfully removed.
  Volume group "vgdata" successfully removed
  Labels on physical volume "/dev/sdb2" successfully wiped.
NAME MAJ:MIN RM SIZE RO TYPE MOUNTPOINTS
sdb    8:16   0   5G  0 disk
[root@servera ~]# exit
[student@servera ~]$ exit
```

    Order matters: volumes, then the group, then the PVs. `rht-vmctl reset servers` is the quick alternative.
    {% /reveal %}
  {% /task %}

  {% task id="task-95b4e17972cb" title="Grade and finish" %}
    {% lab-finish exercise="sa-lvm-troubleshooting" grade=true servers=true /%}
  {% /task %}
{% /lab %}
