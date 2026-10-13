---
title: "Linux command line cheat sheet"
seoTitle: "Linux command line Cheat Sheet (RHCSA)"
description: "Linux command line cheat sheet: the key commands and ideas on one page, with flashcards for revision. Free RHCSA study notes."
kind: summary
minutes: 5
---

{% lead %}
The chapter on one page: what to remember, the commands and keys to have at your fingertips, and flashcards for quick revision.
{% /lead %}

## The chapter in eight sentences

- **Linux** is the kernel; a **distribution** such as RHEL packages it with thousands of tools into a complete, supported operating system. Rocky Linux rebuilds RHEL from the same source.
- The **shell** (Bash) reads your commands, runs programs and shows their output in a **terminal**.
- The **prompt** shows the user, the host and the current directory, and ends in `$` for an ordinary user or `#` for root.
- A command line is a **command**, then **options** (`-n 3`, `--all`), then **arguments** (what to work on).
- `ssh user@host` logs you in to another machine; the first connection asks you to confirm its **host key**, and a changed key is a warning. `exit` or {% kbd %}Ctrl{% /kbd %}+{% kbd %}D{% /kbd %} logs out.
- `file` tells you what a file really is; `cat`, `less`, `head` and `tail` show it in whole or in part, and `wc` counts it.
- {% kbd %}Tab{% /kbd %} completes commands, names and options; the **history** reruns commands with the arrows, `!!`, `!N` and `!string`, and {% kbd %}Alt{% /kbd %}+{% kbd %}.{% /kbd %} reuses the last argument.
- {% kbd %}Ctrl{% /kbd %}+{% kbd %}A{% /kbd %}/{% kbd %}E{% /kbd %}/{% kbd %}U{% /kbd %}/{% kbd %}K{% /kbd %}/{% kbd %}R{% /kbd %} move, delete and search on the command line, so you edit instead of retyping.

## Cheat sheet

{% tabs %}
  {% tab label="Commands" %}

| Command | Does |
| --- | --- |
| `whoami` / `hostname` | Who and where you are |
| `date`, `date +%R` | The date and time; `+FORMAT` picks the parts |
| `passwd` | Change your password |
| `file FILE` | What kind of file it really is |
| `cat FILE` | Print the whole file |
| `less FILE` | Page through a file: Space, b, /search, q |
| `head -n N FILE` / `tail -n N FILE` | First / last N lines (default 10) |
| `wc FILE`, `wc -l FILE` | Lines, words, bytes; `-l` lines only |
| `ssh user@host` | Log in to another machine |
| `ssh host command` | Run one command there and see its output here |
| `sudo -i` | Root shell (asks for your password) |
| `history` | Numbered list of earlier commands |
| `COMMAND --help` | Short usage summary |

  {% /tab %}
  {% tab label="Keys" %}

| Keys | Does |
| --- | --- |
| {% kbd %}Tab{% /kbd %}, {% kbd %}Tab{% /kbd %} {% kbd %}Tab{% /kbd %} | Complete; list the choices |
| {% kbd %}↑{% /kbd %} / {% kbd %}↓{% /kbd %} | Step through the history |
| `!!`, `!N`, `!-N`, `!string` | Rerun the last / number N / N ago / last starting with *string* |
| {% kbd %}Alt{% /kbd %}+{% kbd %}.{% /kbd %} | Insert the previous command's last word |
| {% kbd %}Ctrl{% /kbd %}+{% kbd %}A{% /kbd %} / {% kbd %}E{% /kbd %} | Start / end of the line |
| {% kbd %}Ctrl{% /kbd %}+{% kbd %}←{% /kbd %} / {% kbd %}→{% /kbd %} | One word left / right |
| {% kbd %}Ctrl{% /kbd %}+{% kbd %}U{% /kbd %} / {% kbd %}K{% /kbd %} | Delete to the start / end |
| {% kbd %}Ctrl{% /kbd %}+{% kbd %}R{% /kbd %} | Search the history backwards |
| {% kbd %}Ctrl{% /kbd %}+{% kbd %}C{% /kbd %} | Abandon the line, or stop a command |
| {% kbd %}Ctrl{% /kbd %}+{% kbd %}D{% /kbd %} | End of input: logs out of a shell |
| {% kbd %}Ctrl{% /kbd %}+{% kbd %}L{% /kbd %} | Clear the screen |

  {% /tab %}
  {% tab label="Syntax" %}

```text
command [options] [arguments]
cmd1 ; cmd2          two commands on one line
long command \       one command on several lines (the next line continues it)
  continued
date +%Y-%m-%d       an argument beginning with + is a format for date
```

  {% /tab %}
{% /tabs %}

## Flashcards

{% flashcards ref="flashcards" /%}
