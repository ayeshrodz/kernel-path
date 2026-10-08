---
title: Bundling files with tar
seoTitle: "tar Command in Linux: Create and Extract Archives"
description: "Create, list and extract tar archives, extract single files and exclude what you do not need. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 20
---

{% lead %}
Backing up a directory, sending a project to a colleague, or preparing files for transfer all begin by turning many files into one. On Linux that tool is **tar**, and it has been for decades. Its options look cryptic at first, but there are really only a handful, and they combine the same way every time.
{% /lead %}

{% objectives %}
- Create, list and extract archives with `tar`, and choose the compression with `z`, `j` or `J`.
- Extract into a chosen directory, extract a single member, and exclude files.
- Explain relative and absolute member names, and compare an extracted tree with its original.
{% /objectives %}

## An archive is a list of files in one file

A **tar archive** stores files together with their names, permissions, owners and times, one after another. On its own it is not compressed. Compression is a second step (next lesson) that `tar` can do for you on the fly.

{% diagram ref="tar-options" /%}

You always choose exactly one of three actions:

| Letter | Action |
| --- | --- |
| `c` | **C**reate an archive |
| `t` | **T**est/list its contents |
| `x` | E**x**tract it |

and then add what you need: `f NAME` (the archive file, **always last** of the letters), `v` for verbose, one of `z` / `j` / `J` for compression, and `-C DIR` to work in another directory.

## Create and list

```console
[root@servera arch]# tar -cvf project.tar project
project/
project/docs/
project/docs/notes.md
project/run.sh
project/link.md
project/src/
project/src/data2.txt
project/src/data3.txt
project/src/data1.txt
[root@servera arch]# tar -tvf project.tar | head -4
drwxr-xr-x root/root         0 2026-10-03 17:36 project/
drwxr-xr-x root/root         0 2026-10-03 17:36 project/docs/
-rw-r--r-- root/root         8 2026-10-03 17:36 project/docs/notes.md
-rwxr-x--- root/root        12 2026-10-03 17:36 project/run.sh
```

`-t` never changes anything, so use it freely before you extract anything. With `v` it shows permissions, owner/group and size, as `ls -l` would.

Add one letter to compress while creating:

```console
[root@servera arch]# tar -czf project.tar.gz project      # gzip
[root@servera arch]# ls -l project.tar project.tar.gz
-rw-r--r--. 1 root root 337920 Oct  3 17:36 project.tar
-rw-r--r--. 1 root root 135323 Oct  3 17:36 project.tar.gz
```

## Extract

```console
[root@servera arch]# mkdir out
[root@servera arch]# tar -xf project.tar.gz -C out
[root@servera arch]# ls out/project
docs  link.md  run.sh  src
```

By default tar extracts into the **current directory**, so `-C` (the directory must exist) is the safe habit: extract into a new, empty place and look before you move anything. Notice that no `z` was needed: when reading, tar recognises the compression by itself.

To extract just one member, name it exactly as `tar -t` shows it:

```console
[root@servera arch]# tar -xzf project.tar.gz -C out project/run.sh
[root@servera arch]# ls -l out/project/run.sh
-rwxr-x---. 1 root root 12 Oct  3 17:36 out/project/run.sh
```

Permissions came back as they were (run.sh is `750`). Add `--exclude` when creating to leave things out:

```console
[root@servera arch]# tar --exclude='*.txt' -czf notxt.tar.gz project
[root@servera arch]# tar -tzf notxt.tar.gz
project/
project/docs/
project/docs/notes.md
project/run.sh
project/link.md
project/src/
```

## Relative and absolute names

Archive a path that starts with `/` and tar warns you:

```console
[root@servera arch]# tar -cvf abs.tar /tmp/arch/project/docs
tar: Removing leading `/' from member names
/tmp/arch/project/docs/
/tmp/arch/project/docs/notes.md
```

It stored the names without the leading slash, so extracting can never overwrite `/tmp/arch/...` by accident: it creates `tmp/arch/...` below the current directory. That is a safety feature, and also why it is best to create archives with `-C`:

```console
[root@servera arch]# tar -czf data.tar.gz -C /srv data
```

stores `data/...`, a name that makes sense wherever you extract it.

## Always compare

An archive is only useful if it restores. After extracting into an empty directory, compare with the original:

{% diagram ref="tar-workflow" /%}

```console
[root@servera arch]# diff -r project out/project; echo "rc=$?"
rc=0
```

`diff -r` prints nothing and returns 0 when the two trees are identical.

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch14.tar"] ref="quick" /%}
