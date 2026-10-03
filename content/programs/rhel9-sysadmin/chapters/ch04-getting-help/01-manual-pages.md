---
title: Read manual pages
kind: lesson
minutes: 15
---

{% lead %}
Nobody remembers every option of every command. Experienced administrators look things up constantly, and the first place they look is the system itself. Every package installs manual pages, man pages for short, that describe its commands and files, written for exactly the version installed.
{% /lead %}

{% objectives %}
- Open a manual page, and pick the right section when a name means two things.
- Move around a page and search inside it.
- Read a SYNOPSIS line: what to type literally, what to replace, what is optional and what may repeat.
{% /objectives %}

## Open a manual page

`man` followed by a name opens its manual page:

```console
[student@workstation ~]$ man ls
```

```text
LS(1)                            User Commands                           LS(1)

NAME
       ls - list directory contents

SYNOPSIS
       ls [OPTION]... [FILE]...

DESCRIPTION
       List  information  about  the FILEs (the current directory by default).
       Sort entries alphabetically if none of -cftuvSUX nor --sort  is  speci‐
       fied.
...
```

The page opens in `less`, so the keys you learnt in chapter 2 work here:

| Key | Does |
| --- | --- |
| {% kbd %}Space{% /kbd %} / {% kbd %}b{% /kbd %} | Next / previous screen |
| {% kbd %}d{% /kbd %} / {% kbd %}u{% /kbd %} | Down / up half a screen |
| {% kbd %}↓{% /kbd %} / {% kbd %}↑{% /kbd %} | One line |
| {% kbd %}/{% /kbd %}`text` {% kbd %}Enter{% /kbd %} | Search forward; {% kbd %}n{% /kbd %} next match, {% kbd %}N{% /kbd %} previous |
| {% kbd %}g{% /kbd %} / {% kbd %}G{% /kbd %} | Start / end of the page |
| {% kbd %}q{% /kbd %} | Quit |

{% callout type="tip" title="Search for the option itself" %}
To find what an option does, search for it with the spaces around it: `/ -S ` (slash, space, minus, S, space). Searching for `-S` alone also stops at every word that contains it. The search is a regular expression, so characters such as `.`, `*` and `$` have special meanings; chapter 5 explains them.
{% /callout %}

## The parts of a page

Pages follow the same layout, though few use every heading:

| Heading | What you find there |
| --- | --- |
| **NAME** | The name and a one-line description |
| **SYNOPSIS** | How to call it: the command line's shape |
| **DESCRIPTION** | What it does, and usually the options |
| **OPTIONS** | The options, when not in DESCRIPTION |
| **EXAMPLES** | Worked examples: often the fastest way to the answer |
| **FILES** | Files it reads or writes, such as configuration files |
| **SEE ALSO** | Related pages, with their section numbers |

## Sections: one name, several pages

The manual is divided into numbered **sections**. The ones an administrator uses most are 1, 5 and 8:

| Section | Holds | Example |
| --- | --- | --- |
| **1** | Commands any user runs | `ls(1)`, `passwd(1)` |
| 2 | System calls (for programmers) | `open(2)` |
| 3 | Library functions (for programmers) | `printf(3)` |
| 4 | Special files, mostly devices | `null(4)` |
| **5** | File formats and configuration files | `passwd(5)`, `fstab(5)` |
| 7 | Overviews, conventions, standards | `regex(7)`, `hier(7)` |
| **8** | Administration commands, usually for root | `useradd(8)`, `mount(8)` |

That is why pages are written as `passwd(5)`: the name plus the section. `passwd(1)` is the command that changes passwords; `passwd(5)` describes the `/etc/passwd` file. `man passwd` opens the first match, section 1. Put the section number first to choose:

```console
[student@workstation ~]$ man 5 passwd
```

```text
passwd(5)                     File Formats Manual                    passwd(5)

NAME
       passwd - password file

DESCRIPTION
       The  /etc/passwd file is a text file that describes user login accounts
...
       Each line of the file describes  a  single  user,  and  contains  seven
       colon-separated fields:

           name:password:UID:GID:GECOS:directory:shell
```

`whatis` lists every page with a name, one line each, so you can see which sections exist:

```console
[student@workstation ~]$ whatis passwd
passwd (5)           - password file
passwd (1ossl)       - OpenSSL application commands
passwd (1)           - update user's authentication tokens
```

`1ossl` is a sub-section that OpenSSL uses for its own commands.

## Read a SYNOPSIS line

The SYNOPSIS uses a small set of conventions to say what you may type. Select each part of these two real examples:

{% diagram ref="synopsis" /%}

| Notation | Means |
| --- | --- |
| **bold** or plain word | Type it exactly as shown |
| *underlined* or CAPITALS | Replace with your own value: a file name, a user name |
| `[ ]` | Optional |
| `...` | May be repeated |
| `{a\|b}` or `a\|b` | Choose exactly one |

Some commands have several SYNOPSIS lines: each is a different way to call them. `cp` can copy one file to a new name, or several files into a directory:

```text
SYNOPSIS
       cp [OPTION]... [-T] SOURCE DEST
       cp [OPTION]... SOURCE... DIRECTORY
       cp [OPTION]... -t DIRECTORY SOURCE...
```

## Check your understanding

{% quiz id="quick" objectives=["ch04.man"] ref="quick" /%}
