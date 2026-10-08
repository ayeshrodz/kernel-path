---
title: Building an Ansible inventory
seoTitle: "Ansible Inventory File Examples: INI and YAML"
description: "Build static inventories with hosts, groups, ranges and nested groups, in INI and YAML. Free RHCE (EX294) lesson with diagrams and practice."
kind: lesson
minutes: 12
---

{% lead %}
Before Ansible can do anything, it needs to know which machines it manages. That list is the **inventory**. Good inventories are organised into groups, so one playbook can target "the web servers in production" without naming a single host.
{% /lead %}

{% objectives %}
- Write a static inventory in INI format with groups, nested groups and ranges.
- Know the two groups that always exist.
- Verify an inventory with `ansible-navigator inventory`, and point Ansible at a different inventory file.
{% /objectives %}

## What an inventory is

An inventory defines a collection of hosts that Ansible manages. Hosts can be assigned to **groups**, which can be managed together. Groups can contain **child groups**, and a host can be a member of **many groups**. The inventory can also set variables for hosts and groups (chapter 4).

There are two kinds of inventory:

{% cards %}
  {% card title="Static inventory" tone="amber" %}
    A text file you write and maintain yourself, in INI or YAML format. This is what most of this guide uses.
  {% /card %}
  {% card title="Dynamic inventory" tone="blue" %}
    An inventory plug-in or script that asks an external source (a cloud provider, Red Hat Satellite, a CMDB) for the current list of hosts every time Ansible runs.
  {% /card %}
{% /cards %}

## A static inventory in INI format

The simplest possible inventory is a list of host names or IP addresses, one per line:

```ini {% title="inventory" %}
web1.example.com
web2.example.com
db1.example.com
db2.example.com
192.0.2.42
```

Normally you organise hosts into **host groups**. Each section starts with a group name in square brackets, followed by its hosts, one per line:

```ini {% title="inventory" %}
[webservers]
web1.example.com
web2.example.com
192.0.2.42

[db-servers]
db1.example.com
db2.example.com
```

### One host, many groups

The recommended practice is to put each host in *several* groups, organised along different dimensions: its **role**, its **location**, and its **environment**. Then you can aim a play at exactly the slice of your estate you need.

```ini {% title="inventory" %}
[webservers]
web1.example.com
web2.example.com
192.0.2.42

[db-servers]
db1.example.com
db2.example.com

[east-datacenter]
web1.example.com
db1.example.com

[west-datacenter]
web2.example.com
db2.example.com

[production]
web1.example.com
web2.example.com
db1.example.com
db2.example.com

[development]
192.0.2.42
```

{% callout type="important" title="Two groups always exist" %}
- **`all`** contains every host explicitly listed in the inventory.
- **`ungrouped`** contains every host that is not a member of any other group.

You never define these yourself, but you can target them: `hosts: all` is very common.
{% /callout %}

## Nested groups

A group can include other groups. Create it with the `:children` suffix and list the **group names** (not hosts) underneath:

```ini {% title="inventory" %}
[usa]
washington1.example.com
washington2.example.com

[canada]
ontario01.example.com
ontario02.example.com

[north-america:children]
canada
usa
```

`north-america` now contains all four hosts. A group can have both hosts and child groups: add a separate `[north-america]` section with its own hosts, and they are merged with the hosts it inherits from `canada` and `usa`.

{% callout type="tip" title="Dashes in group names" %}
The course examples use names like `db-servers`. Ansible accepts them but prints a warning about invalid characters in group names. In your own inventories, prefer underscores: `db_servers`.
{% /callout %}

## Explore an inventory

This is the inventory from the next exercise. Pick a group to see the hosts it contains, including hosts inherited from child groups, exactly as `--graph` would print them. Pick a host to see every group it belongs to. You can also edit the file on the left and watch the result change.

{% inventory-explorer ref="inventory-explorer" /%}

## Host ranges

