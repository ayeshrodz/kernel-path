---
title: Create, copy, move and remove
kind: lesson
minutes: 15
---

{% lead %}
Five commands do almost all file housekeeping: `mkdir`, `cp`, `mv`, `rm` and `rmdir`. They are simple, but they act immediately and there is no wastebasket, so this lesson also covers the habits that keep a typo from becoming a lost afternoon.
{% /lead %}

{% objectives %}
- Create directories, including whole paths at once, with `mkdir` and `mkdir -p`.
- Copy and move files and directories with `cp`, `cp -r` and `mv`, and predict where the result ends up.
- Remove files and directories with `rm`, `rm -r` and `rmdir`, safely.
{% /objectives %}

## Make directories

`mkdir` creates one or more directories:

```console
[student@servera ~]$ mkdir reports drafts
[student@servera ~]$ ls
drafts  reports
```

It fails if the directory already exists, or if the directory it should go in doesn't exist yet. `-p` (*parents*) creates the whole path, as many levels as needed, and doesn't complain about directories that already exist:

```console
[student@servera ~]$ mkdir backup/2026
mkdir: cannot create directory ‘backup/2026’: No such file or directory
[student@servera ~]$ mkdir -p archive/2026/q1
[student@servera ~]$ ls -R archive
archive:
2026

archive/2026:
q1

archive/2026/q1:
```

{% callout type="warning" title="-p hides typos" %}
`mkdir Reprots/2026` fails because `Reprots` doesn't exist, which tells you about the typo. `mkdir -p Reprots/2026` quietly creates the misspelt directory. Use `-p` when you mean to create a path, not out of habit.
{% /callout %}

## Copy and move

`cp SOURCE DESTINATION` copies; `mv SOURCE DESTINATION` moves. A move within the same file system is really a rename, which is why there is no separate rename command: renaming is moving a file to a new name. Both follow the same rule about the destination. Select a command to see the result:

{% diagram ref="destination-rule" /%}

- If the destination is an **existing directory**, the file goes **inside it**, keeping its name.
- Otherwise the destination is the **new name** for the file.
- With several sources, the last argument must be a directory: `cp a.txt b.txt c.txt reports/`.

```console
[student@servera ~]$ touch drafts/plan.txt drafts/budget.txt drafts/notes.txt
[student@servera ~]$ cp drafts/plan.txt reports/plan-v1.txt
[student@servera ~]$ mv -v drafts/budget.txt reports/
renamed 'drafts/budget.txt' -> 'reports/budget.txt'
[student@servera ~]$ mv drafts/notes.txt drafts/meeting-notes.txt
[student@servera ~]$ ls drafts reports
drafts:
meeting-notes.txt  plan.txt

reports:
budget.txt  plan-v1.txt
```

`-v` (*verbose*) makes `cp` and `mv` say what they did.

### Directories need -r to copy

`cp` copies files only, unless you add `-r` (*recursive*), which copies a directory with everything inside it. `mv` moves directories without any option.

```console
[student@servera ~]$ cp drafts reports
cp: -r not specified; omitting directory 'drafts'
[student@servera ~]$ cp -rv reports archive/2026/q1/
'reports' -> 'archive/2026/q1/reports'
'reports/budget.txt' -> 'archive/2026/q1/reports/budget.txt'
'reports/plan-v1.txt' -> 'archive/2026/q1/reports/plan-v1.txt'
```

### Overwriting

If the destination file exists, `cp` and `mv` overwrite it without asking. Add `-i` (*interactive*) to be asked first. Copies get the current time as their time stamp; `cp -p` keeps the original's times and permissions, which matters when you back up configuration.

## Remove

`rm` removes files. It refuses directories unless you add `-r`, which removes a directory and everything below it. `rmdir` removes only **empty** directories, which makes it a safe way to tidy up:

```console
[student@servera ~]$ rmdir drafts
rmdir: failed to remove 'drafts': Directory not empty
[student@servera ~]$ rm drafts
rm: cannot remove 'drafts': Is a directory
[student@servera ~]$ rm -r drafts
[student@servera ~]$ ls
archive  reports
```

`rm -i` asks before each removal, and `-f` (*force*) never asks and doesn't complain about missing files. If you give both, `-f` wins.

```console
[student@servera ~]$ rm -ri archive
rm: descend into directory 'archive'? y
rm: descend into directory 'archive/2026'? y
...output omitted...
rm: remove directory 'archive'? y
```

{% callout type="important" title="There is no undo" %}
Files removed from the command line don't go to a wastebasket: they are gone. Before an `rm` with a relative path, run `pwd` and `ls` with the same arguments to see what it will remove. Be especially careful with `rm -rf` as root, and never type it with a path that starts with a space or a variable you haven't checked.
{% /callout %}

## Check your understanding

{% quiz id="quick" objectives=["ch03.manage"] ref="quick" /%}
