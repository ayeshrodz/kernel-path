---
title: "Linux storage cheat sheet"
seoTitle: "Linux storage Cheat Sheet (RHCSA)"
description: "Linux storage cheat sheet: the key commands and ideas on one page, with flashcards for revision. Free RHCSA study notes."
kind: summary
minutes: 5
---

{% lead %}
The chapter on one page: what to remember, the commands to have at your fingertips, and flashcards for quick revision.
{% /lead %}

## The chapter in eight sentences

- Disks and partitions are block devices: `sdb` is a disk, `sdb1` its first partition; `lsblk -f` and `blkid` show them with file systems and UUIDs.
- A new disk needs four steps: **partition** (GPT, `parted -s`), **file system** (`mkfs.xfs`, `mkfs.ext4`, `mkswap`), **mount**, and an entry in **`/etc/fstab`**.
- XFS is the default and can only grow; ext4 can grow and shrink; swap is enabled with `swapon`, never mounted.
- `mount DEV DIR`, `umount DIR`, `findmnt`, `df -hT` and `lsblk -f` create and inspect mounts; the mount point must exist.
- fstab lines are `UUID=… /dir type options 0 0`; use UUIDs because device names can change.
- Always back up fstab and run `systemctl daemon-reload`, `findmnt --verify` and `mount -a` before rebooting; use `nofail` for non-essential disks.
- "No space left" has three causes: blocks (`df -h`, `du`), inodes (`df -i`) and deleted-but-open files (`lsof +L1`).
- `fuser -vm DIR` shows what keeps a mount busy; `xfs_repair -n` and `e2fsck -n` check unmounted file systems.

## Cheat sheet

{% tabs %}
  {% tab label="Create" %}

| Command | Does |
| --- | --- |
| `lsblk -f`, `blkid` | Devices, file systems, UUIDs |
| `parted -s /dev/sdb mklabel gpt` | New GPT table |
| `parted -s /dev/sdb mkpart NAME xfs 1MiB 1025MiB` | New partition |
| `mkfs.xfs DEV` · `mkfs.ext4 -L NAME DEV` · `mkswap DEV` | File systems and swap |
| `mount DEV DIR` · `umount DIR` | Attach / detach |
| `swapon DEV` · `swapoff DEV` · `swapon --show` | Swap |

  {% /tab %}
  {% tab label="Permanent" %}

| Item | Detail |
| --- | --- |
| Line | `UUID=… /mnt/point xfs defaults 0 0` · swap: `UUID=… none swap defaults 0 0` |
| Options | `noexec` `nodev` `nosuid` `ro` `nofail` |
| Safe routine | `cp /etc/fstab /root/fstab.bak` → edit → `systemctl daemon-reload` → `findmnt --verify` → `mount -a` → `swapon -a` → reboot |
| UUID | `blkid -s UUID -o value DEV` |

  {% /tab %}
  {% tab label="Diagnose" %}

| Command | Does |
| --- | --- |
| `df -h` · `df -hT` · `df -i` | Blocks, types, inodes |
| `du -xh --max-depth=1 DIR \| sort -rh \| head` | Biggest directories |
| `lsof +L1` | Deleted but open files |
| `fuser -vm DIR` · `lsof DIR` | Who keeps a mount busy |
| `xfs_repair -n DEV` · `e2fsck -n DEV` | Check (unmounted) |
| `xfs_admin -L NAME DEV` · `e2label DEV NAME` | Labels |
| `xfs_info DIR` · `tune2fs -l DEV` | Details |

  {% /tab %}
{% /tabs %}

## Flashcards

{% flashcards ref="flashcards" /%}
