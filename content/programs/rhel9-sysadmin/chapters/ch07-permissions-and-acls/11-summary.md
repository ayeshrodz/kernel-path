---
title: "Linux permissions and ACLs cheat sheet"
seoTitle: "Linux permissions and ACLs Cheat Sheet (RHCSA)"
description: "Linux permissions and ACLs cheat sheet: the key commands and ideas on one page, with flashcards for revision. Free RHCSA study notes."
kind: summary
minutes: 5
---

{% lead %}
The chapter on one page: what to remember, the commands to have at your fingertips, and flashcards for quick revision.
{% /lead %}

## The chapter in eight sentences

- Every file has an **owner**, a **group** and three permission sets: **user**, **group** and **other**. Only the first matching class applies.
- On a file, `r`, `w` and `x` mean read, change and run. On a directory they mean list, create or delete entries, and enter.
- Deleting a file needs write and execute on its **directory**; the file's own mode does not matter.
- `chmod` takes symbols (`u+x`, `g=r`) or an octal number (`r=4`, `w=2`, `x=1`, summed per class); capital `X` adds execute to directories only.
- `chown user:group` changes ownership; only root may give a file away.
- The **umask** removes bits from the requested mode: 666 for files, 777 for directories.
- **setgid** on a directory passes its group to new files, **sticky** stops users deleting each other's entries, and **setuid** runs a program as its owner.
- An **ACL** adds named users and groups; the **mask** caps them, and a **default ACL** is a template for new files.

## Cheat sheet

{% tabs %}
  {% tab label="Reading" %}

| Command | Does |
| --- | --- |
| `ls -l`, `ls -ld DIR` | Permissions of files, or of a directory itself |
| `stat -c "%A %a %U:%G %n" F` | Symbols, octal, owner, group |
| `id [USER]` | Who you are, and your groups |
| `namei -l PATH` | Permissions of every directory on the way |
| `getfacl F` | Full ACL, with the mask and effective access |

  {% /tab %}
  {% tab label="Changing" %}

| Command | Does |
| --- | --- |
| `chmod 640 F` | Set the mode with numbers |
| `chmod u=rw,g=r,o= F` | Set the mode with symbols |
| `chmod g+w F`, `chmod o-r F` | Change one thing |
| `chmod -R u=rwX,g=rX,o= DIR` | Recursive, without making files executable |
| `chown USER:GROUP F`, `chgrp GROUP F` | Change owner, group |
| `umask 027` | Defaults for new files (640) and directories (750) |

  {% /tab %}
  {% tab label="Special and ACL" %}

| Command | Does |
| --- | --- |
| `chmod 2770 DIR`, `chmod g+s DIR` | setgid: new files inherit the group |
| `chmod 1777 DIR`, `chmod +t DIR` | sticky: delete only your own |
| `find /usr -perm -4000` | List setuid programs |
| `setfacl -m u:NAME:r F` | Add or change a named entry |
| `setfacl -m g:NAME:rX DIR` | Same for a group; `X` = directories only |
| `setfacl -d -m u:NAME:r DIR` | Default ACL for new files |
| `setfacl -x u:NAME F`, `setfacl -b F` | Remove one entry, all entries |

  {% /tab %}
{% /tabs %}

## Flashcards

{% flashcards ref="flashcards" /%}
