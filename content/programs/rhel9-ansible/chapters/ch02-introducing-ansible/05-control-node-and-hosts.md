---
title: Preparing the control node and managed hosts
seoTitle: "Install Ansible and Prepare Managed Hosts"
description: "Install ansible-core on the control node and prepare managed hosts with SSH keys and sudo. Free RHCE (EX294) lesson with diagrams and practice."
kind: lesson
minutes: 8
---

{% lead %}
Only the control node needs Ansible software. Managed hosts just need to be reachable and to meet a few small requirements, which differ for Linux, Windows and network devices.
{% /lead %}

{% objectives %}
- Install automation content navigator on a RHEL 9 control node.
- Log in to a container registry and download an execution environment.
- List what Linux, Windows and network managed hosts need.
{% /objectives %}

## Preparing the control node

To run playbooks you install **automation content navigator** (`ansible-navigator`) on the control node and download an execution environment for it to use. Before you start, the control node needs:

- **Python 3.8 or later**, required by the `ansible-core` package that navigator depends on.
- A valid **Red Hat Ansible Automation Platform subscription**, to install navigator from Red Hat's repositories. If your organisation uses Simple Content Access, you do not need to attach the subscription to the system.

Here is how the pieces fit together at run time:

{% diagram ref="navigator-runtime" /%}

### Installation, step by step

{% steps %}
  {% step title="Enable the repository (production systems only)" %}
    On a registered system, enable the Automation Platform repository. Classroom machines are already configured.

```console
[user@controlnode ~]$ sudo subscription-manager repos \
> --enable ansible-automation-platform-2.2-for-rhel-9-x86_64-rpms
```
  {% /step %}
  {% step title="Install automation content navigator" %}

```console
[user@controlnode ~]$ sudo dnf install ansible-navigator
```
  {% /step %}
  {% step title="Check that it works" %}

```console
[user@controlnode ~]$ ansible-navigator --version
ansible-navigator 2.1.0
```
  {% /step %}
  {% step title="Log in to the container registry" %}
    Execution environment images come from a registry, such as `registry.redhat.io` or a private automation hub.

```console
[user@controlnode ~]$ podman login registry.redhat.io
Username: your-registry-username
Password: your-registry-password
Login Succeeded!
```
  {% /step %}
  {% step title="Download an execution environment" %}
    Pull the image you plan to use. Navigator can also pull its default image automatically the first time it runs.

```console
[user@controlnode ~]$ podman pull \
> registry.redhat.io/ansible-automation-platform-22/ee-supported-rhel8:latest
```
  {% /step %}
  {% step title="Confirm the image is available" %}

```console
[user@controlnode ~]$ ansible-navigator images
  Image                 Tag      Execution environment   Created       Size
0│ee-supported-rhel8    latest   True                    5 weeks ago   1.32 GB
```

    This opens navigator's interactive mode. Press {% kbd %}Esc{% /kbd %} to leave it.
  {% /step %}
{% /steps %}

{% variant name="homelab" title="On the home lab this is already done, a little differently" %}
Rocky Linux has no `ansible-navigator` RPM and no access to Red Hat's registry, so [section 1.6](#/ch01/control-node) installs the pieces another way:

| Classroom | Home lab |
| --- | --- |
| `sudo dnf install ansible-navigator` | `ansible-core` 2.14 from Rocky's repositories, and navigator from `pip` in its own virtual environment |
| `podman login` and an execution environment image | No login and no image: navigator is configured with the execution environment switched off, and runs workstation's own `ansible-core` |
| Collections come inside the execution environment | `ansible.posix` and `community.general` are installed in `/usr/share/ansible/collections` |

Every `ansible-navigator` command in this guide works the same either way. To see the container workflow once, run `ansible-navigator images --ee true`: it pulls the free community image.
{% /variant %}

{% callout type="note" title="What about ansible-playbook?" %}
If you need the classic `ansible-playbook` command, which uses the control node itself as the execution environment (no containers), install the `ansible-core` package too:

```console
[user@controlnode ~]$ sudo dnf install ansible-core
```

`ansible-navigator` generally gives a better development experience, and playbooks developed with it move more easily to automation controller later.
{% /callout %}

{% callout type="exam" title="Know both command families" %}
The course teaches `ansible-navigator`, but you will meet `ansible-playbook`, `ansible-doc` and `ansible-inventory` in documentation and older playbooks. They take almost the same options. Practise with whichever tools your exam environment provides, and read the exam's instructions carefully on the day.
{% /callout %}

## Preparing managed hosts

Managed hosts need no agent. The control node reaches them with a standard protocol and makes sure they are in the specified state. What they *do* need depends on the platform.

{% cards cols=3 %}
  {% card kicker="Most common" title="Linux and UNIX" tone="green" %}
    - **Python 3.8 or later** for most modules. On RHEL 8 you can rely on `platform-python`, or enable the `python38` stream.
    - If SELinux is enabled, **`python3-libselinux`** for file, copy and template tasks.
    - **SSH access**, and if you connect as a regular user, a way to become root, usually **sudo**.
  {% /card %}
  {% card kicker="ansible.windows" title="Microsoft Windows" tone="blue" %}
    - **PowerShell 3.0 or later** instead of Python.
    - **.NET Framework 4.0 or later**.
    - **PowerShell remoting (WinRM)** configured.

    The course uses Linux hosts only; see the Ansible Windows guides for more.
  {% /card %}
  {% card kicker="Routers and switches" title="Network devices" tone="gray" %}
    Most devices cannot run Python, so network modules **run on the control node** and talk to the device through:
    - CLI over SSH
    - XML over SSH
    - an API over HTTP(S)

    Supported platforms include Cisco IOS, IOS XR and NX-OS, Juniper Junos, Arista EOS and VyOS.
  {% /card %}
{% /cards %}

{% callout type="tip" title="Modules can have their own requirements" %}
Some modules need extra packages on the managed host. For example `ansible.builtin.dnf` needs the `python3-dnf` package. If the base Python pieces are present, you can use Ansible itself (for example `ansible.builtin.dnf`) to install what else is missing.
{% /callout %}

## Building your own practice lab

If you do not have the Red Hat classroom, you can recreate the essentials with virtual machines:

1. One RHEL 9 VM as the control node, called `workstation`, and two to four RHEL 9 VMs as managed hosts, called `servera`, `serverb` and so on. A free Red Hat Developer subscription covers personal use.
2. Name resolution between them, through DNS or `/etc/hosts`.
3. A user on each managed host that the control node can SSH to with a key and that can use `sudo`. You will set this up properly in chapter 3.

{% quiz
  objectives=["ch02.runtime"]
  id="check"
  ref="check" /%}

## Takeaway

Install automation content navigator on a RHEL 9 control node. Use the chapter lab to check this on a real host.
