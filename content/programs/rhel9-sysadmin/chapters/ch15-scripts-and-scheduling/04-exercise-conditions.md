---
title: "Exercise: Scripts that decide and repeat"
kind: lab
minutes: 30
---

{% lead %}
Write a script that checks its input and chooses what to do, one that loops over files, a service-style script with `case`, and one that reads `/etc/passwd`. Test each with good and bad input and look at the exit statuses.
{% /lead %}

{% lab
  objectives=["ch15.logic"]
  id="logic"
  title="Scripts that decide and repeat"
  exercise="sa-conditions"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera"]
  outcomes=["Validate arguments and exit with distinct statuses.","Use if/elif/else, case, for and while.","Parse /etc/passwd line by line."] %}

  {% task id="task-769f4bc2a0b2" title="Start the exercise" %}
    On workstation, start the exercise. It removes the scripts of an earlier run from student's home on servera.

```console
[student@workstation ~]$ lab start sa-conditions
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-eeb0172f1a47" title="check.sh: validate and decide" %}
    On servera as `student`, create `~/scripts/check.sh`: with exactly one argument, it reports whether it is a directory (with the number of entries), a file (with its size in bytes) or missing. With no argument or too many it prints `Usage: SCRIPT PATH` to standard error and exits with status 2; a missing path exits with status 1.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ mkdir -p ~/scripts && cd ~/scripts
[student@servera scripts]$ cat > check.sh <<'EOT'
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
EOT
[student@servera scripts]$ chmod +x check.sh
```
    {% /reveal %}
  {% /task %}

  {% task id="task-f5b74c7000e2" title="Test every branch" %}
    Run it with no argument, with a directory, with a file, and with a path that does not exist. Print the exit status after each.

    {% reveal title="Show solution" %}

```console
[student@servera scripts]$ ./check.sh; echo "rc=$?"
Usage: ./check.sh PATH
rc=2
[student@servera scripts]$ ./check.sh /etc; echo "rc=$?"
/etc is a directory with 172 entries
rc=0
[student@servera scripts]$ ./check.sh /etc/hostname; echo "rc=$?"
/etc/hostname is a file of 24 bytes
rc=0
[student@servera scripts]$ ./check.sh /nope; echo "rc=$?"
/nope does not exist
rc=1
```

    A good script is one where each path through it has been run at least once.
    {% /reveal %}
  {% /task %}

  {% task id="task-421fd591fade" title="loops.sh" %}
    Create `loops.sh` that prints the squares of 1, 2 and 3 with a `for` loop and arithmetic, counts down from 3 with a `while` loop, and then reports `ok` or `MISSING` for each of `/etc/hostname`, `/etc/hosts` and `/etc/missing`.

    {% reveal title="Show solution" %}

```console
[student@servera scripts]$ cat > loops.sh <<'EOT'
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
EOT
[student@servera scripts]$ chmod +x loops.sh && ./loops.sh
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
    {% /reveal %}
  {% /task %}

  {% task id="task-dedb3a0adb69" title="svc.sh with case" %}
    Write `svc.sh` that accepts `start`, `stop`, or `status` (also `state` as a synonym), prints a message, and for anything else prints a usage line to standard error and exits with 2.

    {% reveal title="Show solution" %}

```console
[student@servera scripts]$ cat > svc.sh <<'EOT'
#!/bin/bash
case "$1" in
  start)  echo "starting" ;;
  stop)   echo "stopping" ;;
  status|state) echo "all fine" ;;
  *)      echo "Usage: $0 {start|stop|status}" >&2; exit 2 ;;
esac
EOT
[student@servera scripts]$ chmod +x svc.sh
[student@servera scripts]$ ./svc.sh start
starting
[student@servera scripts]$ ./svc.sh state
all fine
[student@servera scripts]$ ./svc.sh bogus; echo "rc=$?"
Usage: ./svc.sh {start|stop|status}
rc=2
```
    {% /reveal %}
  {% /task %}

  {% task id="task-45e1b8e44ded" title="users.sh: read a file line by line" %}
    Write `users.sh` that prints the name and the login shell of every user whose UID is 1000 or more but below 60000, using `while IFS=: read` on `/etc/passwd`.

    {% reveal title="Show solution" %}

```console
[student@servera scripts]$ cat > users.sh <<'EOT'
#!/bin/bash
# List regular users (UID 1000 and up) and their shells
while IFS=: read -r user _ uid _ _ _ shell; do
  if [ "$uid" -ge 1000 ] && [ "$uid" -lt 60000 ]; then
    printf '%-10s %s\n' "$user" "$shell"
  fi
done < /etc/passwd
EOT
[student@servera scripts]$ chmod +x users.sh && ./users.sh
student    /bin/bash
```

    On a machine with more users you would see one line each.
    {% /reveal %}
  {% /task %}

  {% task id="task-e38aa5384317" title="Trace a script" %}
    Run `check.sh /etc/hostname` under `bash -x` and read how each line is expanded.

    {% reveal title="Show solution" %}

```console
[student@servera scripts]$ bash -x ./check.sh /etc/hostname
+ '[' 1 -ne 1 ']'
+ path=/etc/hostname
+ '[' -d /etc/hostname ']'
+ '[' -f /etc/hostname ']'
++ stat -c %s /etc/hostname
+ echo '/etc/hostname is a file of 24 bytes'
/etc/hostname is a file of 24 bytes
[student@servera ~]$ exit
```

    Each `+` line is a command as bash ran it, after variables were expanded. This is the first tool to reach for when a script misbehaves.
    {% /reveal %}
  {% /task %}

  {% task id="task-07b6845fc0ce" title="Grade and finish" %}
    {% lab-finish exercise="sa-conditions" grade=true servers=true /%}
  {% /task %}
{% /lab %}
