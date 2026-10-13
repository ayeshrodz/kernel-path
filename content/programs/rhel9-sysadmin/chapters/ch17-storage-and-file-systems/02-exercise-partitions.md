---
title: "Exercise: Partition a new disk"
seoTitle: "Partition a new disk (RHCSA Practice Exercise)"
description: "Hands-on RHCSA practice: partition a new disk. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 20
---

{% lead %}
servera has an empty 5 GiB disk, `/dev/sdb`. Look at the disks, give it a GPT partition table, and carve out three partitions for the rest of the chapter: a data partition, an archive partition, and a swap partition.
{% /lead %}

{% lab
  objectives=["ch17.partitions"]
  id="partitions"
  title="Partition a new disk"
  exercise="sa-partitions"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera"]
  outcomes=["Identify the system disk and the spare disk.","Create a GPT table and three partitions with parted.","Check the result with lsblk and parted."] %}

  {% task id="task-992656087c6b" title="Start the exercise" %}
    On workstation, start the exercise. It clears the spare disk `/dev/sdb` of servera (5 GiB).

```console
[student@workstation ~]$ lab start sa-partitions
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-a28017581855" title="Which disk is which?" %}
    On servera as root (`sudo -i`), list the block devices with their file systems. Which disk is the system disk, and which one is empty?

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ sudo -i
[root@servera ~]# lsblk -f
NAME   FSTYPE FSVER LABEL  UUID                                 FSAVAIL FSUSE% MOUNTPOINTS
sda
├─sda1 vfat   FAT32 UEFI   76E8-0192                              90.8M     8% /boot/efi
└─sda2 ext4   1.0   rootfs 4bbdcf8d-863d-4050-957c-c815ca3838b8   17.5G     9% /
sdb
```

    `sda` holds `/` and `/boot/efi`: it is the system disk. `sdb` has no partitions, no file system and no mount point: it is free for use.
    {% /reveal %}
  {% /task %}

  {% task id="task-084526f6b627" title="Read the partition table" %}
    Ask `parted` for the table of `/dev/sdb`. What does the error mean?

    {% reveal title="Show solution" %}

```console
[root@servera ~]# parted -s /dev/sdb print
Error: /dev/sdb: unrecognised disk label
Model: QEMU QEMU HARDDISK (scsi)
Disk /dev/sdb: 5369MB
Sector size (logical/physical): 512B/512B
Partition Table: unknown
Disk Flags:
```

    "Unrecognised disk label" means there is no partition table at all. The size (about 5.4 GB) matches the 5 GiB disk.
    {% /reveal %}
  {% /task %}

  {% task id="task-d138d1faf240" title="Create the table and three partitions" %}
    Create a GPT label, then partitions named `data` (1 GiB, xfs), `logs` (1 GiB, ext4) and `swap` (512 MiB, linux-swap), the first starting at 1 MiB and each following directly after the previous one.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# parted -s /dev/sdb mklabel gpt
[root@servera ~]# parted -s /dev/sdb mkpart data xfs 1MiB 1025MiB
[root@servera ~]# parted -s /dev/sdb mkpart logs ext4 1025MiB 2049MiB
[root@servera ~]# parted -s /dev/sdb mkpart swap linux-swap 2049MiB 2561MiB
```
    {% /reveal %}
  {% /task %}

  {% task id="task-56100900604b" title="Check the result" %}
    Wait for the device files, then show the partitions with `lsblk` and with `parted`, and the sizes in MiB including the free space.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# udevadm settle; lsblk /dev/sdb
NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS
sdb      8:16   0    5G  0 disk
├─sdb1   8:17   0    1G  0 part
├─sdb2   8:18   0    1G  0 part
└─sdb3   8:19   0  512M  0 part
[root@servera ~]# parted -s /dev/sdb unit MiB print free | tail -7
Number  Start    End      Size     File system     Name  Flags
        0.02MiB  1.00MiB  0.98MiB  Free Space
 1      1.00MiB  1025MiB  1024MiB  xfs             data
 2      1025MiB  2049MiB  1024MiB  ext4            logs
 3      2049MiB  2561MiB  512MiB   linux-swap(v1)  swap  swap
        2561MiB  5120MiB  2559MiB  Free Space
```

    About 2.5 GiB remain free for later. (The `xfs`/`ext4` words in the table are hints; no file system exists yet. That is the next lesson.)
    {% /reveal %}
  {% /task %}

  {% task id="task-6979b9f326de" title="Look at it from the other side" %}
    Print the table with `fdisk -l /dev/sdb` and compare with `parted`. Which type of table does it report?

    {% reveal title="Show solution" %}

```console
[root@servera ~]# fdisk -l /dev/sdb
Disk /dev/sdb: 5 GiB, 5368709120 bytes, 10485760 sectors
Disk model: QEMU HARDDISK
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes
Disklabel type: gpt
Disk identifier: 47F1B88E-3D30-4B06-9E55-37BF315E4107

Device       Start     End Sectors  Size Type
/dev/sdb1     2048 2099199 2097152    1G Linux filesystem
/dev/sdb2  2099200 4196351 2097152    1G Linux filesystem
/dev/sdb3  4196352 5244927 1048576  512M Linux swap
```

    `Disklabel type: gpt`: fdisk and parted read the same table. Sector 2048 is exactly 1 MiB, the aligned start.
    {% /reveal %}
  {% /task %}

  {% task id="task-d8a604eca4d7" title="Grade and finish" %}
    {% lab-finish exercise="sa-partitions" grade=true servers=true /%}
  {% /task %}
{% /lab %}
