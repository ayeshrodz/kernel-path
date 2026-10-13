---
title: "Exercise: Compress and verify"
seoTitle: "Compress and verify (RHCSA Practice Exercise)"
description: "Hands-on RHCSA practice: compress and verify. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 25
---

{% lead %}
Compress the same data with gzip, bzip2 and xz and compare the cost and the gain, zip a directory, and then use checksums to catch a file that has been changed behind your back.
{% /lead %}

{% lab
  objectives=["ch14.checksums"]
  id="checksums"
  title="Compress and verify"
  exercise="sa-checksums"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera"]
  outcomes=["Compare compression tools by size and time.","Create and verify a SHA-256 checksum list.","Detect a modified file."] %}

  {% task id="task-40ad2a7e9796" title="Start the exercise" %}
    On workstation, start the exercise. It installs bzip2, zip and unzip on servera and removes `/root/arch` of an earlier run.

```console
[student@workstation ~]$ lab start sa-checksums
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-768cf4925687" title="Make the data" %}
    On servera as root (`sudo -i`), install `bzip2` and `zip` if needed. Make an uncompressed archive `etc.tar` of `/etc` in `/root/arch` and note its size.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ sudo -i
[root@servera ~]# dnf install -y bzip2 zip unzip > /dev/null
[root@servera ~]# mkdir -p /root/arch && cd /root/arch
[root@servera arch]# tar -cf etc.tar /etc 2> /dev/null
[root@servera arch]# ls -l etc.tar
-rw-r--r--. 1 root root 22538240 Oct  3 17:37 etc.tar
```

    `2> /dev/null` hides the "Removing leading /" notice and any permission warnings. Your size will differ.
    {% /reveal %}
  {% /task %}

  {% task id="task-d69a1d625f48" title="Three compressors" %}
    Compress copies of it with gzip, bzip2 and xz, **keeping the original**, and compare the sizes. Which was slowest? (Use `time` in front of each command.)

    {% reveal title="Show solution" %}

```console
[root@servera arch]# time gzip -k etc.tar
real    0m0.648s
[root@servera arch]# time bzip2 -k etc.tar
real    0m1.529s
[root@servera arch]# time xz -k etc.tar
real    0m8.150s
[root@servera arch]# ls -l etc.tar*
-rw-r--r--. 1 root root 22538240 Oct  3 17:37 etc.tar
-rw-r--r--. 1 root root  4056578 Oct  3 17:43 etc.tar.bz2
-rw-r--r--. 1 root root  4904494 Oct  3 17:43 etc.tar.gz
-rw-r--r--. 1 root root  2996996 Oct  3 17:43 etc.tar.xz
```

    The more effort, the smaller the file: xz is smallest and slowest, gzip is biggest and fastest. Your times and sizes will vary.
    {% /reveal %}
  {% /task %}

  {% task id="task-0e72fa02f706" title="Decompress and inspect" %}
    Look at the gzip and xz files without decompressing them (`gzip -l`, `xz -l`). Then decompress the gzip copy back, keeping both, and prove it equals the original with `cmp`.

    {% reveal title="Show solution" %}

```console
[root@servera arch]# gzip -l etc.tar.gz
         compressed        uncompressed  ratio uncompressed_name
            4904494            22538240  78.2% etc.tar
[root@servera arch]# xz -l etc.tar.xz | tail -2
Strms  Blocks   Compressed Uncompressed  Ratio  Check   Filename
    1       1   2926.8 KiB     21.5 MiB  0.133  CRC64   etc.tar.xz
[root@servera arch]# gunzip -c etc.tar.gz > copy.tar
[root@servera arch]# cmp etc.tar copy.tar && echo identical
identical
```

    `gunzip -c` writes to standard output and leaves the `.gz` in place.
    {% /reveal %}
  {% /task %}

  {% task id="task-0faad2d1958e" title="Zip a directory" %}
    Create `proj.zip` from a small directory of your choice (for example `/etc/ssh`), list it, and test it.

    {% reveal title="Show solution" %}

```console
[root@servera arch]# zip -rq ssh.zip /etc/ssh
[root@servera arch]# unzip -l ssh.zip | tail -2
---------                     -------
   552973                     15 files
[root@servera arch]# unzip -t ssh.zip | tail -1
No errors detected in compressed data of ssh.zip.
```
    {% /reveal %}
  {% /task %}

  {% task id="task-05938bb420b3" title="Write checksums and verify" %}
    Write SHA-256 checksums of the three compressed archives into `SHA256SUMS`, and verify the list.

    {% reveal title="Show solution" %}

```console
[root@servera arch]# sha256sum etc.tar.gz etc.tar.bz2 etc.tar.xz > SHA256SUMS
[root@servera arch]# cut -c1-20,65- SHA256SUMS
71ee37b3318201c5430d  etc.tar.gz
81dde1770eb2a05ffe79  etc.tar.bz2
022455e1145a49f08e06  etc.tar.xz
[root@servera arch]# sha256sum -c SHA256SUMS
etc.tar.gz: OK
etc.tar.bz2: OK
etc.tar.xz: OK
```
    {% /reveal %}
  {% /task %}

  {% task id="task-2e4e9a0d800f" title="Catch a modification" %}
    Change one byte at the end of `etc.tar.gz` (append a character) and verify again. Which file fails? What is the exit status?

    {% reveal title="Show solution" %}

```console
[root@servera arch]# echo x >> etc.tar.gz
[root@servera arch]# sha256sum -c SHA256SUMS
etc.tar.gz: FAILED
etc.tar.bz2: OK
etc.tar.xz: OK
sha256sum: WARNING: 1 computed checksum did NOT match
[root@servera arch]# echo "status=$?"
status=1
```

    One appended character changed the whole fingerprint.
    {% /reveal %}
  {% /task %}

  {% task id="task-4fecbba60ac0" title="Grade and finish" %}
    {% lab-finish exercise="sa-checksums" grade=true servers=true /%}
  {% /task %}
{% /lab %}
