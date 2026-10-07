---
title: Scheduling jobs with cron
seoTitle: "crontab Tutorial: Schedule Jobs With cron"
description: "Schedule recurring jobs with crontab and /etc/cron.d, read the time fields and avoid the percent trap. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 20
---

{% lead %}
Scripts become really useful when nobody has to start them: the nightly backup, the hourly report, the weekly cleanup. **cron** is the classic scheduler: a service that wakes up every minute and starts the jobs whose time has come. This lesson explains the five-field schedule, the places where jobs are defined, and the traps that make a job work at your prompt and fail silently at night.
{% /lead %}

{% objectives %}
- Read and write the five time fields of a crontab line.
- Create personal jobs with `crontab` and system jobs in `/etc/cron.d`.
- Find out why a job did not run, using `/var/log/cron`, and avoid the usual traps (`%`, PATH, output).
{% /objectives %}

## The schedule

A cron job is one line: five time fields and then the command.

{% diagram ref="crontab-line" /%}

| Expression | Means |
| --- | --- |
| `* * * * *` | Every minute |
| `*/10 * * * *` | Every 10 minutes |
| `30 2 * * *` | Every day at 02:30 |
| `0 9 * * 1-5` | 09:00 on weekdays (Monday to Friday) |
| `0 0 1 * *` | Midnight on the first of each month |
| `15,45 * * * *` | At minute 15 and 45 of every hour |

`*` is "every", `A-B` a range, `A,B` a list and `*/N` a step.

## Where jobs live

| Place | For | Notes |
| --- | --- | --- |
| `crontab -e` (stored in `/var/spool/cron/USER`) | A user's personal jobs | Five fields + command. Runs as that user. |
| `/etc/cron.d/NAME` | System jobs, one file per application | Six fields: the sixth is the **user** to run as |
| `/etc/cron.hourly`, `daily`, `weekly`, `monthly` | Drop in an executable script | Run by `run-parts` at a time cron chooses |
| `/etc/crontab` | The original system file | Prefer `/etc/cron.d` |

```console
[root@servera ~]# ls /etc/cron.d
0hourly  dailyjobs
[root@servera ~]# cat /etc/cron.d/0hourly
# Run the hourly jobs
SHELL=/bin/bash
PATH=/sbin:/bin:/usr/sbin:/usr/bin
MAILTO=root
01 * * * * root run-parts /etc/cron.hourly
```

Use `crontab -l` to list your jobs, `crontab -e` to edit (it opens your `$EDITOR`), and `crontab -r` to remove **all** of them, with no confirmation. As root, add `-u USER` to work on someone else's crontab. `/etc/cron.allow` and `/etc/cron.deny` can limit who may use crontab.

## What a job really sees

cron does not start your command in a login shell. It runs it with `/bin/sh`, a very small `PATH` (`/usr/bin:/bin`), no terminal, and your home as the working directory. So:

- **Use full paths** for commands and files (`/usr/local/bin/report.sh`, not `report.sh`).
- **Do not rely on variables** from your `.bashrc`; set them in the crontab or in the script.
- **Redirect output**: whatever the job prints is mailed to `MAILTO`, or lost if no mail system exists. Append to a log: `>> /var/log/report.log 2>&1`.
- **Escape `%`**: in a crontab a `%` means a newline, so `date +%T` breaks.

That last trap is easy to demonstrate. This job looks right:

```console
[root@servera ~]# echo '* * * * * echo "cron ran at $(date +%T)" >> /home/student/cron.out' > /tmp/ct
[root@servera ~]# crontab -u student /tmp/ct
```

but a minute later the cron log shows it failing:

```console
[root@servera ~]# grep CROND /var/log/cron | tail -1 | cut -c1-140
Oct  3 17:50:01 servera CROND[732]: (student) CMDOUT (/bin/sh: -c: line 1: unexpected EOF while looking for matching `)')
```

The `%T` was cut at the percent sign. With the escape it works:

```console
[root@servera ~]# echo '* * * * * echo "cron ran at $(date +\%T)" >> /home/student/cron.out' > /tmp/ct
[root@servera ~]# crontab -u student /tmp/ct
[root@servera ~]# crontab -u student -l
* * * * * echo "cron ran at $(date +\%T)" >> /home/student/cron.out
[root@servera ~]# cat /home/student/cron.out
cron ran at 17:52:01
[root@servera ~]# grep CROND /var/log/cron | tail -1 | cut -c1-150
Oct  3 17:52:01 servera CROND[845]: (student) CMDEND (echo "cron ran at $(date +%T)" >> /home/student/cron.out)
```

## System jobs in /etc/cron.d

A file here has the same lines plus a user, and may set `SHELL`, `PATH` and `MAILTO` at the top. A typical file for an application:

```console
[root@servera ~]# cat /etc/cron.d/sa-report
PATH=/usr/local/bin:/usr/bin:/bin
15 6 * * 1-5 root /usr/local/bin/sa-report.sh /etc >> /var/log/sa-report.log 2>&1
```

Files in `/etc/cron.d` must be owned by root and not writable by others; cron ignores unsafe ones. Keep names without dots or tildes. `/var/log/cron` is the place to check that a job ran at all, and what it printed.

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch15.cron"] ref="quick" /%}
