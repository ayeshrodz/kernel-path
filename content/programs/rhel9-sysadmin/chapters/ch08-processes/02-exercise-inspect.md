---
title: "Exercise: Find your way around the process table"
seoTitle: "Find your way around the process table (RHCSA Practice Exercise)"
description: "Hands-on RHCSA practice: find your way around the process table. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 20
---

{% lead %}
Use `ps`, `pstree`, `pgrep` and `/proc` to answer questions about what is running on servera: who started your shell, which processes are the biggest, and what a process looks like from the inside.
{% /lead %}

{% lab
  objectives=["ch08.processes"]
  id="inspect"
  title="Find your way around the process table"
  hosts=["workstation","servera"]
  outcomes=["Trace a process back to its parent and to PID 1.","Find processes by name, owner and resource use.","Read a process's details in /proc."] %}

  {% task id="task-b54b8cc910bf" title="Trace your shell's ancestry" %}
    Log in to servera. Print your shell's PID and its parent's PID, then draw the chain of ancestors up to PID 1 with one `pstree` command.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ echo $$
4544
[student@servera ~]$ ps -o pid,ppid,comm -p $$
    PID    PPID COMMAND
   4544    4533 bash
[student@servera ~]$ pstree -ps $$
systemd(1)---sshd(701)---sshd(4533)---sshd(4540)---bash(4544)---pstree(4560)
```

    The exact numbers will differ. Read from left to right: systemd started the SSH server, which started a session, which started your shell. `-p` adds PIDs and `-s` shows the parents of the chosen process.
    {% /reveal %}
  {% /task %}

  {% task id="task-5926e57f066f" title="Start a process and find it" %}
    Start `sleep 1000` in the background. Find it with `pgrep -a sleep`, then show its PID, parent PID, state and command with `ps -o`. Is its parent your shell?

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ sleep 1000 &
[1] 4564
[student@servera ~]$ pgrep -a sleep
4564 sleep 1000
[student@servera ~]$ ps -o pid,ppid,stat,cmd -C sleep
    PID    PPID STAT CMD
   4564    4544 S    sleep 1000
```

    The PPID, 4544, is the PID of the shell from the previous task. The state `S` means it is sleeping, waiting for its timer.
    {% /reveal %}
  {% /task %}

  {% task id="task-261aea7adabf" title="Find the biggest memory users" %}
    List the three processes using the most memory, sorted from largest, with their owner, PID, percentage and command.

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ ps aux --sort=-%mem | head -4
USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root         458  0.1  4.3 129044 41412 ?        Ssl  16:21   0:00 /usr/bin/python3 -s /usr/sbin/firewalld --nofork --nopid
polkitd      465  0.0  2.5 2580272 24480 ?       Ssl  16:21   0:00 /usr/lib/polkit-1/polkitd --no-debug
root         442  0.1  2.5 1274440 24348 ?       Ssl  16:21   0:00 /run/lxd_agent/lxd-agent
```

    The first line of output is the header, so `head -4` shows three processes. Your numbers will differ.
    {% /reveal %}
  {% /task %}

  {% task id="task-446afa3834f5" title="Count and list your own processes" %}
    How many processes does `student` own? List their PIDs and command names.

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ ps -u student --no-headers | wc -l
6
[student@servera ~]$ ps -u student -o pid,comm
    PID COMMAND
   4535 systemd
   4537 (sd-pam)
   4544 bash
   4564 sleep
...output omitted...
```

    Even a quiet login owns a few processes: your own systemd instance, the shell, and every command you run.
    {% /reveal %}
  {% /task %}

  {% task id="task-a3514b7af2b8" title="Look inside with /proc" %}
    For the `sleep` process, show its full command line and its state, parent and owner from `/proc/PID`. Then find the program your shell is running with `readlink /proc/$$/exe`.

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ tr '\0' ' ' < /proc/$(pgrep sleep)/cmdline; echo
sleep 1000
[student@servera ~]$ grep -E '^(Name|State|PPid|Uid)' /proc/$(pgrep sleep)/status
Name:	sleep
State:	S (sleeping)
PPid:	4544
Uid:	1000	1000	1000	1000
[student@servera ~]$ readlink /proc/$$/exe
/usr/bin/bash
```

    The command line is stored with null characters between the arguments, which `tr` turns into spaces for reading.
    {% /reveal %}
  {% /task %}

  {% task id="task-44127b5f0109" title="End the sleep and watch it vanish" %}

```console
[student@servera ~]$ kill %1
[student@servera ~]$ pgrep sleep
[student@servera ~]$ exit
```

    `kill %1` ended job 1 by its job number. `pgrep` printing nothing means no process matches any more.
  {% /task %}
{% /lab %}
