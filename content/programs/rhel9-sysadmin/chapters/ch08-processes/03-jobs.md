---
title: Jobs and the background
seoTitle: "Linux Background Jobs: bg, fg, jobs and nohup"
description: "Run commands in the background, move jobs between foreground and background, and survive logouts. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 15
---

{% lead %}
A terminal can run one thing at a time in the foreground, and the prompt only comes back when it finishes. **Job control** lets you start commands in the background, pause them, and bring them back, all from one terminal.
{% /lead %}

{% objectives %}
- Start commands in the background, and pause, resume and stop them from the shell.
- Use `jobs`, `fg`, `bg` and `%N` job numbers, and explain how they differ from PIDs.
- Keep a command running after you log out with `nohup`.
{% /objectives %}

## Foreground and background

A **job** is a process (or pipeline) started from your shell. The **foreground** job owns the terminal: it receives your keystrokes, and the prompt waits. A **background** job runs without the terminal, and the prompt is free for the next command.

Add `&` to start a command in the background. The shell prints its **job number** in brackets, then its PID:

```console
[student@servera ~]$ sleep 500 &
[1] 762
[student@servera ~]$ sleep 501 &
[2] 763
[student@servera ~]$ jobs
[1]-  Running                 sleep 500 &
[2]+  Running                 sleep 501 &
```

The `+` marks the "current" job (the default for `fg` and `bg`), and `-` the previous one. `jobs -l` adds the PIDs. Job numbers belong to *your shell*: another terminal has its own list. They are not PIDs. Refer to a job with a percent sign: `%1`, `%2`, or `%%` for the current one.

## Moving jobs around

Step through the life of a job:

{% diagram ref="job-states" /%}

The keys and commands that drive it:

| Do this | To |
| --- | --- |
| `Ctrl+C` | Interrupt (stop for good) the foreground job |
| `Ctrl+Z` | Pause (stop) the foreground job |
| `bg %N` | Continue a stopped job in the background |
| `fg %N` | Bring a job to the foreground |
| `kill %N` | Terminate a job |

```console
[student@servera ~]$ fg %1
sleep 500
^Z
[1]+  Stopped                 sleep 500
[student@servera ~]$ bg %1
[1]+ sleep 500 &
[student@servera ~]$ kill %2
[2]+  Terminated              sleep 501
```

A background job still writes to the terminal if it prints anything, which can interleave with what you are typing. Redirect its output (`cmd > out.txt 2>&1 &`) when it is chatty.

## Surviving a logout

When a terminal window closes or a connection drops, the shell receives **SIGHUP** ("hangup") and passes it on to its jobs, and most programs end. (Simply typing `exit` does not do this: the shell leaves its background jobs running.) Two ways to protect a job:

- **`nohup`** starts a command immune to hangups and sends its output to `nohup.out`:

```console
[student@servera ~]$ nohup sleep 700 &
[3] 766
nohup: ignoring input and appending output to 'nohup.out'
```

- A **terminal multiplexer** such as `tmux` keeps a whole session alive and lets you return to it later. It is the better choice for long interactive work, and is installed in the lab. For anything that should always run, make it a service (chapter 9) rather than a job.

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch08.jobs"] ref="quick" /%}
