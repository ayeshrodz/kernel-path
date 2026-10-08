---
title: Zones and services
seoTitle: "firewalld Zones and Services Explained"
description: "How firewalld zones and services work and how to allow a service with firewall-cmd. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 15
---

{% lead %}
A firewall decides which network traffic may reach your machine. On RHEL that job belongs to **firewalld**. Before opening anything, you need two ideas: a **zone** is a set of rules for a level of trust, and a **service** is a named bundle of ports you can allow inside a zone.
{% /lead %}

{% objectives %}
- Check that firewalld runs and read the active zone with `firewall-cmd --list-all`.
- Explain how a packet is assigned to a zone: source, then interface, then default.
- Allow a service and verify it from another machine.
{% /objectives %}

## Zones: rules for a level of trust

A zone is a named rule set. The built-in ones range from `drop` (discard everything) through `public` (the default; only ssh and a few services) to `trusted` (accept everything). Each interface, and optionally each source address, is assigned to one zone. Traffic is judged only by the rules of its zone.

{% diagram ref="zone-choice" /%}

Look at a fresh system:

```console
[root@servera ~]# firewall-cmd --state
running
[root@servera ~]# firewall-cmd --get-default-zone
public
[root@servera ~]# firewall-cmd --get-active-zones
public
  interfaces: enp1s0
[root@servera ~]# firewall-cmd --get-zones
block dmz drop external home internal nm-shared public trusted work
```

Only zones that have an interface or source are **active**. A rule added to an inactive zone changes nothing you can test.

## Reading the zone

`--list-all` prints everything the zone does. Select a line:

{% diagram ref="list-all" /%}

```console
[root@servera ~]# firewall-cmd --list-all
public (active)
  target: default
  icmp-block-inversion: no
  interfaces: enp1s0
  sources: 
  services: cockpit dhcpv6-client ssh
  ports: 
  protocols: 
  forward: yes
  masquerade: no
  forward-ports: 
  source-ports: 
  icmp-blocks: 
  rich rules: 
```

## Services are definitions, not daemons

`firewall-cmd --get-services` lists more than two hundred names, and `--info-service=http` shows what one stands for:

```console
[root@servera ~]# firewall-cmd --info-service=http
http
  ports: 80/tcp
  protocols: 
  source-ports: 
  modules: 
  destination: 
  includes: 
  helpers: 
```

{% callout type="warning" title="Two layers, two checks" %}
Allowing `http` in the firewall does not start a web server. Starting `httpd` does not open the firewall. A page that does not load needs both: the service running **and** the port allowed.
{% /callout %}

## Allowing a service

```console
[root@servera ~]# firewall-cmd --permanent --add-service=http
success
[root@servera ~]# firewall-cmd --reload
success
[root@servera ~]# firewall-cmd --list-services
cockpit dhcpv6-client http ssh
[root@servera ~]# firewall-cmd --query-service=http
yes
```

`--permanent` saves the rule and `--reload` loads it. The next lesson explains why both steps exist. Remove a rule with `--remove-service=http`, the same way.

{% callout type="tip" title="Do not lock yourself out" %}
Never remove `ssh` from the zone you are connected through, and be careful when changing the zone of the interface you are using. Use the console of the virtual machine when in doubt.
{% /callout %}

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch20.zones"] ref="quick" /%}
