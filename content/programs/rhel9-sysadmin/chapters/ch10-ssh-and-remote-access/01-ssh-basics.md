---
title: Logging in to other machines with SSH
seoTitle: "SSH Basics: Log In to Remote Linux Servers"
description: "Log in with ssh, verify host keys and fingerprints, and run remote commands. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 15
---

{% lead %}
Almost every Linux server is managed from a distance. **SSH** (Secure Shell) is how: it gives you a command line on another machine, with the whole conversation encrypted. This lesson covers what happens when you connect, and the first thing to get right: making sure you are talking to the machine you think you are.
{% /lead %}

{% objectives %}
- Log in to a remote host and run a command on it with `ssh`.
- Explain what a host key is, what `known_hosts` stores, and why the first connection asks a question.
- Compare fingerprints, and react correctly to a changed host key.
{% /objectives %}

## Connecting

The basic form is `ssh USER@HOST`. You get a shell on HOST as USER, until you leave with `exit`. Add a command, and ssh runs just that, shows its output, and returns:

```console
[student@workstation ~]$ ssh ops@servera hostname
ops@servera's password:
servera.lab.example.com
```

If you leave out the user name, ssh uses the name you are logged in as. This is the basis of everything else in this chapter, because SSH is also the transport for file copying (`scp`, `rsync`), automation tools such as Ansible, and the grading in this course.

## Who is at the other end? Host keys

Encryption alone is not enough: you must also know that the server is the right one, or an attacker in the middle could simply pretend to be it. Every SSH server has its own **host keys** (in `/etc/ssh/ssh_host_*`), created when the machine was installed. A server presents its public host key at every connection, and the client checks it.

{% diagram ref="first-connection" /%}

The question you see at first contact looks like this:

```console
[student@workstation ~]$ ssh ops@servera
The authenticity of host 'servera (172.25.250.10)' can't be established.
ED25519 key fingerprint is SHA256:FiQsZBEl3IPrcGlIbHS4VrVteB5aT0PVAD5VNj91+Hk.
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added 'servera' (ED25519) to the list of known hosts.
```

A **fingerprint** is a short hash of the key. To verify it, ask the server (through a channel you trust, such as its console) for the fingerprint of its own key and compare:

```console
[root@servera ~]# ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
256 SHA256:FiQsZBEl3IPrcGlIbHS4VrVteB5aT0PVAD5VNj91+Hk root@servera (ED25519)
```

The answer you give is remembered in `~/.ssh/known_hosts`. `ssh-keygen -F HOST` finds the stored entry, and `-l` shows its fingerprint:

```console
[student@workstation ~]$ ssh-keygen -lF servera
# Host servera found: line 4
servera ED25519 SHA256:FiQsZBEl3IPrcGlIbHS4VrVteB5aT0PVAD5VNj91+Hk
```

### When the key changes

If the key presented later does not match the stored one, ssh stops:

```console
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@    WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!     @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
IT IS POSSIBLE THAT SOMEONE IS DOING SOMETHING NASTY!
...output omitted...
Offending ED25519 key in /home/student/.ssh/known_hosts:4
Host key for servera has changed and you have requested strict checking.
Host key verification failed.
```

Often the cause is harmless: the server was rebuilt or re-imaged. But do not simply delete the line. **First find out why the key changed.** Once you are satisfied, `ssh-keygen -R servera` removes the old entry, and the next connection asks the first-contact question again.

{% callout type="warning" title="Do not switch the check off" %}
`-o StrictHostKeyChecking=no` makes the warning go away by accepting any key, which removes the protection altogether. For labs and automation that must run unattended, `-o StrictHostKeyChecking=accept-new` is the safe middle: it accepts and saves keys for **new** hosts but still refuses a **changed** key.
{% /callout %}

## The files behind SSH

{% diagram ref="ssh-files" /%}

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch10.basics"] ref="quick" /%}
