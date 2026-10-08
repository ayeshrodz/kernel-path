---
title: "Exercise: Make the storage permanent"
seoTitle: "Make the storage permanent (RHCSA Practice Exercise)"
description: "Hands-on RHCSA practice: make the storage permanent. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 30
---

{% lead %}
Mount the two file systems and the swap area at boot, using UUIDs and sensible options, test the entries before rebooting, and prove them with a reboot.
{% /lead %}

{% lab
  objectives=["ch17.fstab"]
  id="fstab"
  title="Make the storage permanent"
  exercise="sa-fstab-storage"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera"]
  outcomes=["Write fstab entries by UUID for xfs, ext4 and swap.","Test with findmnt --verify, mount -a and swapon -a.","Verify the entries after a reboot."] %}

  {% task id="task-21fde289a53b" title="Start the exercise" %}
    On workstation, start the exercise. It partitions `/dev/sdb` of servera and creates the xfs file system, the ext4 file system and the swap area of the previous exercise.

```console
[student@workstation ~]$ lab start sa-fstab-storage
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-d7a6ee2b8619" title="Unmount and collect the UUIDs" %}
    On servera as root, unmount `/data` and `/logs` if they are still mounted from the previous exercise, create the mount points `/srv/data` and `/srv/archive`, and read the UUIDs of the three partitions.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ sudo -i
[root@servera ~]# umount /data /logs 2> /dev/null; swapoff -a
[root@servera ~]# mkdir -p /srv/data /srv/archive
[root@servera ~]# blkid -s UUID -o value /dev/sdb1 /dev/sdb2 /dev/sdb3
c64946eb-fc27-4485-8020-db4119b686eb
cd0b3883-1d6d-4271-a89e-2f48a2dac5b7
89858a47-2255-4fa3-a2a9-64711ac2d782
```

    If the file systems do not exist (you reset the servers), recreate them as in the previous exercise first.
    {% /reveal %}
  {% /task %}

  {% task id="task-fc33b294d75e" title="Back up fstab and add the lines" %}
    Back up `/etc/fstab`, then add: `sdb1` on `/srv/data` as xfs with `defaults`; `sdb2` on `/srv/archive` as ext4 with `defaults,noexec`; and `sdb3` as swap. Use the UUIDs.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# cp /etc/fstab /root/fstab.bak
[root@servera ~]# cat >> /etc/fstab <<EOT
UUID=$(blkid -s UUID -o value /dev/sdb1)  /srv/data     xfs   defaults          0 0
UUID=$(blkid -s UUID -o value /dev/sdb2)  /srv/archive  ext4  defaults,noexec   0 0
UUID=$(blkid -s UUID -o value /dev/sdb3)  none          swap  defaults          0 0
EOT
[root@servera ~]# tail -4 /etc/fstab
LABEL=UEFI    /boot/efi vfat  defaults  0 0
UUID=c64946eb-fc27-4485-8020-db4119b686eb  /srv/data     xfs   defaults          0 0
UUID=cd0b3883-1d6d-4271-a89e-2f48a2dac5b7  /srv/archive  ext4  defaults,noexec   0 0
UUID=89858a47-2255-4fa3-a2a9-64711ac2d782  none          swap  defaults          0 0
```

    The shell filled in the UUIDs from `blkid`, avoiding copy mistakes.
    {% /reveal %}
  {% /task %}

  {% task id="task-7913f373762b" title="Test before rebooting" %}
    Reload systemd, verify the file, mount everything, enable the swap, and show the result. What does `rc=0` from `mount -a` tell you?

    {% reveal title="Show solution" %}

```console
[root@servera ~]# systemctl daemon-reload
[root@servera ~]# findmnt --verify | tail -3
0 parse errors, 0 errors, 1 warning
/
   [W] recommended root FS passno is 1 (current is 0)
[root@servera ~]# mount -a; echo "rc=$?"
rc=0
[root@servera ~]# swapon -a; swapon --show
NAME      TYPE      SIZE USED PRIO
/dev/sdb3 partition 512M   0B   -2
[root@servera ~]# findmnt -o TARGET,SOURCE,FSTYPE,OPTIONS /srv/data /srv/archive
TARGET       SOURCE    FSTYPE OPTIONS
/srv/data    /dev/sdb1 xfs    rw,relatime,seclabel,attr2,inode64,logbufs=8,logbsize=32k,noquota
/srv/archive /dev/sdb2 ext4   rw,noexec,relatime,seclabel
```

    `rc=0` and no output: every entry mounted without error. `noexec` shows in the options of the archive.
    {% /reveal %}
  {% /task %}

  {% task id="task-275ce1a1970b" title="Prove noexec" %}
    Copy `/bin/true` to `/srv/archive` and to `/srv/data` and try to run both.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# cp /bin/true /srv/archive/t; cp /bin/true /srv/data/t
[root@servera ~]# /srv/data/t && echo "data: ran"
data: ran
[root@servera ~]# /srv/archive/t
-bash: /srv/archive/t: Permission denied
```

    The file is executable and root runs it on `/srv/data`, but `noexec` stops programs on `/srv/archive`.
    {% /reveal %}
  {% /task %}

  {% task id="task-c7be36d2d118" title="Reboot and check" %}
    Reboot, log in again, and show the mounts, the swap and the block device tree.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# systemctl reboot
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ df -hT /srv/data /srv/archive
Filesystem     Type  Size  Used Avail Use% Mounted on
/dev/sdb1      xfs   960M   39M  922M   5% /srv/data
/dev/sdb2      ext4  974M   24K  907M   1% /srv/archive
[student@servera ~]$ swapon --show
NAME      TYPE      SIZE USED PRIO
/dev/sdb3 partition 512M   0B   -2
[student@servera ~]$ lsblk -f /dev/sdb
NAME   FSTYPE FSVER LABEL UUID                                 FSAVAIL FSUSE% MOUNTPOINTS
sdb
├─sdb1 xfs                c64946eb-fc27-4485-8020-db4119b686eb    921M     4% /srv/data
├─sdb2 ext4   1.0   logs  cd0b3883-1d6d-4271-a89e-2f48a2dac5b7  906.2M     0% /srv/archive
└─sdb3 swap   1           89858a47-2255-4fa3-a2a9-64711ac2d782                [SWAP]
```

    Everything came back without any manual `mount`: that is a permanent configuration. Keep it for the next exercise.
    {% /reveal %}
  {% /task %}

  {% task id="task-b33c9410fa0a" title="Grade and finish" %}
    {% lab-finish exercise="sa-fstab-storage" grade=true servers=true /%}
  {% /task %}
{% /lab %}
