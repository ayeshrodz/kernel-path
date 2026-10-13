---
title: Permanent NFS mounts and autofs
seoTitle: "NFS in /etc/fstab and autofs Setup"
description: "Mount NFS at boot with fstab and _netdev, or on demand with autofs master maps. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 20
---

{% lead %}
Two ways to make a share available automatically. An **`/etc/fstab`** entry mounts it at boot and keeps it mounted, which is simple but ties the boot to the server being there. **autofs** mounts it the first time somebody uses the path and unmounts it again when it is idle, which is lighter and more forgiving. This lesson shows both and when to use which.
{% /lead %}

{% objectives %}
- Write an NFS entry for `/etc/fstab` with `_netdev` and test it.
- Install and enable autofs, and write a master map entry and an indirect map.
- Explain what happens on access and on idle, and where to look when it fails.
{% /objectives %}

## The fstab way

{% diagram ref="fstab-nfs" /%}

```console
[root@servera ~]# echo "serverb:/srv/shared  /mnt/shared  nfs  defaults,_netdev  0 0" >> /etc/fstab
[root@servera ~]# systemctl daemon-reload
[root@servera ~]# mount -a
[root@servera ~]# df -hT /mnt/shared | tail -1
serverb:/srv/shared nfs4   20G  1.7G   18G   9% /mnt/shared
```

The same routine as for disks (previous chapters): back up fstab first, `daemon-reload`, test with `mount -a` before rebooting. The cost of this method: at boot, the system tries to mount the share, and if the server is down, the machine can wait or drop into emergency mode. Add `nofail` when the share is optional, or `x-systemd.automount`, which turns the entry into an on-demand mount.

## The autofs way

autofs is a service that watches directories and mounts things there on demand.

{% diagram ref="autofs-flow" /%}

Install and enable it, then describe the mount tree in two places:

```console
[root@servera ~]# dnf install -y autofs
[root@servera ~]# cat /etc/auto.master.d/shared.autofs
/mnt/auto  /etc/auto.shared  --timeout=20
[root@servera ~]# cat /etc/auto.shared
data  -rw,sync  serverb:/srv/shared
[root@servera ~]# systemctl enable --now autofs
Created symlink /etc/systemd/system/multi-user.target.wants/autofs.service → /usr/lib/systemd/system/autofs.service.
```

- The **master map** entry (a file ending in `.autofs` in `/etc/auto.master.d/`) says: autofs manages `/mnt/auto`, using the map `/etc/auto.shared`, and unmounts after 20 idle seconds.
- The **map file** lists *keys* (here `data`), the options (`-rw,sync`), and what to mount (`serverb:/srv/shared`).

Now watch it work:

```console
[root@servera ~]# mount | grep -c /mnt/auto/data
0
[root@servera ~]# ls /mnt/auto/data
alice  hello.txt
[root@servera ~]# findmnt -t autofs,nfs4 -o TARGET,SOURCE,FSTYPE | tail -2
/mnt/auto              /etc/auto.shared    autofs
└─/mnt/auto/data         serverb:/srv/shared nfs4
[root@servera ~]# sleep 30; mount | grep -c /mnt/auto/data
0
```

Before the `ls` there was nothing mounted at `/mnt/auto/data`. The `ls` triggered the mount; thirty seconds later (the timeout is 20) it was gone again. Note that `/mnt/auto` itself looks empty until a key is used: an indirect map creates its subdirectories on demand.

After editing a master or map file, run `systemctl reload autofs`. If a path does not appear, `journalctl -u autofs` and the error shown by `ls` tell you more (a wrong server path gives "No such file or directory").

## Which one?

| | fstab | autofs |
| --- | --- | --- |
| Always mounted | Yes, from boot | Only while in use |
| Server down at boot | Can delay or break the boot (unless `nofail`) | No effect until someone uses the path |
| Many mounts (home directories) | One line each | One wildcard line |
| Setup | One line | Package, master map, map, service |

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch19.persistent"] ref="quick" /%}
