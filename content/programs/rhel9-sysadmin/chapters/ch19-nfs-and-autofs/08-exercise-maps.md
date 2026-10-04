---
title: "Exercise: Serve home directories on demand"
kind: lab
minutes: 30
---

{% lead %}
Export a directory of home directories from serverb, and make servera mount each user's directory only when it is used, with one wildcard line. Add a direct map as well, and inspect everything autofs has loaded.
{% /lead %}

{% lab
  objectives=["ch19.maps"]
  id="maps"
  title="Serve home directories on demand"
  exercise="sa-nfs-maps"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera","serverb"]
  outcomes=["Create a wildcard map with * and &.","Create a direct map with the /- master entry.","Use automount -m and journalctl -u autofs to inspect maps."] %}

  {% task id="task-7e46fbdf7674" title="Start the exercise" %}
    On workstation, start the exercise. It installs nfs-utils and autofs, exports `/srv/shared` from serverb to the lab network (NFS server running, firewall open), and starts autofs on servera.

```console
[student@workstation ~]$ lab start sa-nfs-maps
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-4cdf0b470d48" title="The homes on the server" %}
    On serverb as root, create `/srv/homes/alice` and `/srv/homes/student` with a file `readme` in each, owned by the matching user (UID 2001 for alice; create the user if needed). Export `/srv/homes` to your lab network read-write and publish.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh student@serverb
[student@serverb ~]$ sudo -i
[root@serverb ~]# id alice > /dev/null 2>&1 || useradd -u 2001 alice
[root@serverb ~]# mkdir -p /srv/homes/alice /srv/homes/student
[root@serverb ~]# echo "alice home" > /srv/homes/alice/readme; echo "student home" > /srv/homes/student/readme
[root@serverb ~]# chown -R alice:alice /srv/homes/alice; chown -R student:student /srv/homes/student
[root@serverb ~]# echo '/srv/homes  172.25.250.0/24(rw,sync)' >> /etc/exports
[root@serverb ~]# exportfs -ra; exportfs -v | cut -c1-60
/srv/shared   	172.25.250.0/24(sync,wdelay,hide,no_subtree_check,
/srv/homes    	172.25.250.0/24(sync,wdelay,hide,no_subtree_check,
```
    {% /reveal %}
  {% /task %}

  {% task id="task-1db86177261d" title="The wildcard map on the client" %}
    On servera as root (autofs installed and running from the previous exercise; install it if not), create the master entry for `/remote/homes` and the wildcard map. Reload autofs and list the directory. Why is it empty?

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ sudo -i
[root@servera ~]# systemctl is-active autofs
active
[root@servera ~]# echo '/remote/homes  /etc/auto.homes' > /etc/auto.master.d/homes.autofs
[root@servera ~]# echo '*  -rw,sync  serverb:/srv/homes/&' > /etc/auto.homes
[root@servera ~]# systemctl reload autofs
[root@servera ~]# ls /remote/homes
[root@servera ~]#
```

    Nothing is mounted until a key is used, so autofs has nothing to list yet.
    {% /reveal %}
  {% /task %}

  {% task id="task-c4df6c892847" title="Use two homes" %}
    Read alice's `readme`, then list the parent directory and the mounts. Do the same for `student`.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# cat /remote/homes/alice/readme
alice home
[root@servera ~]# ls /remote/homes
alice
[root@servera ~]# cat /remote/homes/student/readme
student home
[root@servera ~]# ls /remote/homes
alice  student
[root@servera ~]# mount | grep remote | cut -c1-75
/etc/auto.homes on /remote/homes type autofs (rw,relatime,fd=15,pgrp=2
serverb:/srv/homes/alice on /remote/homes/alice type nfs4 (rw,relatime
serverb:/srv/homes/student on /remote/homes/student type nfs4 (rw,relatime
```

    One map line served both; each directory appeared when used.
    {% /reveal %}
  {% /task %}

  {% task id="task-96a63e411ecb" title="A direct map" %}
    Create a direct map so that `/mnt/direct/data` mounts `serverb:/srv/shared`. Reload autofs, use the path, and list the maps that autofs has loaded.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# echo '/-  /etc/auto.direct' > /etc/auto.master.d/direct.autofs
[root@servera ~]# echo '/mnt/direct/data  -rw  serverb:/srv/shared' > /etc/auto.direct
[root@servera ~]# systemctl reload autofs
[root@servera ~]# ls /mnt/direct/data
hello.txt
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
    {% /reveal %}
  {% /task %}

  {% task id="task-f77af1a58252" title="Make a user's home on the client" %}
    Create alice on servera with the same UID 2001 and write a file in her mounted home as alice. Check the owner on the server.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# id alice > /dev/null 2>&1 || useradd -u 2001 alice
[root@servera ~]# su - alice -c 'echo "edited from servera" >> /remote/homes/alice/readme; cat /remote/homes/alice/readme'
alice home
edited from servera
[root@serverb ~]# ls -ln /srv/homes/alice
total 4
-rw-r--r--. 1 2001 2001 31 Oct  3 19:05 readme
```
    {% /reveal %}
  {% /task %}

  {% task id="task-9d2d61f64c25" title="Grade and finish" %}
    {% lab-finish exercise="sa-nfs-maps" grade=true servers=true /%}
  {% /task %}
{% /lab %}
