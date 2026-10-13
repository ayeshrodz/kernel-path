---
title: "More autofs maps: wildcards and direct maps"
seoTitle: "autofs Wildcard and Direct Maps Explained"
description: "Serve home directories with autofs wildcard maps and mount fixed paths with direct maps. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 15
---

{% lead %}
One map line per share is fine for a single directory. For a site with hundreds of home directories you want one line that serves them all, and sometimes you need a mount point at an exact path in the tree instead of under a parent directory. autofs has maps for both.
{% /lead %}

{% objectives %}
- Write a wildcard map that serves a directory per user on demand.
- Write a direct map for a mount at a fixed path.
- Check what autofs has loaded and why a mount fails.
{% /objectives %}

## Three kinds of map

{% diagram ref="map-types" /%}

## Home directories on demand

Suppose serverb exports `/srv/homes`, with a subdirectory per user, to the lab network (`/srv/homes  172.25.250.0/24(rw,sync)`, then `exportfs -ra`). On the client, one master entry and one wildcard line serve every user:

```console
[root@servera ~]# echo '/remote/homes  /etc/auto.homes' > /etc/auto.master.d/homes.autofs
[root@servera ~]# echo '*  -rw,sync  serverb:/srv/homes/&' > /etc/auto.homes
[root@servera ~]# systemctl reload autofs
[root@servera ~]# ls /remote/homes
[root@servera ~]# cat /remote/homes/alice/readme
alice home
[root@servera ~]# ls /remote/homes
alice
[root@servera ~]# mount | grep remote | cut -c1-70
/etc/auto.homes on /remote/homes type autofs (rw,relatime,fd=15,pgrp=2
serverb:/srv/homes/alice on /remote/homes/alice type nfs4 (rw,relatime
```

The key `*` matches whatever name you access, and `&` repeats that name on the right: accessing `alice` mounts `serverb:/srv/homes/alice`. Directories are created only when used, so the listing of `/remote/homes` is empty until somebody enters a home. Because NFS maps numeric IDs, the user must have the **same UID** on both machines for the files to be theirs.

## A direct map

An indirect map always creates the mount points below a directory that autofs owns. A **direct map** puts them at full paths. The master entry is the special `/-`:

```console
[root@servera ~]# echo '/-  /etc/auto.direct' > /etc/auto.master.d/direct.autofs
[root@servera ~]# echo '/mnt/direct/data  -rw  serverb:/srv/shared' > /etc/auto.direct
[root@servera ~]# systemctl reload autofs
[root@servera ~]# ls /mnt/direct/data | head -2
alice
hello.txt
```

Each key in a direct map is a complete path. Use it when the mount point must be exactly there.

## Looking inside autofs

```console
[root@servera ~]# automount -m | grep -E "Mount point|map:"
Mount point: /misc
  map: /etc/auto.misc
Mount point: /net
Mount point: /-
  map: /etc/auto.direct
Mount point: /remote/homes
  map: /etc/auto.homes
Mount point: /mnt/auto
  map: /etc/auto.shared
```

`automount -m` dumps the maps autofs has loaded (the ones named `/misc` and `/net` ship with the package and are not used here). `findmnt -t autofs,nfs4` shows which are active, and `journalctl -u autofs` shows the service's own messages. If an entry is missing from the dump, you have not reloaded or the file name does not end in `.autofs`.

{% callout type="tip" title="Order of diagnosis" %}
A path that does not appear: (1) did autofs load the map (`automount -m`)? (2) can you mount by hand (`mount -t nfs serverb:/dir /mnt/test`)? (3) are the server, the export and the firewall right (`exportfs -v`, `firewall-cmd --list-services`)? Fix the manual mount first; autofs will then follow.
{% /callout %}

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch19.maps"] ref="quick" /%}
