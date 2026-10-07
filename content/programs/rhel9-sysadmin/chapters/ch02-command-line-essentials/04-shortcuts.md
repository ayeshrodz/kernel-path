---
title: Work faster with completion and history
seoTitle: "Bash Tab Completion, History and Shortcuts"
description: "Save keystrokes with Tab completion, history search with Ctrl+R and Bash line-editing shortcuts. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 15
---

{% lead %}
Experienced administrators don't type faster; they type less. Bash completes names for you, remembers every command you run, and lets you edit a command line without retyping it. These few keys save thousands of keystrokes a day, and prevent typing mistakes in long paths.
{% /lead %}

{% objectives %}
- Complete commands, file names and options with {% kbd %}Tab{% /kbd %}.
- Find and rerun earlier commands with the history list, `!!`, `!N` and `!string`, and reuse arguments with {% kbd %}Alt{% /kbd %}+{% kbd %}.{% /kbd %}.
- Move around and edit the command line with the {% kbd %}Ctrl{% /kbd %} shortcuts, and search the history with {% kbd %}Ctrl{% /kbd %}+{% kbd %}R{% /kbd %}.
{% /objectives %}

## Tab completion

Type the start of a command or file name and press {% kbd %}Tab{% /kbd %}. If only one thing matches, Bash completes it. If several match, the first {% kbd %}Tab{% /kbd %} completes as far as they agree and a second {% kbd %}Tab{% /kbd %} lists them:

```console
[student@workstation ~]$ pas Tab Tab
passmass  passwd    paste
[student@workstation ~]$ passw Tab
[student@workstation ~]$ passwd
```

It works for file names anywhere on the line:

```console
[student@workstation ~]$ ls /etc/pas Tab
[student@workstation ~]$ ls /etc/passwd Tab Tab
passwd   passwd-
```

And, for most commands, for their options:

```console
[root@servera ~]# useradd -- Tab Tab
--badname               --help                  --prefix
--base-dir              --home-dir              --root
--btrfs-subvolume-home  --inactive              --selinux-user
--comment               --key                   --shell
--create-home           --no-create-home        --skel
--defaults              --no-log-init           --system
--expiredate            --non-unique            --uid
--gid                   --no-user-group         --user-group
--groups                --password
```

{% callout type="tip" title="Tab as a spell checker" %}
If {% kbd %}Tab{% /kbd %} doesn't complete a file name you are sure exists, you have a typo in what you typed so far, or you are in a different directory from the one you think. Either way, you found out before running the command.
{% /callout %}

## The command history

Bash remembers the commands you run. The `history` command lists them with numbers:

```console
[student@workstation ~]$ history
    1  date +%R
    2  file /etc/passwd
    3  wc -l /etc/passwd
    4  tail -n 3 /etc/passwd
    5  history
```

The history is saved to `~/.bash_history` when you log out, so it survives from one session to the next.

### Rerun a command

| Type | Runs |
| --- | --- |
| {% kbd %}↑{% /kbd %} / {% kbd %}↓{% /kbd %} | Step back and forward through the history; edit the command, then press {% kbd %}Enter{% /kbd %} |
| `!!` | The previous command again |
| `!N` | Command number *N* from `history` |
| `!-N` | The command *N* commands ago (`!-1` is the same as `!!`) |
| `!string` | The most recent command that starts with *string* |

Bash prints the expanded command before running it, so you can see exactly what ran:

```console
[student@workstation ~]$ !wc
wc -l /etc/passwd
20 /etc/passwd
[student@workstation ~]$ !1
date +%R
09:30
```

{% callout type="warning" title="Expand before you trust" %}
`!string` runs the most recent match without asking. `!rm` could run a different `rm` from the one you remember. Until you are sure, press {% kbd %}↑{% /kbd %} instead, look at the command, and then press {% kbd %}Enter{% /kbd %}.
{% /callout %}

### Reuse the last argument

{% kbd %}Alt{% /kbd %}+{% kbd %}.{% /kbd %} (or {% kbd %}Esc{% /kbd %} then {% kbd %}.{% /kbd %}) inserts the last word of the previous command at the cursor. Press it again to step back to the command before that. It is the fastest way to run several commands on the same file:

```console
[student@workstation ~]$ file /etc/redhat-release
/etc/redhat-release: symbolic link to rocky-release
[student@workstation ~]$ cat Alt+.
[student@workstation ~]$ cat /etc/redhat-release
Rocky Linux release 9.8 (Blue Onyx)
```

## Edit the command line

The arrow keys move the cursor one character at a time. These shortcuts move further, and work in nearly every Linux program that reads a line of text. Select one to see what it does to the line:

{% diagram ref="line-editing" /%}

| Shortcut | Does |
| --- | --- |
| {% kbd %}Ctrl{% /kbd %}+{% kbd %}A{% /kbd %} / {% kbd %}Ctrl{% /kbd %}+{% kbd %}E{% /kbd %} | Jump to the start / end of the line |
| {% kbd %}Ctrl{% /kbd %}+{% kbd %}←{% /kbd %} / {% kbd %}Ctrl{% /kbd %}+{% kbd %}→{% /kbd %} | Jump one word left / right |
| {% kbd %}Ctrl{% /kbd %}+{% kbd %}U{% /kbd %} | Delete from the cursor back to the start of the line |
| {% kbd %}Ctrl{% /kbd %}+{% kbd %}K{% /kbd %} | Delete from the cursor to the end of the line |
| {% kbd %}Ctrl{% /kbd %}+{% kbd %}R{% /kbd %} | Search the history: type part of a command, press {% kbd %}Ctrl{% /kbd %}+{% kbd %}R{% /kbd %} again for older matches, {% kbd %}Enter{% /kbd %} to run, {% kbd %}Esc{% /kbd %} to edit it first |
| {% kbd %}Ctrl{% /kbd %}+{% kbd %}C{% /kbd %} | Abandon the line (or stop a running command) |
| {% kbd %}Ctrl{% /kbd %}+{% kbd %}L{% /kbd %} | Clear the screen, keeping the line you are typing |

A typical combination: you ran `tail zcat` and want the last 20 lines instead. Press {% kbd %}↑{% /kbd %}, {% kbd %}Ctrl{% /kbd %}+{% kbd %}A{% /kbd %}, {% kbd %}Ctrl{% /kbd %}+{% kbd %}→{% /kbd %}, type ` -n 20`, and press {% kbd %}Enter{% /kbd %}. Six keystrokes and the option, instead of retyping the line.

## Try it

This practice terminal keeps a history and understands `!!`, `!N`, `!string`, {% kbd %}Alt{% /kbd %}+{% kbd %}.{% /kbd %}, {% kbd %}Ctrl{% /kbd %}+{% kbd %}R{% /kbd %} and the editing keys, exactly like Bash. The tasks practise them in order.

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch02.shortcuts"] ref="quick" /%}
