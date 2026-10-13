---
title: "Exercise: Services and boot review"
seoTitle: "systemd and boot Practice Lab (RHCSA Exam Style)"
description: "Graded RHCSA exam-style lab on systemd and boot: a challenge with requirements, hints and solutions, and a grader that checks your work on your own lab."
kind: lab
minutes: 35
---

{% lead %}
Prepare servera for a headless job: a small reporting service of your own with a drop-in override, a tidy service policy, and a text-mode boot.
{% /lead %}

{% lab
  objectives=["ch09.services","ch09.units","ch09.boot","ch09.recovery"]
  id="review"
  title="Services and boot review"
  exercise="sa-systemd-review"
  ownExercise=true
  hosts=["workstation","servera"]
  outcomes=["Write, override, enable and check a custom service.","Mask and disable services according to policy.","Set the default target."] %}
{% lab-notes %}

**Before you start:** reset the servers and complete this chapter's lessons. You work on **servera** as root (`sudo -i`); `lab start` and `lab grade` run on workstation. The grader checks the state of the running system and the files; a reboot is not required (but it is a good way to test that your changes last).

{% /lab-notes %}

{% lab-challenge %}

On servera:

1. Write `/usr/local/bin/reporter.sh` (mode 755) that appends a line containing the time and `reporter alive` to `/var/log/reporter.log` every `${INTERVAL:-10}` seconds.
2. Write `/etc/systemd/system/reporter.service`: it runs the script, restarts it on failure, and is wanted by `multi-user.target`.
3. Use a drop-in, `/etc/systemd/system/reporter.service.d/10-interval.conf`, to set `Environment=INTERVAL=2`.
4. Enable and start `reporter`, and make sure it has written to its log.
5. Mask `bluetooth.service`, and stop and disable `mdmonitor.service`.
6. Make `multi-user.target` the default target.

{% /lab-challenge %}

  {% task id="task-01e2d36db6fe" title="Start the exercise" %}

```console
[student@workstation ~]$ lab start sa-systemd-review
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ sudo -i
[root@servera ~]#
```
  {% /task %}

  {% task id="task-b3a47f935c5c" title="Write the script and the unit" %}

    {% reveal title="Show solution" %}

```console
[root@servera ~]# cat > /usr/local/bin/reporter.sh <<'EOT'
#!/bin/bash
while true; do
  echo "$(date +%T) reporter alive" >> /var/log/reporter.log
  sleep "${INTERVAL:-10}"
done
EOT
[root@servera ~]# chmod 755 /usr/local/bin/reporter.sh
[root@servera ~]# cat > /etc/systemd/system/reporter.service <<'EOT'
[Unit]
Description=Write a heartbeat line to a report file
After=network.target

[Service]
ExecStart=/usr/local/bin/reporter.sh
Restart=on-failure
RestartSec=2

[Install]
WantedBy=multi-user.target
EOT
```
    {% /reveal %}
  {% /task %}

  {% task id="task-267b9264a99a" title="Add the drop-in and start it" %}

    {% reveal title="Show solution" %}

```console
[root@servera ~]# mkdir -p /etc/systemd/system/reporter.service.d
[root@servera ~]# printf '[Service]\nEnvironment=INTERVAL=2\n' > /etc/systemd/system/reporter.service.d/10-interval.conf
[root@servera ~]# systemctl daemon-reload
[root@servera ~]# systemctl enable --now reporter
[root@servera ~]# systemctl status reporter | head -4
[root@servera ~]# tail -2 /var/log/reporter.log
```

    `systemctl cat reporter` should show the unit followed by the drop-in.
    {% /reveal %}
  {% /task %}

  {% task id="task-9222602de37f" title="Apply the service policy and the target" %}

    {% reveal title="Show solution" %}

```console
[root@servera ~]# systemctl mask bluetooth
[root@servera ~]# systemctl disable --now mdmonitor
[root@servera ~]# systemctl set-default multi-user.target
[root@servera ~]# systemctl get-default
multi-user.target
```
    {% /reveal %}
  {% /task %}

  {% task id="task-c35fd4a57c68" title="Grade" %}
    Leave servera, then on workstation:

    {% lab-finish exercise="sa-systemd-review" grade=true servers=true /%}
  {% /task %}
{% /lab %}
