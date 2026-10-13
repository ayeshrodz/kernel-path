---
title: When the disk is full, and keeping file systems healthy
seoTitle: "Disk Full on Linux? Find Space With du and df"
description: "Find what fills a disk with du and df, inode exhaustion, deleted open files and xfs_repair. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 25
---

{% lead %}
"No space left on device" is one of the most common alarms in system administration, and it has more than one cause. A file system can be out of **blocks** (data space), out of **inodes** (the records of files), or it can look full because of a file that was deleted but is still held open. This lesson teaches the three checks, plus the maintenance tools for labels, details and repair.
{% /lead %}

{% objectives %}
- Find where space went with `df`, `du` and `lsof +L1`, and recognise inode exhaustion with `df -i`.
- Find what keeps a mount busy with `fuser` and `lsof`.
- Use the file system tools: labels, details and offline checks for XFS and ext4.
{% /objectives %}

## The three kinds of "full"

{% diagram ref="no-space" /%}

### 1. Blocks

```console
[root@servera ~]# df -h /srv/data
Filesystem      Size  Used Avail Use% Mounted on
/dev/sdb1       960M  939M   22M  98% /srv/data
[root@servera ~]# du -xh --max-depth=1 /srv/data | sort -rh | head -3
900M	/srv/data
800M	/srv/data/big.log
50M	/srv/data/part1.tmp
```

`df` asks the file system how much is used; `du` adds up the sizes of the files it can see. `-x` keeps `du` on one file system, `--max-depth=1` limits the listing to the next level, and `sort -rh` orders human-readable sizes largest first. Repeat inside the biggest directory until you find the culprit.

### 2. Inodes

Every file and directory uses an **inode**. ext4 creates a fixed number when the file system is made (XFS allocates them dynamically). Hundreds of thousands of tiny files can use them all while plenty of space is left:

```console
[root@servera ~]# touch /srv/archive/many/f{1..65600}
touch: cannot touch '/srv/archive/many/f65599': No space left on device
[root@servera ~]# df -h /srv/archive | tail -1
/dev/sdb2       974M  1.5M  905M   1% /srv/archive
[root@servera ~]# df -i /srv/archive | tail -1
/dev/sdb2       65536 65536      0  100% /srv/archive
```

`df -h` shows 1% used, yet nothing more can be created: `df -i` shows why. The fix is to delete (or archive) the files, not to add space.

### 3. Deleted, but still open

If a program has a file open and you delete it, the name goes at once but the **data stays until the program closes it**. `df` counts the data, `du` cannot see it:

```console
[root@servera ~]# df -h /srv/data | tail -1; du -sh /srv/data
/dev/sdb1       960M  239M  722M  25% /srv/data
0	/srv/data
[root@servera ~]# lsof +L1 | grep srv/data
tail      1072 root    3r   REG   8,17 209715200     0  132 /srv/data/log.big (deleted)
```

`lsof +L1` lists open files with no names left. Stopping or restarting that process releases the space. The classic example is a log file deleted while the service keeps writing to it; truncating it instead (`: > file`) avoids the problem.

## A mount that will not let go

```console
[root@servera data]# umount /srv/data
umount: /srv/data: target is busy.
[root@servera data]# fuser -vm /srv/data
                     USER        PID ACCESS COMMAND
/srv/data:           root     kernel mount /srv/data
                     root        713 ..c.. bash
[root@servera data]# lsof /srv/data
COMMAND PID USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
bash    713 root  cwd    DIR   8,17       15  128 /srv/data
```

The `c` means "current directory": often it is just your own terminal. Leave the directory, or stop the process, and unmount again. A forced or "lazy" unmount (`umount -l`) hides the problem and is not a fix.

## Labels, details and repair

{% diagram ref="tools" /%}

```console
[root@servera ~]# umount /srv/data
[root@servera ~]# xfs_admin -L datavol /dev/sdb1
writing all SBs
new label = "datavol"
[root@servera ~]# xfs_repair -n /dev/sdb1 | tail -2
Phase 7 - verify link counts...
No modify flag set, skipping filesystem flush and exiting.
[root@servera ~]# mount /srv/data
[root@servera ~]# e2label /dev/sdb2 archive
[root@servera ~]# tune2fs -l /dev/sdb2 | grep -E "Filesystem volume name|Inode count|Block size"
Filesystem volume name:   archive
Inode count:              65536
Block size:               4096
```

File system checks run only on **unmounted** file systems (the root file system is checked at boot). `xfs_repair -n` and `e2fsck -n` report problems without changing anything; drop the `-n` to repair. Corruption is rare on healthy hardware and shows up as I/O errors in `dmesg` or the journal (chapter 11), after a crash, or after an abrupt power loss.

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch17.maintenance"] ref="quick" /%}
