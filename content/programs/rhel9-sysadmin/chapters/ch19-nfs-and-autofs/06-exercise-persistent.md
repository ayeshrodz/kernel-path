---
title: "Exercise: Mount at boot, then on demand"
kind: lab
minutes: 30
---

{% lead %}
Make servera mount the share at boot with an fstab entry and check it after a reboot; then replace that with an autofs map, and watch the share appear when it is used and disappear when it is idle.
{% /lead %}

{% lab
  objectives=["ch19.persistent"]
  id="persistent"
  title="Mount at boot, then on demand"
  exercise="sa-nfs-persistent"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera","serverb"]
  outcomes=["Write and test an NFS fstab entry with _netdev.","Create an autofs master entry and an indirect map.","Observe on-demand mounting and idle unmounting."] %}

  {% task id="task-342c7a774f4c" title="Start the exercise" %}
    On workstation, start the exercise. It installs nfs-utils, exports `/srv/shared` from serverb to the lab network (NFS server running, firewall open) and creates the mount point `/mnt/shared` on servera.

```console
[student@workstation ~]$ lab start sa-nfs-persistent
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-3a1b64fd9b4a" title="An fstab entry" %}
    On servera as root, back up fstab, add a line that mounts `serverb:/srv/shared` on `/mnt/shared` as `nfs` with `defaults,_netdev`, reload, mount everything, and check.

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ sudo -i
[root@servera ~]# cp /etc/fstab /root/fstab.bak
[root@servera ~]# mkdir -p /mnt/shared
[root@servera ~]# echo "serverb:/srv/shared  /mnt/shared  nfs  defaults,_netdev  0 0" >> /etc/fstab
[root@servera ~]# systemctl daemon-reload; findmnt --verify | tail -1
0 parse errors, 0 errors, 1 warning
[root@servera ~]# mount -a; df -hT /mnt/shared | tail -1
serverb:/srv/shared nfs4   20G  1.7G   18G   9% /mnt/shared
```
    {% /reveal %}
  {% /task %}

  {% task id="task-d80c08e7baa9" title="Prove it with a reboot" %}
    Reboot servera, log in, and check that the share is mounted without any manual step.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# systemctl reboot
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ findmnt /mnt/shared -o TARGET,SOURCE,FSTYPE
TARGET      SOURCE              FSTYPE
/mnt/shared serverb:/srv/shared nfs4
[student@servera ~]$ ls /mnt/shared
hello.txt
```
    {% /reveal %}
  {% /task %}

  {% task id="task-62f992a0103a" title="Switch to autofs" %}
    Remove the fstab line (restore the backup) and unmount. Install autofs, create a master entry for `/mnt/auto` with a 20 second timeout and a map with the key `data` for the share, enable the service, and verify that nothing is mounted yet.

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ sudo -i
[root@servera ~]# umount /mnt/shared; cp /root/fstab.bak /etc/fstab; systemctl daemon-reload
[root@servera ~]# dnf install -y autofs > /dev/null
[root@servera ~]# echo '/mnt/auto  /etc/auto.shared  --timeout=20' > /etc/auto.master.d/shared.autofs
[root@servera ~]# echo 'data  -rw,sync  serverb:/srv/shared' > /etc/auto.shared
[root@servera ~]# systemctl enable --now autofs
Created symlink /etc/systemd/system/multi-user.target.wants/autofs.service → /usr/lib/systemd/system/autofs.service.
[root@servera ~]# mount | grep -c /mnt/auto/data
0
```
    {% /reveal %}
  {% /task %}

  {% task id="task-06285100d1a5" title="Watch it mount and unmount" %}
    Use the path to trigger the mount, inspect it, wait longer than the timeout, and check again.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# ls /mnt/auto/data
hello.txt
[root@servera ~]# findmnt -t autofs,nfs4 -o TARGET,SOURCE,FSTYPE | tail -2
/mnt/auto              /etc/auto.shared    autofs
└─/mnt/auto/data         serverb:/srv/shared nfs4
[root@servera ~]# cat /mnt/auto/data/hello.txt
shared file
[root@servera ~]# sleep 30; mount | grep -c /mnt/auto/data
0
```

    The share was mounted by the first `ls`, used, and unmounted after the idle timeout. Repeat the `ls` and it comes back.
    {% /reveal %}
  {% /task %}

  {% task id="task-e44b452bebb3" title="A wrong map line" %}
    Add a line `broken  -rw  serverb:/srv/nothere` to `/etc/auto.shared`, reload autofs, and try to use it. What do you see? Remove the line again.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# echo 'broken  -rw  serverb:/srv/nothere' >> /etc/auto.shared
[root@servera ~]# systemctl reload autofs
[root@servera ~]# ls /mnt/auto/broken
ls: cannot access '/mnt/auto/broken': No such file or directory
[root@servera ~]# sed -i '/^broken/d' /etc/auto.shared; systemctl reload autofs
```

    The map entry exists, but the server has no such export, so the mount fails and the path does not appear. The error is "No such file or directory", not an NFS message, which is why `showmount`, `exportfs -v` on the server and `journalctl -u autofs` are the next stops.
    {% /reveal %}
  {% /task %}

  {% task id="task-1bbe047db674" title="Grade and finish" %}
    {% lab-finish exercise="sa-nfs-persistent" grade=true servers=true /%}
  {% /task %}
{% /lab %}
