---
title: Summary and cheat sheet
kind: summary
minutes: 6
---

{% lead %}
The chapter on one page: what to remember, the operators, patterns and keys to have at your fingertips, and flashcards for quick revision.
{% /lead %}

## The chapter in eight sentences

- Every command has **stdin (0)**, **stdout (1)** and **stderr (2)**; output and errors both reach the terminal unless you redirect them.
- `>` replaces a file, `>>` appends, `2>` captures errors, `&>` captures both, and `/dev/null` throws anything away.
- A **pipe** `|` feeds one command's stdout into the next command's stdin; `tee` saves a copy on the way.
- `grep` prints matching lines; `-i`, `-v`, `-n`, `-c`, `-w`, `-r` and `-l` change what and how, and `-E` enables `+`, `?`, `{n,m}`, `|` and `( )`.
- In regular expressions, `^` and `$` anchor, `.` is any character, `*` repeats, and `[…]` is one character from a set.
- **vim** starts in normal mode: `i` to insert, `Esc` to stop, `:wq` to save and quit, `:q!` to give up, `u` to undo.
- Variables are set with `NAME=value` and read with `$NAME`; only **exported** variables reach the programs you start, and `PATH` decides where commands are found.
- Aliases and settings last for one shell unless you put them in `~/.bashrc` (aliases, prompt, history) or `~/.bash_profile` (exported variables); `/etc/profile.d` applies to everyone.

## Cheat sheet

{% tabs %}
  {% tab label="Redirection" %}

| Write | Means |
| --- | --- |
| `cmd > file`, `cmd >> file` | stdout to a file: replace, append |
| `cmd 2> file`, `cmd 2>> file` | stderr to a file |
| `cmd &> file` (`> file 2>&1`) | both to one file |
| `cmd 2> /dev/null` | discard errors |
| `cmd < file` | stdin from a file |
| `cmd1 \| cmd2` | stdout of cmd1 into stdin of cmd2 |
| `cmd \| tee file \| cmd2` | save a copy and pass it on (`-a` appends) |

  {% /tab %}
  {% tab label="grep" %}

| Write | Means |
| --- | --- |
| `grep -i`, `-v`, `-n`, `-c` | ignore case, invert, number lines, count |
| `grep -w`, `-r`, `-l`, `-E` | whole words, recurse, file names only, extended |
| `^`, `$`, `^$` | start, end, empty line |
| `.`, `.*`, `[abc]`, `[^abc]`, `[[:digit:]]` | any char, anything, set, not in set, class |
| `\<`, `\>` | start, end of a word |
| `-E`: `+` `?` `{n,m}` `a\|b` `( )` | one or more, optional, count, either, group |

  {% /tab %}
  {% tab label="vim" %}

| Keys | Do |
| --- | --- |
| `i` `a` `o`, `Esc` | insert before / after / new line, back to normal |
| `:w`, `:wq`, `:q!` | save, save and quit, quit discarding |
| `x`, `dd`, `yy`, `p` | delete char, cut line, copy line, paste |
| `u`, `Ctrl+R` | undo, redo |
| `gg`, `G`, `:N` | first line, last line, line N |
| `/text`, `n` | search, next match |
| `:%s/old/new/g` | replace everywhere |
| `v`, `V`, `Ctrl+V` | select characters, lines, block |

  {% /tab %}
  {% tab label="Environment" %}

| Write | Means |
| --- | --- |
| `NAME=value`, `$NAME`, `${NAME}` | set, read, read next to other text |
| `export NAME`, `export NAME=value` | make it an environment variable |
| `unset NAME`, `env`, `set` | remove, list environment, list all |
| `NAME=value cmd` | set it for one command |
| `export PATH=$PATH:/dir` | add a directory to the command search |
| `alias name='cmd'`, `unalias name` | create, remove an alias |
| `~/.bashrc`, `~/.bash_profile`, `/etc/profile.d/*.sh` | personal per shell, personal per login, everyone |
| `source ~/.bashrc` | apply to the current shell |

  {% /tab %}
{% /tabs %}

## Flashcards

{% flashcards ref="flashcards" /%}
