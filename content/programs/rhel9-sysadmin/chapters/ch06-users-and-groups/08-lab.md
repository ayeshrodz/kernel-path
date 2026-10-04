---
title: "Exercise: Users and groups review"
kind: lab
minutes: 30
---

{% lead %}
Set up access on serverb for an operations team: a group, an administrator who must change a temporary password and follow the password policy, an auditor whose account is locked and expires, a service account that can't log in, and a sudo rule that lets the team manage services and do nothing else as root.
{% /lead %}

{% lab
  objectives=["ch06.concepts","ch06.superuser","ch06.accounts","ch06.passwords"]
  id="review"
  title="Users and groups review"
  exercise="sa-users-review"
  ownExercise=true
  hosts=["workstation","serverb"]
  outcomes=["Create groups and accounts with chosen IDs, groups and shells.","Apply password policy, locking and expiry.","Grant narrow sudo access with a checked drop-in file."] %}
{% lab-notes %}

**Before you start:** reset the servers and complete this chapter's lessons. You work on **serverb**, as root (`sudo -i`); `lab start` and `lab grade` run on workstation.

{% /lab-notes %}

{% lab-challenge %}

On serverb:

1. Create the group `operators` with GID 35000.
2. Create `opsadmin`: UID 3101, supplementary group `operators`, comment "Operations Admin". Set the password `Temp-Pass-2026`, which must be changed at the first login. Passwords must change at least every 60 days, with 10 days of warning.
3. Create `auditor`: comment "Security Auditor", not in `operators`. Set the password `Audit-Pass-2026`, then lock it. The account expires on 2026-12-31.
4. Create the service account `backup`: UID 3200, primary group `operators`, login shell `/sbin/nologin`.
5. Let members of `operators` run `/usr/bin/systemctl`, with any arguments, as any user, after entering their own password. Put the rule in `/etc/sudoers.d/operators`, mode 440, with nothing else in the file.

{% /lab-challenge %}

  {% task id="task-b8092adb1b55" title="Start the exercise" %}

```console
[student@workstation ~]$ lab start sa-users-review
[student@workstation ~]$ ssh student@serverb
[student@serverb ~]$ sudo -i
[root@serverb ~]#
```
  {% /task %}

  {% task id="task-94db73f35aa3" title="Create the group and opsadmin" %}

    {% reveal title="Show solution" %}

```console
[root@serverb ~]# groupadd -g 35000 operators
[root@serverb ~]# useradd -u 3101 -G operators -c "Operations Admin" opsadmin
[root@serverb ~]# passwd opsadmin
...
[root@serverb ~]# chage -d 0 -M 60 -W 10 opsadmin
[root@serverb ~]# id opsadmin
uid=3101(opsadmin) gid=3101(opsadmin) groups=3101(opsadmin),35000(operators)
```

    One `chage` can set several limits at once.
    {% /reveal %}
  {% /task %}

  {% task id="task-6109362d7b76" title="Create auditor, then lock and expire it" %}

    {% reveal title="Show solution" %}

```console
[root@serverb ~]# useradd -c "Security Auditor" auditor
[root@serverb ~]# passwd auditor
...
[root@serverb ~]# usermod -L auditor
[root@serverb ~]# chage -E 2026-12-31 auditor
[root@serverb ~]# passwd -S auditor
auditor LK 2026-10-03 0 99999 7 -1 (Password locked.)
```
    {% /reveal %}
  {% /task %}

  {% task id="task-91e1e0f3f290" title="Create the backup service account" %}

    {% reveal title="Show solution" %}

```console
[root@serverb ~]# useradd -u 3200 -g operators -s /sbin/nologin backup
[root@serverb ~]# grep backup /etc/passwd
backup:x:3200:35000::/home/backup:/sbin/nologin
```
    {% /reveal %}
  {% /task %}

  {% task id="task-0cbef7cd1174" title="Write and check the sudo rule" %}

    {% reveal title="Show solution" %}

```console
[root@serverb ~]# echo '%operators ALL=(ALL) /usr/bin/systemctl' > /etc/sudoers.d/operators
[root@serverb ~]# chmod 440 /etc/sudoers.d/operators
[root@serverb ~]# visudo -c
/etc/sudoers: parsed OK
/etc/sudoers.d/operators: parsed OK
```

    A command listed without arguments may be run with any arguments. Test it: `su - opsadmin` (it asks for a new password first), then `sudo -l`.
    {% /reveal %}
  {% /task %}

  {% task id="task-08e46a024567" title="Grade and finish" %}
    Leave serverb, then on workstation:

    {% lab-finish exercise="sa-users-review" grade=true servers=true /%}
  {% /task %}
{% /lab %}
