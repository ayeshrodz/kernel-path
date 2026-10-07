---
title: Linux and the shell
seoTitle: "Linux and the Shell: A Beginner Introduction"
description: "What Linux, distributions and the Bash shell are, how to read the prompt and how to log in with SSH. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 15
---

{% lead %}
Before you type your first command, it helps to know what you are talking to. This lesson explains what Linux and Red Hat Enterprise Linux are, what the shell does, how to read its prompt, and how to log in to another machine and back out again.
{% /lead %}

{% objectives %}
- Explain what Linux, open source and a Linux distribution are, and where RHEL and Rocky Linux fit.
- Tell a terminal, a console and the shell apart, and read every part of the shell prompt.
- Log in to another machine with SSH, recognise a first-connection warning, and log out.
{% /objectives %}

## What Linux is

Strictly, **Linux** is a *kernel*: the program that starts first when a computer boots, and from then on shares out the processor, memory, disks and network between every other program. On its own a kernel can't do anything you would recognise. Add the tools around it (a shell, commands to manage files and users, a package manager, services such as a web server) and you have a complete operating system. People usually call the whole thing Linux.

Linux runs most of the internet's servers, almost every public cloud instance, the world's fastest supercomputers, phones (Android uses the Linux kernel), cars and televisions. If you work in IT, you will meet it.

### Open source

Linux and nearly all the tools around it are **open source**: their source code is published under a licence that lets anyone use the software, study how it works, change it, and share their changes. Some licences (such as the GPL that the kernel uses) also require that anyone who distributes a changed version publishes the change under the same terms, so improvements flow back to everyone.

Open source does not mean "no company involved". Thousands of companies, Red Hat among the largest, employ developers to work on open source projects and sell support, certification and services around them.

### Distributions

Nobody installs the kernel and a few thousand separate projects by hand. A **distribution** collects them, builds them to work together, and ships them with an installer, updates and a package manager. Debian, Ubuntu, Fedora and Red Hat Enterprise Linux are all distributions. They share the same kernel and most of the same tools, so what you learn here mostly carries over; the differences are in packaging, defaults and release schedules.

{% diagram ref="rhel-family" /%}

**Red Hat Enterprise Linux (RHEL)** is the distribution this path teaches. Companies choose it because each major version is supported for ten years, minor releases (9.1, 9.2 …) arrive every six months without breaking things, and it is certified to run a long list of commercial software and hardware. Using it needs a subscription; developers can get one free.

Your practice lab runs **Rocky Linux 9**, a free rebuild of RHEL 9 from the same published source. Commands, packages, file locations and services are the same, which is exactly why it makes a good practice system.

{% callout type="note" title="Where this path differs from RHEL" %}
A few things only exist on RHEL, because they belong to the subscription: registering the system with `subscription-manager`, Red Hat's support tools and its insights service. Lessons that touch them say so and show what the Rocky equivalent is.
{% /callout %}

## Terminals, consoles and the shell

You give Linux instructions by typing commands. Three pieces sit between your keyboard and the kernel:

{% diagram ref="shell-layers" /%}

| Term | What it is |
| --- | --- |
| **Terminal** | Anything that shows text output and takes keyboard input: a terminal window on a desktop, an SSH session, or a real screen and keyboard. |
| **Console** | The machine's own screen and keyboard (the *physical console*). Linux gives it several *virtual consoles*, each an independent login: on a server, press {% kbd %}Ctrl{% /kbd %}+{% kbd %}Alt{% /kbd %}+{% kbd %}F2{% /kbd %} to {% kbd %}F6{% /kbd %} to switch between them. A server without a screen offers a *serial console* instead, reachable over the network in a data centre. |
| **Shell** | The program that reads what you type, works out what you mean, runs the right programs and shows you their output. On RHEL it is **Bash**, the GNU Bourne-Again Shell. |
| **Prompt** | The text the shell prints when it is ready for your next command. |

