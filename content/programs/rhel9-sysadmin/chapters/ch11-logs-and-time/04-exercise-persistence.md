---
title: "Exercise: Keep and rotate your logs"
kind: lab
minutes: 30
---

{% lead %}
Make the journal persistent and prove it across a reboot, send a facility to its own file, and write a logrotate rule for it.
{% /lead %}

{% lab
  objectives=["ch11.retention"]
  id="retention"
  title="Keep and rotate your logs"
  exercise="sa-persistence"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera"]
  outcomes=["Make the journal persistent and verify it after a reboot.","Add an rsyslog rule for a facility.","Write, test and force a logrotate rule."] %}

  {% task id="task-e55c88aec5ed" title="Start the exercise" %}
    On workstation, start the exercise. It removes the logging settings of an earlier run from servera.

```console
[student@workstation ~]$ lab start sa-persistence
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-0b7282cb49ac" title="Check the journal's lifetime" %}
    On servera as root, show how many boots the journal holds and how much space it uses.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ sudo -i
[root@servera ~]# journalctl --list-boots
IDX BOOT ID                          FIRST ENTRY                 LAST ENTRY
  0 e223ff84f70141d5b05d37983cb06b03 Sat 2026-10-03 17:00:58 UTC Sat 2026-10-03 17:01:08 UTC
[root@servera ~]# journalctl --disk-usage
Archived and active journals take up 3.0M in the file system.
```

    Only one boot: the journal is volatile.
    {% /reveal %}
  {% /task %}

  {% task id="task-af1a02917334" title="Make it persistent, with a limit" %}
    Create `/var/log/journal`, add a drop-in `/etc/systemd/journald.conf.d/10-retention.conf` with `Storage=persistent` and `SystemMaxUse=200M`, and restart journald and flush the journal to disk (`journalctl --flush`).

    {% reveal title="Show solution" %}

```console
[root@servera ~]# mkdir -p /var/log/journal /etc/systemd/journald.conf.d
[root@servera ~]# printf '[Journal]\nStorage=persistent\nSystemMaxUse=200M\n' > /etc/systemd/journald.conf.d/10-retention.conf
[root@servera ~]# systemctl restart systemd-journald
[root@servera ~]# journalctl --flush
[root@servera ~]# journalctl --disk-usage
Archived and active journals take up 8.0M in the file system.
```
    {% /reveal %}
  {% /task %}

  {% task id="task-210f8501c048" title="Reboot and look back" %}
    Leave a marker with `logger "before the reboot"`, reboot, log in again, and show the boots and the marker from the previous boot.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# logger "before the reboot"
[root@servera ~]# systemctl reboot
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ sudo journalctl --list-boots
IDX BOOT ID                          FIRST ENTRY                 LAST ENTRY
 -1 e223ff84f70141d5b05d37983cb06b03 Sat 2026-10-03 17:00:58 UTC Sat 2026-10-03 17:12:20 UTC
  0 1c0b5b5e0a3e47ab8f1d6c7b6b46c7a0 Sat 2026-10-03 17:12:41 UTC Sat 2026-10-03 17:13:05 UTC
[student@servera ~]$ sudo journalctl -b -1 -g "before the reboot" --no-pager
Oct 03 17:12:10 servera.lab.example.com root[2210]: before the reboot
```

    Two boots are listed now, and the old one is readable. This is what you want to have *before* a crash.
    {% /reveal %}
  {% /task %}

  {% task id="task-c8f26c5116e7" title="Give the facility local5 its own file" %}
    Create the rule, restart rsyslog, send an info and an error message to `local5`, and read the file.

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ sudo -i
[root@servera ~]# echo 'local5.* /var/log/myapp.log' > /etc/rsyslog.d/10-myapp.conf
[root@servera ~]# systemctl restart rsyslog
[root@servera ~]# logger -p local5.info "myapp started"
[root@servera ~]# logger -p local5.err "myapp broke"
[root@servera ~]# cat /var/log/myapp.log
Oct  3 17:00:03 servera root[867]: myapp started
Oct  3 17:00:03 servera root[868]: myapp broke
```
    {% /reveal %}
  {% /task %}

  {% task id="task-03a55c83a785" title="Rotate it" %}
    Write `/etc/logrotate.d/myapp`: rotate weekly, keep 4, compress, `missingok`, `notifempty`, and create the new file with mode 0640 owned by root. Dry-run it, force it, and list the result.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# cat > /etc/logrotate.d/myapp <<'EOT'
/var/log/myapp.log {
    weekly
    rotate 4
    compress
    missingok
    notifempty
    create 0640 root root
}
EOT
[root@servera ~]# logrotate -d /etc/logrotate.d/myapp 2>&1 | tail -4
...output omitted...
[root@servera ~]# logrotate -f /etc/logrotate.d/myapp
[root@servera ~]# ls -l /var/log/myapp*
-rw-r-----. 1 root root  0 Oct  3 17:00 /var/log/myapp.log
-rw-------. 1 root root 81 Oct  3 17:00 /var/log/myapp.log.1.gz
```

    A fresh empty file was created, and the old content is compressed in `.1.gz`. Read it with `zcat /var/log/myapp.log.1.gz`.
    {% /reveal %}
  {% /task %}

  {% task id="task-012ddc2e2403" title="Grade and finish" %}
    {% lab-finish exercise="sa-persistence" grade=true servers=true /%}
  {% /task %}
{% /lab %}
