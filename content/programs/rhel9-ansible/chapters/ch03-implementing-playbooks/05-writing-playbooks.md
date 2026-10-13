---
title: Writing and running playbooks
seoTitle: "Write Your First Ansible Playbook (With Examples)"
description: "Write and run an Ansible playbook: plays, tasks, modules, check mode and idempotence. Free RHCE (EX294) lesson with diagrams and practice."
kind: lesson
minutes: 12
---

{% lead %}
A playbook turns a long, fiddly manual procedure into a short text file you can run again and again with the same result. This section covers how playbooks are laid out in YAML, how tasks call modules, and how to check, preview and run a playbook with `ansible-navigator`.
{% /lead %}

{% objectives %}
- Write a correctly indented playbook with a play, hosts and tasks.
- Explain FQCNs and where modules come from.
- Run a playbook, read its output, and use `--syntax-check`, `--check` and `-v`.
{% /objectives %}

## Tasks, plays and playbooks

- A **task** applies a module to do one unit of work.
- A **play** is a sequence of tasks applied, in order, to hosts selected from the inventory.
- A **playbook** is a text file containing one or more plays, run in order.

Because a play is written in readable YAML, it is also documentation: the tasks describe exactly what is needed to deploy your application or infrastructure.

{% diagram ref="playbook-nesting" /%}

## Anatomy of a playbook

Here is a complete playbook with one play and one task. Click through the lines to see what each part does.

{% annotated-yaml ref="annotated-yaml" /%}

### Two indentation rules

YAML uses **spaces** to show structure. It does not care how many spaces you use, but it does insist on two rules:

1. Items at the same level of the hierarchy, such as the keys of one play or the items in one list, must have **the same indentation**.
2. Items that are children of another item must be **indented more** than their parent.

Blank lines are allowed anywhere and help readability.

{% callout type="important" title="Spaces only, never tabs" %}
A tab in a playbook is a syntax error. If you use Vim, add this line to `~/.vimrc` so that pressing {% kbd %}Tab{% /kbd %} in a YAML file inserts two spaces and new lines are auto-indented:

```text {% title="~/.vimrc" %}
autocmd FileType yaml setlocal ai ts=2 sw=2 et
```
{% /callout %}

### A play is a dictionary; tasks is a list

A YAML **list** is one item per line, each starting with a dash and a space:

```yaml
- apple
- orange
- grape
```

A play is a collection of **key-value pairs** (a dictionary). Its keys all share the same indentation. Here the first two keys have simple values and the third has a list as its value:

```yaml
name: just an example
hosts: webservers
tasks:
  - first
  - second
  - third
```

A `tasks` list with several tasks looks like this. Each task is its own dictionary with a `name` and a module:

```yaml
tasks:
  - name: Web server is enabled
    ansible.builtin.service:
      name: httpd
      enabled: true

  - name: NTP server is enabled
    ansible.builtin.service:
      name: chronyd
      enabled: true

  - name: Postfix is enabled
    ansible.builtin.service:
      name: postfix
      enabled: true
```

{% callout type="important" %}
Order matters. Ansible runs plays, and the tasks within them, in exactly the order they appear in the playbook.
{% /callout %}

## Modules, collections and FQCNs

Modules are the tools that tasks use. Since Ansible Core 2.11, modules are packaged in **Ansible Content Collections**, each containing a set of related modules and their documentation.

- The `ansible-core` package provides one collection, **`ansible.builtin`**, which is always available.
- The default execution environment in AAP 2.2, **`ee-supported-rhel8`**, adds many more, for example `ansible.posix`, which contains `firewalld`.
- More collections can come from automation hub at `console.redhat.com`, from a private automation hub, or from Ansible Galaxy, installed into the `collections` directory of your project. Red Hat supports only its certified collections.

Browse what your EE contains with `ansible-navigator collections`. Type `:` and a line number to open a collection and see its modules; do the same on a module to read its documentation. {% kbd %}Esc{% /kbd %} goes back.

Modules are named with a **fully qualified collection name (FQCN)**: `collection_namespace.collection_name.module`. For example, the `copy` module in `ansible.builtin` is `ansible.builtin.copy`. That lets two collections each have a module called `copy` without conflict.

