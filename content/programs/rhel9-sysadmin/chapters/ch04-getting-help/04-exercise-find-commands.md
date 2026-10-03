---
title: "Exercise: Find commands you have never used"
kind: lab
minutes: 15
---

{% lead %}
You are given four jobs and no command names. Find each command with a keyword search, check it, and run it on workstation. Then dig into a package's own documentation.
{% /lead %}

{% lab
  objectives=["ch04.search"]
  id="find-commands"
  title="Find commands you have never used"
  hosts=["workstation"]
  outcomes=["Turn a description of a job into a keyword search.","Narrow a search that finds too much.","Find documentation that is not a manual page."] %}

  {% task id="task-d2bf7190b95f" title="How long has workstation been running?" %}
    Search the manual for a phrase that describes the job, then run the command you find.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ man -k "how long"
uptime (1)           - Tell how long the system has been running.
[student@workstation ~]$ uptime
 10:10:58 up 43 min,  0 users,  load average: 0.00, 0.03, 0.00
```

    Chapter 8 explains the *load average* numbers.
    {% /reveal %}
  {% /task %}

  {% task id="task-2f6d8a53aa54" title="Show this month's calendar" %}

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ man -k calendar
cal (1)              - display a calendar
[student@workstation ~]$ cal 10 2026
    October 2026
Su Mo Tu We Th Fr Sa
             1  2  3
 4  5  6  7  8  9 10
11 12 13 14 15 16 17
18 19 20 21 22 23 24
25 26 27 28 29 30 31
```

    `man cal` shows that it also accepts a month and a year.
    {% /reveal %}
  {% /task %}

  {% task id="task-205e92ff1c67" title="How much memory is free?" %}
    A search for `memory` alone finds dozens of programmer pages. Narrow it: use a more specific phrase, or limit it to section 1.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ man -k memory | head -5
aligned_alloc (3)    - allocate aligned memory
alloca (3)           - allocate memory that is automatically freed
calloc (3)           - allocate and free dynamic memory
cfree (3)            - free allocated memory
chmem (8)            - configure memory
[student@workstation ~]$ man -k "free and used memory"
free (1)             - Display amount of free and used memory in the system
[student@workstation ~]$ free -h
               total        used        free      shared  buff/cache   available
Mem:           1.9Gi       376Mi       1.4Gi        23Mi       320Mi       1.5Gi
Swap:             0B          0B          0B
```

    `man -k -s 1 memory` would also have cut the list down, to commands only. `-h` gives readable sizes here too, as it did for `ls`.
    {% /reveal %}
  {% /task %}

  {% task id="task-e565f0dcb76d" title="Which echo runs?" %}
    `echo` exists both as a shell built-in and as a program. `type -a` lists every match, in the order the shell tries them.

```console
[student@workstation ~]$ type -a echo
echo is a shell builtin
echo is /usr/bin/echo
```

    The built-in wins, so `help echo` describes the `echo` you actually use, while `man echo` describes `/usr/bin/echo`. They behave almost identically.
  {% /task %}

  {% task id="task-55cce18dcfbe" title="Read a package's own documentation" %}
    chrony keeps workstation's clock right. Look at what its package installed under `/usr/share/doc`, and read the start of its README.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ls /usr/share/doc/chrony
FAQ  NEWS  README
[student@workstation ~]$ head -n 8 /usr/share/doc/chrony/README
This is the README for chrony.

What is chrony?
===============

chrony is a versatile implementation of the Network Time Protocol (NTP).
It can synchronise the system clock with NTP servers, reference clocks
(e.g. GPS receiver), and manual input using wristwatch and keyboard.
```

    The FAQ answers common configuration questions that the manual pages don't. Chapter 11 configures chrony.
    {% /reveal %}
  {% /task %}
{% /lab %}
