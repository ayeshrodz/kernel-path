---
title: Who may do what over NFS
seoTitle: "NFS Permissions, UIDs and root_squash Explained"
description: "Why NFS access depends on UIDs, what root_squash does and how to fix permission problems. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 20
---

{% lead %}
Mounting a share is the easy part. The questions that cause real trouble come afterwards: *Why can't this user write? Why do the file owners show as numbers? Why is root refused?* The answers all come from one fact: NFS does not carry user **names**, it carries user **numbers**. This lesson explains how access is decided, and how to find out which layer is refusing you.
{% /lead %}

{% objectives %}
- Explain why UIDs and GIDs must agree between client and server, and what `root_squash` does.
- Diagnose mount and access failures from their messages: firewall, exports, permissions, read-only.
- Name the SELinux booleans for NFS and the mount options you will meet.
{% /objectives %}

## Numbers, not names

When a client user opens a file, the request carries that user's numeric UID and GIDs. The server compares them with the owner, group and mode of the file, just as if the same user were logged in there. The names in `/etc/passwd` play no role.

{% diagram ref="uid-mapping" /%}

```console
[student@servera mnt]$ id -u
1000
[student@servera shared]$ echo "from servera as student" > st.txt
[student@servera shared]$ ls -ln
total 12
drwxr-xr-x. 2 2001 2001 4096 Oct  3 18:48 alice
-rw-r--r--. 1    0    0   12 Oct  3 18:47 hello.txt
-rw-r--r--. 1 1000 1000   24 Oct  3 18:48 st.txt
[student@servera shared]$ ls -l
total 12
drwxr-xr-x. 2    2001    2001 4096 Oct  3 18:48 alice
-rw-r--r--. 1 root    root      12 Oct  3 18:47 hello.txt
-rw-r--r--. 1 student student   24 Oct  3 18:48 st.txt
[student@servera shared]$ echo x > alice/hack.txt
bash: alice/hack.txt: Permission denied
```

`ls -ln` shows the raw numbers. `student` is UID 1000 on both machines, so everything behaves naturally. The server has a user `alice` with UID 2001 and servera has none, so `ls -l` can only show the number 2001. Alice's directory is mode 755: student, a different number, cannot write there.

The practical rules:

- Create users with **the same UID and GID on every machine** that mounts the share (or use a central directory service such as LDAP, which is beyond this course).
- Set ownership and modes **on the server** (`chown`, `chmod`; a setgid directory for group work, chapter 7). You cannot repair permission problems from a client.
- Do not use `chmod 777` to make a mismatch disappear.

### What happens to root

On the server, requests that arrive as UID 0 (root on the client) are mapped to the unprivileged user `nobody`. This is **root_squash**, the default, and it is a good thing: an administrator on any client machine cannot read or change every file on the server. A root-owned directory with mode 755 is thus read-only for the client's root.

The exceptions are options on the export line, used with great care: `no_root_squash` gives client root real root rights over that export, and `all_squash` maps every user to `nobody` (useful for a public read-only share).

## Reading the error

{% diagram ref="diagnose" /%}

Work from the outside in: reachability and the firewall, then the export list, then permissions. The tools:

| Where | Command |
| --- | --- |
| Server | `exportfs -v` (exports and options), `firewall-cmd --list-services`, `ss -tln \| grep 2049`, `ls -ln DIR`, `journalctl -u nfs-server` |
| Client | `mount \| grep nfs`, `nfsstat -m`, `id`, `ls -ln` |

## SELinux and NFS

Two SELinux decisions matter. On the **server**, the booleans `nfs_export_all_rw` and `nfs_export_all_ro` (both on by default) let the NFS server export directories with ordinary labels. On the **client**, programs that use files from an NFS mount are affected by booleans too: for instance `use_nfs_home_dirs` (allow logins to use home directories on NFS) and `httpd_use_nfs` (let the web server read files from an NFS mount). If a service works on local disks but not on the share, the booleans are the first thing to check (chapter 16): `getsebool -a | grep nfs`.

## Mount options you will meet

| Option | Meaning |
| --- | --- |
| `ro`, `rw` | Mount read-only / read-write |
| `vers=4.2` (or `4`) | Force a protocol version; the default negotiates the highest |
| `sec=sys` | Trust the numeric IDs sent by the client (the default) |
| `hard` (default), `soft` | On server failure, wait forever / give up with an error. `soft` can corrupt data; avoid it for writes |
| `noexec`, `nosuid`, `nodev` | The usual protections |
| `sync` | Writes go to the server immediately |

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch19.access"] ref="quick" /%}
