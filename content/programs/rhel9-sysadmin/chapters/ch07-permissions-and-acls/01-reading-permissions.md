---
title: Reading file permissions
seoTitle: "Linux File Permissions Explained (rwx, ls -l)"
description: "Read rwx permissions for owner, group and others in ls -l, and how they apply to directories. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 15
---

{% lead %}
Every file and directory on a Linux system carries a small label saying who may read it, change it, or run it. Almost every "Permission denied" you will ever meet comes from this label, so learning to read it fluently is one of the most useful skills in this course.
{% /lead %}

{% objectives %}
- Read the permission string of `ls -l` and name the three user classes and the three permissions.
- Explain what read, write and execute mean on a file and, differently, on a directory.
- Work out which class applies to a user, and trace a "Permission denied" along the path with `namei -l`.
{% /objectives %}

## Who, and what

Linux asks two questions whenever a program touches a file: **who are you**, and **what is this file's label?** The label has three parts.

Every file has one **owner** (a user) and one **group owner**. That gives three **classes** of people:

| Class | Short name | Who it covers |
| --- | --- | --- |
| **user** | `u` | The owner of the file |
| **group** | `g` | Members of the file's group (but not the owner) |
| **other** | `o` | Everybody else |

Each class gets its own set of three **permissions**: **r**ead, **w**rite, **e**x**e**cute. `ls -l` shows all of this on one line. Select each part:

{% diagram ref="perm-line" /%}

A `-` in a permission slot means "not allowed". So `rw-r-----` reads as: the owner may read and write, the group may read, others may do nothing.

### What the permissions mean

The same letters mean different things on files and on directories. This difference explains most of the surprises:

| | On a **file** | On a **directory** |
| --- | --- | --- |
| **r** read | Read the contents (`cat`, `less`) | List the names inside (`ls`) |
| **w** write | Change the contents (editing, `>`) | Create, delete or rename entries inside, **if x is also set** |
| **x** execute | Run it as a program or script | Enter it (`cd`) and reach files inside **by name** |

Two consequences are worth remembering:

- **Deleting a file depends on the directory, not the file.** To remove `report.txt` you need write and execute on the directory that holds it. The file's own permissions are irrelevant.
- **A directory with `r` but no `x`** lets you see the names but not use them: `ls` lists them, with errors, and `cat` on any of them fails.

## Which class applies?

The system picks **one** class for you and uses only that. It checks in order, and stops at the first match:

1. Are you the **owner**? Use the user permissions.
2. Otherwise, are you in the **group**? Use the group permissions.
3. Otherwise, use **other**.

Step through an example:

{% diagram ref="order" /%}

Because the first match wins, an owner with `---` in the user slot is locked out of their own file even if the group slot says `rwx`. (As the owner, they can still change the mode and let themselves back in.)

**root** is the exception. The superuser bypasses read and write checks, which is why working as root is dangerous and why you test a permission setup as the *intended* user, not as root.

## See permissions in different ways

`ls -l` is the everyday view. `ls -ld DIR` shows a directory itself instead of its contents. `stat` prints the same facts in a form you can choose, including the **octal** number the next lesson explains:

```console
[student@servera ~]$ ls -l report.txt
-rw-r-----. 1 maria project 1024 Oct  3 10:15 report.txt
[student@servera ~]$ ls -ld /srv/project
drwxrws---. 2 root project 4096 Oct  3 10:15 /srv/project
[student@servera ~]$ stat -c "%A %a %U:%G %n" report.txt
-rw-r----- 640 maria:project report.txt
```

To know which groups you are in, run `id`. Group membership is read at login, so after being added to a group you must log in again for it to count.

## Follow the whole path

To open `/srv/project/plan.txt` you need `x` on `/`, on `/srv` and on `/srv/project`, **and** the right permission on the file. A perfect file mode is useless behind a closed directory. `namei -l` prints every step, with owner and permissions:

```console
[student@servera ~]$ namei -l /srv/project/plan.txt
f: /srv/project/plan.txt
drwxr-xr-x root root /
drwxr-xr-x root root srv
drwxrws--- root project project
                     plan.txt - No such file or directory
```

Read down the list for the first directory where your class lacks `x`. That is where the path is blocked.

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch07.reading"] ref="quick" /%}
