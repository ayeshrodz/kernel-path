---
title: "Exercise: Answer questions with grep"
seoTitle: "Answer questions with grep (RHCSA Practice Exercise)"
description: "Hands-on RHCSA practice: answer questions with grep. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 15
---

{% lead %}
Use grep on servera's real configuration files and logs to answer an administrator's everyday questions: which groups is this user in, who can log in with a shell, where is a setting defined, and what has been run with sudo.
{% /lead %}

{% lab
  objectives=["ch05.grep"]
  id="grep"
  title="Answer questions with grep"
  hosts=["workstation","servera"]
  outcomes=["Search several files at once and read grep's file-name prefixes.","Use anchors, -r, -l, -n and -E.","Search files only root can read with sudo."] %}

  {% task id="task-1c5ccb7aec03" title="Which entries mention student?" %}
    On servera, search both `/etc/passwd` and `/etc/group` in one command.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ grep student /etc/passwd /etc/group
/etc/passwd:student:x:1000:1000:Student User:/home/student:/bin/bash
/etc/group:wheel:x:10:student
/etc/group:student:x:1000:
```

    With several files, grep starts each line with the file name. student is a member of the `wheel` group, which is what lets it use sudo; chapter 6 explains why.
    {% /reveal %}
  {% /task %}

  {% task id="task-9292bfffd67b" title="Which accounts log in with Bash?" %}
    The login shell is the last field of each line in `/etc/passwd`. Anchor your pattern to the end of the line.

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ grep 'bash$' /etc/passwd
root:x:0:0:root:/root:/bin/bash
student:x:1000:1000:Student User:/home/student:/bin/bash
```
    {% /reveal %}
  {% /task %}

  {% task id="task-fe4369dab248" title="Where is password login for SSH configured?" %}
    List the files under `/etc/ssh` that mention `PasswordAuthentication`, then show the matching line, with its number, in the file in `sshd_config.d`.

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ sudo grep -rl PasswordAuthentication /etc/ssh/
/etc/ssh/sshd_config.d/50-cloud-init.conf
/etc/ssh/ssh_config
/etc/ssh/sshd_config
[student@servera ~]$ sudo grep -n PasswordAuthentication /etc/ssh/sshd_config.d/50-cloud-init.conf
1:PasswordAuthentication yes
[student@servera ~]$ sudo grep -n '^#\?PasswordAuthentication' /etc/ssh/sshd_config
65:#PasswordAuthentication yes
```

    In the main file the setting is commented out; the active value comes from the drop-in file the lab profile created. In basic syntax, `\?` makes the `#` optional, so the last search finds the line whether or not it is commented. Chapter 10 explains how these files combine.
    {% /reveal %}
  {% /task %}

  {% task id="task-46523e293858" title="What has been run with sudo?" %}
    sudo records every command it runs in `/var/log/secure`, on lines containing `COMMAND=`. Show the last two.

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ sudo grep 'COMMAND=' /var/log/secure | tail -n 2
Oct  3 10:18:59 servera sudo[794]: student : TTY=pts/0 ; PWD=/home/student ; USER=root ; COMMAND=/bin/grep -rl PasswordAuthentication /etc/ssh/
Oct  3 10:18:59 servera sudo[800]: student : TTY=pts/0 ; PWD=/home/student ; USER=root ; COMMAND=/bin/grep -n PasswordAuthentication /etc/ssh/sshd_config.d/50-cloud-init.conf
```

    Your own searches from the previous task are there: who ran them, from which directory, and exactly what. This record is one reason to use sudo rather than share root's password.
    {% /reveal %}
  {% /task %}

  {% task id="task-73612b7bd5da" title="What does chrony actually use?" %}
    Show only the `pool` or `server` lines of `/etc/chrony.conf`, using an extended expression, and count its empty lines.

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ grep -E '^(pool|server) ' /etc/chrony.conf
pool 2.rocky.pool.ntp.org iburst
[student@servera ~]$ grep -c '^$' /etc/chrony.conf
15
[student@servera ~]$ exit
```
    {% /reveal %}
  {% /task %}
{% /lab %}
