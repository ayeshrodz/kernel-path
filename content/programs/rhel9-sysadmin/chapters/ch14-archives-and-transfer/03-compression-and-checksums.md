---
title: Compression and checksums
seoTitle: "gzip vs bzip2 vs xz, zip and sha256sum"
description: "Compress with gzip, bzip2, xz and zip, and verify files with sha256sum checksums. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 20
---

{% lead %}
Archives travel: across networks, onto other disks, into other people's hands. Two things matter when they do. Are they small enough to move quickly? And are they still exactly what you made? Compression answers the first; checksums answer the second.
{% /lead %}

{% objectives %}
- Compare gzip, bzip2, xz and zip, and use them on their own and through `tar`.
- Create a SHA-256 checksum list and verify files with `sha256sum -c`.
- Explain what a checksum proves, and what it does not.
{% /objectives %}

## Compression tools

`tar` calls a compressor for you (`z`, `j`, `J`), but each is also a command of its own that works on a single file:

{% diagram ref="compression" /%}

```console
[root@servera arch]# ls -l etc.tar*
-rw-r--r--. 1 root root 22538240 Oct  3 17:37 etc.tar
-rw-r--r--. 1 root root  4056807 Oct  3 17:37 etc.tar.bz2
-rw-r--r--. 1 root root  4904479 Oct  3 17:37 etc.tar.gz
-rw-r--r--. 1 root root  2993256 Oct  3 17:37 etc.tar.xz
```

| Tool | Compress | Decompress | Keep original | Inspect |
| --- | --- | --- | --- | --- |
| gzip | `gzip FILE` | `gunzip FILE.gz` | `gzip -k FILE` | `gzip -l FILE.gz` |
| bzip2 | `bzip2 FILE` | `bunzip2 FILE.bz2` | `bzip2 -k FILE` | |
| xz | `xz FILE` | `unxz FILE.xz` | `xz -k FILE` | `xz -l FILE.xz` |

By default the compressor **replaces** the original with the compressed file; `-k` keeps it. They compress one file, which is why directories are first bundled with tar. (`bzip2` is a separate package here: `dnf install bzip2`.)

### zip

`zip` and `unzip` make the format that Windows and macOS also understand. Use it when sharing with other systems; for Linux backups prefer tar, which keeps owners and permissions faithfully.

```console
[root@servera arch]# zip -r proj.zip project | tail -2
  adding: project/src/data3.txt (deflated 59%)
  adding: project/src/data1.txt (deflated 59%)
[root@servera arch]# unzip -l proj.zip | tail -3
---------                     -------
   326710                     9 files
[root@servera arch]# unzip -t proj.zip | tail -1
No errors detected in compressed data of proj.zip.
```

## Checksums: is it still the same?

A **checksum** (or hash) is a short fingerprint computed from the entire content of a file. Change a single bit and the fingerprint changes completely; two different files practically never share one. `sha256sum` produces a 64-hex-digit SHA-256 fingerprint:

```console
[root@servera arch]# sha256sum project/src/*.txt > SHA256SUMS
[root@servera arch]# cut -c1-40 SHA256SUMS
f6351f5ead9a700e34275480b3856ea738122a7c
f6351f5ead9a700e34275480b3856ea738122a7c
f6351f5ead9a700e34275480b3856ea738122a7c
[root@servera arch]# sha256sum -c SHA256SUMS
project/src/data1.txt: OK
project/src/data2.txt: OK
project/src/data3.txt: OK
```

(All three files hold the same numbers here, so the fingerprints are equal.) Now change a file:

```console
[root@servera arch]# echo tamper >> project/src/data2.txt
[root@servera arch]# sha256sum -c SHA256SUMS
project/src/data1.txt: OK
project/src/data2.txt: FAILED
project/src/data3.txt: OK
sha256sum: WARNING: 1 computed checksum did NOT match
```

The exit status of `sha256sum -c` is non-zero on failure, so scripts can test it. Also available: `md5sum` (old, fine for catching accidental corruption, not for security), `sha512sum`, and `cmp A B` or `diff -r A B` to compare two copies you have side by side.

{% diagram ref="checksum-flow" /%}

### What a checksum does not prove

A matching checksum proves the file is **identical to whatever the checksum was computed from**. It says nothing about who made it. If an attacker can replace a download, they can replace the checksum file next to it. That is why vendors publish checksums (and signatures) on a different, trusted page, and why you compare against *that* one.

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch14.checksums"] ref="quick" /%}
