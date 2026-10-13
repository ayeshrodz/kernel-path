---
title: Diagnosing connection problems
seoTitle: "Connection Refused vs No Route to Host: Firewall Debugging"
description: "Diagnose blocked connections layer by layer: service, listening port, firewall and SELinux. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 15
---

{% lead %}
"It does not connect" has many causes. Work from the symptom through four layers, in order, and you find the answer quickly instead of guessing, or worse, switching the firewall off.
{% /lead %}

{% objectives %}
- Read the symptom: rejected, dropped or refused.
- Check the service, the listening port, the zone rules and the SELinux port label in turn.
- Test a port from another machine without special tools.
{% /objectives %}

## Four layers

{% diagram ref="layers" /%}

## What the client sees

{% diagram ref="symptoms" /%}

Test from the client with `curl`. A bare TCP check works with bash alone, too:

```console
[student@serverb ~]$ curl -sS -m 3 http://servera/
curl: (7) Failed to connect to servera port 80: No route to host
[student@serverb ~]$ (: </dev/tcp/servera/22) && echo ssh-open
ssh-open
```

`ping` is not a reliable test: it uses another protocol and can succeed while a port is blocked.

## On the server, layer by layer

```console
[root@servera ~]# systemctl is-active httpd
active
[root@servera ~]# ss -tlnp | grep httpd | cut -c1-60
LISTEN 0      511                *:80              *:*
[root@servera ~]# firewall-cmd --get-active-zones
public
  interfaces: enp1s0
[root@servera ~]# firewall-cmd --list-services
cockpit dhcpv6-client ssh
```

- The service is running and listens on every address (`*:80`), so layers 1 and 2 are fine.
- The zone that judges serverb is `public`, and `http` is missing. That is the answer.

If the listening address were `127.0.0.1:80`, the firewall would not matter: the daemon accepts only local connections. Fix its `Listen` setting instead.

If a **source** is assigned to a zone, compare with `firewall-cmd --get-zone-of-source=ADDRESS`, and list that zone with `--list-all --zone=NAME`; it may be a different zone from the interface's.

## Fix the right layer

```console
[root@servera ~]# firewall-cmd --permanent --add-service=http; firewall-cmd --reload
success
success
[student@serverb ~]$ curl -s -m 3 http://servera/
hello from servera
```

When the cause is an unusual port, remember there are **two** gates: the firewall (this chapter) and the SELinux port label (chapter 16: `semanage port -a -t http_port_t -p tcp 82`). The first protects the network; the second decides which ports the daemon may use.

{% callout type="warning" title="Never stop the firewall to fix an application" %}
`systemctl stop firewalld` removes all protection and hides the real cause. Find the missing rule and add it.
{% /callout %}

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch20.diagnosis"] ref="quick" /%}
