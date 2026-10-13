---
title: "firewalld cheat sheet"
seoTitle: "firewalld Cheat Sheet (RHCSA)"
description: "firewalld cheat sheet: the key commands and ideas on one page, with flashcards for revision. Free RHCSA study notes."
kind: summary
minutes: 5
---

{% lead %}
The chapter on one page: what to remember, the commands to have at your fingertips, and flashcards for quick revision.
{% /lead %}

## The chapter in eight sentences

- firewalld judges each packet by one **zone**: the zone of its source address if one matches, otherwise the zone of the interface, otherwise the default zone.
- `firewall-cmd --get-active-zones` and `--list-all` show what is in force; a service is a named set of ports, not a daemon.
- Open a service with `firewall-cmd --permanent --add-service=NAME`, then `firewall-cmd --reload`; ports with `--add-port=9000/tcp`.
- Without `--permanent` a change is runtime only and a reload erases it; with it, the change is saved but not yet enforced.
- `--timeout=60` makes a runtime rule expire; `--runtime-to-permanent` saves everything in force, including forgotten tests.
- To allow one host only, create a zone, add the host as its `--add-source` and allow the service there; `drop` shuts a source out silently.
- Define your own service with `--new-service`, forward ports with `--add-forward-port`, and keep rich rules for what nothing else can say.
- Diagnose from the symptom: no route to host is a rejection, a timeout is a drop, refused means nothing listens; then check service, `ss -tlnp`, zone rules and SELinux ports.

## Cheat sheet

{% tabs %}
  {% tab label="Look" %}

| Command | Does |
| --- | --- |
| `firewall-cmd --state` | Is firewalld running |
| `--get-default-zone` · `--get-active-zones` | Zones |
| `--list-all [--zone=Z]` | Everything a zone allows |
| `--get-zone-of-source=IP` | Zone of an address |
| `--info-service=NAME` · `--get-services` | Service definitions |
| `--query-service=NAME` | yes or no (add `--permanent` for the saved rules) |

  {% /tab %}
  {% tab label="Change" %}

| Command | Does |
| --- | --- |
| `--permanent --add-service=http` · `--reload` | Allow a service for good |
| `--permanent --add-port=9000/tcp` | Allow a port |
| `--remove-service` · `--remove-port` | Close again |
| `--add-port=8080/tcp --timeout=60` | Temporary |
| `--runtime-to-permanent` | Save all runtime rules |
| `--permanent --new-zone=Z` · `--reload` | New zone |

  {% /tab %}
  {% tab label="Special" %}

| Command | Does |
| --- | --- |
| `--permanent --zone=Z --add-source=IP` | Send a host to a zone |
| `--permanent --new-service=S` · `--service=S --add-port=9000/tcp` | Own service |
| `--add-forward-port=port=8081:proto=tcp:toport=8080` | Forward a port |
| `--add-rich-rule='rule family="ipv4" source address="IP" port port="9000" protocol="tcp" reject'` | Rich rule |
| `--set-log-denied=all` · `journalctl -k` | Log rejections |
| `ss -tlnp` · `curl -m 3 URL` | Listening ports, client test |

  {% /tab %}
{% /tabs %}

## Flashcards

{% flashcards ref="flashcards" /%}
