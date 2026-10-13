---
title: Keeping the right time
seoTitle: "timedatectl and chrony: Time Zones and NTP"
description: "Set time zones with timedatectl and keep accurate time with chrony and NTP sources. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 15
---

{% lead %}
A clock that is a few minutes wrong breaks more than you would think: log lines from different machines no longer line up, certificates seem to be "not yet valid" or "expired", Kerberos and TLS handshakes fail, cron jobs run at the wrong moment. Servers therefore get their time from the network and keep it correct automatically. This lesson shows how to check the clock, choose the time zone, and see where the time comes from.
{% /lead %}

{% objectives %}
- Read `timedatectl`, and set the time zone.
- Explain how chrony synchronises the clock, and read `chronyc sources` and `chronyc tracking`.
- Change time sources in `/etc/chrony.conf`, and say why you do not set the time by hand.
{% /objectives %}

## What timedatectl tells you

```console
[root@servera ~]# timedatectl
               Local time: Sat 2026-10-03 16:59:49 UTC
           Universal time: Sat 2026-10-03 16:59:49 UTC
                 RTC time: Sat 2026-10-03 16:59:48
                Time zone: UTC (UTC, +0000)
System clock synchronized: yes
              NTP service: active
          RTC in local TZ: no
```

| Line | Means |
| --- | --- |
| Local time / Universal time | The same instant in the machine's zone and in UTC |
| RTC time | The battery-backed hardware clock. Linux keeps it in UTC (`RTC in local TZ: no`) |
| Time zone | The zone applied to local time |
| System clock synchronized | The clock agrees with a time source |
| NTP service | Whether the time service (chronyd) is running |

### Time zones

Zones have names of the form `Area/City`. List them and change the zone:

```console
[root@servera ~]# timedatectl list-timezones | grep -i colombo
Asia/Colombo
[root@servera ~]# timedatectl set-timezone Asia/Colombo
[root@servera ~]# date
Sat Oct  3 22:29:50 +0530 2026
[root@servera ~]# timedatectl set-timezone UTC
```

The zone only affects how the time is **displayed**. The instant itself is the same, and logs (in the journal) store it unambiguously. Many sites keep servers in UTC so that logs from all of them line up, and show local time only to people.

## chrony and NTP

**NTP** (Network Time Protocol) lets a machine ask other machines for the time. RHEL runs `chronyd`, which does it:

{% diagram ref="ntp-flow" /%}

```console
[root@servera ~]# chronyc sources
MS Name/IP address         Stratum Poll Reach LastRx Last sample
===============================================================================
^- ntp2.ntp.net.nz               1   6    37    51  +1130us[+1130us] +/- 3864us
^* 132.181.2.72                  1   6    37    51    -13us[-4847us] +/- 9289us
^- zappa.convolute.net.nz        1   6    37    50   -862us[ -862us] +/-   33ms
```

| Column | Means |
| --- | --- |
| `^` / `=` | Source is a server / a peer |
| `*` | The source in use. `+` is combined with it, `-` is not used, `?` is unreachable or not yet judged |
| Stratum | Distance from a reference clock (1 = directly attached). Lower is closer |
| Reach | An octal number counting recent successful polls (377 = last 8 all good) |
| Last sample | The measured offset |

```console
[root@servera ~]# chronyc tracking
Reference ID    : 84B50248 (132.181.2.72)
Stratum         : 2
Ref time (UTC)  : Sat Oct 03 16:58:57 2026
System time     : 0.000004469 seconds fast of NTP time
Last offset     : -0.004834540 seconds
RMS offset      : 0.004834540 seconds
```

`System time` is the number to look at: how far this clock is from NTP time right now.

### Configuration

The sources are set in `/etc/chrony.conf`:

```console
[root@servera ~]# grep -v '^#' /etc/chrony.conf | grep -v '^$' | head -4
pool 2.rocky.pool.ntp.org iburst
sourcedir /run/chrony-dhcp
driftfile /var/lib/chrony/drift
makestep 1.0 3
```

- `pool NAME iburst` uses several servers behind a pool name; `server NAME iburst` names one server. `iburst` speeds up the first synchronisation.
- `makestep 1.0 3` lets chronyd **jump** the clock if it is more than 1 second off, during the first 3 updates after start.

After editing, restart chronyd (`systemctl restart chronyd`), then check `chronyc sources`. Inside a company you would point `server` at the company's own NTP servers.

## Do not set the time by hand

With NTP active, the system refuses a manual change:

```console
[root@servera ~]# timedatectl set-time '2026-01-01 12:00:00'
Failed to set time: Automatic time synchronization is enabled
```

That is the right default. Stopping NTP (`timedatectl set-ntp false`) lets you set the time, which is only for special cases such as testing; turn NTP on again straight afterwards, because a clock that has been set wrongly takes a while to recover even then.

{% callout type="warning" title="Time travel is risky" %}
Setting the clock far into the past or future breaks TLS certificate checks, package signatures and scheduled jobs. In the lab you can reset the servers, but on a real machine, leave the clock to chrony.
{% /callout %}

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch11.time"] ref="quick" /%}
