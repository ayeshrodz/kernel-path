---
title: "SELinux cheat sheet"
seoTitle: "SELinux Cheat Sheet (RHCSA)"
description: "SELinux cheat sheet: the key commands and ideas on one page, with flashcards for revision. Free RHCSA study notes."
kind: summary
minutes: 5
---

{% lead %}
The chapter on one page: what to remember, the commands to have at your fingertips, and flashcards for quick revision.
{% /lead %}

## The chapter in eight sentences

- SELinux is mandatory access control: every file, process and port has a **context** (`user:role:type:level`), and the **type** decides what the policy allows.
- An access needs **both** the ordinary permissions **and** SELinux to allow it; `chmod` cannot fix a label problem.
- `getenforce`, `sestatus` and `setenforce 0|1` show and switch the mode for now; `/etc/selinux/config` sets it permanently. Never disable SELinux to solve a denial.
- `ls -Z`, `ps -Z` and `id -Z` show contexts; `matchpathcon PATH` shows the type the policy expects.
- Fix a wrong file type permanently with `semanage fcontext -a -t TYPE "/dir(/.*)?"` followed by `restorecon -Rv /dir`; `chcon` is temporary.
- `cp` creates a file with the destination's default label; `mv` keeps the old label, so run `restorecon` after moving files into a service directory.
- Booleans are on/off switches for optional behaviour (`getsebool -a`, `setsebool -P NAME on`); a service on a non-standard port needs `semanage port -a -t TYPE -p tcp PORT`.
- Troubleshoot: test permissive, read the AVC in `/var/log/audit/audit.log` (or `sealert -a`), choose label, boolean or port, make the smallest fix, and test in enforcing mode.

## Cheat sheet

{% tabs %}
  {% tab label="See" %}

| Command | Does |
| --- | --- |
| `getenforce` · `sestatus` | Mode and policy |
| `setenforce 0` / `1` | Permissive / enforcing (until reboot) |
| `/etc/selinux/config` | `SELINUX=enforcing` (permanent) |
| `ls -Z` · `ps -eZ` · `id -Z` | Contexts |
| `matchpathcon PATH` | The expected type |

  {% /tab %}
  {% tab label="Fix" %}

| Command | Does |
| --- | --- |
| `semanage fcontext -a -t T "/p(/.*)?"` | Add a labelling rule |
| `semanage fcontext -l -C` · `-d "/p(/.*)?"` | List / delete local rules |
| `restorecon -Rv PATH` (`-n` to preview) | Apply the rules |
| `chcon -t T FILE` | Temporary label |
| `getsebool -a` · `setsebool -P B on` | Booleans |
| `semanage boolean -l -C` | Changed booleans |
| `semanage port -a -t T -p tcp N` · `-l -C` · `-d` | Port labels |

  {% /tab %}
  {% tab label="Diagnose" %}

| Command | Does |
| --- | --- |
| `setenforce 0`, retry, `setenforce 1` | Is it SELinux? |
| `grep AVC /var/log/audit/audit.log` | The denials |
| `sealert -a /var/log/audit/audit.log` | Plain-language explanation |
| `ausearch -m AVC -i` (add `-if FILE` if needed) | Search the audit log |
| `journalctl -u SERVICE` | What the service says |
| `audit2allow -M name` | Custom module: last resort |

  {% /tab %}
{% /tabs %}

## Flashcards

{% flashcards ref="flashcards" /%}
