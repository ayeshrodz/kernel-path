---
title: "Exercise: Permissions and ACLs review"
kind: lab
minutes: 35
---

{% lead %}
Set up a small analysis team on servera: a shared directory whose files stay in the team's group, a script only the team can run, a public drop box, and one outsider who may read a single report and nothing else.
{% /lead %}

{% lab
  objectives=["ch07.reading","ch07.changing","ch07.defaults","ch07.acls"]
  id="review"
  title="Permissions and ACLs review"
  exercise="sa-perms-review"
  ownExercise=true
  hosts=["workstation","servera"]
  outcomes=["Build a setgid team directory with the right owners and modes.","Protect a public directory with the sticky bit.","Grant one user narrow access with ACLs and a default ACL."] %}
{% lab-notes %}

**Before you start:** reset the servers and complete this chapter's lessons. You work on **servera**, as root (`sudo -i`); `lab start` and `lab grade` run on workstation.

{% /lab-notes %}

{% lab-challenge %}

On servera:

1. Create the group `analysts` with GID 36000, and the users `dana` and `evan` as members of it. Create `visitor`, who is **not** a member.
2. Create `/srv/analysis`, owned by root with group `analysts`, mode 2770.
3. As `dana`, create `/srv/analysis/summary.txt` containing the line `Quarterly summary`. It must belong to `dana` and `analysts` with mode 660.
4. Create `/srv/analysis/bin/report.sh`, owned by `dana`, group `analysts`, mode 750.
5. Create `/srv/dropbox`, where everyone can create files but delete only their own (mode 1777).
6. With ACLs, let `visitor` read `summary.txt`, and nothing else. `visitor` must also be able to pass through `/srv/analysis`, and files created there in future must grant `visitor` read access.

{% /lab-challenge %}

  {% task id="task-3784e89d777e" title="Start the exercise" %}

```console
[student@workstation ~]$ lab start sa-perms-review
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ sudo -i
[root@servera ~]#
```
  {% /task %}

  {% task id="task-ea482e6cb03b" title="Create the people and the directory" %}

    {% reveal title="Show solution" %}

```console
[root@servera ~]# groupadd -g 36000 analysts
[root@servera ~]# useradd -m -G analysts dana
[root@servera ~]# useradd -m -G analysts evan
[root@servera ~]# useradd -m visitor
[root@servera ~]# install -d -o root -g analysts -m 2770 /srv/analysis
[root@servera ~]# install -d -m 1777 /srv/dropbox
```
    {% /reveal %}
  {% /task %}

  {% task id="task-6838ebd8c2da" title="Create the report and the script" %}

    {% reveal title="Show solution" %}

```console
[root@servera ~]# su - dana -c 'umask 007; echo "Quarterly summary" > /srv/analysis/summary.txt'
[root@servera ~]# su - dana -c 'umask 007; mkdir /srv/analysis/bin; echo "echo report" > /srv/analysis/bin/report.sh'
[root@servera ~]# chmod 750 /srv/analysis/bin/report.sh
[root@servera ~]# ls -lR /srv/analysis
/srv/analysis:
total 8
drwxrws---. 2 dana analysts 4096 Oct  3 16:20 bin
-rw-rw----. 1 dana analysts   18 Oct  3 16:20 summary.txt
...output omitted...
```

    Because `/srv/analysis` is setgid, the group is `analysts` without any `chgrp`. The umask 007 gives the team write access.
    {% /reveal %}
  {% /task %}

  {% task id="task-5ddd74b2a223" title="Give visitor narrow access" %}

    {% reveal title="Show solution" %}

```console
[root@servera ~]# setfacl -m u:visitor:r /srv/analysis/summary.txt
[root@servera ~]# setfacl -m u:visitor:x /srv/analysis
[root@servera ~]# setfacl -d -m u:visitor:r /srv/analysis
[root@servera ~]# su - visitor -c 'cat /srv/analysis/summary.txt'
Quarterly summary
[root@servera ~]# su - visitor -c 'ls /srv/analysis'
ls: cannot open directory '/srv/analysis': Permission denied
```

    `visitor` has `x` only on the directory: they can open a file whose name they know, but cannot list the directory. Run `getfacl` on both paths to review the entries.
    {% /reveal %}
  {% /task %}

  {% task id="task-17e922d81973" title="Grade" %}
    Leave servera, then on workstation:

    {% lab-finish exercise="sa-perms-review" grade=true /%}
  {% /task %}
{% /lab %}
