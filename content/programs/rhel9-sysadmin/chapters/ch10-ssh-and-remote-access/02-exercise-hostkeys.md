---
title: "Exercise: Verify a server's identity"
seoTitle: "Verify a server's identity (RHCSA Practice Exercise)"
description: "Hands-on RHCSA practice: verify a server's identity. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 20
---

{% lead %}
Compare the fingerprint your workstation trusts with the one the server really has, then see what ssh does when it meets a stranger, a friend, and an impostor. Everything happens in a throw-away known-hosts file, so your real one stays intact.
{% /lead %}

{% lab
  objectives=["ch10.basics"]
  id="hostkeys"
  title="Verify a server's identity"
  hosts=["workstation","servera"]
  outcomes=["Compare a stored fingerprint with the server's real one.","Answer the first-contact question in a considered way.","Recognise the changed-key warning."] %}

  {% task id="task-23ddc34b1b6b" title="Compare the fingerprints" %}
    On workstation, show the fingerprint stored for `servera` in `~/.ssh/known_hosts`. Then ask servera for the fingerprint of its own Ed25519 host key (the lab lets you do this as root over SSH) and compare.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh-keygen -lF servera
# Host servera found: line 4
servera ED25519 SHA256:FiQsZBEl3IPrcGlIbHS4VrVteB5aT0PVAD5VNj91+Hk
[student@workstation ~]$ ssh root@servera ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
256 SHA256:FiQsZBEl3IPrcGlIbHS4VrVteB5aT0PVAD5VNj91+Hk root@servera (ED25519)
```

    The two SHA256 strings are identical: your workstation trusts the right key. (Your strings will differ from the ones shown.)
    {% /reveal %}
  {% /task %}

  {% task id="task-38da8ff54406" title="Play the stranger" %}
    Create a new, empty known-hosts file at `/tmp/kh`, and connect to servera as `ops` using only that file (`-o UserKnownHostsFile=/tmp/kh`) and password authentication. Read the question, answer `yes`, and enter the password when asked. Log out, then look at `/tmp/kh`.

    First create the account on servera, as root: `useradd -m ops; echo 'Ops-Pass-2026' | passwd --stdin ops`.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh root@servera "useradd -m ops; echo 'Ops-Pass-2026' | passwd --stdin ops"
Changing password for user ops.
passwd: all authentication tokens updated successfully.
[student@workstation ~]$ ssh -o UserKnownHostsFile=/tmp/kh -o PubkeyAuthentication=no ops@servera
The authenticity of host 'servera (172.25.250.10)' can't be established.
ED25519 key fingerprint is SHA256:FiQsZBEl3IPrcGlIbHS4VrVteB5aT0PVAD5VNj91+Hk.
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added 'servera' (ED25519) to the list of known hosts.
ops@servera's password:
[ops@servera ~]$ exit
logout
[student@workstation ~]$ cut -c1-70 /tmp/kh
servera ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEq/gysqG3foWRTSyKuVl0kS/q
```

    Because you compared the fingerprints in the previous task, answering `yes` was an informed decision. The key is now stored in `/tmp/kh`.
    {% /reveal %}
  {% /task %}

  {% task id="task-1a0c0107e253" title="The second visit" %}
    Connect again with the same file and run `hostname`. Did it ask anything?

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh -o UserKnownHostsFile=/tmp/kh -o PubkeyAuthentication=no ops@servera hostname
ops@servera's password:
servera.lab.example.com
```

    No question: the stored key matched, so ssh went straight to the login.
    {% /reveal %}
  {% /task %}

  {% task id="task-2d037498739a" title="Meet an impostor" %}
    Make a fake host key (`ssh-keygen -t ed25519 -N '' -f /tmp/fake`), put it in a second file `/tmp/kh2` under the name `servera`, and connect with that file. What does ssh say?

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh-keygen -t ed25519 -N '' -f /tmp/fake -q
[student@workstation ~]$ echo "servera $(cut -d' ' -f1,2 /tmp/fake.pub)" > /tmp/kh2
[student@workstation ~]$ ssh -o UserKnownHostsFile=/tmp/kh2 -o PubkeyAuthentication=no ops@servera hostname
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@    WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!     @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
...output omitted...
Offending ED25519 key in /tmp/kh2:1
Host key for servera has changed and you have requested strict checking.
Host key verification failed.
```

    The server presented its real key, which differs from the "remembered" fake one, so ssh refused to send any password. That is the protection working.
    {% /reveal %}
  {% /task %}

  {% task id="task-36973d799587" title="Clean up" %}

```console
[student@workstation ~]$ rm -f /tmp/kh /tmp/kh2 /tmp/fake /tmp/fake.pub
```

    Keep the `ops` account on servera for the next exercises.
  {% /task %}
{% /lab %}
