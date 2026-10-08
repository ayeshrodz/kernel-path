---
title: Signals and ending processes
seoTitle: "kill, pkill and Signals: SIGTERM vs SIGKILL"
description: "End and pause processes with kill and pkill, and when to use SIGTERM, SIGKILL, SIGHUP and SIGSTOP. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 20
---

{% lead %}
A **signal** is a short message the kernel or another process sends to a process: "stop", "reload", "pause", "die now". `kill` is the tool to send them, and despite its name it does much more than kill. Knowing which signal to send, and in what order, is the difference between a clean shutdown and lost data.
{% /lead %}

{% objectives %}
- Name the common signals and what each one does.
- Send signals by PID, job number, name or owner with `kill`, `pkill` and `killall`.
- Follow the safe escalation: identify, ask politely with SIGTERM, then SIGKILL as a last resort.
{% /objectives %}

## What signals are

Every signal has a number and a name. A process may **catch** most of them and decide what to do: a well-written program catches SIGTERM, saves its work, removes its temporary files and exits. Two signals cannot be caught or ignored: **SIGKILL** and **SIGSTOP**. They are handled by the kernel itself.

{% diagram ref="signals" /%}

`kill -l` lists them all. Plain `kill PID` sends **15**, SIGTERM, which is the polite request.

## Sending signals

| Command | Sends to |
| --- | --- |
| `kill PID` | One process, SIGTERM |
| `kill -9 PID` or `kill -KILL PID` | One process, SIGKILL |
| `kill -STOP PID`, `kill -CONT PID` | Pause and resume |
| `kill %N` | A job of your shell |
| `pkill NAME` | Every process whose name matches |
| `pkill -u USER` | Every process owned by the user |
| `killall NAME` | Every process with exactly that name |
| `pgrep -a NAME` | Only **list** the matches (the safe preview) |

You may signal your own processes; root may signal anything.

```console
[root@servera ~]# su - bob -c 'nohup sleep 900 >/dev/null 2>&1 & nohup sleep 901 >/dev/null 2>&1 &'
[root@servera ~]# pgrep -u bob -a sleep
4986 sleep 900
4987 sleep 901
[root@servera ~]# pkill -u bob sleep
[root@servera ~]# pgrep -u bob -a sleep
```

Always **preview with `pgrep` first**. `pkill` matches part of a name by default, so `pkill java` also ends `javascript-lint` unless you add `-x` for an exact match. `pkill -u bob` with no name ends everything bob runs, including his login shell, which logs him out.

## Ask first, insist later

Step through the safe order:

{% diagram ref="escalation" /%}

The reason is what happens to the program. With a polite SIGTERM, a script like this tidies up:

```console
[student@servera ~]$ cat cleanup.sh
#!/bin/bash
trap 'echo "cleaning up"; rm -f /tmp/work.lock; exit 0' TERM
touch /tmp/work.lock
while true; do sleep 1; done
[student@servera ~]$ ./cleanup.sh &
[1] 4921
[student@servera ~]$ kill %1
[student@servera ~]$ Terminated
cleaning up
[student@servera ~]$ ls /tmp/work.lock
ls: cannot access '/tmp/work.lock': No such file or directory
```

With SIGKILL the program never gets to run its cleanup, so the lock file stays behind:

```console
[student@servera ~]$ ./cleanup.sh &
[1] 4928
[student@servera ~]$ kill -9 %1
[student@servera ~]$ ls /tmp/work.lock
/tmp/work.lock
```

This is exactly why SIGKILL is a last resort: databases lose buffered writes, editors lose unsaved files, and locks and sockets stay on disk.

### When kill does not work

- **State D** (uninterruptible sleep): the process is inside a disk or network call. It ends when the call returns. Look at the storage or the mount.
- **State Z** (zombie): it is already dead. Look at its parent (`ps -o ppid= -p PID`) and fix or restart that.
- **Permission denied**: it belongs to someone else. Use `sudo kill PID`.
- **It comes back**: a service manager restarts it. Stop the service properly (chapter 9) instead of killing the process.

## Check your understanding

{% quiz id="quick" objectives=["ch08.signals"] ref="quick" /%}
