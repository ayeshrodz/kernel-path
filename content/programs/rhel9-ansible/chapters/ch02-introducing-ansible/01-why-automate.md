---
title: Why automate Linux administration
seoTitle: "Why Automate Linux Administration With Ansible"
description: "What automation solves, idempotence and why teams move from scripts to Ansible. Free RHCE (EX294) lesson with diagrams and practice."
kind: lesson
minutes: 6
---

{% lead %}
For years, Linux administration has meant logging in to servers and changing them by hand, working from a checklist or from memory. That works for one machine. It breaks down at ten, and it is hopeless at a thousand.
{% /lead %}

{% objectives %}
- Explain why manual administration causes errors and configuration drift.
- Describe Infrastructure as Code and why it pairs so well with version control.
- Recognise the habits that make automation reduce risk rather than add it.
{% /objectives %}

If SSH, sudo, services, or permissions are new to you, try the short [Linux readiness check](#/ch02/linux-readiness) before starting system labs.

## The trouble with doing it by hand

Most administration has traditionally happened through a terminal or a GUI, one server at a time. The procedure lives in a runbook, a wiki page, or someone's head. Three things go wrong with that approach:

- **Steps get skipped.** A tired admin misses step 7 of 12 on one server out of twenty. Nobody notices until something breaks.
- **Verification is weak.** Checking that each step worked, on each machine, is tedious, so it is often skipped too.
- **Servers drift apart.** Machines that are meant to be identical slowly become different in small ways (a package version here, a config tweak there). That makes problems harder to reproduce and fixes harder to trust.

{% diagram ref="manual-vs-code" /%}

**Automation** addresses all three. You describe the work once, and a tool performs it the same way on every system, every time. That frees you from repetitive tasks, lets you roll out changes faster, and gives you time for work that actually needs a human.

## Infrastructure as Code

A good automation system lets you practise **Infrastructure as Code (IaC)**: you describe the state your infrastructure *should* be in, using a machine-readable language, and the tool makes reality match the description.

Two properties make this powerful:

{% cards %}
  {% card title="It is plain text" tone="purple" %}
    Text files go into version control (Git). Every change is recorded, reviewable and reversible. To roll back, check out the last known-good version and apply it again.
  {% /card %}
  {% card title="Humans can read it" tone="teal" %}
    A good IaC language is readable by people, not only by machines. Anyone on the team can understand what a change does before it is applied.
  {% /card %}
{% /cards %}

This is also the foundation of **DevOps** practice: developers describe the environment their application needs in code, operators review that code, and the same automation applies it reliably in every environment.

## Automation reduces human error, if you let it

Moving to IaC changes how you work. The rule is simple:

{% callout type="important" title="Change the code, not the server" %}
Once a system is managed by automation, make changes by editing the automation and re-running it. If you change a server by hand, the next automation run may silently undo your change, or your change will be lost the next time the server is rebuilt.
{% /callout %}

With every change flowing through code, you can add the safety nets software teams already use:

- **Code review** by colleagues before a change is applied.
- **Peer review by subject matter experts**, for example the database team reviewing database changes.
- **Documentation inside the automation**, so the procedure and its explanation live side by side.

The end goal is that *all* changes to your infrastructure happen through automation. That is what makes the environment consistent, auditable and predictable.

{% quiz
  objectives=["ch02.automation"]
  id="check"
  ref="check" /%}

## Key terms

{% glossary %}
  {% term name="Configuration drift" %}Gradual, unplanned differences between systems that should be identical.{% /term %}
  {% term name="Infrastructure as Code" %}Describing the desired state of infrastructure in machine-readable, human-readable text files, and applying them with a tool.{% /term %}
  {% term name="Desired state" %}What the system should look like when automation has finished, rather than the steps to get there.{% /term %}
{% /glossary %}

## Takeaway

Explain why manual administration causes errors and configuration drift. Use the chapter lab to check this on a real host.
