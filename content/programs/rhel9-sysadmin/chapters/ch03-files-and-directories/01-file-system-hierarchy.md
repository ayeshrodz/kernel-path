---
title: The directory tree
seoTitle: "Linux Directory Structure Explained (/etc, /var)"
description: "The Linux file system hierarchy: what lives in /etc, /var, /usr, /home and the other top directories. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 12
---

{% lead %}
Windows gives every disk its own letter. Linux does not: everything, from your documents to the disks themselves, lives in one tree of directories that starts at `/`. Once you know what the main branches are for, you can guess where almost anything is on any Linux system.
{% /lead %}

{% objectives %}
- Explain how Linux arranges every file in a single tree starting at the root directory, `/`.
- Name the main directories under `/` and say what kind of file each holds.
- Tell configuration, variable data and runtime data apart, and know which survive a reboot.
{% /objectives %}

## One tree for everything

Every file on a Linux system has a place in one tree. The top of the tree is the **root directory**, written as a single slash: `/`. Each directory below it can hold files and more directories, so a file's full name lists the directories you pass through on the way down, separated by slashes. The file `issue` in the directory `etc` directly under the root is `/etc/issue`.

It is drawn upside down, root at the top, branches spreading below. Extra disks, USB sticks and network shares don't get letters: they are attached (*mounted*) at a directory somewhere in the tree, and their files appear there. Chapter 17 shows how.

```console
[student@servera ~]$ ls /
afs  bin  boot  dev  etc  home  lib  lib64  lost+found  media  mnt  opt  proc  root  run  sbin  selinux  srv  sys  tmp  usr  var
```

## What the main directories hold

The directories under `/` have fixed jobs, agreed between distributions. Select one to see what lives there:

{% diagram ref="hierarchy" /%}

| Directory | Holds | Survives a reboot? |
| --- | --- | --- |
| `/boot` | The kernel and the files that start the system | Yes |
| `/dev` | Special files that stand for hardware: disks, terminals | Re-created at each boot |
| `/etc` | System-wide **configuration**, as text files | Yes |
| `/home` | Ordinary users' home directories | Yes |
| `/root` | Root's own home directory (not under `/home`) | Yes |
| `/run` | **Runtime** data for running programs: process IDs, sockets, locks | No, emptied at boot |
| `/tmp` | Scratch space anyone can write to; old files are cleaned up after 10 days | Not to rely on |
| `/usr` | Installed software: commands in `/usr/bin`, admin commands in `/usr/sbin`, libraries, documentation | Yes |
| `/var` | **Variable** data that grows while the system runs: logs in `/var/log`, databases, caches, mail, web content | Yes |

Two more you will meet: `/opt` for large third-party applications, and `/proc` and `/sys`, which aren't on any disk at all. The kernel generates them on the fly to show what is going on inside it.

{% callout type="tip" title="Four words that describe a directory" %}
**Static** content changes only when you change it (programs in `/usr`). **Variable** content changes while the system runs (logs in `/var`). **Persistent** content survives a reboot (`/etc`, `/var`). **Runtime** content disappears at shutdown (`/run`). When you wonder where something belongs, ask which of these it is.
{% /callout %}

## /bin is really /usr/bin

On RHEL 9, `/bin`, `/sbin`, `/lib` and `/lib64` are not real directories but **symbolic links**, shortcuts to their counterparts inside `/usr`. The `l` at the start of the line and the `->` arrow show it:

```console
[student@servera ~]$ ls -l /
total 68
dr-xr-xr-x.   2 root root  4096 Nov  3  2024 afs
lrwxrwxrwx.   1 root root     7 Nov  3  2024 bin -> usr/bin
dr-xr-xr-x.   5 root root  4096 Oct  2 08:12 boot
...output omitted...
lrwxrwxrwx.   1 root root     7 Nov  3  2024 lib -> usr/lib
lrwxrwxrwx.   1 root root     9 Nov  3  2024 lib64 -> usr/lib64
...output omitted...
lrwxrwxrwx.   1 root root     8 Nov  3  2024 sbin -> usr/sbin
```

So `/bin/ls` and `/usr/bin/ls` are the same file. Older systems kept them separate; scripts written for them still work because the links exist. You will learn to make links yourself later in this chapter.

## Names are case-sensitive

`Report.txt`, `report.txt` and `REPORT.TXT` are three different files on Linux. Most Linux commands and directories use lowercase names, which is why typing them in lowercase is a habit worth building early.

## Check your understanding

{% quiz id="quick" objectives=["ch03.hierarchy"] ref="quick" /%}
