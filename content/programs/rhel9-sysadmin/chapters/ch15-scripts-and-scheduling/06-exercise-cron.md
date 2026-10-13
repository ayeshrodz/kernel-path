---
title: "Exercise: Schedule a job"
seoTitle: "Schedule a job (RHCSA Practice Exercise)"
description: "Hands-on RHCSA practice: schedule a job. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 25
---

{% lead %}
Put a job in a personal crontab, watch it fail because of an unescaped `%`, fix it, then set up a system job in `/etc/cron.d` that runs as root and logs to its own file.
{% /lead %}

{% lab
  objectives=["ch15.cron"]
  id="cron"
  title="Schedule a job"
  exercise="sa-cron"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera"]
  outcomes=["Create a personal crontab entry and read the cron log.","Diagnose and fix the percent-sign problem.","Create a system job in /etc/cron.d."] %}

  {% task id="task-e01c5e932d9e" title="Start the exercise" %}
    On workstation, start the exercise. It removes cron jobs and output files of an earlier run from servera and makes sure crond runs.

```console
[student@workstation ~]$ lab start sa-cron
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-d99ea3db39cb" title="Look at what is scheduled" %}
    On servera as root (`sudo -i`), list the system cron files, show `0hourly`, and check whether `student` has a crontab.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ sudo -i
[root@servera ~]# ls /etc/cron.d
0hourly  dailyjobs
[root@servera ~]# cat /etc/cron.d/0hourly
# Run the hourly jobs
SHELL=/bin/bash
PATH=/sbin:/bin:/usr/sbin:/usr/bin
MAILTO=root
01 * * * * root run-parts /etc/cron.hourly
[root@servera ~]# crontab -u student -l
no crontab for student
```
    {% /reveal %}
  {% /task %}

  {% task id="task-a9d2fcf8cbd0" title="A job that looks right" %}
    Install a crontab for `student` that every minute appends `cron ran at HH:MM:SS` (use `$(date +%T)`) to `/home/student/cron.out`. Wait two minutes. Is there any output? Find out why in `/var/log/cron`.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# echo '* * * * * echo "cron ran at $(date +%T)" >> /home/student/cron.out' > /tmp/ct
[root@servera ~]# crontab -u student /tmp/ct
[root@servera ~]# crontab -u student -l
* * * * * echo "cron ran at $(date +%T)" >> /home/student/cron.out
[root@servera ~]# sleep 90; ls /home/student/cron.out
ls: cannot access '/home/student/cron.out': No such file or directory
[root@servera ~]# grep CROND /var/log/cron | tail -2 | cut -c1-140
Oct  3 17:50:01 servera CROND[732]: (student) CMDOUT (/bin/sh: -c: line 1: unexpected EOF while looking for matching `)')
Oct  3 17:50:01 servera CROND[732]: (student) CMDOUT (/bin/sh: -c: line 2: syntax error: unexpected end of file)
```

    No file, and the log gives the reason: a syntax error. cron treated the `%` in `+%T` as a line break.
    {% /reveal %}
  {% /task %}

  {% task id="task-016505bf0c7f" title="Fix it" %}
    Escape the percent sign, install the crontab again, wait for the next minute, and check the output and the log.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# echo '* * * * * echo "cron ran at $(date +\%T)" >> /home/student/cron.out' > /tmp/ct
[root@servera ~]# crontab -u student /tmp/ct
[root@servera ~]# sleep 62; cat /home/student/cron.out
cron ran at 17:52:01
[root@servera ~]# grep CROND /var/log/cron | tail -1 | cut -c1-150
Oct  3 17:52:01 servera CROND[845]: (student) CMDEND (echo "cron ran at $(date +%T)" >> /home/student/cron.out)
```
    {% /reveal %}
  {% /task %}

  {% task id="task-e538abf447a6" title="A system job" %}
    Create `/etc/cron.d/demo` that runs `/usr/bin/logger -t cron-demo hello` as root every 2 minutes. Check the file permissions and wait for the first run. Where does the output appear?

    {% reveal title="Show solution" %}

```console
[root@servera ~]# echo '*/2 * * * * root /usr/bin/logger -t cron-demo hello' > /etc/cron.d/demo
[root@servera ~]# ls -l /etc/cron.d/demo
-rw-r--r--. 1 root root 52 Oct  3 17:52 /etc/cron.d/demo
[root@servera ~]# sleep 120; journalctl -t cron-demo --no-pager | tail -1 | cut -c1-90
Oct 03 17:54:01 servera.lab.example.com cron-demo[1011]: hello
[root@servera ~]# grep 'demo' /var/log/cron | tail -1 | cut -c1-110
Oct  3 17:54:01 servera CROND[1010]: (root) CMD (/usr/bin/logger -t cron-demo hello)
```

    The message appears in the journal (logger's job), and cron logs only that it started the command.
    {% /reveal %}
  {% /task %}

  {% task id="task-c4f416e79bc4" title="Grade and finish" %}
    {% lab-finish exercise="sa-cron" grade=true servers=true /%}
  {% /task %}
{% /lab %}
