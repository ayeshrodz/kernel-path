---
title: "Linux files and directories cheat sheet"
seoTitle: "Linux files and directories Cheat Sheet (RHCSA)"
description: "Linux files and directories cheat sheet: the key commands and ideas on one page, with flashcards for revision. Free RHCSA study notes."
kind: summary
minutes: 6
---

{% lead %}
The chapter on one page: what to remember, the commands and patterns to have at your fingertips, and flashcards for quick revision.
{% /lead %}

## The chapter in eight sentences

- Linux keeps every file in **one tree** under `/`: configuration in `/etc`, users' files in `/home`, software in `/usr`, variable data in `/var`, runtime data in `/run`, and scratch space in `/tmp`.
- An **absolute path** starts at `/`; a **relative path** starts from the current directory, and `.`, `..` and `~` stand for this directory, its parent and your home.
- `pwd` shows where you are, `cd` moves you (`cd` alone goes home, `cd -` goes back), and `ls -la` lists everything, including **hidden** dot files.
- `mkdir -p` creates whole paths; `cp` (with `-r` for directories) copies, `mv` moves and renames, and both put files **inside** a destination that is an existing directory.
- `rm` (`-r` for directories, `-i` to confirm) removes for good: there is no wastebasket. `rmdir` removes only empty directories.
- A **hard link** is a second name for the same inode; a **symbolic link** is a small file that points to a name, can reach directories and other file systems, and dangles if its target goes.
- Bash expands **patterns** (`*`, `?`, `[…]`), **braces** (`{a,b}`, `{1..9}`), `~`, `$VARIABLES` and `$(commands)` before a command runs; `echo` shows the result.
- **Double quotes** keep spaces and patterns but still expand `$`; **single quotes** and backslashes stop expansion altogether.

## Cheat sheet

{% tabs %}
  {% tab label="Navigate" %}

| Command | Does |
| --- | --- |
| `pwd` | Print the current directory |
| `cd DIR`, `cd`, `cd -`, `cd ..` | Go to DIR / home / back / up one level |
| `ls -l`, `-a`, `-h`, `-R`, `-d`, `-t`, `-i` | Long, all, human sizes, recursive, the directory itself, newest first, inode numbers |
| `touch FILE` | Create an empty file, or update its time stamp |

  {% /tab %}
  {% tab label="Manage" %}

| Command | Does |
| --- | --- |
| `mkdir DIR…`, `mkdir -p A/B/C` | Create directories; with all missing parents |
| `cp SRC DST`, `cp -r DIR DST` | Copy files; directories need `-r` |
| `cp -p`, `-i`, `-v` | Keep times and permissions; ask before overwriting; report |
| `mv SRC DST` | Move, or rename |
| `rm FILE`, `rm -r DIR`, `rm -i` | Remove files; directories; ask first |
| `rmdir DIR` | Remove an empty directory |
| `ln FILE NAME` / `ln -s TARGET NAME` | Hard link / symbolic link |
| `ln -sfn TARGET NAME` | Repoint an existing symbolic link |
| `readlink -f NAME` | Where a link finally leads |

  {% /tab %}
  {% tab label="Expansions" %}

| Write | Expands to |
| --- | --- |
| `*` `?` `[abc]` `[!abc]` `[[:digit:]]` | Matching file names (a pattern that matches nothing stays as written) |
| `{a,b,c}` `{1..10}` `{01..10}` `{a..e}` | Generated words, files or not |
| `~`, `~user` | Home directories |
| `$VAR`, `${VAR}` | A variable's value |
| `$(command)` | A command's output |
| `"…"` / `'…'` / `\x` | Only `$` expands / nothing expands / take the next character literally |

  {% /tab %}
{% /tabs %}

## Flashcards

{% flashcards ref="flashcards" /%}
