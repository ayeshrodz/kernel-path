---
title: Getting roles and modules from collections
seoTitle: "Ansible Collections Tutorial: Install and Use"
description: "Install collections with ansible-galaxy and use their roles and modules with FQCNs. Free RHCE (EX294) lesson with diagrams and practice."
kind: lesson
minutes: 12
---

{% lead %}
Every module name you have typed so far has three parts, such as `ansible.posix.firewalld`. The first two name a collection: a versioned package of modules, roles and plug-ins. Collections are how almost all Ansible content is distributed, so installing and pinning them is an everyday skill.
{% /lead %}

{% objectives %}
- Read a fully qualified collection name and say where its content lives.
- Install collections for a project, from a requirements file, with pinned versions.
- Check which collections Ansible can see, and read a module's documentation.
- Recognise and fix the two common errors: a missing collection and a missing Python library.
{% /objectives %}

## What a collection is

`ansible-core` itself contains only the essentials, in the built-in collection `ansible.builtin`. Everything else (firewalld, LVM, SELinux tools, cloud providers, network devices) lives in separate **collections**, each released on its own schedule by whoever maintains it.

A collection can contain modules, roles, plug-ins such as filters, and documentation. You refer to anything inside it by its **fully qualified collection name**, the FQCN:

{% fqcn-explorer ref="fqcn-explorer" /%}

Using the full name in every task means a playbook says exactly which module it wants, and keeps working when two collections each have a module called, say, `user`.

The first part of the name, the **namespace**, tells you who maintains it: `community.*` collections (`community.general`, `community.crypto`, `community.mysql`) come from the Ansible community, `redhat.*` (`redhat.rhel_system_roles`, `redhat.insights`, `redhat.satellite`) from Red Hat, and vendors publish their own (`cisco.ios`, `amazon.aws`). Splitting content this way lets each vendor release updates on its own schedule, and lets you install only what a project needs, at the versions it needs.

## Where collections come from

| Source | What it offers |
| --- | --- |
| **Automation hub** (console.redhat.com) | Red Hat Certified collections, supported by Red Hat and its partners; needs a subscription |
| **Private automation hub** | An organisation's own server, with its approved collections and its own |
| **Ansible Galaxy** (galaxy.ansible.com) | Community collections, without support |
| A **Git repository** or an **archive** | A collection built and published by anyone |
| The **execution environment** | Collections already inside the container image, such as `ansible.builtin` and a supported set |

{% callout type="note" title="Short names and the collections keyword" %}
A play can list collections under a `collections:` keyword so that tasks may use short module names. It saves typing and costs clarity. Write the full name; it is what `ansible-navigator doc` and error messages use.
{% /callout %}

## Which collections can Ansible see?

```console
[student@workstation project]$ ansible-galaxy collection list

# /usr/share/ansible/collections/ansible_collections
Collection               Version
------------------------ -------
ansible.posix            1.5.4
community.general        9.5.13
redhat.rhel_system_roles 1.120.5
```

Ansible searches the directories of the **`collections_path`** setting in order, and the first copy of a collection it finds wins. A project usually puts its own directory first:

```ini {% title="ansible.cfg" %}
[defaults]
collections_path = ./collections:~/.ansible/collections:/usr/share/ansible/collections
```

Remember from chapter 1 that this setting **replaces** the default list. Leave the system directory off and the collections installed there disappear from view.

{% variant-group %}
  {% variant name="classroom" %}
    In a classroom that uses an execution environment, most collections come inside the container image. `ansible-navigator collections` lists what the image contains.
  {% /variant %}
  {% variant name="homelab" %}
    The home lab runs without an execution environment, so every collection is a directory on workstation. Section 1.6 put `ansible.posix` and `community.general` in `/usr/share/ansible/collections`; a project's own go in `./collections`.
  {% /variant %}
{% /variant-group %}

## Installing collections

`ansible-galaxy collection install` downloads a collection and its dependencies. `-p collections` installs into the project.

```console
[student@workstation project]$ ansible-galaxy collection install community.crypto:2.26.0 -p collections
```

The source can be:

| Source | Example |
| --- | --- |
| A name on Ansible Galaxy, with a version | `community.crypto:2.26.0` |
| An archive on disk | `./community-crypto-2.26.0.tar.gz` |
| An archive at a URL | `http://utility.lab.example.com/files/ansible-posix-1.5.4.tar.gz` |
| A Git repository | `git+https://git.example.com/ops/acme.tools.git,v1.0` |

