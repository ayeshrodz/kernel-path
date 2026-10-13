---
title: Recovering a system that will not boot normally
seoTitle: "Reset the Root Password and Rescue a RHEL 9 Boot"
description: "Recover a system that will not boot: rescue and emergency targets, rd.break and root password reset. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 20
---

{% lead %}
Sooner or later a machine will not boot, or nobody remembers the root password. RHEL gives an administrator with **console access** a way in: you can interrupt the boot, change the kernel arguments, and repair the system from outside. This lesson explains the two most common repairs: resetting a lost root password, and fixing a bad `/etc/fstab`.
{% /lead %}

{% objectives %}
- Explain what the rescue and emergency targets give you, and what `rd.break` does.
- Describe the steps to reset a lost root password.
- Recover from a mount problem in `/etc/fstab`, and avoid it with `nofail` and `findmnt --verify`.
{% /objectives %}

{% callout type="warning" title="Only with permission, and only locally" %}
These techniques give full control of a machine to anyone at its console. Use them on machines you own or are authorised to repair. On real servers, protect the console, and encrypt disks if the physical security of the machine is a concern.
{% /callout %}

## Rescue and emergency modes

If systemd cannot reach the default target, it drops to a shell on the console. You can also ask for one deliberately by adding a kernel argument in the GRUB menu (press `e`, add it to the `linux` line, boot with Ctrl+X):

| Argument | You get | Use it when |
| --- | --- | --- |
| `systemd.unit=rescue.target` | Single-user shell, basic system and file systems mounted, no network | A service or configuration problem; the base system is fine |
| `systemd.unit=emergency.target` | The most minimal shell; root file system mounted **read-only**, nothing else | Even rescue mode fails, for example a broken `/etc/fstab` |
| `rd.break` | A shell inside the early boot (initramfs), before the real root is in use | You lost the root password |

Rescue and emergency modes ask for the **root password**. `rd.break` does not, which is exactly why it can be used to reset it.

## Reset a lost root password

{% diagram ref="root-reset" /%}

Replay the commands of steps 4 to 7 here to see what they print. This terminal cannot boot your lab; it only shows the dialogue.

{% shell-practice ref="practice" /%}

A few details worth understanding:

- The real root is mounted at **`/sysroot`**, read-only. `mount -o remount,rw /sysroot` makes it writable, and `chroot /sysroot` makes it your `/`.
- A file you change in the initramfs shell carries the wrong **SELinux label**. `touch /.autorelabel` tells the next boot to relabel the whole file system. That boot takes noticeably longer; wait for it.
- Skipping the relabel often means that you cannot log in with the new password, because SELinux denies the read of `/etc/shadow`. Chapter 16 explains why.

## A bad /etc/fstab

`/etc/fstab` lists the file systems that are mounted at boot. A line for a device that does not exist makes systemd wait for it, time out, and drop you into **emergency mode**, with a message like *"You are in emergency mode"* and a request for the root password.

To recover: enter the root password, make the root file system writable, fix the line, and reboot.

```console
[root@servera ~]# mount -o remount,rw /
[root@servera ~]# vim /etc/fstab
[root@servera ~]# systemctl daemon-reload
[root@servera ~]# mount -a
[root@servera ~]# systemctl reboot
```

Better still, avoid the problem. Before you reboot after editing `/etc/fstab`:

- **`findmnt --verify`** checks the file for errors and unreachable sources.
- **`mount -a`** tries every entry now, so errors appear while you can still fix them.
- Add the option **`nofail`** to non-essential file systems, so a missing device is a warning instead of a stop.

```console
[root@servera ~]# findmnt --verify
/data
   [E] unreachable on boot required target: No such file or directory
   [W] unreachable source: /dev/sdb1: No such file or directory
...
[root@servera ~]# mount -a
mount: /data: mount point does not exist.
```

## Check your understanding

{% quiz id="quick" objectives=["ch09.recovery"] ref="quick" /%}
