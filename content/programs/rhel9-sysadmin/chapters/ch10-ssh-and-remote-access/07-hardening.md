---
title: Configuring and hardening the SSH server
seoTitle: "Harden sshd: Disable Root and Password Login"
description: "Configure sshd safely with drop-in files: disable password and root logins and test before reloading. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 20
---

{% lead %}
The SSH server, `sshd`, is the most exposed service on most machines, and the one you use to repair everything else. That is why changing its configuration deserves care: a typo can lock you out of the very server you are managing. This lesson shows where the settings live, how sshd decides between conflicting lines, and a routine for changing it safely.
{% /lead %}

{% objectives %}
- Find the sshd configuration, and explain how drop-ins in `sshd_config.d` are ordered and which line wins.
- Apply common hardening settings, and check them with `sshd -t` and `sshd -T`.
- Change sshd safely: keep a session open, reload instead of restart, and test a new login.
{% /objectives %}

## Where the settings are

The server reads `/etc/ssh/sshd_config`. Its first active line includes every file in `/etc/ssh/sshd_config.d/` (`Include /etc/ssh/sshd_config.d/*.conf`), so you can keep local changes in a small file of your own instead of editing the packaged one. On RHEL the directory already holds files from the distribution and from cloud-init:

```console
[root@servera ~]# ls /etc/ssh/sshd_config.d
50-cloud-init.conf  50-redhat.conf
[root@servera ~]# grep -n "^Include" /etc/ssh/sshd_config
15:Include /etc/ssh/sshd_config.d/*.conf
```

Settings you will meet most often:

| Setting | Does | Hardened value |
| --- | --- | --- |
| `PermitRootLogin` | May root log in over SSH? `prohibit-password` (the default here) allows root with a key only | `no` once everyone can use `sudo` |
| `PasswordAuthentication` | Allow password logins | `no`, once keys work |
| `PubkeyAuthentication` | Allow key logins | `yes` |
| `MaxAuthTries` | Failed attempts per connection | `3` |
| `X11Forwarding` | Graphical forwarding | `no` on servers |
| `AllowUsers` / `AllowGroups` | Only these accounts may log in | A short list |
| `Port` | The listening port | Changing it is not real protection |

## The first value wins

When an option appears more than once, sshd keeps the **first** value it reads, and the drop-in files are read in alphabetical order, before the rest of the main file. This surprises almost everybody, so look at it carefully:

{% diagram ref="precedence" /%}

Cloud-init ships `50-cloud-init.conf` with `PasswordAuthentication yes`. A `99-hardening.conf` saying `no` is read later and ignored. Name your file `10-hardening.conf` so it is read first:

```console
[root@servera ~]# printf 'PasswordAuthentication no\nX11Forwarding no\nMaxAuthTries 3\n' > /etc/ssh/sshd_config.d/10-hardening.conf
[root@servera ~]# sshd -T | grep -E '^(passwordauthentication|x11forwarding|maxauthtries) '
maxauthtries 3
passwordauthentication no
x11forwarding no
```

Never trust the file you wrote: **`sshd -T` shows the value sshd would really use**. `sshd -t` only checks the syntax, and prints nothing when it is fine; a typo is reported with its line:

```console
[root@servera ~]# sshd -t
/etc/ssh/sshd_config.d/20-typo.conf: line 1: Bad configuration option: PasswordAuthenticaton
/etc/ssh/sshd_config.d/20-typo.conf: terminating, 1 bad configuration options
```

## Change it without locking yourself out

{% diagram ref="safe-change" /%}

```console
[root@servera ~]# sshd -t && systemctl reload sshd
[root@servera ~]# journalctl -u sshd -n 2 --no-pager
```

`reload` makes sshd re-read its files while existing connections stay up; a full `restart` would drop them. And if a change denies **you** access, the session you kept open, or the console, is how you undo it.

{% callout type="warning" title="PermitRootLogin and this course's lab" %}
The lab tools and graders log in as `root` with a key. Setting `PermitRootLogin no` is a good production habit, but in the lab it stops `lab grade` from reaching your servers. If you try it, undo it before grading.
{% /callout %}

## Watching what happens

Every login, accepted or refused, is logged with the user, the source address and the method:

```console
[root@servera ~]# journalctl -u sshd --no-pager | tail -3 | cut -c40-
sshd-session[1049]: Accepted publickey for ops from 172.25.251.9 port 41346 ssh2: ED25519 SHA256:5AQb...
sshd-session[1049]: pam_unix(sshd:session): session opened for user ops(uid=1001) by (uid=0)
sshd-session[1049]: pam_unix(sshd:session): session closed for user ops
```

The same lines appear in `/var/log/secure`. After you disable passwords, a refused attempt from a client looks like this:

```console
[student@workstation ~]$ ssh -o PubkeyAuthentication=no ops@servera true
ops@servera: Permission denied (publickey,gssapi-keyex,gssapi-with-mic).
```

Note that `password` is gone from the list of accepted methods.

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch10.hardening"] ref="quick" /%}
