---
title: "Exercise: Who can read this?"
kind: lab
minutes: 20
---

{% lead %}
Predict, then test. You will set up three users and a report file, work out for each person what they can do, and check your answers by acting as each user.
{% /lead %}

{% lab
  objectives=["ch07.reading"]
  id="reading"
  title="Who can read this?"
  exercise="sa-reading"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera"]
  outcomes=["Read owner, group and other permissions and predict access.","See that directory permissions decide who can list, enter and delete.","Use namei -l to find a blocked path."] %}

  {% task id="task-8f0c9c3dd818" title="Start the exercise" %}
    On workstation, start the exercise. It creates the group project (4500), the users maria, john and priya, and `/srv/lab7/report.txt` (owned by maria, group project, mode 640).

```console
[student@workstation ~]$ lab start sa-reading
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.

    Then, as root on servera, change to the exercise directory:

```console
[root@servera ~]# cd /srv/lab7
```
  {% /task %}

  {% task id="task-6a8712ce4075" title="Predict and test" %}
    Write down, for `maria`, `john` and `priya`, whether each can read the file and whether each can append to it. Then check, using `su - USER -c 'COMMAND'` from your root shell:

```console
[root@servera lab7]# for u in maria john priya; do echo "== $u"; su - $u -c 'cat /srv/lab7/report.txt; echo x >> /srv/lab7/report.txt'; done
```

    {% reveal title="Show the answer" %}

```console
== maria
Q3 figures
== john
Q3 figures
-bash: line 1: /srv/lab7/report.txt: Permission denied
== priya
cat: /srv/lab7/report.txt: Permission denied
-bash: line 1: /srv/lab7/report.txt: Permission denied
```

    maria is the owner (`rw-`): read and write. john matches the group class (`r--`): read only. priya is "other" (`---`): nothing.
    {% /reveal %}
  {% /task %}

  {% task id="task-dfd22801008d" title="Lock out the owner" %}
    Change the mode to `070` (`----rwx---`). Who can read now? Test maria and john.

    {% reveal title="Show the answer" %}

```console
[root@servera lab7]# chmod 070 report.txt
[root@servera lab7]# su - maria -c 'cat /srv/lab7/report.txt'
cat: /srv/lab7/report.txt: Permission denied
[root@servera lab7]# su - john -c 'cat /srv/lab7/report.txt'
Q3 figures
```

    maria is the owner, so only the owner bits (`---`) count, even though the group bits allow more. Restore the mode with `chmod 640 report.txt` before you continue.
    {% /reveal %}
  {% /task %}

  {% task id="task-75fa5597982b" title="Directories: read versus execute" %}
    Create the directory `box` containing two empty files, and give it mode 644. As john, try to list it, read a file in it and enter it. Then change it to 711 and try again.

    {% reveal title="Show solution" %}

```console
[root@servera lab7]# mkdir box
[root@servera lab7]# touch box/one box/two
[root@servera lab7]# chmod 644 box
[root@servera lab7]# su - john -c 'ls /srv/lab7/box; cat /srv/lab7/box/one; cd /srv/lab7/box'
one
two
cat: /srv/lab7/box/one: Permission denied
-bash: line 1: cd: /srv/lab7/box: Permission denied
[root@servera lab7]# chmod 711 box
[root@servera lab7]# su - john -c 'ls /srv/lab7/box; cat /srv/lab7/box/one && echo readable'
ls: cannot open directory '/srv/lab7/box': Permission denied
readable
```

    With `r` but no `x` you can see the names but cannot touch anything. With `x` but no `r` you cannot list the names, but you can still open a file if you know its name.
    {% /reveal %}
  {% /task %}

  {% task id="task-f517e61fa19d" title="Deleting depends on the directory" %}
    Let maria own `box` (mode 755) and make `box/one` read-only for everyone (`chmod 444`). Can maria delete `one`? Then remove write from the directory (`chmod 555 box`) and see whether she can still create or delete anything.

    {% reveal title="Show solution" %}

```console
[root@servera lab7]# chmod 755 box
[root@servera lab7]# chown maria box
[root@servera lab7]# chmod 444 box/one
[root@servera lab7]# su - maria -c 'rm -f /srv/lab7/box/one && echo removed'
removed
[root@servera lab7]# chmod 555 box
[root@servera lab7]# su - maria -c 'touch /srv/lab7/box/new'
touch: cannot touch '/srv/lab7/box/new': Permission denied
[root@servera lab7]# su - maria -c 'rm -f /srv/lab7/box/two'
rm: cannot remove '/srv/lab7/box/two': Permission denied
[root@servera lab7]# namei -l /srv/lab7/box/two
f: /srv/lab7/box/two
drwxr-xr-x root  root /
drwxr-xr-x root  root srv
drwxr-xr-x root  root lab7
dr-xr-xr-x maria root box
-rw-r--r-- root  root two
```

    The read-only file was removed, because deleting is a change to the directory. Once `box` lost `w`, even its owner could not create or delete entries.
    {% /reveal %}
  {% /task %}

  {% task id="task-547ea3f80e70" title="Grade and finish" %}
    {% lab-finish exercise="sa-reading" grade=true servers=true /%}
  {% /task %}
{% /lab %}
