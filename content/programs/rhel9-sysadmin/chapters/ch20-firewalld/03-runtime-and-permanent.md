---
title: Runtime and permanent rules
seoTitle: "firewall-cmd --permanent vs Runtime Rules"
description: "Runtime and permanent firewalld rules, --reload, --timeout and the runtime-to-permanent trap. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 15
---

{% lead %}
firewalld keeps two copies of its rules: the ones in force **right now** (runtime) and the ones saved on disk (permanent). Most firewall surprises come from changing one and expecting the other. This lesson makes the difference routine.
{% /lead %}

{% objectives %}
- Explain the runtime and permanent stores and which command changes which.
- Make a change survive a reload and a reboot.
- Use `--timeout` for temporary tests, and avoid the trap of `--runtime-to-permanent`.
{% /objectives %}

## Two stores

{% diagram ref="two-stores" /%}

Without `--permanent`, a command changes only the running firewall. Compare both stores after a runtime change:

```console
[root@servera ~]# firewall-cmd --add-service=http
success
[root@servera ~]# firewall-cmd --list-services
cockpit dhcpv6-client http ssh
[root@servera ~]# firewall-cmd --permanent --list-services
cockpit dhcpv6-client ssh
[root@servera ~]# firewall-cmd --reload
success
[root@servera ~]# firewall-cmd --query-service=http
no
```

The reload threw the runtime change away. The correct habit is: **change the permanent configuration, then reload.**

```console
[root@servera ~]# firewall-cmd --permanent --add-service=http
success
[root@servera ~]# firewall-cmd --reload
success
[root@servera ~]# firewall-cmd --query-service=http
yes
```

Queries work on either store: `firewall-cmd --query-service=http` asks the running firewall, and `firewall-cmd --permanent --query-service=http` the saved one. Each prints `yes` or `no`.

## Options at a glance

{% diagram ref="options" /%}

## Temporary rules

`--timeout` opens something for a fixed time. It is runtime only, so it is ideal for a quick test:

```console
[root@servera ~]# firewall-cmd --add-port=8080/tcp --timeout=60
success
[root@servera ~]# firewall-cmd --list-ports
8080/tcp
```

After a minute the port closes again by itself.

## The runtime-to-permanent trap

`firewall-cmd --runtime-to-permanent` saves **everything** that is in force now. If a test rule is still open, it becomes permanent too:

```console
[root@servera ~]# firewall-cmd --add-port=8080/tcp --timeout=60
success
[root@servera ~]# firewall-cmd --runtime-to-permanent
success
[root@servera ~]# firewall-cmd --permanent --list-ports
8080/tcp
```

The temporary port is now saved for good. To remove it: `firewall-cmd --permanent --remove-port=8080/tcp`, then `--reload`.

{% callout type="tip" title="A safe routine" %}
1. Test with `--timeout` if you are unsure.
2. Make the real change with `--permanent`.
3. `--reload`, then check with `--list-all` (and from the client).
4. Compare both stores whenever the result is not what you expect.
{% /callout %}

The saved configuration lives under `/etc/firewalld/` (zone files in `zones/`, your own services in `services/`). You rarely edit those files by hand, but it is useful to know that `--permanent` writes them.

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch20.stores"] ref="quick" /%}
