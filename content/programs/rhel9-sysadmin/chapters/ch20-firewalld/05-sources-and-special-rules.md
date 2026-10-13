---
title: Sources, forwarding and special rules
seoTitle: "firewalld Rich Rules, Sources and Port Forwarding"
description: "Limit a service to one host with source zones, forward ports, define services and write rich rules. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 20
---

{% lead %}
Opening a service in `public` lets the whole network in. Often you want less: one trusted host, a service on an unusual port, or a request sent to a different port. firewalld gives you source zones, custom services, port forwarding and rich rules.
{% /lead %}

{% objectives %}
- Limit a service to one host by giving that host its own zone.
- Define a custom service, and forward a port.
- Write a rich rule and log rejected packets.
{% /objectives %}

## Tools for special cases

{% diagram ref="rule-tools" /%}

## Allow a service for one host only

A zone decides by **source** first, so a zone that lists serverb's address as its source judges everything from serverb. Everything else stays in `public`:

{% diagram ref="source-zone" /%}

```console
[root@servera ~]# firewall-cmd --permanent --new-zone=lanonly
success
[root@servera ~]# firewall-cmd --reload
success
[root@servera ~]# firewall-cmd --permanent --zone=lanonly --add-source=172.25.250.11
success
[root@servera ~]# firewall-cmd --permanent --zone=lanonly --add-service=http
success
[root@servera ~]# firewall-cmd --reload
success
[root@servera ~]# firewall-cmd --get-active-zones
lanonly
  sources: 172.25.250.11
public
  interfaces: enp1s0
[root@servera ~]# firewall-cmd --get-zone-of-source=172.25.250.11
lanonly
```

A new zone must be **reloaded** before you can add to it. From serverb the web page loads; from workstation it still fails with "No route to host". To shut a host out instead, put its address in the `drop` zone: it then gets no answer at all, and its connections time out.

## A custom service and a forwarded port

A service you define yourself gives a port number a meaningful name:

```console
[root@servera ~]# firewall-cmd --permanent --new-service=myapp
success
[root@servera ~]# firewall-cmd --permanent --service=myapp --add-port=9000/tcp
success
[root@servera ~]# firewall-cmd --reload; firewall-cmd --info-service=myapp
success
myapp
  ports: 9000/tcp
  protocols: 
  source-ports: 
  modules: 
  destination: 
  includes: 
  helpers: 
```

Then allow it like any service: `--permanent --zone=lanonly --add-service=myapp`.

A **forward port** answers on one port and hands the connection to another:

```console
[root@servera ~]# firewall-cmd --permanent --zone=lanonly --add-forward-port=port=8081:proto=tcp:toport=8080
success
```

A request from serverb to port 8081 now reaches the daemon on 8080, which does not have to be allowed directly.

## Rich rules

A **rich rule** says "for this family and source and port, do this". Use it when a service or a source zone cannot express the case:

```console
[root@servera ~]# firewall-cmd --permanent --zone=lanonly --add-rich-rule='rule family="ipv4" source address="172.25.250.11" port port="8080" protocol="tcp" reject'
success
[root@servera ~]# firewall-cmd --reload
success
[root@servera ~]# firewall-cmd --zone=lanonly --list-all
lanonly (active)
  target: default
  icmp-block-inversion: no
  interfaces: 
  sources: 172.25.250.11
  services: http
  ports: 
  protocols: 
  forward: no
  masquerade: no
  forward-ports: 
	port=8081:proto=tcp:toport=8080:toaddr=
  source-ports: 
  icmp-blocks: 
  rich rules: 
	rule family="ipv4" source address="172.25.250.11" port port="8080" protocol="tcp" reject
```

Quote the whole rule in single quotes. Actions are `accept`, `reject` and `drop`. Prefer plain services and zones when they do the job: rich rules are the hardest to read months later.

## Seeing what is rejected

```console
[root@servera ~]# firewall-cmd --set-log-denied=all
success
[root@servera ~]# journalctl -k --no-pager | grep REJECT | tail -1 | cut -c1-120
Oct  3 19:57:58 servera kernel: filter_IN_public_REJECT: IN=enp1s0 OUT= MAC=… SRC=172.25.250.11 DST=172.25.250.10 …
[root@servera ~]# firewall-cmd --set-log-denied=off
success
```

The line names the zone (`public`), the interface, the sender (`SRC`) and the port (`DPT`). Logging every rejected packet is noisy, so switch it off after you have the answer.

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch20.special"] ref="quick" /%}
