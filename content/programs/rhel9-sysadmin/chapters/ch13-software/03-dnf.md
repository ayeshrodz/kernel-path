---
title: Installing and updating software with dnf
seoTitle: "dnf Commands: Install, Update, Remove and History"
description: "Install, update and remove packages with dnf, search and inspect them, and undo with dnf history. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 20
---

{% lead %}
`dnf` is the everyday tool for software on RHEL. It knows the repositories you have configured, finds packages, works out and installs every dependency, verifies signatures, and keeps a history of everything it did so that you can review or undo it. This lesson covers the commands you will use daily.
{% /lead %}

{% objectives %}
- Search for, inspect, install and remove packages with `dnf`, and find which package provides a file.
- Read the transaction summary before you confirm.
- Review and undo changes with `dnf history`, and list and apply updates.
{% /objectives %}

## What happens when you install

{% diagram ref="dnf-flow" /%}

## Finding software

| Command | Answers |
| --- | --- |
| `dnf search WORD` | Which packages mention the word in their name or summary? |
| `dnf info NAME` | Details: version, size, repository, description |
| `dnf provides /path/to/file` or `dnf provides "*/semanage"` | Which package supplies this file (even if not installed)? |
| `dnf list installed`, `dnf list available`, `dnf list --upgrades` | The three lists |
| `dnf repoquery --requires NAME` | What does a package depend on? |

`dnf provides` is the answer to "command not found": find which package ships the program, then install it.

## Installing and removing

```console
[root@servera ~]# dnf install zip
Dependencies resolved.
================================================================================
 Package         Architecture      Version               Repository          Size
================================================================================
Installing:
 zip             x86_64            3.0-35.el9            baseos             263 k
Installing dependencies:
 unzip           x86_64            6.0-60.el9_8          baseos             180 k

Transaction Summary
================================================================================
Install  2 Packages

Is this ok [y/N]: y
...output omitted...
Complete!
```

**Read the summary before answering.** It tells you what will be installed, upgraded or *removed*. `-y` answers yes automatically, which is fine for something you have already checked and dangerous otherwise.

| Command | Does |
| --- | --- |
| `dnf install NAME [NAME...]` | Install packages and their dependencies |
| `dnf remove NAME` | Remove the package, and dependencies nothing else needs |
| `dnf reinstall NAME` | Put a damaged package back |
| `dnf upgrade [NAME]` | Apply updates to everything (or to one package); `dnf update` is the same |
| `dnf install ./file.rpm` | Install a local file *and* resolve its dependencies from the repositories |
| `dnf group list`, `dnf group install "NAME"` | Named sets of packages |

## Updates

```console
[root@servera ~]# dnf check-update | head -3
kernel.x86_64                          5.14.0-687.54.1.el9_8              baseos
kernel-core.x86_64                     5.14.0-687.54.1.el9_8              baseos
kernel-modules.x86_64                  5.14.0-687.54.1.el9_8              baseos
```

`check-update` lists what is available without installing it. A kernel update installs a **new** kernel next to the old ones (several are kept); it takes effect after a reboot. The next lessons cover security updates and the reboot decision.

## History: the undo button

Every dnf transaction is recorded:

```console
[root@servera ~]# dnf history | head -4
ID     | Command line             | Date and time    | Action(s)      | Altered
-------------------------------------------------------------------------------
    11 | install -y zip           | 2026-10-03 17:27 | Install        |    2
    10 | module remove -y nginx   | 2026-10-03 17:27 | Removed        |   88 EE
[root@servera ~]# dnf history info 11 | tail -6
[root@servera ~]# dnf history undo last
Removed:
  unzip-6.0-60.el9_8.x86_64                zip-3.0-35.el9.x86_64

Complete!
```

`dnf history info ID` lists the packages a transaction changed, and `dnf history undo ID` reverses it. This is the safest way back from "I installed something and now things are different".

{% callout type="tip" title="Cache and metadata" %}
dnf caches the repository catalogue and may say *"Last metadata expiration check"*. If a repository changed and dnf does not see it, run `dnf clean all` and try again, or `dnf makecache` to refresh.
{% /callout %}

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch13.dnf"] ref="quick" /%}
