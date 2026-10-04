---
title: "Exercise: Create file systems and mount them"
kind: lab
minutes: 25
---

{% lead %}
Put XFS on the data partition, ext4 on the logs partition, prepare the swap partition, mount the two file systems by hand, write some files, and learn what "target is busy" means.
{% /lead %}

{% lab
  objectives=["ch17.filesystems"]
  id="filesystems"
  title="Create file systems and mount them"
  exercise="sa-filesystems"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera"]
  outcomes=["Create xfs and ext4 file systems and swap space.","Mount, use and unmount file systems.","Read UUIDs and diagnose a busy mount."] %}

  {% task id="task-69432ff18268" title="Start the exercise" %}
    On workstation, start the exercise. It partitions the spare disk `/dev/sdb` of servera into the three partitions of the previous exercise (data 1 GiB, logs 1 GiB, swap 512 MiB).

```console
[student@workstation ~]$ lab start sa-filesystems
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-80688e69edf7" title="Create the file systems and the swap area" %}
    Make an XFS file system on `sdb1`, an ext4 file system labelled `logs` on `sdb2`, and swap space on `sdb3`. Show their UUIDs and types.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# mkfs.xfs /dev/sdb1
meta-data=/dev/sdb1              isize=512    agcount=4, agsize=65536 blks
...output omitted...
[root@servera ~]# mkfs.ext4 -L logs /dev/sdb2
...output omitted...
[root@servera ~]# mkswap /dev/sdb3
Setting up swapspace version 1, size = 512 MiB (536866816 bytes)
no label, UUID=89858a47-2255-4fa3-a2a9-64711ac2d782
[root@servera ~]# blkid -s UUID -s TYPE /dev/sdb1 /dev/sdb2 /dev/sdb3
/dev/sdb1: UUID="c64946eb-fc27-4485-8020-db4119b686eb" TYPE="xfs"
/dev/sdb2: UUID="cd0b3883-1d6d-4271-a89e-2f48a2dac5b7" TYPE="ext4"
/dev/sdb3: UUID="89858a47-2255-4fa3-a2a9-64711ac2d782" TYPE="swap"
```

    Write down (or copy) the UUIDs: they will be different on your machine.
    {% /reveal %}
  {% /task %}

  {% task id="task-a24858f11ef1" title="Mount and use them" %}
    Create `/data` and `/logs`, mount the file systems on them, and compare sizes and types with `df`. Create a file in each.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# mkdir -p /data /logs
[root@servera ~]# mount /dev/sdb1 /data
[root@servera ~]# mount /dev/sdb2 /logs
[root@servera ~]# df -hT /data /logs
Filesystem     Type  Size  Used Avail Use% Mounted on
/dev/sdb1      xfs   960M   39M  922M   5% /data
/dev/sdb2      ext4  974M   24K  907M   1% /logs
[root@servera ~]# echo hello > /data/a.txt; echo world > /logs/b.txt
[root@servera ~]# lsblk -f /dev/sdb
NAME   FSTYPE FSVER LABEL UUID                                 FSAVAIL FSUSE% MOUNTPOINTS
sdb
├─sdb1 xfs                c64946eb-fc27-4485-8020-db4119b686eb  921M     4% /data
├─sdb2 ext4   1.0   logs  cd0b3883-1d6d-4271-a89e-2f48a2dac5b7  906.2M     0% /logs
└─sdb3 swap   1           89858a47-2255-4fa3-a2a9-64711ac2d782
```

    Sizes are slightly smaller than 1 GiB because the file systems keep some space for their own structures. ext4 reserves some more than XFS.
    {% /reveal %}
  {% /task %}

  {% task id="task-6aa01dbe44de" title="A busy mount" %}
    Change into `/data` and try to unmount it. Then find out who is using it, leave the directory, and unmount and mount it again.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# cd /data
[root@servera data]# umount /data
umount: /data: target is busy.
[root@servera data]# fuser -vm /data
                     USER        PID ACCESS COMMAND
/data:               root     kernel mount /data
                     root        713 ..c.. bash
[root@servera data]# cd /
[root@servera /]# umount /data && echo unmounted
unmounted
[root@servera /]# mount /dev/sdb1 /data && ls /data
a.txt
```

    The only user was your own shell (access `c` = current directory). The data survived the unmount, of course.
    {% /reveal %}
  {% /task %}

  {% task id="task-05c1d2fa2bc9" title="Use swap" %}
    Enable the swap partition and compare `free -h` before and after. Then disable it again.

    {% reveal title="Show solution" %}

```console
[root@servera /]# free -h | tail -1
Swap:             0B          0B          0B
[root@servera /]# swapon /dev/sdb3
[root@servera /]# swapon --show
NAME      TYPE      SIZE USED PRIO
/dev/sdb3 partition 512M   0B   -2
[root@servera /]# free -h | tail -1
Swap:          511Mi          0B       511Mi
[root@servera /]# swapoff /dev/sdb3
```

    Leave the file systems mounted for the next exercise, or unmount them with `umount /data /logs` and start from the partitions again.
    {% /reveal %}
  {% /task %}

  {% task id="task-94d037b1ee6c" title="Grade and finish" %}
    {% lab-finish exercise="sa-filesystems" grade=true servers=true /%}
  {% /task %}
{% /lab %}
