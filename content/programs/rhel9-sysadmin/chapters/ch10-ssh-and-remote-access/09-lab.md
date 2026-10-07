---
title: "Exercise: Secure remote access review"
seoTitle: "SSH Practice Lab (RHCSA Exam Style)"
description: "Graded RHCSA exam-style lab on SSH: a challenge with requirements, hints and solutions, and a grader that checks your work on your own lab."
kind: lab
minutes: 35
---

{% lead %}
Give a service account key-only access, harden the SSH server without locking yourself out, and move files with scp and rsync, mirroring a directory.
{% /lead %}

{% lab
  objectives=["ch10.basics","ch10.keys","ch10.transfer","ch10.hardening"]
  id="review"
  title="Secure remote access review"
  exercise="sa-ssh-review"
  ownExercise=true
  hosts=["workstation","servera"]
  outcomes=["Set up key authentication and a host alias.","Harden sshd with a correctly named drop-in.","Transfer and mirror files with scp and rsync."] %}
{% lab-notes %}

**Before you start:** reset the servers and complete this chapter's lessons. You work on workstation as `student` and use `ssh root@servera` for the administration. The grader looks at the hardening settings, the account, the copied files and your `answers.txt`; it connects to servera as root with a key, so do **not** set `PermitRootLogin no`.

{% /lab-notes %}

{% lab-challenge %}

1. On servera, create the account `ops` (password `Ops-Pass-2026`). On workstation, create the key `~/.ssh/id_ops` and install it with `ssh-copy-id`. Add a `Host opsa` alias to `~/.ssh/config`.
2. In `/etc/ssh/sshd_config.d/10-hardening.conf` on servera, set `PasswordAuthentication no`, `X11Forwarding no`, `MaxAuthTries 3` and `LoginGraceTime 30`. Check with `sshd -T` and reload. Keep a second session open while you do it.
3. Copy `inventory.txt` to the home directory of `ops`.
4. Copy `reports/` into `/home/ops/mirror/` with rsync. Then delete `reports/b.txt` locally and run rsync with `--delete`.
5. Put servera's Ed25519 host key fingerprint and key type in `answers.txt`.

{% /lab-challenge %}

  {% task id="task-bf26fa95c53b" title="Start the exercise" %}

```console
[student@workstation ~]$ lab start sa-ssh-review
[student@workstation ~]$ cd ~/sa-ssh-review
[student@workstation sa-ssh-review]$
```
  {% /task %}

  {% task id="task-31ad535d5c2b" title="Account, key and alias" %}

    {% reveal title="Show solution" %}

```console
[student@workstation sa-ssh-review]$ ssh root@servera "useradd -m ops && echo 'Ops-Pass-2026' | passwd --stdin ops"
[student@workstation sa-ssh-review]$ ssh-keygen -t ed25519 -f ~/.ssh/id_ops -N '' -C 'student@workstation (ops)'
[student@workstation sa-ssh-review]$ ssh-copy-id -i ~/.ssh/id_ops.pub ops@servera
[student@workstation sa-ssh-review]$ cat >> ~/.ssh/config <<'EOT'

Host opsa
    HostName servera
    User ops
    IdentityFile ~/.ssh/id_ops
    IdentitiesOnly yes
EOT
[student@workstation sa-ssh-review]$ ssh opsa hostname
servera.lab.example.com
```
    {% /reveal %}
  {% /task %}

  {% task id="task-8472abb829cf" title="Harden sshd" %}

    {% reveal title="Show solution" %}

```console
[student@workstation sa-ssh-review]$ ssh root@servera
[root@servera ~]# printf 'PasswordAuthentication no\nX11Forwarding no\nMaxAuthTries 3\nLoginGraceTime 30\n' > /etc/ssh/sshd_config.d/10-hardening.conf
[root@servera ~]# sshd -t && systemctl reload sshd
[root@servera ~]# sshd -T | grep -E '^(passwordauthentication|x11forwarding|maxauthtries|logingracetime) '
logingracetime 30
maxauthtries 3
passwordauthentication no
x11forwarding no
```

    In a second terminal, run `ssh opsa hostname` to prove the key login still works before you close the first session.
    {% /reveal %}
  {% /task %}

  {% task id="task-f5dc0109ce54" title="Copy and mirror" %}

    {% reveal title="Show solution" %}

```console
[student@workstation sa-ssh-review]$ scp inventory.txt opsa:
[student@workstation sa-ssh-review]$ rsync -av reports/ opsa:mirror/
[student@workstation sa-ssh-review]$ rm reports/b.txt
[student@workstation sa-ssh-review]$ rsync -avn --delete reports/ opsa:mirror/
[student@workstation sa-ssh-review]$ rsync -av --delete reports/ opsa:mirror/
[student@workstation sa-ssh-review]$ ssh opsa ls mirror
a.txt
c.txt
```
    {% /reveal %}
  {% /task %}

  {% task id="task-ddaf4ab39986" title="Record the fingerprint and grade" %}
    Fill in `answers.txt` (use `ssh-keygen -lF servera`; the type is the word ED25519 in the listing), then:

    {% lab-finish exercise="sa-ssh-review" grade=true servers=true /%}
  {% /task %}
{% /lab %}
