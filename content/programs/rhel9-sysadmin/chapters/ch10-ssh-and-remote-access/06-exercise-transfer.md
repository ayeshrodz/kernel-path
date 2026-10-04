---
title: "Exercise: Move files between machines"
kind: lab
minutes: 25
---

{% lead %}
Define an alias for the `ops` account, then use scp, sftp and rsync to move files in both directions, and watch rsync skip what has not changed.
{% /lead %}

{% lab
  objectives=["ch10.transfer"]
  id="transfer"
  title="Move files between machines"
  exercise="sa-transfer"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera"]
  outcomes=["Write a Host block in ~/.ssh/config.","Upload and download with scp and sftp.","Mirror a directory with rsync and preview with -n."] %}

  {% task id="task-13cc9ad0b055" title="Start the exercise" %}
    On workstation, start the exercise. It creates the account `ops` on servera and the key `~/.ssh/id_ops` on workstation, installed for ops (the result of the previous exercise).

```console
[student@workstation ~]$ lab start sa-transfer
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-f20aebf82d9f" title="Prepare files and an alias" %}
    This exercise needs the key from the previous exercise (`~/.ssh/id_ops`, installed for `ops@servera`). Create a working directory `~/sshlab` with `inventory.txt` (any line) and `reports/a.txt`, `reports/b.txt`. Then add a `Host opsa` block to `~/.ssh/config` and test it.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ mkdir -p ~/sshlab/reports && cd ~/sshlab
[student@workstation sshlab]$ echo "web1 10.0.0.11" > inventory.txt
[student@workstation sshlab]$ echo r1 > reports/a.txt; echo r2 > reports/b.txt
[student@workstation sshlab]$ cat >> ~/.ssh/config <<'EOT'

Host opsa
    HostName servera
    User ops
    IdentityFile ~/.ssh/id_ops
    IdentitiesOnly yes
EOT
[student@workstation sshlab]$ chmod 600 ~/.ssh/config
[student@workstation sshlab]$ ssh opsa 'echo hello from $(hostname) as $USER'
hello from servera.lab.example.com as ops
```

    Appending (`>>`) keeps any other entries the lab already keeps in that file.
    {% /reveal %}
  {% /task %}

  {% task id="task-cd0362c0a9b3" title="Upload with scp" %}
    Copy `inventory.txt` to the home directory of ops, and `reports` (the directory) to `/tmp`. Verify both on servera.

    {% reveal title="Show solution" %}

```console
[student@workstation sshlab]$ scp inventory.txt opsa:
[student@workstation sshlab]$ scp -r reports opsa:/tmp/
[student@workstation sshlab]$ ssh opsa 'ls -l ~/inventory.txt; ls /tmp/reports'
-rw-r--r--. 1 ops ops 15 Oct  3 16:49 /home/ops/inventory.txt
a.txt
b.txt
```
    {% /reveal %}
  {% /task %}

  {% task id="task-28bee03757b0" title="Download with scp and sftp" %}
    Download `/etc/hostname` from servera as `servera-hostname.txt`. Then use `sftp` to fetch `/tmp/reports/a.txt`.

    {% reveal title="Show solution" %}

```console
[student@workstation sshlab]$ scp opsa:/etc/hostname ./servera-hostname.txt
[student@workstation sshlab]$ cat servera-hostname.txt
servera.lab.example.com
[student@workstation sshlab]$ sftp opsa
sftp> cd /tmp
sftp> ls reports
reports/a.txt   reports/b.txt
sftp> get reports/a.txt downloaded-a.txt
Fetching /tmp/reports/a.txt to downloaded-a.txt
sftp> bye
```
    {% /reveal %}
  {% /task %}

  {% task id="task-2519e9c1e237" title="Synchronise with rsync" %}
    Synchronise the contents of `reports/` into `rsyncdir/` in the home of ops. Run the same command again, then add a third file and run it a third time. Compare what each run reports.

    {% reveal title="Show solution" %}

```console
[student@workstation sshlab]$ rsync -av reports/ opsa:rsyncdir/
sending incremental file list
created directory rsyncdir
./
a.txt
b.txt

sent 191 bytes  received 88 bytes  558.00 bytes/sec
total size is 6  speedup is 0.02
[student@workstation sshlab]$ rsync -av reports/ opsa:rsyncdir/
sending incremental file list

sent 117 bytes  received 19 bytes  272.00 bytes/sec
total size is 6  speedup is 0.04
[student@workstation sshlab]$ echo r3 > reports/c.txt
[student@workstation sshlab]$ rsync -av reports/ opsa:rsyncdir/
sending incremental file list
./
c.txt

sent 166 bytes  received 38 bytes  408.00 bytes/sec
total size is 9  speedup is 0.04
```

    Each run sent only what was new. Your byte counts may differ slightly.
    {% /reveal %}
  {% /task %}

  {% task id="task-50d4df2fe379" title="Preview a mirror before you do it" %}
    Delete `reports/b.txt` locally. Use a dry run to see what `--delete` would do on the server, then run it for real and check.

    {% reveal title="Show solution" %}

```console
[student@workstation sshlab]$ rm reports/b.txt
[student@workstation sshlab]$ rsync -avn --delete reports/ opsa:rsyncdir/
sending incremental file list
deleting b.txt
./

sent 113 bytes  received 35 bytes  98.67 bytes/sec
total size is 6  speedup is 0.04 (DRY RUN)
[student@workstation sshlab]$ rsync -av --delete reports/ opsa:rsyncdir/
sending incremental file list
deleting b.txt
./

sent 113 bytes  received 35 bytes  296.00 bytes/sec
total size is 6  speedup is 0.04
[student@workstation sshlab]$ ssh opsa ls rsyncdir
a.txt
c.txt
```

    Always add `-n` first when `--delete` is involved.
    {% /reveal %}
  {% /task %}

  {% task id="task-e6b9ebfb2272" title="Grade and finish" %}
    {% lab-finish exercise="sa-transfer" grade=true servers=true /%}
  {% /task %}
{% /lab %}
