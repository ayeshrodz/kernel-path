---
title: "Exercise: Read the labels"
seoTitle: "Read the labels (RHCSA Practice Exercise)"
description: "Hands-on RHCSA practice: read the labels. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 20
---

{% lead %}
Explore how SELinux sees servera: its mode, the labels on files and processes, how new files get labelled, and the difference between the current mode and the configured one. You change nothing permanently.
{% /lead %}

{% lab
  objectives=["ch16.concepts"]
  id="contexts"
  title="Read the labels"
  hosts=["workstation","servera"]
  outcomes=["Find the SELinux mode and policy.","Read file, process and user contexts.","See that new files are labelled by their location."] %}

  {% task id="task-816f0b3ecf76" title="Mode and policy" %}
    Log in to servera as `student`. Show whether SELinux is enabled, its current mode, the mode in the configuration file, and the policy name.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ getenforce
Enforcing
[student@servera ~]$ sestatus | grep -E "SELinux status|Current mode|Mode from|policy name"
SELinux status:                 enabled
Loaded policy name:             targeted
Current mode:                   enforcing
Mode from config file:          enforcing
```
    {% /reveal %}
  {% /task %}

  {% task id="task-98e54cc0edea" title="Labels of files and directories" %}
    Show the contexts of `/etc/passwd`, `/etc/shadow`, `/usr/bin/passwd`, `/tmp`, `/srv` and `/root`. What type does each have? Why do you think `shadow_t` is a different type from `passwd_file_t`?

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ ls -dZ /etc/passwd /etc/shadow /usr/bin/passwd /tmp /srv
system_u:object_r:passwd_file_t:s0 /etc/passwd
     system_u:object_r:shadow_t:s0 /etc/shadow
 system_u:object_r:passwd_exec_t:s0 /usr/bin/passwd
          system_u:object_r:tmp_t:s0 /tmp
          system_u:object_r:var_t:s0 /srv
[student@servera ~]$ sudo ls -dZ /root
system_u:object_r:admin_home_t:s0 /root
```

    `/etc/passwd` must be readable by many programs, but only a few (login, passwd, …) may touch the password hashes in `/etc/shadow`, so they are given different types the policy treats differently.
    {% /reveal %}
  {% /task %}

  {% task id="task-ba8a512f36a6" title="Who am I, and what is running?" %}
    Show your own context. Show the contexts of the `sshd`, `chronyd` and `firewalld` processes, and of the program files `/usr/sbin/sshd` and `/usr/sbin/chronyd`.

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ id -Z
unconfined_u:unconfined_r:unconfined_t:s0-s0:c0.c1023
[student@servera ~]$ ps -eZ | grep -E "sshd|chronyd|firewalld" | head -3
system_u:system_r:firewalld_t:s0    453 ?        00:00:00 firewalld
system_u:system_r:chronyd_t:s0      464 ?        00:00:00 chronyd
system_u:system_r:sshd_t:s0-s0:c0.c1023 641 ?    00:00:00 sshd
[student@servera ~]$ ls -Z /usr/sbin/sshd /usr/sbin/chronyd
system_u:object_r:chronyd_exec_t:s0 /usr/sbin/chronyd
   system_u:object_r:sshd_exec_t:s0 /usr/sbin/sshd
```

    The daemons are confined (`sshd_t`, `chronyd_t`), your login shell is not (`unconfined_t`). The process type follows from the type of its program file: `sshd_exec_t` starts as `sshd_t`.
    {% /reveal %}
  {% /task %}

  {% task id="task-09d6b2fc2319" title="How new files get labelled" %}
    Create a file in your home directory, a file in `/tmp`, and a directory in your home. Show their contexts.

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ touch ~/x /tmp/x; mkdir ~/d
[student@servera ~]$ ls -dZ ~/x /tmp/x ~/d
unconfined_u:object_r:user_home_t:s0 /home/student/d
unconfined_u:object_r:user_home_t:s0 /home/student/x
 unconfined_u:object_r:user_tmp_t:s0 /tmp/x
[student@servera ~]$ rm -rf ~/x /tmp/x ~/d
```

    A new file receives a label from the policy rule for **where** it is created: `user_home_t` in a home directory, `user_tmp_t` in `/tmp`. The next lessons build on this.
    {% /reveal %}
  {% /task %}

  {% task id="task-d8d2a2bbccd4" title="Current versus permanent mode" %}
    As root, switch to permissive mode, look at both the current mode and the configured one, and switch back.

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ sudo setenforce 0
[student@servera ~]$ getenforce; sestatus | grep -E "Current mode|Mode from"
Permissive
Current mode:                   permissive
Mode from config file:          enforcing
[student@servera ~]$ sudo setenforce 1
[student@servera ~]$ getenforce
Enforcing
[student@servera ~]$ exit
```

    `setenforce` changes the running system only; the configuration file still says `enforcing`, so a reboot restores it anyway.
    {% /reveal %}
  {% /task %}
{% /lab %}
