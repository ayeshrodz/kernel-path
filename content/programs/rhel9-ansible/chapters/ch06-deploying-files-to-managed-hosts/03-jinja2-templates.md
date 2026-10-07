---
title: Deploying custom files with Jinja2 templates
seoTitle: "Ansible Jinja2 Templates With Examples"
description: "Generate configuration files from Jinja2 templates with variables, loops and conditions. Free RHCE (EX294) lesson with diagrams and practice."
kind: lesson
minutes: 12
---

{% lead %}
`lineinfile` and `blockinfile` patch a file that something else owns. A template goes further: you write the whole file once, with placeholders, and Ansible fills them in for each host from its variables and facts. One template, a correct file everywhere.
{% /lead %}

{% objectives %}
- Read and write the three Jinja2 delimiters.
- Deploy a template with `ansible.builtin.template`.
- Use `for` loops and `if` conditions inside a template.
- Reformat values with filters such as `to_json` and `to_nice_yaml`.
{% /objectives %}

## Why template a file

Editing single lines gets fragile as soon as a file has many settings, or settings that differ between hosts. With a **template** you keep the complete configuration file in your project and mark the parts that vary. When the play runs, those parts are replaced by the right values for the managed host being configured. It is easier to review, harder to get wrong, and the result is fully described by your project.

Ansible uses the **Jinja2** templating system. You have been using it since chapter 4: the `{{ }}` around a variable in a playbook is Jinja2.

## The three delimiters

{% cards cols=3 %}
  {% card title="{{ expression }}" kicker="Output" tone="teal" %}
    Replaced by the value of the variable or expression.
  {% /card %}
  {% card title="{% statement %}" kicker="Logic" tone="purple" %}
    Control structures: `for` loops and `if` tests. Produces no output by itself.
  {% /card %}
  {% card title="{# comment #}" kicker="Comment" tone="gray" %}
    A note for whoever maintains the template. Never appears in the deployed file.
  {% /card %}
{% /cards %}

```jinja
{# /etc/hosts line #}
{{ ansible_facts['default_ipv4']['address'] }}    {{ ansible_facts['hostname'] }}
```

The first line is a comment and is dropped. On the second, both expressions become that host's own address and short name.

## Building a template

A template is an ordinary text file made of fixed text, variables and expressions. The variables can come from anywhere Ansible gets them: the play's `vars`, `group_vars`, `host_vars`, and the facts gathered from the managed host.

By convention templates live in a **`templates/`** directory in the project and end in **`.j2`**. Neither is required, but both make it obvious what the file is.

Part of a template for `/etc/ssh/sshd_config`:

```jinja {% title="templates/sshd_config.j2" %}
# {{ ansible_managed }}
# DO NOT MAKE LOCAL MODIFICATIONS TO THIS FILE BECAUSE THEY WILL BE LOST

Port {{ ssh_port }}
ListenAddress {{ ansible_facts['default_ipv4']['address'] }}

HostKey /etc/ssh/ssh_host_rsa_key
HostKey /etc/ssh/ssh_host_ecdsa_key
HostKey /etc/ssh/ssh_host_ed25519_key

PermitRootLogin {{ root_allowed }}
AllowGroups {{ groups_allowed }}

PasswordAuthentication {{ passwords_allowed }}
UsePAM yes
Subsystem sftp /usr/libexec/openssh/sftp-server
```

Most of it is the literal configuration. Only five values change from host to host or from one environment to the next.

## Deploying a template

`ansible.builtin.template` renders the file and puts it in place. `src` is the template on the control node; `dest` is the file to create on the managed hosts.

```yaml
tasks:
  - name: template render
    ansible.builtin.template:
      src: /tmp/j2-template.j2
      dest: /tmp/dest-config-file.txt
```

Step through what happens:

{% diagram ref="template-flow" /%}

`template` takes the same `owner`, `group`, `mode` and SELinux arguments as `file` and `copy`. It also has **`validate`**, which runs a command against the rendered file before it replaces the real one. If the command fails, nothing is changed:

