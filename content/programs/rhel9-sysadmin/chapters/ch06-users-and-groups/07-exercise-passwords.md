---
title: "Exercise: Onboard and offboard an intern"
seoTitle: "Onboard and offboard an intern (RHCSA Practice Exercise)"
description: "Hands-on RHCSA practice: onboard and offboard an intern. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 15
---

{% lead %}
An intern starts on servera today. Give them a temporary password they must change at first login, apply the password policy, then see what locking and expiring the account do when their internship ends.
{% /lead %}

{% lab
  objectives=["ch06.passwords"]
  id="passwords"
  title="Onboard and offboard an intern"
  exercise="sa-passwords"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera"]
  outcomes=["Set a temporary password and force a change at the next login.","Apply password ageing with chage.","See the difference between locking and expiring an account."] %}

  {% task id="task-05f7cae6c3c5" title="Start the exercise" %}
    On workstation, start the exercise. It removes an intern account left by an earlier run from servera.

```console
[student@workstation ~]$ lab start sa-passwords
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-f7644ce3f4a5" title="Create the account with a temporary password" %}
    On servera as root (`sudo -i`), create `intern` ("Summer intern"), set the password `Welcome-2026`, and force a change at the next login.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# useradd -c "Summer intern" intern
[root@servera ~]# passwd intern
Changing password for user intern.
New password:
Retype new password:
passwd: all authentication tokens updated successfully.
[root@servera ~]# chage -d 0 intern
[root@servera ~]# chage -l intern | head -2
Last password change					: password must be changed
Password expires					: password must be changed
```
    {% /reveal %}
  {% /task %}

  {% task id="task-6d8edf26a71e" title="Log in as the intern" %}
    Leave the root shell, and switch to intern as student, as the intern would log in. Choose the new password `Plum-Tree-48`:

```console
[root@servera ~]# exit
[student@servera ~]$ su - intern
Password:
You are required to change your password immediately (administrator enforced).
Current password:
New password:
Retype new password:
[intern@servera ~]$ exit
logout
```

    The temporary password worked once, only to set a new one.
  {% /task %}

  {% task id="task-2303d019ae12" title="Apply the password policy" %}
    Company policy: passwords last at most 90 days, can't be changed again within 1 day, and users are warned 7 days ahead. Apply it to intern and check.

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ sudo chage -M 90 -m 1 -W 7 intern
[student@servera ~]$ sudo chage -l intern
Last password change					: Oct 03, 2026
Password expires					: Jan 01, 2027
Password inactive					: never
Account expires						: never
Minimum number of days between password change		: 1
Maximum number of days between password change		: 90
Number of days of warning before password expires	: 7
```
    {% /reveal %}
  {% /task %}

  {% task id="task-ca7cd4696759" title="Lock the password" %}
    The internship is paused. Lock the account and try to log in:

```console
[student@servera ~]$ sudo usermod -L intern
[student@servera ~]$ su - intern
Password:
su: Authentication failure
```

    The correct password is refused: locking made the hash unmatchable. Unlock it again with `sudo usermod -U intern`.
  {% /task %}

  {% task id="task-6e40c7338c8f" title="Expire the account" %}
    The internship has ended. Expire the account immediately:

```console
[student@servera ~]$ sudo usermod -U intern
[student@servera ~]$ sudo chage -E 0 intern
[student@servera ~]$ su - intern
Password:
Your account has expired; please contact your system administrator.
su: User account has expired
```

    Unlike a lock, expiry blocks every kind of login, including SSH keys. The account and its files remain, for the handover.
  {% /task %}

  {% task id="task-a28b7e5c2b0f" title="Grade and finish" %}
    {% lab-finish exercise="sa-passwords" grade=true servers=true /%}
  {% /task %}
{% /lab %}
