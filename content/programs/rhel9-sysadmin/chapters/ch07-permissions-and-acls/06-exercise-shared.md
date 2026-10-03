---
title: "Exercise: Build a team directory and a drop box"
kind: lab
minutes: 25
---

{% lead %}
Two shared spaces on servera: a team directory where `maria` and `john` work on each other's files, and a public drop box where anyone can leave a file but nobody can delete someone else's. You will see why setgid and the umask must work together.
{% /lead %}

{% lab
  objectives=["ch07.defaults"]
  id="shared"
  title="Team directory and drop box"
  hosts=["workstation","servera"]
  outcomes=["Create a setgid directory so new files inherit the team group.","Use the umask so team members can write each other's files.","Protect a public directory with the sticky bit."] %}

  {% task id="task-5339c3f48094" title="Create the people and the team directory" %}
    On servera as root (`sudo -i`), create the group `team` (GID 4700); users `maria` and `john` in `team`; and `priya`, who is not. Then create `/srv/team` owned by `root:team` with mode 2770, in a single command.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ sudo -i
[root@servera ~]# groupadd -g 4700 team
[root@servera ~]# useradd -m -G team maria
[root@servera ~]# useradd -m -G team john
[root@servera ~]# useradd -m priya
[root@servera ~]# install -d -o root -g team -m 2770 /srv/team
[root@servera ~]# ls -ld /srv/team
drwxrws---. 2 root team 4096 Oct  3 16:13 /srv/team
```

    `install -d` creates a directory and sets its owner, group and mode together.
    {% /reveal %}
  {% /task %}

  {% task id="task-b56b62e149ac" title="See the group inherited, but not group write" %}
    As maria, with the default umask, create `/srv/team/note.txt`. Check its group and mode. Then try to append a line as john.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# su - maria -c 'echo plan > /srv/team/note.txt; ls -l /srv/team'
total 4
-rw-r--r--. 1 maria team 5 Oct  3 16:13 note.txt
[root@servera ~]# su - john -c 'echo more >> /srv/team/note.txt'
-bash: line 1: /srv/team/note.txt: Permission denied
```

    The group is `team` thanks to setgid, but the mode is 644 (umask 022), so john cannot write.
    {% /reveal %}
  {% /task %}

  {% task id="task-fb05a59d6045" title="Fix it with the umask" %}
    Repeat as maria with `umask 007` first. Create a new file and a new directory in `/srv/team` and compare their modes. Then check that john can append, and priya can't even list the directory.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# su - maria -c 'umask 007; echo plan > /srv/team/plan.txt; mkdir /srv/team/docs; ls -l /srv/team'
total 8
drwxrws---. 2 maria team 4096 Oct  3 16:13 docs
-rw-r--r--. 1 maria team    5 Oct  3 16:13 note.txt
-rw-rw----. 1 maria team    5 Oct  3 16:13 plan.txt
[root@servera ~]# su - john -c 'echo "john was here" >> /srv/team/plan.txt; cat /srv/team/plan.txt'
plan
john was here
[root@servera ~]# su - priya -c 'ls /srv/team'
ls: cannot open directory '/srv/team': Permission denied
```

    The new directory `docs` inherited both the group and the setgid bit. In real life, the umask goes in each team member's `~/.bashrc` (or you use a default ACL, covered next).
    {% /reveal %}
  {% /task %}

  {% task id="task-bb6d186a9fb7" title="Build the drop box" %}
    Create `/srv/dropbox` with mode 1777. Let maria and priya each leave a file in it. Can priya delete maria's file? Then remove the sticky bit (`chmod -t`) and try again.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# install -d -m 1777 /srv/dropbox
[root@servera ~]# su - maria -c 'echo m > /srv/dropbox/maria.txt'
[root@servera ~]# su - priya -c 'echo p > /srv/dropbox/priya.txt; rm /srv/dropbox/maria.txt'
rm: cannot remove '/srv/dropbox/maria.txt': Operation not permitted
[root@servera ~]# chmod -t /srv/dropbox
[root@servera ~]# su - priya -c 'rm /srv/dropbox/maria.txt; ls /srv/dropbox'
priya.txt
```

    With the sticky bit, priya is stopped; without it, anyone with write access to the directory can delete anything in it.
    {% /reveal %}
  {% /task %}

  {% task id="task-d63a6f86a7f0" title="Find a setuid program" %}
    Look at the permissions of `/usr/bin/passwd` and list the setuid programs under `/usr/bin`. What does the `s` mean?

    {% reveal title="Show solution" %}

```console
[root@servera ~]# ls -l /usr/bin/passwd
-rwsr-xr-x. 1 root root 32656 May 14  2022 /usr/bin/passwd
[root@servera ~]# find /usr/bin -perm -4000
/usr/bin/gpasswd
/usr/bin/su
/usr/bin/sudo
/usr/bin/passwd
...output omitted...
```

    The `s` replaces the owner's `x`: whoever runs the program does so as the file's owner, root. Programs like these need extra care, because any flaw in them runs with root's power.
    {% /reveal %}
  {% /task %}

  {% task id="task-89d73f7b02cf" title="Clean up" %}

    If `userdel` says a user is still in use, a login session from `su` has not closed yet: wait a few seconds and run it again.

```console
[root@servera ~]# rm -rf /srv/team /srv/dropbox
[root@servera ~]# userdel -r maria; userdel -r john; userdel -r priya
[root@servera ~]# groupdel team
[root@servera ~]# exit
[student@servera ~]$ exit
```
  {% /task %}
{% /lab %}
