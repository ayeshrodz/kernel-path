---
title: "Linux networking cheat sheet"
seoTitle: "Linux networking Cheat Sheet (RHCSA)"
description: "Linux networking cheat sheet: the key commands and ideas on one page, with flashcards for revision. Free RHCSA study notes."
kind: summary
minutes: 5
---

{% lead %}
The chapter on one page: what to remember, the commands to have at your fingertips, and flashcards for quick revision.
{% /lead %}

## The chapter in eight sentences

- A host is identified on the network by an **address** with a **prefix**, reaches other networks through a **gateway**, and asks a **DNS server** for names.
- `ip -br addr`, `ip route` and `ip neigh` show addresses, routes and neighbours; `ss -tulpn` shows what listens, and on which address.
- `ping` proves an address answers; it does not prove that a service works.
- NetworkManager separates **devices** (hardware) from **connection profiles** (saved settings), stored in `/etc/NetworkManager/system-connections/`.
- `nmcli connection add|modify|up|down|delete` builds persistent configuration; `modify` edits the profile and `up` applies it; `ip addr add` is lost at reboot.
- `hostnamectl set-hostname` sets the host's own name; names of other hosts are resolved in the order of `nsswitch.conf`: `/etc/hosts`, then DNS.
- `getent hosts` shows what programs will see; `dig` asks DNS only. A stale `/etc/hosts` line can override DNS.
- Troubleshoot upward: link, address, gateway, target IP, name, port. "No route to host" with a working ping suggests a firewall, "Connection refused" means nothing listens there.

## Cheat sheet

{% tabs %}
  {% tab label="Inspect" %}

| Command | Does |
| --- | --- |
| `ip -br addr`, `ip -br link` | Addresses, links and MACs |
| `ip route` | Routes and default gateway |
| `ip neigh` | Neighbours |
| `ping -c 2 HOST` | Reachability |
| `tracepath -n ADDR` | Path hop by hop |
| `ss -tulpn` | Listening ports and programs |
| `curl -sS -m 5 URL` | Test a service, show the error |

  {% /tab %}
  {% tab label="Configure" %}

| Command | Does |
| --- | --- |
| `nmcli device status` | Devices |
| `nmcli connection show [NAME]` | Profiles / one profile |
| `nmcli con add type dummy ifname I con-name N ipv4.method manual ipv4.addresses A/24` | New static profile |
| `nmcli con modify N +ipv4.addresses A/24 ipv4.dns D ipv4.gateway G` | Edit the profile |
| `nmcli con up N` / `down N` / `delete N` | Apply / remove settings / delete |
| `nmcli -g PROP con show N` | One value |

  {% /tab %}
  {% tab label="Names" %}

| Command / file | Does |
| --- | --- |
| `hostnamectl`, `hostnamectl set-hostname N` | Show / set the name |
| `/etc/hosts` | Local names, searched first |
| `/etc/resolv.conf` | DNS servers and search domain (managed by NetworkManager) |
| `/etc/nsswitch.conf` | `hosts: files dns myhostname` |
| `getent hosts N` | What programs resolve |
| `dig +short N`, `dig -x ADDR`, `host N` | DNS only |

  {% /tab %}
{% /tabs %}

## Flashcards

{% flashcards ref="flashcards" /%}
