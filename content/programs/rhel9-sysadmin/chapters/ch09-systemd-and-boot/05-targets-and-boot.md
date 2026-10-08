---
title: Targets and the boot process
seoTitle: "systemd Targets and Boot Process (set-default)"
description: "How RHEL 9 boots, systemd targets, systemctl set-default and kernel arguments with grubby. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 20
---

{% lead %}
Between pressing the power button and seeing a login prompt, a long chain of steps runs, and every one of them can fail in its own way. Knowing the chain turns "it won't boot" from a mystery into a list of places to look. This lesson follows the boot from firmware to systemd, and explains **targets**, the way systemd groups services into system states.
{% /lead %}

{% objectives %}
- Describe the stages of the boot process in order.
- Explain targets, and show, set and switch the default target.
- Read boot timing with `systemd-analyze`, and view and change kernel arguments with `grubby`.
{% /objectives %}

## The boot sequence

{% diagram ref="boot-steps" /%}

Two stages are worth a closer look because you can influence them:

- **GRUB 2**, the bootloader, reads its configuration from `/boot`, shows a menu of installed kernels, and passes the **kernel arguments** (the command line) to the kernel you choose.
- **systemd** takes over once the real root file system is mounted and works towards the **default target**.

The command line the running kernel was started with is in `/proc/cmdline`.

## Targets

A **target** is a unit that groups other units and marks a state of the system. Reaching a target means "everything this state needs is running".

{% diagram ref="targets" /%}

| Command | Does |
| --- | --- |
| `systemctl get-default` | Show the target used at boot |
| `systemctl set-default multi-user.target` | Choose the target for the **next** boots |
| `systemctl isolate rescue.target` | Switch the **running** system now (stops everything not in the target) |
| `systemctl list-dependencies multi-user.target` | What the target pulls in |

On this lab image the default is `graphical.target`, but a server has no screen to show it, so the text-mode `multi-user.target` is the better choice:

```console
[root@servera ~]# systemctl get-default
graphical.target
[root@servera ~]# systemctl set-default multi-user.target
Created symlink /etc/systemd/system/default.target → /usr/lib/systemd/system/multi-user.target.
[root@servera ~]# systemctl list-dependencies multi-user.target | head -4
multi-user.target
● ├─chronyd.service
● ├─crond.service
● ├─firewalld.service
```

`set-default` only creates the `default.target` link; nothing changes until the next reboot. To change the running system too, use `systemctl isolate`, but never over SSH to `rescue.target`: it stops the network and your session.

## How long did the boot take?

```console
[root@servera ~]# systemd-analyze
Startup finished in 1.835s (kernel) + 1.517s (initrd) + 5.773s (userspace) = 9.126s
graphical.target reached after 4.932s in userspace.
[root@servera ~]# systemd-analyze blame | head -3
[root@servera ~]# systemd-analyze critical-chain | tail -3
graphical.target @4.932s
└─multi-user.target @4.930s
  └─rsyslog.service @4.816s +112ms
```

`blame` lists units by how long they took; `critical-chain` shows the single chain of units that delayed the target, which is what to shorten first.

## Kernel arguments with grubby

To change the arguments of installed kernels permanently, use `grubby`, not by editing GRUB files:

```console
[root@servera ~]# grubby --default-kernel
/boot/vmlinuz-5.14.0-687.53.1.el9_8.x86_64
[root@servera ~]# grubby --update-kernel=ALL --args="loglevel=5"
[root@servera ~]# grubby --info=DEFAULT | grep args
args="console=tty1 console=ttyS0 ro loglevel=5"
[root@servera ~]# grubby --update-kernel=ALL --remove-args="loglevel=5"
```

The new arguments take effect at the next boot, and show up in `/proc/cmdline`. For a **one-off** change, press `e` in the GRUB menu, edit the `linux` line, and boot with Ctrl+X: the change is not saved. Chapter 17 comes back to these files when it covers storage.

## The journal of the last boot

`journalctl -b` shows messages from the current boot, and `journalctl -b -1` the previous one, but only if the journal is **persistent**. On this image it is kept in memory only, so earlier boots are gone:

```console
[root@servera ~]# journalctl --list-boots
IDX BOOT ID                          FIRST ENTRY                 LAST ENTRY
  0 40c5978bc61848209a017d48d2184fe4 Sat 2026-10-03 16:37:42 UTC Sat 2026-10-03 16:38:24 UTC
```

Making the journal persistent is covered in the logging chapter.

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch09.boot"] ref="quick" /%}
