---
title: "Exercise: Find and fix a failing service"
seoTitle: "Find and fix a failing service (RHCSA Practice Exercise)"
description: "Hands-on RHCSA practice: find and fix a failing service. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 25
---

{% lead %}
A colleague has installed a small service called `billing`, and it does not run. You did not write it and nobody told you why it fails. Use the routine from the lesson: symptom, status, journal, one change, verify.
{% /lead %}

{% lab
  objectives=["ch11.diagnosis"]
  id="diagnosis"
  title="Find and fix a failing service"
  exercise="sa-diagnosing"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera"]
  outcomes=["Read a failed service's status and journal.","Identify the first error and fix its cause.","Verify the fix and clean up."] %}

  {% task id="task-1b2c47fa03e4" title="Start the exercise" %}
    On workstation, start the exercise. It installs the broken billing service (a program and a unit, written by a "colleague") on servera and reloads systemd.

```console
[student@workstation ~]$ lab start sa-diagnosing
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-e6518c1c69ad" title="State the symptom" %}
    Start `billing` and write down in one sentence what you observe.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# systemctl start billing
[root@servera ~]# systemctl is-active billing
failed
```

    Symptom: "billing should be running, and it is in the failed state."
    {% /reveal %}
  {% /task %}

  {% task id="task-6d55e412b4dd" title="Ask the service" %}
    Read the status. What exit code did the program return? Is systemd still retrying?

    {% reveal title="Show solution" %}

```console
[root@servera ~]# systemctl status billing | head -8
× billing.service - Billing job
     Loaded: loaded (/etc/systemd/system/billing.service; disabled; preset: disabled)
     Active: failed (Result: exit-code) since Sat 2026-10-03 17:04:56 UTC; 2s ago
    Process: 791 ExecStart=/usr/local/bin/billing.sh (code=exited, status=3)
   Main PID: 791 (code=exited, status=3)
```

    The exit code is 3. After a few rapid retries systemd stopped, as the "Start request repeated too quickly" line in the journal says.
    {% /reveal %}
  {% /task %}

  {% task id="task-ec4db123e64f" title="Find the first error" %}
    Read the journal for the unit from the beginning. Which line explains the failure?

    {% reveal title="Show solution" %}

```console
[root@servera ~]# journalctl -u billing --no-pager | head -3
Oct 03 17:04:52 servera.lab.example.com billing.sh[788]: billing: cannot read /etc/billing.conf
Oct 03 17:04:52 servera.lab.example.com systemd[1]: Started Billing job.
Oct 03 17:04:52 servera.lab.example.com systemd[1]: billing.service: Main process exited, code=exited, status=3/NOTIMPLEMENTED
```

    The first line is the cause: the program cannot read `/etc/billing.conf`. Everything after it is a consequence.
    {% /reveal %}
  {% /task %}

  {% task id="task-2fac5c25a674" title="Make one change, then verify" %}
    The program needs a file `/etc/billing.conf` that sets `RATE=10`. Create it, reset the failed state, start the service, and verify with both the status and the journal.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# echo "RATE=10" > /etc/billing.conf
[root@servera ~]# systemctl reset-failed billing
[root@servera ~]# systemctl start billing
[root@servera ~]# systemctl is-active billing
active
[root@servera ~]# journalctl -u billing -n 2 --no-pager
Oct 03 17:04:58 servera.lab.example.com billing.sh[802]: billing: started with rate=10
Oct 03 17:04:58 servera.lab.example.com systemd[1]: Started Billing job.
```
    {% /reveal %}
  {% /task %}

  {% task id="task-999070fbb650" title="Look wider, then clean up" %}
    Check that nothing else is failing, and look at the system-wide errors of this boot.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# systemctl --failed
  UNIT LOAD ACTIVE SUB DESCRIPTION
0 loaded units listed.
[root@servera ~]# journalctl -p err -b --no-pager | tail -3
[root@servera ~]# exit
[student@servera ~]$ exit
```
    {% /reveal %}
  {% /task %}

  {% task id="task-dd17bafc70a7" title="Grade and finish" %}
    {% lab-finish exercise="sa-diagnosing" grade=true servers=true /%}
  {% /task %}
{% /lab %}
