---
title: What SELinux does
seoTitle: "SELinux Explained: Modes, Contexts and Policy"
description: "What SELinux does, enforcing and permissive modes, labels and contexts on RHEL 9. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 20
---

{% lead %}
Ordinary Linux permissions ask: *who owns this file, and what may its owner, group and everyone else do with it?* That is not enough when a program is hijacked. A web server that runs as an unprivileged user can still read every world-readable file on the machine, including ones it has no business touching. **SELinux** adds a second, independent question: *may a program of this kind touch an object of that kind?* This lesson explains the vocabulary, so that a "Permission denied" that no `chmod` fixes stops being a mystery.
{% /lead %}

{% objectives %}
- Explain mandatory access control and why both permissions and SELinux must allow an access.
- Read a security context and name its parts, especially the type.
- Show the SELinux mode and use the `-Z` option to see the labels of files, processes and users.
{% /objectives %}

## Labels on everything

With SELinux, every file, directory, process and port carries a **label** called its **security context**. The policy is a long list of rules about which labels may interact. Your RHEL system uses the **targeted** policy: it confines the network services and system daemons most likely to be attacked (sshd, httpd, chronyd, …), and leaves ordinary user sessions largely unconfined.

{% diagram ref="context" /%}

The context has four fields. In practice you work with the **type**. The rules read like sentences: *processes of type `httpd_t` may read files of type `httpd_sys_content_t`*, and *may not read files of type `shadow_t`*. A program that is compromised can therefore reach only what its type allows.

```console
[student@servera ~]$ ls -dZ /etc/ssh /home/student /tmp /usr/bin/passwd /var/log/messages
          system_u:object_r:etc_t:s0 /etc/ssh
system_u:object_r:user_home_dir_t:s0 /home/student
          system_u:object_r:tmp_t:s0 /tmp
  system_u:object_r:passwd_exec_t:s0 /usr/bin/passwd
      system_u:object_r:var_log_t:s0 /var/log/messages
[student@servera ~]$ ps -eZ | grep -E "sshd|chronyd" | head -2
system_u:system_r:chronyd_t:s0      464 ?        00:00:00 chronyd
system_u:system_r:sshd_t:s0-s0:c0.c1023 641 ?    00:00:00 sshd
[student@servera ~]$ id -Z
unconfined_u:unconfined_r:unconfined_t:s0-s0:c0.c1023
```

`ls -Z` shows file labels, `ps -Z` process labels, and `id -Z` your own. Executable files carry types too (`sshd_exec_t`), and starting such a file makes the new process run in the matching domain (`sshd_t`): that is how a daemon ends up confined.

## Two locks on every door

SELinux does not replace file permissions: it is a second check **after** them. An access succeeds only if both agree.

{% diagram ref="two-locks" /%}

That is the most important idea for troubleshooting. If a service cannot read a file that is perfectly readable by its user, think "label", not "mode". `chmod 777` does nothing for the second lock.

## Modes

{% diagram ref="modes" /%}

```console
[student@servera ~]$ getenforce
Enforcing
[student@servera ~]$ sestatus | head -4
SELinux status:                 enabled
SELinuxfs mount:                /sys/fs/selinux
SELinux root directory:         /etc/selinux
Loaded policy name:             targeted
[student@servera ~]$ grep -v "^#" /etc/selinux/config | grep -v "^$"
SELINUX=enforcing
SELINUXTYPE=targeted
```

`setenforce 0` / `1` switches between permissive and enforcing until the next reboot, and is the quickest way to answer "is SELinux the cause?". Only the file `/etc/selinux/config` changes the mode permanently.

{% callout type="warning" title="Do not turn it off to make a problem go away" %}
A disabled SELinux hides the real problem (a wrong label, a switch, a port) and removes protection from the whole system. Re-enabling it later forces a full relabel of the file system. The rest of this chapter shows how to find and fix the actual cause in a few minutes.
{% /callout %}

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch16.concepts"] ref="quick" /%}
