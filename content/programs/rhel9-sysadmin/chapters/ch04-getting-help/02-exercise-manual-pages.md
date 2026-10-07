---
title: "Exercise: Find answers in manual pages"
seoTitle: "Find answers in manual pages (RHCSA Practice Exercise)"
description: "Hands-on RHCSA practice: find answers in manual pages. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 15
---

{% lead %}
Answer four practical questions using nothing but the manual pages on workstation: how to sort a listing by size, how to show sizes readably, what each field of /etc/passwd means, and how to create a user's home directory.
{% /lead %}

{% lab
  objectives=["ch04.man"]
  id="manual-pages"
  title="Find answers in manual pages"
  hosts=["workstation"]
  outcomes=["Search inside a manual page for an option.","Choose a manual section deliberately.","Read a SYNOPSIS and an option's description, then use what you found."] %}

  {% task id="task-6e1473759705" title="Find the ls option that sorts by size" %}
    Open `man ls`, type `/ -S ` (with a space on each side of `-S`) and press {% kbd %}Enter{% /kbd %}. Press {% kbd %}q{% /kbd %} when you have it.

    {% reveal title="Show what you should find" %}

```text
       -S     sort by file size, largest first
```

    Use it with `-l` on `/etc/ssh`:

```console
[student@workstation ~]$ ls -lS /etc/ssh
total 572
-rw-r--r--. 1 root root     541716 Sep 30 21:07 moduli
drwxr-xr-x. 2 root root       4096 Oct  2 08:09 ssh_config.d
drwx------. 2 root root       4096 Oct  3 09:25 sshd_config.d
-rw-------. 1 root root       3674 Sep 30 21:07 sshd_config
...output omitted...
-rw-r--r--. 1 root root         98 Oct  3 09:25 ssh_host_ed25519_key.pub
```
    {% /reveal %}
  {% /task %}

  {% task id="task-687e9170639a" title="Make the sizes readable" %}
    The sizes above are in bytes. Search the same page for an option that prints sizes like `1K` and `234M`. Try searching for `/human`.

    {% reveal title="Show solution" %}

```text
       -h, --human-readable
              with -l and -s, print sizes like 1K 234M 2G etc.
```

```console
[student@workstation ~]$ ls -lhS /etc/ssh
total 572K
-rw-r--r--. 1 root root     530K Sep 30 21:07 moduli
...output omitted...
```
    {% /reveal %}
  {% /task %}

  {% task id="task-0a193b93407a" title="Decode a line of /etc/passwd" %}
    `head -n 1 /etc/passwd` prints root's entry. Which manual page explains its seven fields, and what is the last one?

```console
[student@workstation ~]$ head -n 1 /etc/passwd
root:x:0:0:root:/root:/bin/bash
```

    {% reveal title="Show solution" %}
    The file format is in section 5, so `man 5 passwd`. `man passwd` would open the command's page in section 1 instead.

```text
           name:password:UID:GID:GECOS:directory:shell
...
       shell       This is  the  program  to  run  at  login  (if  empty,  use
                   /bin/sh).
```

    root logs in with `/bin/bash` and has `/root` as its home directory. Chapter 6 goes through every field.
    {% /reveal %}
  {% /task %}

  {% task id="task-036adcd79a78" title="Read useradd's SYNOPSIS and find the home-directory option" %}
    Open `man useradd`. What does its SYNOPSIS require, and which option creates the user's home directory?

    {% reveal title="Show solution" %}

```text
SYNOPSIS
       useradd [options] LOGIN

       useradd -D

       useradd -D [options]
...
       -m, --create-home
           Create the user's home directory if it does not exist. The files
           and directories contained in the skeleton directory (which can be
           defined with the -k option) will be copied to the home directory.
```

    The first form needs a `LOGIN` (the new user's name), with optional options before it. `useradd` is in section 8, a command for administrators. The skeleton directory it mentions is `/etc/skel`, which you looked at in chapter 3.
    {% /reveal %}
  {% /task %}

  {% task id="task-957dcc1d769c" title="Check which sections a name exists in" %}

```console
[student@workstation ~]$ whatis useradd passwd
useradd (8)          - create a new user or update default new user information
passwd (5)           - password file
passwd (1ossl)       - OpenSSL application commands
passwd (1)           - update user's authentication tokens
```
  {% /task %}
{% /lab %}
