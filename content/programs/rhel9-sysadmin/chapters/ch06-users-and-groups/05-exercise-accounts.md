---
title: "Exercise: Set up a web team"
kind: lab
minutes: 15
---

{% lead %}
On servera, create a group for a web team, two people in it, and a service account for the team's application that owns files but can't log in. Then make the classic group mistake on purpose, and fix it.
{% /lead %}

{% lab
  objectives=["ch06.accounts","ch06.concepts"]
  id="accounts"
  title="Set up a web team"
  hosts=["workstation","servera"]
  outcomes=["Create a group with a chosen GID and users with supplementary groups.","Create a service account with nologin.","Recover from replacing a user's groups by mistake."] %}

  {% task id="task-e9566e8670be" title="Create the group" %}
    On servera, open a root shell with `sudo -i`, and create the group `webteam` with GID 40000.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ sudo -i
[root@servera ~]# groupadd -g 40000 webteam
```
    {% /reveal %}
  {% /task %}

  {% task id="task-282834e7cfab" title="Create alice and bob in the team" %}
    Create `alice` ("Alice Admin") directly in `webteam`. Create `bob` ("Bob Builder") first, then add him to `webteam` afterwards.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# useradd -c "Alice Admin" -G webteam alice
[root@servera ~]# useradd -c "Bob Builder" bob
[root@servera ~]# usermod -aG webteam bob
[root@servera ~]# id alice; id bob
uid=1001(alice) gid=1001(alice) groups=1001(alice),40000(webteam)
uid=1002(bob) gid=1002(bob) groups=1002(bob),40000(webteam)
[root@servera ~]# grep webteam /etc/group
webteam:x:40000:alice,bob
```

    Each person keeps a private primary group; `webteam` is a supplementary group for both.
    {% /reveal %}
  {% /task %}

  {% task id="task-a42c6e7290bc" title="Create the service account" %}
    The application runs as `webapp`: UID 4000, primary group `webteam`, comment "Web application", and no interactive logins.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# useradd -u 4000 -g webteam -s /sbin/nologin -c "Web application" webapp
[root@servera ~]# grep webapp /etc/passwd
webapp:x:4000:40000:Web application:/home/webapp:/sbin/nologin
[root@servera ~]# su - webapp
This account is currently not available.
```

    Even root can't get a shell as `webapp`: `/sbin/nologin` prints that message and exits. Files the application creates belong to `webteam`, so alice and bob can be given access to them.
    {% /reveal %}
  {% /task %}

  {% task id="task-c59e15d85559" title="Make the -G mistake, and fix it" %}
    Bob also needs `wheel`. Run `usermod` **without** `-a` and look at what happened:

```console
[root@servera ~]# usermod -G wheel bob
[root@servera ~]# id bob
uid=1002(bob) gid=1002(bob) groups=1002(bob),10(wheel)
```

    `webteam` is gone: `-G` replaced the list. Put it back:

```console
[root@servera ~]# usermod -aG webteam bob
[root@servera ~]# id bob
uid=1002(bob) gid=1002(bob) groups=1002(bob),10(wheel),40000(webteam)
```
  {% /task %}

  {% task id="task-885e86e08c9a" title="Look at the home directories" %}

```console
[root@servera ~]# ls -ld /home/alice /home/bob /home/webapp
drwx------. 2 alice  alice   4096 Oct  3 10:36 /home/alice
drwx------. 2 bob    bob     4096 Oct  3 10:36 /home/bob
drwx------. 2 webapp webteam 4096 Oct  3 10:36 /home/webapp
```

    Mode `700` (`drwx------`): each owner, and nobody else, may enter their home. `/home/webapp` belongs to the group `webteam` because that is webapp's primary group.
  {% /task %}

  {% task id="task-4d710a1ff0e6" title="Clean up" %}
    Delete the three accounts with their home directories, then the group. If `userdel` reports that a user *is currently used by process* N, a process still runs as that account (for example from an earlier `su`): wait a moment and try again, or reset servera.

```console
[root@servera ~]# userdel -r alice; userdel -r bob; userdel -r webapp
[root@servera ~]# groupdel webteam
[root@servera ~]# exit
[student@servera ~]$ exit
```
  {% /task %}
{% /lab %}
