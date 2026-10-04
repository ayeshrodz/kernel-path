---
title: "Exercise: Scripts and scheduling review"
kind: lab
minutes: 40
---

{% lead %}
Write a small reporting tool, test it against good and bad input, and then schedule it three ways: a system cron job, a personal crontab heartbeat, and a systemd timer.
{% /lead %}

{% lab
  objectives=["ch15.scripts","ch15.logic","ch15.cron","ch15.timers"]
  id="review"
  title="Scripts and scheduling review"
  exercise="sa-scripts-review"
  ownExercise=true
  hosts=["workstation","servera"]
  outcomes=["Write a script that validates arguments and sets exit statuses.","Schedule it with cron.d, a personal crontab and a systemd timer."] %}
{% lab-notes %}

**Before you start:** reset the servers and complete this chapter's lessons. You work on **servera** as root (`sudo -i`); `lab start` and `lab grade` run on workstation. The grader **runs your script** as an ordinary user with several arguments and checks its output and exit status.

{% /lab-notes %}

{% lab-challenge %}

On servera:

1. Write `/usr/local/bin/sa-report.sh` (mode 755): for a directory argument it prints `Directory: NAME`, `Files: N` (regular files directly inside) and `Bytes: N` (their total size) and exits 0; without exactly one argument it prints `Usage: …` to standard error and exits 2; for a non-directory it prints `… is not a directory` to standard error and exits 1.
2. Create `/etc/cron.d/sa-report` to run it on `/etc/ssh` as root at 06:15 on weekdays.
3. Give `student` a crontab entry that runs `/usr/bin/logger -t sa-heartbeat alive` every 10 minutes.
4. Create `sa-report.service` (oneshot, runs the script on `/etc`) and `sa-report.timer` (daily at 02:30, `Persistent=true`), and enable the timer.

{% /lab-challenge %}

  {% task id="task-3b1891120680" title="Start the exercise" %}

```console
[student@workstation ~]$ lab start sa-scripts-review
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ sudo -i
[root@servera ~]#
```
  {% /task %}

  {% task id="task-f902374e39a6" title="The script" %}

    {% reveal title="Show solution" %}

```console
[root@servera ~]# cat > /usr/local/bin/sa-report.sh <<'EOT'
#!/bin/bash
# Report the number and size of the files directly inside a directory
if [ $# -ne 1 ]; then
  echo "Usage: $0 DIRECTORY" >&2
  exit 2
fi
dir=$1
if [ ! -d "$dir" ]; then
  echo "$dir is not a directory" >&2
  exit 1
fi
files=0
bytes=0
for f in "$dir"/*; do
  if [ -f "$f" ]; then
    files=$((files + 1))
    bytes=$((bytes + $(stat -c %s "$f")))
  fi
done
echo "Directory: $dir"
echo "Files: $files"
echo "Bytes: $bytes"
EOT
[root@servera ~]# chmod 755 /usr/local/bin/sa-report.sh
[root@servera ~]# sa-report.sh /etc/ssh
Directory: /etc/ssh
Files: 9
Bytes: 551646
[root@servera ~]# sa-report.sh; echo "rc=$?"
Usage: /usr/local/bin/sa-report.sh DIRECTORY
rc=2
[root@servera ~]# sa-report.sh /etc/hostname; echo "rc=$?"
/etc/hostname is not a directory
rc=1
```

    The numbers depend on your system. Test as an ordinary user too: `su - student -c '/usr/local/bin/sa-report.sh /etc/ssh'`.
    {% /reveal %}
  {% /task %}

  {% task id="task-1d30877889ff" title="The cron jobs" %}

    {% reveal title="Show solution" %}

```console
[root@servera ~]# cat > /etc/cron.d/sa-report <<'EOT'
PATH=/usr/local/bin:/usr/bin:/bin
15 6 * * 1-5 root /usr/local/bin/sa-report.sh /etc/ssh >> /var/log/sa-report.log 2>&1
EOT
[root@servera ~]# echo '*/10 * * * * /usr/bin/logger -t sa-heartbeat alive' > /tmp/ct
[root@servera ~]# crontab -u student /tmp/ct
[root@servera ~]# crontab -u student -l
*/10 * * * * /usr/bin/logger -t sa-heartbeat alive
```
    {% /reveal %}
  {% /task %}

  {% task id="task-3011000975d6" title="The timer" %}

    {% reveal title="Show solution" %}

```console
[root@servera ~]# cat > /etc/systemd/system/sa-report.service <<'EOT'
[Unit]
Description=Report on /etc

[Service]
Type=oneshot
ExecStart=/usr/local/bin/sa-report.sh /etc
EOT
[root@servera ~]# cat > /etc/systemd/system/sa-report.timer <<'EOT'
[Unit]
Description=Run the report daily

[Timer]
OnCalendar=*-*-* 02:30:00
Persistent=true

[Install]
WantedBy=timers.target
EOT
[root@servera ~]# systemctl daemon-reload
[root@servera ~]# systemctl enable --now sa-report.timer
[root@servera ~]# systemctl list-timers sa-report.timer --no-pager
[root@servera ~]# systemctl start sa-report.service && journalctl -u sa-report.service -n 3 --no-pager
```
    {% /reveal %}
  {% /task %}

  {% task id="task-ba78cc1ba75b" title="Grade" %}
    Leave servera, then on workstation:

    {% lab-finish exercise="sa-scripts-review" grade=true servers=true /%}
  {% /task %}
{% /lab %}
