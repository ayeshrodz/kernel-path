---
title: "Exercise: Create and edit a file with vim"
kind: lab
minutes: 25
---

{% lead %}
Work through the first lesson of vim's own tutorial, then use what it taught to write a short notice file on servera and edit it: copy a line, replace text, change your mind, and quit without saving.
{% /lead %}

{% lab
  objectives=["ch05.vim"]
  id="vim"
  title="Create and edit a file with vim"
  hosts=["workstation","servera"]
  outcomes=["Move between normal, insert and command-line mode.","Copy, paste, delete and undo lines, and replace text.","Save, or quit without saving."] %}

  {% task id="task-727284164744" title="Do lesson 1 of vimtutor" %}
    On servera, start the tutorial:

```console
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ vimtutor
```

    Read and do lessons 1.1 to 1.6: moving with `h` `j` `k` `l`, quitting with `:q!`, deleting with `x`, inserting with `i` and `A`, and saving with `:wq`. Read the lesson 1 summary, then leave with `:q!`. The tutorial edits a copy, so nothing you do in it matters.
  {% /task %}

  {% task id="task-7ab4d32d8ffa" title="Write a new file" %}
    Open `welcome.txt`, press `i`, type these three lines, press {% kbd %}Esc{% /kbd %}, and save and quit with `:wq`:

```text
Welcome to servera.
Maintenance window: Saturdays 22:00 to 23:00.
Contact: admin@lab.example.com
```

```console
[student@servera ~]$ vim welcome.txt
[student@servera ~]$ cat welcome.txt
Welcome to servera.
Maintenance window: Saturdays 22:00 to 23:00.
Contact: admin@lab.example.com
```
  {% /task %}

  {% task id="task-a0153d855c3b" title="Copy a line and change the copy" %}
    Open the file again. Add a second contact by copying line 3 and editing the copy:

    1. Type `:3` and {% kbd %}Enter{% /kbd %} to jump to line 3.
    2. `yy` copies the line; `p` puts the copy below it, and the cursor moves to the copy.
    3. `:s/admin/oncall/` and {% kbd %}Enter{% /kbd %} replaces the first `admin` on the current line.

    Then make the host name in line 1 complete, with a substitution over the whole file: `:%s/servera\./servera.lab.example.com./` and {% kbd %}Enter{% /kbd %}. The backslash makes the dot a literal dot, as in grep. Save with `:wq`.

```console
[student@servera ~]$ cat -n welcome.txt
     1	Welcome to servera.lab.example.com.
     2	Maintenance window: Saturdays 22:00 to 23:00.
     3	Contact: admin@lab.example.com
     4	Contact: oncall@lab.example.com
```

    `cat -n` numbers the lines, which makes it easy to check what moved.
  {% /task %}

  {% task id="task-ab9b156f2c3f" title="Change your mind twice" %}
    Open the file, go to line 2 with `:2`, and delete it with `dd`. The line disappears. Press `u` to undo it, and it comes back. Now quit with `:q!`.

```console
[student@servera ~]$ cat -n welcome.txt
     1	Welcome to servera.lab.example.com.
     2	Maintenance window: Saturdays 22:00 to 23:00.
     3	Contact: admin@lab.example.com
     4	Contact: oncall@lab.example.com
```

    Nothing changed: `:q!` discarded the session's edits. Remember this when a file you are editing goes wrong.
  {% /task %}

  {% task id="task-857f20269bc4" title="Delete a line for real" %}
    The maintenance window is cancelled. Delete line 2 and save.

    {% reveal title="Show solution" %}
    `vim welcome.txt`, then `:2`, `dd`, `:wq`.

```console
[student@servera ~]$ cat -n welcome.txt
     1	Welcome to servera.lab.example.com.
     2	Contact: admin@lab.example.com
     3	Contact: oncall@lab.example.com
[student@servera ~]$ rm welcome.txt
[student@servera ~]$ exit
```
    {% /reveal %}
  {% /task %}
{% /lab %}
