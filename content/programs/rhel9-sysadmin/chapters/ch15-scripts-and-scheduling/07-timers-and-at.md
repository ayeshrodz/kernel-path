---
title: systemd timers and one-off jobs
seoTitle: "systemd Timers vs cron, and the at Command"
description: "Run jobs with systemd timers and OnCalendar, and schedule one-off jobs with at. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 20
---

{% lead %}
cron is not the only scheduler. On RHEL, systemd can start services on a schedule too, with some advantages: every run is an ordinary service run, logged in the journal, and a run missed while the machine was off can be made up. And for a job that should run **once**, later, there is `at`. This lesson shows both, and helps you choose.
{% /lead %}

{% objectives %}
- Write a service and a timer, enable the timer, and read `systemctl list-timers`.
- Write calendar expressions and test them with `systemd-analyze calendar`.
- Schedule a one-time job with `at`, and choose between cron, a timer and `at`.
{% /objectives %}

## Choosing a scheduler

{% diagram ref="schedulers" /%}

## A timer is two units

A job is a **service** (what to run); the schedule is a **timer** (when). They share a name. Here is a small pair that writes a message to the journal:

```console
[root@servera ~]# cat /etc/systemd/system/hello.service
[Unit]
Description=Write a hello line to the journal

[Service]
Type=oneshot
ExecStart=/usr/bin/logger -t hello-timer "hello from the timer"
[root@servera ~]# cat /etc/systemd/system/hello.timer
[Unit]
Description=Run hello every minute

[Timer]
OnCalendar=*-*-* *:*:00
Persistent=true

[Install]
WantedBy=timers.target
```

`Type=oneshot` says the service runs a command and exits; it has no `[Install]` section because it is started by the timer. The timer's `OnCalendar=` gives the schedule, and `Persistent=true` makes systemd run a job that was missed while the machine was off.

{% diagram ref="timer-pair" /%}

```console
[root@servera ~]# systemctl daemon-reload
[root@servera ~]# systemctl enable --now hello.timer
Created symlink /etc/systemd/system/timers.target.wants/hello.timer → /etc/systemd/system/hello.timer.
[root@servera ~]# systemctl list-timers hello.timer --no-pager
NEXT                        LEFT     LAST PASSED UNIT        ACTIVATES
Sat 2026-10-03 17:54:00 UTC 26s left -    -      hello.timer hello.service

1 timers listed.
[root@servera ~]# journalctl -t hello-timer --no-pager | tail -1 | cut -c1-110
Oct 03 17:54:03 servera.lab.example.com hello-timer[1327]: hello from the timer
```

You can test the job without waiting: `systemctl start hello.service` runs it right now.

### Calendar expressions

`OnCalendar=` takes `DayOfWeek Year-Month-Day Hour:Minute:Second`, with `*` for "any" and `,` `..` `/` for lists, ranges and steps. Shortcuts exist: `hourly`, `daily`, `weekly`, `monthly`. Always test an expression before you rely on it:

```console
[root@servera ~]# systemd-analyze calendar 'Mon *-*-* 09:30'
  Original form: Mon *-*-* 09:30
Normalized form: Mon *-*-* 09:30:00
    Next elapse: Mon 2026-10-05 09:30:00 UTC
       From now: 1 day 15h left
[root@servera ~]# systemd-analyze calendar daily
  Original form: daily
Normalized form: *-*-* 00:00:00
    Next elapse: Sun 2026-10-04 00:00:00 UTC
       From now: 6h left
```

The system already uses timers: `systemctl list-timers` shows the tidying of temporary files, the log rotation (`logrotate.timer`, chapter 11), and the package cache refresh.

Other triggers exist besides calendars: `OnBootSec=5min` (5 minutes after boot), `OnUnitActiveSec=1h` (an hour after the service last ran). And `systemd-run --on-active=30s COMMAND` creates a throw-away timer for a single run.

## at: run it once

`at` takes a time, then reads commands from standard input. It is in the `at` package, and needs `atd` running (`dnf install at; systemctl enable --now atd`):

```console
[student@servera ~]$ echo "echo at job ran > /home/student/at.out" | at now + 1 minute
warning: commands will be executed using /bin/sh
job 1 at Sat Oct  3 17:53:00 2026
[student@servera ~]$ atq
1	Sat Oct  3 17:53:00 2026 a student
[student@servera ~]$ atrm 1
```

Times can be `now + 5 minutes`, `17:30`, `tomorrow`, `noon next friday`. `atq` lists your pending jobs, `at -c N` shows one, and `atrm N` deletes it. The job runs with the environment captured at the moment you submitted it.

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch15.timers"] ref="quick" /%}
