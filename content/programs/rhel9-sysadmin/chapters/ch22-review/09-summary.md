---
title: "Linux administration final review cheat sheet"
seoTitle: "Linux administration final review Cheat Sheet (RHCSA)"
description: "Linux administration final review cheat sheet: the key commands and ideas on one page, with flashcards for revision. Free RHCSA study notes."
kind: summary
minutes: 5
---

{% lead %}
The chapter on one page, and the whole course in a table: where each skill lives, so you can find the right chapter when a real fault shows up.
{% /lead %}

## The chapter in eight sentences

- Write the service contract first: each requirement gets a named proof.
- Four kinds of proof: configuration, live inspection, a client operation, and a lifecycle test after a reboot.
- Build in order: identity and software, content and labels, the service, the network, then logs and recovery; test after every step.
- Diagnose with one method: state the failure, take a narrow baseline, rank hypotheses, change one thing, repeat the failing request.
- Refused means nothing listens, no route means the firewall rejected, a timeout means a drop, and 403 means mode, ACL or label.
- A port that httpd cannot bind needs `semanage port`; content needs a stored `semanage fcontext` and `restorecon`.
- Back up with `tar --acls --selinux`, restore into a staging directory, replace only what is needed, and test the restore.
- Write the handover: purpose, changes, operation, recovery, known failures and the limits of your testing.

## Where to look

{% tabs %}
  {% tab label="Symptom to chapter" %}

| Symptom | Go to |
| --- | --- |
| Cannot log in, wrong owner or mode | [accounts](#/ch06/accounts-and-groups), [permissions](#/ch07/changing-permissions) |
| Service stopped or failing | [services](#/ch09/services), [logs](#/ch11/reading-logs) |
| SSH problems | [SSH](#/ch10/keys) |
| No network, wrong name | [networking](#/ch12/network-basics) |
| Package or repository | [dnf](#/ch13/dnf) |
| 403 or a failed bind | [SELinux](#/ch16/selinux-concepts) |
| Full or missing disk | [storage](#/ch17/disks-and-partitions), [LVM](#/ch18/lvm-concepts) |
| Remote files | [NFS and autofs](#/ch19/nfs-basics) |
| Blocked connection | [firewall](#/ch20/zones-and-services) |
| Container service | [containers](#/ch21/images-and-containers) |

  {% /tab %}
  {% tab label="Evidence commands" %}

| Layer | Commands |
| --- | --- |
| Identity | `id`, `ls -l`, `getfacl` |
| Service | `systemctl status|is-active|is-enabled`, `journalctl -u` |
| Network | `ss -tlnp`, `firewall-cmd --list-all`, `curl -m 3` |
| SELinux | `getenforce`, `ls -Z`, `semanage port|fcontext -l -C` |
| Recovery | `systemctl list-timers`, `tar -tzf`, `sha256sum` |

  {% /tab %}
{% /tabs %}

## Flashcards

{% flashcards ref="flashcards" /%}
