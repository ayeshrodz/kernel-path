---
title: "Exercise: Grant limited root access"
kind: lab
minutes: 20
---

{% lead %}
On servera, compare su and sudo, create a user who may not use sudo, then give that user permission to check services, and nothing else, with a drop-in rule. Finish by reading what sudo logged.
{% /lead %}

{% lab
  objectives=["ch06.superuser"]
  id="superuser"
  title="Grant limited root access"
  hosts=["workstation","servera"]
  outcomes=["Switch to root with su - and sudo -i.","Write, check and test a narrow sudo rule.","Find sudo's record of allowed and refused commands."] %}

  {% task id="task-9afd16d38260" title="Become root with su -, then with sudo -i" %}
    On servera, as student. root's password in the lab is `redhat`; student's is `student`.

```console
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ su -
Password:
[root@servera ~]# whoami
root
[root@servera ~]# exit
logout
[student@servera ~]$ sudo -i
[sudo] password for student:
[root@servera ~]# exit
logout
```

    Both give a root shell. `su -` needed root's password; `sudo -i` needed yours.
  {% /task %}

  {% task id="task-5df89488102c" title="Create a user without sudo rights" %}
    Create the user `tester` with the password `tester123`. You'll meet `useradd` properly in the next lesson.

```console
[student@servera ~]$ sudo useradd tester
[student@servera ~]$ sudo passwd tester
Changing password for user tester.
New password:
BAD PASSWORD: The password contains the user name in some form
Retype new password:
passwd: all authentication tokens updated successfully.
```

    The warning is advice: root may set a weak password anyway, which is fine in a practice lab.
  {% /task %}

  {% task id="task-83be4a0fc7bf" title="Confirm that tester can't use sudo" %}

```console
[student@servera ~]$ su - tester
Password:
[tester@servera ~]$ sudo id
[sudo] password for tester:
tester is not in the sudoers file.
[tester@servera ~]$ exit
logout
```
  {% /task %}

  {% task id="task-ab65da448cda" title="Allow tester to check any service, and nothing more" %}
    Create `/etc/sudoers.d/tester` with a rule that lets tester run `systemctl status` with any arguments as root. Make it readable only by root and check the syntax.

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ sudo -i
[root@servera ~]# echo 'tester ALL=(ALL) /usr/bin/systemctl status *' > /etc/sudoers.d/tester
[root@servera ~]# chmod 440 /etc/sudoers.d/tester
[root@servera ~]# visudo -c
/etc/sudoers: parsed OK
/etc/sudoers.d/tester: parsed OK
[root@servera ~]# exit
```

    The single quotes stop the shell from expanding the `*`: it must reach the file as a literal `*`.
    {% /reveal %}
  {% /task %}

  {% task id="task-998b6c25003b" title="Test the rule from both sides" %}

```console
[student@servera ~]$ su - tester
Password:
[tester@servera ~]$ sudo -l
[sudo] password for tester:
...output omitted...
User tester may run the following commands on servera:
    (ALL) /usr/bin/systemctl status *
[tester@servera ~]$ sudo systemctl status sshd | head -3
● sshd.service - OpenSSH server daemon
     Loaded: loaded (/usr/lib/systemd/system/sshd.service; enabled; preset: enabled)
     Active: active (running) since Sat 2026-10-03 10:30:07 UTC; 2min 27s ago
[tester@servera ~]$ sudo systemctl restart sshd
Sorry, user tester is not allowed to execute '/bin/systemctl restart sshd' as root on servera.lab.example.com.
[tester@servera ~]$ exit
```
  {% /task %}

  {% task id="task-3d6f8a81bdc2" title="Read the record, then clean up" %}

```console
[student@servera ~]$ sudo grep 'tester :' /var/log/secure
...  tester : user NOT in sudoers ; TTY=pts/0 ; PWD=/home/tester ; USER=root ; COMMAND=/bin/id
...  tester : TTY=pts/1 ; PWD=/home/tester ; USER=root ; COMMAND=/usr/bin/systemctl status sshd
...  tester : command not allowed ; TTY=pts/1 ; PWD=/home/tester ; USER=root ; COMMAND=/bin/systemctl restart sshd
[student@servera ~]$ sudo rm /etc/sudoers.d/tester
[student@servera ~]$ sudo userdel -r tester
[student@servera ~]$ exit
```

    Each line shows who, from which directory, as whom and what, and whether sudo allowed it.
  {% /task %}
{% /lab %}
