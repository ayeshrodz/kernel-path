---
title: Hard links and symbolic links
kind: lesson
minutes: 15
---

{% lead %}
A file can have more than one name. Linux offers two ways to do it: a hard link, which is a second name for the same data, and a symbolic link, which is a small file that points to another name. They look alike in daily use but behave very differently when the original is moved or deleted.
{% /lead %}

{% objectives %}
- Explain how a file name, its inode and its data relate, and read the link count in `ls -l`.
- Create hard links and symbolic links with `ln` and `ln -s`, and recognise each in a listing.
- Predict what happens to each kind of link when the original name is removed, and know their limits.
{% /objectives %}

## Names, inodes and data

On a Linux file system, a file's name and the file itself are separate things. The file is an **inode**: a numbered record holding its owner, permissions, time stamps and where its data is on disk. A directory is just a list of names, each pointing to an inode number. `ls -i` shows the inode numbers:

{% diagram ref="links-model" /%}

## Hard links: a second name

`ln EXISTING NEWNAME` adds another name for the same inode. Both names are equally real: neither is the "original" any more. The link count in `ls -l` (the number after the permissions) goes up:

```console
[student@servera ~]$ echo "Release checklist" > checklist.txt
[student@servera ~]$ ln checklist.txt /tmp/checklist-copy.txt
[student@servera ~]$ ls -li checklist.txt /tmp/checklist-copy.txt
261894 -rw-r--r--. 2 student student 18 Oct  3 09:58 checklist.txt
261894 -rw-r--r--. 2 student student 18 Oct  3 09:58 /tmp/checklist-copy.txt
```

Same inode number, link count 2. Change the content through one name and the other shows the change, because there is only one file:

```console
[student@servera ~]$ echo "1. Back up the database" >> /tmp/checklist-copy.txt
[student@servera ~]$ cat checklist.txt
Release checklist
1. Back up the database
```

(`>>` adds a line to the end of a file; chapter 5 explains it.) Removing a name only removes that name. The data stays until the **last** name is gone:

```console
[student@servera ~]$ rm checklist.txt
[student@servera ~]$ ls -l /tmp/checklist-copy.txt
-rw-r--r--. 1 student student 42 Oct  3 09:58 /tmp/checklist-copy.txt
```

Hard links have two limits:

```console
[student@servera ~]$ ln /var/log loghard
ln: /var/log: hard link not allowed for directory
[student@servera ~]$ ln note.txt /dev/shm/note.txt
ln: failed to create hard link '/dev/shm/note.txt' => 'note.txt': Invalid cross-device link
```

- They work for files only, never directories.
- Both names must be on the **same file system**, because an inode number only means something within its own file system. `df` shows which file system a directory is on: here `/home` is on `/dev/sda2` and `/dev/shm` is a separate in-memory one.

## Symbolic links: a pointer to a name

`ln -s TARGET LINKNAME` creates a **symbolic link** (or *soft link*): a tiny file whose content is just a path. Opening the link opens whatever that path leads to. In `ls -l` it starts with `l` and shows `->` and its target:

```console
[student@servera ~]$ ln -s /tmp/checklist-copy.txt latest.txt
[student@servera ~]$ ls -l latest.txt
lrwxrwxrwx. 1 student student 23 Oct  3 09:58 latest.txt -> /tmp/checklist-copy.txt
[student@servera ~]$ cat latest.txt
Release checklist
1. Back up the database
```

Symbolic links have neither of the hard link's limits: they can point to directories and across file systems. The price is that they point to a *name*, not to the data. Remove or rename the target and the link **dangles**:

```console
[student@servera ~]$ rm /tmp/checklist-copy.txt
[student@servera ~]$ cat latest.txt
cat: latest.txt: No such file or directory
```

The link still exists, still pointing at a name that no longer exists. Create a new file with that name and the link works again, pointing at the new file.

### Links to directories

A symbolic link to a directory behaves like the directory. `cd` into it and `pwd` shows the path you came through; `pwd -P` shows the real one:

```console
[student@servera ~]$ ln -s /var/log logs
[student@servera ~]$ cd logs
[student@servera logs]$ pwd
/home/student/logs
[student@servera logs]$ pwd -P
/var/log
```

You saw this pattern at the start of the chapter: `/bin` is a symbolic link to `usr/bin`. `readlink LINK` prints where a link points, and `readlink -f` follows every link to the final real path.

## Which one to use

| | Hard link | Symbolic link |
| --- | --- | --- |
| Points to | The data (inode) | A name (path) |
| Directories | No | Yes |
| Across file systems | No | Yes |
| Original removed | Still works | Dangles |
| Looks like | An ordinary file (`-`, link count 2+) | `l`, with `-> target` |

In practice, symbolic links are what you will create most: a short name for a deep directory, a stable name such as `current` that you repoint at each new release, or a compatibility name like `/bin`. Hard links appear in backup tools, which use them to store identical files only once.

## Check your understanding

{% quiz id="quick" objectives=["ch03.links"] ref="quick" /%}
