---
title: Including and importing files
seoTitle: "Ansible import_tasks vs include_tasks Explained"
description: "Split playbooks with import_playbook, import_tasks and include_tasks, and know the difference. Free RHCE (EX294) lesson with diagrams and practice."
kind: lesson
minutes: 12
---

{% lead %}
A playbook that does everything in one file is easy to start and hard to live with. Past a few dozen tasks it is slow to read, risky to change, and impossible to reuse. Ansible lets you split work across files at two levels: whole playbooks, and lists of tasks.
{% /lead %}

{% objectives %}
- Combine playbooks with `import_playbook`.
- Move tasks into task files and reuse them with `import_tasks` and `include_tasks`.
- Explain the difference between a static import and a dynamic include, and choose between them.
- Pass variables to a task file so one file serves several plays.
{% /objectives %}

## Two levels of reuse

{% cards cols=2 %}
  {% card title="Playbooks" kicker="import_playbook" tone="purple" %}
    A playbook can pull in other complete playbooks. The result runs as if all their plays were written one after another in a single file.
  {% /card %}
  {% card title="Task files" kicker="import_tasks · include_tasks" tone="teal" %}
    A play can pull in a file that holds nothing but a list of tasks. The same file can serve many plays.
  {% /card %}
{% /cards %}

Select a file to see what is in it and how the pieces connect:

{% diagram ref="project-map" /%}

## Importing playbooks

`import_playbook` is written at the **top level** of a playbook, where a play would go. It cannot be used inside a play.

```yaml {% title="site.yml" %}
---
- name: Web tier
  ansible.builtin.import_playbook: web.yml

- name: Database tier
  ansible.builtin.import_playbook: db.yml
```

You can mix imported playbooks and ordinary plays in one file; everything runs in the order it is listed.

```yaml
- name: Prepare the control node
  hosts: localhost
  tasks:
    - ansible.builtin.debug:
        msg: Starting the roll-out

- name: Web tier
  ansible.builtin.import_playbook: web.yml
```

Each imported file stays a normal playbook that you can also run by itself, which is what makes the split worthwhile: `web.yml` for a quick change to the web servers, `site.yml` for everything.

An imported playbook can take `vars:` as well. The values apply to every play in that file, which lets one generic playbook serve several purposes:

```yaml
- name: Database tier
  ansible.builtin.import_playbook: install.yml
  vars:
    package: mariadb-server
```

## Task files

A **task file** is a flat YAML list of tasks. It has no `hosts:` and no `tasks:` keyword, because it is not a play. Keep them together in a `tasks/` directory next to the playbook, so the structure of a large project stays easy to see:

```yaml {% title="tasks/install.yml" %}
---
- name: Packages are installed
  ansible.builtin.dnf:
    name: "{{ packages }}"
    state: present
```

A play brings it in with one of two keywords. Both are used like a module, as a task:

```yaml
tasks:
  - name: Packages
    ansible.builtin.import_tasks: tasks/install.yml

  - name: Packages
    ansible.builtin.include_tasks: tasks/install.yml
```

The path is relative to the file that contains the task. Keeping task files in a `tasks/` directory next to the playbook is a convention worth following.

## Static or dynamic

The two keywords differ in **when** Ansible reads the file.

{% columns %}
{% column title="import_tasks: static" tone="blue" %}

Read while the playbook is being **parsed**, before anything runs. The tasks are copied into the play, as if you had pasted them there.

{% /column %}
{% column title="include_tasks: dynamic" tone="amber" %}

Read when the play **reaches that task**, separately for each host. Until then Ansible does not know what is inside.

{% /column %}
{% /columns %}

That one difference explains everything else. Switch the keyword, then add a condition or a loop:

{% reuse-simulator ref="reuse-simulator" /%}

The consequences side by side:

| | `import_tasks` | `include_tasks` |
| --- | --- | --- |
| File is read | When the playbook is parsed | When the task runs |
| `when` on it | Copied to every task in the file; each tests it | Tested once; if false the file is never read |
| `loop` on it | Not allowed | Runs the file once per item |
| File name from a variable | Only variables known at parse time (play `vars`, `-e`) | Any variable, including facts and registered results |
| `--list-tasks` and `--start-at-task` | See the tasks inside | See only the include itself |
| A syntax error in the file | Found before the run starts | Found when that task is reached |

