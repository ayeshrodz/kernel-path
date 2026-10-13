---
title: "Bash scripts and scheduling cheat sheet"
seoTitle: "Bash scripts and scheduling Cheat Sheet (RHCSA)"
description: "Bash scripts and scheduling cheat sheet: the key commands and ideas on one page, with flashcards for revision. Free RHCSA study notes."
kind: summary
minutes: 5
---

{% lead %}
The chapter on one page: what to remember, the commands to have at your fingertips, and flashcards for quick revision.
{% /lead %}

## The chapter in eight sentences

- A script is a file of commands with a `#!/bin/bash` first line and the execute bit set; run it with `./script`, `bash script`, by name through `PATH`, or `source` it into the current shell.
- Inside a script, `$1`, `$2` … are arguments, `$#` their number, `"$@"` all of them (quote it!), `$0` the script's name and `$?` the last exit status.
- Variables are set `name=value` with no spaces and read `$name`; `$(command)` substitutes output, `$((…))` calculates, `${v:-default}` supplies a default.
- Exit status 0 means success; scripts should print errors to standard error (`>&2`) and use `exit 1` (error) or `exit 2` (usage).
- `[ … ]` tests files, numbers and strings; `if / elif / else`, `case`, `for` and `while` make decisions and repeat; `while IFS=: read` processes files line by line.
- cron schedules by five fields (minute hour day-of-month month day-of-week); personal jobs via `crontab -e`, system jobs in `/etc/cron.d` with a user column.
- cron jobs get a minimal environment: use full paths, redirect output, escape `%` as `\%`, and read `/var/log/cron`.
- A systemd timer is a `.timer` plus a `.service` (`Type=oneshot`) with `OnCalendar` and `Persistent=true`, enabled with `systemctl enable --now NAME.timer`; `at` runs a job once.

## Cheat sheet

{% tabs %}
  {% tab label="Scripting" %}

| Item | Detail |
| --- | --- |
| First line | `#!/bin/bash` |
| Make runnable | `chmod +x script.sh` · run `./script.sh` |
| Debug | `bash -x script.sh` |
| Arguments | `$1` `$2` · `$#` · `"$@"` · `$0` |
| Last status | `$?` · `exit 0` · `exit 2` |
| Default value | `${1:-default}` |
| Substitute / calculate | `$(cmd)` · `$((a + b))` |
| Errors to stderr | `echo "msg" >&2` |

  {% /tab %}
  {% tab label="Tests and control" %}

| Item | Detail |
| --- | --- |
| Files | `[ -f F ]` `-d` `-e` `-r` `-x` `-s` |
| Numbers | `[ "$n" -eq\|-ne\|-gt\|-lt\|-ge\|-le 3 ]` |
| Strings | `[ "$s" = x ]` `!=` `-z` `-n` |
| Combine | `!` · `&&` · `\|\|` |
| Branch | `if …; then …; elif …; else …; fi` |
| Choose | `case "$1" in a) …;; *) …;; esac` |
| Loop | `for x in LIST; do …; done` · `while […]; do …; done` |
| Read lines | `while IFS=: read -r a b c; do …; done < file` |

  {% /tab %}
  {% tab label="Scheduling" %}

| Item | Detail |
| --- | --- |
| crontab | `crontab -e` / `-l` / `-r` (`-u USER` as root) |
| System jobs | `/etc/cron.d/NAME`: `m h dom mon dow USER command` |
| Log | `/var/log/cron` |
| Traps | full paths · redirect output · `\%` |
| Timer pair | `NAME.service` (`Type=oneshot`) + `NAME.timer` (`OnCalendar`, `Persistent`) |
| Check | `systemd-analyze calendar EXPR` · `systemctl list-timers` |
| Once | `at TIME` · `atq` · `atrm N` |

  {% /tab %}
{% /tabs %}

## Flashcards

{% flashcards ref="flashcards" /%}