When host names or IP addresses follow a pattern, write a **range** instead of listing them all. The syntax is `[START:END]`, and it matches every value from START to END **inclusive**. Numeric and alphabetic ranges both work.

{% glossary %}
  {% term name="192.168.[4:7].[0:255]" %}Every IPv4 address in 192.168.4.0/22 (192.168.4.0 to 192.168.7.255).{% /term %}
  {% term name="server[01:20].example.com" %}server01.example.com to server20.example.com.{% /term %}
  {% term name="[a:c].dns.example.com" %}a.dns.example.com, b.dns.example.com and c.dns.example.com.{% /term %}
  {% term name="2001:db8::[a:f]" %}IPv6 addresses 2001:db8::a to 2001:db8::f.{% /term %}
{% /glossary %}

{% callout type="warning" title="Leading zeros matter" %}
If the range has leading zeros, they are part of the pattern. `server[01:20]` matches `server07` but **not** `server7`. Compare the first two presets below.
{% /callout %}

{% range-expander ref="range-expander" /%}

Using ranges, the `usa` and `canada` groups above shrink to one line each:

```ini {% title="inventory" %}
[usa]
washington[1:2].example.com

[canada]
ontario[01:02].example.com
```

## Verifying the inventory

When in doubt, ask Ansible. The `ansible-navigator inventory` command shows how Ansible sees your inventory. Add `-m stdout` to print to the terminal instead of opening the interactive interface.

Is a host in the inventory? An empty result `{}` means yes; a warning means Ansible could not match it:

```console
[user@controlnode ~]$ ansible-navigator inventory -m stdout --host washington1.example.com
{}
[user@controlnode ~]$ ansible-navigator inventory -m stdout --host washington01.example.com
[WARNING]: Could not match supplied host pattern, ignoring: washington01.example.com
```

List everything as JSON, with `--list`:

```console
[user@controlnode ~]$ ansible-navigator inventory -m stdout --list
{
    "_meta": {
        "hostvars": {}
    },
    "all": {
        "children": [
            "canada",
            "ungrouped",
            "usa"
        ]
    },
    "canada": {
        "hosts": [
            "ontario01.example.com",
            "ontario02.example.com"
        ]
    },
    "usa": {
        "hosts": [
            "washington1.example.com",
            "washington2.example.com"
        ]
    }
}
```

Show one group as a tree, with `--graph`:

```console
[user@controlnode ~]$ ansible-navigator inventory -m stdout --graph canada
@canada:
  |--ontario01.example.com
  |--ontario02.example.com
```

Without `-m stdout`, navigator opens an interactive browser. Type `:0` to browse groups or `:1` to browse hosts, and press {% kbd %}Esc{% /kbd %} to go back.

{% callout type="important" title="Hosts and groups need different names" %}
If a host and a group share a name, `ansible-navigator inventory` prints a warning, and host patterns become ambiguous. Keep them distinct.
{% /callout %}

## Which inventory file is used?

`/etc/ansible/hosts` is the system's default static inventory, but in practice almost nobody uses it. Instead you keep an inventory file inside each project and either:

- pass it on the command line with `--inventory PATHNAME` or `-i PATHNAME`, or
- set it as the project default in `ansible.cfg` (next section), so you never have to type it.

```console
[user@controlnode ~]$ ansible-navigator inventory -i ./inventory -m stdout --graph all
```

## Dynamic inventories

Inventory information can also be generated from external databases. The community has written many **inventory plug-ins** for sources such as Red Hat Satellite or Amazon EC2, and you can write your own. Because the plug-in runs every time Ansible does, the inventory is always current as hosts are added and removed. Using them is outside the scope of this chapter.

{% quiz
  objectives=["ch03.inventory"]
  id="check"
  title="Check your understanding"
  ref="check" /%}

## Takeaway

Write a static inventory in INI format with groups, nested groups and ranges. Use the chapter lab to check this on a real host.
