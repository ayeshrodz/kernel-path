---
title: Implementing handlers
seoTitle: "Ansible Handlers and notify Explained"
description: "Restart services only when something changed, with handlers, notify and flush_handlers. Free RHCE (EX294) lesson with diagrams and practice."
kind: lesson
minutes: 10
---

{% lead %}
When a configuration file changes, the service that reads it must be restarted, but only then. Restarting on every run would interrupt users for no reason. Handlers are tasks that run only when another task reports that it changed something.
{% /lead %}

{% objectives %}
- Write handlers and trigger them with `notify`.
- Predict when handlers run, in which order, and how many times.
- Know what happens to handlers when a play fails.
{% /objectives %}

## What handlers are

Modules are idempotent: they change a host only when it differs from the desired state. But a change sometimes requires a follow-up action. A new configuration file means the service must be reloaded; a kernel update may mean a reboot.

**Handlers** are tasks that respond to a notification from other tasks. A task notifies a handler, by name, only when the task **changes** something. Notified handlers run once, **after all the tasks** in the play have finished. If nothing notifies a handler, it does not run at all.

Handlers use the same modules as any other task. In practice they mostly restart services and reboot hosts.

## Writing a handler

```yaml
tasks:
  - name: copy demo.example.conf configuration template
    ansible.builtin.template:
      src: /var/lib/templates/demo.example.conf.template
      dest: /etc/httpd/conf.d/demo.example.conf
    notify:
      - restart apache

handlers:
  - name: restart apache
    ansible.builtin.service:
      name: httpd
      state: restarted
```

- **`notify`** on a task lists the handlers to trigger if the task reports `changed`. Its value is a list, so a task can notify several handlers.
- **`handlers`** is a play-level section, at the same indentation as `tasks`. Each handler is a normal task, identified by its `name`.

A task can notify more than one handler:

```yaml
tasks:
  - name: copy demo.example.conf configuration template
    ansible.builtin.template:
      src: /var/lib/templates/demo.example.conf.template
      dest: /etc/httpd/conf.d/demo.example.conf
    notify:
      - restart mysql
      - restart apache

handlers:
  - name: restart mysql
    ansible.builtin.service:
      name: mariadb
      state: restarted

  - name: restart apache
    ansible.builtin.service:
      name: httpd
      state: restarted
```

## How handlers behave

Try it: flip tasks between `ok` and `changed`, and add a failure:

{% handler-timeline ref="handler-timeline" /%}

The rules the simulator follows:

{% steps %}
  {% step title="Only changed tasks notify" %}
    If the task reports `ok` (for example, the package was already installed) or `failed`, its handlers are **not** notified.
  {% /step %}
  {% step title="Handlers run after all tasks" %}
    A handler notified by the first task still waits until every task in the `tasks` section has run. (There are a few advanced exceptions.)
  {% /step %}
  {% step title="Each handler runs once" %}
    Even if five tasks notify the same handler, it runs a single time. That is exactly what you want for a service restart.
  {% /step %}
  {% step title="In handlers-section order" %}
    Handlers run in the order they are listed under `handlers`, not in the order they were notified, and not in the order of a task's `notify` list.
  {% /step %}
  {% step title="A failed play drops them" %}
    If a task fails and the play stops on that host, notified handlers do not run, unless the play sets `force_handlers: true` (covered in the task failure section).
  {% /step %}
{% /steps %}

{% callout type="note" title="Give handlers unique names" %}
Handler names live in one namespace per play. If two handlers share a name, only one of them runs.
{% /callout %}

{% callout type="important" title="Handlers are not a shortcut for tasks" %}
Handlers exist to perform an extra action when a task makes a change. Do not use them to replace normal tasks that should always run.
{% /callout %}

{% quiz
  objectives=["ch05.handlers"]
  id="check"
  title="Check your understanding"
  ref="check" /%}

## Takeaway

Write handlers and trigger them with `notify`. Use the chapter lab to check this on a real host.
