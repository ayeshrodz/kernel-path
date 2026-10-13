---
title: "Exercise: Control a service"
seoTitle: "Control a service (RHCSA Practice Exercise)"
description: "Hands-on RHCSA practice: control a service. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 20
---

{% lead %}
Take the scheduler service `crond` through all of its states, and see exactly which command changes the state now and which changes what happens at boot. You also mask a service that a server has no use for.
{% /lead %}

{% lab
  objectives=["ch09.services"]
  id="services"
  title="Control a service"
  exercise="sa-services"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera"]
  outcomes=["Read systemctl status and the is-active and is-enabled answers.","Separate start/stop from enable/disable.","Mask and unmask a service."] %}

  {% task id="task-d20cf68d9eb5" title="Start the exercise" %}
    On workstation, start the exercise. It makes sure crond runs and is enabled, and that bluetooth is not masked.

```console
[student@workstation ~]$ lab start sa-services
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-44a476ebef43" title="Read the status" %}
    On servera, open a root shell with `sudo -i`. Show the status of `crond`. What are its main PID, its state, and its enabled state? Then ask the two short questions.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ sudo -i
[root@servera ~]# systemctl status crond | head -5
● crond.service - Command Scheduler
     Loaded: loaded (/usr/lib/systemd/system/crond.service; enabled; preset: enabled)
     Active: active (running) since Sat 2026-10-03 16:36:40 UTC; 4s ago
   Main PID: 642 (crond)
      Tasks: 1 (limit: 5820)
[root@servera ~]# systemctl is-active crond
active
[root@servera ~]# systemctl is-enabled crond
enabled
```
    {% /reveal %}
  {% /task %}

  {% task id="task-189c56034f0b" title="Stop it, and check what survives a reboot" %}
    Stop `crond` and show its status. Is it still enabled? What will happen at the next boot? Then start it again.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# systemctl stop crond
[root@servera ~]# systemctl status crond | head -3
○ crond.service - Command Scheduler
     Loaded: loaded (/usr/lib/systemd/system/crond.service; enabled; preset: enabled)
     Active: inactive (dead) since Sat 2026-10-03 16:36:45 UTC; 10ms ago
[root@servera ~]# systemctl start crond
```

    It is stopped but still `enabled`, so it would start again at boot. Stopping changes now, not boot.
    {% /reveal %}
  {% /task %}

  {% task id="task-efe14f91c8fa" title="Disable it, and check that it keeps running" %}
    Disable `crond` without stopping it. Compare `is-active` and `is-enabled`. Then re-enable it and start it with one command.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# systemctl disable crond
Removed "/etc/systemd/system/multi-user.target.wants/crond.service".
[root@servera ~]# systemctl is-active crond; systemctl is-enabled crond
active
disabled
[root@servera ~]# systemctl enable --now crond
Created symlink /etc/systemd/system/multi-user.target.wants/crond.service → /usr/lib/systemd/system/crond.service.
```

    Running but disabled is the "temporary" state: it works until the next reboot, then disappears.
    {% /reveal %}
  {% /task %}

  {% task id="task-5b1a106b009f" title="Inspect how the service is defined" %}
    Show the unit file that defines `crond` with `systemctl cat`, and find its start command and its restart policy.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# systemctl cat crond | grep -E 'ExecStart|Restart'
ExecStart=/usr/sbin/crond -n $CRONDARGS
Restart=on-failure
```

    systemd runs `/usr/sbin/crond` itself and restarts it if it crashes. You will write a unit like this in the next lesson.
    {% /reveal %}
  {% /task %}

  {% task id="task-4bcaa7c1c051" title="Mask a service you do not want" %}
    A server has no use for Bluetooth. Mask `bluetooth`, try to start it, check `is-enabled`, and finally unmask it.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# systemctl mask bluetooth
Created symlink /etc/systemd/system/bluetooth.service → /dev/null.
[root@servera ~]# systemctl start bluetooth
Failed to start bluetooth.service: Unit bluetooth.service is masked.
[root@servera ~]# systemctl is-enabled bluetooth
masked
[root@servera ~]# systemctl unmask bluetooth
Removed "/etc/systemd/system/bluetooth.service".
```
    {% /reveal %}
  {% /task %}

  {% task id="task-2ac9951ddb25" title="Look for trouble" %}
    List the failed units, then the services that are running.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# systemctl --failed
  UNIT LOAD ACTIVE SUB DESCRIPTION
0 loaded units listed.
[root@servera ~]# systemctl list-units --type=service --state=running | head -5
  UNIT                              LOAD   ACTIVE SUB     DESCRIPTION
  chronyd.service                   loaded active running NTP client/server
  crond.service                     loaded active running Command Scheduler
  dbus-broker.service               loaded active running D-Bus System Message Bus
[root@servera ~]# exit
[student@servera ~]$ exit
```
    {% /reveal %}
  {% /task %}

  {% task id="task-a2c0be26893e" title="Grade and finish" %}
    {% lab-finish exercise="sa-services" grade=true servers=true /%}
  {% /task %}
{% /lab %}
