---
title: Managing software
seoTitle: "Manage Packages and Repositories With Ansible (dnf)"
description: "Install packages, add repositories and register systems with Ansible dnf and related modules. Free RHCE (EX294) lesson with diagrams and practice."
kind: lesson
minutes: 12
---

{% lead %}
Almost every playbook installs something. Ansible's package modules install, update and remove software, configure the repositories it comes from, and report what is already there, so a play can make decisions based on it.
{% /lead %}

{% objectives %}
- Install, update and remove packages and package groups with `ansible.builtin.dnf`.
- Configure a repository and its signing key.
- Collect the installed-package list with `package_facts` and use it.
{% /objectives %}

## The module for every administration job

This chapter covers five areas. Use this as a map as you go; each section explains one area in depth.

{% admin-module-finder ref="admin-module-finder" /%}

## Installing and removing packages

`ansible.builtin.dnf` takes a package name, or a list, and the state you want:

```yaml
- name: Web packages are installed
  ansible.builtin.dnf:
    name:
      - httpd
      - mod_ssl
    state: present
```

| `state` | Result |
| --- | --- |
| `present` (default) | Installed; left alone if it already is |
| `latest` | Installed and updated to the newest available version |
| `absent` | Removed |

Give `name` a list rather than looping: `dnf` then resolves everything in one transaction, which is much faster.

A few more forms of `name`:

| `name:` | Means |
| --- | --- |
| `httpd` | The package |
| `"@Development Tools"` | A package group (quote it: `@` is special in YAML) |
| `"*"` with `state: latest` | Update every package on the host |
| `"@perl:5.26/minimal"` | A module stream and profile; leave out `/profile` for the stream's default |
| `https://…/tool-1.0.rpm` or a local path | An RPM file |

{% callout type="note" title="ansible.builtin.package" %}
`ansible.builtin.package` calls whichever package manager the host uses, so one task works on RHEL and on Debian. It only supports the options all managers share. On RHEL, `dnf` gives you everything.
{% /callout %}

{% callout type="tip" title="Read the module's documentation" %}
`ansible-navigator doc ansible.builtin.dnf -m stdout` lists every option, with examples at the end.
{% /callout %}

## Registering a system

A RHEL host needs a subscription before it can install from Red Hat's repositories. Two modules from `community.general` handle it: `redhat_subscription` registers the host (and attaches a subscription pool), and `rhsm_repository` enables repositories.

```yaml
- name: Register and subscribe the system
  community.general.redhat_subscription:
    username: yourusername
    password: yourpassword
    pool_ids: poolID
    state: present

- name: Enable Red Hat repositories
  community.general.rhsm_repository:
    name:
      - rhel-9-for-x86_64-baseos-rpms
      - rhel-9-for-x86_64-appstream-rpms
    state: present
```

`state: absent` unregisters the host. These are community modules, not supported by Red Hat; running `subscription-manager` through `ansible.builtin.command` is the alternative.

{% variant name="homelab" %}
Rocky Linux needs no subscription: its BaseOS and AppStream repositories are enabled from the start. Skip registration in the home lab.
{% /variant %}

## Repositories and signing keys

Packages come from repositories defined in `/etc/yum.repos.d/`. `ansible.builtin.yum_repository` writes those files:

```yaml
- name: The CRB repository is configured
  ansible.builtin.yum_repository:
    name: lab-crb
    description: Rocky Linux 9 CRB (lab)
    mirrorlist: https://mirrors.rockylinux.org/mirrorlist?arch=$basearch&repo=CRB-$releasever
    gpgcheck: true
    gpgkey: file:///etc/pki/rpm-gpg/RPM-GPG-KEY-Rocky-9
    enabled: true
```

The result on the host:

```ini {% title="/etc/yum.repos.d/lab-crb.repo" %}
[lab-crb]
enabled = 1
gpgcheck = 1
gpgkey = file:///etc/pki/rpm-gpg/RPM-GPG-KEY-Rocky-9
mirrorlist = https://mirrors.rockylinux.org/mirrorlist?arch=$basearch&repo=CRB-$releasever
name = Rocky Linux 9 CRB (lab)
```

Use `baseurl` for a single server, or `mirrorlist` or `metalink` for a list of mirrors. Always keep `gpgcheck: true`: it makes `dnf` refuse packages that were not signed by the key you trust. Import that key with `ansible.builtin.rpm_key`, from a local file or a URL:

```yaml
- name: The Rocky Linux signing key is trusted
  ansible.builtin.rpm_key:
    key: /etc/pki/rpm-gpg/RPM-GPG-KEY-Rocky-9
    state: present
```

{% variant name="homelab" title="Why not EPEL?" %}
EPEL is the usual example of an extra repository, but its metadata is large. On the 1 GiB lab VMs, `dnf` runs out of memory reading it and the kernel stops it. In Ansible that shows up as `MODULE FAILURE … Shared connection to servera.lab.example.com closed.`, and the kernel log on the host says `Out of memory: Killed process … (python3)`. The exercises use Rocky's own CRB repository instead. The technique is identical.
{% /variant %}

{% variant-group %}
  {% variant name="classroom" %}
    On RHEL, repositories usually come from a Red Hat subscription. The `community.general.redhat_subscription` module registers a host, and `community.general.rhsm_repository` enables or disables subscription repositories by name.
  {% /variant %}
  {% variant name="homelab" %}
    Rocky Linux has no subscriptions: its repositories (BaseOS, AppStream, CRB, extras) are defined by the `rocky-repos` package and are free to use. The subscription modules do not apply at home.
  {% /variant %}
{% /variant-group %}

## What is installed?

`ansible.builtin.package_facts` adds every installed package to the facts, as a dictionary keyed by name. Each value is a list, because several versions of one package (such as kernels) can be installed at once.

```yaml
- name: Collect the list of installed packages
  ansible.builtin.package_facts:
    manager: auto

- name: Show the version
  ansible.builtin.debug:
    msg: "lynx {{ ansible_facts['packages']['lynx'][0]['version'] }}"
  when: "'lynx' in ansible_facts['packages']"
```

A condition such as `when: "'httpd' in ansible_facts['packages']"` lets a play act only on hosts that have a package, without trying to install it.

{% quiz
  objectives=["ch10.software"]
  id="check"
  title="Check your understanding"
  ref="check" /%}

## Takeaway

Install, update and remove packages and package groups with `ansible.builtin.dnf`. Use the chapter lab to check this on a real host.
