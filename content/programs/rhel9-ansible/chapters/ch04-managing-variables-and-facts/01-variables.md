---
title: Variables in playbooks
seoTitle: "Ansible Variables in Playbooks With Examples"
description: "Define and use variables in plays, vars files, registered results and the command line. Free RHCE (EX294) lesson with diagrams and practice."
kind: lesson
minutes: 12
---

{% lead %}
So far every value in your playbooks has been typed in directly: the package name, the service, the path. Variables let you name those values once and reuse them everywhere, so a change happens in one place instead of ten, and one playbook can serve different hosts.
{% /lead %}

{% objectives %}
- Name variables correctly.
- Define variables in a play with `vars` and `vars_files`, and use them with `{{ }}`.
- Know when a variable reference must be quoted.
- Group related values in a dictionary, and capture task results with `register`.
{% /objectives %}

## Why variables

A variable stores a value that you can reuse throughout the files of an Ansible project. That makes projects easier to write and maintain, and reduces mistakes, because each value lives in exactly one place. Typical things to put in variables:

{% cards cols=3 %}
  {% card title="What to install" tone="teal" %}
    Package names, versions, archive URLs to download.
  {% /card %}
  {% card title="What to manage" tone="purple" %}
    Users to create, services to restart, firewall services to open.
  {% /card %}
  {% card title="Where things go" tone="amber" %}
    Configuration file paths, document roots, files to remove.
  {% /card %}
{% /cards %}

## Naming variables

A variable name must **start with a letter**, and may contain only **letters, numbers and underscores**. Spaces, dots, dashes and symbols are not allowed.

| Invalid | Valid |
| --- | --- |
| `web server` | `web_server` |
| `remote.file` | `remote_file` |
| `1st file` | `file_1` or `file1` |
| `remoteserver$1` | `remote_server_1` or `remote_server1` |

Try some names of your own:

{% variable-name-checker ref="variable-name-checker" /%}

## Defining variables in a play

The most common place to define variables is a `vars` block at the start of a play. Every task in that play can then use them.

```yaml {% title="playbook.yml" %}
- name: Create the standard user
  hosts: all
  vars:
    user: joe
    home: /home/joe
  tasks:
    ...
```

When the list grows, or you want to share variables between playbooks, move them into a separate YAML file and load it with **`vars_files`**. Paths are relative to the playbook.

{% columns %}
  {% column title="playbook.yml" tone="purple" %}

```yaml
- name: Create the standard user
  hosts: all
  vars_files:
    - vars/users.yml
  tasks:
    ...
```

  {% /column %}
  {% column title="vars/users.yml" tone="teal" %}

```yaml
user: joe
home: /home/joe
```

The file holds plain key-value pairs, in the same format as a `vars` block.

  {% /column %}
{% /columns %}

## Using a variable

To use a variable, put its name inside double curly braces: `{{ user }}`. When the task runs, Ansible replaces the reference with the variable's value. This syntax comes from **Jinja2**, the template language Ansible is built on.

```yaml
vars:
  user: joe

tasks:
  # The task name will read "Create the user joe"
  - name: Create the user {{ user }}
    ansible.builtin.user:
      # This creates the user named joe
      name: "{{ user }}"
```

### The quoting rule

Notice that `name: "{{ user }}"` is in quotes, but the task name is not. The rule is simple:

{% callout type="important" title="Quote a value that starts with {{" %}
If a variable reference is the **first thing** in a value, put the whole value in quotes. Otherwise YAML sees the opening `{` as the start of a dictionary and refuses to load the playbook. When the reference comes later in the value, as in `name: Create the user {{ user }}`, quotes are optional.
{% /callout %}

Edit the values below, then untick the quotes to see the error you will get:

{% variable-substitution ref="variable-substitution" /%}

The same rule applies to list items: write `- "{{ package }}"`, not `- {{ package }}`.

## Dictionaries as variables

When several values belong to the same thing, a **dictionary** keeps them together. Compare six loose variables with one structured one:

{% columns %}
  {% column title="Six separate variables" tone="red" %}

```yaml
user1_first_name: Bob
user1_last_name: Jones
user1_home_dir: /users/bjones
user2_first_name: Anne
user2_last_name: Cook
user2_home_dir: /users/acook
```

  {% /column %}
  {% column title="One dictionary" tone="green" %}

```yaml
users:
  bjones:
    first_name: Bob
    last_name: Jones
    home_dir: /users/bjones
  acook:
    first_name: Anne
    last_name: Cook
    home_dir: /users/acook
```

  {% /column %}
{% /columns %}

To read a value inside a dictionary you can use **dot notation**, `users.bjones.first_name`, or **bracket notation**, `users['bjones']['first_name']`. Both return `Bob`. Click around this dictionary to see both forms for any value:

{% data-explorer ref="data-explorer" /%}

{% callout type="tip" title="Prefer brackets, and be consistent" %}
Dot notation breaks when a key has the same name as a Python method or attribute, such as `copy`, `add` or `discard`: Ansible may return the method instead of your data. Bracket notation always works. Both are valid, but pick one style and use it across the whole project so it is easier to troubleshoot.
{% /callout %}

## Capturing results with register

Every module returns information about what it did, as JSON. The **`register`** keyword saves that result in a variable, so later tasks can print it, make decisions with it, or reuse part of it.

{% diagram ref="register-flow" /%}

```yaml {% title="playbook.yml" %}
- name: Installs a package and prints the result
  hosts: all
  tasks:
    - name: Install the package
      ansible.builtin.dnf:
        name: httpd
        state: installed
      register: install_result

    - name: Show what dnf reported
      ansible.builtin.debug:
        var: install_result
```

The `ansible.builtin.debug` module prints the variable during the run:

```text
TASK [Show what dnf reported] **************************************************
ok: [demo.example.com] => {
    "install_result": {
        "changed": false,
        "msg": "",
        "rc": 0,
        "results": [
            "httpd-2.4.51-7.el9_0.x86_64 providing httpd is already installed"
        ]
    }
}
```

`register` is placed at the **task** level, at the same indentation as the module name, not inside the module's arguments. You can then read any part of it, for example `install_result['changed']`.

{% quiz
  objectives=["ch04.variables"]
  id="check"
  title="Check your understanding"
  ref="check" /%}

## Takeaway

Name variables correctly. Use the chapter lab to check this on a real host.
