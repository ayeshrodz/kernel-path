---
title: Passwords and password ageing
kind: lesson
minutes: 15
---

{% lead %}
Setting a password is one command. Looking after passwords over time is policy: how often they must change, how long a user is warned, what happens if they ignore it, and when a temporary account should stop working on its own. This lesson covers both.
{% /lead %}

{% objectives %}
- Set passwords for yourself and others with `passwd`, and force a change at the next login.
- Read and set password ageing with `chage`, and explain each limit on a timeline.
- Lock and unlock passwords, and make an account expire on a date.
{% /objectives %}

## Set a password

Any user can change their own password with `passwd`, which asks for the current one first. root can set anyone's password without knowing the old one:

```console
[root@servera ~]# passwd ops1
Changing password for user ops1.
New password:
Retype new password:
passwd: all authentication tokens updated successfully.
```

RHEL checks new passwords for strength. Ordinary users must choose a password that passes; root only gets a warning, such as `BAD PASSWORD: The password fails the dictionary check - it is based on a dictionary word`, and may go ahead anyway.

For scripts, `passwd --stdin` reads the new password from standard input: `echo 'S3cure-pass' | passwd --stdin ops1`. Mind that the password then appears in the shell history.

## Password ageing

Each account has ageing settings in `/etc/shadow`. `chage -l` shows them as dates:

```console
[root@servera ~]# chage -l ops1
Last password change					: Oct 03, 2026
Password expires					: never
Password inactive					: never
Account expires						: never
Minimum number of days between password change		: 0
Maximum number of days between password change		: 99999
Number of days of warning before password expires	: 7
```

Step through the life of a password with a 90-day maximum:

{% diagram ref="ageing" /%}

`chage` sets the limits; each option matches one step:

| Option | Sets |
| --- | --- |
| `-m DAYS` | Minimum days before the password may change again |
| `-M DAYS` | Maximum days a password stays valid |
| `-W DAYS` | Days of warning before it expires |
| `-I DAYS` | Days after expiry until the account is disabled |
| `-E YYYY-MM-DD` | The date the whole account expires (`-E -1` removes it) |
| `-d 0` | Pretend the password was never changed: forces a change at the next login |

```console
[root@servera ~]# chage -M 90 -m 1 -W 7 ops1
[root@servera ~]# chage -l ops1
Last password change					: Oct 03, 2026
Password expires					: Jan 01, 2027
Password inactive					: never
Account expires						: never
Minimum number of days between password change		: 1
Maximum number of days between password change		: 90
Number of days of warning before password expires	: 7
```

Run `chage USER` with no options and it asks for each value in turn.

### Defaults for new accounts

`chage` changes existing accounts. New accounts take their ageing from `/etc/login.defs`, where `PASS_MAX_DAYS`, `PASS_MIN_DAYS` and `PASS_WARN_AGE` set the defaults. Changing the file affects only accounts created afterwards.

## Force a change at the next login

When you set a temporary password for someone, make them choose their own straight away:

```console
[root@servera ~]# chage -d 0 ops1
[root@servera ~]# chage -l ops1 | head -2
Last password change					: password must be changed
Password expires					: password must be changed
```

At their next login, ops1 is told the password has expired and must set a new one before getting a shell.

## Lock an account

To stop someone logging in with their password, without deleting anything, lock it. Locking puts a `!` in front of the hash so it can never match:

```console
[root@servera ~]# usermod -L ops1
[root@servera ~]# passwd -S ops1
ops1 LK 1970-01-01 1 90 7 -1 (Password locked.)
[root@servera ~]# usermod -U ops1
[root@servera ~]# passwd -S ops1
ops1 PS 1970-01-01 1 90 7 -1 (Password set, SHA512 crypt.)
```

`passwd -l` and `passwd -u` do the same. A lock blocks **password** logins only: someone with an SSH key can still get in. To stop every kind of login, also expire the account.

## Expire an account

`chage -E` (or `usermod -e`) sets a date after which the account can't be used at all, which suits contractors and temporary staff:

```console
[root@servera ~]# chage -E 2027-01-01 ops1
[root@servera ~]# chage -l ops1 | grep 'Account expires'
Account expires						: Jan 01, 2027
```

To end access immediately, expire it in the past: `chage -E 0 ops1`.

## Check your understanding

{% quiz id="quick" objectives=["ch06.passwords"] ref="quick" /%}
