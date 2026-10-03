---
title: "Exercise: Secure a web folder"
kind: lab
minutes: 25
---

{% lead %}
A small website lives in `/srv/site`. Its owner maria and the group `webteam` need to work on it, a deploy script must be runnable, and nobody else should see anything. You will use `chown`, `chmod` with symbols and numbers, and the capital `X`.
{% /lead %}

{% lab
  objectives=["ch07.changing"]
  id="changing"
  title="Secure a web folder"
  hosts=["workstation","servera"]
  outcomes=["Change owner and group recursively with chown -R.","Set modes with symbols, octal numbers and the capital X.","Verify access by acting as different users."] %}

  {% task id="task-d9cf5dfc07d5" title="Build the tree" %}
    On servera, open a root shell with `sudo -i`. Create the group `webteam` (GID 4600), the users `maria` (in `webteam`) and `john` (not in it), and the tree `/srv/site/html/index.html` plus `/srv/site/bin/deploy.sh`, using `mkdir -p` and `touch`. List it with `ls -lR /srv/site`.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ sudo -i
[root@servera ~]# groupadd -g 4600 webteam
[root@servera ~]# useradd -m -G webteam maria
[root@servera ~]# useradd -m john
[root@servera ~]# mkdir -p /srv/site/html /srv/site/bin
[root@servera ~]# touch /srv/site/html/index.html /srv/site/bin/deploy.sh
[root@servera ~]# ls -lR /srv/site
/srv/site:
total 8
drwxr-xr-x. 2 root root 4096 Oct  3 16:12 bin
drwxr-xr-x. 2 root root 4096 Oct  3 16:12 html
...output omitted...
```

    Everything belongs to root and is readable by everyone. That is what we will change.
    {% /reveal %}
  {% /task %}

  {% task id="task-0bd717699754" title="Give it to maria and webteam" %}
    Make `maria` the owner and `webteam` the group of the whole tree, in one command.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# chown -R maria:webteam /srv/site
[root@servera ~]# ls -ld /srv/site /srv/site/html/index.html
drwxr-xr-x. 4 maria webteam 4096 Oct  3 16:12 /srv/site
-rw-r--r--. 1 maria webteam    0 Oct  3 16:12 /srv/site/html/index.html
```
    {% /reveal %}
  {% /task %}

  {% task id="task-4552c66a691b" title="Restrict it with X" %}
    One recursive command should give the owner read and write, the group read-only, others nothing, and keep directories enterable. Which letter protects the directories? Run it and check that the files did not become executable.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# chmod -R u=rwX,g=rX,o= /srv/site
[root@servera ~]# ls -lR /srv/site
/srv/site:
total 8
drwxr-x---. 2 maria webteam 4096 Oct  3 16:12 bin
drwxr-x---. 2 maria webteam 4096 Oct  3 16:12 html

/srv/site/bin:
total 0
-rw-r-----. 1 maria webteam 0 Oct  3 16:12 deploy.sh

/srv/site/html:
total 0
-rw-r-----. 1 maria webteam 0 Oct  3 16:12 index.html
```

    Directories got `x` (so `rwx` for the owner, `r-x` for the group); the plain files did not.
    {% /reveal %}
  {% /task %}

  {% task id="task-b64368318601" title="Make the script runnable and the page public" %}
    Set the script to mode 750 and `index.html` to 644, with numbers. Check with `stat -c '%a %U:%G %n'`. Put a line of text in the script, such as `echo deployed`, and run it as maria.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# chmod 750 /srv/site/bin/deploy.sh
[root@servera ~]# chmod 644 /srv/site/html/index.html
[root@servera ~]# stat -c '%a %U:%G %n' /srv/site/html/index.html /srv/site/bin/deploy.sh
644 maria:webteam /srv/site/html/index.html
750 maria:webteam /srv/site/bin/deploy.sh
[root@servera ~]# echo 'echo deployed' > /srv/site/bin/deploy.sh
[root@servera ~]# su - maria -c /srv/site/bin/deploy.sh
deployed
```

    Writing into an existing file with `>` keeps its mode. The script ran because maria, the owner, has `x`.
    {% /reveal %}
  {% /task %}

  {% task id="task-39f9983bd59f" title="Act as john" %}
    john is not in `webteam`. Predict what he can do, then try to list `/srv/site` and run the deploy script as him. After that, let others traverse `/srv/site` and `/srv/site/html` and read `index.html` (with `o+rX` and `o+r`), and test john again.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# su - john -c 'ls /srv/site'
ls: cannot open directory '/srv/site': Permission denied
[root@servera ~]# chmod o+rX /srv/site /srv/site/html
[root@servera ~]# chmod o+r /srv/site/html/index.html
[root@servera ~]# su - john -c 'cat /srv/site/html/index.html && echo ok'
ok
[root@servera ~]# su - john -c /srv/site/bin/deploy.sh
-bash: line 1: /srv/site/bin/deploy.sh: Permission denied
```

    john can read the page now because each directory on the path gives him `r-x`. The script is still blocked: `/srv/site/bin` and the script itself give "other" nothing.
    {% /reveal %}
  {% /task %}

  {% task id="task-20fc4aaa14e5" title="Let the group edit the page" %}
    Add write permission for the group on `index.html` only, without touching anything else, then check the mode.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# chmod g+w /srv/site/html/index.html
[root@servera ~]# ls -l /srv/site/html/index.html
-rw-rw-r--. 1 maria webteam 0 Oct  3 16:12 /srv/site/html/index.html
```
    {% /reveal %}
  {% /task %}

  {% task id="task-844e07e9a91b" title="Clean up" %}

    If `userdel` says a user is still in use, a login session from `su` has not closed yet: wait a few seconds and run it again.

```console
[root@servera ~]# rm -rf /srv/site
[root@servera ~]# userdel -r maria; userdel -r john
[root@servera ~]# groupdel webteam
[root@servera ~]# exit
[student@servera ~]$ exit
```
  {% /task %}
{% /lab %}
