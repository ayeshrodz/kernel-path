---
title: "Exercise: Find your way around"
seoTitle: "Find your way around (RHCSA Practice Exercise)"
description: "Hands-on RHCSA practice: find your way around. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 10
---

{% lead %}
Explore servera's directory tree with `pwd`, `cd` and `ls`, using absolute and relative paths, and find out what happens when you go somewhere you aren't allowed.
{% /lead %}

{% lab
  objectives=["ch03.hierarchy","ch03.paths"]
  id="navigate"
  title="Find your way around"
  exercise="sa-navigate"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera"]
  outcomes=["Move around with absolute and relative paths, ., .. and ~.","Read long listings and find hidden files.","Recognise a directory you may not enter."] %}

  {% task id="task-9812fc5d33ae" title="Start the exercise" %}
    On workstation, start the exercise. It removes any practice files from an earlier run from student's home on servera.

```console
[student@workstation ~]$ lab start sa-navigate
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-13825aae8cdb" title="Log in to servera and see where you start" %}

```console
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ pwd
/home/student
```
  {% /task %}

  {% task id="task-b4392a507139" title="Find your hidden files" %}
    Plain `ls` shows nothing, but your home directory isn't empty:

```console
[student@servera ~]$ ls
[student@servera ~]$ ls -a
.  ..  .bash_history  .bash_logout  .bash_profile  .bashrc  .ssh
```

    `.bashrc` holds your shell settings and `.ssh` your SSH files. Every new account gets the dotfiles from `/etc/skel`, a template directory; check with `ls -a /etc/skel`. (`.bash_history` appears once you have logged in interactively.)
  {% /task %}

  {% task id="task-00531faab870" title="Visit /etc with an absolute path" %}

```console
[student@servera ~]$ cd /etc
[student@servera etc]$ ls -l hostname
-rw-r--r--. 1 root root 24 Oct  3 09:28 hostname
[student@servera etc]$ ls -ld .
drwxr-xr-x. 79 root root 4096 Oct  3 09:29 .
```

    `hostname` is a relative path here, short for `/etc/hostname`. `ls -ld .` describes the current directory itself rather than its contents: owned by root, and a `d` for directory.
  {% /task %}

  {% task id="task-d9e432fb23b8" title="Go down, up and sideways" %}
    Use the full path once, then relative paths:

```console
[student@servera etc]$ cd /usr/share/doc/bash
[student@servera bash]$ ls
bash.html  bashref.html  FAQ  INTRO  RBASH  README
[student@servera bash]$ cd ../../..
[student@servera usr]$ pwd
/usr
[student@servera usr]$ cd ../etc
[student@servera etc]$ pwd
/etc
```

    Three `..` steps climb from `/usr/share/doc/bash` to `/usr`; `../etc` then goes up to `/` and down into `etc`.
  {% /task %}

  {% task id="task-8a5acbbd0656" title="Jump back and forth, then go home" %}

```console
[student@servera etc]$ cd /var/log
[student@servera log]$ cd -
/etc
[student@servera etc]$ cd -
/var/log
[student@servera log]$ cd
[student@servera ~]$
```
  {% /task %}

  {% task id="task-6d12558326c5" title="Try to enter root's home directory" %}
    `~root` is root's home, `/root`. Ordinary users may not look inside it:

```console
[student@servera ~]$ cd ~root
-bash: cd: /root: Permission denied
[student@servera ~]$ ls -l ~root
ls: cannot open directory '/root': Permission denied
```

    The directory is there; its permissions keep you out. Chapter 7 shows how to read why.
  {% /task %}

  {% task id="task-c4a6b8100eb4" title="Create practice files with touch, and log out" %}

```console
[student@servera ~]$ touch plan.txt "team notes.txt"
[student@servera ~]$ ls -l
total 0
-rw-r--r--. 1 student student 0 Oct  3 09:58  plan.txt
-rw-r--r--. 1 student student 0 Oct  3 09:58 'team notes.txt'
[student@servera ~]$ exit
```

    The quotes keep `team notes.txt` as one name, and `ls` shows it quoted for the same reason, so you could copy it into a command as it is. The next lesson shows how to remove files. To put servera back as it was, run `rht-vmctl reset servera` on the Ubuntu host.
  {% /task %}

  {% task id="task-60a9e9b52693" title="Grade and finish" %}
    {% lab-finish exercise="sa-navigate" grade=true servers=true /%}
  {% /task %}
{% /lab %}
