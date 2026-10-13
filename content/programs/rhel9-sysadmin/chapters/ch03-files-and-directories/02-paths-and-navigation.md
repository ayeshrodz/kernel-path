---
title: Paths and finding your way
seoTitle: "Absolute and Relative Paths: cd, pwd, ls"
description: "Move around Linux with cd, pwd and ls using absolute and relative paths and hidden files. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 15
---

{% lead %}
Every file has an address, its path. You can give the whole address from the root, or directions from where you stand now. This lesson shows both, how to move around the tree with `cd`, and how to read what `ls` tells you about each file.
{% /lead %}

{% objectives %}
- Write absolute and relative paths, and use `.`, `..` and `~` in them.
- Move around with `cd` and check where you are with `pwd`.
- List directories with `ls` and its common options, read a long listing, and spot hidden files.
{% /objectives %}

## Absolute and relative paths

A path names a file by listing the directories on the way to it, separated by `/`.

- An **absolute path** starts with `/`, so it starts at the root and works from anywhere: `/var/log/messages`.
- A **relative path** does not start with `/`. It starts from your **current working directory**, wherever your shell is now. From `/var`, the same file is `log/messages`; from `/var/log`, it is just `messages`.

Three short names help in relative paths:

| Name | Means | Example from `/home/student` |
| --- | --- | --- |
| `.` | This directory | `./notes.txt` is `/home/student/notes.txt` |
| `..` | The directory above this one (the *parent*) | `..` is `/home`; `../..` is `/` |
| `~` | Your home directory | `~/notes.txt`; `~root` is root's home, `/root` |

Every directory contains `.` and `..`, which is why they work everywhere.

## Move around

`pwd` (print working directory) shows where you are, as an absolute path. `cd` (change directory) moves you. Step through a short walk around servera:

{% diagram ref="navigation" /%}

```console
[student@servera ~]$ pwd
/home/student
[student@servera ~]$ cd /var/log
[student@servera log]$ cd ..
[student@servera var]$ cd log
[student@servera log]$ cd
[student@servera ~]$ cd -
/var/log
[student@servera log]$
```

- `cd` on its own, or `cd ~`, takes you home from anywhere.
- `cd -` jumps back to the directory you were in before, and prints it. Pressed repeatedly, it flips between two directories, which is handy when you work in two places at once.
- The prompt shows only the last part of your current directory (`log`, `var`), or `~` at home.

{% callout type="tip" title="Absolute or relative?" %}
Use whichever is shorter from where you are. In scripts and instructions you write for others, prefer absolute paths: they mean the same thing whoever runs them, and wherever.
{% /callout %}

## List a directory

`ls` lists the directory you name, or the current one if you name none:

```console
[student@servera ~]$ ls /var/log
btmp                   cron              firewalld   messages  spooler
chrony                 dnf.librepo.log   hawkey.log  private   wtmp
cloud-init.log         dnf.log           lastlog     README
cloud-init-output.log  dnf.rpm.log       maillog     secure
```

| Option | Shows |
| --- | --- |
| `-l` | A long listing: one file per line, with its details |
| `-a` | All files, including hidden ones |
| `-h` | Sizes as K, M, G with `-l` |
| `-R` | Everything below, directory by directory |
| `-d` | The directory itself, not its contents (`ls -ld /etc`) |
| `-t` / `-r` | Newest first / reverse the order |

Options combine: `ls -la`, `ls -lhR`.

### Read a long listing

`ls -l` packs a lot into each line. Select a part to see what it means:

{% diagram ref="long-listing" /%}

The very first character tells you what kind of file each line is: `-` a regular file, `d` a directory, `l` a symbolic link. Chapter 7 is all about the permissions after it.

### Hidden files

A name that starts with a dot is **hidden**: `ls` skips it unless you add `-a`. Programs keep their per-user settings in hidden files so they don't clutter your home directory:

```console
[student@servera ~]$ ls -la
total 28
drwx------. 3 student student 4096 Oct  3 09:31 .
drwxr-xr-x. 3 root    root    4096 Oct  3 09:27 ..
-rw-------. 1 student student   27 Oct  3 09:31 .bash_history
-rw-r--r--. 1 student student   18 Apr 30  2024 .bash_logout
-rw-r--r--. 1 student student  141 Apr 30  2024 .bash_profile
-rw-r--r--. 1 student student  492 Apr 30  2024 .bashrc
drwx------. 2 student student 4096 Oct  3 09:28 .ssh
```

Hiding is only about tidiness, not security: anyone who can list the directory can see hidden files with `-a`. Protecting a file is the job of permissions.

## Create an empty file

`touch` updates a file's time stamp, and creates the file, empty, if it doesn't exist yet. That makes it the quickest way to make practice files:

```console
[student@servera ~]$ touch plan.txt
[student@servera ~]$ ls -l plan.txt
-rw-r--r--. 1 student student 0 Oct  3 09:54 plan.txt
```

## Names with spaces

Linux allows spaces in file names, but the shell uses spaces to separate arguments. Without quotes, `my notes.txt` is two arguments, `my` and `notes.txt`:

```console
[student@servera ~]$ touch "my notes.txt"
[student@servera ~]$ rm my notes.txt
rm: cannot remove 'my': No such file or directory
rm: cannot remove 'notes.txt': No such file or directory
[student@servera ~]$ rm "my notes.txt"
```

Quote such names, or press {% kbd %}Tab{% /kbd %} and let completion add the escaping for you. Better still, use `-` or `_` instead of spaces in names you create.

## Check your understanding

{% quiz id="quick" objectives=["ch03.paths"] ref="quick" /%}
