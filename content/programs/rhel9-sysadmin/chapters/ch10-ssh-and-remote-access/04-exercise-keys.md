---
title: "Exercise: Passwordless access for an account"
kind: lab
minutes: 25
---

{% lead %}
Set up key-based login from workstation to the `ops` account on servera, check the files it creates, break it on purpose with bad permissions, read the server's explanation, and fix it. You also put a passphrase on a key and use the agent.
{% /lead %}

{% lab
  objectives=["ch10.keys"]
  id="keys"
  title="Passwordless access for an account"
  exercise="sa-keys"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera"]
  outcomes=["Create a key pair and install it with ssh-copy-id.","Diagnose a key refused because of permissions.","Use a passphrase with ssh-agent."] %}

  {% task id="task-d19e45fd21eb" title="Start the exercise" %}
    On workstation, start the exercise. It creates the account `ops` on servera with the password `Ops-Pass-2026` and removes key files of an earlier run from workstation.

```console
[student@workstation ~]$ lab start sa-keys
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-dba8dc306c6b" title="Create the key pair" %}
    Generate an Ed25519 key `~/.ssh/id_ops` with the comment `student@workstation (ops)` and **no** passphrase. Check the permissions of both files.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh-keygen -t ed25519 -f ~/.ssh/id_ops -N '' -C 'student@workstation (ops)'
Generating public/private ed25519 key pair.
Your identification has been saved in /home/student/.ssh/id_ops
Your public key has been saved in /home/student/.ssh/id_ops.pub
The key fingerprint is:
SHA256:5AQbFTBUkvfPw8I6cXrZ71yQTp6wis83oln7qAUHiBA student@workstation (ops)
...output omitted...
[student@workstation ~]$ ls -l ~/.ssh/id_ops*
-rw-------. 1 student student 419 Oct  3 16:48 /home/student/.ssh/id_ops
-rw-r--r--. 1 student student 107 Oct  3 16:48 /home/student/.ssh/id_ops.pub
```

    `-N ''` means an empty passphrase. Your fingerprint will be different.
    {% /reveal %}
  {% /task %}

  {% task id="task-b25a766916dd" title="Install it and log in" %}
    Install the public key for `ops@servera` and log in using it. Then look at `~/.ssh` on the server.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh-copy-id -i ~/.ssh/id_ops.pub ops@servera
...output omitted...
ops@servera's password:

Number of key(s) added: 1
...output omitted...
[student@workstation ~]$ ssh -i ~/.ssh/id_ops ops@servera 'hostname; ls -ld ~/.ssh ~/.ssh/authorized_keys'
servera.lab.example.com
drwx------. 2 ops ops 4096 Oct  3 16:48 /home/ops/.ssh
-rw-------. 1 ops ops  107 Oct  3 16:48 /home/ops/.ssh/authorized_keys
```

    Type the password `Ops-Pass-2026` when asked. It is the last time.
    {% /reveal %}
  {% /task %}

  {% task id="task-666c628a7cd9" title="Break it with bad permissions" %}
    As root on servera, make `authorized_keys` writable by everyone (`chmod 666`). Try the key login again with `-o BatchMode=yes` (so ssh will not ask for a password). What happens, and what does the server's log say?

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh root@servera chmod 666 /home/ops/.ssh/authorized_keys
[student@workstation ~]$ ssh -o BatchMode=yes -i ~/.ssh/id_ops ops@servera true
ops@servera: Permission denied (publickey,gssapi-keyex,gssapi-with-mic,password).
[student@workstation ~]$ ssh root@servera "journalctl -u sshd -n 2 --no-pager | cut -c40-"
sshd-session[1169]: Authentication refused: bad ownership or modes for file /home/ops/.ssh/authorized_keys
sshd-session[1169]: Connection closed by authenticating user ops 172.25.251.9 port 42452 [preauth]
```

    The client only says "denied". The real reason is in the server's log.
    {% /reveal %}
  {% /task %}

  {% task id="task-d0ee53b87280" title="Fix it" %}
    Restore mode `600` on the file. Then break the directory instead (`chmod 777 /home/ops/.ssh`), read the new log message, and fix that too (`700`). Confirm that the login works again.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh root@servera "chmod 600 /home/ops/.ssh/authorized_keys; chmod 777 /home/ops/.ssh"
[student@workstation ~]$ ssh -o BatchMode=yes -i ~/.ssh/id_ops ops@servera true
ops@servera: Permission denied (publickey,gssapi-keyex,gssapi-with-mic,password).
[student@workstation ~]$ ssh root@servera "journalctl -u sshd -n 1 --no-pager | cut -c40-"
sshd-session[1192]: Authentication refused: bad ownership or modes for directory /home/ops/.ssh
[student@workstation ~]$ ssh root@servera "chmod 700 /home/ops/.ssh"
[student@workstation ~]$ ssh -o BatchMode=yes -i ~/.ssh/id_ops ops@servera 'echo key login works'
key login works
```
    {% /reveal %}
  {% /task %}

  {% task id="task-bb1584d0138b" title="Add a passphrase and use the agent" %}
    Copy the key to `id_pp`, give the copy the passphrase `secret-phrase`, and start an agent in your shell. Load the key (type the passphrase), then log in without being asked again. Finally stop the agent.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ cp ~/.ssh/id_ops ~/.ssh/id_pp
[student@workstation ~]$ cp ~/.ssh/id_ops.pub ~/.ssh/id_pp.pub
[student@workstation ~]$ ssh-keygen -p -f ~/.ssh/id_pp
Enter new passphrase (empty for no passphrase):
Enter same new passphrase again:
Your identification has been saved with the new passphrase.
[student@workstation ~]$ eval $(ssh-agent -s)
Agent pid 1400
[student@workstation ~]$ ssh-add ~/.ssh/id_pp
Enter passphrase for /home/student/.ssh/id_pp:
Identity added: /home/student/.ssh/id_pp (student@workstation (ops))
[student@workstation ~]$ ssh -i ~/.ssh/id_pp ops@servera 'echo via agent'
via agent
[student@workstation ~]$ ssh-agent -k
unset SSH_AUTH_SOCK;
unset SSH_AGENT_PID;
echo Agent pid 1400 killed;
[student@workstation ~]$ rm ~/.ssh/id_pp ~/.ssh/id_pp.pub
```

    The copy has the same public half, so the server accepted it without any change. Without the agent, ssh would have asked for the passphrase.
    {% /reveal %}
  {% /task %}

  {% task id="task-d76dc44caa6f" title="Grade and finish" %}
    {% lab-finish exercise="sa-keys" grade=true servers=true /%}
  {% /task %}
{% /lab %}
