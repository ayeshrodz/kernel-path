---
title: File systems and mounting
seoTitle: "mkfs and mount: Create XFS and ext4 File Systems"
description: "Create XFS and ext4 file systems and swap, mount them and read blkid and df. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 20
---

{% lead %}
A partition is an empty container. A **file system** is the structure that makes it useful: the directories, the names, the permissions, the records of which blocks belong to which file. You create one with `mkfs`, and then **mount** it, which means attaching it to a directory so that its content appears in the tree.
{% /lead %}

{% objectives %}
- Create XFS and ext4 file systems, and prepare swap space.
- Mount and unmount file systems by hand, and check what is mounted with `df`, `findmnt` and `lsblk -f`.
- Find UUIDs and labels with `blkid`.
{% /objectives %}

## Choosing a file system

{% diagram ref="fs-types" /%}

RHEL's default is **XFS**, and it is the right choice unless you have a reason. The essential practical difference: XFS can be enlarged but not reduced, ext4 can be both.

## Creating file systems

```console
[root@servera ~]# mkfs.xfs /dev/sdb1
meta-data=/dev/sdb1              isize=512    agcount=4, agsize=65536 blks
...output omitted...
[root@servera ~]# mkfs.ext4 -L logs /dev/sdb2
...output omitted...
Writing superblocks and filesystem accounting information: 0/8   done
[root@servera ~]# mkswap /dev/sdb3
Setting up swapspace version 1, size = 512 MiB (536866816 bytes)
no label, UUID=89858a47-2255-4fa3-a2a9-64711ac2d782
```

`mkfs` **destroys whatever was on the partition**. `-L` sets a label. `mkswap` prepares swap space. Now see what the system knows about them:

```console
[root@servera ~]# blkid /dev/sdb1 /dev/sdb2 /dev/sdb3
/dev/sdb1: UUID="c64946eb-fc27-4485-8020-db4119b686eb" TYPE="xfs" PARTLABEL="data" PARTUUID="e854bd58-..."
/dev/sdb2: LABEL="logs" UUID="cd0b3883-1d6d-4271-a89e-2f48a2dac5b7" TYPE="ext4" PARTLABEL="logs" PARTUUID="79e6c3a7-..."
/dev/sdb3: UUID="89858a47-2255-4fa3-a2a9-64711ac2d782" TYPE="swap" PARTLABEL="swap" PARTUUID="e6f880d9-..."
```

Each file system has a **UUID**, a unique identifier written when it was created. (The `PARTUUID` belongs to the partition, a different thing.)

## Mounting

The tree under `/` is built from file systems. `mount DEVICE DIRECTORY` attaches one; the directory (the **mount point**) must exist, and whatever it held is hidden while something is mounted on it.

```console
[root@servera ~]# mkdir -p /data /logs
[root@servera ~]# mount /dev/sdb1 /data
[root@servera ~]# mount /dev/sdb2 /logs
[root@servera ~]# df -hT /data /logs
Filesystem     Type  Size  Used Avail Use% Mounted on
/dev/sdb1      xfs   960M   39M  922M   5% /data
/dev/sdb2      ext4  974M   24K  907M   1% /logs
[root@servera ~]# findmnt -o TARGET,SOURCE,FSTYPE,OPTIONS /data
TARGET SOURCE    FSTYPE OPTIONS
/data  /dev/sdb1 xfs    rw,relatime,seclabel,attr2,inode64,logbufs=8,logbsize=32k,noquota
```

| Command | Shows |
| --- | --- |
| `df -h` / `df -hT` | Size, used, available per mounted file system (and type) |
| `findmnt [DIR]` | The mount tree, with the options in use |
| `lsblk -f` | Disks and partitions with file system, UUID and mount point |
| `mount` (no arguments) | Every mount, the raw list |
| `du -sh DIR` | How much a directory uses (a different question from `df`) |

`mount -o ro,noexec DEVICE DIR` adds options for this mount; `mount -o remount,rw DIR` changes a mounted one. To detach: `umount DIR`. It fails with "target is busy" if something is using the file system, which includes your own shell if you are standing in the directory.

## Swap

Swap is not mounted. You enable it, and the kernel uses it as overflow for memory:

```console
[root@servera ~]# swapon /dev/sdb3
[root@servera ~]# swapon --show
NAME      TYPE      SIZE USED PRIO
/dev/sdb3 partition 512M   0B   -2
[root@servera ~]# free -h | tail -1
Swap:          511Mi          0B       511Mi
```

`swapoff /dev/sdb3` disables it again. Everything you did with `mount` and `swapon` so far is lost at reboot. The next lesson makes it permanent.

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch17.filesystems"] ref="quick" /%}
