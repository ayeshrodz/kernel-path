---
title: "Exercise: Change how the server boots"
kind: lab
minutes: 25
---

{% lead %}
Make servera boot to the text-mode target, add a kernel argument, reboot, and prove from the running system that both changes took effect. Then put everything back.
{% /lead %}

{% lab
  objectives=["ch09.boot"]
  id="boot"
  title="Change how the server boots"
  exercise="sa-boot"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera"]
  outcomes=["Set the default target and check it after a reboot.","Add and remove a kernel argument with grubby.","Read boot timing with systemd-analyze."] %}

  {% task id="task-7fe20de7b383" title="Start the exercise" %}
    On workstation, start the exercise. It makes sure servera starts from the default target graphical.target without the extra kernel argument.

```console
[student@workstation ~]$ lab start sa-boot
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-05d504378a68" title="Record the starting point" %}
    On servera as root (`sudo -i`), show the default target, the kernel command line and the boot time.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ sudo -i
[root@servera ~]# systemctl get-default
graphical.target
[root@servera ~]# cat /proc/cmdline
BOOT_IMAGE=(hd0,gpt2)/boot/vmlinuz-5.14.0-687.53.1.el9_8.x86_64 console=tty1 console=ttyS0 root=UUID=4bbdcf8d-863d-4050-957c-c815ca3838b8 ro
[root@servera ~]# systemd-analyze
Startup finished in 1.835s (kernel) + 1.517s (initrd) + 5.773s (userspace) = 9.126s
graphical.target reached after 4.932s in userspace.
```

    Your numbers will differ.
    {% /reveal %}
  {% /task %}

  {% task id="task-cfd2c584b1e3" title="Change the default target and the kernel arguments" %}
    Set `multi-user.target` as the default, and add `loglevel=5` to all kernels. Confirm what `grubby` now records.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# systemctl set-default multi-user.target
Created symlink /etc/systemd/system/default.target → /usr/lib/systemd/system/multi-user.target.
[root@servera ~]# grubby --update-kernel=ALL --args="loglevel=5"
[root@servera ~]# grubby --info=DEFAULT | grep args
args="console=tty1 console=ttyS0 ro loglevel=5"
```

    Nothing has changed in the running system yet: `/proc/cmdline` still shows the old arguments.
    {% /reveal %}
  {% /task %}

  {% task id="task-6225dba2898d" title="Reboot and check" %}
    Reboot, wait about 30 seconds, log in again, and check the target, the command line and `uptime -p`.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# systemctl reboot
Connection to servera closed by remote host.
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ systemctl get-default
multi-user.target
[student@servera ~]$ cat /proc/cmdline
BOOT_IMAGE=(hd0,gpt2)/boot/vmlinuz-5.14.0-687.53.1.el9_8.x86_64 console=tty1 console=ttyS0 root=UUID=4bbdcf8d-863d-4050-957c-c815ca3838b8 ro loglevel=5
[student@servera ~]$ uptime -p
up 0 minutes
```

    The machine really booted with the new argument, and into the new default target.
    {% /reveal %}
  {% /task %}

  {% task id="task-7c8cd8d1528c" title="Look at the boot" %}
    Show the boot timing again and the critical chain, then list the boots the journal knows about. Why only one?

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ systemd-analyze | head -2
Startup finished in 1.7s (kernel) + 1.5s (initrd) + 5.1s (userspace) = 8.3s
multi-user.target reached after 4.3s in userspace.
[student@servera ~]$ journalctl --list-boots
IDX BOOT ID                          FIRST ENTRY                 LAST ENTRY
  0 40c5978bc61848209a017d48d2184fe4 Sat 2026-10-03 16:37:42 UTC Sat 2026-10-03 16:38:24 UTC
```

    The journal lives in memory only, so the log of the boot before the reboot is gone. That is why the logging chapter makes it persistent.
    {% /reveal %}
  {% /task %}

  {% task id="task-0e43bd980771" title="Put everything back" %}
    Return to `graphical.target`, remove the extra argument, and confirm with `grubby`.

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ sudo systemctl set-default graphical.target
Created symlink /etc/systemd/system/default.target → /usr/lib/systemd/system/graphical.target.
[student@servera ~]$ sudo grubby --update-kernel=ALL --remove-args="loglevel=5"
[student@servera ~]$ sudo grubby --info=DEFAULT | grep args
args="console=tty1 console=ttyS0 ro"
[student@servera ~]$ exit
```
    {% /reveal %}
  {% /task %}

  {% task id="task-e50569b8f094" title="Grade and finish" %}
    {% lab-finish exercise="sa-boot" grade=true servers=true /%}
  {% /task %}
{% /lab %}
