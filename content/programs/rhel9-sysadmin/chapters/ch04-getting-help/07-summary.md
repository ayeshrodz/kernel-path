---
title: Summary and cheat sheet
kind: summary
minutes: 4
---

{% lead %}
The chapter on one page: what to remember, the commands to have at your fingertips, and flashcards for quick revision.
{% /lead %}

## The chapter in six sentences

- `man NAME` opens a **manual page** in `less`: search with `/`, move with Space and `b`, quit with `q`.
- The manual has numbered **sections**: 1 for user commands, 5 for file formats, 8 for administration commands. `man 5 passwd` picks the section; `whatis` lists which exist.
- A **SYNOPSIS** shows what to type: square brackets are optional, `...` may repeat, capitals are placeholders, and `{a|b}` means choose one.
- `man -k WORDS` (`apropos`) finds pages by keyword in their names and descriptions; `man -K` searches full text; `mandb` maintains the index.
- `COMMAND --help` gives a quick option summary; `type` tells built-ins, aliases and programs apart, and `help` documents built-ins.
- Packages leave READMEs and examples in `/usr/share/doc`, and the full RHEL documentation is online at docs.redhat.com.

## Cheat sheet

| Command | Does |
| --- | --- |
| `man NAME`, `man N NAME` | Open a manual page; from section N |
| `whatis NAME` (`man -f`) | One-line descriptions of every page called NAME |
| `man -k WORDS` (`apropos`) | Search names and descriptions |
| `man -k -s 8 WORDS` | Only section 8 |
| `man -K WORD` | Search the full text of every page (slow) |
| `man -w NAME` | Where the page's file is |
| `mandb` | Rebuild the keyword index (as root) |
| `COMMAND --help` | Quick option summary |
| `type NAME`, `type -a NAME` | Built-in, alias or program; every match |
| `help BUILTIN` | Help for a shell built-in |
| `ls /usr/share/doc/PACKAGE` | Package documentation |

| In a manual page | Does |
| --- | --- |
| Space / `b`, `d` / `u` | Page down / up, half page down / up |
| `/text`, `n`, `N` | Search, next match, previous match |
| `g` / `G` | Start / end |
| `q` | Quit |

## Flashcards

{% flashcards ref="flashcards" /%}
