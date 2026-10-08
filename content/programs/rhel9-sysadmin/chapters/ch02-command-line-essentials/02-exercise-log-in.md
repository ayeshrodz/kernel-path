---
title: "Exercise: Log in and find your way"
seoTitle: "Log in and find your way (RHCSA Practice Exercise)"
description: "Hands-on RHCSA practice: log in and find your way. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 10
---

{% lead %}
Open a shell on workstation, read the prompt, hop to both servers with SSH, become root and come back. Nothing here changes the lab, so you can repeat it as often as you like.
{% /lead %}

{% lab
  objectives=["ch02.shell"]
  id="log-in"
  title="Log in and find your way"
  hosts=["Ubuntu host","workstation","servera","serverb"]
  outcomes=["Open a shell on workstation and read its prompt.","Log in to the servers with SSH and recognise a first-connection warning.","Switch to root and back, and log out."] %}

  {% task id="task-a38f525553af" title="Host: open a shell on workstation" %}
    On the Ubuntu host, run:

```console
<HOST_USER>@host:~$ rht-vmctl ws
[student@workstation ~]$
```

    Read the prompt aloud: you are **student**, on **workstation**, in your home directory (**~**), as an ordinary user (**$**). Every later task runs here unless it says otherwise.
  {% /task %}

  {% task id="task-a1d85937aa07" title="Workstation: ask the system who and where you are" %}
    Three small commands answer the questions the prompt abbreviates:

```console
[student@workstation ~]$ whoami
student
[student@workstation ~]$ hostname
workstation.lab.example.com
[student@workstation ~]$ date
Sat Oct  3 09:30:23 AM UTC 2026
```

    `hostname` prints the full name; the prompt shows only the part before the first dot. Your date and time will differ: the lab's clock runs in UTC.
  {% /task %}

  {% task id="task-fba3c7e32923" title="Workstation: log in to servera" %}
    Your SSH key from chapter 1 logs you in without a password. Watch the hostname in the prompt change:

```console
[student@workstation ~]$ ssh student@servera
Last login: Sat Oct  3 09:30:04 2026 from 172.25.250.9
[student@servera ~]$ hostname
servera.lab.example.com
```

    `Last login` tells you when this account last logged in, and from where. It is worth a glance on a real server: a login you don't recognise is a reason to investigate.
  {% /task %}

  {% task id="task-640574bc8d4f" title="servera: become root, then go back" %}
    `sudo -i` asks for **your** password (`student`) and opens a root shell. The very first time an account uses sudo on a machine, sudo also prints a short reminder to respect others' privacy and think before you type; you saw it in chapter 1 when you set up the keys.

```console
[student@servera ~]$ sudo -i
[sudo] password for student:
[root@servera ~]# whoami
root
[root@servera ~]# exit
logout
[student@servera ~]$
```

    The prompt ends in `#` while you are root. `exit` returns you to student, still on servera.
  {% /task %}

  {% task id="task-6b5a6e46bddc" title="servera: log out with Ctrl+D" %}
    Press {% kbd %}Ctrl{% /kbd %}+{% kbd %}D{% /kbd %} at the prompt. It means "end of input", and the shell treats it like `exit`:

```console
[student@servera ~]$ logout
Connection to servera closed.
[student@workstation ~]$
```
  {% /task %}

  {% task id="task-f86d58865967" title="Workstation: meet a first-connection warning" %}
    Your account has seen serverb's host key under its names, but not under its IP address, so connecting by address triggers the first-connection check. Read the whole message before answering `yes`:

```console
[student@workstation ~]$ ssh student@172.25.250.11
The authenticity of host '172.25.250.11 (172.25.250.11)' can't be established.
ED25519 key fingerprint is SHA256:7N7t4m6HkSRbZBH7LwIPFphA74uWFmwfY/AJmjjLVqs.
This host key is known by the following other names/addresses:
    ~/.ssh/known_hosts:5: serverb.lab.example.com
    ~/.ssh/known_hosts:8: serverb
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added '172.25.250.11' (ED25519) to the list of known hosts.
[student@serverb ~]$
```

    SSH helpfully points out that the same key is already trusted under serverb's names, which is good evidence that this really is serverb. Your fingerprint and line numbers will differ.

    {% reveal title="Why would a key be different?" %}
    Every machine generates its own host keys when it is first installed. If you rebuild servera, the new servera has new keys, and SSH refuses to connect until you remove the old entry with `ssh-keygen -R servera`. On a real network, a key that changes without a rebuild is a warning sign.
    {% /reveal %}
  {% /task %}

  {% task id="task-b61decd24eea" title="serverb: log out" %}

```console
[student@serverb ~]$ exit
logout
Connection to 172.25.250.11 closed.
[student@workstation ~]$
```

    You are back on workstation. Nothing in this exercise changed the servers, so there is nothing to reset.
  {% /task %}
{% /lab %}
