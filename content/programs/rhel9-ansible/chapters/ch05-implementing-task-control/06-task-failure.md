---
title: Handling task failure
seoTitle: "Ansible Error Handling: block, rescue, ignore_errors"
description: "Control task failure with ignore_errors, failed_when, changed_when, block, rescue and always. Free RHCE (EX294) lesson with diagrams and practice."
kind: lesson
minutes: 12
---

{% lead %}
By default, the first failed task ends the play for that host. Sometimes that is exactly right; sometimes you expect a failure, want to recover from it, or need to redefine what "failed" and "changed" mean for a command. Ansible gives you a keyword for each case.
{% /lead %}

{% objectives %}
- Keep a play running after a failure with `ignore_errors`, and still run handlers with `force_handlers`.
- Decide yourself when a task has failed (`failed_when`, `ansible.builtin.fail`) or changed (`changed_when`).
- Group tasks with `block`, and recover with `rescue` and `always`.
{% /objectives %}

## How Ansible decides a task failed

Ansible looks at what each task returns (for commands, mainly the return code) to decide whether it succeeded. When a task fails, Ansible normally **skips all remaining tasks on that host**, while the other hosts carry on.

## ignore_errors: keep going

Add **`ignore_errors: true`** to a task that is allowed to fail. The failure is still reported, but the play continues on that host:

```yaml
- name: Latest version of notapkg is installed
  ansible.builtin.dnf:
    name: notapkg
    state: latest
  ignore_errors: true
```

The recap counts it under `ignored=1` instead of `failed=1`. This handles a task that ran and returned a failure; it does not suppress syntax errors or an unreachable host.

## force_handlers: run handlers even after a failure

Normally, if a later task fails, handlers that were already notified **never run** for that host. Set **`force_handlers: true`** on the play to run them anyway:

```yaml
- hosts: all
  force_handlers: true
  tasks:
    - name: a task which always notifies its handler
      ansible.builtin.command: /bin/true
      notify: restart the database

    - name: a task which fails because the package doesn't exist
      ansible.builtin.dnf:
        name: notapkg
        state: latest

  handlers:
    - name: restart the database
      ansible.builtin.service:
        name: mariadb
        state: restarted
```

`force_handlers` does not notify anything by itself. It only makes sure handlers that were **already notified** (by a task that reported `changed`) run despite a task failure. An unreachable host can still prevent them from running.

{% callout type="note" %}
If a task fails but has `ignore_errors: true`, the play keeps running, so the handlers run at the end as usual, even without `force_handlers`.
{% /callout %}

## Redefining failed and changed

Commands run with `ansible.builtin.command` or `ansible.builtin.shell` are judged only by their return code, and they report `changed` on every run. Two keywords let you apply your own rules. Try them:

{% task-outcome ref="task-outcome" /%}

### failed_when

A script may exit with `0` even though it printed an error. **`failed_when`** sets the condition that means failure:

```yaml
- name: Run user creation script
  ansible.builtin.shell: /usr/local/bin/create_users.sh
  register: command_result
  failed_when: "'Password missing' in command_result.stdout"
```

The same result can be reached with the **`ansible.builtin.fail`** module, which fails with a clear message of your own. Splitting it into two tasks also lets you run other tasks (or roll back) between the check and the failure:

```yaml
- name: Run user creation script
  ansible.builtin.shell: /usr/local/bin/create_users.sh
  register: command_result
  ignore_errors: true

- name: Report script failure
  ansible.builtin.fail:
    msg: "The password is missing in the output"
  when: "'Password missing' in command_result.stdout"
```

### changed_when

A command that only **reads** information should never report `changed`. **`changed_when: false`** makes it report `ok`:

```yaml
- name: Validate httpd configuration
  ansible.builtin.command: httpd -t
  changed_when: false
  register: httpd_config_status
```

A condition can decide instead. Here the task reports `changed`, and so notifies its handler, only when the output says "Success":

```yaml
tasks:
  - ansible.builtin.shell:
      cmd: /usr/local/bin/upgrade-database
    register: command_result
    changed_when: "'Success' in command_result.stdout"
    notify:
      - restart_database

handlers:
  - name: restart_database
    ansible.builtin.service:
      name: mariadb
      state: restarted
```

{% callout type="exam" title="changed_when: false for read-only commands" %}
If an exercise uses `command` or `shell` only to check something, add `changed_when: false`. It keeps the second run at `changed=0` and stops the task from notifying handlers by accident.
{% /callout %}

## Blocks

A **`block`** groups tasks into one unit. Keywords set on the block apply to every task inside, which is handy for putting one `when` on several tasks:

```yaml
- name: block example
  hosts: all
  tasks:
    - name: installing and configuring DNF versionlock plugin
      block:
        - name: package needed by dnf
          ansible.builtin.dnf:
            name: python3-dnf-plugin-versionlock
            state: present
        - name: lock version of tzdata
          ansible.builtin.lineinfile:
            dest: /etc/yum/pluginconf.d/versionlock.list
            line: tzdata-2016j-1
            state: present
      when: ansible_facts['distribution'] == "RedHat"
```

### Error handling with rescue and always

Blocks become really useful with two companion sections:

{% cards cols=3 %}
  {% card title="block" tone="blue" %}
    The main tasks to run.
  {% /card %}
  {% card title="rescue" tone="amber" %}
    Runs only if a task in **block** failed. Use it to recover or roll back.
  {% /card %}
  {% card title="always" tone="teal" %}
    Runs after block and rescue for ordinary task outcomes. Invalid task definitions and unreachable hosts do not trigger it.
  {% /card %}
{% /cards %}

{% block-flow ref="block-flow" /%}

```yaml
tasks:
  - name: Upgrade DB
    block:
      - name: upgrade the database
        ansible.builtin.shell:
          cmd: /usr/local/lib/upgrade-database
    rescue:
      - name: revert the database upgrade
        ansible.builtin.shell:
          cmd: /usr/local/lib/revert-database
    always:
      - name: always restart the database
        ansible.builtin.service:
          name: mariadb
          state: restarted
```

A `when` on the block applies to its `rescue` and `always` sections too. If `rescue` handles the failure successfully, the host is counted as `rescued` rather than failed, and the play continues.

{% quiz
  objectives=["ch05.failure"]
  id="check"
  title="Check your understanding"
  ref="check" /%}

## Takeaway

Keep a play running after a failure with `ignore_errors`, and still run handlers with `force_handlers`. Use the chapter lab to check this on a real host.
