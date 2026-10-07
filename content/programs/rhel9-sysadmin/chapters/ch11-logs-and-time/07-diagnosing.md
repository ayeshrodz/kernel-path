---
title: A method for diagnosing problems
seoTitle: "How to Troubleshoot a Failing systemd Service"
description: "A repeatable method to diagnose a failing service from its status, logs and configuration. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 15
---

{% lead %}
Logs are only half of troubleshooting; the other half is a habit. Beginners change five things at once and cannot tell which one mattered. Experienced administrators follow the same short routine every time: describe the symptom, ask the service, read the log, widen the search, test one change, and verify. This lesson turns that routine into a list of commands.
{% /lead %}

{% objectives %}
- Follow a six-step diagnosis from symptom to verification.
- Read a failed service's status and journal, and find the first error.
- Use `dmesg`, `last` and `journalctl -k` for kernel and login problems.
{% /objectives %}

## The routine

{% diagram ref="triage" /%}

Each move has its commands.

**1 · Symptom.** Write one sentence: what should happen, what happens. Reproduce it so that you can test the fix later with the same action.

**2 · Ask the service.**

```console
[root@servera ~]# systemctl status billing
× billing.service - Billing job
     Loaded: loaded (/etc/systemd/system/billing.service; disabled; preset: disabled)
     Active: failed (Result: exit-code) since Sat 2026-10-03 17:04:56 UTC; 2s ago
    Process: 791 ExecStart=/usr/local/bin/billing.sh (code=exited, status=3)
   Main PID: 791 (code=exited, status=3)
[root@servera ~]# systemctl --failed
  UNIT            LOAD   ACTIVE SUB    DESCRIPTION
● billing.service loaded failed failed Billing job
```

A red `×` and `failed` tell you it ran and stopped with an error; `status=3` is the program's own exit code.

**3 · Read the log around it.** Start from the **first** error, not the last:

```console
[root@servera ~]# journalctl -u billing --no-pager | head -6
Oct 03 17:04:52 servera.lab.example.com billing.sh[788]: billing: cannot read /etc/billing.conf
Oct 03 17:04:52 servera.lab.example.com systemd[1]: Started Billing job.
Oct 03 17:04:52 servera.lab.example.com systemd[1]: billing.service: Main process exited, code=exited, status=3/NOTIMPLEMENTED
Oct 03 17:04:52 servera.lab.example.com systemd[1]: billing.service: Failed with result 'exit-code'.
Oct 03 17:04:53 servera.lab.example.com systemd[1]: billing.service: Scheduled restart job, restart counter is at 1.
```

The program told us exactly what is wrong: it cannot read `/etc/billing.conf`. The later lines ("Failed with result", "restart counter") are only consequences. After a few quick failures systemd gives up ("Start request repeated too quickly") and you must `systemctl reset-failed NAME` before it will try again.

**4 · Widen the net** when the service log is not enough:

| Question | Command |
| --- | --- |
| Anything wrong anywhere in this boot? | `journalctl -p err -b` |
| Hardware, disk, memory or driver trouble? | `dmesg --level=err,warn`, `dmesg -T`, `journalctl -k` |
| Who logged in, and when did it reboot? | `last -n 10`, `lastb` (failed logins) |
| Login or `sudo` trouble? | `grep -i fail /var/log/secure` |
| What happened just before? | `journalctl --since "10 minutes ago"` |

```console
[root@servera ~]# dmesg -T | tail -1
[Sat Oct  3 17:01:02 2026] ata5: SATA link down (SStatus 0 SControl 300)
[root@servera ~]# last -n 3
reboot   system boot  5.14.0-687.53.1. Sat Oct  3 17:00   still running
student  pts/0        172.25.251.9     Sat Oct  3 09:30 - 09:30  (00:00)
reboot   system boot  5.14.0-687.53.1. Sat Oct  3 09:29   still running
```

**5 · One change at a time.** Fix the cause you found, and only that. Keep a note of the exact change (a comment in the file, or in your notebook), so that you can undo it.

**6 · Verify.** Repeat the action from step 1. Check the service status and the log again, and also check that nothing else broke.

{% callout type="tip" title="Read the error message" %}
Most error messages contain the answer: a file name, a number, a missing word. Read the whole sentence aloud before you search for it. And copy exact text into a note, not a paraphrase.
{% /callout %}

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch11.diagnosis"] ref="quick" /%}
