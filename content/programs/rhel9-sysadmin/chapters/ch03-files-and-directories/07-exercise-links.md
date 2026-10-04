---
title: "Exercise: Switch releases with a link"
kind: lab
minutes: 15
---

{% lead %}
Many applications keep each release in its own directory and point a link called `current` at the one in use, so an upgrade or a rollback is one quick command. Build that on servera, run into the classic mistake when you repoint the link, and save a configuration file with a hard link before deleting a release.
{% /lead %}

{% lab
  objectives=["ch03.links"]
  id="links"
  title="Switch releases with a link"
  exercise="sa-links"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera"]
  outcomes=["Create and repoint a symbolic link to a directory.","Keep a file's data alive with a hard link.","Recognise a dangling link."] %}

  {% task id="task-e87e124c7f4e" title="Start the exercise" %}
    On workstation, start the exercise. It removes any release directories and links from an earlier run from student's home on servera.

```console
[student@workstation ~]$ lab start sa-links
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-eaf78d3fd850" title="Create two releases" %}
    On servera, as student, make two release directories, each with its own `app.conf`. `echo "text" > file` writes a line into a file (chapter 5 explains it):

```console
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ mkdir -p release/v1 release/v2
[student@servera ~]$ echo "version 1" > release/v1/app.conf
[student@servera ~]$ echo "version 2" > release/v2/app.conf
```
  {% /task %}

  {% task id="task-723034cf1595" title="Point current at version 1" %}
    Create a symbolic link `current` to `release/v1`, and read the configuration through it.

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ ln -s release/v1 current
[student@servera ~]$ ls -l current
lrwxrwxrwx. 1 student student 10 Oct  3 09:59 current -> release/v1
[student@servera ~]$ cat current/app.conf
version 1
```

    The target is a *relative* path. It is resolved from the directory the link is in, so the link keeps working if you move or copy the whole tree together.
    {% /reveal %}
  {% /task %}

  {% task id="task-8785915be3f4" title="Try to repoint it the obvious way" %}
    Upgrade to version 2 by running the same command with `v2`, and look carefully at what happened:

```console
[student@servera ~]$ ln -s release/v2 current
[student@servera ~]$ ls -l current release/v1
lrwxrwxrwx. 1 student student   10 Oct  3 09:59 current -> release/v1

release/v1:
total 4
-rw-r--r--. 1 student student 10 Oct  3 09:59 app.conf
lrwxrwxrwx. 1 student student 10 Oct  3 09:59 v2 -> release/v2
```

    `current` still points to v1. Because `current` leads to a directory, `ln` treated it as the destination directory, exactly as `cp` and `mv` would, and created a new link called `v2` *inside* `release/v1`. That stray link is even broken: its relative target, `release/v2`, is looked up from inside `release/v1`.

    Remove the stray link:

```console
[student@servera ~]$ rm release/v1/v2
```
  {% /task %}

  {% task id="task-df8b0d939714" title="Repoint the link properly" %}
    `-n` tells `ln` to treat an existing link to a directory as a plain name, and `-f` to replace it:

```console
[student@servera ~]$ ln -sfn release/v2 current
[student@servera ~]$ ls -l current
lrwxrwxrwx. 1 student student 10 Oct  3 09:59 current -> release/v2
[student@servera ~]$ cat current/app.conf
version 2
```

    A rollback is the same command with `v1`.
  {% /task %}

  {% task id="task-67887951d9aa" title="Save v2's configuration with a hard link" %}
    Before deleting the v2 directory, keep its configuration by giving the file a second name in your home directory. Compare the inode numbers.

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ ln release/v2/app.conf app.conf.saved
[student@servera ~]$ ls -li release/v2/app.conf app.conf.saved
261898 -rw-r--r--. 2 student student 10 Oct  3 09:59 app.conf.saved
261898 -rw-r--r--. 2 student student 10 Oct  3 09:59 release/v2/app.conf
```

    One inode, two names, link count 2. No data was copied.
    {% /reveal %}
  {% /task %}

  {% task id="task-029231d63505" title="Delete release v2 and compare the two links" %}

```console
[student@servera ~]$ rm -r release/v2
[student@servera ~]$ cat current/app.conf
cat: current/app.conf: No such file or directory
[student@servera ~]$ cat app.conf.saved
version 2
[student@servera ~]$ ls -l app.conf.saved
-rw-r--r--. 1 student student 10 Oct  3 09:59 app.conf.saved
```

    `current` now dangles: it points to a name that is gone. The hard link kept the data, and its link count is back to 1.
  {% /task %}

  {% task id="task-d7942db186ed" title="Grade and finish" %}
    {% lab-finish exercise="sa-links" grade=true servers=true /%}
  {% /task %}
{% /lab %}
