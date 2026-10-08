---
title: Your first shell scripts
seoTitle: "Bash Scripting for Beginners: Your First Script"
description: "Write and run Bash scripts with the shebang, arguments, variables and exit statuses. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 20
---

{% lead %}
Every command you have typed in this course can also be saved in a file and run again, with arguments, tests and decisions. That file is a **shell script**, and writing small ones is the single biggest step from "using Linux" to "administering Linux": it turns a ten-minute routine into a command that runs the same way every time, and that cron can run for you at night.
{% /lead %}

{% objectives %}
- Write a script with a shebang, make it executable and run it in four different ways.
- Use variables, command substitution, quoting and arguments (`$1`, `$#`, `"$@"`).
- Read a script's exit status with `$?` and set one with `exit`.
{% /objectives %}

## A script is a list of commands in a file

Here is a small one. Read it line by line:

{% diagram ref="anatomy" /%}

```console
[student@servera scripts]$ cat hello.sh
#!/bin/bash
# Greet the user named in the first argument (default: the current user)
name=${1:-$USER}
echo "Hello, $name! You ran $0 with $# argument(s)."
echo "Today is $(date +%A) and this host is $(hostname -s)."
```

The first line, `#!/bin/bash`, is the **shebang**: it tells Linux which program should run the rest of the file. After it comes plain Bash, exactly as you would type at a prompt.

## Making it run

A new file is not executable. Linux refuses, with a status that has its own number (126, "found, but not executable"):

```console
[student@servera scripts]$ ./hello.sh
bash: ./hello.sh: Permission denied
[student@servera scripts]$ echo $?
126
[student@servera scripts]$ chmod +x hello.sh
[student@servera scripts]$ ./hello.sh
Hello, student! You ran ./hello.sh with 0 argument(s).
Today is Saturday and this host is servera.
```

You met `chmod +x` in chapter 7. There are several ways to run a script, with different requirements:

{% diagram ref="run-ways" /%}

To run a script by name from anywhere, put it in a directory that is in your `PATH`:

```console
[student@servera scripts]$ echo $PATH
/home/student/.local/bin:/home/student/bin:/usr/local/bin:/usr/bin:/usr/local/sbin:/usr/sbin
[student@servera scripts]$ cp hello.sh ~/bin/
[student@servera scripts]$ hello.sh Ana
Hello, Ana! You ran /home/student/bin/hello.sh with 1 argument(s).
Today is Saturday and this host is servera.
```

`~/bin` is for you; `/usr/local/bin` is the place for scripts that all users should run.

## Variables, quoting and substitution

- A variable is set as `name=value` (**no spaces around `=`**) and read as `$name` or `${name}`.
- **Double quotes** keep a value together as one word and still expand variables: `"Hello, $name"`. **Single quotes** keep everything literal: `'$name'` prints `$name`.
- **`$(command)`** runs the command and substitutes its output: `today=$(date +%F)`.
- `${var:-default}` uses `default` when `var` is empty or unset.

## Arguments

Everything after the script name on the command line is available inside:

| Variable | Holds |
| --- | --- |
| `$0` | The script's own name |
| `$1`, `$2`, … | The first, second, … argument |
| `$#` | How many arguments |
| `"$@"` | All arguments, each as one word |
| `$?` | Exit status of the last command |

```console
[student@servera scripts]$ ./args.sh one "two words" three
script: ./args.sh
first: one  second: two words
count: 3
all: one two words three
  arg: [one]
  arg: [two words]
  arg: [three]
```

The quotes around `"two words"` made it a single argument, and `"$@"` preserved that when the script looped over its arguments. Always write `"$@"` with the quotes; without them, a file name with a space turns into two words.

## Exit status

Every command finishes with a number: **0 means success, anything else means failure**. The shell keeps the last one in `$?`. Your own scripts should follow the convention, using `exit`:

```console
[student@servera scripts]$ true; echo $?
0
[student@servera scripts]$ ls /nope 2> /dev/null; echo $?
2
```

By convention `exit 0` is success, `exit 1` a general error, and `exit 2` wrong usage. Status codes are how cron, other scripts and `&&` / `||` know whether your script worked.

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch15.scripts"] ref="quick" /%}
