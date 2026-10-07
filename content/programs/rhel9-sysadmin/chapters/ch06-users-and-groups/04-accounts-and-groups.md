---
title: Manage accounts and groups
seoTitle: "useradd, usermod, groupadd and userdel Examples"
description: "Create, change and delete Linux user accounts and groups with useradd, usermod and groupadd. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 20
---

{% lead %}
Four commands cover the life of a user account (create, change, lock, delete) and three do the same for groups. They edit the account files for you, safely and consistently, so you never need to edit /etc/passwd by hand.
{% /lead %}

{% objectives %}
- Create accounts with `useradd` and its common options, and explain what it does behind the scenes.
- Change accounts with `usermod`, including adding supplementary groups without removing existing ones, and delete them with `userdel`.
- Create, rename, delete and manage the members of groups with `groupadd`, `groupmod`, `groupdel` and `gpasswd`.
{% /objectives %}

All of these commands need root, so run them with `sudo` or from a root shell.

## Create an account

```console
[root@servera ~]# useradd ops1
[root@servera ~]# id ops1
uid=1001(ops1) gid=1001(ops1) groups=1001(ops1)
```

One short command does a lot. Step through it:

{% diagram ref="useradd-steps" /%}

The defaults come from `/etc/login.defs` (UID ranges, home directory mode, password ageing defaults) and `/etc/default/useradd`:

```console
[root@servera ~]# grep -E '^(UID_MIN|UID_MAX|HOME_MODE|CREATE_HOME|PASS_MAX_DAYS)' /etc/login.defs
HOME_MODE	0700
PASS_MAX_DAYS	99999
UID_MIN                  1000
UID_MAX                 60000
CREATE_HOME	yes
```

The new account can't log in yet: its password field is `!!`, no password set. `passwd ops1` sets one (the passwords lesson covers it).

### Options you will use

| Option | Sets |
| --- | --- |
| `-c "Full Name"` | The comment field |
| `-u UID` | A specific UID instead of the next free one |
| `-g GROUP` | The primary group, instead of a new private group |
| `-G g1,g2` | Supplementary groups |
| `-s SHELL` | The login shell, such as `/sbin/nologin` for a service account |
| `-d DIR` | A home directory other than `/home/NAME` |
| `-M` / `-m` | Don't create / do create the home directory |

```console
[root@servera ~]# useradd -u 3050 -g devteam -G wheel -c "Deploy robot" -s /sbin/nologin deploy
[root@servera ~]# grep deploy /etc/passwd
deploy:x:3050:30000:Deploy robot:/home/deploy:/sbin/nologin
[root@servera ~]# id deploy
uid=3050(deploy) gid=30000(devteam) groups=30000(devteam),10(wheel)
```

## Change an account

`usermod` takes the same options as `useradd`, plus a few of its own:

| Command | Does |
| --- | --- |
| `usermod -c "Operations One" ops1` | Change the comment |
| `usermod -s /bin/bash ops1` | Change the login shell |
| `usermod -aG devteam,wheel ops1` | **Add** supplementary groups |
| `usermod -G devteam ops1` | **Replace** all supplementary groups with this list |
| `usermod -L ops1` / `usermod -U ops1` | Lock / unlock the password |
| `usermod -l newname ops1` | Rename the login |

```console
[root@servera ~]# usermod -aG devteam,wheel ops1
[root@servera ~]# id ops1
uid=1001(ops1) gid=1001(ops1) groups=1001(ops1),10(wheel),30000(devteam)
```

{% callout type="warning" title="-G without -a replaces" %}
`usermod -G devteam ops1` sets ops1's supplementary groups to **only** `devteam`, silently removing `wheel` and every other one. When you mean "also join this group", always write `-aG`.
{% /callout %}

A user who is logged in while you change their groups keeps the old set until they log out and back in, because group membership is read at login.

## Groups

| Command | Does |
| --- | --- |
| `groupadd devteam` | Create a group with the next free GID |
| `groupadd -g 30000 devteam` | Create it with a specific GID |
| `groupmod -n developers devteam` | Rename it (the GID stays) |
| `groupmod -g 30001 developers` | Change its GID |
| `gpasswd -a ops1 developers` | Add a member |
| `gpasswd -d ops1 developers` | Remove a member |
| `groupdel developers` | Delete it |

```console
[root@servera ~]# groupadd -g 30000 devteam
[root@servera ~]# grep devteam /etc/group
devteam:x:30000:
[root@servera ~]# groupmod -n developers devteam
[root@servera ~]# gpasswd -d ops1 developers
Removing user ops1 from group developers
[root@servera ~]# groupdel developers
groupdel: cannot remove the primary group of user 'deploy'
```

`groupdel` refuses to delete a group that is still some account's primary group: change that account's primary group first, or delete the account.

## Delete an account

`userdel NAME` removes the account from the account files, but leaves its home directory and mail spool. `userdel -r NAME` removes those too:

```console
[root@servera ~]# userdel deploy
[root@servera ~]# groupdel developers
[root@servera ~]# userdel -r ops1
[root@servera ~]# ls /home
deploy  student
```

With `deploy` gone, `groupdel` now succeeds. `/home/deploy` was left behind, still owned by UID 3050. If a new account later receives that UID, it silently inherits those files, so either use `-r`, or move the files somewhere safe and give them a new owner. Chapter 17 shows how to find files that no account owns, with `find / -nouser`.

## Check your understanding

{% quiz id="quick" objectives=["ch06.accounts"] ref="quick" /%}
