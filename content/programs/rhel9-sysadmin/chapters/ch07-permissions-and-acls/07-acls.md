---
title: Access control lists
kind: lesson
minutes: 20
---

{% lead %}
Owner, group, other: three classes are often enough, and sometimes they are not. What if one file needs to be readable by an auditor who is not in the file's group, without making it readable by everyone? An **access control list** (ACL) adds extra entries for named users and groups, beyond the three classes.
{% /lead %}

{% objectives %}
- Explain when an ACL is needed, and recognise a file that has one.
- Read a `getfacl` listing, including the mask and effective permissions.
- Grant, change and remove access with `setfacl`, and use default ACLs for new files.
{% /objectives %}

## When owner, group and other are not enough

Imagine `/srv/reports/q3/summary.txt` is owned by maria, with mode `600`. The auditors group needs to read it, and only it. You could:

- make the file group-readable and change its group to `auditors`, but then maria's own group access is gone, or
- make it world-readable, which gives away too much.

An ACL solves it: keep the owner and group as they are, and add a single entry "group `auditors` may read". ACLs are supported on the file systems RHEL uses by default (XFS and ext4).

A file with an ACL shows a `+` after its permission string:

```console
[root@servera ~]# ls -l /srv/reports/q3/summary.txt
-rw-r-----+ 1 maria maria 8 Oct  3 16:14 /srv/reports/q3/summary.txt
```

## Reading an ACL

`getfacl` prints the whole list. Select an entry:

{% diagram ref="acl-lines" /%}

The first three entry types look like the ordinary permissions, with **named** user and group entries in between. The **mask** is the new idea: it is the ceiling for every entry except the owner and other. If a named entry says `rw-` but the mask is `r--`, the effective permission is `r--`, and `getfacl` tells you so with `#effective:`.

```console
[root@servera ~]# getfacl /srv/reports/q3/summary.txt
getfacl: Removing leading '/' from absolute path names
# file: srv/reports/q3/summary.txt
# owner: maria
# group: maria
user::rw-
group::---
group:auditors:r--
mask::r--
other::---
```

A subtle consequence: on a file with an ACL, the **group** digits of `ls -l` and `chmod` show and change the **mask**, not the owning group's entry. This is why `chmod g-w` on an ACL file can quietly reduce a named user's access.

## Setting and removing entries

`setfacl -m` modifies (adds or changes) an entry. The entry form is `type:name:permissions`, with `u` for user and `g` for group:

```console
[root@servera ~]# setfacl -m g:auditors:r /srv/reports/q3/summary.txt
[root@servera ~]# setfacl -m u:john:rX /srv/reports
[root@servera ~]# setfacl -x u:john /srv/reports         # remove one entry
[root@servera ~]# setfacl -b /srv/reports                # remove every extra entry
```

Useful details:

- **Execute on the way down.** Reading `summary.txt` also needs `x` on `/srv/reports` and `/srv/reports/q3`. Grant the auditors `rX` on the directories too: capital `X` gives execute to directories only.
- `-R` applies an entry to a whole tree, like `chmod -R`.
- Always **test as the user**, not as root: `su - priya -c 'cat /srv/reports/q3/summary.txt'`.

```console
[root@servera ~]# su - priya -c 'cat /srv/reports/q3/summary.txt'
figures
[root@servera ~]# su - priya -c 'echo no >> /srv/reports/q3/summary.txt'
-bash: line 1: /srv/reports/q3/summary.txt: Permission denied
```

## Default ACLs for new files

An ACL set on a directory controls that directory. To give **new** files and subdirectories the same entries automatically, set a **default ACL** with `-d` (or the prefix `d:`). Step through the idea:

{% diagram ref="default-acl" /%}

```console
[root@servera ~]# setfacl -d -m g:auditors:rX /srv/reports/q3
[maria@servera ~]$ touch /srv/reports/q3/new.txt
[maria@servera ~]$ getfacl -cp /srv/reports/q3/new.txt
user::rw-
group::---
group:auditors:r-x      #effective:r--
mask::r--
other::---
```

Notice `#effective:r--`. `touch` asked for `rw-rw-rw-`, the umask (022) removed group write, and on a file with an ACL the group bits become the **mask**: `r--`. That mask cut the inherited `r-x` down to `r--`. A default ACL is a *template*, limited by what the creating program asks for and by the umask. For a read-only entry like this one, that is exactly what you want.

## ACLs in practice

- **Prefer simple modes.** Use ACLs for real exceptions, not as the default for everything: they are harder to audit.
- **Back them up.** `cp` and `mv` may lose ACLs on the copy; `cp -p` and `tar --acls` keep them. To save and restore a whole tree's ACLs: `getfacl -R /srv/reports > acl.txt`, then, from `/`, `setfacl -P --restore=acl.txt`.
- **When access still fails,** check in this order: who you are (`id`), the whole path (`namei -l`), the mode and ACL (`ls -l`, `getfacl`), and finally the SELinux label (chapter 16). Don't try `chmod 777`: it hides the real cause and gives access to everyone.

## Check your understanding

{% quiz id="quick" objectives=["ch07.acls"] ref="quick" /%}
