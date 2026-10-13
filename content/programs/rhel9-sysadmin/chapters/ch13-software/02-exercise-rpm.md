---
title: "Exercise: Interrogate the installed software"
seoTitle: "Interrogate the installed software (RHCSA Practice Exercise)"
description: "Hands-on RHCSA practice: interrogate the installed software. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 20
---

{% lead %}
Use `rpm` to learn where files come from, what a package contains, and whether anything has been tampered with. You deliberately modify a program to see what verification reports.
{% /lead %}

{% lab
  objectives=["ch13.rpm"]
  id="rpm"
  title="Interrogate the installed software"
  exercise="sa-rpm"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera"]
  outcomes=["Query packages with rpm -q, -qi, -ql, -qc, -qd and -qf.","Find the owner of a file.","Detect a modified file with rpm -V and repair it."] %}

  {% task id="task-9955f107ff28" title="Start the exercise" %}
    On workstation, start the exercise. It makes sure the package `tree` is installed and intact on servera.

```console
[student@workstation ~]$ lab start sa-rpm
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-50e42e415190" title="Ask about a package" %}
    On servera as root (`sudo -i`), show the exact version of the `tree` package, its summary and licence, and the files it installed.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ sudo -i
[root@servera ~]# rpm -q tree
tree-1.8.0-10.el9.x86_64
[root@servera ~]# rpm -qi tree | grep -E 'Summary|License|Version'
Version     : 1.8.0
License     : GPLv2+ and LGPLv2+
Summary     : File system tree viewer
[root@servera ~]# rpm -ql tree
/usr/bin/tree
/usr/share/doc/tree
...output omitted...
```
    {% /reveal %}
  {% /task %}

  {% task id="task-f9d3d83dcb7d" title="Who owns this file?" %}
    Find the packages that own `/usr/bin/passwd`, `/etc/ssh/sshd_config` and `/usr/bin/ssh-keygen`. Is `/etc/ssh/sshd_config` a configuration file of that package?

    {% reveal title="Show solution" %}

```console
[root@servera ~]# rpm -qf /usr/bin/passwd /etc/ssh/sshd_config /usr/bin/ssh-keygen
passwd-0.80-12.el9.x86_64
openssh-server-9.9p1-12.el9_8.rocky.0.1.x86_64
openssh-9.9p1-12.el9_8.rocky.0.1.x86_64
[root@servera ~]# rpm -qc openssh-server | head -3
/etc/pam.d/sshd
/etc/ssh/sshd_config
/etc/sysconfig/sshd
```

    The client program is in `openssh`, the server and its configuration are in `openssh-server`; `-qc` confirms `sshd_config` is a configuration file.
    {% /reveal %}
  {% /task %}

  {% task id="task-961ac9482d52" title="Count and order the installed packages" %}
    How many packages are installed? Which were installed most recently?

    {% reveal title="Show solution" %}

```console
[root@servera ~]# rpm -qa | wc -l
375
[root@servera ~]# rpm -qa --last | head -3
python3-systemd-234-19.el9.x86_64             Sat Oct  3 17:26:10 2026
python3-dnf-plugins-core-4.3.0-26.el9.noarch  Sat Oct  3 17:26:10 2026
...output omitted...
```

    Your numbers will differ.
    {% /reveal %}
  {% /task %}

  {% task id="task-f1ff8cf7ae2b" title="Verify, tamper, verify" %}
    Verify `tree`. Then append a character to its binary, and verify again. Read the flags.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# rpm -V tree
[root@servera ~]# echo x >> /usr/bin/tree
[root@servera ~]# rpm -V tree
S.5....T.    /usr/bin/tree
```

    `S` (size), `5` (checksum) and `T` (time) differ: the program was modified.
    {% /reveal %}
  {% /task %}

  {% task id="task-5d27748c7ebd" title="Repair it" %}
    Reinstall the package and verify again. (This needs the repositories; the next lessons explain `dnf`.)

    {% reveal title="Show solution" %}

```console
[root@servera ~]# dnf reinstall -y tree
...output omitted...
Reinstalled:
  tree-1.8.0-10.el9.x86_64

Complete!
[root@servera ~]# rpm -V tree
[root@servera ~]# exit
[student@servera ~]$ exit
```

    No output: the file is back to what the package contains.
    {% /reveal %}
  {% /task %}

  {% task id="task-b1a6c98506c8" title="Grade and finish" %}
    {% lab-finish exercise="sa-rpm" grade=true servers=true /%}
  {% /task %}
{% /lab %}
