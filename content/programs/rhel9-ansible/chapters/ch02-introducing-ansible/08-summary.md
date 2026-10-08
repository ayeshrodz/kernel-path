---
title: "Ansible basics cheat sheet"
seoTitle: "Ansible basics Cheat Sheet (RHCE)"
description: "Ansible basics cheat sheet: the key commands and ideas on one page, with flashcards for revision. Free RHCE study notes."
kind: summary
minutes: 5
---

{% lead %}
The chapter on one page: the ideas to remember, the commands to have at your fingertips, and a deck of flashcards for quick revision.
{% /lead %}

## The chapter in eight sentences

- **Automation** reduces human error and keeps your infrastructure in a consistent, correct state.
- **Infrastructure as Code** means describing that state in readable text files kept in version control, and changing systems only by changing the code.
- **Ansible** is an open source automation platform that adapts to many workflows and environments.
- It is **agentless**: Ansible is installed only on the control node (and in its execution environments), and it reaches managed hosts over SSH or WinRM.
- **Playbooks** are human-readable YAML files describing the desired state. A playbook holds plays, a play holds tasks, and each task runs a module.
- Modules are **idempotent**: they change a host only when it differs from the desired state, so playbooks are safe to re-run.
- **Red Hat Ansible Automation Platform** is the fully supported distribution, adding certified collections, execution environments, navigator, controller and hub.
- **`ansible-navigator`** is the key tool for developing and running automation, and it runs playbooks inside an execution environment container.

## Cheat sheet

| Task | Command |
| --- | --- |
| Install navigator | `sudo dnf install ansible-navigator` |
| Install classic tools (`ansible-playbook`) | `sudo dnf install ansible-core` |
| Check the version | `ansible-navigator --version` |
| Log in to a registry | `podman login utility.lab.example.com` |
| Pull an EE by hand | `podman pull <registry>/ee-supported-rhel8:latest` |
| List available EEs | `ansible-navigator images` |
| Leave interactive mode | {% kbd %}Esc{% /kbd %} (repeat to go back further) or `:q` |

{% variant name="homelab" %}
The registry and execution environment rows are classroom-only. At home the control node was prepared in [section 1.6](#/ch01/control-node): `ansible-core` from `dnf`, navigator from `pip`, execution environment switched off.
{% /variant %}

| Managed host type | Needs |
| --- | --- |
| Linux / UNIX | SSH, Python 3.8+, sudo for the remote user, `python3-libselinux` if SELinux is on |
| Windows | WinRM, PowerShell 3.0+, .NET Framework 4.0+ |
| Network device | Nothing extra; modules run on the control node |

{% flashcards
  title="Chapter 2 flashcards"
  ref="flashcards" /%}

{% callout type="exam" title="Before you move on" %}
Make sure you can install `ansible-navigator`, log in to a registry and list an execution environment **without looking at notes**. Everything in chapter 3 assumes this works.
{% /callout %}
