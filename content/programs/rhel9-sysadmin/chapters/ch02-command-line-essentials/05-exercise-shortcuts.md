---
title: "Exercise: Run commands efficiently"
kind: lab
minutes: 15
---

{% lead %}
Investigate a real file on workstation, `/usr/bin/zcat`, with the commands from this chapter, and use completion, history and line editing so that you type its long name only once.
{% /lead %}

`zcat` prints the contents of compressed files. It is a good subject because it is small, and because its name doesn't tell you what kind of file it is.

{% lab
  objectives=["ch02.commands","ch02.shortcuts"]
  id="shortcuts"
  title="Run commands efficiently"
  hosts=["workstation"]
  outcomes=["Identify a file's type and read parts of it.","Reuse arguments and commands from the history instead of retyping them.","Edit a previous command with the line-editing keys."] %}

  {% task id="task-367b5c19f017" title="Show the time on a 24-hour clock" %}
    On workstation, as student:

```console
[student@workstation ~]$ date +%R
09:39
```
  {% /task %}

  {% task id="task-6e7573429416" title="Find out what kind of file zcat is" %}
    Type `file /usr/bin/zc` and press {% kbd %}Tab{% /kbd %} to complete the name, then {% kbd %}Enter{% /kbd %}:

```console
[student@workstation ~]$ file /usr/bin/zcat
/usr/bin/zcat: a /usr/bin/sh script, ASCII text executable
```

    It is a *script*: a text file of shell commands that runs like a program. Because it is text, you can read it.
  {% /task %}

  {% task id="task-3dd7ad42cefa" title="Count its lines with Alt+." %}
    Type `wc` and a space, then press {% kbd %}Alt{% /kbd %}+{% kbd %}.{% /kbd %} to bring back the last argument, `/usr/bin/zcat`:

```console
[student@workstation ~]$ wc /usr/bin/zcat
  51  299 1988 /usr/bin/zcat
```

    51 lines, 299 words and 1988 bytes.
  {% /task %}

  {% task id="task-58bc86484b8b" title="Show its first and last lines" %}
    Use {% kbd %}Alt{% /kbd %}+{% kbd %}.{% /kbd %} again for each command:

```console
[student@workstation ~]$ head /usr/bin/zcat
#!/usr/bin/sh
# Uncompress files to standard output.

# Copyright (C) 2007, 2010-2022 Free Software Foundation, Inc.
...output omitted...
[student@workstation ~]$ tail /usr/bin/zcat
With no FILE, or when FILE is -, read standard input.
...output omitted...
exec gzip -cd "$@"
```

    The first line, `#!/usr/bin/sh`, names the program that runs the script. The last line shows that `zcat` is a small wrapper: it hands its work to `gzip -cd`.
  {% /task %}

  {% task id="task-5851e3ea4a67" title="Repeat the last command in two keystrokes" %}
    Press {% kbd %}↑{% /kbd %} then {% kbd %}Enter{% /kbd %}. Then do the same with `!!`, which prints the command it expands to:

```console
[student@workstation ~]$ !!
tail /usr/bin/zcat
With no FILE, or when FILE is -, read standard input.
...output omitted...
```
  {% /task %}

  {% task id="task-df5b02dbbf3f" title="Edit the last command to show 20 lines" %}
    Press {% kbd %}↑{% /kbd %} to bring back `tail /usr/bin/zcat`, {% kbd %}Ctrl{% /kbd %}+{% kbd %}A{% /kbd %} to jump to the start, {% kbd %}Ctrl{% /kbd %}+{% kbd %}→{% /kbd %} to jump past `tail`, type a space and `-n 20`, then press {% kbd %}Enter{% /kbd %}:

```console
[student@workstation ~]$ tail -n 20 /usr/bin/zcat
  -l, --list        list compressed file contents
  -q, --quiet       suppress all warnings
...output omitted...
exec gzip -cd "$@"
```
  {% /task %}

  {% task id="task-e6dd0fd91cb8" title="Rerun the date command from the history" %}
    List the history and find the number of `date +%R`. Yours will differ from this example:

```console
[student@workstation ~]$ history | tail -n 7
   41  date +%R
   42  file /usr/bin/zcat
   43  wc /usr/bin/zcat
   44  head /usr/bin/zcat
   45  tail /usr/bin/zcat
   46  tail -n 20 /usr/bin/zcat
   47  history | tail -n 7
[student@workstation ~]$ !41
date +%R
09:41
```

    You ran `tail /usr/bin/zcat` three times in a row, but it appears once: RHEL sets `HISTCONTROL=ignoredups` in `/etc/profile`, which tells Bash not to store a command that repeats the one before it.

    `| tail -n 7` sends the long history list through `tail`, so you see only the last seven lines. Chapter 5 explains the `|` (pipe).
  {% /task %}

  {% task id="task-365c7f15075b" title="Find a command with Ctrl+R" %}
    Press {% kbd %}Ctrl{% /kbd %}+{% kbd %}R{% /kbd %} and type `wc`. The prompt changes to a search, and shows the most recent match:

```console
(reverse-i-search)`wc': wc /usr/bin/zcat
```

    Press {% kbd %}Enter{% /kbd %} to run it, or {% kbd %}Esc{% /kbd %} to put it on the command line for editing.
  {% /task %}
{% /lab %}
