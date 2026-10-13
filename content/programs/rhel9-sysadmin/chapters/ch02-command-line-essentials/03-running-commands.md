---
title: Run commands and read files
seoTitle: "Linux Commands: Options, Arguments, cat and less"
description: "Run Linux commands with options and arguments, and read files with cat, less, head, tail and wc. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 15
---

{% lead %}
Most of an administrator's day is running small commands and reading what they print. This lesson covers the first dozen you will use constantly: asking for the date, identifying a file, and looking at a file's contents in whole or in part. Then you try them in a practice terminal.
{% /lead %}

{% objectives %}
- Run commands with options and arguments, and put several commands on one line or one command on several lines.
- Identify a file's type with `file`, whatever its name.
- Read files with `cat`, `less`, `head` and `tail`, and count lines, words and bytes with `wc`.
{% /objectives %}

## Run a command

Type the command and press {% kbd %}Enter{% /kbd %}. The shell runs it, shows its output, and prints a new prompt when it has finished:

```console
[student@workstation ~]$ whoami
student
[student@workstation ~]$
```

Commands are case-sensitive: `whoami` works, `WhoAmI` doesn't. Words are separated by spaces, so a file name that contains spaces needs quoting (chapter 3 explains how).

### Ask for the date, your way

`date` prints the date and time. Give it an argument that starts with `+` and it prints only what you ask for, using codes that start with `%`:

```console
[student@workstation ~]$ date
Sat Oct  3 09:30:23 AM UTC 2026
[student@workstation ~]$ date +%R
09:30
[student@workstation ~]$ date +%x
10/03/2026
[student@workstation ~]$ date +%Y-%m-%d
2026-10-03
```

| Code | Prints | Code | Prints |
| --- | --- | --- | --- |
| `%R` | time, 24-hour (`09:30`) | `%Y` | four-digit year |
| `%x` | the date in your locale's style | `%m` | month, `01` to `12` |
| `%A` | weekday name | `%d` | day of the month |

Root can also *set* the clock with `date`, but on a server you leave that to time synchronisation, which chapter 11 covers.

### Change your password

`passwd` with no arguments changes your own password. It asks for the current one first, then the new one twice, and refuses passwords that are too short, too simple or based on a dictionary word:

```console
[student@servera ~]$ passwd
Changing password for user student.
Current password:
New password:
Retype new password:
passwd: all authentication tokens updated successfully.
```

Nothing appears on screen as you type a password, not even asterisks. That is deliberate. Root can change anyone's password with `passwd username`; chapter 6 shows how.

{% callout type="warning" title="Keep student's password in the lab" %}
The lab's instructions assume the password `student`. If you try `passwd`, do it on a server and run `rht-vmctl reset servera` afterwards, or set it back.
{% /callout %}

### Several commands on one line, one command on several lines

A semicolon separates commands on one line. The shell runs them one after another, as if you had pressed {% kbd %}Enter{% /kbd %} after each:

```console
[student@workstation ~]$ date +%R ; whoami
09:30
student
```

A backslash at the very end of a line tells the shell "the command continues on the next line". The shell shows a secondary prompt, `>`, until you finish. Don't type the `>`: it is the shell's, not part of your command. This site leaves secondary prompts out of examples so you can copy them:

```console
[student@workstation ~]$ head -n 2 \
/etc/group \
/etc/hostname
==> /etc/group <==
root:x:0:
bin:x:1:

==> /etc/hostname <==
workstation.lab.example.com
```

## What kind of file is this?

Linux doesn't care about file name extensions. A file called `report` can be text, a program, or a compressed archive. The `file` command looks inside the file and tells you what it really is:

```console
[student@workstation ~]$ file /etc/passwd
/etc/passwd: ASCII text
[student@workstation ~]$ file /usr/bin/passwd
/usr/bin/passwd: setuid ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, ... stripped
[student@workstation ~]$ file /home
/home: directory
```

*ASCII text* means you can read it. An *ELF executable* is a compiled program; printing it would fill your terminal with noise. Run `file` first whenever you are not sure.

## Read a file

{% diagram ref="file-viewers" /%}

### cat: the whole file at once

`cat` prints whole files, one after another. It is perfect for short files:

```console
[student@workstation ~]$ cat /etc/hostname
workstation.lab.example.com
[student@workstation ~]$ cat /etc/redhat-release
Rocky Linux release 9.8 (Blue Onyx)
```

For a long file, `cat` scrolls everything past faster than you can read it.

### less: page through a long file

`less` shows one screenful at a time and lets you move around:

| Key | Does |
| --- | --- |
| {% kbd %}Space{% /kbd %} / {% kbd %}b{% /kbd %} | Next / previous page |
| {% kbd %}↓{% /kbd %} / {% kbd %}↑{% /kbd %} | One line down / up |
| {% kbd %}/{% /kbd %}`word` then {% kbd %}Enter{% /kbd %} | Search forward for *word*; {% kbd %}n{% /kbd %} finds the next match |
| {% kbd %}g{% /kbd %} / {% kbd %}G{% /kbd %} | Jump to the start / end |
| {% kbd %}q{% /kbd %} | Quit, back to the prompt |

You will use the same keys in manual pages, which open in `less`.

### head and tail: the start or the end

`head` prints the first ten lines of a file and `tail` the last ten. `-n` picks a different number:

```console
[student@workstation ~]$ head -n 3 /etc/passwd
root:x:0:0:root:/root:/bin/bash
bin:x:1:1:bin:/bin:/sbin/nologin
daemon:x:2:2:daemon:/sbin:/sbin/nologin
[student@workstation ~]$ tail -n 3 /etc/passwd
dbus:x:81:81:System Message Bus:/:/usr/sbin/nologin
student:x:1000:1000:Student User:/home/student:/bin/bash
chrony:x:997:997:chrony system user:/var/lib/chrony:/sbin/nologin
```

`tail` is the one you will reach for most: log files grow at the bottom, so the newest entries are always at the end. Chapter 11 adds `tail -f`, which keeps watching a file as it grows.

### wc: how big is it?

`wc` (word count) prints the number of lines, words and bytes. `-l`, `-w` and `-c` print just one of them. Given several files, it adds a total:

```console
[student@workstation ~]$ wc /etc/passwd
 20  37 959 /etc/passwd
[student@workstation ~]$ wc -l /etc/passwd /etc/group
  20 /etc/passwd
  39 /etc/group
  59 total
```

Every account has one line in `/etc/passwd`, so `wc -l /etc/passwd` is a quick way to count them.

## Help is one option away

Almost every command prints a short summary of its options when you add `--help`:

```console
[student@workstation ~]$ date --help
Usage: date [OPTION]... [+FORMAT]
  or:  date [-u|--utc|--universal] [MMDDhhmm[[CC]YY][.ss]]
Display the current time in the given FORMAT, or set the system date.
...output omitted...
```

Chapter 4 is about finding help properly, with manual pages.

## Try it

This practice terminal knows the commands from this lesson, with the output they gave on the lab. Work through the tasks on the right; each ticks off when you run a command that does it. Tab completion and the arrow keys work here too.

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch02.commands"] ref="quick" /%}
