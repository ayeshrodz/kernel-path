---
title: Variables, aliases and startup files
seoTitle: "Bash Variables, PATH, Aliases and .bashrc"
description: "Shell and environment variables, export, PATH, aliases and the Bash start-up files. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 20
---

{% lead %}
Your shell carries settings with it: where to look for commands, which language to speak, how the prompt looks, how long the history is. They are variables. This lesson shows how to read and set them, which ones programs can see, how to make shortcuts with aliases, and where to put it all so it is there every time you log in.
{% /lead %}

{% objectives %}
- Set, use and remove shell variables, and use braces to separate a variable from the text around it.
- Explain the difference between shell and environment variables, export a variable, and read PATH, LANG and other common ones.
- Create aliases, and make variables and aliases permanent in ~/.bashrc, ~/.bash_profile or /etc/profile.d.
{% /objectives %}

## Shell variables

A variable is a name holding a value. Set it with `NAME=value`, with **no spaces** around `=`, and use it with `$NAME`:

```console
[student@servera ~]$ COUNT=40
[student@servera ~]$ echo COUNT
COUNT
[student@servera ~]$ echo $COUNT
40
[student@servera ~]$ file1=/etc/hostname
[student@servera ~]$ ls -l $file1
-rw-r--r--. 1 root root 24 Oct  3 09:28 /etc/hostname
```

Names may contain letters, digits and underscores, but can't start with a digit. If letters follow a variable directly, Bash can't tell where the name ends; braces mark it:

```console
[student@servera ~]$ echo Repeat $COUNTx
Repeat
[student@servera ~]$ echo Repeat ${COUNT}x
Repeat 40x
```

`$COUNTx` is an unset variable, which expands to nothing without any error. A value with spaces needs quotes: `GREETING="good morning"`. `unset NAME` removes a variable.

## Variables that set up the shell

Bash sets many variables itself, and reads some to decide how to behave:

| Variable | Holds |
| --- | --- |
| `HOME`, `USER`, `SHELL` | Your home directory, user name and login shell |
| `PATH` | The directories searched for commands, in order |
| `PS1` | The prompt; `\u`, `\h`, `\W` stand for user, host and directory |
| `HISTSIZE`, `HISTCONTROL`, `HISTTIMEFORMAT` | History length, duplicate handling, time stamps |
| `LANG`, `LC_*` | Language, character set and formats for dates and numbers |
| `EDITOR` | The editor programs open for you (crontab, sudoedit, git) |

Setting `HISTTIMEFORMAT` makes `history` show when each command ran:

```console
[student@servera ~]$ HISTTIMEFORMAT="%F %T "
[student@servera ~]$ history 2
   11  2026-10-03 10:21:06 unset MSG
   12  2026-10-03 10:21:06 HISTTIMEFORMAT="%F %T "
```

## Environment variables: what programs inherit

A shell variable belongs to the shell. When the shell starts a program, it passes along only the variables marked for **export**, called environment variables. Select a view:

{% diagram ref="export" /%}

```console
[student@servera ~]$ MSG=hello
[student@servera ~]$ bash -c 'echo child sees: $MSG'
child sees:
[student@servera ~]$ export MSG
[student@servera ~]$ bash -c 'echo child sees: $MSG'
child sees: hello
```

`bash -c` starts a separate program, a child shell, so it is a fair test. `export NAME=value` sets and exports in one step. `env` lists the environment; `set` lists every shell variable too.

### PATH

When you type a command name without a `/`, the shell searches the directories in `PATH` from left to right and runs the first match:

```console
[student@servera ~]$ echo $PATH
/home/student/.local/bin:/home/student/bin:/usr/local/bin:/usr/bin:/usr/local/sbin:/usr/sbin
```

RHEL already puts `~/.local/bin` and `~/bin` first, so a script you save in `~/bin` and make executable runs by name:

```console
[student@servera ~]$ hello
hello from servera.lab.example.com
[student@servera ~]$ type hello
hello is /home/student/bin/hello
```

To add a directory for the current session, append it: `export PATH=$PATH:/opt/tools/bin`. Never replace `PATH` without including `$PATH`: every command outside the new directory would stop being found.

{% callout type="note" title="Why ./script.sh" %}
The current directory is not in `PATH`, deliberately: otherwise a file called `ls` in a shared directory could run instead of the real `ls`. To run a program in the current directory, say where it is: `./script.sh`.
{% /callout %}

### LANG and the locale

`LANG` and the `LC_` variables choose the language and the formats programs use for dates, numbers and sorting:

```console
[student@servera ~]$ date
Sat Oct  3 10:21:06 AM UTC 2026
[student@servera ~]$ LC_TIME=en_GB.UTF-8 date
Sat  3 Oct 10:21:06 UTC 2026
[student@servera ~]$ LANG=C date
Sat Oct  3 10:21:06 UTC 2026
```

Putting a variable assignment in front of a command, as here, sets it for that one command only. `LANG=C` is a common trick to get plain, untranslated output from a command, for example in a script that parses it.

## Aliases

An alias is a short name for a longer command. RHEL defines a few already; `alias` lists them:

```console
[student@servera ~]$ alias
alias egrep='egrep --color=auto'
...output omitted...
alias l.='ls -d .*'
alias ll='ls -l'
...output omitted...
[student@servera ~]$ alias lsl='ls -l --human-readable'
[student@servera ~]$ type lsl
lsl is aliased to `ls -l --human-readable'
```

`unalias lsl` removes it. A backslash in front of a name, as in `\ls`, skips any alias for that one run.

## Make it permanent

Everything above lasts only until you log out. To keep a setting, put the same command in one of Bash's startup files. Which files run depends on how the shell started:

{% diagram ref="startup" /%}

| File | Runs for | Put here |
| --- | --- | --- |
| `~/.bash_profile` | Your login shells | Environment variables you export, such as `EDITOR` |
| `~/.bashrc` | Every interactive shell (`~/.bash_profile` runs it too) | Aliases, prompt, history settings |
| `~/.bashrc.d/*` | Every interactive shell, via `~/.bashrc` | The same, one file per topic |
| `/etc/profile.d/*.sh` | Every user's login shell | Settings for **all** users (as root) |

RHEL's default `~/.bash_profile` simply runs `~/.bashrc`, so in practice almost everything personal can go in `~/.bashrc`. A changed file affects new shells; apply it to the current one with `source ~/.bashrc`.

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch05.environment"] ref="quick" /%}
