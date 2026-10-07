---
title: "Linux processes cheat sheet"
seoTitle: "Linux processes Cheat Sheet (RHCSA)"
description: "Linux processes cheat sheet: the key commands and ideas on one page, with flashcards for revision. Free RHCSA study notes."
kind: summary
minutes: 5
---

{% lead %}
The chapter on one page: what to remember, the commands to have at your fingertips, and flashcards for quick revision.
{% /lead %}

## The chapter in eight sentences

- A **process** is a running program with a PID, a parent (PPID), an owner and a state; every process descends from systemd (PID 1).
- A shell runs a command by **forking** a child and **exec**ing the program in it.
- `ps aux`, `ps -ef`, `pstree`, `pgrep` and `top` show processes; `STAT` letters R, S, D, T and Z give their state.
- A **job** belongs to one shell: `&` starts it in the background, `Ctrl+Z` pauses, `bg` and `fg` move it, and `%N` refers to it.
- A closed terminal sends **SIGHUP**; `nohup` (or a service) keeps a job alive.
- `kill` sends signals, 15 (TERM) by default; escalate to 9 (KILL) only after the polite request fails.
- Preview with `pgrep` before using `pkill`; `pkill -u USER` ends everything a user runs.
- Judge load by dividing the **load average** by the CPU count; change priority with `nice` and `renice`, and apply a `tuned` profile for workload-wide tuning.

## Cheat sheet

{% tabs %}
  {% tab label="Look" %}

| Command | Does |
| --- | --- |
| `ps aux`, `ps -ef --forest` | All processes; with the tree |
| `ps -o pid,ppid,stat,ni,cmd -p PID` | Chosen columns for one process |
| `ps aux --sort=-%mem \| head` | Biggest memory users |
| `pstree -ps $$` | Ancestors of your shell |
| `pgrep -a NAME`, `pgrep -u USER` | Find by name or owner |
| `top`, `uptime`, `free -h`, `nproc` | Live view, load, memory, CPUs |

  {% /tab %}
  {% tab label="Jobs and signals" %}

| Command | Does |
| --- | --- |
| `cmd &`, `jobs`, `fg %N`, `bg %N` | Background, list, move |
| `Ctrl+Z`, `Ctrl+C` | Pause, interrupt |
| `nohup cmd &` | Survive a hangup |
| `kill PID`, `kill -9 PID` | Terminate, force |
| `kill -STOP PID`, `kill -CONT PID` | Pause, resume |
| `pkill NAME`, `pkill -u USER`, `killall NAME` | Many at once |
| `kill -l` | List signals (1 HUP · 2 INT · 9 KILL · 15 TERM · 18 CONT · 19 STOP) |

  {% /tab %}
  {% tab label="Priority and tuning" %}

| Command | Does |
| --- | --- |
| `nice -n 10 cmd` | Start with lower priority (-20 to 19) |
| `renice -n 5 -p PID` | Change a running process |
| `tuned-adm list`, `active`, `recommend` | Inspect profiles |
| `tuned-adm profile NAME` | Switch profile |

  {% /tab %}
{% /tabs %}

## Flashcards

{% flashcards ref="flashcards" /%}
