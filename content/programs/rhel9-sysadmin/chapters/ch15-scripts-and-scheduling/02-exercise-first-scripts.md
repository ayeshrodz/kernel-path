---
title: "Exercise: Write and run your first scripts"
seoTitle: "Write and run your first scripts (RHCSA Practice Exercise)"
description: "Hands-on RHCSA practice: write and run your first scripts. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 25
---

{% lead %}
Write a greeting script, run it every way that works, then pass it arguments and make it fail on purpose to see the exit status.
{% /lead %}

{% lab
  objectives=["ch15.scripts"]
  id="scripts"
  title="Write and run your first scripts"
  exercise="sa-first-scripts"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera"]
  outcomes=["Write a script with a shebang and make it executable.","Run it with ./, bash and through PATH.","Use arguments, quoting and exit statuses."] %}

  {% task id="task-c3e3d33935eb" title="Start the exercise" %}
    On workstation, start the exercise. It removes the scripts of an earlier run from student's home on servera.

```console
[student@workstation ~]$ lab start sa-first-scripts
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-fa4171b2c43e" title="Write hello.sh" %}
    On servera as `student`, create `~/scripts/hello.sh` (use `vim`) with the content below. Try to run it before doing anything else.

```bash
#!/bin/bash
# Greet the user named in the first argument (default: the current user)
name=${1:-$USER}
echo "Hello, $name! You ran $0 with $# argument(s)."
echo "Today is $(date +%A) and this host is $(hostname -s)."
```

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ mkdir -p ~/scripts ~/bin
[student@servera ~]$ cd ~/scripts
[student@servera scripts]$ vim hello.sh
[student@servera scripts]$ ./hello.sh
-bash: ./hello.sh: Permission denied
[student@servera scripts]$ echo $?
126
```

    The file exists, but it is not executable yet: exit status 126.
    {% /reveal %}
  {% /task %}

  {% task id="task-ac8bec3cac69" title="Make it executable and run it" %}
    Make it executable and run it with no arguments, then with one argument, then with an argument that contains a space.

    {% reveal title="Show solution" %}

```console
[student@servera scripts]$ chmod +x hello.sh
[student@servera scripts]$ ./hello.sh
Hello, student! You ran ./hello.sh with 0 argument(s).
Today is Saturday and this host is servera.
[student@servera scripts]$ ./hello.sh Maria
Hello, Maria! You ran ./hello.sh with 1 argument(s).
Today is Saturday and this host is servera.
[student@servera scripts]$ ./hello.sh Maria "two words"
Hello, Maria! You ran ./hello.sh with 2 argument(s).
Today is Saturday and this host is servera.
```

    The quotes group `two words` into one argument, so the script counts 2 arguments, not 3.
    {% /reveal %}
  {% /task %}

  {% task id="task-cd9d3ec9bac6" title="Run it through bash and through PATH" %}
    Remove the execute bit again and run the script with `bash hello.sh`. Restore the bit, copy the script to `~/bin`, and run it from another directory by name.

    {% reveal title="Show solution" %}

```console
[student@servera scripts]$ chmod -x hello.sh
[student@servera scripts]$ bash hello.sh x
Hello, x! You ran hello.sh with 1 argument(s).
Today is Saturday and this host is servera.
[student@servera scripts]$ chmod +x hello.sh
[student@servera scripts]$ cp hello.sh ~/bin/
[student@servera scripts]$ cd /tmp && hello.sh Ana
Hello, Ana! You ran /home/student/bin/hello.sh with 1 argument(s).
Today is Saturday and this host is servera.
[student@servera tmp]$ cd ~/scripts
```

    `~/bin` is already in your `PATH` (your `~/.bashrc` adds it), so the name works from any directory.
    {% /reveal %}
  {% /task %}

  {% task id="task-1d4e36f1dafd" title="Handle arguments properly" %}
    Write `args.sh` that prints its own name, the first two arguments, the count, and then each argument on its own line in square brackets using a loop over `"$@"`. Run it with `one "two words" three`.

    {% reveal title="Show solution" %}

```console
[student@servera scripts]$ cat args.sh
#!/bin/bash
echo "script: $0"
echo "first: $1  second: $2"
echo "count: $#"
echo "all: $@"
for a in "$@"; do echo "  arg: [$a]"; done
[student@servera scripts]$ chmod +x args.sh
[student@servera scripts]$ ./args.sh one "two words" three
script: ./args.sh
first: one  second: two words
count: 3
all: one two words three
  arg: [one]
  arg: [two words]
  arg: [three]
```

    Change `"$@"` to `$@` (without quotes) and run it again: `two words` is now split into two arguments.
    {% /reveal %}
  {% /task %}

  {% task id="task-a7dc377ba941" title="Exit statuses" %}
    Show the exit status of `true`, of `false`, and of `ls /nope`. Then use `&&` and `||` to print "found" or "not found" for `/etc/hostname`.

    {% reveal title="Show solution" %}

```console
[student@servera scripts]$ true; echo $?
0
[student@servera scripts]$ false; echo $?
1
[student@servera scripts]$ ls /nope 2> /dev/null; echo $?
2
[student@servera scripts]$ ls /etc/hostname && echo found || echo "not found"
/etc/hostname
found
[student@servera scripts]$ ls /etc/nothing 2> /dev/null && echo found || echo "not found"
not found
```
    {% /reveal %}
  {% /task %}

  {% task id="task-0fafec186b58" title="Grade and finish" %}
    {% lab-finish exercise="sa-first-scripts" grade=true servers=true /%}
  {% /task %}
{% /lab %}
