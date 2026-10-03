---
title: Edit files with vim
kind: lesson
minutes: 20
---

{% lead %}
Linux keeps its configuration in text files, so an administrator edits text all day. vim is the editor you can count on finding on every server, even a minimal one with no desktop. It feels strange for the first hour because keys mean different things in different modes; once that clicks, it is fast.
{% /lead %}

{% objectives %}
- Explain vim's modes and move between them.
- Open, edit, save and quit a file, and get out safely when something goes wrong.
- Move, delete, copy, paste, undo and search with the essential keys, and configure vim with ~/.vimrc.
{% /objectives %}

## vi and vim

`vi` is the classic Unix editor; `vim` ("vi improved") is the version RHEL ships, in two packages. `vim-minimal` provides `vi`, a small build with the core editing features, installed even on minimal servers. `vim-enhanced` provides the full `vim`, with syntax colouring, built-in help and the `vimtutor` tutorial. Your lab has both, so type `vim`; everything in this lesson also works in `vi`.

```console
[student@servera ~]$ vim notes.txt
```

If the file exists, vim opens it; if not, vim creates it when you save. On a server where vim isn't available, `vi` always is. For quick edits, `nano` (which you used in chapter 4) is also installed in the lab, but it is often missing from minimal servers, so learn vim.

## Modes

In most editors, every key types a character. In vim, what a key does depends on the **mode**. Select a mode:

{% diagram ref="modes" /%}

vim starts in **normal mode**, where keys are commands: `x` deletes a character, `dd` deletes a line, `u` undoes. To type text, press `i` to enter **insert mode**, type, and press {% kbd %}Esc{% /kbd %} to return to normal mode. `:` starts a **command line** at the bottom of the screen for commands such as saving and quitting.

{% callout type="tip" title="Lost? Press Esc" %}
If you are unsure which mode you are in, press {% kbd %}Esc{% /kbd %} once or twice. You are then in normal mode, and pressing Esc again there does no harm. In insert mode, vim shows `-- INSERT --` at the bottom left.
{% /callout %}

## The minimum you need

With only these, you can edit any file:

| Keys (normal mode) | Does |
| --- | --- |
| `i` | Start inserting before the cursor |
| {% kbd %}Esc{% /kbd %} | Back to normal mode |
| arrow keys | Move |
| `x` | Delete the character under the cursor |
| `u` | Undo; {% kbd %}Ctrl{% /kbd %}+{% kbd %}R{% /kbd %} redoes |
| `:w` | Write (save) |
| `:wq` | Write and quit (`:x` and `ZZ` do the same) |
| `:q!` | Quit, **discarding** every change since the last save |

`:q` alone refuses to quit if there are unsaved changes, which protects you. `:q!` is the escape hatch: when an edit goes wrong, quit without saving and start again.

## Work faster

Once the basics feel natural, these save a lot of time:

| Keys | Does |
| --- | --- |
| `h` `j` `k` `l` | Left, down, up, right without leaving the home row |
| `w` / `b` | Next / previous word |
| `0` / `$` | Start / end of the line |
| `gg` / `G` / `:42` | First line / last line / line 42 |
| `a` / `A` | Insert after the cursor / at the end of the line |
| `o` / `O` | Open a new line below / above, in insert mode |
| `dd` / `5dd` | Delete (cut) a line / five lines |
| `yy` / `p` / `P` | Yank (copy) a line / put (paste) below / above |
| `/text`, `n`, `N` | Search forward, next match, previous match |
| `:%s/old/new/g` | Replace every *old* with *new* in the file |
| `v`, `V`, {% kbd %}Ctrl{% /kbd %}+{% kbd %}V{% /kbd %} | Select characters / whole lines / a column block; then `y` to copy, `d` to cut |

Many commands take a count: `3x` deletes three characters, `2yy` copies two lines.

## Configure vim

Settings for every user go in `/etc/vimrc`; your own go in `~/.vimrc`, which overrides them. Chapter 1 created yours:

```console
[student@workstation ~]$ cat ~/.vimrc
set number
set autoindent
set tabstop=4
set shiftwidth=4
set expandtab
set hlsearch
```

Line numbers, automatic indentation, tabs typed as four spaces, and search matches highlighted. You can also try a setting in a running vim by typing it after a colon, for example `:set nonumber`.

## Learn by doing: vimtutor

`vimtutor` opens a copy of a tutorial in vim, which teaches vim by having you edit the tutorial itself. Lesson 1 takes about ten minutes and covers everything above; the next exercise uses it.

## Check your understanding

{% quiz id="quick" objectives=["ch05.vim"] ref="quick" /%}
