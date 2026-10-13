---
title: From requirements to evidence
seoTitle: "Deliver a Linux Service From Requirements (RHCSA Review)"
description: "Turn requirements into evidence and build a web service layer by layer, as in an exam task. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 15
---

{% lead %}
You can operate a system when you can connect each requirement to evidence, not merely repeat commands from one lesson. This chapter ties the course together with one small service, a status portal, and three habits: write the contract first, build in a sensible order, and prove each requirement in a way a colleague would accept.
{% /lead %}

{% objectives %}
- Turn a service description into requirements with a named proof for each.
- Build in an order that keeps each step testable.
- Tell apart configuration, live state, a client operation and a lifecycle test.
{% /objectives %}

## The service contract

The portal is an internal web page, "Portal status: OK", on servera. Before touching anything, write down what "done" means:

| Requirement | Course chapters | Proof |
| --- | --- | --- |
| Content owned by `portaladm`, group `portal`; web server may read it | [accounts](#/ch06/accounts-and-groups), [permissions](#/ch07/changing-permissions), [ACLs](#/ch07/acls) | `id`, `ls -l`, `getfacl` |
| `httpd` installed from the approved repositories | [software](#/ch13/dnf) | `rpm -q httpd` |
| Running now and at boot | [services](#/ch09/services) | `systemctl is-active`, `is-enabled` |
| SELinux enforcing; content and port labelled | [SELinux](#/ch16/selinux-concepts) | `getenforce`, `ls -Z`, `semanage ... -l` |
| Only the partner serverb may reach port 8090 | [firewall](#/ch20/zones-and-services), [network](#/ch12/network-basics) | `firewall-cmd --list-all`, requests from two hosts |
| Persistent journal, daily backup, tested restore | [logs](#/ch11/reading-logs), [backups](#/ch14/backups), [timers](#/ch15/timers-and-at) | `ls -d /var/log/journal`, `systemctl list-timers`, a restore |

Each row is a layer you already know. Select one:

{% diagram ref="layers" /%}

## Four kinds of proof

- **Configuration** shows saved intent: a unit file, a stored context mapping, a permanent firewall rule, an fstab line.
- **Live inspection** shows the current state: a process, a listener, an effective policy.
- **A client operation** shows useful behaviour: the HTTP body, the file actually read, the permitted login.
- **A lifecycle test** shows retention: the same operation after reload, logout, restart or reboot.

Each has limits. An active daemon does not prove the content is right. A request from servera itself does not prove the firewall lets the partner in. A restored file does not prove the web server can read it. The strongest evidence combines all four.

## Build in order

{% diagram ref="build-order" /%}

Test after every step. A failure found right after a change has one suspect; a failure found at the end has all of them.

## Collect evidence

This is what a finished portal looks like to the checker, and to you:

{% shell-practice ref="practice" /%}

{% callout type="tip" title="Change one constraint, then predict" %}
After you finish, change one requirement: another document root, a second allowed caller, a different port. Predict which layers must change (label? port label? zone? ACL?), change them one by one, and verify each. That is the test of understanding, much more than repeating the commands.
{% /callout %}

## Check your understanding

{% quiz id="quick" objectives=["ch22.evidence"] ref="quick" /%}
