---
title: "Exercise: Capture and combine output"
kind: lab
minutes: 15
---

{% lead %}
On servera, save command output to files, keep errors apart from results, discard what you don't need, and chain commands with pipes and tee.
{% /lead %}

{% lab
  objectives=["ch05.redirect"]
  id="redirection"
  title="Capture and combine output"
  exercise="sa-redirect"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera"]
  outcomes=["Write and append output to files.","Separate errors from results, and discard them.","Build pipelines, and keep a copy with tee."] %}

  {% task id="task-199503c05e6f" title="Start the exercise" %}
    On workstation, start the exercise. It removes the result files of an earlier run from student's home on servera.

```console
[student@workstation ~]$ lab start sa-redirect
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-79966807d096" title="Save a list of configuration files" %}
    On servera, as student, list the `.conf` files directly in `/etc` into `conf-files.txt`, then count and peek at it.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ ls /etc/*.conf > conf-files.txt
[student@servera ~]$ wc -l conf-files.txt
22 conf-files.txt
[student@servera ~]$ head -n 3 conf-files.txt
/etc/chrony.conf
/etc/dracut.conf
/etc/host.conf
```

    The pattern expanded to 22 names, and `ls` printed one per line because its output went to a file rather than a terminal.
    {% /reveal %}
  {% /task %}

  {% task id="task-9a53644ecb31" title="Add a footer line" %}
    Add a line with today's date to the end of the same file, without losing the list.

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ echo "--- listed on $(date +%F)" >> conf-files.txt
[student@servera ~]$ tail -n 2 conf-files.txt
/etc/yum.conf
--- listed on 2026-10-03
```
    {% /reveal %}
  {% /task %}

  {% task id="task-8a80324da3a2" title="Keep results and errors apart" %}
    Search all of `/etc` for `.conf` files, sending the results to `found.txt` and the permission errors to `errors.txt`. Count both.

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ find /etc -name "*.conf" > found.txt 2> errors.txt
[student@servera ~]$ wc -l found.txt errors.txt
  78 found.txt
  13 errors.txt
  91 total
```

    Nothing appeared on the screen: both streams went to files.
    {% /reveal %}
  {% /task %}

  {% task id="task-70768ea247b3" title="Count results, discarding the errors" %}

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ find /etc -name "*.conf" 2> /dev/null | wc -l
78
```

    Only stdout flows through the pipe; stderr went to `/dev/null`.
    {% /reveal %}
  {% /task %}

  {% task id="task-61c1155bf52e" title="Find the three biggest files in /etc" %}
    `ls -lS` sorts by size, biggest first. Keep the first four lines (the first is the `total` line).

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ ls -lS /etc | head -4
total 1320
-rw-r--r--.  1 root root   692252 Jun 23  2020 services
-rw-r--r--.  1 root root    13507 Oct  3 09:28 ld.so.cache
-rw-r--r--.  1 root root    10373 May  2  2025 nanorc
```
    {% /reveal %}
  {% /task %}

  {% task id="task-2b1ba810d4e0" title="See a report and save it at the same time" %}

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ df -h | tee disk-report.txt
Filesystem      Size  Used Avail Use% Mounted on
devtmpfs        455M     0  455M   0% /dev
...output omitted...
/dev/sda2        20G  1.7G   18G   9% /
...output omitted...
[student@servera ~]$ wc -l disk-report.txt
9 disk-report.txt
```
    {% /reveal %}
  {% /task %}

  {% task id="task-14c9a44075b1" title="Grade and finish" %}
    {% lab-finish exercise="sa-redirect" grade=true servers=true /%}
  {% /task %}
{% /lab %}
