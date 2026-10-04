---
title: "Exercise: Find the slowdown and tune the server"
kind: lab
minutes: 25
---

{% lead %}
Two CPU-hungry processes are fighting for servera's CPU. Find them, watch how `nice` changes the share each gets, learn what an ordinary user may not do, and finish by installing and selecting a `tuned` profile.
{% /lead %}

{% lab
  objectives=["ch08.monitoring"]
  id="monitoring"
  title="Find the slowdown and tune the server"
  exercise="sa-monitoring"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera"]
  outcomes=["Read load average, top and free.","Compare a normal and a nice process.","Install tuned and switch profiles."] %}

  {% task id="task-4c53c1c672e9" title="Start the exercise" %}
    On workstation, start the exercise. It makes sure the tuned package is not installed yet on servera.

```console
[student@workstation ~]$ lab start sa-monitoring
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-e65f5036b47e" title="Take the baseline" %}
    On servera, record the load average, the number of CPUs and the memory figures before you start any load.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ uptime
 16:21:40 up 0 min,  0 users,  load average: 0.00, 0.01, 0.00
[student@servera ~]$ nproc
1
[student@servera ~]$ free -h | head -2
               total        used        free      shared  buff/cache   available
Mem:           937Mi       376Mi       553Mi        21Mi       166Mi       560Mi
```
    {% /reveal %}
  {% /task %}

  {% task id="task-15df01d4e889" title="Start two hogs, one of them nice" %}
    Start one `sha256sum /dev/zero` normally and one with `nice -n 19`, both in the background. After a few seconds, compare their CPU shares and nice values with `ps`.

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ sha256sum /dev/zero &
[1] 5062
[student@servera ~]$ nice -n 19 sha256sum /dev/zero &
[2] 5063
[student@servera ~]$ ps -o pid,ni,pcpu,stat,cmd -C sha256sum
    PID  NI %CPU STAT CMD
   5062   0 95.0 R    sha256sum /dev/zero
   5063  19  1.3 RN   sha256sum /dev/zero
```

    Both want all the CPU. The normal one gets almost all of it; the nice-19 one only runs when there is a gap. The `N` in `STAT` marks a low-priority process.
    {% /reveal %}
  {% /task %}

  {% task id="task-3dd8a7cd8f87" title="Try to give the nice process more priority" %}
    Try `renice -n 10` on the nice-19 process, as `student`. What happens? Then make the *normal* process nicer instead (`renice -n 5`).

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ renice -n 10 -p 5063
renice: failed to set priority for 5063 (process ID): Permission denied
[student@servera ~]$ renice -n 5 -p 5062
5062 (process ID) old priority 0, new priority 5
```

    Making a process less nice needs root, so users cannot raise their own priority. Making a process nicer is always allowed.
    {% /reveal %}
  {% /task %}

  {% task id="task-4afe3a2c044c" title="Watch the load rise" %}
    With both hogs running, find them with `top` (press `q` to leave) and look at the header. Wait a minute and run `uptime` again. Which of the three averages moved first?

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ top -b -n1 -o %CPU | sed -n 1,3p
top - 16:29:34 up 8 min,  0 users,  load average: 0.84, 0.47, 0.22
Tasks: 121 total,   2 running, 119 sleeping,   0 stopped,   0 zombie
%Cpu(s): 98.0 us,  2.0 sy,  0.0 ni,  0.0 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
[student@servera ~]$ uptime
 16:30:34 up 9 min,  0 users,  load average: 1.82, 0.97, 0.43
```

    The 1-minute figure reacts first, then 5 and 15. With two hogs on one CPU the load climbs towards 2. Your exact numbers will differ.
    {% /reveal %}
  {% /task %}

  {% task id="task-0d8e8cd70038" title="End the load" %}

```console
[student@servera ~]$ pkill sha256sum
[student@servera ~]$ jobs
[1]-  Terminated              sha256sum /dev/zero
[2]+  Terminated              nice -n 19 sha256sum /dev/zero
```
  {% /task %}

  {% task id="task-13af852f99db" title="Install tuned and choose a profile" %}
    As root, install the `tuned` package, enable and start the service, and show the active and recommended profiles. Switch to `throughput-performance`, confirm, and then switch back to the recommended one.

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ sudo dnf install -y tuned
...output omitted...
Complete!
[student@servera ~]$ sudo systemctl enable --now tuned
[student@servera ~]$ tuned-adm active
Current active profile: virtual-guest
[student@servera ~]$ tuned-adm recommend
virtual-guest
[student@servera ~]$ sudo tuned-adm profile throughput-performance
[student@servera ~]$ tuned-adm active
Current active profile: throughput-performance
[student@servera ~]$ sudo tuned-adm profile "$(tuned-adm recommend)"
[student@servera ~]$ tuned-adm active
Current active profile: virtual-guest
```

    Remember to go back to the recommended profile unless you measured a benefit. (Package installation is covered in chapter 13.)
    {% /reveal %}
  {% /task %}

  {% task id="task-784c0dd399df" title="Grade and finish" %}
    {% lab-finish exercise="sa-monitoring" grade=true servers=true /%}
  {% /task %}
{% /lab %}
