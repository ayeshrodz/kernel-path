---
title: Module streams and keeping systems updated
seoTitle: "dnf Module Streams and Updates on RHEL 9"
description: "Choose application versions with module streams and keep systems updated safely. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 15
---

{% lead %}
The software in a long-lived operating system release is deliberately conservative, yet applications such as web servers, databases and language runtimes move faster. RHEL solves this with **module streams** in the AppStream repository: several supported versions of the same program, from which you choose one. This lesson also covers the routine of applying updates, and deciding when a reboot is needed.
{% /lead %}

{% objectives %}
- List module streams, enable one, and see how it changes what `dnf` offers.
- Explain why a stream is switched with `reset` rather than directly.
- Apply updates (all, or security only), and decide whether a reboot is needed.
{% /objectives %}

## Streams

{% diagram ref="streams" /%}

```console
[root@servera ~]# dnf module list nginx
Name  Stream Profiles   Summary
nginx 1.22   common [d] nginx webserver
nginx 1.24   common [d] nginx webserver
nginx 1.26   common [d] nginx webserver
[root@servera ~]# dnf list available nginx
Available Packages
nginx.x86_64               2:1.20.1-28.el9_8.6.rocky.0.1               appstream
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

Before enabling a stream, `nginx` is a plain (older) package. After `dnf module enable nginx:1.24`, dnf offers exactly the 1.24 line, and `dnf install nginx` would install it. A **profile** (such as `common`) is a ready-made selection of the packages of the module for a purpose: `dnf module install nginx:1.24/common`.

Streams are protected from accidental switching, because moving a database from one major version to another needs care:

```console
[root@servera ~]# dnf module enable -y nginx:1.26
Error: It is not possible to switch enabled streams of a module unless explicitly enabled via configuration option module_stream_switch.
It is recommended to rather remove all installed content from the module, and reset the module using 'dnf module reset <module_name>' command. After you reset the module, you can install the other stream.
[root@servera ~]# dnf module reset -y nginx
[root@servera ~]# dnf module enable -y nginx:1.26
```

Useful commands: `dnf module list [--enabled]`, `dnf module info NAME:STREAM`, `dnf module install`, `dnf module remove`.

## Keeping the system updated

```console
[root@servera ~]# dnf check-update | head -3
kernel.x86_64                          5.14.0-687.54.1.el9_8              baseos
...
[root@servera ~]# dnf updateinfo summary
No security updates needed, but 4 updates available
[root@servera ~]# dnf upgrade --security
[root@servera ~]# dnf upgrade
```

| Command | Does |
| --- | --- |
| `dnf check-update` | List available updates |
| `dnf updateinfo summary` | Count the security, bugfix and enhancement advisories |
| `dnf upgrade --security` | Apply only security fixes |
| `dnf upgrade` | Apply everything |
| `dnf needs-restarting -r` | Should the system reboot (a core library or the kernel changed)? |
| `dnf needs-restarting -s` | Which services should be restarted? |

```console
[root@servera ~]# dnf needs-restarting -r
No core libraries or services have been updated since boot-up.
Reboot should not be necessary.
```

A new **kernel** only runs after a reboot; until then the old one is active (`uname -r` shows which). Updates of libraries need the programs using them to restart. A sensible routine on a server: test updates on a spare machine first, apply them in a maintenance window, check `needs-restarting`, reboot if advised, and then verify the services. If something breaks, `dnf history undo` is your way back.

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch13.updates"] ref="quick" /%}