Most servers have no desktop at all: a graphical environment uses memory and processor time the server's real work could use. You log in over the network, with SSH, and work at a shell prompt. That is how you will work in this path.

{% callout type="tip" title="In your lab" %}
`rht-vmctl ws` on the host (or `lxc exec workstation -- su - student`) gives you a shell on workstation, much like sitting at its console. `rht-vmctl view servera` attaches to servera's serial console. Inside the lab, you move between machines with SSH.
{% /callout %}

## Read the prompt

The prompt tells you who you are, where you are and how careful you need to be. Select each part:

{% diagram ref="prompt-anatomy" /%}

The last character matters most. A `$` means an ordinary user: you can only change your own files, and a mistake affects only you. A `#` means you are **root**, the superuser, who can change anything on the system, including deleting it. When you see `#`, slow down.

```console
[student@servera ~]$ sudo -i
[sudo] password for student:
[root@servera ~]# whoami
root
[root@servera ~]# exit
logout
[student@servera ~]$
```

`sudo -i` starts a root shell after asking for *your* password; `exit` leaves it. Chapter 6 explains sudo properly. Until then, you only need to recognise the `#`.

## The shape of a command

Every command line has up to three kinds of part, separated by spaces. Select each part of this example, which prints the first three lines of a file:

{% diagram ref="command-anatomy" /%}

- The **command** is the name of the program to run. It always comes first.
- **Options** change how it behaves. They start with a dash. Short options are one letter after one dash (`-n`, `-l`) and can often be combined (`ls -la` is `ls -l -a`). Long options are a word after two dashes (`--lines=3`, `--all`), easier to read in scripts. Some options take a value, like `-n 3`.
- **Arguments** are what the command works on: usually file names, user names or host names.

Not every command needs all three: `date` on its own is a complete command, and so is `whoami`.

## Log in to another machine with SSH

**SSH** (Secure Shell) gives you a shell on another computer over the network, with everything you type and see encrypted. The `ssh` command takes the account and the machine as `user@host`:

```console
[student@workstation ~]$ ssh student@servera
The authenticity of host 'servera (172.25.250.10)' can't be established.
ED25519 key fingerprint is SHA256:FiQsZBEl3IPrcGlIbHS4VrVteB5aT0PVAD5VNj91+Hk.
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added 'servera' (ED25519) to the list of known hosts.
student@servera's password:
Last login: Sat Oct  3 09:30:04 2026 from 172.25.250.9
[student@servera ~]$
```

The warning appears the **first time** you connect to a machine. Every SSH server has a *host key* that identifies it, and your account keeps a list of the keys it has seen (in `~/.ssh/known_hosts`). The first time, there is nothing to compare against, so SSH shows you the key's fingerprint and asks. Answering `yes` saves it. From then on, SSH checks it silently on every connection, and **refuses to connect** if the key ever changes. That protects you from a machine on the network pretending to be servera to collect your password.

{% callout type="warning" title="A changed host key is a real warning" %}
If SSH reports that a host key has changed, stop and find out why. In your lab it usually means you rebuilt a VM, and the fix is to remove the old key with `ssh-keygen -R servera`. On a real network, it can mean an attack.
{% /callout %}

In your lab, the key you set up in chapter 1 logs you in without a password. That is *key-based authentication*, which chapter 10 covers in full.

To leave the remote shell, type `exit` or press {% kbd %}Ctrl{% /kbd %}+{% kbd %}D{% /kbd %}. The prompt shows you are back where you started:

```console
[student@servera ~]$ exit
logout
Connection to servera closed.
[student@workstation ~]$
```

{% callout type="tip" title="Watch the hostname in the prompt" %}
It is easy to lose track of which machine you are on after a few SSH hops. The prompt always tells you. Before you run a command that changes something, glance at it.
{% /callout %}

## Check your understanding

{% quiz id="quick" objectives=["ch02.shell"] ref="quick" /%}
