---
title: "Exercise: Check /etc/fstab before you reboot"
seoTitle: "Check /etc/fstab before you reboot (RHCSA Practice Exercise)"
description: "Hands-on RHCSA practice: check /etc/fstab before you reboot. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 15
---

{% lead %}
You add a mount for a disk that is not there yet. Learn to catch the mistake with `findmnt --verify` and `mount -a` before it can cost you a reboot, and see what `nofail` changes. (You do not reboot in this exercise.)
{% /lead %}

{% lab
  objectives=["ch09.recovery"]
  id="fstab"
  title="Check /etc/fstab before you reboot"
  exercise="sa-fstab"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera"]
  outcomes=["Verify an fstab file without rebooting.","Use mount -a to test entries.","Understand what nofail changes."] %}

  {% task id="task-8cee2fe9aef7" title="Start the exercise" %}
    On workstation, start the exercise. It removes a test mount from `/etc/fstab` if an earlier run left one.

```console
[student@workstation ~]$ lab start sa-fstab
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-bc9d2b67d349" title="Back up and look" %}
    On servera as root, copy `/etc/fstab` to `/root/fstab.bak` and show its entries without comments.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ sudo -i
[root@servera ~]# cp /etc/fstab /root/fstab.bak
[root@servera ~]# grep -v '^#' /etc/fstab
LABEL=rootfs  /         ext4  defaults  0 0
LABEL=UEFI    /boot/efi vfat  defaults  0 0
```

    Always keep a copy of a file you are about to break.
    {% /reveal %}
  {% /task %}

  {% task id="task-837710fe4ad1" title="Add a mount that cannot work" %}
    Append a line mounting `/dev/sdb1` on `/data` as xfs. The disk has no partition yet, and the directory `/data` does not exist. Run `findmnt --verify` and `mount -a`.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# echo '/dev/sdb1  /data  xfs  defaults  0 0' >> /etc/fstab
[root@servera ~]# findmnt --verify
/
   [W] recommended root FS passno is 1 (current is 0)
/data
   [E] unreachable on boot required target: No such file or directory
   [W] unreachable source: /dev/sdb1: No such file or directory
   [W] cannot detect on-disk filesystem type

0 parse errors, 1 error, 3 warnings
[root@servera ~]# mount -a
mount: /data: mount point does not exist.
```

    The `[E]` is an error: the mount point is missing, and a line like this can stop the boot in emergency mode. You found it before rebooting. (The warnings about the source exist for the same reason, as the disk is not there.)
    {% /reveal %}
  {% /task %}

  {% task id="task-c4324de3e0da" title="Create the mount point" %}
    Create `/data` and run both checks again. What changed, and what did not?

    {% reveal title="Show solution" %}

```console
[root@servera ~]# mkdir /data
[root@servera ~]# findmnt --verify | tail -2

0 parse errors, 0 errors, 3 warnings
[root@servera ~]# mount -a; echo "status=$?"
mount: /data: special device /dev/sdb1 does not exist.
status=32
```

    The error is gone, but `mount -a` still fails: the device does not exist. Without `nofail`, that failure would again be a problem at boot.
    {% /reveal %}
  {% /task %}

  {% task id="task-78e91801923a" title="Add nofail" %}
    Change the line to use `defaults,nofail`. Run `mount -a` and look at its status.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# sed -i 's#^/dev/sdb1.*#/dev/sdb1  /data  xfs  defaults,nofail  0 0#' /etc/fstab
[root@servera ~]# mount -a; echo "status=$?"
status=0
```

    `nofail` tells the system that this file system is optional: a missing device is skipped quietly, and the boot carries on. Use it for secondary disks, never for `/` or other essential file systems.
    {% /reveal %}
  {% /task %}

  {% task id="task-f2778b40308e" title="Restore the file" %}

```console
[root@servera ~]# cp /root/fstab.bak /etc/fstab
[root@servera ~]# systemctl daemon-reload
[root@servera ~]# findmnt --verify | tail -1
0 parse errors, 0 errors, 1 warning
[root@servera ~]# rm -f /root/fstab.bak
[root@servera ~]# rmdir /data
[root@servera ~]# exit
[student@servera ~]$ exit
```
  {% /task %}

  {% task id="task-eaa4e2a36bd1" title="Grade and finish" %}
    {% lab-finish exercise="sa-fstab" grade=true servers=true /%}
  {% /task %}
{% /lab %}
