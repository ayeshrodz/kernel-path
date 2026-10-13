---
title: Copying files and saving connection settings
seoTitle: "scp, sftp, rsync and ~/.ssh/config Examples"
description: "Copy files between machines with scp, sftp and rsync, and save connection settings in ~/.ssh/config. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 20
---

{% lead %}
Once you can log in, you will want to move files between machines and to stop typing the same long `ssh -i ... user@host` over and over. SSH carries file transfers inside the same secure connection, and a small configuration file turns every server into a short name.
{% /lead %}

{% objectives %}
- Copy files and directories in both directions with `scp`, `sftp` and `rsync`.
- Explain when `rsync` is the better choice, and use `-a`, `-n` and the trailing slash correctly.
- Define host aliases in `~/.ssh/config`.
{% /objectives %}

## Host aliases: ~/.ssh/config

Instead of repeating options, give the server a nickname in `~/.ssh/config` (mode `600`). Each `Host` block applies to connections to that name:

```console
[student@workstation ~]$ cat ~/.ssh/config
Host opsa
    HostName servera
    User ops
    IdentityFile ~/.ssh/id_ops
    IdentitiesOnly yes
[student@workstation ~]$ ssh opsa 'echo hello from $(hostname) as $USER'
hello from servera.lab.example.com as ops
```

| Keyword | Means |
| --- | --- |
| `Host` | The nickname you type |
| `HostName` | The real name or address |
| `User` | The account to log in as |
| `IdentityFile` | Which private key to use |
| `IdentitiesOnly yes` | Offer only that key (not every key in the agent) |
| `Port` | A non-standard port |

The same alias works for every tool below, because they all use SSH.

## scp: simple copies

`scp` copies like `cp` but between hosts. A remote path is written `HOST:PATH`; an empty path after the colon means the remote home directory. The first argument is the source, the last is the target:

```console
[student@workstation ~]$ scp inventory.txt opsa:                 # upload to ~ops
[student@workstation ~]$ scp -r reports opsa:/tmp/               # a directory (-r)
[student@workstation ~]$ scp opsa:/etc/hostname ./servera-hostname.txt   # download
[student@workstation ~]$ cat servera-hostname.txt
servera.lab.example.com
```

`scp` is silent on success when not run on a terminal that shows progress. It overwrites without asking, so mind the target.

## sftp: browse, then copy

`sftp` opens an interactive session with commands like `ls`, `cd`, `get`, `put` and `bye`, which is handy when you are not sure of the exact file name:

```console
[student@workstation ~]$ sftp opsa
Connected to opsa.
sftp> cd /tmp
sftp> ls reports
reports/a.txt   reports/b.txt
sftp> get reports/a.txt
Fetching /tmp/reports/a.txt to a.txt
sftp> bye
```

## rsync: copy only what changed

`rsync` compares source and target and sends only the differences, so it is the right tool for repeated copies and for backups.

```console
[student@workstation ~]$ rsync -av reports/ opsa:rsyncdir/
sending incremental file list
created directory rsyncdir
./
a.txt
b.txt

sent 191 bytes  received 88 bytes  558.00 bytes/sec
total size is 6  speedup is 0.02
[student@workstation ~]$ rsync -av reports/ opsa:rsyncdir/
sending incremental file list

sent 117 bytes  received 19 bytes  272.00 bytes/sec
total size is 6  speedup is 0.04
```

The second run transferred nothing. Key options:

| Option | Does |
| --- | --- |
| `-a` | **Archive**: recurse and preserve permissions, owners, times and links |
| `-v` | Verbose: list the files |
| `-n` | **Dry run**: show what would happen, change nothing |
| `--delete` | Remove files at the target that are gone at the source (mirror) |
| `-z` | Compress during transfer |
| `--progress` | Show progress for large files |

**The trailing slash matters.** `rsync -av reports opsa:dir/` creates `dir/reports/...` (the directory itself), while `rsync -av reports/ opsa:dir/` puts the **contents** directly in `dir/`. Always rehearse a destructive mirror with `-n` first:

```console
[student@workstation ~]$ rsync -avn --delete reports/ opsa:rsyncdir/
```

{% diagram ref="tools" /%}

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch10.transfer"] ref="quick" /%}
