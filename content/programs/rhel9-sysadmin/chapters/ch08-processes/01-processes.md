---
title: What a process is
seoTitle: "Linux Processes: ps, top and /proc Explained"
description: "What a Linux process is, its states and parents, and how to list processes with ps, pgrep and top. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 15
---

{% lead %}
A **program** is a file on disk. A **process** is that program running: it has its own memory, an owner, a state, and a number. Whenever something on a Linux system is "slow", "stuck" or "using too much", you are really asking questions about processes, so this chapter starts by learning to see them.
{% /lead %}

{% objectives %}
- Explain what a process is, and what PID, PPID and a parent-child tree mean.
- Describe how a shell starts a command with fork and exec.
- List processes with `ps`, `pstree` and `/proc`, and read the process states.
{% /objectives %}

## Programs, processes and PIDs

Each running process gets a unique number, its **process ID (PID)**, and records the PID of the process that started it, its **parent (PPID)**. Only the very first process, systemd, has PID 1 and no parent. Everything else descends from it, so the processes form a family tree.

The process also carries the identity of the **user** it runs as (chapter 6) and so can only do what that user may do (chapter 7). That is why a service that runs as an unprivileged account is safer than one that runs as root.

## How a command becomes a process

Step through what happens when you type `ls`:

{% diagram ref="lifecycle" /%}

Two system calls do the work: **fork** makes a copy of the parent, and **exec** replaces the copy with a new program. The shell then waits for its child to finish. The child's exit status (0 for success) is available afterwards in the special variable `$?`.

## Listing processes

`ps` takes a snapshot. By itself it shows only your current terminal. Two combinations list everything, with slightly different columns:

```console
[student@servera ~]$ ps
    PID TTY          TIME CMD
    661 ?        00:00:00 systemd
    663 ?        00:00:00 (sd-pam)
    670 pts/0    00:00:00 bash
    712 pts/0    00:00:00 ps
[student@servera ~]$ ps aux | head -4
USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root           1  8.2  1.7  26836 16424 ?        Ss   16:21   0:00 /usr/lib/systemd/systemd --switched-root --system --deserialize 31
root           2  0.0  0.0      0     0 ?        S    16:21   0:00 [kthreadd]
root           3  0.0  0.0      0     0 ?        S    16:21   0:00 [pool_workqueue_]
```

| Column | Meaning |
| --- | --- |
| `USER` | The account the process runs as |
| `PID` | Process ID |
| `%CPU`, `%MEM` | Share of CPU time and of memory |
| `VSZ`, `RSS` | Virtual and resident memory, in KiB |
| `TTY` | Terminal it is attached to (`?` means none, as for services) |
| `STAT` | State letters, explained below |
| `COMMAND` | The command line; names in `[brackets]` are kernel threads |

`ps -ef` lists the same with the parent PID (PPID), and `ps -ef --forest` or `pstree -p` draw the tree. To choose your own columns and sort order, use `-o`:

```console
[student@servera ~]$ echo $$
670
[student@servera ~]$ ps -o pid,ppid,user,stat,ni,pcpu,pmem,comm -p $$
    PID    PPID USER     STAT  NI %CPU %MEM COMMAND
    670     659 student  Ss     0  0.0  0.3 bash
[student@servera ~]$ ps -eo pid,ppid,stat,comm --sort=-pcpu | head -3
    PID    PPID STAT COMMAND
      1       0 Ss   systemd
     17       2 S<   pr/ttyS0
```

`$$` is the PID of your own shell, a handy starting point. The line `--sort=-pcpu` puts the biggest CPU users first (`-` means descending).

## Process states

The `STAT` column starts with one letter. Select each to see what it means:

{% diagram ref="states" /%}

Most processes are asleep nearly all the time, waiting for work. If a process is **busy** it shows R; if it is **stopped** it shows T. A **zombie** (Z) is a finished process whose parent has not yet collected its result: it cannot be killed, but it also uses nothing, and it disappears when the parent does.

## The /proc view

The kernel exposes every process as a directory under `/proc`, named by PID. `ps` and `top` are just friendly readers of these files:

```console
[student@servera ~]$ cat /proc/$$/status | head -3
Name:	bash
Umask:	0022
State:	S (sleeping)
```

You rarely need to read `/proc` by hand, but knowing it is there explains how tools can know so much without special access.

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch08.processes"] ref="quick" /%}
