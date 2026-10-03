---
title: Turn requirements into acceptance evidence
kind: lesson
minutes: 10
---

{% lead %}You can operate a system when you can connect a requirement to evidence, not merely repeat commands from one lesson.{% /lead %}

{% objectives %}
- Deliver a service with access, persistence and recovery evidence.
- Investigate one fault systematically and produce a usable handover.
{% /objectives %}

## Define the service contract

A small internal status service needs a host, an approved software source, a managed account, a readable document root, a running and enabled service, network access limited to intended callers, enforcing SELinux, persistent logs, time context, and a recoverable copy of its data. Write each condition before beginning work.

Use the earlier chapters as references: [identity](#/ch06/accounts-and-groups), [permissions](#/ch07/changing-permissions), [service state](#/ch09/service-state), [time and logs](#/ch11/journals-and-logs), [packages](#/ch13/dnf-and-rpm), [restore testing](#/ch14/archives-and-checksums), [SELinux](#/ch16/selinux-model), and [firewall](#/ch20/firewalld-model). If a step is unclear, return to its model rather than copying an unexplained command.

## Four kinds of proof

- Configuration shows saved intent: a unit file, context mapping, rule or fstab entry.
- Live inspection shows current state: a process, mount, address or effective policy.
- A client operation shows useful behavior: an HTTP body, actual file read or permitted login.
- Lifecycle testing shows retention: the same useful operation after reload, logout, restart or reboot.

Each kind has limits. An active web daemon does not prove correct content. A local HTTP grader does not prove remote firewall access. A restored file does not prove the application can read its label. A written observation describes your work but is not independent machine verification.

## Repeat with changed constraints

After recording the published exercise result, change one requirement: move a document root, add a read-only reviewer, use a different allowed source, or recover from a changed data file. Predict which layers must change and verify them individually. This variation tests the model rather than memorization of fixture names.

Keep the project and evidence organized. Use version control for non-secret configuration when appropriate, and include a short decision note for tradeoffs. Stop to inspect an unexpected mount or identity instead of overriding it to make a command succeed.

## Explore the model

{% flow-map ref="model" title="Review and practice: relationships" caption="Select each part to read its role." /%}


## Check your understanding

{% quiz id="quick" objectives=["ch22.operations", "ch22.verification"] ref="quick" /%}


## Documentation

- [RHEL documentation index](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9)