A Git repository must contain a `galaxy.yml` or a `MANIFEST.json` at its top level, which is how `ansible-galaxy` recognises it as a collection.

{% callout type="important" title="Always use -p collections for a project" %}
Without `-p`, the collection goes into the first directory of `collections_path`, `~/.ansible/collections` by default. An execution environment cannot see that directory. If `-p` names a directory that is not in `collections_path`, `ansible-galaxy` warns that the collection will not be picked up; a `collections` directory next to the playbook is found anyway, so for a project that warning can be ignored.
{% /callout %}

### Pin the version

A collection declares which versions of `ansible-core` it supports. The newest release of a collection often needs a newer `ansible-core` than RHEL 9 provides, and Ansible then refuses to load it. Decide on a version that supports your `ansible-core`, and write it down.

### The requirements file

As with roles, record what a project needs. For collections the list sits under a `collections:` key:

```yaml {% title="collections/requirements.yml" %}
---
collections:
  - name: community.crypto
    version: 2.26.0

  - name: http://utility.lab.example.com/files/ansible-posix-1.5.4.tar.gz
```

```console
[student@workstation project]$ ansible-galaxy collection install -r collections/requirements.yml -p collections
...output omitted...
community.crypto:2.26.0 was installed successfully
```

One file may hold both a `roles:` and a `collections:` list. `ansible-galaxy collection install -r` installs the collections from it; `ansible-galaxy role install -r` installs the roles.

Automation controller installs `collections/requirements.yml` for you before each run, just as it does for roles.

### Other content servers

By default `ansible-galaxy` downloads from the public Ansible Galaxy site. To use automation hub, a private automation hub, or several servers in order, list them in a `[galaxy]` section of `ansible.cfg`, with one section per server:

```ini {% title="ansible.cfg" %}
[galaxy]
server_list = automation_hub, galaxy

[galaxy_server.automation_hub]
url=https://console.redhat.com/api/automation-hub/
auth_url=https://sso.redhat.com/auth/realms/redhat-external/protocol/openid-connect/token
token=eyJh...Jf0o

[galaxy_server.galaxy]
url=https://galaxy.ansible.com/
```

`ansible-galaxy` tries the servers in the order of `server_list`. The token for automation hub comes from its web console. A token is a password: rather than committing it in `ansible.cfg`, set it in the environment, with a variable named after the server:

```console
[student@workstation project]$ export ANSIBLE_GALAXY_SERVER_AUTOMATION_HUB_TOKEN='eyJh...Jf0o'
```

## Using what you installed

Nothing else is needed: use the full name in a task.

```yaml
- name: The private key exists
  community.crypto.openssl_privatekey:
    path: /etc/pki/tls/private/site.key
    size: 2048
```

A role from a collection is named the same way, in `roles:` or with `include_role`:

```yaml
  roles:
    - redhat.rhel_system_roles.timesync
```

Documentation works for any collection Ansible can see:

```console
[student@workstation project]$ ansible-navigator doc community.crypto.openssl_privatekey -m stdout
[student@workstation project]$ ansible-navigator collections
```

`ansible-navigator collections`, in its interactive mode, lists every collection it can find, including the project's own `collections/` directory. Type a collection's number (`:17`) to see its modules and roles, and a module's number to read its documentation.

## Two errors you will meet

{% cards cols=2 %}
  {% card title="The collection is not installed" kicker="On the control node" tone="red" %}
    `ERROR! couldn't resolve module/action 'community.crypto.openssl_privatekey'. This often indicates a misspelling, missing collection, or incorrect module path.`

    Check the spelling, then `ansible-galaxy collection list`. If the collection is installed but not listed, `collections_path` does not include its directory.
  {% /card %}
  {% card title="A Python library is missing" kicker="On the managed host" tone="amber" %}
    `Cannot detect the required Python library cryptography (>= 1.2.3)`

    The collection is fine. The module runs on the managed host and needs a library there. The module's documentation lists its requirements; install the package in an earlier task.
  {% /card %}
{% /cards %}

The first stops the playbook before it starts. The second fails one task on one host, which is a useful clue to which side the problem is on.

{% quiz
  objectives=["ch08.collections"]
  id="check"
  title="Check your understanding"
  ref="check" /%}

## Takeaway

Read a fully qualified collection name and say where its content lives. Use the chapter lab to check this on a real host.
