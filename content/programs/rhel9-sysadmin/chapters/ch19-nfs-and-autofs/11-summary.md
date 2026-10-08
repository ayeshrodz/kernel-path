---
title: "NFS and autofs cheat sheet"
seoTitle: "NFS and autofs Cheat Sheet (RHCSA)"
description: "NFS and autofs cheat sheet: the key commands and ideas on one page, with flashcards for revision. Free RHCSA study notes."
kind: summary
minutes: 5
---

{% lead %}
The chapter on one page: what to remember, the commands to have at your fingertips, and flashcards for quick revision.
{% /lead %}

## The chapter in eight sentences

- NFS lets a client mount a directory that lives on a server; the server lists it in `/etc/exports`, runs `nfs-server` and opens the `nfs` firewall service.
- An exports line is `path  host(options)`; apply changes with `exportfs -ra` and check with `exportfs -v`.
- Mount with `mount -t nfs serverb:/srv/shared /mnt/shared`; NFSv4 needs only TCP port 2049.
- The server decides access by numeric user ID, so the same UID must mean the same person on both machines.
- `root_squash` (the default) turns the client's root into an unprivileged user; `ro` exports refuse all writes.
- Permanent mount: an fstab line `serverb:/srv/shared  /mnt/shared  nfs  defaults,_netdev  0 0`, tested with `mount -a`.
- autofs mounts on first use and unmounts after a timeout: a master entry in `/etc/auto.master.d/NAME.autofs` points to a map file.
- Wildcard map `*  -rw,sync  serverb:/srv/homes/&` serves many directories; a direct map uses `/-` and full paths; reload with `systemctl reload autofs`.

## Cheat sheet

{% tabs %}
  {% tab label="Server" %}

| Command | Does |
| --- | --- |
| `/srv/shared  172.25.250.0/24(rw,sync)` | A line in `/etc/exports` |
| `exportfs -ra` · `exportfs -v` | Apply and list the exports |
| `systemctl enable --now nfs-server` | Start the server |
| `firewall-cmd --permanent --add-service=nfs` · `--reload` | Open the port |
| `ro` · `rw` · `root_squash` · `no_root_squash` | Common options |

  {% /tab %}
  {% tab label="Client" %}

| Command | Does |
| --- | --- |
| `mount -t nfs serverb:/srv/shared /mnt/shared` | Mount |
| `findmnt -t nfs4` · `nfsstat -m` | Show NFS mounts |
| `umount /mnt/shared` | Unmount |
| `ls -ln` | Show raw UIDs |
| fstab | `serverb:/srv/shared  /mnt/shared  nfs  defaults,_netdev  0 0` |

  {% /tab %}
  {% tab label="autofs" %}

| Item | Does |
| --- | --- |
| `dnf install autofs` · `systemctl enable --now autofs` | Install and start |
| `/etc/auto.master.d/NAME.autofs` | `/mnt/auto  /etc/auto.NAME` |
| map line | `key  -rw,sync  serverb:/srv/dir` |
| wildcard | `*  -rw,sync  serverb:/srv/homes/&` |
| direct map | master `/-  /etc/auto.direct`, key a full path |
| `systemctl reload autofs` · `automount -m` | Reload, show loaded maps |

  {% /tab %}
{% /tabs %}

## Flashcards

{% flashcards ref="flashcards" /%}
