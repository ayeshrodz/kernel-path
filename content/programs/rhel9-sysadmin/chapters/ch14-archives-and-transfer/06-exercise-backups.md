---
title: "Exercise: Back up with ACLs, then restore"
kind: lab
minutes: 30
---

{% lead %}
Make a directory with special properties (a script, a private file with an ACL), back it up the careless way and the careful way, and see exactly what the careless way loses. Then try a full and an incremental backup, and a hard-linked rsync snapshot.
{% /lead %}

{% lab
  objectives=["ch14.backups"]
  id="backups"
  title="Back up with ACLs, then restore"
  exercise="sa-backups"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera"]
  outcomes=["Show that a plain tar loses ACLs and that --acls keeps them.","Make and restore a full and an incremental backup.","Create hard-linked rsync snapshots."] %}

  {% task id="task-b1493b0d7765" title="Start the exercise" %}
    On workstation, start the exercise. It removes `/root/arch` of an earlier run from servera.

```console
[student@workstation ~]$ lab start sa-backups
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-8303f5800ecd" title="Build a directory with an ACL" %}
    On servera as root (`sudo -i`), create `/root/arch/project/docs/notes.md`, give the user `student` read access to it with an ACL, and show the ACL.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ sudo -i
[root@servera ~]# mkdir -p /root/arch/project/docs && cd /root/arch
[root@servera arch]# echo "# notes" > project/docs/notes.md
[root@servera arch]# chmod 600 project/docs/notes.md
[root@servera arch]# setfacl -m u:student:r project/docs/notes.md
[root@servera arch]# getfacl -cp project/docs/notes.md
user::rw-
user:student:r--
group::---
mask::r--
other::---
```
    {% /reveal %}
  {% /task %}

  {% task id="task-b5ce30291392" title="The careless backup" %}
    Back up `project` with a plain `tar -czf plain.tar.gz`, restore it into `out1`, and check the ACL of the restored file.

    {% reveal title="Show solution" %}

```console
[root@servera arch]# tar -czf plain.tar.gz project
[root@servera arch]# mkdir out1 && tar -xzf plain.tar.gz -C out1
[root@servera arch]# getfacl -cp out1/project/docs/notes.md
user::rw-
group::r--
other::---
```

    The ACL entry for `student` is gone, and nothing told you. (The group bits now read `r--`: that was the ACL mask, which plain tar stored as an ordinary permission.)
    {% /reveal %}
  {% /task %}

  {% task id="task-9aa8d8a43928" title="The careful backup" %}
    Repeat with `--acls --selinux --xattrs` on both the creation and the extraction (into `out2`), and compare.

    {% reveal title="Show solution" %}

```console
[root@servera arch]# tar -czf acl.tar.gz --acls --selinux --xattrs project
[root@servera arch]# mkdir out2 && tar -xzf acl.tar.gz -C out2 --acls --selinux --xattrs
[root@servera arch]# getfacl -cp out2/project/docs/notes.md
user::rw-
user:student:r--
group::---
mask::r--
other::---
[root@servera arch]# ls -lZ out2/project/docs/notes.md
-rw-r-----+ 1 root root system_u:object_r:admin_home_t:s0 8 Oct  3 17:44 out2/project/docs/notes.md
```

    The `+` after the permissions announces an ACL; it is back.
    {% /reveal %}
  {% /task %}

  {% task id="task-b85ff9e66921" title="Full and incremental" %}
    Create a directory `work/docs` with `a.txt` and `b.txt`. Make a full backup with a state file, then edit `a.txt`, add `c.txt`, delete `b.txt` and make an incremental backup. List both archives.

    {% reveal title="Show solution" %}

```console
[root@servera arch]# mkdir -p work/docs bk
[root@servera arch]# echo one > work/docs/a.txt; echo two > work/docs/b.txt
[root@servera arch]# tar --listed-incremental=bk/state.snar -czf bk/full.tar.gz work
[root@servera arch]# tar -tzf bk/full.tar.gz
work/
work/docs/
work/docs/a.txt
work/docs/b.txt
[root@servera arch]# echo three > work/docs/c.txt; echo changed >> work/docs/a.txt; rm work/docs/b.txt
[root@servera arch]# tar --listed-incremental=bk/state.snar -czf bk/incr1.tar.gz work
[root@servera arch]# tar -tzf bk/incr1.tar.gz
work/
work/docs/
work/docs/a.txt
work/docs/c.txt
```
    {% /reveal %}
  {% /task %}

  {% task id="task-76f247250670" title="Restore in order" %}
    Restore both into a new directory `restore`, in order, with `--listed-incremental=/dev/null`. Which files exist, and what does `a.txt` contain?

    {% reveal title="Show solution" %}

```console
[root@servera arch]# mkdir restore
[root@servera arch]# tar --listed-incremental=/dev/null -xzf bk/full.tar.gz -C restore
[root@servera arch]# tar --listed-incremental=/dev/null -xzf bk/incr1.tar.gz -C restore
[root@servera arch]# find restore -type f | sort
restore/work/docs/a.txt
restore/work/docs/c.txt
[root@servera arch]# cat restore/work/docs/a.txt
one
changed
```

    `b.txt` was removed again when the incremental was applied.
    {% /reveal %}
  {% /task %}

  {% task id="task-89e2b9b72bf2" title="Snapshots with hard links" %}
    Make a first rsync snapshot of `work` in `bk/snap1`, add a file `d.txt`, then make `bk/snap2` with `--link-dest` pointing at `snap1`. Show that an unchanged file is the same inode in both.

    {% reveal title="Show solution" %}

```console
[root@servera arch]# rsync -a work/ bk/snap1/
[root@servera arch]# echo four > work/docs/d.txt
[root@servera arch]# rsync -a --link-dest=/root/arch/bk/snap1 work/ bk/snap2/
[root@servera arch]# ls -i bk/snap1/docs/a.txt bk/snap2/docs/a.txt
261967 bk/snap1/docs/a.txt  261967 bk/snap2/docs/a.txt
[root@servera arch]# ls bk/snap1/docs bk/snap2/docs
bk/snap1/docs:
a.txt  c.txt

bk/snap2/docs:
a.txt  c.txt  d.txt
```

    Both snapshots look complete; `snap2` shares the data of the files that did not change.
    {% /reveal %}
  {% /task %}

  {% task id="task-28fe69e0b6ab" title="Grade and finish" %}
    {% lab-finish exercise="sa-backups" grade=true servers=true /%}
  {% /task %}
{% /lab %}
