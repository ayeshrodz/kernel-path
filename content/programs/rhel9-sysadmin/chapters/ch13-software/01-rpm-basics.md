---
title: Packages and the RPM database
seoTitle: "rpm Command: Query and Verify Installed Packages"
description: "Query installed packages, their files and owners, and verify them with rpm -q, -ql, -qf and -V. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 15
---

{% lead %}
Almost all software on RHEL arrives as **packages**: archives that contain program files, configuration files, documentation and instructions for installing them. A package manager remembers what is installed and where each file came from. That knowledge answers practical questions: "Which package owns this file?", "Was this program changed?", "What did the installer put on my disk?".
{% /lead %}

{% objectives %}
- Read a package name and say what version, release and architecture mean.
- Query installed packages with `rpm -q`, `-i`, `-l`, `-f`, `-c` and `-d`.
- Verify installed files against their package with `rpm -V`.
{% /objectives %}

## What a package is

An RPM package carries:

- the **files** to install, with their owners and permissions,
- **metadata**: name, version, description, licence, and what it **depends on**,
- optional **scriptlets** that run at install or removal,
- a **digital signature** from its builder.

Two layers manage software. **rpm** is the low-level tool and database: it installs one package file at a time and records the result in the RPM database under `/var/lib/rpm`. **dnf** (next lesson) sits on top: it fetches packages from repositories and solves dependencies. For *asking questions about what is installed*, you use `rpm -q`.

## The name of a package

{% diagram ref="nvra" /%}

## Asking questions with rpm -q

`-q` means "query". Add letters to ask different questions:

| Command | Answers |
| --- | --- |
| `rpm -q NAME` | Is it installed, and which version? |
| `rpm -qi NAME` | Information: summary, version, install date, signature, URL |
| `rpm -ql NAME` | **L**ist the files the package installed |
| `rpm -qc NAME`, `rpm -qd NAME` | Only the configuration files / documentation files |
| `rpm -qf /path/to/file` | Which package **f**ile-owns this path? |
| `rpm -qa` | **A**ll installed packages (pipe it to `wc -l`, `grep` or `sort`) |
| `rpm -qa --last` | Newest installs first |

```console
[root@servera ~]# rpm -q tree
tree-1.8.0-10.el9.x86_64
[root@servera ~]# rpm -ql tree
/usr/bin/tree
/usr/share/doc/tree
/usr/share/doc/tree/README
/usr/share/man/man1/tree.1.gz
...output omitted...
[root@servera ~]# rpm -qf /usr/bin/passwd
passwd-0.80-12.el9.x86_64
[root@servera ~]# rpm -qc tree
[root@servera ~]# rpm -qd tree
/usr/share/doc/tree/README
/usr/share/man/man1/tree.1.gz
```

`rpm -qf` is the quickest way to find out where a strange file on the system came from, and `rpm -qc` tells you which files of a package you are expected to edit. (`tree` has no configuration files, so `-qc` prints nothing.)

## Has anything been changed? rpm -V

`rpm -V` (verify) compares the files on disk with the package database. If everything matches, it prints nothing. Otherwise it prints a line per changed file, with flags saying what differs:

```console
[root@servera ~]# rpm -V tree
[root@servera ~]# echo x >> /usr/bin/tree
[root@servera ~]# rpm -V tree
S.5....T.    /usr/bin/tree
```

{% diagram ref="verify-flags" /%}

Edited configuration files appear in the output too (marked `c`), so interpret with care: a changed config file is usually fine, a changed *program* file is suspicious. Reinstall a damaged package with `dnf reinstall NAME`.

## Package files, before you install them

You sometimes hold a `.rpm` file (from a vendor, or downloaded). Without installing it, you can look inside, and check that it is genuine:

```console
[root@servera ~]# rpm -qpi zip-3.0-35.el9.x86_64.rpm | head -3
[root@servera ~]# rpm -qpl zip-3.0-35.el9.x86_64.rpm
[root@servera ~]# rpm -K zip-3.0-35.el9.x86_64.rpm
zip-3.0-35.el9.x86_64.rpm: digests signatures OK
```

The extra `p` means "package file" instead of "installed package". `rpm -K` checks the signature against the keys in the RPM database: `digests signatures OK` is what you want to see.

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch13.rpm"] ref="quick" /%}
