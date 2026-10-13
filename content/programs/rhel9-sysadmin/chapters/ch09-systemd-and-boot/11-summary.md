---
title: "systemd and boot cheat sheet"
seoTitle: "systemd and boot Cheat Sheet (RHCSA)"
description: "systemd and boot cheat sheet: the key commands and ideas on one page, with flashcards for revision. Free RHCSA study notes."
kind: summary
minutes: 5
---

{% lead %}
The chapter on one page: what to remember, the commands to have at your fingertips, and flashcards for quick revision.
{% /lead %}

## The chapter in eight sentences

- systemd is PID 1; it manages **units** (services, targets, sockets, timers, mounts), and `systemctl` is its control tool.
- A service has two independent properties: whether it is **running now** (`start`, `stop`) and whether it **starts at boot** (`enable`, `disable`); `enable --now` does both.
- `mask` makes a unit impossible to start at all; `unmask` undoes it.
- `systemctl status` shows the state and the last log lines; `journalctl -u NAME` shows its whole log; `systemctl --failed` lists trouble.
- Your own units belong in `/etc/systemd/system`; change packaged ones with a **drop-in**, and always `systemctl daemon-reload` after editing.
- A service unit needs `ExecStart=` with a full path, a restart policy as wanted, and `WantedBy=multi-user.target` to start at boot.
- Boot order: firmware, GRUB, kernel, initramfs, systemd, default **target**; set it with `systemctl set-default`, switch now with `isolate`.
- With console access you can recover: `rd.break` resets a lost root password (remount `/sysroot`, `chroot`, `passwd`, `touch /.autorelabel`), and `findmnt --verify`, `mount -a` and `nofail` protect against a bad `/etc/fstab`.

## Cheat sheet

{% tabs %}
  {% tab label="Services" %}

| Command | Does |
| --- | --- |
| `systemctl start|stop|restart|reload NAME` | Act now |
| `systemctl enable|disable [--now] NAME` | Boot policy (and now) |
| `systemctl mask|unmask NAME` | Forbid / allow |
| `systemctl status NAME` | State and recent log |
| `systemctl is-active|is-enabled NAME` | One-word answers |
| `systemctl list-units --type=service` | What is loaded |
| `systemctl list-unit-files` | What is installed |
| `systemctl --failed` | Failed units |
| `journalctl -u NAME` | The service's log |

  {% /tab %}
  {% tab label="Unit files" %}

| Item | Detail |
| --- | --- |
| Your units | `/etc/systemd/system/NAME.service` |
| Packaged units | `/usr/lib/systemd/system/` (do not edit) |
| Drop-in | `/etc/systemd/system/NAME.service.d/*.conf` or `systemctl edit NAME` |
| Show what applies | `systemctl cat NAME` |
| After any change | `systemctl daemon-reload` |
| Check the file | `systemd-analyze verify FILE` |
| `[Service]` | `ExecStart=`, `Restart=`, `User=`, `Environment=` |
| `[Install]` | `WantedBy=multi-user.target` |
| Status 203/EXEC | Program not found or not executable |

  {% /tab %}
  {% tab label="Boot and recovery" %}

| Command / key | Does |
| --- | --- |
| `systemctl get-default`, `set-default T` | Show / set the boot target |
| `systemctl isolate T` | Switch the running system |
| `systemd-analyze`, `blame`, `critical-chain` | Boot timing |
| `cat /proc/cmdline` | Arguments of the running kernel |
| `grubby --update-kernel=ALL --args=X` | Add a kernel argument (`--remove-args` removes) |
| GRUB: `e`, then `Ctrl+X` | Edit one boot |
| `rd.break` | Early shell for a root-password reset |
| `findmnt --verify`, `mount -a` | Test `/etc/fstab` |
| `nofail` | Optional file system |

  {% /tab %}
{% /tabs %}

## Flashcards

{% flashcards ref="flashcards" /%}
