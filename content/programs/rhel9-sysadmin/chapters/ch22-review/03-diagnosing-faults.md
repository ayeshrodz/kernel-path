---
title: Diagnosing faults
seoTitle: "Linux Troubleshooting Method: Symptoms to Fixes"
description: "Diagnose faults from the symptom: refused, no route, timeout, 403 or a service that will not start. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 15
---

{% lead %}
A broken service is a puzzle with a fixed set of pieces: process, listener, network path, permissions, labels, content. The skill is not knowing every command but using the same method each time, so that the evidence, and not a guess, picks the fix.
{% /lead %}

{% objectives %}
- Follow a fixed method: state, baseline, hypotheses, one change, verify.
- Map the client's symptom to the layer and the chapter that handles it.
- Avoid the shortcuts that hide the cause: stopping the firewall, `setenforce 0`, `chmod 777`.
{% /objectives %}

## The method

{% diagram ref="method" /%}

**State the failure.** "serverb gets 403 for `http://servera:8090/` since the restore" is a fact you can test again. "The portal is broken" is not.

**Gather a narrow baseline** before you change anything: the service and its journal, the listener, a request from servera itself, a request from the caller, the zone rules, and the owner, mode, ACL and label of the content. Two requests, one local and one remote, already split the problem in half: if the local one works, the daemon and the content are fine and you look at the network.

**Change one thing**, then repeat the exact request that failed. Afterwards verify that the other requirements still hold: a fix that opens the firewall to everyone is a new fault.

{% callout type="warning" title="Do not stack shortcuts" %}
Stopping the firewall, setting SELinux to permissive and making files world-readable at the same time will probably make the symptom disappear, but you will not know why, and you have removed three protections. Find the single cause.
{% /callout %}

## From symptom to layer

{% diagram ref="symptoms" /%}

## A baseline in practice

A request fails with 403. The service is up and the port is open. The baseline points at the content:

{% shell-practice ref="practice" /%}

The label `var_t` is wrong for web content; `restorecon` applied the stored mapping, and the same request now succeeds. If the label had been right, the next suspect would have been the mode or the ACL (`getfacl`), then the path (`namei -l`).

A useful table to keep in mind:

| Symptom | First checks |
| --- | --- |
| Connection refused | `systemctl status`, `ss -tlnp`, `journalctl -u` |
| No route to host | `firewall-cmd --get-active-zones`, `--list-all --zone=…` |
| Timeout | drop zone or source, routing, the address in the URL |
| 403 | `ls -lZ`, `getfacl`, `namei -l`, `getenforce` |
| 200 but wrong content | the document root, the backup, timestamps |
| Will not start | the journal: port label, syntax, port in use |

## Check your understanding

{% quiz id="quick" objectives=["ch22.faults"] ref="quick" /%}
