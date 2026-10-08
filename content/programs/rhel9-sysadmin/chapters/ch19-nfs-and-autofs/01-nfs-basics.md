---
title: Sharing directories with NFS
seoTitle: "NFS Server and Client Setup on RHEL 9"
description: "Export a directory with /etc/exports, open the firewall and mount it from a client. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 20
---

{% lead %}
Sometimes several machines need the same files: home directories that follow users around, a shared software directory, application data used by a pool of servers. The classic Linux answer is **NFS**, the Network File System: one machine (the **server**) shares a directory, and others (the **clients**) mount it, after which it looks like any local directory. This lesson sets up both ends.
{% /lead %}

{% objectives %}
- Explain the roles of NFS server and client, and which firewall port NFSv4 needs.
- Export a directory with `/etc/exports`, `exportfs` and `nfs-server`.
- Mount an NFS share on a client and inspect it with `df`, `mount` and `nfsstat`.
{% /objectives %}

## The picture

{% diagram ref="nfs-flow" /%}

In this chapter **serverb is the server** and **servera is the client**. Both have the `nfs-utils` package, which contains the server and the client tools (install it with `dnf install nfs-utils` if it is missing).

## The server side

Create the directory to share, and describe the export in `/etc/exports`: one line per directory, then who may use it and with which options.

```console
[root@serverb ~]# mkdir -p /srv/shared
[root@serverb ~]# echo "shared file" > /srv/shared/hello.txt
[root@serverb ~]# echo '/srv/shared  172.25.250.0/24(rw,sync)' > /etc/exports
[root@serverb ~]# systemctl enable --now nfs-server
Created symlink /etc/systemd/system/multi-user.target.wants/nfs-server.service → /usr/lib/systemd/system/nfs-server.service.
[root@serverb ~]# exportfs -rav
exporting 172.25.250.0/24:/srv/shared
[root@serverb ~]# exportfs -v
/srv/shared   	172.25.250.0/24(sync,wdelay,hide,no_subtree_check,sec=sys,rw,secure,root_squash,no_all_squash)
```

(Use the network of your own lab instead of `172.25.250.0/24`; `ip -br addr` shows it.) The options:

{% diagram ref="export-options" /%}

After every change to `/etc/exports`, run `exportfs -rav` (`-r` re-export, `-a` all, `-v` verbose). `exportfs -v` shows the options in effect, including the defaults that were filled in: `root_squash`, `no_subtree_check`, `sec=sys`.

### The firewall

By default firewalld blocks NFS. NFS version 4, the default today, uses a single TCP port, 2049, which is the firewalld service `nfs`:

```console
[root@serverb ~]# firewall-cmd --permanent --add-service=nfs
success
[root@serverb ~]# firewall-cmd --reload
success
[root@serverb ~]# firewall-cmd --list-services
cockpit dhcpv6-client nfs ssh
```

(Chapter 20 teaches firewalld. For now, accept the commands.) Older NFSv3 also needs `rpc-bind` and `mountd`; that is why `showmount -e` may fail against a v4-only firewall setup, even though mounting works.

## The client side

```console
[root@servera ~]# mkdir -p /mnt/shared
[root@servera ~]# mount -t nfs serverb:/srv/shared /mnt/shared
[root@servera ~]# df -hT /mnt/shared
Filesystem          Type  Size  Used Avail Use% Mounted on
serverb:/srv/shared nfs4   20G  1.7G   18G   9% /mnt/shared
[root@servera ~]# ls /mnt/shared
hello.txt
[root@servera ~]# nfsstat -m
/mnt/shared from serverb:/srv/shared
 Flags:	rw,relatime,vers=4.2,rsize=131072,wsize=131072,namlen=255,hard,proto=tcp,timeo=600,retrans=2,sec=sys,clientaddr=172.25.250.10,local_lock=none,addr=172.25.250.11
```

The type is `nfs4` and the size is that of the *server's* file system. `nfsstat -m` shows the negotiated options (`vers=4.2`, `hard`, `sec=sys`). `umount /mnt/shared` detaches it; as with any mount, it fails if somebody is using it.

Mounting works for a user with the right rights (root), but **what a user may do inside the share depends on permissions and user IDs**, which is the next lesson.

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch19.nfs"] ref="quick" /%}
