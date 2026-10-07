---
title: "Keeping logs: persistence and rotation"
seoTitle: "Persistent journald Logs, rsyslog and logrotate"
description: "Make the journal persistent, send messages to files with rsyslog and rotate logs with logrotate. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 20
---

{% lead %}
A log is only useful if it is still there when you need it. By default on this image the journal lives in memory and vanishes at reboot, which is exactly when you most want to know what happened. And text logs that are never trimmed will eventually fill the disk. This lesson covers making the journal persistent, adding your own log files, and keeping all of them under control.
{% /lead %}

{% objectives %}
- Make the journal persistent, limit its size, and clean it up with `journalctl --vacuum-*`.
- Add a custom rsyslog rule that writes a facility to its own file.
- Write a logrotate rule, test it with `-d`, and force it with `-f`.
{% /objectives %}

## A journal that survives reboots

{% diagram ref="journal-storage" /%}

On this image `/var/log/journal` does not exist, so `Storage=auto` behaves like `volatile` and only the current boot is available:

```console
[root@servera ~]# journalctl --list-boots
IDX BOOT ID                          FIRST ENTRY                 LAST ENTRY
  0 e223ff84f70141d5b05d37983cb06b03 Sat 2026-10-03 17:00:58 UTC Sat 2026-10-03 17:01:08 UTC
```

Creating the directory, restarting journald, and then **flushing** is enough to start keeping the journal on disk. The flush moves what the journal already holds in memory to the new directory; without it, the current boot's messages stay in memory and are lost at the next reboot:

```console
[root@servera ~]# mkdir -p /var/log/journal
[root@servera ~]# systemctl restart systemd-journald
[root@servera ~]# journalctl --flush
[root@servera ~]# ls /var/log/journal
abfe75218e6b48b780e28b39cd961fcf
```

After the next reboot, `journalctl --list-boots` shows more than one boot, and `journalctl -b -1` shows the previous one. To put limits on the journal, add a drop-in (rather than editing `/etc/systemd/journald.conf`):

```console
[root@servera ~]# mkdir -p /etc/systemd/journald.conf.d
[root@servera ~]# cat > /etc/systemd/journald.conf.d/10-retention.conf <<'EOT'
[Journal]
Storage=persistent
SystemMaxUse=200M
EOT
[root@servera ~]# systemctl restart systemd-journald
[root@servera ~]# journalctl --flush
```

To clean up by hand: `journalctl --vacuum-size=100M` or `journalctl --vacuum-time=2weeks` delete the oldest archived files until the limit is met.

## Your own log file with rsyslog

Programs can log to a **facility** (`local0` to `local7` are free for your own use) with a priority. An rsyslog rule says where a facility goes. Put it in `/etc/rsyslog.d/`, which the main file includes:

```console
[root@servera ~]# echo 'local5.* /var/log/myapp.log' > /etc/rsyslog.d/10-myapp.conf
[root@servera ~]# systemctl restart rsyslog
[root@servera ~]# logger -p local5.info "myapp started"
[root@servera ~]# cat /var/log/myapp.log
Oct  3 17:00:03 servera root[867]: myapp started
```

The rule reads *facility.priority*, then the destination; `*` means every priority. Everything is still in the journal too.

## Rotating text logs

Text logs grow without end. **logrotate** runs daily from a systemd timer and applies the rules in `/etc/logrotate.conf` and `/etc/logrotate.d/`:

{% diagram ref="rotation" /%}

A rule for our file:

```console
[root@servera ~]# cat /etc/logrotate.d/myapp
/var/log/myapp.log {
    weekly
    rotate 4
    compress
    missingok
    notifempty
    create 0640 root root
}
```

| Keyword | Means |
| --- | --- |
| `daily`, `weekly`, `monthly` | How often to rotate |
| `rotate N` | Keep N old copies |
| `compress` | Compress old copies with gzip |
| `missingok` | No error if the file does not exist |
| `notifempty` | Do not rotate an empty file |
| `create MODE OWNER GROUP` | Create the new empty file with this mode |

Test a rule without touching anything, then force a rotation to see the effect:

```console
[root@servera ~]# logrotate -d /etc/logrotate.d/myapp
...output omitted...
[root@servera ~]# logrotate -f /etc/logrotate.d/myapp
[root@servera ~]# ls -l /var/log/myapp*
-rw-r-----. 1 root root  0 Oct  3 17:00 /var/log/myapp.log
-rw-------. 1 root root 81 Oct  3 17:00 /var/log/myapp.log.1.gz
```

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch11.retention"] ref="quick" /%}
