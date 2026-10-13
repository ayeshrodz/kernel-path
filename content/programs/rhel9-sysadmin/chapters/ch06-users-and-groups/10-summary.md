---
title: "Linux users and groups cheat sheet"
seoTitle: "Linux users and groups Cheat Sheet (RHCSA)"
description: "Linux users and groups cheat sheet: the key commands and ideas on one page, with flashcards for revision. Free RHCSA study notes."
kind: summary
minutes: 5
---

{% lead %}
The chapter on one page: what to remember, the commands to have at your fingertips, and flashcards for quick revision.
{% /lead %}

## The chapter in eight sentences

- Every account has a **UID** and every group a **GID**: 0 is root, 1 to 999 are system accounts, and people start at 1000.
- Each user has one **primary group** (field 4 of `/etc/passwd`) and any number of **supplementary groups** (listed in `/etc/group`).
- `/etc/passwd` holds accounts, `/etc/group` groups, and the root-only `/etc/shadow` password hashes and ageing.
- `su -` becomes root with root's password; `sudo` runs commands as root with your own password, only if a rule allows it, and logs every one.
- Members of **wheel** have full sudo on RHEL; narrower rules go in `/etc/sudoers.d/NAME`, mode 440, checked with `visudo -c`.
- `useradd`, `usermod`, `userdel -r`, `groupadd`, `groupmod`, `groupdel` and `gpasswd` manage accounts; `usermod -aG` adds a group, `-G` alone replaces them all.
- `passwd` sets passwords; `chage` sets ageing (`-M`, `-m`, `-W`, `-I`), forces a change (`-d 0`) and expires accounts (`-E`).
- **Locking** (`usermod -L`) stops password logins only; **expiring** an account stops every login.

## Cheat sheet

{% tabs %}
  {% tab label="Accounts" %}

| Command | Does |
| --- | --- |
| `id USER` | UID, primary group and groups |
| `useradd [-u UID] [-g GROUP] [-G G1,G2] [-c TEXT] [-s SHELL] NAME` | Create an account |
| `usermod -aG GROUP NAME` | Add a supplementary group |
| `usermod -c TEXT`, `-s SHELL`, `-L`, `-U` | Comment, shell, lock, unlock |
| `userdel -r NAME` | Delete with home directory |
| `groupadd [-g GID] NAME`, `groupmod -n NEW OLD`, `groupdel NAME` | Groups |
| `gpasswd -a USER GROUP`, `gpasswd -d USER GROUP` | Add, remove a member |

  {% /tab %}
  {% tab label="Passwords" %}

| Command | Does |
| --- | --- |
| `passwd [USER]` | Set a password |
| `passwd -S USER` | Status: LK locked, PS set, NP none |
| `chage -l USER` | Show ageing as dates |
| `chage -M 90 -m 1 -W 7 USER` | Max, min, warning |
| `chage -d 0 USER` | Change at next login |
| `chage -E YYYY-MM-DD USER`, `chage -E 0 USER` | Expire on a date, now |
| `/etc/login.defs` | Defaults for new accounts |

  {% /tab %}
  {% tab label="Root access" %}

| Command | Does |
| --- | --- |
| `su -` | Root login shell (root's password) |
| `sudo CMD`, `sudo -i` | Run as root, root shell (your password) |
| `sudo -l` | What you may run |
| `%group ALL=(ALL) ALL` | Group may run anything |
| `user ALL=(ALL) /usr/bin/systemctl` | One command, any arguments |
| `NOPASSWD:` | Skip the password prompt |
| `visudo -c`, `visudo -cf FILE` | Check syntax |
| `/var/log/secure` | sudo's record |

  {% /tab %}
{% /tabs %}

## Flashcards

{% flashcards ref="flashcards" /%}
