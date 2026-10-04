---
title: "Exercise: Timers and one-off jobs"
kind: lab
minutes: 30
---

{% lead %}
Build a service and timer pair, test the service by hand, watch the timer fire and log, validate calendar expressions, and then schedule and cancel a one-time `at` job.
{% /lead %}

{% lab
  objectives=["ch15.timers"]
  id="timers"
  title="Timers and one-off jobs"
  exercise="sa-timers"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera"]
  outcomes=["Write a oneshot service and a timer and enable the timer.","Check calendar expressions with systemd-analyze.","Schedule and remove an at job."] %}

  {% task id="task-1912509ccaac" title="Start the exercise" %}
    On workstation, start the exercise. It removes the hello units and the at package of an earlier run from servera.

```console
[student@workstation ~]$ lab start sa-timers
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-a8c581357ef5" title="The service" %}
    On servera as root (`sudo -i`), create `/etc/systemd/system/hello.service`: a oneshot service that logs `hello from the timer` with the tag `hello-timer` (use `logger`). Start it by hand and look in the journal.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ sudo -i
[root@servera ~]# cat > /etc/systemd/system/hello.service <<'EOT'
[Unit]
Description=Write a hello line to the journal

[Service]
Type=oneshot
ExecStart=/usr/bin/logger -t hello-timer "hello from the timer"
EOT
[root@servera ~]# systemctl daemon-reload
[root@servera ~]# systemctl start hello.service
[root@servera ~]# journalctl -t hello-timer --no-pager | tail -1 | cut -c1-110
Oct 03 17:53:40 servera.lab.example.com hello-timer[1301]: hello from the timer
```
    {% /reveal %}
  {% /task %}

  {% task id="task-55c7a74c79ed" title="The timer" %}
    Create `hello.timer` that fires every minute (`OnCalendar=*-*-* *:*:00`) with `Persistent=true` and `WantedBy=timers.target`. Enable and start it, and list it.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# cat > /etc/systemd/system/hello.timer <<'EOT'
[Unit]
Description=Run hello every minute

[Timer]
OnCalendar=*-*-* *:*:00
Persistent=true

[Install]
WantedBy=timers.target
EOT
[root@servera ~]# systemctl daemon-reload
[root@servera ~]# systemctl enable --now hello.timer
Created symlink /etc/systemd/system/timers.target.wants/hello.timer → /etc/systemd/system/hello.timer.
[root@servera ~]# systemctl list-timers hello.timer --no-pager
NEXT                        LEFT     LAST PASSED UNIT        ACTIVATES
Sat 2026-10-03 17:54:00 UTC 26s left -    -      hello.timer hello.service

1 timers listed.
```
    {% /reveal %}
  {% /task %}

  {% task id="task-6dfc465a81c6" title="Watch it run" %}
    Wait a minute or two, then show how many times the message appeared and when the timer last fired.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# sleep 100
[root@servera ~]# journalctl -t hello-timer --no-pager | grep -c "hello from the timer"
3
[root@servera ~]# systemctl status hello.timer --no-pager | sed -n 1,6p
● hello.timer - Run hello every minute
     Loaded: loaded (/etc/systemd/system/hello.timer; enabled; preset: disabled)
     Active: active (waiting) since Sat 2026-10-03 17:53:33 UTC; 1min 5s ago
      Until: Sat 2026-10-03 17:53:33 UTC; 1min 5s ago
    Trigger: Sat 2026-10-03 17:55:00 UTC; 21s left
   Triggers: ● hello.service
```

    Your count depends on how long you waited. Each run is an ordinary service run, so the output is in the journal under the unit.
    {% /reveal %}
  {% /task %}

  {% task id="task-3cc99b715074" title="Test calendar expressions" %}
    Ask `systemd-analyze calendar` when `Mon *-*-* 09:30` and `*:0/15` next elapse.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# systemd-analyze calendar 'Mon *-*-* 09:30'
  Original form: Mon *-*-* 09:30
Normalized form: Mon *-*-* 09:30:00
    Next elapse: Mon 2026-10-05 09:30:00 UTC
       From now: 1 day 15h left
[root@servera ~]# systemd-analyze calendar '*:0/15' | sed -n 1,4p
  Original form: *:0/15
Normalized form: *-*-* *:00/15:00
    Next elapse: Sat 2026-10-03 18:00:00 UTC
       From now: 9min left
```

    `*:0/15` means "every hour, starting at minute 0, every 15 minutes".
    {% /reveal %}
  {% /task %}

  {% task id="task-ee93f891057f" title="An at job" %}
    Install `at`, enable `atd`, and as `student` schedule `echo at job ran > /home/student/at.out` for one minute from now. Check the queue, wait, and read the file. Then schedule another one for 23:59 and delete it.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# dnf install -y at > /dev/null && systemctl enable --now atd
[root@servera ~]# su - student -c 'echo "echo at job ran > /home/student/at.out" | at now + 1 minute; atq'
warning: commands will be executed using /bin/sh
job 1 at Sat Oct  3 17:53:00 2026
1	Sat Oct  3 17:53:00 2026 a student
[root@servera ~]# sleep 65; cat /home/student/at.out
at job ran
[root@servera ~]# su - student -c 'echo "touch /tmp/never" | at 23:59; atq; atrm 2; atq'
job 2 at Sat Oct  3 23:59:00 2026
2	Sat Oct  3 23:59:00 2026 a student
```

    After `atrm 2` the queue is empty and the job never runs.
    {% /reveal %}
  {% /task %}

  {% task id="task-b5cbf9f9e6ea" title="Grade and finish" %}
    {% lab-finish exercise="sa-timers" grade=true servers=true /%}
  {% /task %}
{% /lab %}
