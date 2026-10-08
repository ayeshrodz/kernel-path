---
title: Find the right command
seoTitle: "man -k, apropos, --help and info Explained"
description: "Find the right command with man -k and apropos, --help, info and package documentation. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 15
---

{% lead %}
Manual pages are perfect once you know the command's name. When you don't, search for it by keyword. This lesson also covers the quick help built into commands, help for the shell's own commands, and the longer documentation packages leave in /usr/share/doc.
{% /lead %}

{% objectives %}
- Search manual pages by keyword with `man -k` (`apropos`), narrow the search by section, and know what keeps the index up to date.
- Get quick help with `--help`, and help for shell built-ins with `help`, after checking with `type` which kind a command is.
- Find package documentation in `/usr/share/doc`, and know where the full RHEL documentation lives.
{% /objectives %}

## Where to look

{% diagram ref="where-to-look" /%}

## Search by keyword

`man -k WORD` (also available as `apropos WORD`) searches the **names and one-line descriptions** of every manual page:

```console
[student@workstation ~]$ man -k passwd
chgpasswd (8)        - update group passwords in batch mode
chpasswd (8)         - update passwords in batch mode
...output omitted...
gpasswd (1)          - administer /etc/group and /etc/gshadow
...output omitted...
passwd (1)           - update user's authentication tokens
passwd (1ossl)       - OpenSSL application commands
passwd (5)           - password file
...output omitted...
```

Search for the idea in plain words, and try synonyms if the first attempt finds nothing. Descriptions use the author's words, not yours:

```console
[student@workstation ~]$ man -k "disk usage"
disk usage: nothing appropriate.
[student@workstation ~]$ man -k "disk space"
df (1)               - report file system disk space usage
```

- `man -k -s 8 user` limits the search to section 8, administration commands.
- `man -K WORD` (capital K) searches the **full text** of every page. It is much slower, and offers each matching page in turn: {% kbd %}Enter{% /kbd %} to view, {% kbd %}Ctrl{% /kbd %}+{% kbd %}D{% /kbd %} to skip, {% kbd %}Ctrl{% /kbd %}+{% kbd %}C{% /kbd %} to stop.

Keyword searches use an index that the `mandb` command builds. RHEL updates it automatically whenever a package with manual pages is installed. If a search misses a page you know exists, root can rebuild it with `mandb`.

## Quick help: --help

Most commands print a summary of their options when given `--help`. It is shorter than the manual page, and often enough:

```console
[student@workstation ~]$ date --help
Usage: date [OPTION]... [+FORMAT]
  or:  date [-u|--utc|--universal] [MMDDhhmm[[CC]YY][.ss]]
Display the current time in the given FORMAT, or set the system date.
...output omitted...
```

## Shell built-ins: type and help

Some commands aren't programs on disk but part of Bash itself: `cd`, `history`, `echo`, `type` and others. They have no manual page of their own; `man cd` opens a long page that lists all of Bash's built-ins. `type` tells you which kind a command is, and `help` explains a built-in:

```console
[student@workstation ~]$ type cd ls history
cd is a shell builtin
ls is /usr/bin/ls
history is a shell builtin
[student@workstation ~]$ help cd
cd: cd [-L|[-P [-e]] [-@]] [dir]
    Change the shell working directory.

    Change the current directory to DIR.  The default DIR is the value of the
    HOME shell variable.
...output omitted...
```

`type` also reveals **aliases**, short names your shell defines for longer commands. In an interactive shell on RHEL, `type ll` shows that `ll` is an alias for `ls -l`.

## Documentation in /usr/share/doc

Many packages install more than manual pages: READMEs, guides, examples and change logs, in a directory under `/usr/share/doc` named after the package:

```console
[student@workstation ~]$ ls /usr/share/doc/bash
bash.html  bashref.html  FAQ  INTRO  RBASH  README
```

Look here for example configuration files and explanations of a program's design.

## The full RHEL documentation

For complete, task-based guides, Red Hat publishes the RHEL documentation online at [docs.redhat.com](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9): configuring networking, managing storage, using SELinux and much more, for each RHEL version. Everything in it applies to your Rocky practice lab too. Each chapter of this path links to the relevant guide in its summary.

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch04.search"] ref="quick" /%}
