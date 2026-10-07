---
title: How to use this review
seoTitle: "How to Prepare for the RHCE With Ansible Review Labs"
description: "How to use the review labs and assessments to check you are ready for the RHCE. Free RHCE (EX294) lesson with diagrams and practice."
kind: lesson
minutes: 12
---

{% lead %}
Everything from here on is practice. Four labs cover the whole course, each starting from a clean set of servers and a small project. Before you begin, find out where you are weak, and settle on a way of working that gets every task right the first time and proves it.
{% /lead %}

{% objectives %}
- Rate your confidence in every objective of chapters 2 to 10, and plan what to revisit.
- Follow a repeatable method for turning written requirements into a working, verified playbook.
- Find module options quickly with the documentation installed on the control node.
- Reset the lab between attempts so that every run starts clean.
{% /objectives %}

## Where do you stand?

Go through every chapter below and rate each objective honestly. A rating of **shaky** means "I could do it with my notes open". Your ratings are saved in this browser, and the list underneath tells you which chapters to reread and which review lab exercises them.

{% readiness-checklist ref="readiness-checklist" /%}

Revisit the weak chapters first: the knowledge check at the end of each one takes ten minutes and shows quickly whether the gap is real.

## The four review labs

{% cards cols=2 %}
  {% card title="Deploying Ansible" kicker="11.2 · chapters 2–5, 9" tone="purple" %}
    Set up the control node, an inventory and the configuration; add users with a loop, install packages from a variable and on a condition, and fix a broken playbook in check mode.
  {% /card %}
  {% card title="Creating playbooks" kicker="11.3 · chapters 3–7" tone="teal" %}
    A web server from a template with a handler, a test from workstation that records failures with block and rescue, and a playbook that imports both.
  {% /card %}
  {% card title="Managing hosts" kicker="11.4 · chapters 4, 7, 8, 10" tone="amber" %}
    LVM volumes with the storage role, an administrator with a vaulted password and sudo, an address with the network role, a nightly cron job, and one playbook for all of it.
  {% /card %}
  {% card title="Creating roles" kicker="11.5 · chapters 6, 8" tone="coral" %}
    Turn a working playbook into a documented role, then apply it to two web servers.
  {% /card %}
{% /cards %}

Each lab has its own project and inventory, so read the inventory first: knowing which hosts are in which group is the first step of every task.

Chapter 9 is part of all of them: when something fails, read the message, find the stage, fix it.

## A method that works under time pressure

Most mistakes in a timed task are not about Ansible. They come from misreading a requirement, or from assuming a task worked. This loop avoids both:

{% steps %}
  {% step title="Read every requirement first" %}
    Read the whole task before you type anything. Note the exact names: users, groups, paths, modes, the hosts each part applies to. A wrong group name is a failed requirement even when the playbook runs.
  {% /step %}
  {% step title="Check the project" %}
    Make sure `ansible.cfg` points at the right inventory and user, and that `ansible-navigator inventory -m stdout --graph` shows the groups you expect. Run `ansible all -m ansible.builtin.ping` once.
  {% /step %}
  {% step title="Write one play at a time" %}
    Add a play, then `--syntax-check` it, then run it. Small steps make errors easy to place.
  {% /step %}
  {% step title="Look it up, don't guess" %}
    `ansible-doc MODULE` and its EXAMPLES section are faster than remembering option names. Copy an example and adapt it.
  {% /step %}
  {% step title="Run it twice" %}
    For these configuration tasks, expect `changed=0` on an immediate second run. Investigate repeat changes. Deliberate actions such as rebooting, restarting a service, or installing newly available updates can legitimately report changes.
  {% /step %}
  {% step title="Verify from outside" %}
    Check the result the way a user would: `curl` the page, `ssh` in and run `id`, `df`, `crontab -l`. A green recap proves only that Ansible ran.
  {% /step %}
{% /steps %}

{% callout type="important" title="Leave the work where it is asked for" %}
Files in the wrong directory, or a playbook with a different name, are easy to lose points on. Use exactly the paths and file names the task gives, and keep everything in the project directory.
{% /callout %}

## Documentation on the control node

You do not need the internet to look up a module. The documentation for every installed module and collection is on workstation:

```console
[student@workstation ~]$ ansible-doc -l | grep -i firewall
ansible.posix.firewalld                        Manage arbitrary...
ansible.posix.firewalld_info                   Gather informati...
...output omitted...
[student@workstation ~]$ ansible-doc -s ansible.posix.firewalld
...output omitted...
[student@workstation ~]$ ansible-doc ansible.builtin.user | grep -A30 '^EXAMPLES'
...output omitted...
```

| You want | Command |
| --- | --- |
| Every module, with a one-line description | `ansible-doc -l` |
| Only one collection's modules | `ansible-doc -l ansible.posix` |
| The options of a module as a task skeleton | `ansible-doc -s MODULE` |
| The full page, examples at the end | `ansible-doc MODULE` |
| Keywords you can use in a play or task | `ansible-doc -t keyword -l` |
| Filters and lookups | `ansible-doc -t filter -l`, `ansible-doc -t lookup -l` |
| The same, through navigator | `ansible-navigator doc MODULE -m stdout` |
| A system role's variables and example playbooks | `/usr/share/doc/rhel-system-roles/ROLE/` |

{% callout type="tip" title="Filter documentation" %}
`ansible-doc -t filter ansible.builtin.password_hash` shows the arguments of the filter itself. Filters are easy to forget and hard to guess.
{% /callout %}

## Starting clean

Each review lab expects servers that nobody has configured yet. Before you start a lab, and again if you want a second attempt, reset them:

{% variant-group %}
  {% variant name="classroom" %}
    Run `lab start` with the name shown at the top of each lab. Reset the servers the way your classroom provides before a second attempt.
  {% /variant %}
  {% variant name="homelab" %}
    On the Ubuntu host, `rht-vmctl reset servers` restores servera to serverd from the clean snapshot in about a minute. Then, on workstation, `lab start NAME` creates the project directory. A second `lab start` refuses to overwrite an existing project: `lab finish NAME` moves it to `~/lab-archive/` first, or `lab start NAME --force` archives it and starts again in one step.
  {% /variant %}
{% /variant-group %}

{% callout type="exam" title="Time yourself" %}
Give each lab 45 minutes with no solutions open. When time is up, run what you have and check it against the verification step. Then reset, and do it again a few days later until it takes half the time.
{% /callout %}

## Takeaway

Rate your confidence in every objective of chapters 2 to 10, and plan what to revisit. Use the chapter lab to check this on a real host.
