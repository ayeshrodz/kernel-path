---
title: "RHCSA (EX200) exam objectives: a study map"
seoTitle: "RHCSA EX200 Exam Objectives: Free Study Map for RHEL 9"
description: "Every RHCSA (EX200) objective area for RHEL 9 mapped to free lessons, exercises and labs. Use it as your RHCSA study checklist and practice plan."
kind: lesson
minutes: 10
---

{% lead %}
The RHCSA exam (EX200) is a hands-on test: you get real systems and a list of tasks, and the result is checked on the systems themselves. This page lists the objective areas Red Hat publishes for the exam on RHEL 9, in our own words, and links each one to the lessons and exercises of this course that teach it. Use it as a checklist: when you can do every line on your practice lab without notes, you are ready.
{% /lead %}

{% callout type="note" title="Check the official list" %}
Red Hat publishes and occasionally updates the objectives on the [EX200 exam page](https://www.redhat.com/en/services/training/ex200-red-hat-certified-system-administrator-rhcsa-exam). This study map follows that list but is not an official document, and it makes no claim about what any particular exam contains.
{% /callout %}

## Understand and use essential tools

- Use the shell, write commands correctly, and get help from man pages, `--help` and `/usr/share/doc`: [the shell](#/ch02/linux-and-the-shell), [running commands](#/ch02/running-commands), [man pages](#/ch04/manual-pages), [finding commands](#/ch04/searching-for-help).
- Redirect input and output, and use pipes: [redirection and pipes](#/ch05/redirection-and-pipes).
- Search text with `grep` and regular expressions: [grep](#/ch05/grep).
- Log in to remote systems with SSH and switch users with `su` and `sudo`: [SSH basics](#/ch10/ssh-basics), [becoming root](#/ch06/superuser).
- Archive and compress files with `tar`, `gzip` and `bzip2`: [tar](#/ch14/tar), [compression](#/ch14/compression-and-checksums).
- Create and edit text files: [vim](#/ch05/vim).
- Create, delete, copy and move files and directories, and create hard and symbolic links: [managing files](#/ch03/manage-files), [links](#/ch03/links).
- Read and set standard permissions: [reading permissions](#/ch07/reading-permissions), [changing permissions](#/ch07/changing-permissions).

## Create simple shell scripts

- Run commands conditionally and in loops, process arguments, and use the output of commands: [first scripts](#/ch15/first-scripts), [conditions and loops](#/ch15/conditions-and-loops).

## Operate running systems

- Boot, reboot and shut down; boot into a different target; interrupt the boot to recover access: [targets and boot](#/ch09/targets-and-boot), [recovery](#/ch09/recovery).
- Find CPU- and memory-hungry processes, end them and adjust their priority; manage tuning profiles: [processes](#/ch08/processes), [signals](#/ch08/signals), [monitoring and tuned](#/ch08/monitoring).
- Find and read logs and journals, and keep the journal across reboots: [reading logs](#/ch11/reading-logs), [persistence and rotation](#/ch11/persistence-and-rotation).
- Start, stop and check services: [systemd services](#/ch09/services).
- Transfer files securely between systems: [scp, sftp and rsync](#/ch10/transfer-and-config), [moving data](#/ch14/moving-data).

## Configure local storage

- Create and delete partitions on GPT disks: [disks and partitions](#/ch17/disks-and-partitions).
- Create and remove physical volumes, volume groups and logical volumes: [LVM concepts](#/ch18/lvm-concepts), [LVM maintenance](#/ch18/moving-and-maintaining).
- Mount file systems at boot by UUID or label, and add partitions, logical volumes and swap without losing data: [/etc/fstab and swap](#/ch17/fstab-and-swap).

## Create and configure file systems

- Create, mount and use XFS, ext4 and vfat file systems: [file systems and mounting](#/ch17/filesystems-and-mounting).
- Mount network file systems with NFS, and on demand with autofs: [NFS](#/ch19/nfs-basics), [persistent mounts and autofs](#/ch19/persistent-mounts-and-autofs), [autofs maps](#/ch19/autofs-maps).
- Extend logical volumes: [growing and shrinking](#/ch18/growing-and-shrinking).
- Diagnose and fix permission problems: [defaults and shared directories](#/ch07/defaults-and-special), [ACLs](#/ch07/acls), [NFS access](#/ch19/access-and-permissions).

## Deploy, configure and maintain systems

- Schedule tasks with `at`, `cron` and systemd timers: [cron](#/ch15/cron), [timers and at](#/ch15/timers-and-at).
- Start and stop services, and set them to start at boot; set the default boot target: [systemd services](#/ch09/services), [targets and boot](#/ch09/targets-and-boot).
- Configure time services: [time and chrony](#/ch11/time).
- Install and update packages from repositories, and configure repositories: [dnf](#/ch13/dnf), [repositories](#/ch13/repositories), [modules and updates](#/ch13/modules-and-updates).
- Change the boot loader and kernel arguments: [targets and boot](#/ch09/targets-and-boot).

## Manage basic networking

- Configure IPv4 and IPv6 addresses, host name resolution and network services that start at boot: [network basics](#/ch12/network-basics), [nmcli](#/ch12/networkmanager), [names and DNS](#/ch12/names-and-dns).
- Restrict network access with `firewall-cmd`: [zones and services](#/ch20/zones-and-services), [runtime and permanent rules](#/ch20/runtime-and-permanent), [special rules](#/ch20/sources-and-special-rules).

## Manage users and groups

- Create, delete and change local users and groups, and set passwords and password ageing: [users and groups](#/ch06/users-and-groups), [accounts](#/ch06/accounts-and-groups), [passwords](#/ch06/passwords).
- Configure superuser access: [sudo](#/ch06/superuser).

## Manage security

- Configure firewall settings: [firewalld](#/ch20/zones-and-services).
- Set default file permissions and special permissions: [defaults and special permissions](#/ch07/defaults-and-special).
- Configure key-based SSH authentication: [SSH keys](#/ch10/keys), [hardening sshd](#/ch10/hardening).
- Set SELinux modes, read and restore file contexts, manage port labels and booleans, and diagnose routine denials: [SELinux concepts](#/ch16/selinux-concepts), [file contexts](#/ch16/file-contexts), [booleans and ports](#/ch16/booleans-and-ports), [troubleshooting](#/ch16/troubleshooting).

## Manage containers

If the current objectives include containers, these lessons cover finding and running images, persistent storage and running containers as services: [images and containers](#/ch21/images-and-containers), [ports and storage](#/ch21/ports-and-storage), [building images](#/ch21/building-images), [Quadlet services](#/ch21/services-with-quadlet).

## Practise like the exam

Each chapter ends with a graded lab that states only the requirements, like an exam task, and the [capstone lab](#/ch22/lab) combines many areas on one system. Work through them on your [practice lab](#/ch01/overview), reset it, and repeat them without the lessons open.