```yaml
- name: sudoers rule is deployed
  ansible.builtin.template:
    src: templates/ops.sudoers.j2
    dest: /etc/sudoers.d/ops
    mode: '0440'
    validate: /usr/sbin/visudo -cf %s      # %s is the temporary rendered file
```

### Marking a file as managed

Put a comment at the top of every template so that nobody edits the deployed file by hand and loses the change on the next run. The `ansible_managed` directive holds a standard string for this. Set it in `ansible.cfg`:

```ini {% title="ansible.cfg" %}
[defaults]
ansible_managed = Ansible managed
```

and use it in the template:

```jinja
# {{ ansible_managed }}
```

## Control structures

### Loops

`{% for %}` repeats a piece of the template for each item in a list.

```jinja
{% for user in users %}
      {{ user }}
{% endfor %}
```

A `for` can carry a condition, and inside the loop **`loop.index`** counts from 1:

```jinja
{# every user except root #}
{% for myuser in users if not myuser == "root" %}
User number {{ loop.index }} - {{ myuser }}
{% endfor %}
```

Loops become powerful with the magic variables from chapter 4. This three-line template builds a complete `/etc/hosts` from the facts of **every** host in the inventory:

```jinja {% title="templates/hosts.j2" %}
{% for host in groups['all'] %}
{{ hostvars[host]['ansible_facts']['default_ipv4']['address'] }} {{ hostvars[host]['ansible_facts']['fqdn'] }} {{ hostvars[host]['ansible_facts']['hostname'] }}
{% endfor %}
```

```yaml
- name: /etc/hosts is up to date
  hosts: all
  gather_facts: true
  tasks:
    - name: Deploy /etc/hosts
      ansible.builtin.template:
        src: templates/hosts.j2
        dest: /etc/hosts
```

{% callout type="warning" title="hostvars only knows hosts whose facts were gathered" %}
`hostvars[host]['ansible_facts']` is filled in when a play gathers facts from that host. Run the play against `all` (as above), or a host missing from the play raises an "undefined" error halfway through the file.
{% /callout %}

### Conditionals

`{% if %}` includes part of the file only when a condition holds.

```jinja
{% if finished %}
{{ result }}
{% endif %}
```

{% callout type="important" title="Templates only" %}
Jinja2 `for` and `if` blocks belong in template files. In a playbook, use the task keywords `loop` and `when` from chapter 5 instead.
{% /callout %}

## Try it

Edit the template, switch host, break it on purpose. The examples cover everything above:

{% template-playground ref="template-playground" /%}

Things worth trying:

- In the first example, change `fqdn` to `hostname`, then misspell it to see Ansible's error.
- In the `for` example, change `groups['all']` to `groups['webservers']`.
- In the filters example, the variable `backup_host` is not defined anywhere: remove `| default(...)` and see what happens.

{% variant name="homelab" title="Your facts say Rocky" %}
On the home lab, `ansible_facts['distribution']` is `Rocky` and `distribution_version` is `9.8`, where a RHEL host reports `RedHat` and `9.0`. The playground follows whichever environment you selected.
{% /variant %}

## Filters

A **filter** changes a value on its way into the file. Write it after a pipe:

```jinja
{{ output | to_json }}
{{ output | to_yaml }}
```

| Filter | Result |
| --- | --- |
| `to_json`, `to_yaml` | The value as JSON or YAML, compact |
| `to_nice_json`, `to_nice_yaml` | The same, indented for people to read |
| `from_json`, `from_yaml` | Parse a JSON or YAML **string** into data |
| `default('x')` | Use `x` when the variable is undefined |
| `upper`, `lower`, `join(', ')`, `length` | Everyday text and list helpers |

Filters work anywhere Jinja2 does, in playbooks as well as templates. There are many more: see "Using filters to manipulate data" in the Ansible documentation.

{% quiz
  objectives=["ch06.templates"]
  id="check"
  title="Check your understanding"
  ref="check" /%}

## Takeaway

Read and write the three Jinja2 delimiters. Use the chapter lab to check this on a real host.
