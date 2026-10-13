---
title: Monitoring load and setting priorities
seoTitle: "Load Average, nice, renice and tuned on RHEL 9"
description: "Read load averages and top, change process priority with nice and renice, and pick a tuned profile. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 20
---

{% lead %}
"The server is slow" is the most common complaint in system administration. Before you change anything, you need evidence: how busy is the CPU, how much memory is really available, and which process is responsible. This lesson covers the tools for that, and the two simple ways to respond: change a process's priority, or apply a tuned profile.
{% /lead %}

{% objectives %}
- Read the load average, `top` and `free`, and relate load to the number of CPUs.
- Find the process behind a resource problem.
- Change priority with `nice` and `renice`, and list and select a `tuned` profile.
{% /objectives %}

## Load average

`uptime` shows how long the system has been up and the **load average**: the average number of processes that wanted a CPU (running or waiting for one) over the last 1, 5 and 15 minutes.

{% diagram ref="load-average" /%}

```console
[student@servera ~]$ uptime
 16:21:40 up 0 min,  0 users,  load average: 1.03, 0.23, 0.07
[student@servera ~]$ nproc
1
```

The number only means something next to the **CPU count**. On this one-CPU machine, a load of 1 means fully busy and 3 means three processes fighting for one CPU. On a 4-CPU server, a load of 4 is full and 2 is half idle. Compare the three figures to see the trend: `8.0, 2.0, 0.5` is a rising load; `0.5, 2.0, 8.0` is a recovering one.

## top and free

`top` is a live view, refreshed every few seconds. The header summarises the machine; the table lists processes, busiest first by default:

```console
[student@servera ~]$ top -b -n1 | head -7
top - 16:21:41 up 0 min,  0 users,  load average: 1.03, 0.23, 0.07
Tasks: 119 total,   1 running, 118 sleeping,   0 stopped,   0 zombie
%Cpu(s):  0.0 us,  6.2 sy,  0.0 ni, 93.8 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
MiB Mem :    937.4 total,    553.6 free,    376.0 used,    166.8 buff/cache
MiB Swap:      0.0 total,      0.0 free,      0.0 used.    561.4 avail Mem
```

| Header item | What to look at |
| --- | --- |
| `us`, `sy`, `ni` | CPU time in user programs, in the kernel, and in programs with a changed nice value |
| `id` | Idle: a low number means a busy CPU |
| `wa` | Waiting for disk or network I/O: high values point to storage |
| `avail Mem` | Memory available **without swapping**: the real figure to watch |

Useful keys inside `top`: `q` quits, `M` sorts by memory, `P` by CPU, `k` sends a signal to a PID you type, `r` renices one, `1` shows each CPU separately, `?` shows help.

`free -h` is the one-line version for memory. A small "free" column is normal: Linux fills spare memory with a cache of disk data and hands it back instantly when programs need it. Watch `available`.

```console
[student@servera ~]$ free -h
               total        used        free      shared  buff/cache   available
Mem:           937Mi       376Mi       553Mi        21Mi       166Mi       560Mi
Swap:             0B          0B          0B
```

## Priority: nice and renice

Every process has a **nice value** from -20 to 19 that influences how much CPU time it gets *when there is competition*. A higher number is "nicer" to others, so the process gets less. The default is 0.

Start a program with a different value using `nice`, and change a running one with `renice`:

```console
[student@servera ~]$ sha256sum /dev/zero &
[1] 5062
[student@servera ~]$ nice -n 19 sha256sum /dev/zero &
[2] 5063
[student@servera ~]$ ps -o pid,ni,pcpu,stat,cmd -C sha256sum
    PID  NI %CPU STAT CMD
   5062   0 95.0 R    sha256sum /dev/zero
   5063  19  1.3 RN   sha256sum /dev/zero
[student@servera ~]$ renice -n 10 -p 5063
renice: failed to set priority for 5063 (process ID): Permission denied
```

The nice-19 process gets a sliver of the CPU while the other runs. Notice the last command: an ordinary user can only make a process **nicer**. Making it *less* nice (a lower number) is reserved for root, so nobody can grab priority for themselves. As root, `renice -n -5 -p 5063` would work.

Nice values affect only competition for CPU time. They do not limit memory or disk use.

## tuned profiles

Beyond single processes, `tuned` applies a whole **profile** of kernel and device settings suited to a workload: low latency, high throughput, power saving. It is installed with `dnf install tuned` and runs as a service.

| Command | Does |
| --- | --- |
| `tuned-adm list` | Show available profiles |
| `tuned-adm active` | Show the profile in use |
| `tuned-adm recommend` | Suggest a profile for this machine |
| `tuned-adm profile NAME` | Switch profile |

```console
[root@servera ~]# tuned-adm active
Current active profile: virtual-guest
[root@servera ~]# tuned-adm profile throughput-performance
[root@servera ~]# tuned-adm active
Current active profile: throughput-performance
```

Note the current profile before you change it, and compare real measurements afterwards: a profile is a tool, not a guarantee. Return to `tuned-adm recommend` if it does not help.

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch08.monitoring"] ref="quick" /%}
