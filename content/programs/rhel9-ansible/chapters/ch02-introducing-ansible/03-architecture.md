---
title: Core concepts and architecture
seoTitle: "Ansible Architecture: Control Node, Inventory, Modules"
description: "The parts of Ansible: control node, managed hosts, inventory, modules, plays and playbooks. Free RHCE (EX294) lesson with diagrams and practice."
kind: lesson
minutes: 10
---

{% lead %}
Every Ansible setup has the same shape: one machine that runs Ansible, many machines that it manages, and a handful of text files that connect the two. Learn these few terms well; the rest of the course builds on them.
{% /lead %}

{% objectives %}
- Name the parts of the Ansible architecture and what each is for.
- Follow what happens, step by step, when a task runs.
- Explain idempotency and why it makes playbooks safe to re-run.
{% /objectives %}

## Two kinds of machine

Ansible's architecture has only two types of machine:

- The **control node** is where Ansible is installed and run. It holds your Ansible project files: playbooks, inventory, configuration. In the course labs this is `workstation`.
- **Managed hosts** are the machines Ansible configures. They need no Ansible software, just a way for the control node to reach them.

Click any part of the map to see what it does.

{% diagram ref="architecture-map" /%}

## The vocabulary

{% glossary %}
  {% term name="Inventory" %}The list of managed hosts, organised into groups for easier collective management. Can be a static text file, or built dynamically from an external source.{% /term %}
  {% term name="Task" %}One unit of work: a call to one module with specific arguments. "Ensure httpd is installed" is a task.{% /term %}
  {% term name="Play" %}An ordered list of tasks to run against a set of hosts selected from the inventory.{% /term %}
  {% term name="Playbook" %}A YAML text file containing one or more plays, run in order.{% /term %}
  {% term name="Module" %}A small program (Python, PowerShell or another language) that implements one kind of task. Ansible ships hundreds of them; each is a tool in your toolkit.{% /term %}
  {% term name="Plug-in" %}Code that extends Ansible itself, for example to add new connection methods, inventory sources or filters.{% /term %}
{% /glossary %}

The relationship nests neatly: a **playbook** contains **plays**, a play contains **tasks**, and each task runs one **module** against the hosts that the play selected from the **inventory**.

## What happens when a task runs

When you run a playbook, the control node connects to each managed host over SSH (by default), pushes the module that the current task needs, runs it, and collects the result. Step through it:

{% diagram ref="task-lifecycle" /%}

If a task **fails** on a host, Ansible's default behaviour is to stop running the rest of the playbook *for that host* while carrying on with the hosts that succeeded. You will learn how to change that in a later chapter.

## Idempotency: safe to run twice

Modules generally do not blindly perform an action. They make sure one aspect of the machine is **in a particular state**: a file exists with certain permissions, a package is installed, a file system is mounted. If the host is already in that state, the module does nothing.

This makes tasks, plays and playbooks **idempotent**: running them again against hosts that are already correct makes no changes. Try it: run the playbook twice, then cause some drift and run it again.

{% idempotency-demo ref="idempotency-demo" /%}

{% callout type="exam" title="Run it twice" %}
A reliable habit for the exam: after a playbook succeeds, run it a second time. The recap should show `changed=0`. If it does not, some task is not idempotent and may cause trouble.
{% /callout %}

{% callout type="warning" title="Arbitrary commands break the promise" %}
Modules such as `ansible.builtin.command` and `ansible.builtin.shell` run whatever command you give them, and Ansible cannot know whether that command was needed. They report `changed` on every run unless you add guards. Prefer a purpose-built module whenever one exists. Chapter 3 shows how.
{% /callout %}

## Agentless, again

When an administrator runs a playbook, the control node connects to managed hosts using SSH (or WinRM for Windows). You never need an Ansible-specific agent on the hosts, and you never need to open any extra communication channels between the control node and the hosts beyond what SSH already uses.

{% quiz
  objectives=["ch02.architecture"]
  title="Check your understanding"
  id="check"
  ref="check" /%}

## Takeaway

Name the parts of the Ansible architecture and what each is for. Use the chapter lab to check this on a real host.
