---
title: "Exercise: Juggle jobs in one terminal"
seoTitle: "Juggle jobs in one terminal (RHCSA Practice Exercise)"
description: "Hands-on RHCSA practice: juggle jobs in one terminal. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 15
---

{% lead %}
Run three long commands at once from a single terminal: start, pause, resume, bring to the front and end them, and see which survive a logout.
{% /lead %}

{% lab
  objectives=["ch08.jobs"]
  id="jobs"
  title="Juggle jobs in one terminal"
  hosts=["workstation","servera"]
  outcomes=["Start, pause, resume and stop jobs with &, Ctrl+Z, bg, fg and kill.","Distinguish job numbers from PIDs.","Keep a command running after logout with nohup."] %}

  {% task id="task-1890179e627c" title="Start two background jobs" %}
    On servera, start `sleep 800` and `sleep 801` as background jobs, then list them with PIDs.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ sleep 800 &
[1] 762
[student@servera ~]$ sleep 801 &
[2] 763
[student@servera ~]$ jobs -l
[1]-   762 Running                 sleep 800 &
[2]+   763 Running                 sleep 801 &
```

    The numbers in brackets are job numbers; the others are PIDs.
    {% /reveal %}
  {% /task %}

  {% task id="task-8d2447b3ca80" title="Pause one in the foreground" %}
    Bring job 1 to the foreground, then press **Ctrl+Z** to pause it. Check the state with `jobs`, and with `ps`.

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ fg %1
sleep 800
^Z
[1]+  Stopped                 sleep 800
[student@servera ~]$ jobs
[1]+  Stopped                 sleep 800
[2]-  Running                 sleep 801 &
[student@servera ~]$ ps -o pid,stat,cmd -C sleep
    PID STAT CMD
    762 T    sleep 800
    763 S    sleep 801
```

    `T` is the stopped state, `S` sleeping. The shell printed `^Z` where you pressed the key.
    {% /reveal %}
  {% /task %}

  {% task id="task-a4dcfd133950" title="Resume it in the background and end the other" %}

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ bg %1
[1]+ sleep 800 &
[student@servera ~]$ kill %2
[2]+  Terminated              sleep 801
[student@servera ~]$ jobs
[1]+  Running                 sleep 800 &
```
    {% /reveal %}
  {% /task %}

  {% task id="task-e513f21ab5a8" title="Interrupt a foreground command" %}
    Run `sleep 600` in the foreground (the prompt does not return). Press **Ctrl+C**. What came back?

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ sleep 600
^C
[student@servera ~]$
```

    Ctrl+C sent SIGINT, the program ended, and the prompt returned. Unlike Ctrl+Z, the command is gone, not paused.
    {% /reveal %}
  {% /task %}

  {% task id="task-76ffdab5b7d6" title="Survive a dropped terminal" %}
    Start `sleep 802` and `nohup sleep 700` in the background. Then simulate a closed terminal by sending SIGHUP to your own shell with `kill -HUP $$`. Log in again and find out which of the two is still alive. Why?

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ sleep 802 &
[1] 4699
[student@servera ~]$ nohup sleep 700 &
[2] 4700
nohup: ignoring input and appending output to 'nohup.out'
[student@servera ~]$ kill -HUP $$
Connection to servera closed.
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ pgrep -a sleep
4700 sleep 700
```

    A closed terminal or a dropped connection makes the shell receive SIGHUP, and it passes the hangup on to its jobs. `sleep 802` ended; `sleep 700` was protected by `nohup`. (Typing `exit` normally is different: the shell leaves its background jobs alone.)
    {% /reveal %}
  {% /task %}

  {% task id="task-d6956fbec931" title="Clean up" %}

```console
[student@servera ~]$ pkill sleep
[student@servera ~]$ rm -f nohup.out
[student@servera ~]$ exit
```
  {% /task %}
{% /lab %}