{% callout type="exam" title="Always write FQCNs" %}
Older playbooks use short names such as `copy` or `yum`. Ansible still tries to resolve them, but to avoid surprises, use FQCNs in everything you write: `ansible.builtin.copy`, `ansible.posix.firewalld`.
{% /callout %}

## Running a playbook

Run a playbook from the control node with `ansible-navigator run`, passing the playbook file name. Add `-m stdout` to print the output to your terminal; without it, navigator opens its interactive mode.

```console
[user@controlnode playdemo]$ cat webserver.yml
---
- name: Play to set up web server
  hosts: servera.lab.example.com
  tasks:
  - name: Latest httpd version installed
    ansible.builtin.dnf:
      name: httpd
      state: latest
[user@controlnode playdemo]$ ansible-navigator run -m stdout webserver.yml

PLAY [Play to set up web server] ***********************************************

TASK [Gathering Facts] *********************************************************
ok: [servera.lab.example.com]

TASK [Latest httpd version installed] ******************************************
changed: [servera.lab.example.com]

PLAY RECAP *********************************************************************
servera.lab.example.com    : ok=2    changed=1    unreachable=0    failed=0
skipped=0    rescued=0    ignored=0
```

Things to notice:

- The **names** of the play and each task are printed as they run. That is why naming them is worth the effort.
- **Gathering Facts** is a special task, run automatically at the start of a play by the `ansible.builtin.setup` module. It collects information about each host (chapter 4).
- The httpd task reports **changed**: the package was missing or out of date, so the module installed it.
- The **PLAY RECAP** summarises each host. Click through its counters:

{% play-recap ref="play-recap" /%}

Run the same playbook again and every task reports `ok` with `changed=0`, because httpd is already at the latest version. That is idempotency in action.

{% callout type="note" title="ansible-playbook" %}
Community Ansible's older `ansible-playbook` command takes many of the same options as `ansible-navigator run -m stdout`, but uses your control node as the execution environment instead of a container. On RHEL 9 it is supported only for narrow use cases.
{% /callout %}

### More output with -v

The default output does not show task details. Add `-v` for more, up to four levels:

| Option | Adds |
| --- | --- |
| `-v` | Task results. |
| `-vv` | Task results and task configuration. |
| `-vvv` | Information about connections to managed hosts. |
| `-vvvv` | Extra verbosity for connection plug-ins, including the users used on managed hosts and what scripts were run. |

{% verbosity ref="verbosity" /%}

## Check before you run

### Syntax check

`--syntax-check` parses the playbook without running anything. Silence plus the playbook path means it is valid:

```console
[user@controlnode playdemo]$ ansible-navigator run \
> -m stdout webserver.yml --syntax-check
playbook: /home/user/playdemo/webserver.yml
```

When it fails, it tells you roughly where. Here the space after `name:` is missing:

```console
[user@controlnode playdemo]$ ansible-navigator run \
> -m stdout webserver.yml --syntax-check
ERROR! Syntax Error while loading YAML.
  mapping values are not allowed in this context

The error appears to be in ...output omitted... line 3, column 8, but may
be elsewhere in the file depending on the exact syntax problem.

The offending line appears to be:

- name:Play to set up web server
  hosts: servera.lab.example.com
       ^ here
```

{% callout type="tip" title="The caret is a hint, not a verdict" %}
YAML errors are often reported on the line *after* the real mistake, as here. Look at the reported line and the one above it.
{% /callout %}

### Dry run with --check

`--check` runs the playbook in **check mode**: Ansible connects and reports what *would* change, but changes nothing on the hosts.

```console
[user@controlnode playdemo]$ ansible-navigator run \
> -m stdout webserver.yml --check
...output omitted...
TASK [Latest httpd version installed] ******************************************
changed: [servera.lab.example.com]

PLAY RECAP *********************************************************************
servera.lab.example.com    : ok=2    changed=1    unreachable=0    failed=0  ...
```

Here the dry run predicts that the httpd task would make a change.

{% diagram ref="safe-workflow" /%}

{% quiz
  objectives=["ch03.playbooks"]
  id="check"
  title="Check your understanding"
  ref="check" /%}

## Takeaway

Write a correctly indented playbook with a play, hosts and tasks. Use the chapter lab to check this on a real host.
