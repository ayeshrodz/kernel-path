---
title: Default permissions and shared directories
kind: lesson
minutes: 20
---

{% lead %}
`chmod` fixes a file you already have. But what permissions does a brand-new file get, and how do you build a directory where a whole team can work together without constantly fixing ownership? Two ideas answer both questions: the **umask** and the **special permissions**.
{% /lead %}

{% objectives %}
- Explain how the umask turns a requested mode into the mode of a new file or directory, and change it.
- Describe setuid, setgid and the sticky bit, and recognise them in `ls -l`.
- Build a shared team directory with `setgid`, and a drop box with the sticky bit.
{% /objectives %}

## The umask

When a program creates a file, it asks for a mode: **666** for ordinary files (read and write for everyone, never execute) and **777** for directories. The system then removes the bits named in the **umask**. Step through an example:

{% diagram ref="umask" /%}

Show or set the umask for the current shell with the `umask` command:

```console
[student@servera ~]$ umask
0022
[student@servera ~]$ umask 027
[student@servera ~]$ touch f1; mkdir d1; ls -ld f1 d1
-rw-r-----. 1 student student 0 Oct  3 16:08 f1
drwxr-x---. 2 student student 4096 Oct  3 16:08 d1
```

The usual umasks, and what they give:

| umask | New files | New directories | Use |
| --- | --- | --- | --- |
| `022` | 644 | 755 | RHEL default: everyone may read |
| `027` | 640 | 750 | Group may read, others nothing |
| `077` | 600 | 700 | Private: only the owner |
| `002` / `007` | 664 / 660 | 775 / 770 | Team work: the group may write |

A shell's umask lasts until you log out. To change it permanently, put the `umask` command in `~/.bashrc` (or in `/etc/profile.d/` for everyone). It never changes files that already exist, and a program can still choose a stricter mode on purpose, such as an SSH key at 600.

## Special permissions

Beyond read, write and execute there are three extra bits. They share a leading fourth digit in octal modes, so `chmod 2770 dir` sets setgid (2) with `rwxrwx---`.

{% diagram ref="special" /%}

| Bit | Symbol | Octal | On a file | On a directory |
| --- | --- | --- | --- | --- |
| **setuid** | `u+s` | 4 | Runs with the **owner's** identity | No effect |
| **setgid** | `g+s` | 2 | Runs with the **group's** identity | New files get the **directory's group** |
| **sticky** | `+t` | 1 | No effect | Only an entry's owner (or root) may delete or rename it |

You can see them in `ls -l`, as an `s` or `t` replacing the `x` in that position. A capital `S` or `T` means the bit is set but the `x` underneath is not.

```console
[student@servera ~]$ ls -l /usr/bin/passwd
-rwsr-xr-x. 1 root root 32656 May 14  2022 /usr/bin/passwd
[student@servera ~]$ ls -ld /tmp
drwxrwxrwt. 11 root root 4096 Oct  3 16:08 /tmp
```

`passwd` is setuid root: whoever runs it acts as root for the duration, which is how an ordinary user can update `/etc/shadow`. Find every such program with `find /usr -perm -4000`. Setuid root is powerful and risky, so don't add it to your own tools. A password change for one user does not need a general-purpose escape hatch.

## A shared directory for a team

Say maria and john, both in group `team`, share `/srv/team`. Start with the obvious part:

```console
[root@servera ~]# mkdir /srv/team
[root@servera ~]# chgrp team /srv/team
[root@servera ~]# chmod 770 /srv/team
```

It works, but when maria creates a file, it belongs to her private group, not `team`. The group cannot touch it:

```console
[maria@servera ~]$ touch /srv/team/a; ls -l /srv/team/a
-rw-r--r--. 1 maria maria 0 Oct  3 16:13 /srv/team/a
```

**Setgid on the directory** fixes the group. New files and subdirectories inherit `team`, and new subdirectories get setgid too:

```console
[root@servera ~]# chmod g+s /srv/team
[root@servera ~]# ls -ld /srv/team
drwxrws---. 2 root team 4096 Oct  3 16:13 /srv/team
[maria@servera ~]$ touch /srv/team/b; mkdir /srv/team/sub; ls -l /srv/team
-rw-r--r--. 1 maria team     0 Oct  3 16:13 b
drwxr-sr-x. 2 maria team  4096 Oct  3 16:13 sub
```

Now the group is right, but john still cannot **write** to `b`, because the file is `644`: the umask removed group write. The second ingredient is a group-friendly umask, `002` or `007`, for the team members; or a default ACL, which the next lesson introduces. Both are needed for real collaboration.

{% callout type="tip" title="Two jobs, two tools" %}
**setgid** decides which *group* owns new files. The **umask** decides which *permissions* they get. Teams need both.
{% /callout %}

## A drop box with the sticky bit

In a directory everyone can write to, like `/tmp`, anyone could delete anyone else's files, because deleting needs only write permission on the directory. The **sticky bit** closes that hole:

```console
[root@servera ~]# chmod +t /srv/team
[root@servera ~]# ls -ld /srv/team
drwxrws--T. 3 root team 4096 Oct  3 16:13 /srv/team
[john@servera ~]$ rm -f /srv/team/c
rm: cannot remove '/srv/team/c': Operation not permitted
```

Anyone may still create entries, but each person can delete only their own. `1777` (`rwxrwxrwt`) is the classic mode for a public drop directory.

## Check your understanding

{% quiz id="quick" objectives=["ch07.defaults"] ref="quick" /%}
