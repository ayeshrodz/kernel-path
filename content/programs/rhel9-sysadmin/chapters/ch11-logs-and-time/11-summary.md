---
title: "Linux logs and time cheat sheet"
seoTitle: "Linux logs and time Cheat Sheet (RHCSA)"
description: "Linux logs and time cheat sheet: the key commands and ideas on one page, with flashcards for revision. Free RHCSA study notes."
kind: summary
minutes: 5
---

{% lead %}
The chapter on one page: what to remember, the commands to have at your fingertips, and flashcards for quick revision.
{% /lead %}

## The chapter in eight sentences

- Services log to **journald**, which keeps a structured journal; **rsyslog** copies messages into text files such as `/var/log/messages` and `/var/log/secure`.
- `journalctl` filters by unit (`-u`), priority (`-p`), boot (`-b`), time (`--since`, `--until`), pattern (`-g`) and follows live with `-f`.
- Priorities run from 0 (emerg) to 7 (debug); `-p err` shows levels 0 to 3.
- The journal is volatile unless `/var/log/journal` exists; create it, restart journald and run `journalctl --flush`, and limit its size with a drop-in in `/etc/systemd/journald.conf.d/`.
- Custom log files come from a rule in `/etc/rsyslog.d/` (`local5.* /var/log/NAME.log`) and `logger`; logrotate rules in `/etc/logrotate.d/` keep them in check.
- `timedatectl` shows and sets the time zone; with NTP active, the clock cannot be set by hand.
- chrony follows NTP sources from `/etc/chrony.conf`; `chronyc sources` marks the selected one with `*`, `chronyc tracking` shows the offset.
- Diagnose in order: symptom, `systemctl status`, `journalctl -u`, wider logs (`-p err`, `dmesg`, `last`), one change, verify.

## Cheat sheet

{% tabs %}
  {% tab label="Reading logs" %}

| Command | Does |
| --- | --- |
| `journalctl -u NAME -b` | A service, this boot |
| `journalctl -p err -b` | Errors and worse |
| `journalctl --since "1 hour ago"` | Time window |
| `journalctl -f`, `-n 20`, `-g TEXT` | Follow, last, search |
| `journalctl -k`, `dmesg -T` | Kernel messages |
| `grep Failed /var/log/secure` | Authentication problems |
| `last`, `lastb` | Logins, failed logins |
| `logger -p local5.info "text"` | Write a message |

  {% /tab %}
  {% tab label="Keeping logs" %}

| Item | Detail |
| --- | --- |
| Persistent journal | `mkdir /var/log/journal`; `systemctl restart systemd-journald`; `journalctl --flush` |
| Limits | `/etc/systemd/journald.conf.d/10-X.conf`: `SystemMaxUse=` |
| Clean up | `journalctl --vacuum-size=100M` · `--vacuum-time=2weeks` |
| rsyslog rule | `/etc/rsyslog.d/10-X.conf`: `local5.* /var/log/X.log`; restart rsyslog |
| logrotate rule | `/etc/logrotate.d/X`: `weekly`, `rotate N`, `compress`, `create` |
| Test / force | `logrotate -d FILE` · `logrotate -f FILE` |

  {% /tab %}
  {% tab label="Time" %}

| Command | Does |
| --- | --- |
| `timedatectl` | Clock, zone, sync state |
| `timedatectl list-timezones` | Zone names |
| `timedatectl set-timezone Asia/Colombo` | Set zone |
| `timedatectl set-ntp true\|false` | NTP on or off |
| `chronyc sources` / `tracking` | Sources / offset |
| `/etc/chrony.conf` | `pool` or `server NAME iburst` |
| `systemctl restart chronyd` | Apply changes |

  {% /tab %}
{% /tabs %}

## Flashcards

{% flashcards ref="flashcards" /%}
