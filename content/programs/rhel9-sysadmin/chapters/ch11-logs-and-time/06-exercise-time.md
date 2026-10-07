---
title: "Exercise: Time zone and time sources"
seoTitle: "Time zone and time sources (RHCSA Practice Exercise)"
description: "Hands-on RHCSA practice: time zone and time sources. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 20
---

{% lead %}
Read the state of servera's clock, move it to another time zone, inspect where its time comes from, and add a time source to the chrony configuration.
{% /lead %}

{% lab
  objectives=["ch11.time"]
  id="time"
  title="Time zone and time sources"
  exercise="sa-time"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera"]
  outcomes=["Read timedatectl, chronyc sources and chronyc tracking.","Change the time zone.","Add an NTP server and verify it."] %}

  {% task id="task-749cd80a2bb6" title="Start the exercise" %}
    On workstation, start the exercise. It puts servera in the UTC time zone and removes an extra time source from an earlier run.

```console
[student@workstation ~]$ lab start sa-time
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-e8defc8ba9e0" title="Check the clock" %}
    On servera as root, show the time status, the time sources, and the clock offset.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ sudo -i
[root@servera ~]# timedatectl | grep -E 'Time zone|synchronized|NTP'
                Time zone: UTC (UTC, +0000)
System clock synchronized: yes
              NTP service: active
[root@servera ~]# chronyc sources | head -4
MS Name/IP address         Stratum Poll Reach LastRx Last sample
===============================================================================
^- ntp2.ntp.net.nz               1   6    37    51  +1130us[+1130us] +/- 3864us
^* 132.181.2.72                  1   6    37    51    -13us[-4847us] +/- 9289us
[root@servera ~]# chronyc tracking | grep -E 'Stratum|System time'
Stratum         : 2
System time     : 0.000004469 seconds fast of NTP time
```

    Your sources will be different servers. Which one has the `*`?
    {% /reveal %}
  {% /task %}

  {% task id="task-a7f6548cb759" title="Change the time zone" %}
    Find the zone name for Colombo, set it, and compare `date` with `date -u`. Then set it back to UTC.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# timedatectl list-timezones | grep -i colombo
Asia/Colombo
[root@servera ~]# timedatectl set-timezone Asia/Colombo
[root@servera ~]# date; date -u
Sat Oct  3 22:29:50 +0530 2026
Sat Oct  3 16:59:50 UTC 2026
[root@servera ~]# ls -l /etc/localtime
lrwxrwxrwx. 1 root root 34 Oct  3 22:31 /etc/localtime -> ../usr/share/zoneinfo/Asia/Colombo
[root@servera ~]# timedatectl set-timezone UTC
```

    The time zone is just a link in `/etc/localtime`. Both lines show the same moment.
    {% /reveal %}
  {% /task %}

  {% task id="task-6d453db4fb31" title="Try to set the time by hand" %}
    Try `timedatectl set-time '2026-01-01 12:00:00'`. What stops you? (Do not turn NTP off.)

    {% reveal title="Show solution" %}

```console
[root@servera ~]# timedatectl set-time '2026-01-01 12:00:00'
Failed to set time: Automatic time synchronization is enabled
```

    With NTP on, the system will not let you set the time. This protects the machine from well-meaning mistakes.
    {% /reveal %}
  {% /task %}

  {% task id="task-9ca41317fafa" title="Add a time source" %}
    Add the line `server 0.pool.ntp.org iburst` to `/etc/chrony.conf`, restart chronyd, wait a few seconds and look at the sources. Is the new server there?

    {% reveal title="Show solution" %}

```console
[root@servera ~]# cp /etc/chrony.conf /root/chrony.conf.bak
[root@servera ~]# echo 'server 0.pool.ntp.org iburst' >> /etc/chrony.conf
[root@servera ~]# systemctl restart chronyd
[root@servera ~]# sleep 10; chronyc sources | head -8
MS Name/IP address         Stratum Poll Reach LastRx Last sample
===============================================================================
^* 132.181.2.72                  1   6    17     3   -523us[ +365us] +/- 9620us
^- 33.static.cloudbase.co.nz     2   6    17     2  -4606us[-3671us] +/-   67ms
^+ zappa.convolute.net.nz        1   6    17     2   -171us[ +812us] +/-   33ms
^+ time.cloudflare.com           3   6    17     3   -115us[ +711us] +/- 17ms
```

    The pool name `0.pool.ntp.org` is not listed as such: DNS turns it into several real servers, and `chronyc sources` shows those. You should see more servers than before. Output varies with the network.
    {% /reveal %}
  {% /task %}

  {% task id="task-daf935fd20b6" title="Restore the configuration" %}

```console
[root@servera ~]# cp /root/chrony.conf.bak /etc/chrony.conf
[root@servera ~]# systemctl restart chronyd
[root@servera ~]# timedatectl | grep -E 'synchronized|NTP'
System clock synchronized: no
              NTP service: active
[root@servera ~]# rm /root/chrony.conf.bak
[root@servera ~]# exit
[student@servera ~]$ exit
```

    Right after a restart, `synchronized` may say `no` for a few moments, until chronyd has chosen a source again. It says `yes` again within a minute or two.
  {% /task %}

  {% task id="task-d05e32874b50" title="Grade and finish" %}
    {% lab-finish exercise="sa-time" grade=true servers=true /%}
  {% /task %}
{% /lab %}
