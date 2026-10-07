---
title: Ansible facts
seoTitle: "Ansible Facts: gather_facts and setup Module"
description: "Gather and use Ansible facts, filter them with the setup module and turn gathering off. Free RHCE (EX294) lesson with diagrams and practice."
kind: lesson
minutes: 12
---

{% lead %}
Before a play runs its first task, Ansible quietly asks every host about itself: its name, IP addresses, operating system, memory, disks and much more. Those answers are facts, and they let one playbook adapt to each host it touches.
{% /lead %}

{% objectives %}
- Explain what facts are and when they are gathered.
- Print facts and reference individual values in tasks.
- Recognise the older `ansible_*` fact names.
- Turn off fact gathering, gather it later, or gather only a subset.
{% /objectives %}

## What facts are

**Ansible facts** are variables that Ansible discovers automatically on a managed host. You use them like any other variable, in task arguments, messages, conditions and loops. Typical facts include:

{% cards cols=3 %}
  {% card title="Identity" tone="purple" %}
    Short host name, fully qualified domain name, OS distribution and version, kernel version.
  {% /card %}
  {% card title="Network" tone="blue" %}
    Interface names, IPv4 and IPv6 addresses, default route, DNS servers.
  {% /card %}
  {% card title="Hardware" tone="teal" %}
    Number of CPUs, total and free memory, disks and partitions with their sizes.
  {% /card %}
{% /cards %}

Facts are how a play reacts to what is really on a host. For example, a play could:

- restart a service only if a fact shows it in a particular state (conditionals come in chapter 5);
- size a database configuration file from the host's available memory;
- write the host's own IPv4 address into a configuration file.

## When facts are gathered

Unless you say otherwise, every play starts by running the **`ansible.builtin.setup`** module on each host. That is the **Gathering Facts** task you have seen at the top of every run. You never write that task yourself.

The results are stored in one big dictionary variable called **`ansible_facts`**.

## Looking at facts

To see everything Ansible knows about a host, print `ansible_facts` with the `debug` module:

```yaml {% title="facts.yml" %}
- name: Fact dump
  hosts: all
  tasks:
    - name: Print all facts
      ansible.builtin.debug:
        var: ansible_facts
```

The output is long, several hundred values. Here is a trimmed sample for a classroom host. Click through it: each value shows how to reference it in a playbook.

{% facts-explorer ref="facts-explorer" /%}

Some facts worth remembering:

| Fact | Reference |
| --- | --- |
| Short host name | `ansible_facts['hostname']` |
| Fully qualified domain name | `ansible_facts['fqdn']` |
| Main IPv4 address (from routing) | `ansible_facts['default_ipv4']['address']` |
| Names of all network interfaces | `ansible_facts['interfaces']` |
| Size of the `/dev/vda1` partition | `ansible_facts['devices']['vda']['partitions']['vda1']['size']` |
| DNS servers | `ansible_facts['dns']['nameservers']` |
| Running kernel version | `ansible_facts['kernel']` |

Because `ansible_facts` is a dictionary, dot notation also works: `ansible_facts.default_ipv4.address` is the same as `ansible_facts['default_ipv4']['address']`.

## Using facts in a play

When a task runs, Ansible substitutes each host's own value:

```yaml {% title="playbook.yml" %}
- hosts: all
  tasks:
    - name: Prints various Ansible facts
      ansible.builtin.debug:
        msg: >
          The default IPv4 address of {{ ansible_facts.fqdn }}
          is {{ ansible_facts.default_ipv4.address }}
```

```console
[user@demo ~]$ ansible-navigator run -m stdout playbook.yml
...output omitted...
TASK [Prints various Ansible facts] ********************************************
ok: [demo1.example.com] => {
    "msg": "The default IPv4 address of demo1.example.com is 172.25.250.10\n"
}
```

Run the same play against ten hosts and each one reports its own name and address.

## The older ansible_* names

Before Ansible 2.5, facts were not grouped in `ansible_facts`. Each fact was injected as its own top-level variable with an `ansible_` prefix. You will still meet this style in older playbooks and many online examples:

| `ansible_facts` form | Older injected form |
| --- | --- |
| `ansible_facts['hostname']` | `ansible_hostname` |
| `ansible_facts['fqdn']` | `ansible_fqdn` |
| `ansible_facts['default_ipv4']['address']` | `ansible_default_ipv4['address']` |
| `ansible_facts['interfaces']` | `ansible_interfaces` |
| `ansible_facts['dns']['nameservers']` | `ansible_dns['nameservers']` |
| `ansible_facts['kernel']` | `ansible_kernel` |

Both forms work today. The community discourages the injected form because facts have high precedence: a fact such as `ansible_distribution` could silently override a variable you defined with the same name.

{% callout type="note" title="Turning the old names off" %}
The injected names are controlled by `inject_facts_as_vars` in the `[defaults]` section of `ansible.cfg`. It defaults to `true`. Set it to `false` and only the `ansible_facts[...]` form works; the old names become errors.
{% /callout %}

## Controlling fact gathering

Gathering facts takes time and puts load on hosts. Sometimes you do not need facts at all, or a host cannot run `setup` until you install something first. Compare the options:

{% fact-gathering ref="fact-gathering" /%}

In YAML, the two switches look like this:

{% columns %}
  {% column title="Skip gathering for a play" tone="gray" %}

```yaml
- name: No automatic facts
  hosts: large_datacenter
  gather_facts: false
```

  {% /column %}
  {% column title="Gather manually, or only some" tone="teal" %}

```yaml
tasks:
  - name: Manually gather facts
    ansible.builtin.setup:

  - name: Collect only hardware facts
    ansible.builtin.setup:
      gather_subset:
        - hardware
```

  {% /column %}
{% /columns %}

Add `!` in front of a subset name (`- '!hardware'`) to gather everything **except** that subset. The `setup` module documentation lists all subset names: `ansible-navigator doc ansible.builtin.setup -m stdout`.

{% quiz
  objectives=["ch04.facts"]
  id="check"
  title="Check your understanding"
  ref="check" /%}

## Takeaway

Explain what facts are and when they are gathered. Use the chapter lab to check this on a real host.
