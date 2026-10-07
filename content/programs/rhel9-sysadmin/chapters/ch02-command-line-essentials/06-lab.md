---
title: "Exercise: Command-line essentials review"
seoTitle: "Linux command line Practice Lab (RHCSA Exam Style)"
description: "Graded RHCSA exam-style lab on Linux command line: a challenge with requirements, hints and solutions, and a grader that checks your work on your own lab."
kind: lab
minutes: 20
---

{% lead %}
A service on servera stopped overnight, and a colleague has copied the end of its log to your workstation. Investigate the log from the command line, gather four facts into files, and let `lab grade` check them.
{% /lead %}

This lab uses everything in the chapter. It also uses one thing chapter 5 explains in depth: `>` after a command saves what the command prints into a file instead of showing it. For example, `date > now.txt` writes the date into `now.txt`.

{% lab
  objectives=["ch02.shell","ch02.commands","ch02.shortcuts"]
  id="review"
  title="Command-line essentials"
  exercise="sa-cli-review"
  ownExercise=true
  hosts=["workstation","servera"]
  outcomes=["Read the start and end of a log, identify files and count lines.","Run a command on another machine over SSH.","Save command output to files, using history and completion to type less."] %}
{% lab-notes %}

**Before you start:** complete the [practice lab](#/ch01/overview) and this chapter's lessons. Everything runs as `student` on workstation, in `~/sa-cli-review`. The lab changes no server, so there is nothing to reset afterwards, but `lab start` expects clean servers anyway, as every exercise does.

{% /lab-notes %}

{% lab-challenge %}

In `~/sa-cli-review`, create these four files:

- `time.txt`: the current time on workstation, on a 24-hour clock (`HH:MM`).
- `last5.txt`: exactly the last five lines of `server.log`.
- `lines.txt`: the number of lines in `server.log`, as `wc -l` prints it.
- `servera-kernel.txt`: the kernel release servera is running (`uname -r` prints it).

Then grade your work with `lab grade sa-cli-review`, and read the five log lines: what went wrong?

{% /lab-challenge %}

  {% task id="task-b2816dafc301" title="Start the exercise" %}
    On workstation, as student:

```console
[student@workstation ~]$ lab start sa-cli-review
==> ~/sa-cli-review is ready: cd ~/sa-cli-review
  Start from clean servers (on the Ubuntu host: rht-vmctl reset servers).
[student@workstation ~]$ cd ~/sa-cli-review
[student@workstation sa-cli-review]$
```

    `cd` changes your current directory; chapter 3 covers it. Notice that the prompt now shows `sa-cli-review` instead of `~`.
  {% /task %}

  {% task id="task-f118acaa88fe" title="Identify the two files you were given" %}
    What kind of files are `README` and `server.log`? Read the README.

    {% reveal title="Show solution" %}

```console
[student@workstation sa-cli-review]$ file README server.log
README:     ASCII text
server.log: ASCII text
[student@workstation sa-cli-review]$ cat README
Exercise: sa-cli-review (chapter 2 lab)
...output omitted...
```

    Both are plain text, so `cat` and `less` can show them. `file` accepts several file names at once.
    {% /reveal %}
  {% /task %}

  {% task id="task-4c7108bfd542" title="Save the time" %}
    Save the current time on a 24-hour clock into `time.txt`, and check the file.

    {% reveal title="Show solution" %}

```console
[student@workstation sa-cli-review]$ date +%R > time.txt
[student@workstation sa-cli-review]$ cat time.txt
09:44
```

    With `>`, `date` prints nothing on the screen: its output went into the file.
    {% /reveal %}
  {% /task %}

  {% task id="task-0fca2c60d809" title="Save the last five lines of the log" %}
    Save exactly the last five lines of `server.log` into `last5.txt`. Type `server.log` with {% kbd %}Tab{% /kbd %} completion.

    {% reveal title="Show solution" %}

```console
[student@workstation sa-cli-review]$ tail -n 5 server.log > last5.txt
[student@workstation sa-cli-review]$ cat last5.txt
Oct  3 08:58:12 servera inventory-api[2214]: database connection lost: timed out after 30s
Oct  3 08:58:12 servera inventory-api[2214]: retrying in 5s (attempt 1 of 3)
Oct  3 08:58:17 servera inventory-api[2214]: retrying in 5s (attempt 2 of 3)
Oct  3 08:58:22 servera inventory-api[2214]: retrying in 5s (attempt 3 of 3)
Oct  3 08:58:27 servera systemd[1]: inventory-api.service: Main process exited, code=exited, status=1/FAILURE
```

    The story is in those five lines: the service lost its database connection, retried three times, and then exited with an error.
    {% /reveal %}
  {% /task %}

  {% task id="task-a3e88b8787af" title="Save the line count" %}
    Save the number of lines in `server.log` into `lines.txt`, exactly as `wc -l` prints it. Reuse the file name with {% kbd %}Alt{% /kbd %}+{% kbd %}.{% /kbd %}: the last word of your previous command was `last5.txt`, so press it twice to reach `server.log`, or edit the previous command instead.

    {% reveal title="Show solution" %}

```console
[student@workstation sa-cli-review]$ wc -l server.log > lines.txt
[student@workstation sa-cli-review]$ cat lines.txt
40 server.log
```
    {% /reveal %}
  {% /task %}

  {% task id="task-13f6c29a9bc3" title="Save servera's kernel release" %}
    `ssh` can run a single command on another machine and print its output here, without opening a shell: put the command after the host name. Save servera's kernel release into `servera-kernel.txt`.

    {% reveal title="Show solution" %}

```console
[student@workstation sa-cli-review]$ ssh servera uname -r > servera-kernel.txt
[student@workstation sa-cli-review]$ cat servera-kernel.txt
5.14.0-687.53.1.el9_8.x86_64
```

    `uname -r` ran on servera; its output travelled back over SSH and `>` saved it on workstation. Your release may be newer.
    {% /reveal %}
  {% /task %}

  {% task id="task-c23aebb2c7f6" title="Check and finish" %}
    {% lab-finish exercise="sa-cli-review" grade=true /%}

    {% reveal title="What a passing grade looks like" %}

```console
[student@workstation sa-cli-review]$ lab grade sa-cli-review
sa-cli-review / final — read-only checks
PASS README: present
     Review: #/ch02/lab
PASS server.log: present
     Review: #/ch02/lab
PASS time.txt holds a 24-hour time such as 09:30
     Review: #/ch02/lab
PASS last5.txt holds exactly the last five lines of server.log
     Review: #/ch02/lab
PASS lines.txt shows the line count as wc -l prints it
     Review: #/ch02/lab
PASS servera-kernel.txt holds servera's kernel release
     Review: #/ch02/lab
Grading only reads. Fix any FAIL and grade again; for lasting changes, reboot the server and grade once more.
```
    {% /reveal %}
  {% /task %}
{% /lab %}