{% callout type="tip" title="Which one should I use?" %}
Start with **`import_tasks`**. Static is easier to reason about: you can list the tasks, start at any of them, and mistakes show up before the first host is touched. Reach for **`include_tasks`** when you need something an import cannot do: a loop over the file, a file chosen by a fact, or skipping a whole file cheaply on a condition.
{% /callout %}

{% callout type="warning" title="when on an import is not a gate" %}
With `import_tasks`, the condition is evaluated again for every task in the file. If the first task in the file changes the thing the condition tests, the later tasks may be skipped. When a condition must decide once whether the whole file runs, use `include_tasks`.
{% /callout %}

## Passing variables

A task file is most useful when it does not hard-code what it works on. Give it variables with `vars:` on the import or include:

```yaml {% title="web.yml" %}
- name: Web servers are configured
  hosts: web
  tasks:
    - name: Packages
      ansible.builtin.import_tasks: tasks/install.yml
      vars:
        packages:
          - httpd
          - firewalld
```

```yaml {% title="db.yml" %}
- name: Database servers are configured
  hosts: db
  tasks:
    - name: Packages
      ansible.builtin.import_tasks: tasks/install.yml
      vars:
        packages:
          - mariadb-server
```

One file, two plays, two different package lists. Variables set this way exist only for the tasks of that import.

When an include runs in a loop, each pass sees the current `item`:

```yaml
- name: Firewall services
  ansible.builtin.include_tasks: tasks/firewall.yml
  loop:
    - http
    - https
```

```text
TASK [Firewall services] *******************************************************
included: /home/student/project/tasks/firewall.yml for servera.lab.example.com => (item=http)
included: /home/student/project/tasks/firewall.yml for servera.lab.example.com => (item=https)
```

{% callout type="note" title="Handlers and task files" %}
A task in an imported or included file can `notify` a handler defined in the play that pulled it in: handler names are looked up in the play, not in the file. A handler can itself be an `include_tasks`; notify it by the handler's name and every task in the included file runs. What you cannot do is notify the name of one task inside that included file.
{% /callout %}

## Where task files pay off

- **Building a new server** in stages: users, packages, services, sudo rules, shared file systems, hardening, updates, monitoring. Each stage is its own file, easy to find and to test.
- **Several teams, one playbook.** Developers, system administrators and database administrators each own a task file; one playbook brings them together.
- **Optional configuration**, included only when a condition says a host needs it.
- **Group-specific work**: a task file imported in a play that targets only that group.

{% callout type="warning" title="Old playbooks: include" %}
Older playbooks use a bare `include:` for both task files and playbooks. Its behaviour changed between releases and it was deprecated in favour of `include_tasks`, `import_tasks` and `import_playbook`, which say exactly what they do. If you find `include:` in a playbook, replace it with one of those.
{% /callout %}

## A file name that depends on the host

Because an include is resolved at run time, its file name can come from a fact:

```yaml
- name: Distribution-specific setup
  ansible.builtin.include_tasks: "tasks/setup-{{ ansible_facts['os_family'] }}.yml"
```

The same line with `import_tasks` fails before the play starts, because facts are not gathered yet when the playbook is parsed:

```text
ERROR! Error when evaluating variable in import path: tasks/{{ ansible_facts['os_family'] }}.yml.
```

The same limit applies to host and group variables from the inventory: they belong to individual hosts, and an import is resolved once for the whole play. A variable in an import path can come from the play, a variables file or the command line (`-e`), but not from the inventory.

{% callout type="exam" title="Roles are the next step" %}
Task files are the simplest form of reuse. When a set of tasks also needs its own variables, templates, files and handlers, package it as a **role**: chapter 8.
{% /callout %}

{% quiz
  objectives=["ch07.reuse"]
  id="check"
  title="Check your understanding"
  ref="check" /%}

## Takeaway

Combine playbooks with `import_playbook`. Use the chapter lab to check this on a real host.
