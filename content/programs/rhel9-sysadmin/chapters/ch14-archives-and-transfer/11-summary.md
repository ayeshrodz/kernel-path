---
title: "tar and rsync cheat sheet"
seoTitle: "tar and rsync Cheat Sheet (RHCSA)"
description: "tar and rsync cheat sheet: the key commands and ideas on one page, with flashcards for revision. Free RHCSA study notes."
kind: summary
minutes: 5
---

{% lead %}
The chapter on one page: what to remember, the commands to have at your fingertips, and flashcards for quick revision.
{% /lead %}

## The chapter in eight sentences

- `tar` bundles files into one archive: `c` creates, `t` lists, `x` extracts; `f NAME` goes last; `z`, `j`, `J` choose gzip, bzip2 or xz.
- Create with `-C DIR` so member names are relative; extract into an empty directory with `-C`; always compare with `diff -r`.
- gzip is fast, xz is small, bzip2 is in between, and zip is for sharing with other systems; `-k` keeps the original.
- `sha256sum FILES > SUMS` and `sha256sum -c SUMS` prove that a file is unchanged; a checksum is only as trustworthy as where it came from.
- tar keeps owners and permissions by default as root, but ACLs, SELinux labels and extended attributes only with `--acls --selinux --xattrs` on creation **and** extraction.
- Incremental backups use `--listed-incremental=state.snar`; restore the full backup and then the incrementals in order with `--listed-incremental=/dev/null`.
- `rsync -a --link-dest=PREVIOUS` makes complete-looking snapshots that share unchanged files through hard links.
- Move trees with `rsync -aHAX` or `tar -czf - | ssh host "tar -xzf - -C dest"`, and verify with checksums or `rsync -avc --dry-run`.

## Cheat sheet

{% tabs %}
  {% tab label="tar" %}

| Command | Does |
| --- | --- |
| `tar -czf A.tar.gz -C DIR NAME` | Create (gzip) |
| `tar -cJf A.tar.xz …` / `-cjf A.tar.bz2 …` | xz / bzip2 |
| `tar -tvf A.tar.gz` | List with details |
| `tar -xf A.tar.gz -C DEST [member]` | Extract (all / one) |
| `tar --exclude='PATTERN' …` | Leave out |
| `tar … --acls --selinux --xattrs` | Keep ACLs, labels, attributes |
| `diff -r ORIG RESTORED` | Prove the restore |

  {% /tab %}
  {% tab label="Compress and check" %}

| Command | Does |
| --- | --- |
| `gzip -k F` · `gunzip F.gz` · `gzip -l F.gz` | gzip |
| `xz -k F` · `unxz F.xz` · `xz -l F.xz` | xz |
| `bzip2 -k F` · `bunzip2 F.bz2` | bzip2 |
| `zip -r A.zip DIR` · `unzip -l A.zip` · `unzip -t A.zip` | zip |
| `sha256sum F > S` · `sha256sum -c S` | Checksums |
| `cmp A B` | Are two files identical? |

  {% /tab %}
  {% tab label="Backup and transfer" %}

| Command | Does |
| --- | --- |
| `tar --listed-incremental=S.snar -czf N.tar.gz DIR` | Full or incremental |
| `tar --listed-incremental=/dev/null -xzf N.tar.gz -C D` | Restore in order |
| `rsync -a --link-dest=PREV SRC/ NEW/` | Hard-linked snapshot |
| `rsync -aHAX SRC/ host:DEST/` | Copy with metadata |
| `rsync -avc --dry-run SRC/ DEST/` | Compare by content |
| `tar -czf - DIR \| ssh host "tar -xzf - -C D"` | Stream to another host |

  {% /tab %}
{% /tabs %}

## Flashcards

{% flashcards ref="flashcards" /%}
