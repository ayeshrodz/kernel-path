---
title: Become root safely
seoTitle: "sudo vs su in Linux, and the sudoers File"
description: "Become root safely with su and sudo, and grant limited rights with a sudoers drop-in file. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 20
---

{% lead %}
Administration needs root's power: installing software, creating users, changing system settings. Logging in as root for everything is risky, so Linux offers two ways to borrow that power when you need it: `su` to switch to another account, and `sudo` to run one command with root's privileges, with every use recorded. RHEL is set up for sudo, and so is your lab.
{% /lead %}

{% objectives %}
- Explain why you avoid working as root, and switch accounts with `su` and `su -`.
- Run commands as root with `sudo` and `sudo -i`, and check what you are allowed to run with `sudo -l`.
- Grant sudo access with a file in `/etc/sudoers.d`, check it with `visudo`, and read sudo's log.
{% /objectives %}

## Why not just log in as root?

root can read, change and delete anything, and the system never asks "are you sure?". One typo in a root shell, such as a stray space in an `rm -rf`, can destroy a server. Working as an ordinary user and raising your privileges only for the commands that need them limits the damage of mistakes, and of malicious software you might run by accident.

There is a second reason: accountability. If several administrators share root's password, the logs can't say who did what. With sudo, each person uses their own password and every command is logged under their name.

## su: switch user

`su USER` starts a shell as another user, after asking for **that user's** password. Without a user name it means root:

```console
[student@servera ~]$ su
Password:
[root@servera student]# pwd
/home/student
[root@servera student]# exit
exit
[student@servera ~]$ su -
Password:
[root@servera ~]# pwd
/root
```

The dash matters. `su -` starts a **login shell**: a clean environment, root's `PATH`, root's home directory, root's startup files, exactly as if root had logged in. Plain `su` keeps most of your own environment, which leads to confusing results. Use `su -`.

## sudo: run one command as root

`sudo COMMAND` runs a single command as root, after asking for **your own** password. It then remembers for five minutes, so a series of commands doesn't ask every time.

```console
[student@servera ~]$ sudo grep student /etc/shadow
[sudo] password for student:
student:$6$HpuC6VXAmuC/uSTT$wB1lde…:20729:0:99999:7:::
```

| | `su -` | `sudo COMMAND` | `sudo -i` |
| --- | --- | --- | --- |
| Becomes | root (or any user) | root, for one command | root, until you `exit` |
| Asks for | root's password | your password | your password |
| Who may use it | anyone who knows root's password | users the sudo rules allow | users the sudo rules allow |
| Logged | only that a switch happened | every command, with your name | that you started a shell |

`sudo -i` gives you a root login shell when you have several things to do, like `su -` but with your own password. `sudo -l` lists what you may run.

```console
[student@servera ~]$ sudo -l
...output omitted...
User student may run the following commands on servera:
    (ALL) ALL
```

### Who may use sudo?

Not everyone. A user without a rule is refused, and the attempt is logged:

```console
[tester@servera ~]$ sudo id
[sudo] password for tester:
tester is not in the sudoers file.
```

On RHEL, members of the **wheel** group may run any command as root. That rule is why `student`, a member of `wheel`, can use sudo in your lab.

## The sudo rules

The rules live in `/etc/sudoers`, plus every file in `/etc/sudoers.d`. This is the line that empowers `wheel`; select each part:

{% diagram ref="sudoers-line" /%}

A few more examples:

| Rule | Allows |
| --- | --- |
| `alice ALL=(ALL) ALL` | user alice: any command as any user |
| `%webadmins ALL=(ALL) /usr/bin/systemctl restart httpd` | group webadmins: only that one command |
| `%ops ALL=(ALL) NOPASSWD: /usr/bin/systemctl status *` | group ops: any `systemctl status`, without a password prompt |

Commands must be given with their full path, and `*` matches any arguments. A user asking for anything else is refused, as `tester` was when trying more than the rule allowed:

```console
[tester@servera ~]$ sudo systemctl restart sshd
Sorry, user tester is not allowed to execute '/bin/systemctl restart sshd' as root on servera.lab.example.com.
```

### Add a rule safely: /etc/sudoers.d and visudo

Never edit `/etc/sudoers` directly: one syntax error there can lock **everyone** out of sudo, including you. Instead:

1. Put each rule in its own file under `/etc/sudoers.d`, named after who it is for, for example `/etc/sudoers.d/ops`.
2. Make it readable by root only: `chmod 440`.
3. Check it with `visudo -cf FILE` before relying on it, or edit it with `visudo -f FILE`, which refuses to save a broken file.

```console
[root@servera ~]# visudo -cf /tmp/broken
/tmp/broken:1:14: syntax error
ops ALL=(ALL ALL
             ^~~
[root@servera ~]# visudo -c
/etc/sudoers: parsed OK
/etc/sudoers.d/tester: parsed OK
```

`visudo -c` checks the main file and every drop-in at once.

{% callout type="warning" title="Keep a way back in" %}
Before changing sudo rules on a real server, keep a root shell open in another terminal until you have tested the change. In your lab, `rht-vmctl reset` is the safety net.
{% /callout %}

### sudo keeps a record

Every sudo command, allowed or refused, is logged to `/var/log/secure`:

```console
[root@servera ~]# grep tester /var/log/secure | grep sudo
Oct  3 10:31:49 servera sudo[1135]:  tester : user NOT in sudoers ; TTY=pts/0 ; PWD=/home/tester ; USER=root ; COMMAND=/bin/id
Oct  3 10:32:34 servera sudo[1189]:  tester : TTY=pts/1 ; PWD=/home/tester ; USER=root ; COMMAND=/usr/bin/systemctl status sshd
Oct  3 10:32:34 servera sudo[1194]:  tester : command not allowed ; TTY=pts/1 ; PWD=/home/tester ; USER=root ; COMMAND=/bin/systemctl restart sshd
```

## Check your understanding

{% quiz id="quick" objectives=["ch06.superuser"] ref="quick" /%}
