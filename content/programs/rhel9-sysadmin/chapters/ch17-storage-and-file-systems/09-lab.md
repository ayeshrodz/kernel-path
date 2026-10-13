---
title: "Exercise: Storage review"
seoTitle: "Linux storage Practice Lab (RHCSA Exam Style)"
description: "Graded RHCSA exam-style lab on Linux storage: a challenge with requirements, hints and solutions, and a grader that checks your work on your own lab."
kind: lab
minutes: 40
---

{% lead %}
Set up the spare disk of serverb from scratch: partitions, three kinds of storage with the right options, entries that survive a reboot, and a few facts for the record.
{% /lead %}

{% lab
  objectives=["ch17.partitions","ch17.filesystems","ch17.fstab","ch17.maintenance"]
  id="review"
  title="Storage review"
  exercise="sa-storage-review"
  ownExercise=true
  hosts=["workstation","serverb"]
  outcomes=["Partition a disk and create xfs, ext4 and swap.","Mount permanently with UUIDs and options.","Verify with findmnt --verify, mount -a and a reboot."] %}
{% lab-notes %}

**Before you start:** reset the servers and complete this chapter's lessons. You work on **serverb**, as root (`sudo -i`), on the spare disk `/dev/sdb`; `lab start` and `lab grade` run on workstation.

{% /lab-notes %}

{% lab-challenge %}

On serverb:

1. Create a GPT partition table on `/dev/sdb` with partitions of about 1 GiB (projects), 1 GiB (backups) and 512 MiB (swap).
2. Put XFS on the first, mounted on `/srv/projects`, with a file `README.txt` that contains `storage ready`. Put ext4 on the second, mounted on `/srv/backups` with `noexec` and `nodev`. Prepare the third as swap.
3. Make all three permanent by UUID in `/etc/fstab`. Test with `findmnt --verify`, `mount -a` and `swapon -a`.
4. On workstation, fill in `answers.txt`.

{% /lab-challenge %}

  {% task id="task-8666d97127af" title="Start the exercise" %}

```console
[student@workstation ~]$ lab start sa-storage-review
[student@workstation ~]$ ssh student@serverb
[student@serverb ~]$ sudo -i
[root@serverb ~]# lsblk /dev/sdb
NAME MAJ:MIN RM SIZE RO TYPE MOUNTPOINTS
sdb    8:16   0   5G  0 disk
```
  {% /task %}

  {% task id="task-38d5f324df5a" title="Partitions and file systems" %}

    {% reveal title="Show solution" %}

```console
[root@serverb ~]# parted -s /dev/sdb mklabel gpt
[root@serverb ~]# parted -s /dev/sdb mkpart projects xfs 1MiB 1025MiB
[root@serverb ~]# parted -s /dev/sdb mkpart backups ext4 1025MiB 2049MiB
[root@serverb ~]# parted -s /dev/sdb mkpart swap linux-swap 2049MiB 2561MiB
[root@serverb ~]# udevadm settle
[root@serverb ~]# mkfs.xfs /dev/sdb1
[root@serverb ~]# mkfs.ext4 -L backups /dev/sdb2
[root@serverb ~]# mkswap /dev/sdb3
[root@serverb ~]# mkdir -p /srv/projects /srv/backups
```
    {% /reveal %}
  {% /task %}

  {% task id="task-8083188d9561" title="fstab, mount and test" %}

    {% reveal title="Show solution" %}

```console
[root@serverb ~]# cp /etc/fstab /root/fstab.bak
[root@serverb ~]# cat >> /etc/fstab <<EOT
UUID=$(blkid -s UUID -o value /dev/sdb1)  /srv/projects  xfs   defaults               0 0
UUID=$(blkid -s UUID -o value /dev/sdb2)  /srv/backups   ext4  defaults,noexec,nodev  0 0
UUID=$(blkid -s UUID -o value /dev/sdb3)  none           swap  defaults               0 0
EOT
[root@serverb ~]# systemctl daemon-reload
[root@serverb ~]# findmnt --verify | tail -2
[root@serverb ~]# mount -a && swapon -a
[root@serverb ~]# echo "storage ready" > /srv/projects/README.txt
[root@serverb ~]# df -hT /srv/projects /srv/backups; swapon --show
```

    A reboot (`systemctl reboot`) is the final proof: after logging in again, all three must be there.
    {% /reveal %}
  {% /task %}

  {% task id="task-028f1b0ef4f9" title="Grade" %}
    On workstation, fill in `answers.txt` and grade:

    {% lab-finish exercise="sa-storage-review" grade=true servers=true /%}
  {% /task %}
{% /lab %}
