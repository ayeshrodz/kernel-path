---
title: Writing and changing unit files
seoTitle: "How to Write a systemd Service Unit File"
description: "Write your own systemd unit, use drop-in overrides, restart policies and daemon-reload. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 20
---

{% lead %}
The services that come with RHEL are described by unit files, and you can write your own. A unit file is short, readable and declarative: it says what to run and when, and systemd handles starting, watching, logging and restarting. This lesson builds a small service from scratch and shows how to override a packaged one safely.
{% /lead %}

{% objectives %}
- Read the three sections of a service unit file and write a simple one.
- Create, reload, enable and troubleshoot a custom service, using the journal.
- Override a unit with a drop-in file instead of editing the packaged file.
{% /objectives %}

## Anatomy of a service unit

{% diagram ref="unit-anatomy" /%}

Unit files are plain text in an INI style. Packages put theirs in `/usr/lib/systemd/system`; **yours go in `/etc/systemd/system`, which takes precedence**. Never edit the packaged copies, because an update will replace them.

## A first service

Say we want a small program that writes a heartbeat line to a file. First the program:

```console
[root@servera ~]# cat /usr/local/bin/reporter.sh
#!/bin/bash
# Append a timestamp to the report every few seconds.
while true; do
  echo "$(date +%T) reporter alive" >> /var/log/reporter.log
  sleep "${INTERVAL:-10}"
done
[root@servera ~]# chmod 755 /usr/local/bin/reporter.sh
```

Then the unit that runs it as a service:

```console
[root@servera ~]# cat /etc/systemd/system/reporter.service
[Unit]
Description=Write a heartbeat line to a report file
After=network.target

[Service]
ExecStart=/usr/local/bin/reporter.sh
Restart=on-failure
RestartSec=2

[Install]
WantedBy=multi-user.target
```

Notes on the lines:

- `ExecStart=` needs the **full path** of the program, and the program must be executable. No shell features such as pipes are interpreted here; for those, run `/bin/bash -c '...'`.
- `Restart=on-failure` restarts the service if it exits with an error or is killed; `RestartSec=` is the pause before doing so.
- `WantedBy=multi-user.target` is what `enable` uses to start it at boot.
- `User=` and `Group=` run it as an unprivileged account (recommended for real services); the default is root.

## Load, start, check

systemd reads unit files when it starts, and again when told to. After **every** change to a unit file run `systemctl daemon-reload`:

{% diagram ref="edit-flow" /%}

```console
[root@servera ~]# systemctl daemon-reload
[root@servera ~]# systemctl enable --now reporter
Created symlink /etc/systemd/system/multi-user.target.wants/reporter.service → /etc/systemd/system/reporter.service.
[root@servera ~]# systemctl status reporter | head -4
● reporter.service - Write a heartbeat line to a report file
     Loaded: loaded (/etc/systemd/system/reporter.service; enabled; preset: disabled)
     Active: active (running) since Sat 2026-10-03 16:37:00 UTC; 12s ago
   Main PID: 878 (reporter.sh)
[root@servera ~]# tail -2 /var/log/reporter.log
16:37:00 reporter alive
16:37:10 reporter alive
```

Check the file for mistakes before you start it with `systemd-analyze verify /etc/systemd/system/reporter.service`. It prints nothing when the unit is fine.

The restart policy in action: kill the service's main process and watch systemd bring it back.

```console
[root@servera ~]# kill -9 $(systemctl show -p MainPID --value reporter)
[root@servera ~]# systemctl is-active reporter
active
[root@servera ~]# journalctl -u reporter --no-pager | tail -4
Oct 03 16:37:18 servera.lab.example.com systemd[1]: reporter.service: Main process exited, code=killed, status=9/KILL
Oct 03 16:37:18 servera.lab.example.com systemd[1]: reporter.service: Failed with result 'signal'.
Oct 03 16:37:20 servera.lab.example.com systemd[1]: reporter.service: Scheduled restart job, restart counter is at 1.
Oct 03 16:37:20 servera.lab.example.com systemd[1]: Started Write a heartbeat line to a report file.
```

## Overriding without editing: drop-ins

To change a setting of an existing unit, put the changes in a **drop-in** file named `*.conf` under `/etc/systemd/system/NAME.service.d/`. Only the lines you write are changed:

```console
[root@servera ~]# mkdir -p /etc/systemd/system/reporter.service.d
[root@servera ~]# cat > /etc/systemd/system/reporter.service.d/10-interval.conf <<'EOT'
[Service]
Environment=INTERVAL=2
EOT
[root@servera ~]# systemctl daemon-reload
[root@servera ~]# systemctl restart reporter
[root@servera ~]# systemctl cat reporter | tail -4
# /etc/systemd/system/reporter.service.d/10-interval.conf
[Service]
Environment=INTERVAL=2
```

`systemctl edit NAME` creates and opens such a file for you (and reloads on saving). `systemctl cat NAME` shows the unit **and** all its drop-ins, so it shows what really applies.

## When it will not start

A typical mistake is a wrong path. systemd tells you exactly:

```console
[root@servera ~]# systemctl start reporter
[root@servera ~]# systemctl status reporter | sed -n 5,7p
    Process: 988 ExecStart=/usr/local/bin/nothere.sh (code=exited, status=203/EXEC)
   Main PID: 988 (code=exited, status=203/EXEC)
[root@servera ~]# journalctl -u reporter -n 1 --no-pager
Oct 03 16:37:21 servera.lab.example.com systemd[988]: reporter.service: Failed at step EXEC spawning /usr/local/bin/nothere.sh: No such file or directory
```

`status=203/EXEC` means "could not run the program": check the path and the permissions. A service that starts and exits straight away shows the program's own error in the journal. If it keeps failing, systemd eventually stops retrying and marks it `failed`.

## Check your understanding

{% quiz id="quick" objectives=["ch09.units"] ref="quick" /%}
