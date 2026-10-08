---
title: "Exercise: Archive a project"
seoTitle: "Archive a project (RHCSA Practice Exercise)"
description: "Hands-on RHCSA practice: archive a project. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 25
---

{% lead %}
Build a small project, archive it three ways, restore it into a clean directory, and prove the restored copy matches the original. You also see what happens when a path starts with a slash.
{% /lead %}

{% lab
  objectives=["ch14.tar"]
  id="tar"
  title="Archive a project"
  exercise="sa-tar"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera"]
  outcomes=["Create, list and extract tar archives.","Extract into a chosen directory and extract a single member.","Compare the restored tree with the original."] %}

  {% task id="task-61f650ffb6d4" title="Start the exercise" %}
    On workstation, start the exercise. It removes `/root/arch` of an earlier run from servera.

```console
[student@workstation ~]$ lab start sa-tar
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-cb1b078db942" title="Build the project" %}
    On servera as root (`sudo -i`), create `/root/arch/project` with `docs/notes.md`, `src/data1.txt` (the numbers 1 to 20000, from `seq`), and an executable script `run.sh`.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ sudo -i
[root@servera ~]# mkdir -p /root/arch/project/docs /root/arch/project/src
[root@servera ~]# cd /root/arch
[root@servera arch]# echo "# notes" > project/docs/notes.md
[root@servera arch]# seq 1 20000 > project/src/data1.txt
[root@servera arch]# printf '#!/bin/bash\necho hello\n' > project/run.sh
[root@servera arch]# chmod 750 project/run.sh
[root@servera arch]# ls -lR project | head -8
project:
total 8
drwxr-xr-x. 2 root root 4096 Oct  3 17:43 docs
-rwxr-x---. 1 root root   23 Oct  3 17:43 run.sh
drwxr-xr-x. 2 root root 4096 Oct  3 17:43 src
...output omitted...
```
    {% /reveal %}
  {% /task %}

  {% task id="task-04c26b6170c0" title="Archive, list, compress" %}
    Create an uncompressed archive `project.tar` and a gzip archive `project.tar.gz`. Compare their sizes and list the first lines of the archive with details.

    {% reveal title="Show solution" %}

```console
[root@servera arch]# tar -cvf project.tar project
project/
project/docs/
project/docs/notes.md
project/run.sh
project/src/
project/src/data1.txt
[root@servera arch]# tar -czf project.tar.gz project
[root@servera arch]# ls -l project.tar project.tar.gz
-rw-r--r--. 1 root root 122880 Oct  3 17:43 project.tar
-rw-r--r--. 1 root root  45396 Oct  3 17:43 project.tar.gz
[root@servera arch]# tar -tvf project.tar | head -4
drwxr-xr-x root/root         0 2026-10-03 17:36 project/
drwxr-xr-x root/root         0 2026-10-03 17:36 project/docs/
-rw-r--r-- root/root         8 2026-10-03 17:36 project/docs/notes.md
-rwxr-x--- root/root        23 2026-10-03 17:36 project/run.sh
```

    Sizes will differ a little. The text compresses to roughly a third of its size.
    {% /reveal %}
  {% /task %}

  {% task id="task-a3294735f600" title="Restore into a clean place" %}
    Extract the gzip archive into a new empty directory `restore`, and compare the result with the original.

    {% reveal title="Show solution" %}

```console
[root@servera arch]# mkdir restore
[root@servera arch]# tar -xzf project.tar.gz -C restore
[root@servera arch]# ls restore/project
docs  run.sh  src
[root@servera arch]# diff -r project restore/project; echo "rc=$?"
rc=0
[root@servera arch]# ls -l restore/project/run.sh
-rwxr-x---. 1 root root 23 Oct  3 17:36 restore/project/run.sh
```
    {% /reveal %}
  {% /task %}

  {% task id="task-d31e0975a8d5" title="Extract just one file" %}
    Extract only `project/run.sh` from the archive into a directory `one`. Check its permissions.

    {% reveal title="Show solution" %}

```console
[root@servera arch]# mkdir one
[root@servera arch]# tar -xzf project.tar.gz -C one project/run.sh
[root@servera arch]# find one -type f
one/project/run.sh
[root@servera arch]# ls -l one/project/run.sh
-rwxr-x---. 1 root root 23 Oct  3 17:36 one/project/run.sh
```
    {% /reveal %}
  {% /task %}

  {% task id="task-c04fe1dfe7cc" title="Exclude and absolute paths" %}
    Create `notxt.tar.gz` without any `.txt` files and list it. Then archive the absolute path `/root/arch/project/docs` and read the warning and the member names.

    {% reveal title="Show solution" %}

```console
[root@servera arch]# tar --exclude='*.txt' -czf notxt.tar.gz project
[root@servera arch]# tar -tzf notxt.tar.gz
project/
project/docs/
project/docs/notes.md
project/run.sh
project/src/
[root@servera arch]# tar -cvf abs.tar /root/arch/project/docs
tar: Removing leading `/' from member names
/root/arch/project/docs/
/root/arch/project/docs/notes.md
[root@servera arch]# tar -tf abs.tar | head -2
root/arch/project/docs/
root/arch/project/docs/notes.md
```

    tar removed the leading slash for safety, so extracting `abs.tar` would create `root/arch/...` below the current directory.
    {% /reveal %}
  {% /task %}

  {% task id="task-13eba9e5f961" title="Grade and finish" %}
    {% lab-finish exercise="sa-tar" grade=true servers=true /%}
  {% /task %}
{% /lab %}
