---
title: Managing services with systemd
seoTitle: "systemctl Commands: Start, Enable and Mask Services"
description: "Manage systemd services with systemctl: status, start, stop, enable, disable, mask and failed units. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 20
---

{% lead %}
Almost everything useful a server does, such as serving web pages, keeping time, accepting SSH logins or running scheduled jobs, is done by a **service**: a program that runs in the background without a terminal. On RHEL, a program called **systemd** starts, stops and watches them. `systemctl` is how you talk to it.
{% /lead %}

{% objectives %}
- Explain what systemd and a unit are, and tell service units from other unit types.
- Start, stop, restart, reload, enable, disable and mask a service, and say which command acts on "now" and which on "boot".
- Read `systemctl status`, list units, and find failed ones.
{% /objectives %}

## systemd and units

systemd is the first process the kernel starts (PID 1). It reads configuration files called **units**, each describing one thing it manages. The type is the file's suffix:

| Unit type | Manages | Example |
| --- | --- | --- |
| `.service` | A background program | `sshd.service`, `crond.service` |
| `.target` | A group of units that mark a state of the system | `multi-user.target` |
| `.socket` | A listening network or local socket that starts a service on demand | `dbus.socket` |
| `.timer` | A schedule that starts another unit | `dnf-makecache.timer` |
| `.mount` | A mounted file system | `boot-efi.mount` |

You can leave out `.service` when you type a service name: `systemctl status crond` means `crond.service`.

## Asking about a service

```console
[root@servera ~]# systemctl status crond
● crond.service - Command Scheduler
     Loaded: loaded (/usr/lib/systemd/system/crond.service; enabled; preset: enabled)
     Active: active (running) since Sat 2026-10-03 16:36:40 UTC; 4s ago
   Main PID: 642 (crond)
      Tasks: 1 (limit: 5820)
     Memory: 1.0M (peak: 1.3M)
        CPU: 6ms
     CGroup: /system.slice/crond.service
             └─642 /usr/sbin/crond -n

Oct 03 16:36:40 servera.lab.example.com systemd[1]: Started Command Scheduler.
Oct 03 16:36:40 servera.lab.example.com crond[642]: (CRON) STARTUP (1.5.7)
```

Read it from the top:

| Line | Tells you |
| --- | --- |
| `●` / `○` | A green dot: active. A hollow dot: inactive. Red: failed. |
| `Loaded:` | Where the unit file is, and whether it is **enabled** (starts at boot) |
| `Active:` | The **current** state and since when |
| `Main PID`, `CGroup` | The processes that belong to it |
| log lines | The last few journal lines, to see what it said |

For scripts, ask a single question and use the answer: `systemctl is-active NAME` prints `active` or `inactive`, `systemctl is-enabled NAME` prints `enabled`, `disabled` or `masked`, and both set the exit status.

## Now versus at boot

This is the central idea of the lesson. Every service has two independent properties:

{% diagram ref="unit-states" /%}

| Command | Changes | Affects |
| --- | --- | --- |
| `systemctl start NAME` | Starts it | **Now** only |
| `systemctl stop NAME` | Stops it | **Now** only |
| `systemctl restart NAME` | Stops, then starts | Now |
| `systemctl reload NAME` | Asks it to re-read its configuration, without stopping | Now |
| `systemctl enable NAME` | Starts it at every boot | **Boot** only |
| `systemctl disable NAME` | Stops it from starting at boot | Boot only |
| `systemctl enable --now NAME` | Both | Boot and now |
| `systemctl disable --now NAME` | Both | Boot and now |
| `systemctl mask NAME` | Makes it impossible to start | Always |

`enable` works by creating a symbolic link, which you can see in its output:

```console
[root@servera ~]# systemctl disable crond
Removed "/etc/systemd/system/multi-user.target.wants/crond.service".
[root@servera ~]# systemctl enable crond
Created symlink /etc/systemd/system/multi-user.target.wants/crond.service → /usr/lib/systemd/system/crond.service.
```

`mask` goes further than `disable`: a disabled service can still be started by hand or by another service that needs it, but a masked one cannot.

```console
[root@servera ~]# systemctl mask bluetooth
Created symlink /etc/systemd/system/bluetooth.service → /dev/null.
[root@servera ~]# systemctl start bluetooth
Failed to start bluetooth.service: Unit bluetooth.service is masked.
```

{% callout type="warning" title="Careful with the service you are using" %}
Do not stop or disable `sshd` over an SSH session: you would lock yourself out. If you must restart it, `systemctl restart sshd` is safe (existing sessions stay), but `systemctl stop sshd` is not on a remote machine.
{% /callout %}

## Listing units

```console
[root@servera ~]# systemctl list-units --type=service --state=running
[root@servera ~]# systemctl list-unit-files --type=service
[root@servera ~]# systemctl --failed
  UNIT LOAD ACTIVE SUB DESCRIPTION
0 loaded units listed.
```

`list-units` shows what is loaded **now**; `list-unit-files` shows what is installed and whether each is enabled; `--failed` is the first thing to run when something is wrong.

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch09.services"] ref="quick" /%}
