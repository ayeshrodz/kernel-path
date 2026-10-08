---
title: Backups that restore properly
seoTitle: "Linux Backups With tar: ACLs and Incrementals"
description: "Back up with tar keeping ACLs and SELinux labels, incremental backups and tested restores. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 20
---

{% lead %}
Everybody agrees that backups matter, and many backups fail the one test that counts: they restore something other than what was backed up. Files come back without their ACLs or SELinux labels, owners change, deleted files reappear, or nobody can remember which archive goes with which. This lesson covers the details that decide whether a backup is a backup.
{% /lead %}

{% objectives %}
- List the metadata a tar backup keeps by default and what needs extra options.
- Create a backup that keeps ACLs, SELinux labels and extended attributes, and prove it.
- Make full and incremental backups, and snapshot-style copies with `rsync --link-dest`.
{% /objectives %}

## What does a backup need to keep?

{% diagram ref="metadata" /%}

Prove it with a file that has an ACL:

```console
[root@servera arch]# getfacl -cp project/docs/notes.md
user::rw-
user:student:r--
group::r--
mask::r--
other::r--
[root@servera arch]# tar -czf plain.tar.gz project
[root@servera arch]# mkdir -p out1; tar -xzf plain.tar.gz -C out1
[root@servera arch]# getfacl -cp out1/project/docs/notes.md
user::rw-
group::r--
other::r--
```

The entry for `student` has vanished without any warning. With the extra options on both sides, it survives:

```console
[root@servera arch]# tar -czf acl.tar.gz --acls --selinux --xattrs project
[root@servera arch]# mkdir -p out3; tar -xzf acl.tar.gz -C out3 --acls --selinux --xattrs
[root@servera arch]# getfacl -cp out3/project/docs/notes.md
user::rw-
user:student:r--
group::r--
mask::r--
other::r--
```

Ownership needs one more remark: only root can restore files to other owners. As an ordinary user, everything comes back owned by you.

## What not to back up

A backup of a whole running system should skip `/proc`, `/sys`, `/dev`, `/run`, `/tmp`, and of course the backup file itself and the mount point of the backup disk. These are virtual or change while you work. Prefer to back up the data and configuration that matter: `/etc`, `/home`, `/srv`, `/var/lib/...`, rather than the whole tree.

## Full and incremental backups

Backing up everything every night is slow and wasteful. An **incremental** backup stores only what changed since the previous one. `tar` does it with a **state file**:

{% diagram ref="incremental" /%}

```console
[root@servera arch]# tar --listed-incremental=bk/state.snar -czf bk/full.tar.gz work
[root@servera arch]# ls bk
full.tar.gz  state.snar
...a.txt is edited, c.txt is created, b.txt is deleted...
[root@servera arch]# tar --listed-incremental=bk/state.snar -czf bk/incr1.tar.gz work
[root@servera arch]# tar -tzf bk/incr1.tar.gz
work/
work/docs/
work/docs/a.txt
work/docs/c.txt
```

To restore, extract the full backup and then every incremental, **in order**, using `--listed-incremental=/dev/null` so that tar also applies the deletions (b.txt disappears again):

```console
[root@servera arch]# mkdir restore
[root@servera arch]# tar --listed-incremental=/dev/null -xzf bk/full.tar.gz -C restore
[root@servera arch]# tar --listed-incremental=/dev/null -xzf bk/incr1.tar.gz -C restore
[root@servera arch]# find restore -type f | sort
restore/work/docs/a.txt
restore/work/docs/c.txt
```

The weakness is the dependency chain: lose one incremental and the later ones are useless. Many sites make a new full backup weekly.

## Snapshots with rsync

`rsync` offers a different approach: every run produces a complete-looking directory, but files that did not change are **hard links** to the previous snapshot, so they take no extra space.

```console
[root@servera arch]# rsync -a work/ bk/snap1/
[root@servera arch]# echo four > work/docs/d.txt
[root@servera arch]# rsync -a --link-dest=/tmp/arch/bk/snap1 work/ bk/snap2/
[root@servera arch]# ls -i bk/snap1/docs/a.txt bk/snap2/docs/a.txt
262001 bk/snap1/docs/a.txt  262001 bk/snap2/docs/a.txt
[root@servera arch]# du -sh bk/snap1 bk/snap2
16K	bk/snap1
12K	bk/snap2
```

The same inode number (262001) shows that both names point at the same data. Each snapshot can be browsed and restored with a plain `cp`, no archive tools needed. (`--link-dest` wants an absolute path.)

{% callout type="warning" title="A backup on the same disk is not a backup" %}
Keep copies on another disk or another machine, check them regularly, and **rehearse a restore**. Backups that were never restored are hopes, not backups.
{% /callout %}

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch14.backups"] ref="quick" /%}
