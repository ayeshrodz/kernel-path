---
title: Booleans and ports
seoTitle: "SELinux Booleans and semanage port Examples"
description: "Change SELinux behaviour with setsebool and allow services on new ports with semanage port. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 20
---

{% lead %}
Labels on files are one part of the policy. Two other everyday adjustments cover most of the rest: **booleans**, ready-made on/off switches for optional behaviour, and **port labels**, which say which network ports a service may use. Knowing that these exist saves you from the worst answer to every SELinux problem, which is turning SELinux off.
{% /lead %}

{% objectives %}
- List booleans, change one temporarily and permanently, and show only the ones you changed.
- Label a non-standard port for a service with `semanage port`.
- Choose between a label, a boolean and a port for a given denial.
{% /objectives %}

## Three tools, one policy

{% diagram ref="adjustments" /%}

## Booleans

The policy authors know that many sites want a service to do something that is off by default: let the web server read home directories, let it connect to other servers, let Samba export home directories. Each such option is a **boolean**.

```console
[root@servera ~]# getsebool -a | grep -E "^httpd_(enable_homedirs|can_network_connect|read_user_content) "
httpd_can_network_connect --> off
httpd_enable_homedirs --> off
httpd_read_user_content --> off
[root@servera ~]# semanage boolean -l | grep httpd_enable_homedirs
httpd_enable_homedirs          (off  ,  off)  Allow httpd to enable homedirs
```

`semanage boolean -l` adds a description, and shows two values: the current one and the default (the one stored in the policy). Change a boolean with `setsebool`:

```console
[root@servera ~]# setsebool httpd_enable_homedirs on        # until reboot
[root@servera ~]# setsebool -P httpd_enable_homedirs on     # permanently
[root@servera ~]# getsebool httpd_enable_homedirs
httpd_enable_homedirs --> on
[root@servera ~]# semanage boolean -l -C
SELinux boolean                State  Default Description

httpd_enable_homedirs          (on   ,   on)  Allow httpd to enable homedirs
```

**Always use `-P`** unless you want the change to vanish at the next reboot. `semanage boolean -l -C` shows only the booleans that differ from the defaults, a good way to review what a system's administrators changed. To find the right boolean for a task, grep the list for the service name (`getsebool -a | grep httpd`) or read `man httpd_selinux` (package `selinux-policy-doc`).

## Ports

A confined service may bind and connect only to ports that carry a type it is allowed to use. List the ports labelled for web servers:

```console
[root@servera ~]# semanage port -l | grep ^http_port_t
http_port_t                    tcp      80, 81, 443, 488, 8008, 8009, 8443, 9000
```

If you configure Apache to listen on a port outside that list, it fails to start with a message that looks like a plain permissions problem:

```console
[root@servera ~]# grep ^Listen /etc/httpd/conf/httpd.conf
Listen 82
[root@servera ~]# systemctl restart httpd
Job for httpd.service failed because the control process exited with error code.
[root@servera ~]# journalctl -u httpd -n 3 --no-pager | cut -c40-
httpd[1713]: (13)Permission denied: AH00072: make_sock: could not bind to address 0.0.0.0:82
httpd[1713]: no listening sockets available, shutting down
```

Add the port to the right type, and it starts:

```console
[root@servera ~]# semanage port -a -t http_port_t -p tcp 82
[root@servera ~]# semanage port -l -C
SELinux Port Type              Proto    Port Number

http_port_t                    tcp      82
[root@servera ~]# systemctl restart httpd
[root@servera ~]# curl -s -o /dev/null -w "%{http_code}\n" http://localhost:82/
200
```

`-d` deletes a local port entry, and `-m` modifies one. Notice that SELinux and the firewall are separate: labelling the port lets the *service* use it; opening it for *other machines* is the firewall's job (chapter 20).

## Which one do I need?

| Symptom in the denial | Likely fix |
| --- | --- |
| `tcontext` has the wrong file type (`var_t`, `user_tmp_t`, `user_home_t`) | Relabel: `semanage fcontext` + `restorecon` |
| `name_bind` on `tclass=tcp_socket` with `unreserved_port_t` | Label the port: `semanage port` |
| The service wants a feature (home directories, network connections, NFS) that is off by default | A boolean: `setsebool -P` |
| None of these | Think carefully; a custom module is a last resort |

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch16.booleans"] ref="quick" /%}
