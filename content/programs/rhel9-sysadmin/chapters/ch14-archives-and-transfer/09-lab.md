---
title: "Exercise: Archives and transfer review"
seoTitle: "tar and rsync Practice Lab (RHCSA Exam Style)"
description: "Graded RHCSA exam-style lab on tar and rsync: a challenge with requirements, hints and solutions, and a grader that checks your work on your own lab."
kind: lab
minutes: 35
---

{% lead %}
Back up a project on servera without its cache, keeping the ACLs, prove the archive with a checksum, carry it to serverb, verify it there, and restore it with its metadata intact.
{% /lead %}

{% lab
  objectives=["ch14.tar","ch14.checksums","ch14.backups","ch14.transfer"]
  id="review"
  title="Archives and transfer review"
  exercise="sa-archives-review"
  ownExercise=true
  hosts=["workstation","servera","serverb"]
  outcomes=["Create an xz archive with relative names, an exclusion and ACLs.","Create and verify a checksum, and carry the archive between servers.","Restore with ACLs and permissions intact."] %}
{% lab-notes %}

**Before you start:** reset the servers and complete this chapter's lessons. You work from **workstation**, using `ssh root@servera` and `ssh root@serverb`; `lab start` and `lab grade` also run there.

{% /lab-notes %}

{% lab-challenge %}

1. On servera, build the project tree (the commands are in the README).
2. Create `/srv/backup/project.tar.xz` from `/srv/project` with names starting `project/`, without `cache`, keeping ACLs, SELinux labels and extended attributes. Write `project.tar.xz.sha256` next to it and verify it.
3. Copy both files to `/srv/restore` on serverb through workstation, verify the checksum on serverb, and extract the archive there, keeping ACLs.

{% /lab-challenge %}

  {% task id="task-bbdcedfe7c56" title="Start the exercise" %}

```console
[student@workstation ~]$ lab start sa-archives-review
[student@workstation ~]$ cat ~/sa-archives-review/README
```
  {% /task %}

  {% task id="task-a40fee6981ab" title="Build the tree and the backup on servera" %}

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh root@servera
[root@servera ~]# mkdir -p /srv/project/docs /srv/project/data /srv/project/cache
[root@servera ~]# echo "Project readme" > /srv/project/docs/readme.txt
[root@servera ~]# seq 1 100 | sed 's/$/,record/' > /srv/project/data/records.csv
[root@servera ~]# echo "top secret" > /srv/project/secret.txt
[root@servera ~]# echo junk > /srv/project/cache/tmp.bin
[root@servera ~]# chmod 640 /srv/project/secret.txt
[root@servera ~]# setfacl -m u:student:r /srv/project/secret.txt
[root@servera ~]# mkdir -p /srv/backup
[root@servera ~]# tar -cJf /srv/backup/project.tar.xz --acls --selinux --xattrs --exclude=project/cache -C /srv project
[root@servera ~]# tar -tJf /srv/backup/project.tar.xz
project/
project/secret.txt
project/docs/
project/docs/readme.txt
project/data/
project/data/records.csv
[root@servera ~]# cd /srv/backup && sha256sum project.tar.xz > project.tar.xz.sha256
[root@servera backup]# sha256sum -c project.tar.xz.sha256
project.tar.xz: OK
[root@servera backup]# exit
```

    `-C /srv project` stores the names `project/...`, and `--exclude=project/cache` leaves the cache out.
    {% /reveal %}
  {% /task %}

  {% task id="task-ad0607d50303" title="Carry it to serverb and verify" %}

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh root@servera 'cd /srv/backup && tar -cf - project.tar.xz project.tar.xz.sha256' | ssh root@serverb 'mkdir -p /srv/restore && tar -xf - -C /srv/restore'
[student@workstation ~]$ ssh root@serverb 'cd /srv/restore && sha256sum -c project.tar.xz.sha256'
project.tar.xz: OK
```

    The two files travel inside a plain tar stream, so no temporary file is needed on workstation.
    {% /reveal %}
  {% /task %}

  {% task id="task-808c5f173559" title="Restore with metadata" %}

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh root@serverb 'cd /srv/restore && tar -xJf project.tar.xz --acls --selinux --xattrs && ls -l project && getfacl -cp project/secret.txt'
total 16
drwxr-xr-x. 2 root root 4096 Oct  3 17:46 data
drwxr-xr-x. 2 root root 4096 Oct  3 17:46 docs
-rw-r-----+ 1 root root   11 Oct  3 17:46 secret.txt
user::rw-
user:student:r--
group::r--
mask::r--
other::---
```

    The `+` and the `student` entry show that the ACL survived; there is no `cache` directory.
    {% /reveal %}
  {% /task %}

  {% task id="task-c73a6f33acc0" title="Grade" %}

    {% lab-finish exercise="sa-archives-review" grade=true servers=true /%}
  {% /task %}
{% /lab %}
