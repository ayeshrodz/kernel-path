---
title: Host and group variables, and precedence
seoTitle: "Ansible host_vars, group_vars and Variable Precedence"
description: "Where to put host and group variables and which value wins under Ansible precedence. Free RHCE (EX294) lesson with diagrams and practice."
kind: lesson
minutes: 12
---

{% lead %}
A variable can be set for every host, for a group, for a single host, for one play, or just for one run of a playbook. When the same name is set in more than one place, Ansible needs a rule to decide which value wins. That rule is precedence.
{% /lead %}

{% objectives %}
- Set host and group variables, preferably in `host_vars` and `group_vars` directories.
- Override any variable for one run with extra variables.
- Predict which value wins when a variable is defined in several places.
{% /objectives %}

## Where variables can live

You can define a variable at very different scopes:

- for **all hosts**, or a **group** of hosts, or **one host**, usually in inventory-related files;
- as a **fact** that Ansible discovers from the host itself;
- inside a **playbook**, for one play, or for one task;
- on the **command line**, for one run, as an *extra variable* with `-e` or `--extra-vars`.

## Variable precedence

When the same variable name is set in several places with different values, the one with the **highest precedence** wins. This is the simplified order the course uses, from lowest to highest:

1. Group variables defined in the inventory
2. Group variables in files in a `group_vars` directory
3. Host variables defined in the inventory
4. Host variables in files in a `host_vars` directory
5. Host facts, discovered at run time
6. Play variables (`vars` and `vars_files`)
7. Task variables
8. Extra variables on the command line

Two patterns fall out of that list. **Narrower beats wider**: a host variable beats a group variable, and a group variable for one group beats one set for `all`. **The playbook beats the inventory**: anything set in a play overrides inventory variables. And extra variables beat everything.

{% variable-precedence ref="variable-precedence" /%}

{% callout type="tip" title="Avoid needing the rules" %}
The simplest practice is to give every variable a unique name, so precedence never comes into play. Use precedence on purpose, when you want a sensible default for a group and a deliberate exception for one host.
{% /callout %}

The full precedence list in the Ansible documentation has more than twenty levels, including role defaults, which you will meet in chapter 8. The eight above cover everything in this chapter.

## Host and group variables in the inventory

Inventory variables fall into two groups. **Host variables** apply to one host. **Group variables** apply to every host in a group, or in a group of groups. Host variables beat group variables, and playbook variables beat both.

The oldest way to set them is directly in the inventory file.

{% tabs %}
  {% tab label="One host" %}

```ini {% title="inventory" %}
[servers]
demo.example.com  ansible_user=joe
```

`ansible_user` is set only for `demo.example.com`.

  {% /tab %}
  {% tab label="A group" %}

```ini {% title="inventory" %}
[servers]
demo1.example.com
demo2.example.com

[servers:vars]
user=joe
```

A `[group:vars]` section sets `user` for every host in `servers`.

  {% /tab %}
  {% tab label="A group of groups" %}

```ini {% title="inventory" %}
[servers1]
demo1.example.com
demo2.example.com

[servers2]
demo3.example.com
demo4.example.com

[servers:children]
servers1
servers2

[servers:vars]
user=joe
```

All four hosts inherit `user` through the parent group.

  {% /tab %}
{% /tabs %}

This works, but it mixes host lists with settings, makes the inventory harder to read, and uses an older syntax. You will still see it in existing projects.

## Using group_vars and host_vars directories

{% callout type="important" title="Recommended practice" %}
Define inventory variables in **`group_vars`** and **`host_vars`** directories, not in the inventory file.
{% /callout %}

Create the two directories next to your inventory (or your playbook). Inside them:

- `group_vars/GROUPNAME` holds variables for that group;
- `host_vars/HOSTNAME` holds variables for that host.

Each file is plain YAML, exactly like a `vars` block:

```yaml {% title="group_vars/servers" %}
user: joe
```

Here is the course's two-datacenter example. `datacenters` is a parent group of `datacenter1` and `datacenter2`, and each level sets a `package` variable. Pick a host to see which files apply to it and which value wins. Click a file to create or delete it and see the answer change.

{% group-vars-resolver ref="group-vars-resolver" /%}

The same project, as a tree:

{% project-tree ref="project-tree" /%}

{% callout type="note" title="Two possible locations" %}
Ansible looks for `group_vars` and `host_vars` next to the **inventory** and next to the **playbook**. If both are in the same directory, as in this course, there is only one place to look. If they are in different directories, Ansible reads both, and the directories beside the playbook take precedence.
{% /callout %}

## Extra variables from the command line

Extra variables beat every other definition. They are handy for a one-off run with a different value, without editing any file:

```console
[user@demo ~]$ ansible-navigator run main.yml -e "package=apache"
```

You can pass `-e` several times, or several `key=value` pairs in one quoted string.

{% quiz
  objectives=["ch04.variables","ch04.vault","ch04.facts"]
  id="check"
  title="Check your understanding"
  ref="check" /%}

## Takeaway

Set host and group variables, preferably in `host_vars` and `group_vars` directories. Use the chapter lab to check this on a real host.
