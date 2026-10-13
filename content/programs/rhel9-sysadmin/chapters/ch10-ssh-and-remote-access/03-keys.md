---
title: Key-based authentication
seoTitle: "SSH Key Authentication: ssh-keygen and ssh-copy-id"
description: "Set up passwordless SSH logins with ssh-keygen, ssh-copy-id, the agent and correct permissions. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 20
---

{% lead %}
Passwords can be guessed, reused, phished and typed a hundred times a day. An SSH **key pair** replaces them: a private key that never leaves your machine, and a public key that you can hand to any server. It is more secure and more convenient, and it is what makes automation possible. This lesson creates a pair, installs it, protects it, and explains the permissions that sshd insists on.
{% /lead %}

{% objectives %}
- Explain how a key login works and why the private key is never sent.
- Create a key pair with `ssh-keygen` and install the public key with `ssh-copy-id`.
- Use a passphrase and `ssh-agent`, and fix the ownership and permissions that block key logins.
{% /objectives %}

## How a key login works

{% diagram ref="key-auth" /%}

The two halves are mathematically linked, but nobody can work out the private one from the public one. So the public key is safe to copy around, and the private key is the one thing you must protect.

## Create a key pair

```console
[student@workstation ~]$ ssh-keygen -t ed25519 -f ~/.ssh/id_ops -C 'student@workstation (ops)'
Generating public/private ed25519 key pair.
Enter passphrase (empty for no passphrase):
Enter same passphrase again:
Your identification has been saved in /home/student/.ssh/id_ops
Your public key has been saved in /home/student/.ssh/id_ops.pub
The key fingerprint is:
SHA256:5AQbFTBUkvfPw8I6cXrZ71yQTp6wis83oln7qAUHiBA student@workstation (ops)
[student@workstation ~]$ ls -l ~/.ssh/id_ops*
-rw-------. 1 student student 419 Oct  3 16:48 /home/student/.ssh/id_ops
-rw-r--r--. 1 student student 107 Oct  3 16:48 /home/student/.ssh/id_ops.pub
```

- `-t ed25519` chooses a modern, compact and fast key type. (`rsa -b 4096` works where old systems need it.)
- `-f` names the file; without it, the default is `~/.ssh/id_ed25519`.
- `-C` adds a comment, which helps to recognise the key in `authorized_keys` later.
- The **passphrase** encrypts the private key file. Use one for any key that matters: a stolen file is then useless by itself. Leaving it empty is common for unattended jobs, and then the file's permissions are the only protection.

The private key is created with mode `600` (only you). Keep it that way: `ssh` refuses to use a private key that others can read.

## Install the public key on a server

`ssh-copy-id` logs in once with a password, appends your public key to `~/.ssh/authorized_keys` on the server, and sets the permissions correctly:

```console
[student@workstation ~]$ ssh-copy-id -i ~/.ssh/id_ops.pub ops@servera
...output omitted...
ops@servera's password:

Number of key(s) added: 1

Now try logging into the machine, with: "ssh -i /home/student/.ssh/id_ops 'ops@servera'"
and check to make sure that only the key(s) you wanted were added.
[student@workstation ~]$ ssh -i ~/.ssh/id_ops ops@servera hostname
servera.lab.example.com
```

On the server, look at the result:

```console
[student@workstation ~]$ ssh -i ~/.ssh/id_ops ops@servera ls -ld .ssh .ssh/authorized_keys
drwx------. 2 ops ops 4096 Oct  3 16:48 .ssh
-rw-------. 1 ops ops  107 Oct  3 16:48 .ssh/authorized_keys
```

### Ownership and permissions

sshd is strict: if `~/.ssh` or `authorized_keys` could be changed by anyone but the account owner (and root), it ignores the keys. The rules:

| Path | Owner | Mode |
| --- | --- | --- |
| `~/.ssh` | the user | `700` |
| `~/.ssh/authorized_keys` | the user | `600` |
| the user's home directory | the user | not writable by group or others |

The symptom of getting it wrong is that you are asked for a password even though the key is installed. The server's log gives the reason:

```console
[root@servera ~]# chmod 666 /home/ops/.ssh/authorized_keys
[root@servera ~]# journalctl -u sshd -n 2 --no-pager | cut -c40-
sshd-session[1169]: Authentication refused: bad ownership or modes for file /home/ops/.ssh/authorized_keys
sshd-session[1169]: Connection closed by authenticating user ops 172.25.251.9 port 42452 [preauth]
```

If files were created by root (for example by copying with `sudo`), also check the owner, and run `restorecon -R ~/.ssh` to repair SELinux labels (chapter 16).

## Passphrases and ssh-agent

With a passphrase you would type it for every connection. **ssh-agent** keeps the unlocked key in memory so you enter the passphrase once:

```console
[student@workstation ~]$ eval $(ssh-agent -s)
Agent pid 1400
[student@workstation ~]$ ssh-add ~/.ssh/id_ops
Enter passphrase for /home/student/.ssh/id_ops:
Identity added: /home/student/.ssh/id_ops (student@workstation (ops))
[student@workstation ~]$ ssh-add -l
256 SHA256:5AQbFTBUkvfPw8I6cXrZ71yQTp6wis83oln7qAUHiBA student@workstation (ops) (ED25519)
```

The agent lives as long as that shell session (or until `ssh-agent -k`). To add or change a passphrase on an existing key: `ssh-keygen -p -f ~/.ssh/id_ops`.

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch10.keys"] ref="quick" /%}
