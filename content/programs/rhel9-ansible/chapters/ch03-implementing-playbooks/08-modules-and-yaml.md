---
title: Finding modules and YAML syntax
seoTitle: "Find Ansible Modules With ansible-doc, and YAML Syntax"
description: "Find and read modules with ansible-doc and write correct YAML for playbooks. Free RHCE (EX294) lesson with diagrams and practice."
kind: lesson
minutes: 12
---

{% lead %}
Two skills make you fast with Ansible: finding the right module (and reading its documentation without leaving the terminal), and writing YAML that is correct the first time. This section covers both.
{% /lead %}

{% objectives %}
- Find modules and read their documentation with `ansible-navigator doc`.
- Know when, and how, to use `command`, `shell` and `raw` safely.
- Read and write YAML comments, strings, multi-line strings, dictionaries and lists.
{% /objectives %}

## Selecting modules

Ansible ships hundreds of modules for everyday administration. These are some of the most useful; pick one to see the command that shows its documentation.

{% module-explorer ref="module-explorer" /%}

## Reading module documentation

The documentation is inside your execution environment, so you can read it offline, which matters on an exam.

List every module available in the current EE with a one-line synopsis:

```console
[user@controlnode ~]$ ansible-navigator doc -l -m stdout
add_host                          Add a host (and alternatively a group) to the ansible-playbo...
amazon.aws.aws_az_facts           Gather information about availability zones in AWS
...output omitted...
yum                               Manages packages with the yum package manager
yum_repository                    Add or remove YUM repositories
```

{% callout type="important" %}
`ansible-navigator doc -l` shows modules in `ansible.builtin` by their **short names** (like `yum` above), not their FQCNs. Prefix them with `ansible.builtin.` in your playbooks.
{% /callout %}

Read the full documentation for one module: what it does, every argument, and examples you can copy:

```console
[user@controlnode ~]$ ansible-navigator doc ansible.builtin.dnf -m stdout
```

Or get a ready-to-edit **snippet** with every argument and a comment explaining each one, using `-s`. The course shows it in this form (with the classic tools, the equivalent is `ansible-doc -s ansible.builtin.dnf`):

```console
[user@controlnode ~]$ ansible-navigator -s doc ansible.builtin.dnf
```

Without `-m stdout`, navigator shows the documentation interactively in YAML. You can also browse modules collection by collection with `ansible-navigator collections`.

{% callout type="exam" title="Search inside the docs" %}
The **EXAMPLES** section at the end of each module's documentation is the fastest way to a working task. Pipe the stdout output through `less` and type `/EXAMPLES` to jump there.
{% /callout %}

{% callout type="note" title="ansible-doc" %}
With `ansible-playbook` or community Ansible, the `ansible-doc` command does the same job for modules installed on the control node, with the same options. It cannot see inside the execution environments that navigator uses.
{% /callout %}

## Running arbitrary commands

If no module exists for what you need, three modules let you run commands directly:

{% glossary %}
  {% term name="ansible.builtin.command" %}Runs a command **without a shell**. The simplest option. No pipes, redirects or shell variables. Needs Python on the host.{% /term %}
  {% term name="ansible.builtin.shell" %}Runs a command **through a shell**, so pipes, `>` redirects and environment variables work. Needs Python on the host.{% /term %}
  {% term name="ansible.builtin.raw" %}Sends the command **straight over SSH**, bypassing the module system. Works on hosts without Python, such as some network devices, and can even be used to install Python.{% /term %}
{% /glossary %}

```yaml
- name: Run the /opt/bin/makedb.sh command
  ansible.builtin.command:
    cmd: /opt/bin/makedb.sh
```

Unlike most modules, these are **not idempotent**. Every run executes the command and reports `changed`, even if nothing needed doing. You can make `command` and `shell` safer with a file check:

- **`creates: PATH`** runs the command only if `PATH` does **not** exist (assumption: running the command creates it).
- **`removes: PATH`** runs the command only if `PATH` **does** exist (assumption: running the command removes it).

```yaml
- name: Initialize the database
  ansible.builtin.command:
    cmd: /opt/bin/makedb.sh
    creates: /opt/db/database.db
```

The best fix, though, is usually a proper module. Compare an unconditional file write, a database command guarded by `creates`, and a content-aware file module. Press run again to see which tasks still report a change:

{% command-vs-module ref="command-vs-module" /%}

{% callout type="important" title="Order of preference" %}
Avoid `command`, `shell` and `raw` whenever a purpose-built module exists; they make it easy to write playbooks that are not idempotent. If you must use one, try `command` first and use `shell` or `raw` only if you need their special features.
{% /callout %}

## YAML syntax you will meet

### Comments

Everything to the right of `#` is a comment. If there is content before it on the same line, put a space before the `#`.

```yaml
# This is a YAML comment
some data # This is also a YAML comment
```

### Strings

Strings usually need no quotes, even with spaces. Single or double quotes both work when you want them:

```yaml
this is a string
'this is another string'
"this is yet another string"
```

Multi-line strings come in two styles: `|` keeps line breaks, and `>` folds lines into one, which is useful for breaking up very long strings.

{% yaml-multiline ref="yaml-multiline" /%}

### Dictionaries

Key-value pairs are normally written as an indented block. An inline form in braces also exists:

```yaml
name: svcrole
svcservice: httpd
svcport: 80
```

```yaml
{name: svcrole, svcservice: httpd, svcport: 80}
```

Avoid the inline form: it is harder to read. The one place it is common is lists of roles with parameters, which you will meet in chapter 8.

### Lists

The normal form uses one dash per item. An inline form in square brackets also exists, and should also generally be avoided:

```yaml
hosts:
  - servera
  - serverb
  - serverc
```

```yaml
hosts: [servera, serverb, serverc]
```

### Obsolete shorthand for tasks

Older playbooks sometimes put module arguments on the same line as the module, as `key=value` pairs:

{% columns %}
  {% column title="Shorthand (avoid)" tone="red" %}

```yaml
tasks:
  - name: Shorthand form
    ansible.builtin.service: name=httpd enabled=true state=started
```

  {% /column %}
  {% column title="Normal form (use this)" tone="green" %}

```yaml
tasks:
  - name: Normal form
    ansible.builtin.service:
      name: httpd
      enabled: true
      state: started
```

  {% /column %}
{% /columns %}

The normal form takes more lines but is easier to read: your eyes move straight down the keys. It is also real YAML, so editors highlight it properly. Recognise the shorthand when you see it, but do not write it.

{% quiz
  objectives=["ch03.modules"]
  id="check"
  title="Check your understanding"
  ref="check" /%}

## Takeaway

Find modules and read their documentation with `ansible-navigator doc`. Use the chapter lab to check this on a real host.
