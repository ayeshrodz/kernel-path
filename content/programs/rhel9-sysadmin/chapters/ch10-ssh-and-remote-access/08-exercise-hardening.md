---
title: "Exercise: Harden sshd, safely"
seoTitle: "Harden sshd, safely (RHCSA Practice Exercise)"
description: "Hands-on RHCSA practice: harden sshd, safely. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 25
---

{% lead %}
Turn off password logins on servera, prove the change with a failed password attempt and a working key login, learn why a drop-in named `99-` does not work, and finish by undoing the changes.
{% /lead %}

{% lab
  objectives=["ch10.hardening"]
  id="hardening"
  title="Harden sshd, safely"
  exercise="sa-hardening"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera"]
  outcomes=["Write a sshd drop-in and verify it with sshd -T.","Demonstrate that password logins are refused and key logins still work.","Explain the first-value-wins rule."] %}

  {% task id="task-902b9a7b40a6" title="Start the exercise" %}
    On workstation, start the exercise. It creates the account `ops` on servera with a key (`~/.ssh/id_ops` on workstation) that you will keep using after passwords are switched off.

```console
[student@workstation ~]$ lab start sa-hardening
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-2fc1cb637c22" title="Open the spare session" %}
    Open **two** terminals on workstation, both logged in to servera as root (`ssh root@servera`). Leave the second one alone: it is your way back in if the change goes wrong. Show the current values of the options you will change.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh root@servera
[root@servera ~]# sshd -T | grep -E '^(passwordauthentication|x11forwarding|maxauthtries|permitrootlogin) '
maxauthtries 6
permitrootlogin without-password
passwordauthentication yes
x11forwarding yes
[root@servera ~]# ls /etc/ssh/sshd_config.d
50-cloud-init.conf  50-redhat.conf
```
    {% /reveal %}
  {% /task %}

  {% task id="task-c0a0b40e2e33" title="Try the wrong file name first" %}
    Create `/etc/ssh/sshd_config.d/99-hardening.conf` with `PasswordAuthentication no`, `X11Forwarding no` and `MaxAuthTries 3`. Check with `sshd -T`. Which options took effect?

    {% reveal title="Show solution" %}

```console
[root@servera ~]# printf 'PasswordAuthentication no\nX11Forwarding no\nMaxAuthTries 3\n' > /etc/ssh/sshd_config.d/99-hardening.conf
[root@servera ~]# sshd -t
[root@servera ~]# sshd -T | grep -E '^(passwordauthentication|x11forwarding|maxauthtries) '
maxauthtries 3
passwordauthentication yes
x11forwarding yes
```

    Only `MaxAuthTries` took effect, because nobody else set it earlier. The other two were already set (`yes`) by files that sort before `99`, and the first value wins.
    {% /reveal %}
  {% /task %}

  {% task id="task-79adb9727a19" title="Use the right file name" %}
    Move the file to `10-hardening.conf` and check again. Then validate, reload, and check the logs.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# mv /etc/ssh/sshd_config.d/99-hardening.conf /etc/ssh/sshd_config.d/10-hardening.conf
[root@servera ~]# sshd -T | grep -E '^(passwordauthentication|x11forwarding|maxauthtries) '
maxauthtries 3
passwordauthentication no
x11forwarding no
[root@servera ~]# sshd -t && systemctl reload sshd
[root@servera ~]# systemctl is-active sshd
active
```
    {% /reveal %}
  {% /task %}

  {% task id="task-8fc46432b23e" title="Test a new login" %}
    In a third terminal on workstation, try to log in as `ops` with a password only (`-o PubkeyAuthentication=no`), then with the key `~/.ssh/id_ops`. This requires the key from the keys exercise.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh -o PubkeyAuthentication=no ops@servera true
ops@servera: Permission denied (publickey,gssapi-keyex,gssapi-with-mic).
[student@workstation ~]$ ssh -i ~/.ssh/id_ops ops@servera 'echo key login still works'
key login still works
```

    Passwords are refused; the key works. (If you had not set up keys first, you would have locked `ops` out: that is why the spare session matters.)
    {% /reveal %}
  {% /task %}

  {% task id="task-8875b0f1da54" title="Look at the log" %}
    On servera, show the last log lines of sshd.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# journalctl -u sshd --no-pager -n 4 | cut -c40-
sshd-session[1049]: Accepted publickey for ops from 172.25.251.9 port 41346 ssh2: ED25519 SHA256:5AQb...
sshd-session[1049]: pam_unix(sshd:session): session opened for user ops(uid=1001) by (uid=0)
```
    {% /reveal %}
  {% /task %}

  {% task id="task-501bd5eab37d" title="Grade and finish" %}
    {% lab-finish exercise="sa-hardening" grade=true servers=true /%}
  {% /task %}
{% /lab %}
