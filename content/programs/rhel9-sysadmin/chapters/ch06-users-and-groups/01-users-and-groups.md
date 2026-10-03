---
title: Users, groups and the account files
kind: lesson
minutes: 15
---

{% lead %}
Every file on a Linux system is owned by a user, and every program runs as one. Users are how the system decides who may do what, and groups let you give the same access to several users at once. This lesson explains how Linux identifies them, and the three text files where it keeps them.
{% /lead %}

{% objectives %}
- Explain what users, UIDs, groups and GIDs are, and the difference between a primary and a supplementary group.
- Tell regular users, system users and root apart by their UIDs.
- Read every field of `/etc/passwd`, `/etc/group` and `/etc/shadow`.
{% /objectives %}

## Users and UIDs

A **user account** is an identity the system uses to grant or refuse access. People log in with accounts, and services such as the SSH server or chrony run under accounts of their own, so that a fault in one service can't reach files belonging to another.

Internally the system knows each account by a number, its **user ID** (UID). The name is only for humans. `id` shows yours:

```console
[student@servera ~]$ id
uid=1000(student) gid=1000(student) groups=1000(student),10(wheel)
[student@servera ~]$ id root
uid=0(root) gid=0(root) groups=0(root)
```

`ps` shows which account each running process belongs to:

```console
[student@servera ~]$ ps -eo user,pid,comm | head -4
USER         PID COMMAND
root           1 systemd
root           2 kthreadd
root           3 pool_workqueue_
```

UIDs fall into ranges, set in `/etc/login.defs`:

| UID | Kind of account |
| --- | --- |
| **0** | `root`, the superuser, who can override every permission |
| 1 to 200 | System accounts that RHEL itself assigns to its own services |
| 201 to 999 | System accounts for services, created when packages are installed; they own no interactive login |
| **1000** and up | Regular users: people |

## Groups and GIDs

A **group** is a named set of users, identified by a **group ID** (GID). Groups exist to share access: give a group access to a directory, and every member has it.

Every user has exactly one **primary group**. By default, `useradd` creates a group with the same name as the user (a *user private group*), so `student`'s primary group is `student`. Files a user creates belong to their primary group.

A user can also belong to any number of **supplementary groups**. `student` is in `wheel`, which is what lets it use `sudo`, as the next lesson explains.

## The account files

Local accounts live in three text files under `/etc`. You will rarely edit them directly, because commands such as `useradd` do it safely, but you will read them constantly.

### /etc/passwd

One line per account, seven fields separated by colons. Select a field:

{% diagram ref="passwd-line" /%}

Anyone may read `/etc/passwd`, because programs need it to turn UIDs into names. That is why it holds no passwords.

### /etc/group

One line per group, four fields:

{% diagram ref="group-line" /%}

The member list holds only **supplementary** members. A user whose primary group this is does not appear in it, so `student` is not listed on the `student` line.

### /etc/shadow

Password hashes and password ageing live in `/etc/shadow`, which only root can read. Nine fields:

{% diagram ref="shadow-line" /%}

```console
[student@servera ~]$ sudo grep student /etc/shadow
student:$6$HpuC6VXAmuC/uSTT$wB1lde9khm3IzKsap6Y5Y62nMQIyTnuE53TB7sEZUetBgo25xDljAS..rrdVKYznlLm.Va5/WwHSfYLCeqkhc.:20729:0:99999:7:::
```

The second field is not the password but a **hash** of it: `$6$` means SHA-512, then comes a random *salt*, then the hash itself. When you log in, the system hashes what you typed with the same salt and compares the results, so the password itself is never stored. Two special values: `!!` means no password has ever been set, and a leading `!` means the password is **locked**.

{% callout type="tip" title="Days since 1970" %}
The dates in `/etc/shadow` are counted in days since 1 January 1970. 20729 is 3 October 2026. You never need to calculate them: `chage -l USER` shows them as dates, as the passwords lesson shows.
{% /callout %}

## Check your understanding

{% quiz id="quick" objectives=["ch06.concepts"] ref="quick" /%}
