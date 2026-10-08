---
title: "LVM cheat sheet"
seoTitle: "LVM Cheat Sheet (RHCSA)"
description: "LVM cheat sheet: the key commands and ideas on one page, with flashcards for revision. Free RHCSA study notes."
kind: summary
minutes: 5
---

{% lead %}
The chapter on one page: what to remember, the commands to have at your fingertips, and flashcards for quick revision.
{% /lead %}

## The chapter in eight sentences

- LVM stacks flexible layers on top of disks: **physical volumes** (PV) make up a **volume group** (VG), from which **logical volumes** (LV) are cut and given file systems or swap.
- Build with `pvcreate`, `vgcreate`, `lvcreate -n NAME -L SIZE VG` (or `-l 50%FREE`), then `mkfs` and `mount`; the device is `/dev/VG/LV`.
- Inspect with `pvs`, `vgs`, `lvs` (and `-o +devices`) and `lsblk -f`; the `a` in the LV Attr means active, `o` open.
- Grow with `lvextend -r -L +SIZE LV` (or `-l +100%FREE`), while mounted; the `-r` also runs `xfs_growfs` or `resize2fs`.
- A full group needs a new PV: `pvcreate`, then `vgextend VG PV`.
- ext4 can be shrunk offline with `lvreduce -r -L SIZE LV`; XFS cannot be shrunk at all. Back up first.
- Replace a disk online: `vgextend` (new), `pvmove OLD NEW`, `vgreduce VG OLD`, `pvremove OLD`.
- Make volumes permanent with `/dev/VG/LV` (or UUID) in `/etc/fstab`; an inactive volume is fixed with `lvchange -ay`, and the layout is saved by `vgcfgbackup`.

## Cheat sheet

{% tabs %}
  {% tab label="Create and inspect" %}

| Command | Does |
| --- | --- |
| `pvcreate DEV` · `pvs` · `pvdisplay` | Physical volumes |
| `vgcreate [-s 8M] VG DEV…` · `vgs` · `vgdisplay` | Volume groups |
| `lvcreate -n LV -L 1G VG` · `lvs` · `lvdisplay` | Logical volumes |
| `lvs -o +devices,lv_path` | Where each LV lives |
| `mkfs.xfs /dev/VG/LV` · `mount` | File system and mount |

  {% /tab %}
  {% tab label="Resize and move" %}

| Command | Does |
| --- | --- |
| `vgextend VG PV` | Add a PV to a group |
| `lvextend -r -L +512M LV` · `-l +100%FREE` | Grow LV and file system |
| `xfs_growfs DIR` · `resize2fs DEV` | Grow only the file system |
| `lvreduce -r -L 200M LV` | Shrink ext4 (unmounted) |
| `pvmove OLD [NEW]` | Move extents between PVs |
| `vgreduce VG PV` · `pvremove PV` | Retire a disk |

  {% /tab %}
  {% tab label="Maintain and repair" %}

| Command | Does |
| --- | --- |
| `lvrename VG old new` · `lvremove VG/LV` | Rename, remove |
| `vgremove VG` · `pvremove PV` | Remove group, PV |
| `lvchange -ay VG/LV` · `vgchange -ay VG` | Activate |
| `lvmdevices` · `pvs -a` · `pvscan` | Which devices LVM sees |
| `vgcfgbackup VG` · `/etc/lvm/backup` | Layout backup |
| fstab | `/dev/VG/LV /dir xfs defaults 0 0` · swap: `/dev/VG/LV none swap defaults 0 0` |

  {% /tab %}
{% /tabs %}

## Flashcards

{% flashcards ref="flashcards" /%}
