---
title: Troubleshooting network problems
seoTitle: "Troubleshooting Linux Network Problems Step by Step"
description: "A layer-by-layer method to find why a host or service cannot be reached. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 20
---

{% lead %}
"I can't connect" can mean ten different things, and the same error message can come from several of them. The skill is to test the layers **in order**, from the cable up to the application, and to read what each failure message really says. With a method, this takes minutes.
{% /lead %}

{% objectives %}
- Work up the ladder from link to port, and stop at the first failing rung.
- Tell "No route to host", "Connection refused" and a timeout apart, and say what each points to.
- Check from both ends: what the client sees and what the server listens on.
{% /objectives %}

## The ladder

{% diagram ref="ladder" /%}

## What the error says

When a connection fails, the exact wording is a clue. Use `curl -sS -m 5 URL` (`-m` sets a timeout, `-sS` hides the progress but shows errors):

| You see | It means | Look at |
| --- | --- | --- |
| `Could not resolve host` | The **name** did not resolve | `getent hosts`, `/etc/hosts`, `resolv.conf` |
| `Connection timed out` | Packets vanish: no route, or a firewall **drops** them silently | `ip route`, ping the address, firewall |
| `No route to host` | The host (or its firewall) answered "unreachable" | Often a firewall **rejecting** the port, especially when ping works |
| `Connection refused` | The host answered "no": nothing is **listening** on that address and port | `ss -tlnp` on the server |
| Connects, wrong page or `403` | The network is fine; the application is the problem | The service and its logs |

## An example: from outside to inside

serverb runs a small web server on port 8080 (`python3 -m http.server 8080 --bind 127.0.0.1`). From servera it does not work:

```console
[root@servera ~]# curl -sS -m 5 http://serverb:8080/
curl: (7) Failed to connect to serverb port 8080: No route to host
[root@servera ~]# ping -c 1 serverb
PING serverb.lab.example.com (172.25.250.11) 56(84) bytes of data.
64 bytes from serverb.lab.example.com (172.25.250.11): icmp_seq=1 ttl=64 time=0.134 ms
```

The name resolves (rung 5) and the address answers (rung 4), yet the port says "No route to host": the **firewall** on serverb rejects it (chapter 20 explains firewalld; here you need only know that a port must be opened). Opening it moves the failure to the next rung:

```console
[root@serverb ~]# firewall-cmd --add-port=8080/tcp
success
[root@servera ~]# curl -sS -m 5 http://serverb:8080/
curl: (7) Failed to connect to serverb port 8080: Connection refused
```

Now the packet arrives, and the server says no. Look at the server side, on serverb itself:

```console
[root@serverb ~]# ss -tlnp | grep 8080
LISTEN 0      5          127.0.0.1:8080      0.0.0.0:*    users:(("python3",pid=679,fd=3))
```

The service listens on **127.0.0.1** only: reachable from serverb itself, from nowhere else. Restarted with `--bind 0.0.0.0`, it works:

```console
[root@servera ~]# curl -sS -m 5 http://serverb:8080/
hello from serverb
```

Each message moved the investigation one layer, from the firewall, to the listening address, to success. Never jump to the last layer first.

{% callout type="tip" title="Test from both sides" %}
A client-side symptom needs a server-side look: `ss -tlnp` shows what really listens. And test with the same tool the user used. A page that loads in a browser but not in curl points to a proxy or a header, not to the network.
{% /callout %}

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch12.troubleshooting"] ref="quick" /%}
