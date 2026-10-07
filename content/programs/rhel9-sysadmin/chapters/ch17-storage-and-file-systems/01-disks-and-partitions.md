---
title: Disks and partitions
seoTitle: "parted Tutorial: Partition a Disk on Linux (GPT)"
description: "Find disks with lsblk and partition them with parted using GPT. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 20
---

{% lead %}
Everything you store lives on a disk somewhere, but a disk by itself is just an empty row of numbered blocks. Before it can hold files you divide it into **partitions**, put a **file system** on each, and **mount** them into the directory tree. This chapter walks through that sequence, then through the daily problems of storage: making it permanent, running out of space, and checking for damage. The first step is understanding what the system calls a disk.
{% /lead %}

{% objectives %}
- Explain block devices, disks and partitions, and recognise device names like `sda`, `vda` and `nvme0n1p1`.
- Compare GPT and MBR, and list the disks and partitions with `lsblk`, `blkid` and `parted`.
- Create a GPT partition table and partitions with `parted -s`.
{% /objectives %}

## Block devices

A **block device** is something the kernel reads and writes in fixed-size blocks: disks, partitions, USB sticks, virtual disks. They appear as files in `/dev`:

| Name | What it is |
| --- | --- |
| `/dev/sda`, `/dev/sdb`, … | SCSI/SATA/USB disks and many virtual disks, in the order found |
| `/dev/vda`, … | virtio virtual disks |
| `/dev/nvme0n1` | The first NVMe disk (its partitions are `nvme0n1p1`, `nvme0n1p2`, …) |
| `/dev/sda1`, `/dev/sda2` | Partitions 1 and 2 of `sda` |

Plain **letters name disks, numbers name partitions.** The order of letters can change when disks are added, which is why file systems are identified by UUID when it matters.

## What is on this machine

```console
[root@servera ~]# lsblk
NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS
sda      8:0    0   20G  0 disk
├─sda1   8:1    0  100M  0 part /boot/efi
└─sda2   8:2    0 19.9G  0 part /
sdb      8:16   0    5G  0 disk
[root@servera ~]# lsblk -f
NAME   FSTYPE FSVER LABEL  UUID                                 FSAVAIL FSUSE% MOUNTPOINTS
sda
├─sda1 vfat   FAT32 UEFI   76E8-0192                              90.8M     8% /boot/efi
└─sda2 ext4   1.0   rootfs 4bbdcf8d-863d-4050-957c-c815ca3838b8   17.5G     9% /
sdb
```

`sda` is the system disk, with a small EFI boot partition and a root partition. `sdb` is a spare 5 GiB disk with nothing on it: it is the one you will practise on in the exercises of this chapter. **Anything you do to `/dev/sdb` destroys its content, so always check the device name before you run a command.** `lsblk -f` adds the file system type, label, UUID and mount point.

## Partition tables

A **partition table** at the start of the disk lists where each partition begins and ends. Two formats exist:

| | GPT | MBR (DOS) |
| --- | --- | --- |
| Disk size | Larger than 2 TiB is fine | Up to 2 TiB |
| Partitions | Up to 128, all equal | 4 primary (or 3 + an extended one) |
| Used by | Modern systems, UEFI | Old BIOS systems |
| Resilience | A copy at the end of the disk | One copy |

Use **GPT** for new disks. Tools: `parted` (can be scripted), `fdisk` and `gdisk` (interactive, with a text menu: `n` new, `p` print, `d` delete, `w` write). `parted -s` takes commands directly, which is convenient and good for exercises.

{% diagram ref="layout" /%}

## Creating partitions with parted

```console
[root@servera ~]# parted -s /dev/sdb print
Error: /dev/sdb: unrecognised disk label
...
Partition Table: unknown
[root@servera ~]# parted -s /dev/sdb mklabel gpt
[root@servera ~]# parted -s /dev/sdb mkpart data xfs 1MiB 1025MiB
[root@servera ~]# parted -s /dev/sdb mkpart logs ext4 1025MiB 2049MiB
[root@servera ~]# parted -s /dev/sdb mkpart swap linux-swap 2049MiB 2561MiB
[root@servera ~]# parted -s /dev/sdb print
Number  Start   End     Size    File system  Name  Flags
 1      1049kB  1075MB  1074MB               data
 2      1075MB  2149MB  1074MB               logs
 3      2149MB  2685MB  537MB                swap  swap
[root@servera ~]# udevadm settle; lsblk /dev/sdb
NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS
sdb      8:16   0    5G  0 disk
├─sdb1   8:17   0    1G  0 part
├─sdb2   8:18   0    1G  0 part
└─sdb3   8:19   0  512M  0 part
```

`mklabel gpt` writes the table; each `mkpart NAME FSTYPE START END` creates a partition. The `FSTYPE` word is only a hint stored in the table: **it does not create a file system**. Starting at `1MiB` keeps the partition aligned to the disk's blocks. `udevadm settle` waits until the device files `/dev/sdb1` and so on have appeared.

If `lsblk` does not show new partitions on a disk that is in use, `partprobe /dev/sdb` asks the kernel to re-read the table.

## The whole picture

{% diagram ref="new-disk" /%}

You have done step 1. The next lessons do steps 2 to 4.

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch17.partitions"] ref="quick" /%}
