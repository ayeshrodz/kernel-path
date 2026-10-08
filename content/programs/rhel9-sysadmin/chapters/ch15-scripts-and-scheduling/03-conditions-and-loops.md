---
title: Decisions and loops
seoTitle: "Bash if, case, for and while Loops Explained"
description: "Make Bash scripts decide and repeat with if, test, case, for and while loops. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 25
---

{% lead %}
A script that only repeats commands is a shortcut. A script that checks its input, chooses what to do, repeats a step for each file, and reports failure with the right exit status is a tool. This lesson adds those abilities: tests, `if`, `case`, `for` and `while`.
{% /lead %}

{% objectives %}
- Use `[ … ]` tests for files, numbers and strings, and combine them with `&&`, `||` and `!`.
- Write `if / elif / else`, `case`, `for` and `while`.
- Validate arguments and exit with a meaningful status.
{% /objectives %}

## Tests

The command `[ … ]` (a synonym of `test`) evaluates a condition and returns an exit status: 0 for true. Because `if` looks only at an exit status, you can use it with *any* command.

{% diagram ref="tests" /%}

```console
[student@servera scripts]$ [ -f /etc/hostname ] && echo yes
yes
[student@servera scripts]$ [ -f /etc/nothing ] || echo no
no
[student@servera scripts]$ [ 5 -gt 3 ] && echo greater
greater
```

Two rules: put **spaces inside the brackets**, and **quote variables** (`[ -d "$path" ]`) so that an empty or spaced value does not break the test.

## if, elif, else

```console
[student@servera scripts]$ cat check.sh
#!/bin/bash
# Report on a path given as the first argument
if [ $# -ne 1 ]; then
  echo "Usage: $0 PATH" >&2
  exit 2
fi
path=$1
if [ -d "$path" ]; then
  echo "$path is a directory with $(ls "$path" | wc -l) entries"
elif [ -f "$path" ]; then
  echo "$path is a file of $(stat -c %s "$path") bytes"
else
  echo "$path does not exist" >&2
  exit 1
fi
```

Note the habits worth copying: check the arguments first, send error messages to **standard error** (`>&2`) so they do not mix with normal output, and use different exit codes for different failures. Step through the three cases:

{% diagram ref="if-flow" /%}

```console
[student@servera scripts]$ ./check.sh
Usage: ./check.sh PATH
[student@servera scripts]$ echo $?
2
[student@servera scripts]$ ./check.sh /etc
/etc is a directory with 172 entries
[student@servera scripts]$ ./check.sh /etc/hostname
/etc/hostname is a file of 24 bytes
[student@servera scripts]$ ./check.sh /nope
/nope does not exist
```

## case: choosing between patterns

`case` is tidier than a long chain of `elif` when you compare one value with many patterns, such as the action word of a service script:

```bash
case "$1" in
  start)        echo "starting" ;;
  stop)         echo "stopping" ;;
  status|state) echo "all fine" ;;
  *)            echo "Usage: $0 {start|stop|status}" >&2; exit 2 ;;
esac
```

Each branch ends with `;;`, `|` separates alternatives, and `*)` catches everything else.

## Loops

**`for`** walks through a list; **`while`** repeats as long as a condition holds:

```console
[student@servera scripts]$ cat loops.sh
#!/bin/bash
for n in 1 2 3; do
  echo "square of $n is $((n * n))"
done
count=3
while [ $count -gt 0 ]; do
  echo "countdown $count"
  count=$((count - 1))
done
for f in /etc/hostname /etc/hosts /etc/missing; do
  if [ -e "$f" ]; then echo "$f ok"; else echo "$f MISSING"; fi
done
[student@servera scripts]$ ./loops.sh
square of 1 is 1
square of 2 is 4
square of 3 is 9
countdown 3
countdown 2
countdown 1
/etc/hostname ok
/etc/hosts ok
/etc/missing MISSING
```

`$(( … ))` is **arithmetic**: whole-number calculations without calling another program. A very common pattern reads a file line by line and splits each line into fields:

```console
[student@servera scripts]$ cat users.sh
#!/bin/bash
# List regular users (UID 1000 and up) and their shells
while IFS=: read -r user _ uid _ _ _ shell; do
  if [ "$uid" -ge 1000 ] && [ "$uid" -lt 60000 ]; then
    printf '%-10s %s\n' "$user" "$shell"
  fi
done < /etc/passwd
[student@servera scripts]$ ./users.sh
student    /bin/bash
```

`IFS=:` splits on colons, `read -r` puts the fields into variables (`_` throws a field away), and `< /etc/passwd` feeds the file to the loop. This is the same file you learnt to read field by field in chapter 6.

{% callout type="tip" title="Develop in small steps" %}
Run a new script with `bash -x script.sh` to see each command as it executes, with variables already expanded. And start with `echo` in front of dangerous commands (like `rm`) until the output is what you expect.
{% /callout %}

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch15.logic"] ref="quick" /%}
