---
title: "Exercise: Find it in the logs"
seoTitle: "Find it in the logs (RHCSA Practice Exercise)"
description: "Hands-on RHCSA practice: find it in the logs. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 20
---

{% lead %}
Generate some log traffic on servera, and then find each piece of it again, three different ways: in the journal, in a text file, and with a time filter.
{% /lead %}

{% lab
  objectives=["ch11.reading"]
  id="reading"
  title="Find it in the logs"
  hosts=["workstation","servera"]
  outcomes=["Filter the journal by unit, priority, time and pattern.","Find the same event in /var/log/secure.","Write messages with logger and follow them live."] %}

  {% task id="task-9c36e2588f77" title="Log in and look at the newest entries" %}
    Log in to servera as `student`, open a root shell, and show the last five journal entries without a pager.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ sudo -i
[root@servera ~]# journalctl -n 5 --no-pager
...output omitted...
```
    {% /reveal %}
  {% /task %}

  {% task id="task-13906fe1eb60" title="Find your own login" %}
    Find the entries that report your SSH login, in the journal (unit sshd, pattern `Accepted`) and in `/var/log/secure`. Are the two records the same event?

    {% reveal title="Show solution" %}

```console
[root@servera ~]# journalctl -u sshd -g Accepted --no-pager | tail -1
Oct 03 17:05:12 servera.lab.example.com sshd-session[1311]: Accepted publickey for student from 172.25.251.9 port 41412 ssh2: ED25519 SHA256:...
[root@servera ~]# grep Accepted /var/log/secure | tail -1
Oct  3 17:05:12 servera sshd-session[1311]: Accepted publickey for student from 172.25.251.9 port 41412 ssh2: ED25519 SHA256:...
```

    Same event, same PID, two formats: the journal has a long host name and a 24-hour date, the file has the classic syslog layout.
    {% /reveal %}
  {% /task %}

  {% task id="task-328bd3f63a73" title="Write your own and follow it" %}
    In a second terminal, run `journalctl -f`. In the first, send a message with `logger -p user.notice "exercise marker"`. Does it appear? Press Ctrl+C when done.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# journalctl -f
...
[root@servera ~]# logger -p user.notice "exercise marker"
```

    In the first terminal a new line appears at once: `... root[2012]: exercise marker`.
    {% /reveal %}
  {% /task %}

  {% task id="task-f3fa3f0fccc0" title="Use priorities" %}
    Send an error-level message (`logger -p user.err "exercise failure"`). Then show the errors of this boot with `journalctl -p err -b`. Why does the notice not appear?

    {% reveal title="Show solution" %}

```console
[root@servera ~]# logger -p user.err "exercise failure"
[root@servera ~]# journalctl -p err -b --no-pager
Oct 03 17:07:30 servera.lab.example.com root[2050]: exercise failure
```

    `-p err` shows levels 0 to 3. The notice is level 5, so it is filtered out.
    {% /reveal %}
  {% /task %}

  {% task id="task-71555151d9db" title="Filter by time" %}
    Count how many journal entries were written in the last 5 minutes, and show the entries between two clock times of your choice.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# journalctl --since "5 minutes ago" --no-pager | wc -l
87
[root@servera ~]# journalctl --since 17:05 --until 17:06 --no-pager | head -3
...output omitted...
```
    {% /reveal %}
  {% /task %}

  {% task id="task-129eb49e3da5" title="See a field-level view" %}
    Show the last entry in the `verbose` format and find the fields `PRIORITY`, `_PID` and `SYSLOG_IDENTIFIER`.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# journalctl -o verbose -n 1 --no-pager | head -12
Sat 2026-10-03 16:59:31.454299 UTC [s=b7fc6ab...;i=54c;b=1e2a1f4...;m=6a3cd8c;t=65cf292...;x=b9279f2...]
    PRIORITY=6
    SYSLOG_FACILITY=3
    SYSLOG_IDENTIFIER=systemd
    ...output omitted...
[root@servera ~]# exit
[student@servera ~]$ exit
```

    These fields are what the filters (-u, -p, -t) use. You can also filter by any of them: `journalctl _PID=1311`.
    {% /reveal %}
  {% /task %}
{% /lab %}
