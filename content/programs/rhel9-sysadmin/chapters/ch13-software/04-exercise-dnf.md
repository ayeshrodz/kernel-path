---
title: "Exercise: Install, inspect and undo"
seoTitle: "Install, inspect and undo (RHCSA Practice Exercise)"
description: "Hands-on RHCSA practice: install, inspect and undo. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 25
---

{% lead %}
A colleague asks for the `zip` command. Find the package, check what it needs, install it, see where the files went, and then use the history to take it all back out.
{% /lead %}

{% lab
  objectives=["ch13.dnf"]
  id="dnf"
  title="Install, inspect and undo"
  exercise="sa-dnf"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera"]
  outcomes=["Search, inspect and install a package with dnf.","Read the transaction summary and the dependencies.","Review and undo a transaction."] %}

  {% task id="task-140a1b6e4799" title="Start the exercise" %}
    On workstation, start the exercise. It makes sure zip and unzip are not installed on servera.

```console
[student@workstation ~]$ lab start sa-dnf
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-f7ebcb15fdf9" title="Find the package" %}
    On servera as root (`sudo -i`), confirm that `zip` is not installed. Search the repositories for it, and show its description.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ sudo -i
[root@servera ~]# zip
-bash: zip: command not found
[root@servera ~]# dnf search zip | head -6
...output omitted...
zip.x86_64 : A file compression and packaging utility compatible with PKZIP
[root@servera ~]# dnf info zip | head -8
Available Packages
Name         : zip
Version      : 3.0
Release      : 35.el9
Architecture : x86_64
Size         : 263 k
Source       : zip-3.0-35.el9.src.rpm
Repository   : baseos
```
    {% /reveal %}
  {% /task %}

  {% task id="task-02bdef4d80c8" title="Check the plan" %}
    Run `dnf install zip`, but answer **no** at the prompt. Which other package would be installed, and from which repository do both come?

    {% reveal title="Show solution" %}

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

Total download size: 443 k
Installed size: 1.1 M
Is this ok [y/N]: n
Operation aborted.
```

    Both packages come from `baseos`. Reading before agreeing is the habit to build.
    {% /reveal %}
  {% /task %}

  {% task id="task-26ae44537e5c" title="Install it" %}
    Install the package for real, with `-y`, and use it.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# dnf install -y zip
...output omitted...
Installed:
  unzip-6.0-60.el9_8.x86_64                zip-3.0-35.el9.x86_64

Complete!
[root@servera ~]# cd /tmp && echo hello > a.txt && zip a.zip a.txt
  adding: a.txt (stored 0%)
[root@servera tmp]# unzip -l a.zip
Archive:  a.zip
  Length      Date    Time    Name
---------  ---------- -----   ----
        6  2026-10-03 17:27   a.txt
---------                     -------
        6                     1 file
```
    {% /reveal %}
  {% /task %}

  {% task id="task-2676ee936dc5" title="Find where things came from" %}
    Which package provides `/usr/bin/unzip`? Use both `rpm` and `dnf`. Then list the files of `zip` that are documentation.

    {% reveal title="Show solution" %}

```console
[root@servera tmp]# rpm -qf /usr/bin/unzip
unzip-6.0-60.el9_8.x86_64
[root@servera tmp]# dnf provides /usr/bin/unzip | head -3
unzip-6.0-60.el9_8.x86_64 : A utility for unpacking zip files
Repo        : @System
Matched from:
[root@servera tmp]# rpm -qd zip | head -3
/usr/share/doc/zip/CHANGES
...output omitted...
```
    {% /reveal %}
  {% /task %}

  {% task id="task-5518aee21914" title="Read the history" %}
    Show the latest transactions, then the details of the install you made.

    {% reveal title="Show solution" %}

```console
[root@servera tmp]# dnf history | head -4
ID     | Command line             | Date and time    | Action(s)      | Altered
-------------------------------------------------------------------------------
    11 | install -y zip           | 2026-10-03 17:27 | Install        |    2
[root@servera tmp]# dnf history info 11 | tail -6
Packages Altered:
    Install unzip-6.0-60.el9_8.x86_64 @baseos
    Install zip-3.0-35.el9.x86_64     @baseos
```
    {% /reveal %}
  {% /task %}

  {% task id="task-d2a66955fcae" title="Undo it" %}
    Undo that transaction, and confirm that both packages are gone.

    {% reveal title="Show solution" %}

```console
[root@servera tmp]# dnf history undo last -y
Removed:
  unzip-6.0-60.el9_8.x86_64                zip-3.0-35.el9.x86_64

Complete!
[root@servera tmp]# rpm -q zip unzip
package zip is not installed
package unzip is not installed
[root@servera tmp]# rm -f a.txt a.zip
[root@servera tmp]# exit
[student@servera ~]$ exit
```
    {% /reveal %}
  {% /task %}

  {% task id="task-a2dc88f87d6a" title="Grade and finish" %}
    {% lab-finish exercise="sa-dnf" grade=true servers=true /%}
  {% /task %}
{% /lab %}
