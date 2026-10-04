---
title: "Exercise: Write your own service"
kind: lab
minutes: 30
---

{% lead %}
Turn a small shell script into a proper service: write the unit, start it, watch systemd restart it after a crash, override a setting with a drop-in, and diagnose a deliberately broken version.
{% /lead %}

{% lab
  objectives=["ch09.units"]
  id="units"
  title="Write your own service"
  exercise="sa-unit-files"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera"]
  outcomes=["Write a service unit and enable it.","See Restart=on-failure bring a killed service back.","Override a setting with a drop-in and diagnose status 203."] %}

  {% task id="task-fdd776e1cca3" title="Start the exercise" %}
    On workstation, start the exercise. It installs the program `/usr/local/bin/reporter.sh` on servera: a loop that appends a heartbeat line to `/var/log/reporter.log` every `$INTERVAL` seconds (default 10).

```console
[student@workstation ~]$ lab start sa-unit-files
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-6b3bbe70e5ef" title="Write the unit and start it" %}
    Create `/etc/systemd/system/reporter.service` that runs the script, restarts it on failure after 2 seconds, and is wanted by `multi-user.target`. Check it with `systemd-analyze verify`, reload systemd, then enable and start it.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# vim /etc/systemd/system/reporter.service
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
[root@servera ~]# systemd-analyze verify /etc/systemd/system/reporter.service
[root@servera ~]# systemctl daemon-reload
[root@servera ~]# systemctl enable --now reporter
Created symlink /etc/systemd/system/multi-user.target.wants/reporter.service → /etc/systemd/system/reporter.service.
[root@servera ~]# systemctl is-active reporter
active
```
    {% /reveal %}
  {% /task %}

  {% task id="task-6b6119dd7121" title="Read what it writes" %}
    Wait a little, then check the log file and the service's status.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# tail -3 /var/log/reporter.log
16:37:00 reporter alive
16:37:10 reporter alive
16:37:20 reporter alive
```
    {% /reveal %}
  {% /task %}

  {% task id="task-8f5c6ddea9e9" title="Crash it" %}
    Kill the service's main process with signal 9. After a few seconds, is it running again? What does the journal say?

    {% reveal title="Show solution" %}

```console
[root@servera ~]# kill -9 $(systemctl show -p MainPID --value reporter)
[root@servera ~]# sleep 3; systemctl is-active reporter
active
[root@servera ~]# journalctl -u reporter --no-pager | tail -3
Oct 03 16:37:18 servera.lab.example.com systemd[1]: reporter.service: Failed with result 'signal'.
Oct 03 16:37:20 servera.lab.example.com systemd[1]: reporter.service: Scheduled restart job, restart counter is at 1.
Oct 03 16:37:20 servera.lab.example.com systemd[1]: Started Write a heartbeat line to a report file.
```

    systemd noticed the unclean exit, waited `RestartSec`, and started a new copy. Compare what you did in the last chapter: a plain background job stays dead.
    {% /reveal %}
  {% /task %}

  {% task id="task-671c36c3b08c" title="Speed it up with a drop-in" %}
    Without touching the original unit, set `INTERVAL=2` through a drop-in file called `10-interval.conf`. Restart and confirm that new lines appear every 2 seconds.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# mkdir -p /etc/systemd/system/reporter.service.d
[root@servera ~]# printf '[Service]\nEnvironment=INTERVAL=2\n' > /etc/systemd/system/reporter.service.d/10-interval.conf
[root@servera ~]# systemctl daemon-reload
[root@servera ~]# systemctl restart reporter
[root@servera ~]# sleep 5; tail -3 /var/log/reporter.log
16:37:13 reporter alive
16:37:15 reporter alive
16:37:17 reporter alive
[root@servera ~]# systemctl cat reporter | tail -3
# /etc/systemd/system/reporter.service.d/10-interval.conf
[Service]
Environment=INTERVAL=2
```
    {% /reveal %}
  {% /task %}

  {% task id="task-da14670fd312" title="Break it and read the error" %}
    Change `ExecStart=` in the unit to `/usr/local/bin/nothere.sh`, reload, and restart. Find the failure in the status and in the journal. Then put the correct path back.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# sed -i 's#^ExecStart=.*#ExecStart=/usr/local/bin/nothere.sh#' /etc/systemd/system/reporter.service
[root@servera ~]# systemctl daemon-reload
[root@servera ~]# systemctl restart reporter
[root@servera ~]# systemctl status reporter | grep Process
    Process: 988 ExecStart=/usr/local/bin/nothere.sh (code=exited, status=203/EXEC)
[root@servera ~]# journalctl -u reporter -n 1 --no-pager
Oct 03 16:37:21 servera.lab.example.com systemd[988]: reporter.service: Failed at step EXEC spawning /usr/local/bin/nothere.sh: No such file or directory
[root@servera ~]# sed -i 's#^ExecStart=.*#ExecStart=/usr/local/bin/reporter.sh#' /etc/systemd/system/reporter.service
[root@servera ~]# systemctl daemon-reload
[root@servera ~]# systemctl restart reporter
[root@servera ~]# systemctl is-active reporter
active
```
    {% /reveal %}
  {% /task %}

  {% task id="task-afe68587c470" title="Grade and finish" %}
    {% lab-finish exercise="sa-unit-files" grade=true servers=true /%}
  {% /task %}
{% /lab %}
