---
title: "Exercise: Getting help review"
seoTitle: "Linux man pages Practice Lab (RHCSA Exam Style)"
description: "Graded RHCSA exam-style lab on Linux man pages: a challenge with requirements, hints and solutions, and a grader that checks your work on your own lab."
kind: lab
minutes: 25
---

{% lead %}
Nine questions, no internet: answer each one using only the help on workstation, write the answers into a file, and let `lab grade` mark them.
{% /lead %}

The questions come in a file with a blank after each `=`. You fill them in with **nano**, a simple editor (chapter 5 teaches vim, the editor administrators use most):

| In nano | Does |
| --- | --- |
| Arrow keys | Move |
| Type | Inserts text at the cursor |
| {% kbd %}Ctrl{% /kbd %}+{% kbd %}O{% /kbd %}, then {% kbd %}Enter{% /kbd %} | Save |
| {% kbd %}Ctrl{% /kbd %}+{% kbd %}X{% /kbd %} | Quit |

{% lab
  objectives=["ch04.man","ch04.search"]
  id="review"
  title="Getting help review"
  exercise="sa-help-review"
  ownExercise=true
  hosts=["workstation"]
  outcomes=["Answer questions from manual pages, choosing the right section.","Find commands by keyword.","Tell built-ins from programs."] %}
{% lab-notes %}

**Before you start:** complete this chapter's lessons. Everything happens on workstation as `student`, in `~/sa-help-review`. Write each answer right after its `=` sign, with no spaces.

{% /lab-notes %}

{% lab-challenge %}

Run `lab start sa-help-review`, open `~/sa-help-review/answers.txt` with nano, and answer:

1. The `ls` option that sorts a listing by file size.
2. The manual section that describes the `/etc/passwd` file.
3. How many fields each line of `/etc/passwd` has.
4. A `useradd` option that creates the new user's home directory.
5. The manual section that describes the `/etc/fstab` file.
6. The command that reports file system disk space usage.
7. What kind of command `cd` is, in the word `type` uses.
8. The command root runs to rebuild the `man -k` keyword index.
9. The short `tar` option that extracts an archive.

Then run `lab grade sa-help-review`.

{% /lab-challenge %}

  {% task id="task-f85ac14e085d" title="Start the exercise and open the answers file" %}

```console
[student@workstation ~]$ lab start sa-help-review
[student@workstation ~]$ cd ~/sa-help-review
[student@workstation sa-help-review]$ nano answers.txt
```
  {% /task %}

  {% task id="task-f256b2823608" title="Questions 1 to 4: manual pages you know" %}

    {% reveal title="Show how to find them" %}
    1. `man ls`, then `/ -S `: **-S** sorts by size.
    2. `whatis passwd` lists `passwd (5) - password file`: section **5**.
    3. `man 5 passwd` describes "seven colon-separated fields": **7**.
    4. `man useradd`, then `/home`: **-m** (or `--create-home`).
    {% /reveal %}
  {% /task %}

  {% task id="task-1d49e81f6f8b" title="Questions 5 to 8: search and check" %}

    {% reveal title="Show how to find them" %}
    5. `whatis fstab` shows `fstab (5)`: section **5**.
    6. `man -k "disk space"` finds **df**.
    7. `type cd` prints `cd is a shell builtin`: **builtin**.
    8. `man -k index` or `man man` (see the `-k` option) leads to **mandb**, "create or update the manual page index caches".
    {% /reveal %}
  {% /task %}

  {% task id="task-953922e5085f" title="Question 9: read tar's SYNOPSIS" %}
    `man tar` has an unusually long SYNOPSIS. Find the line for extracting, under *UNIX-style usage*.

    {% reveal title="Show how to find it" %}

```text
   UNIX-style usage
...
       tar -x [-f ARCHIVE] [OPTIONS] [MEMBER...]
```

    **-x**. Further down, the option list confirms `-x, --extract, --get` and says it extracts files from an archive. Chapter 14 uses tar properly.
    {% /reveal %}
  {% /task %}

  {% task id="task-5fb246e4f92d" title="Save, check and grade" %}
    Save with {% kbd %}Ctrl{% /kbd %}+{% kbd %}O{% /kbd %} and {% kbd %}Enter{% /kbd %}, quit with {% kbd %}Ctrl{% /kbd %}+{% kbd %}X{% /kbd %}, and check what you wrote:

```console
[student@workstation sa-help-review]$ grep '^[A-Z]' answers.txt
LS_SIZE_OPTION=-S
PASSWD_FILE_SECTION=5
PASSWD_FIELDS=7
USERADD_HOME_OPTION=-m
FSTAB_SECTION=5
DISK_SPACE_COMMAND=df
CD_KIND=builtin
MAN_INDEX_COMMAND=mandb
TAR_EXTRACT_OPTION=-x
```

    `grep '^[A-Z]'` prints only the lines that start with a capital letter, which hides the comments. Chapter 5 covers `grep`.

    {% lab-finish exercise="sa-help-review" grade=true /%}
  {% /task %}
{% /lab %}
