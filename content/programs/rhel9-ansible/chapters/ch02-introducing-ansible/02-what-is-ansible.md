---
title: What Ansible is
seoTitle: "What Is Ansible? Agentless Automation Explained"
description: "Ansible in plain words: agentless, SSH-based, declarative tasks and modules. Free RHCE (EX294) lesson with diagrams and practice."
kind: lesson
minutes: 7
---

{% lead %}
Ansible is an open source automation platform. It is two things at once: a simple **automation language** for describing infrastructure in files called playbooks, and an **automation engine** that runs those playbooks.
{% /lead %}

{% objectives %}
- Describe what makes Ansible simple, powerful and agentless.
- List Ansible's main strengths and typical use cases.
- Explain the design goals behind "the Ansible way".
{% /objectives %}

## Three properties that define Ansible

{% cards cols=3 %}
  {% card title="Simple" tone="teal" %}
    Playbooks are readable text. You do not need to be a programmer to write one, and tasks run in the order they are written, so a playbook reads like a procedure.
  {% /card %}
  {% card title="Powerful" tone="purple" %}
    The same tool handles configuration management, application deployment, workflow automation and network automation, and can orchestrate a whole application lifecycle.
  {% /card %}
  {% card title="Agentless" tone="coral" %}
    Nothing to install on managed hosts. Ansible connects over OpenSSH (Linux) or WinRM (Windows), pushes small programs, runs them, and cleans up.
  {% /card %}
{% /cards %}

The agentless design matters more than it first appears. Because there is no agent to install, approve, patch or secure on every host, you can start automating immediately, and there is less infrastructure to attack or maintain.

{% callout type="exam" %}
If a question asks which term best describes Ansible's architecture, the answer is **agentless**. Its default transport for Linux hosts is **SSH**.
{% /callout %}

## Strengths worth knowing

- **Cross-platform.** Linux, Windows, UNIX and network devices, on physical, virtual, cloud and container platforms.
- **Human-readable automation.** Playbooks are YAML text files that anyone on the team can read.
- **Precise descriptions.** Every aspect of an environment can be described, and therefore documented, in a playbook.
- **Version-control friendly.** Playbooks and projects are plain text, so they live happily in Git.
- **Dynamic inventories.** The list of managed hosts can be pulled live from external sources such as a cloud provider or Red Hat Satellite.
- **Orchestration.** Ansible integrates with other tools you already run (Jenkins, Puppet, Satellite, HP SA and so on).

## The language of DevOps

Communication is at the heart of DevOps. Because a playbook can be read by developers, testers, operators, managers and outside contractors alike, it becomes a shared language across the whole application lifecycle.

{% diagram ref="dev-ops-lifecycle" /%}

## The Ansible way

Ansible was designed around a few goals. Keep them in mind when you write your own playbooks; they explain a lot of Ansible's behaviour.

{% steps %}
  {% step title="Complexity kills productivity" %}
    Simpler is better. Ansible's tools are deliberately simple to use, and your automation should be simple to read and write too. Strive for the plainest playbook that does the job.
  {% /step %}
  {% step title="Optimise for readability" %}
    Well-written playbooks document your workflow. A reader should be able to tell what a play does without running it.
  {% /step %}
  {% step title="Think declaratively" %}
    Ansible is a **desired-state engine**. You describe the state you want (the package *is installed*, the service *is running*) rather than the commands to get there. Ansible makes only the changes needed to reach that state. Treating Ansible as a scripting language fights its design.
  {% /step %}
{% /steps %}

{% columns %}
  {% column title="Imperative: a script" tone="red" %}

```bash
dnf install -y httpd
systemctl start httpd
systemctl enable httpd
```

Runs every command every time, whether or not it is needed.

  {% /column %}
  {% column title="Declarative: a playbook" tone="green" %}

```yaml
- ansible.builtin.dnf:
    name: httpd
    state: present
- ansible.builtin.service:
    name: httpd
    state: started
    enabled: true
```

States the goal. Changes only what is not already true.

  {% /column %}
{% /columns %}

## What people use Ansible for

Ansible combines several kinds of automation that other tools often split apart:

{% glossary %}
  {% term name="Configuration management" %}Centralising configuration files and settings and deploying them consistently. This is how most people meet Ansible first.{% /term %}
  {% term name="Application deployment" %}Defining an application in playbooks and deploying it through every environment, from development to production.{% /term %}
  {% term name="Provisioning" %}Bringing up systems: PXE-booting and kickstarting bare metal, or creating VMs and cloud instances from templates.{% /term %}
  {% term name="Continuous delivery" %}Driving CI/CD pipelines, so applications stay correctly deployed through their whole lifecycle.{% /term %}
  {% term name="Security and compliance" %}Scanning for and remediating security issues as part of normal automation rather than as an afterthought.{% /term %}
  {% term name="Orchestration" %}Coordinating how many separate configurations interact, so the environment is managed as one whole.{% /term %}
{% /glossary %}

{% quiz
  objectives=["ch02.automation","ch02.architecture","ch02.distributions","ch02.runtime"]
  id="check"
  ref="check" /%}

## Takeaway

Describe what makes Ansible simple, powerful and agentless. Use the chapter lab to check this on a real host.
