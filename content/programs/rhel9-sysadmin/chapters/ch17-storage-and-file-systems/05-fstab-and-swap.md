---
title: Making mounts permanent with /etc/fstab
seoTitle: "/etc/fstab Explained: Permanent Mounts and Swap"
description: "Make mounts and swap permanent in /etc/fstab with UUIDs, test with mount -a and findmnt --verify. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 20
---

{% lead %}
A mount you made by hand lasts until the next reboot. The file that tells the system what to mount at boot is `/etc/fstab`. It is also one of the files where a small typo can stop a server from booting, so the skill here is as much about the routine for changing it safely as about the syntax.
{% /lead %}

{% objectives %}
- Read and write `/etc/fstab` lines, using UUIDs.
- Test changes with `findmnt --verify` and `mount -a` before rebooting.
- Add a swap area to fstab, and use mount options such as `noexec` and `nofail`.
{% /objectives %}

## The six fields

```console
[root@servera ~]# tail -4 /etc/fstab
LABEL=UEFI    /boot/efi vfat  defaults  0 0
UUID=c64946eb-fc27-4485-8020-db4119b686eb  /srv/data     xfs   defaults          0 0
UUID=cd0b3883-1d6d-4271-a89e-2f48a2dac5b7  /srv/archive  ext4  defaults,noexec   0 0
UUID=89858a47-2255-4fa3-a2a9-64711ac2d782  none          swap  defaults          0 0
```

{% diagram ref="fstab-line" /%}

Two words about the first field. **Identify the device by UUID (or LABEL), not by `/dev/sdb1`**: device letters follow the order in which disks are found, and adding a disk can reorder them, so `/dev/sdb1` might one day be a different partition. `blkid` prints the UUIDs.

## A safe routine

{% diagram ref="persist" /%}

```console
[root@servera ~]# blkid -s UUID -o value /dev/sdb1
c64946eb-fc27-4485-8020-db4119b686eb
[root@servera ~]# mkdir -p /srv/data /srv/archive
[root@servera ~]# cp /etc/fstab /root/fstab.bak
[root@servera ~]# vim /etc/fstab
[root@servera ~]# systemctl daemon-reload
[root@servera ~]# findmnt --verify | tail -3
0 parse errors, 0 errors, 1 warning
/
   [W] recommended root FS passno is 1 (current is 0)
[root@servera ~]# mount -a; echo "rc=$?"
rc=0
[root@servera ~]# df -h /srv/data /srv/archive
Filesystem      Size  Used Avail Use% Mounted on
/dev/sdb1       960M   39M  922M   5% /srv/data
/dev/sdb2       974M   24K  907M   1% /srv/archive
```

`systemctl daemon-reload` is needed because systemd turns every fstab line into a mount unit. `findmnt --verify` checks the file for errors, and `mount -a` mounts all entries that are not mounted yet; if the line is wrong, you see the error now and not at boot. (The warning about the root file system is only a recommendation.) The step that proves everything is a reboot.

## Options worth knowing

| Option | Effect |
| --- | --- |
| `defaults` | `rw,suid,dev,exec,auto,nouser,async` |
| `ro` / `rw` | Read-only / read-write |
| `noexec` | Programs on this file system cannot be run: good for uploads, archives, `/tmp` |
| `nosuid`, `nodev` | Ignore setuid bits / device files |
| `nofail` | A missing device does not stop the boot (secondary disks) |
| `noauto` | Not mounted by `mount -a` or at boot |
| `x-systemd.device-timeout=10s` | Give up waiting for the device after 10 seconds |

For the fifth and sixth fields use `0 0`: the first is an obsolete backup flag, the second the boot-time check order, which XFS does not need.

## Swap in fstab

A swap area is a line with type `swap` and mount point `none`; `swapon -a` turns on all of them (the boot process does it automatically):

```console
[root@servera ~]# swapon -a
[root@servera ~]# swapon --show
NAME      TYPE      SIZE USED PRIO
/dev/sdb3 partition 512M   0B   -2
[root@servera ~]# free -h | tail -1
Swap:          511Mi          0B       511Mi
```

`pri=N` in the options sets the priority when there are several swap areas. How much swap does a server need? It depends on the workload; a small swap lets the kernel move rarely used memory away, but a system that actively swaps all the time is too short on memory.

{% callout type="warning" title="After a mistake in fstab" %}
If the system drops into emergency mode because of fstab, log in with the root password, run `mount -o remount,rw /`, fix or comment out the line, `systemctl daemon-reload`, and reboot (chapter 9). That is why you keep `/root/fstab.bak`.
{% /callout %}

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch17.fstab"] ref="quick" /%}
