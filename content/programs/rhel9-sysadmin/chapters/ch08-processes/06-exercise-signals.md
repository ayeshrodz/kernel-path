---
title: "Exercise: Stop a runaway process the right way"
seoTitle: "Stop a runaway process the right way (RHCSA Practice Exercise)"
description: "Hands-on RHCSA practice: stop a runaway process the right way. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 25
---

{% lead %}
Compare a clean shutdown with a forced one, pause and resume a CPU hog, and end all processes belonging to one user, previewing each step first.
{% /lead %}

{% lab
  objectives=["ch08.signals"]
  id="signals"
  title="Stop a runaway process the right way"
  exercise="sa-signals"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera"]
  outcomes=["Send SIGTERM, SIGKILL, SIGSTOP and SIGCONT and see the difference.","Preview matches with pgrep before using pkill.","End all of one user's processes."] %}

  {% task id="task-3c38194bb33c" title="Start the exercise" %}
    On workstation, start the exercise. It puts the script `~/cleanup.sh` (a loop that creates `/tmp/work.lock` and removes it when it receives SIGTERM) in student's home on servera.

```console
[student@workstation ~]$ lab start sa-signals
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-8dac31281941" title="Terminate politely" %}
    Run the script in the background, check the lock file exists, then end it with the default signal. Is the lock file gone?

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ ./cleanup.sh &
[1] 4921
[student@servera ~]$ ls /tmp/work.lock
/tmp/work.lock
[student@servera ~]$ kill %1
[student@servera ~]$ Terminated
cleaning up
ls /tmp/work.lock
ls: cannot access '/tmp/work.lock': No such file or directory
```

    The trap caught SIGTERM and ran the cleanup. (Your prompt may appear before the message; press Enter.)
    {% /reveal %}
  {% /task %}

  {% task id="task-5ed67d239566" title="Force it and see what is left" %}
    Run the script again, this time ending it with signal 9. What stays behind? Remove it by hand.

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ ./cleanup.sh &
[1] 4928
[student@servera ~]$ kill -9 %1
[student@servera ~]$ ls /tmp/work.lock
/tmp/work.lock
[1]+  Killed                  ./cleanup.sh
[student@servera ~]$ rm -f /tmp/work.lock
```

    SIGKILL cannot be caught, so no cleanup ran and the lock file is stale. A real service would refuse to start next time, believing it is still running.
    {% /reveal %}
  {% /task %}

  {% task id="task-393649a2d3b1" title="Pause and resume a CPU hog" %}
    Start `sha256sum /dev/zero &`, which uses all the CPU it can get. Look at it with `top -b -n1 -o %CPU | head -8`. Pause it with SIGSTOP, check the state in `ps`, resume it with SIGCONT, and then end it.

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ sha256sum /dev/zero &
[1] 5016
[student@servera ~]$ top -b -n1 -o %CPU | sed -n 7,8p
    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
   5016 student   20   0   12076   3828   3176 R  93.3   0.4   0:01.11 sha256s+
[student@servera ~]$ kill -STOP %1
[student@servera ~]$ ps -o pid,stat,pcpu,cmd -p 5016
    PID STAT %CPU CMD
   5016 T    70.0 sha256sum /dev/zero
[student@servera ~]$ kill -CONT %1
[student@servera ~]$ kill %1
```

    A stopped process keeps its memory but uses no CPU. The `%CPU` that `ps` shows is an average over the process's whole life, so it falls only gradually.
    {% /reveal %}
  {% /task %}

  {% task id="task-c8e211255521" title="End every process of one user" %}
    As root, create the user `bob` and start two `sleep` processes as him with `nohup`. Preview them with `pgrep`, count them, then end them with `pkill`, and confirm.

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ sudo -i
[root@servera ~]# useradd -m bob
[root@servera ~]# su - bob -c 'nohup sleep 900 >/dev/null 2>&1 & nohup sleep 901 >/dev/null 2>&1 &'
[root@servera ~]# pgrep -u bob -a sleep
4986 sleep 900
4987 sleep 901
[root@servera ~]# pgrep -c -u bob sleep
2
[root@servera ~]# pkill -u bob sleep
[root@servera ~]# pgrep -u bob -a sleep
[root@servera ~]# echo $?
1
```

    `pgrep` printing nothing and exiting with status 1 means no process matched.
    {% /reveal %}
  {% /task %}

  {% task id="task-0f55f19ffce0" title="Grade and finish" %}
    {% lab-finish exercise="sa-signals" grade=true servers=true /%}
  {% /task %}
{% /lab %}
