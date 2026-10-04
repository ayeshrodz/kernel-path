---
title: "Exercise: Logs and time review"
kind: lab
minutes: 30
---

{% lead %}
Prepare servera for a new application: a journal that survives reboots, a log file of its own that rotates, and a clock set to the right zone with an extra time source.
{% /lead %}

{% lab
  objectives=["ch11.reading","ch11.retention","ch11.time","ch11.diagnosis"]
  id="review"
  title="Logs and time review"
  exercise="sa-logs-review"
  ownExercise=true
  hosts=["workstation","servera"]
  outcomes=["Make the journal persistent with a size limit.","Create an rsyslog rule and a logrotate rule for an application.","Set the time zone and add an NTP source."] %}
{% lab-notes %}

**Before you start:** reset the servers and complete this chapter's lessons. You work on **servera** as root (`sudo -i`); `lab start` and `lab grade` run on workstation.

{% /lab-notes %}

{% lab-challenge %}

On servera:

1. Make the journal persistent: create `/var/log/journal` and a drop-in `/etc/systemd/journald.conf.d/10-retention.conf` with `Storage=persistent` and `SystemMaxUse=100M`. Restart `systemd-journald` and run `journalctl --flush`.
2. Write `/etc/rsyslog.d/10-appserver.conf` so that facility `local6` (all priorities) goes to `/var/log/appserver.log`. Restart rsyslog, then send the message `drill complete` to it with `logger`.
3. Write `/etc/logrotate.d/appserver` to rotate that file weekly, keep 6 copies and compress them.
4. Set the time zone to `Asia/Colombo`, add `server 0.pool.ntp.org iburst` to `/etc/chrony.conf`, and restart chronyd.
5. On workstation, fill in `answers.txt`.

{% /lab-challenge %}

  {% task id="task-ae180b270634" title="Start the exercise" %}

```console
[student@workstation ~]$ lab start sa-logs-review
[student@workstation ~]$ cd ~/sa-logs-review
[student@workstation sa-logs-review]$ ssh student@servera
[student@servera ~]$ sudo -i
[root@servera ~]#
```
  {% /task %}

  {% task id="task-14617a623a90" title="Journal and application log" %}

    {% reveal title="Show solution" %}

```console
[root@servera ~]# mkdir -p /var/log/journal /etc/systemd/journald.conf.d
[root@servera ~]# printf '[Journal]\nStorage=persistent\nSystemMaxUse=100M\n' > /etc/systemd/journald.conf.d/10-retention.conf
[root@servera ~]# systemctl restart systemd-journald
[root@servera ~]# journalctl --flush
[root@servera ~]# echo 'local6.* /var/log/appserver.log' > /etc/rsyslog.d/10-appserver.conf
[root@servera ~]# systemctl restart rsyslog
[root@servera ~]# logger -p local6.notice "drill complete"
[root@servera ~]# cat /var/log/appserver.log
Oct  3 17:20:11 servera root[2301]: drill complete
```
    {% /reveal %}
  {% /task %}

  {% task id="task-c294037e03f2" title="Rotation" %}

    {% reveal title="Show solution" %}

```console
[root@servera ~]# cat > /etc/logrotate.d/appserver <<'EOT'
/var/log/appserver.log {
    weekly
    rotate 6
    compress
    missingok
    notifempty
    create 0640 root root
}
EOT
[root@servera ~]# logrotate -d /etc/logrotate.d/appserver 2>&1 | tail -3
```

    Do not force a rotation with `-f` before grading: it would move the drill message out of the live file.
    {% /reveal %}
  {% /task %}

  {% task id="task-fda5a7c3a86e" title="Time zone and time source" %}

    {% reveal title="Show solution" %}

```console
[root@servera ~]# timedatectl set-timezone Asia/Colombo
[root@servera ~]# echo 'server 0.pool.ntp.org iburst' >> /etc/chrony.conf
[root@servera ~]# systemctl restart chronyd
[root@servera ~]# sleep 10; chronyc sources | head -6
[root@servera ~]# exit
[student@servera ~]$ exit
```
    {% /reveal %}
  {% /task %}

  {% task id="task-5d38583a50de" title="Answers and grade" %}
    On workstation, fill in `answers.txt` and grade:

    {% lab-finish exercise="sa-logs-review" grade=true servers=true /%}
  {% /task %}
{% /lab %}
