---
title: "Exercise: Choose a version and check for updates"
seoTitle: "Choose a version and check for updates (RHCSA Practice Exercise)"
description: "Hands-on RHCSA practice: choose a version and check for updates. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 20
---

{% lead %}
Pick a version of a program from the module streams, see what that does to the packages dnf offers, and review the updates waiting on the server. Nothing is installed in this exercise, so it leaves the machine as it found it.
{% /lead %}

{% lab
  objectives=["ch13.updates"]
  id="modules"
  title="Choose a version and check for updates"
  exercise="sa-modules"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera"]
  outcomes=["List module streams and enable one.","See the effect of a stream on the offered version, and reset it.","Review pending updates and decide about a reboot."] %}

  {% task id="task-6270123b483f" title="Start the exercise" %}
    On workstation, start the exercise. It resets the nginx module on servera, so no stream is enabled.

```console
[student@workstation ~]$ lab start sa-modules
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-f0eefe80162a" title="List the streams" %}
    On servera as root (`sudo -i`), list the streams of the `nginx` module, and show which version of the `nginx` package dnf offers before any stream is enabled.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ sudo -i
[root@servera ~]# dnf module list nginx
Name  Stream Profiles   Summary
nginx 1.22   common [d] nginx webserver
nginx 1.24   common [d] nginx webserver
nginx 1.26   common [d] nginx webserver

Hint: [d]efault, [e]nabled, [x]disabled, [i]nstalled
[root@servera ~]# dnf list available nginx
Available Packages
nginx.x86_64               2:1.20.1-28.el9_8.6.rocky.0.1               appstream
```

    Your list of streams and versions will depend on your repositories.
    {% /reveal %}
  {% /task %}

  {% task id="task-b4e347a61c16" title="Enable a stream" %}
    Enable `nginx:1.24`. What does dnf offer now? Look at the file that records the choice.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# dnf module enable -y nginx:1.24
...output omitted...
Complete!
[root@servera ~]# dnf list available nginx
Available Packages
nginx.x86_64   1:1.24.0-7.module+el9.8.0+40319+5de55ea3.5.rocky.0.1    appstream
[root@servera ~]# cat /etc/dnf/modules.d/nginx.module
[nginx]
name=nginx
stream=1.24
profiles=
state=enabled
```

    The offered version changed from 1.20 to 1.24.
    {% /reveal %}
  {% /task %}

  {% task id="task-9e37b6a67c8e" title="Try to switch directly" %}
    Try to enable `nginx:1.26` without resetting. What does dnf say? Then do it the right way.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# dnf module enable -y nginx:1.26
Error: It is not possible to switch enabled streams of a module unless explicitly enabled via configuration option module_stream_switch.
It is recommended to rather remove all installed content from the module, and reset the module using 'dnf module reset <module_name>' command. After you reset the module, you can install the other stream.
[root@servera ~]# dnf module reset -y nginx
...output omitted...
Complete!
[root@servera ~]# dnf module enable -y nginx:1.26
...output omitted...
[root@servera ~]# dnf list available nginx
Available Packages
nginx.x86_64        2:1.26.3-9.module+el9.8.0+40317+f33384ab.4         appstream
```
    {% /reveal %}
  {% /task %}

  {% task id="task-6176685b1abf" title="Leave no stream enabled" %}
    Reset the module, and confirm the choice is gone.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# dnf module reset -y nginx
...output omitted...
[root@servera ~]# dnf module list --enabled | tail -3
[root@servera ~]# cat /etc/dnf/modules.d/nginx.module
[nginx]
name=nginx
stream=
profiles=
state=
```
    {% /reveal %}
  {% /task %}

  {% task id="task-df31ed63bd96" title="Review the updates" %}
    List the available updates (first lines only), count the security advisories, and ask whether a reboot is advised.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# dnf check-update | head -3
kernel.x86_64                          5.14.0-687.54.1.el9_8              baseos
kernel-core.x86_64                     5.14.0-687.54.1.el9_8              baseos
kernel-modules.x86_64                  5.14.0-687.54.1.el9_8              baseos
[root@servera ~]# dnf updateinfo summary
No security updates needed, but 4 updates available
[root@servera ~]# dnf needs-restarting -r
No core libraries or services have been updated since boot-up.
Reboot should not be necessary.
[root@servera ~]# uname -r
5.14.0-687.53.1.el9_8.x86_64
[root@servera ~]# exit
[student@servera ~]$ exit
```

    A kernel update is waiting, but it has not been installed yet; once it is, `uname -r` will still show the old version until a reboot. Do not apply the updates in this exercise.
    {% /reveal %}
  {% /task %}

  {% task id="task-a6c18ad03688" title="Grade and finish" %}
    {% lab-finish exercise="sa-modules" grade=true servers=true /%}
  {% /task %}
{% /lab %}
