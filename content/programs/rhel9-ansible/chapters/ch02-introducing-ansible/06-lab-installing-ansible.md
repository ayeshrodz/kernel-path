---
title: "Exercise: Installing Ansible"
seoTitle: "Installing Ansible (RHCE Practice Exercise)"
description: "Hands-on RHCE practice: installing Ansible. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 15
---

{% lead %}
In this exercise you turn `workstation` into a working control node: install automation content navigator, log in to the classroom registry, and download the execution environment that later chapters use.
{% /lead %}

{% lab
  objectives=["ch02.automation","ch02.architecture","ch02.distributions","ch02.runtime"]
  id="install"
  title="Installing Ansible"
  exercise="intro-install"
  starter=false
  hosts=["workstation","utility.lab.example.com"]
  outcomes=["Install automation content navigator on a control node.","Download an execution environment image and list it."] %}
{% lab-notes %}

**Prerequisites:** For the free home path, complete [control-node setup](#/ch01/control-node). Classroom-only registry steps require credentials supplied by that classroom.

{% reveal title="Verify your work" %}

From the project directory, run the relevant home-lab check. For an exercise with several checkpoints, grade each state before changing or removing it:

```bash
lab grade intro-install
```

The grader reads project files and host state. A passing report covers the listed checks; also perform the task’s independent connection, repeat-run, and reboot checks where requested.

{% /reveal %}

{% reveal title="Try an independent variation" %}

Explain how you would identify a missing collection inside an execution image when it is installed on workstation.

Record the published result first. The grader checks the original requirements, so a changed name or value may intentionally fail those checks.

{% /reveal %}

{% /lab-notes %}

{% lab-challenge %}

Make workstation ready to run and inspect Ansible content.

- Navigator must start and report its version.
- At home, use the community tools installed in chapter 1 and confirm that runs use workstation's Ansible engine. No registry account is required.
- If using the classroom environment, its assigned execution image must be available locally and the registry login must succeed.
- Record which engine and runtime you will use before starting chapter 3.

{% /lab-challenge %}

  {% lab-setup variant="homelab" %}
    There is nothing to download for this exercise. Workstation already has everything from [section 1.6](#/ch01/control-node); each task below shows what to run at home to confirm it.
  {% /lab-setup %}

  {% task id="task-6430c82812af" legacyIndex=1 title="Install the ansible-navigator package" %}
    As the `student` user on `workstation`, install automation content navigator.

    {% variant-group %}
      {% variant name="classroom" %}

```console
[student@workstation ~]$ sudo dnf install ansible-navigator
[sudo] password for student: student
...output omitted...
Is this ok [y/d/N]: y
...output omitted...
```
      {% /variant %}
      {% variant name="homelab" %}
        You installed it in section 1.6, from `pip` into a virtual environment, because Rocky Linux has no RPM for it. Confirm where it lives and which Ansible it will run:

```console
[student@workstation ~]$ which ansible-navigator ansible
~/.local/bin/ansible-navigator
/usr/bin/ansible
[student@workstation ~]$ rpm -q ansible-core
ansible-core-2.14.18-3.el9_8.1.x86_64
```
      {% /variant %}
    {% /variant-group %}

    {% callout type="note" title="Why no repository step?" %}
    The classroom already has the right package repository configured. On a production system you would first register it with `subscription-manager` and enable `ansible-automation-platform-2.2-for-rhel-9-x86_64-rpms`.
    {% /callout %}
  {% /task %}

  {% task id="task-f58235ab694f" legacyIndex=2 title="Verify the installation" %}

    {% variant-group %}
      {% variant name="classroom" %}

```console
[student@workstation ~]$ ansible-navigator --version
ansible-navigator 2.1.0
```
      {% /variant %}
      {% variant name="homelab" %}

```console
[student@workstation ~]$ ansible-navigator --version
ansible-navigator 26.9.0
[student@workstation ~]$ ansible --version | head -1
ansible [core 2.14.18]
```

        Navigator is newer than the classroom version, but it drives the same `ansible-core` generation as RHEL 9.
      {% /variant %}
    {% /variant-group %}
  {% /task %}

  {% task id="task-5a8c1e6d0ebe" legacyIndex=3 title="Log in to the classroom registry" %}
    {% variant-group %}
      {% variant name="classroom" %}
        The classroom's private automation hub runs on `utility.lab.example.com`. Log in with username `admin` and password `redhat`.

```console
[student@workstation ~]$ podman login utility.lab.example.com
Username: admin
Password: redhat
Login Succeeded!
```
      {% /variant %}
      {% variant name="homelab" %}
        Skip this task. There is no private automation hub at home (`utility` only serves practice files), and Red Hat's registry needs a subscription. Navigator is configured not to need an image at all:

```console
[student@workstation ~]$ cat ~/.ansible-navigator.yml
---
ansible-navigator:
  mode: stdout
  playbook-artifact:
    enable: false
  execution-environment:
    enabled: false
```
      {% /variant %}
    {% /variant-group %}
  {% /task %}

  {% task id="task-f1143d189e35" legacyIndex=4 title="Download the execution environment" %}
    {% variant name="homelab" title="Optional at home" %}
    With the execution environment switched off there is nothing to download. To try the container workflow anyway, run `ansible-navigator images --ee true -m interactive`: navigator pulls the free community image (about 1.5 GB) and shows the same list. That image carries a much newer `ansible-core`, so keep using the default, container-free setup for the exercises.
    {% /variant %}

    Run `ansible-navigator images`. Navigator notices the image is missing, pulls it, and then lists the images it can use.

```console
[student@workstation ~]$ ansible-navigator images
...output omitted...
Running the command: podman pull utility.lab.example.com/ee-supported-rhel8:latest
...output omitted...
```

    Once the download finishes, navigator shows the list in interactive mode:

```text
  Image                 Tag      Execution environment   Created       Size
0│ee-supported-rhel8    latest   True                    5 weeks ago   1.32 GB

^b/PgUp page up   ^f/PgDn page down   ↑↓ scroll   esc back   [0-9] goto   :help help
```

    Type `:0` to inspect the image (its Ansible version, collections and Python packages), then press {% kbd %}Esc{% /kbd %} until you are back at the shell.
  {% /task %}

  {% task id="task-6d4b803445b8" legacyIndex=5 title="Finish" %}
    {% variant-group %}
      {% variant name="classroom" %}
        Clean up so this exercise does not affect later ones: `lab finish intro-install`.
      {% /variant %}
      {% variant name="homelab" %}
        Nothing to clean up: this exercise changed nothing on the servers.
      {% /variant %}
    {% /variant-group %}
  {% /task %}
{% /lab %}

## What just happened

You now have the two things every later exercise relies on: the `ansible-navigator` command, and a local copy of the `ee-supported-rhel8` execution environment. When you run a playbook, navigator starts that image with Podman, mounts your project directory into it, and runs Ansible from inside the container.

{% variant name="homelab" %}
At home, navigator skips the container and runs `/usr/bin/ansible-playbook` directly on workstation. The playbooks, the output and the results on the managed hosts are the same; only where Ansible itself runs differs. One practical consequence: `localhost` in a play is workstation itself, not a container.
{% /variant %}

{% callout type="tip" title="Explore the image" %}
In the images view, selecting an image lets you browse the Ansible version, the collections, and the Python packages it contains. It is a quick way to check whether a module you need is available before you write the task.
{% /callout %}
