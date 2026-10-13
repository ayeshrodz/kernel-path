---
title: Changing permissions and ownership
seoTitle: "chmod and chown Explained With Examples"
description: "Change permissions with symbolic and octal chmod, ownership with chown and chgrp, and use capital X. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 20
---

{% lead %}
Reading permissions is half the job. This lesson covers the other half: changing the mode with `chmod`, and changing the owner and group with `chown` and `chgrp`. You will meet the two ways to write a mode, symbols and numbers, and one recursive trap that catches almost everyone once.
{% /lead %}

{% objectives %}
- Change permissions with `chmod` using both symbolic and octal modes.
- Change the owner and group of files with `chown` and `chgrp`.
- Apply changes to a whole tree safely with `-R` and the capital `X`.
{% /objectives %}

## chmod with symbols

`chmod` takes a description of the change, then the file names. The symbolic form says **who**, an **operator** and **what**:

| Part | Choices |
| --- | --- |
| **who** | `u` owner, `g` group, `o` others, `a` all three |
| **operator** | `+` add, `-` remove, `=` set exactly |
| **what** | any of `r`, `w`, `x` |

Examples, one change at a time:

```console
[root@servera tmp]# ls -l f.txt
-rw-r--r--. 1 root root 3 Oct  3 16:08 f.txt
[root@servera tmp]# chmod u+x,g-r,o+w f.txt
[root@servera tmp]# ls -l f.txt
-rwx----w-. 1 root root 3 Oct  3 16:08 f.txt
[root@servera tmp]# chmod u=rw,g=r,o= f.txt
[root@servera tmp]# ls -l f.txt
-rw-r-----. 1 root root 3 Oct  3 16:08 f.txt
```

Use `+` and `-` when you want to change one thing and leave the rest alone. Use `=` when you want a precise result: `o=` with nothing after it means "others get nothing".

## chmod with numbers

The same permissions can be written as three digits, one per class. Each digit is the **sum** of the values of its permissions: read is 4, write is 2, execute is 1.

{% diagram ref="octal" /%}

| Digit | Permissions | Digit | Permissions |
| --- | --- | --- | --- |
| 7 | `rwx` | 3 | `-wx` |
| 6 | `rw-` | 2 | `-w-` |
| 5 | `r-x` | 1 | `--x` |
| 4 | `r--` | 0 | `---` |

So `chmod 640 f.txt` is the same as `chmod u=rw,g=r,o= f.txt`. A number always sets all three classes at once; symbols let you change only some. Common modes worth knowing by heart:

| Mode | Symbols | Typical use |
| --- | --- | --- |
| `644` | `rw-r--r--` | Ordinary readable file |
| `600` | `rw-------` | Private file such as an SSH key |
| `755` | `rwxr-xr-x` | Program or public directory |
| `750` | `rwxr-x---` | Program or directory for a group only |
| `700` | `rwx------` | Private directory |

## Changing owner and group

`chown` changes the owner, the group, or both. Only **root** may give a file to another user; the owner may change a file's group, but only to a group they belong to.

```console
[root@servera tmp]# chown maria f.txt           # owner only
[root@servera tmp]# chown maria:project f.txt   # owner and group
[root@servera tmp]# chown :project f.txt        # group only (same as chgrp project f.txt)
[root@servera tmp]# chgrp project f.txt
[root@servera tmp]# ls -l f.txt
-rw-r-----. 1 maria project 3 Oct  3 16:08 f.txt
```

## Whole trees: -R and the capital X

Both commands accept `-R` to work through a directory and everything under it. With `chmod`, this hides a trap. Suppose you want a tree readable by its owner and nothing else, and you run `chmod -R 600 tree`:

```console
[root@servera tmp]# chmod -R 600 tree
[root@servera tmp]# ls -lR tree
tree:
total 4
-rw-------. 1 root root    0 Oct  3 16:08 a
drw-------. 2 root root 4096 Oct  3 16:08 sub

tree/sub:
total 0
-rw-------. 1 root root 0 Oct  3 16:08 b
```

The directory `sub` lost its `x`, so nobody can enter it any more, and its files are out of reach. Directories need `x`; ordinary files usually should not have it. The **capital `X`** solves this: it means "execute, but only for directories (and files that already have execute somewhere)".

```console
[root@servera tmp]# chmod -R u=rwX,g=rX,o= tree
[root@servera tmp]# ls -lR tree
tree:
total 4
-rw-r-----. 1 root root    0 Oct  3 16:08 a
drwxr-x---. 2 root root 4096 Oct  3 16:08 sub

tree/sub:
total 0
-rw-r-----. 1 root root 0 Oct  3 16:08 b
```

{% callout type="warning" title="Be careful with -R" %}
`chmod -R` and `chown -R` change everything they find. A typo such as `chown -R maria /` or an extra space in a path can damage a whole system. Check the path with `ls` first, and prefer `X` to a bare number when directories and files are mixed.
{% /callout %}

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch07.changing"] ref="quick" /%}
