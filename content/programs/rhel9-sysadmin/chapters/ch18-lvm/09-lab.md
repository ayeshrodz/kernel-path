---
title: "Exercise: LVM review"
kind: lab
minutes: 40
---

{% lead %}
Build a small storage system with LVM on serverb: a volume group with a custom extent size, three logical volumes, a second disk added when the group runs out of room, an online extension of a mounted volume, and permanent mounts.
{% /lead %}

{% lab
  objectives=["ch18.concepts","ch18.resize","ch18.maintenance","ch18.troubleshooting"]
  id="review"
  title="LVM review"
  exercise="sa-lvm-review"
  ownExercise=true
  hosts=["workstation","serverb"]
  outcomes=["Build PV, VG and LVs with a chosen extent size.","Add a PV when the group is full and extend a mounted volume.","Make mounts and swap permanent."] %}
{% lab-notes %}

**Before you start:** reset the servers and complete this chapter's lessons. You work on **serverb** as root (`sudo -i`), on the spare disk `/dev/sdb`; `lab start` and `lab grade` run on workstation.

{% /lab-notes %}

{% lab-challenge %}

On serverb:

1. Create two LVM partitions of 1.5 GiB on `/dev/sdb`.
2. Create the volume group `vgapp` on the first one with 8 MiB extents.
3. Create `lvweb` (1 GiB, XFS, `/srv/web`), `lvdb` (400 MiB, ext4, `/srv/db`) and `lvswap` (256 MiB, swap). When the group is full, add the second partition.
4. Write `seq 1 100000` into `/srv/web/numbers.txt`, then extend `lvweb` to at least 2000 MiB while it is mounted.
5. Make everything permanent in `/etc/fstab` and test it.
6. On workstation, fill in `answers.txt`.

{% /lab-challenge %}

  {% task id="task-98b589ec81d9" title="Start the exercise" %}

```console
[student@workstation ~]$ lab start sa-lvm-review
[student@workstation ~]$ ssh student@serverb
[student@serverb ~]$ sudo -i
[root@serverb ~]#
```
  {% /task %}

  {% task id="task-78e587876e60" title="Partitions, group and the first volumes" %}

    {% reveal title="Show solution" %}

```console
[root@serverb ~]# parted -s /dev/sdb mklabel gpt mkpart pv1 1MiB 1537MiB mkpart pv2 1537MiB 3073MiB set 1 lvm on set 2 lvm on
[root@serverb ~]# udevadm settle
[root@serverb ~]# pvcreate /dev/sdb1
[root@serverb ~]# vgcreate -s 8M vgapp /dev/sdb1
[root@serverb ~]# lvcreate -n lvweb -L 1G vgapp
[root@serverb ~]# lvcreate -n lvdb -L 400M vgapp
[root@serverb ~]# lvcreate -n lvswap -L 256M vgapp
  Volume group "vgapp" has insufficient free space (13 extents): 32 required.
[root@serverb ~]# pvcreate /dev/sdb2; vgextend vgapp /dev/sdb2
[root@serverb ~]# lvcreate -n lvswap -L 256M vgapp
  Logical volume "lvswap" created.
[root@serverb ~]# vgs -o vg_name,pv_count,vg_extent_size,vg_size,vg_free vgapp
  VG    #PV Ext    VSize VFree
  vgapp   2 8.00m 2.98g 1.34g
```

    With 8 MiB extents, 256 MiB needs 32 extents and the group had only 13 left, hence the message.
    {% /reveal %}
  {% /task %}

  {% task id="task-af9b2e67486b" title="File systems, data and the online extension" %}

    {% reveal title="Show solution" %}

```console
[root@serverb ~]# mkfs.xfs /dev/vgapp/lvweb > /dev/null
[root@serverb ~]# mkfs.ext4 /dev/vgapp/lvdb > /dev/null 2>&1
[root@serverb ~]# mkswap /dev/vgapp/lvswap
[root@serverb ~]# mkdir -p /srv/web /srv/db
[root@serverb ~]# mount /dev/vgapp/lvweb /srv/web; mount /dev/vgapp/lvdb /srv/db
[root@serverb ~]# seq 1 100000 > /srv/web/numbers.txt
[root@serverb ~]# lvextend -r -L 2G /dev/vgapp/lvweb
  Extended file system xfs on vgapp/lvweb.
  Logical volume vgapp/lvweb successfully resized.
[root@serverb ~]# df -h /srv/web | tail -1; tail -1 /srv/web/numbers.txt
/dev/mapper/vgapp-lvweb  2.0G   51M  1.9G   3% /srv/web
100000
```
    {% /reveal %}
  {% /task %}

  {% task id="task-9529cf58727d" title="Permanent, and test" %}

    {% reveal title="Show solution" %}

```console
[root@serverb ~]# cp /etc/fstab /root/fstab.bak
[root@serverb ~]# cat >> /etc/fstab <<'EOT'
/dev/vgapp/lvweb   /srv/web  xfs   defaults  0 0
/dev/vgapp/lvdb    /srv/db   ext4  defaults  0 0
/dev/vgapp/lvswap  none      swap  defaults  0 0
EOT
[root@serverb ~]# systemctl daemon-reload; findmnt --verify | tail -1
0 parse errors, 0 errors, 1 warning
[root@serverb ~]# mount -a && swapon -a; df -hT /srv/web /srv/db | tail -2; swapon --show
```

    A reboot (`systemctl reboot`) is the final proof. Afterwards check `vgs`, `lvs` and the mounts again.
    {% /reveal %}
  {% /task %}

  {% task id="task-543d852bb172" title="Grade" %}
    On workstation, fill in `answers.txt` and grade:

    {% lab-finish exercise="sa-lvm-review" grade=true servers=true /%}
  {% /task %}
{% /lab %}
