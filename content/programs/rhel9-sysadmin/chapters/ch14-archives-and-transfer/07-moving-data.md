---
title: Moving data between machines safely
seoTitle: "rsync and scp: Copy Files Between Linux Servers"
description: "Move directory trees between servers safely with rsync, tar over SSH and checksums. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 15
---

{% lead %}
Chapter 10 introduced `scp` and `rsync` for copying files. Here we combine them with what you know about archives and checksums to move data between machines in a way you can trust: choose the right method, keep the metadata, and prove the result.
{% /lead %}

{% objectives %}
- Choose between `scp`, `rsync` and a `tar` pipe for a transfer.
- Stream an archive between two hosts through ssh without a temporary file.
- Verify a transfer with checksums or with an `rsync` dry run.
{% /objectives %}

## Choosing a method

{% diagram ref="methods" /%}

In this course the workstation has an ssh key for `root` on both servers, while the servers have none for each other. So a transfer from servera to serverb goes **through the workstation**, which is also how you often work in real life (from a jump host or from your laptop).

## A pipe between two ssh commands

`tar` can write the archive to standard output (`-f -`), and extract from standard input. Connect those through two ssh commands and the data flows from one server to the other without a file in between:

```console
[student@workstation ~]$ ssh root@servera 'cd /tmp/arch && tar -czf - work' | ssh root@serverb 'mkdir -p /tmp/recv && tar -xzf - -C /tmp/recv && find /tmp/recv -type f | sort'
/tmp/recv/work/docs/a.txt
/tmp/recv/work/docs/c.txt
/tmp/recv/work/docs/d.txt
```

The first ssh runs tar on servera (create, to stdout); the second runs tar on serverb (extract, from stdin). Add `--acls --selinux --xattrs` on both tars if the metadata matters.

## Proving the copy

Compute the checksums where the data **is**, and verify them where it **arrived**:

```console
[student@workstation ~]$ ssh root@servera 'cd /tmp/arch/work && sha256sum docs/*' > sums.txt
[student@workstation ~]$ cut -c1-40 sums.txt
710605b946281e2b995d6e4f6bb9d88b9f72ba51
f6936912184481f5edd4c304ce27c5a1a827804f
ab929fcd5594037960792ea0b98caf5fdaf6b606
[student@workstation ~]$ ssh root@serverb 'cd /tmp/recv/work && sha256sum -c -' < sums.txt
docs/a.txt: OK
docs/c.txt: OK
docs/d.txt: OK
```

`sha256sum -c -` reads the list from standard input, which the shell redirection `< sums.txt` supplies.

## rsync keeps more, and can check itself

For trees, `rsync -aHAX` copies permissions, times, owners (as root), hard links, ACLs and extended attributes. Running it again with `--checksum` and `--dry-run` compares the actual content (not only size and time) and prints what would be transferred; an empty list means the trees are identical:

```console
[student@workstation ~]$ rsync -aHAX root@servera:/tmp/arch/work/ ~/xfer/work/
[student@workstation ~]$ rsync -avc --dry-run root@servera:/tmp/arch/work/ ~/xfer/work/ | tail -3

sent 21 bytes  received 185 bytes  412.00 bytes/sec
total size is 23  speedup is 0.11 (DRY RUN)
```

No file names were listed between the first blank line and the totals, so nothing differs.

{% callout type="tip" title="Mind the trailing slash" %}
`rsync SRC/ DEST/` copies the **contents** of SRC into DEST. `rsync SRC DEST/` creates `DEST/SRC`. Preview with `-n` when you are not sure.
{% /callout %}

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch14.transfer"] ref="quick" /%}
