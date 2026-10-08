---
title: "Exercise: Processes review"
seoTitle: "Linux processes Practice Lab (RHCSA Exam Style)"
description: "Graded RHCSA exam-style lab on Linux processes: a challenge with requirements, hints and solutions, and a grader that checks your work on your own lab."
kind: lab
minutes: 30
---

{% lead %}
Run a small batch of work as a service user on servera: one process that survives a hangup, one that you reprioritise and pause, one that you end cleanly, and a tuned profile for the server.
{% /lead %}

{% lab
  objectives=["ch08.processes","ch08.jobs","ch08.signals","ch08.monitoring"]
  id="review"
  title="Processes review"
  exercise="sa-proc-review"
  ownExercise=true
  hosts=["workstation","servera"]
  outcomes=["Start protected, reprioritised and paused processes as another user.","End a process with the right signal.","Install tuned and select a profile."] %}
{% lab-notes %}

**Before you start:** reset the servers and complete this chapter's lessons. You work on **servera** as root (`sudo -i`); `lab start` and `lab grade` run on workstation. The grader looks at what is running at that moment, so leave the processes in place until you have graded.

{% /lab-notes %}

{% lab-challenge %}

1. Create the user `worker`. As `worker`, start `sleep 7000` in the background so that it survives a closed terminal, with niceness 5.
2. As `worker`, start `sleep 7001` in the background, change its niceness to 12 and pause it with a signal (it must be stopped, not ended).
3. As `worker`, start `sleep 7002`, then end it with the default signal.
4. Install `tuned`, enable and start it, and select the profile `throughput-performance`.
5. On workstation, fill in the signal numbers in `answers.txt`.

{% /lab-challenge %}

  {% task id="task-1e19a9d3aef1" title="Start the exercise" %}

```console
[student@workstation ~]$ lab start sa-proc-review
[student@workstation ~]$ cd ~/sa-proc-review
[student@workstation sa-proc-review]$ ssh student@servera
[student@servera ~]$ sudo -i
[root@servera ~]#
```
  {% /task %}

  {% task id="task-d37d0618412f" title="Create worker and start the three processes" %}

    {% reveal title="Show solution" %}

```console
[root@servera ~]# useradd -m worker
[root@servera ~]# su - worker -c 'nohup nice -n 5 sleep 7000 >/dev/null 2>&1 &'
[root@servera ~]# su - worker -c 'nohup sleep 7001 >/dev/null 2>&1 &'
[root@servera ~]# su - worker -c 'nohup sleep 7002 >/dev/null 2>&1 &'
[root@servera ~]# pgrep -u worker -a sleep
5101 sleep 7000
5102 sleep 7001
5103 sleep 7002
```

    The `nohup` and `&` keep each process alive after `su` returns.
    {% /reveal %}
  {% /task %}

  {% task id="task-33dd35ba1cb0" title="Reprioritise, pause and end" %}

    {% reveal title="Show solution" %}

```console
[root@servera ~]# renice -n 12 -p $(pgrep -f '^sleep 7001$')
5102 (process ID) old priority 0, new priority 12
[root@servera ~]# kill -STOP $(pgrep -f '^sleep 7001$')
[root@servera ~]# kill $(pgrep -f '^sleep 7002$')
[root@servera ~]# ps -o pid,user,ni,stat,cmd -C sleep
    PID USER      NI STAT CMD
   5101 worker     5 SN   sleep 7000
   5102 worker    12 TN   sleep 7001
```

    `STAT` `T` shows the paused process; `7002` is gone. Using `pgrep -f '^sleep 7001$'` matches the whole command line exactly, so it cannot hit a different sleep.
    {% /reveal %}
  {% /task %}

  {% task id="task-e7ae10ca6178" title="Install tuned and choose the profile" %}

    {% reveal title="Show solution" %}

```console
[root@servera ~]# dnf install -y tuned
...output omitted...
[root@servera ~]# systemctl enable --now tuned
[root@servera ~]# tuned-adm profile throughput-performance
[root@servera ~]# tuned-adm active
Current active profile: throughput-performance
```
    {% /reveal %}
  {% /task %}

  {% task id="task-63bbe29381d5" title="Record the signal numbers and grade" %}
    Leave servera, then on workstation edit `answers.txt` (use `kill -l` to look the numbers up) and grade:

    {% lab-finish exercise="sa-proc-review" grade=true servers=true /%}
  {% /task %}
{% /lab %}
