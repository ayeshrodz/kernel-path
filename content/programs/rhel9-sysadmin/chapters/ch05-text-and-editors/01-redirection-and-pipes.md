---
title: Redirection and pipes
kind: lesson
minutes: 20
---

{% lead %}
Every command reads from one stream and writes to two: its output, and its error messages. By default all three are connected to your terminal. Redirection reconnects them to files, and a pipe connects one command's output to the next command's input, which is how small commands combine into powerful ones.
{% /lead %}

{% objectives %}
- Name the three standard streams and their numbers.
- Save output or errors to a file with `>`, `>>`, `2>` and `&>`, or throw them away with `/dev/null`.
- Connect commands with `|`, and save a copy of a pipeline's data with `tee`.
{% /objectives %}

## Three streams

| Number | Name | Default | Used for |
| --- | --- | --- | --- |
| 0 | **standard input** (stdin) | the keyboard | data the command reads |
| 1 | **standard output** (stdout) | the terminal | the command's normal output |
| 2 | **standard error** (stderr) | the terminal | error and warning messages |

Output and errors both appear on your screen, so they look the same. They aren't: here `ls` prints one line to each stream.

```console
[student@servera ~]$ ls /etc/hostname /etc/nothere
ls: cannot access '/etc/nothere': No such file or directory
/etc/hostname
```

Select an operator to see where each stream goes:

{% diagram ref="streams" /%}

## Send output to a file

| Operator | Effect |
| --- | --- |
| `> file` | stdout to *file*, replacing what was in it |
| `>> file` | stdout to *file*, added to the end |
| `2> file` | stderr to *file* |
| `2>> file` | stderr to *file*, added to the end |
| `&> file` | stdout **and** stderr to the same *file* |
| `> file 2>&1` | the same, the older way to write it |
| `< file` | stdin from *file* |

Redirect the output and only the error is left on the screen; redirect the error and only the output is:

```console
[student@servera ~]$ ls /etc/hostname /etc/nothere > out.txt
ls: cannot access '/etc/nothere': No such file or directory
[student@servera ~]$ cat out.txt
/etc/hostname
[student@servera ~]$ ls /etc/hostname /etc/nothere 2> err.txt
/etc/hostname
[student@servera ~]$ cat err.txt
ls: cannot access '/etc/nothere': No such file or directory
```

`>>` keeps what is already there, so it is the one for logs:

```console
[student@servera ~]$ date >> log.txt
[student@servera ~]$ date >> log.txt
[student@servera ~]$ cat log.txt
Sat Oct  3 10:17:40 AM UTC 2026
Sat Oct  3 10:17:40 AM UTC 2026
```

{% callout type="warning" title="> empties the file first" %}
`>` truncates the file **before** the command runs. `sort data.txt > data.txt` therefore sorts an empty file and loses your data. Write to a new file, then move it into place. To make `>` refuse to overwrite existing files in your shell, run `set -o noclobber`.
{% /callout %}

## Throw output away: /dev/null

`/dev/null` is a special file that discards everything written to it. Its classic use is hiding expected error messages. As an ordinary user, searching `/etc` produces a screenful of *Permission denied* lines mixed in with the results:

```console
[student@servera ~]$ find /etc -name "*.repo"
find: ‘/etc/firewalld’: Permission denied
find: ‘/etc/sudoers.d’: Permission denied
...output omitted...
/etc/yum.repos.d/rocky-devel.repo
/etc/yum.repos.d/rocky.repo
...output omitted...
[student@servera ~]$ find /etc -name "*.repo" 2> /dev/null
/etc/yum.repos.d/rocky-devel.repo
/etc/yum.repos.d/rocky.repo
/etc/yum.repos.d/rocky-addons.repo
/etc/yum.repos.d/rocky-extras.repo
/etc/yum.repos.d/rocky-security.repo
```

Chapter 17 covers `find` itself. Only discard errors you understand: a message you throw away can be the one that explains a problem.

### Order matters with 2>&1

`2>&1` means "send stderr wherever stdout goes **right now**". Redirections are applied left to right, so these two differ:

```console
[student@servera ~]$ find /etc -name "*.repo" > repos.txt 2>&1
[student@servera ~]$ wc -l repos.txt
18 repos.txt
[student@servera ~]$ find /etc -name "*.repo" 2>&1 > repos.txt | head -2
find: ‘/etc/firewalld’: Permission denied
find: ‘/etc/sudoers.d’: Permission denied
```

In the first, stdout goes to the file, then stderr follows it there: 13 errors and 5 results. In the second, stderr is pointed at where stdout went *before* stdout moved to the file, so the errors still flow down the pipe. `&>` avoids the puzzle when you want both in one file.

## Pipes

A pipe, `|`, connects the stdout of the command on its left to the stdin of the command on its right. Each command does one small job, and together they answer questions no single command can:

```console
[student@servera ~]$ ls /etc | wc -l
172
[student@servera ~]$ ls -t /var/log | head -3
messages
secure
lastlog
[student@servera ~]$ ls -l /usr/bin | sort -k5 -n | tail -3
-rwxr-xr-x. 1 root root 1452256 Sep 10 15:05 vi
-rwxr-xr-x. 1 root root 1651920 Apr  3  2026 cyrusbdb2current
-rwxr-xr-x. 1 root root 4028400 Sep 10 15:05 vim
```

- How many entries in `/etc`? List them, count the lines.
- Which logs changed most recently? Sort by time, keep the top three.
- Which programs in `/usr/bin` are biggest? Sort the long listing numerically (`-n`) on its fifth column (`-k5`), the size, and keep the last three.

Only stdout travels through a pipe; errors still go to the terminal unless you redirect them too. Any command that reads stdin can sit on the right: `less`, `wc`, `sort`, `head`, `tail`, and above all `grep`, the subject of the next lesson.

## tee: save a copy on the way

`tee` copies its input to a file **and** passes it on, like a T-junction in a pipe. Use it to keep a record while still seeing the output, or to save an intermediate stage of a pipeline:

```console
[student@servera ~]$ ls /etc | tee etc-list.txt | wc -l
172
[student@servera ~]$ head -n 2 etc-list.txt
adjtime
aliases
[student@servera ~]$ echo "hostname: $(hostname)" | tee -a info.txt
hostname: servera.lab.example.com
```

`tee -a` appends instead of replacing.

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch05.redirect"] ref="quick" /%}
