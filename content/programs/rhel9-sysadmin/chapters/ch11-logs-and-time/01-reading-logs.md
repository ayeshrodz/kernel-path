---
title: Reading the system logs
seoTitle: "journalctl Tutorial: Read Linux System Logs"
description: "Read and filter logs with journalctl by unit, priority and time, and with /var/log and logger. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 20
---

{% lead %}
When something goes wrong on a server, the answer is almost always written down somewhere: in a log. Services, the kernel, logins and scheduled jobs all leave a trail. This lesson shows where the trail is kept and how to read the part you need, instead of scrolling through all of it.
{% /lead %}

{% objectives %}
- Explain how journald and rsyslog work together, and name the important files in `/var/log`.
- Filter the journal by unit, priority, boot and time with `journalctl`.
- Write your own messages with `logger`, and find them again.
{% /objectives %}

## Two logging systems, one flow

RHEL keeps logs in two places at once, and they cooperate:

{% diagram ref="log-flow" /%}

- **systemd-journald** collects everything, services' output included, into a **structured journal** that remembers the unit, the process, the priority and the time of each message. You read it with `journalctl`.
- **rsyslog** reads the journal and writes classic **text files** in `/var/log`, which you can search with `grep` and `less`.

The files you will visit most often:

| File | Contains |
| --- | --- |
| `/var/log/messages` | General system messages (priority info and up, except authentication, mail and cron) |
| `/var/log/secure` | Authentication: SSH logins, `sudo`, `su`, failed passwords |
| `/var/log/cron` | Scheduled jobs |
| `/var/log/dnf.log` | Package operations |
| `/var/log/boot.log` | Boot-time output of services |
| `/var/log/wtmp`, `btmp` | Binary records of logins (`last`) and failed logins (`lastb`) |

Many files are readable only by root (`-rw-------`). Use `sudo`, or read them with `journalctl` as a member of the `systemd-journal` or `wheel` group.

## journalctl

Run alone, `journalctl` shows the whole journal, oldest first, in a pager. You will almost always add filters:

| Option | Shows |
| --- | --- |
| `-n 20` | The last 20 entries |
| `-f` | New entries as they arrive, like `tail -f` (Ctrl+C to stop) |
| `-u sshd` | Only the unit `sshd` |
| `-b` | Only this boot (`-b -1` the previous one, if the journal is persistent) |
| `-p err` | Messages of priority `err` **and more serious** |
| `--since "10 minutes ago"`, `--until 16:10` | A time window |
| `-g PATTERN` | Messages matching a pattern |
| `-k` | Kernel messages only |
| `-o short-iso`, `-o verbose` | Other formats; `verbose` shows every field |
| `--no-pager` | Print straight to the terminal (handy for scripts and `grep`) |

Combine them freely:

```console
[root@servera ~]# journalctl -u sshd -n 2 --no-pager
Oct 03 16:57:53 servera.lab.example.com sshd-session[658]: pam_unix(sshd:session): session opened for user student(uid=1000) by (uid=0)
Oct 03 16:57:53 servera.lab.example.com sshd-session[658]: pam_unix(sshd:session): session closed for user student
[root@servera ~]# journalctl -p err -b --no-pager
-- No entries --
[root@servera ~]# journalctl -g Accepted -n 1 --no-pager
Oct 03 17:01:04 servera.lab.example.com sshd-session[1049]: Accepted publickey for root from 172.25.251.9 port 41352 ssh2: ED25519 SHA256:WflAun3Q...
```

### Priorities

Every message has one of eight levels. `-p` takes a name or a number, and shows that level and everything more serious:

{% diagram ref="priorities" /%}

## Your own messages

`logger` writes a message through the normal channel, which is useful in scripts and for testing:

```console
[root@servera ~]# logger -p user.notice "hello from logger"
[root@servera ~]# journalctl -n 1 --no-pager
Oct 03 16:59:31 servera.lab.example.com root[727]: hello from logger
[root@servera ~]# tail -1 /var/log/messages
Oct  3 16:59:31 servera root[727]: hello from logger
```

The same message appears in the journal and in `/var/log/messages`. `-p` takes `facility.priority`, and `-t TAG` changes the label in front of the text.

## How big is it?

```console
[root@servera ~]# journalctl --disk-usage
Archived and active journals take up 3.0M in the file system.
```

The next lesson explains how long logs are kept, and how to keep them across reboots.

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch11.reading"] ref="quick" /%}
