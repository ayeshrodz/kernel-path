---
title: "Ansible task control cheat sheet"
seoTitle: "Ansible task control Cheat Sheet (RHCE)"
description: "Ansible task control cheat sheet: the key commands and ideas on one page, with flashcards for revision. Free RHCE study notes."
kind: summary
minutes: 6
---

{% lead %}
The chapter on one page: the rules to remember, the keywords in one place, and flashcards for quick revision.
{% /lead %}

## The chapter in six sentences

- **Loops** (`loop`, or the older `with_items`) run one task over a list of values, such as strings or dictionaries; `item` holds the current value.
- **Conditionals** (`when`) run a task, or skip it, host by host, based on variables, facts and registered results.
- **Handlers** are tasks that run at the end of the play, once, and only if notified.
- Handlers are notified only when a task reports that it **changed** something on the host.
- Tasks can **ignore** failures, **force handlers** to run after a failure, decide for themselves what counts as **failed** or **changed**, or stop the play with **`fail`**.
- **Blocks** group tasks, and with **`rescue`** and **`always`** they run recovery and clean-up tasks depending on whether the block succeeded.

## Cheat sheet

{% tabs %}
  {% tab label="Loops" %}

```yaml
- name: Users exist
  ansible.builtin.user:
    name: "{{ item['name'] }}"
    groups: "{{ item['groups'] }}"
  loop: "{{ users }}"          # quoted: starts with {{
  register: user_results       # results list, one per item

- ansible.builtin.debug:
    msg: "{{ item['item']['name'] }} changed: {{ item['changed'] }}"
  loop: "{{ user_results['results'] }}"
```

  {% /tab %}
  {% tab label="Conditionals" %}

```yaml
when: ansible_facts['distribution'] == "RedHat"      # string: quoted
when: ansible_facts['memtotal_mb'] >= 2048            # number: not quoted
when: my_var is defined                               # or: is not defined
when: ansible_facts['distribution'] in supported      # list membership
when: flag | bool                                     # string → Boolean
when:                                                 # list = and
  - cond_one
  - cond_two
when: >                                               # grouping
  (a == "x" and b == "y") or c == "z"
```

  {% /tab %}
  {% tab label="Handlers" %}

```yaml
tasks:
  - name: Config is deployed
    ansible.builtin.copy:
      src: app.conf
      dest: /etc/app.conf
    notify:
      - restart app

handlers:                     # same level as tasks
  - name: restart app         # must match notify exactly
    ansible.builtin.service:
      name: app
      state: restarted
```

  {% /tab %}
  {% tab label="Failure" %}

```yaml
- hosts: all
  force_handlers: true              # play level
  tasks:
    - name: Check config
      ansible.builtin.command: httpd -t
      register: check
      changed_when: false           # read-only: never "changed"
      failed_when: "'Syntax OK' not in check.stderr"
      ignore_errors: true           # keep going if it fails

    - name: Upgrade
      block:
        - ansible.builtin.command: /usr/local/bin/upgrade
      rescue:
        - ansible.builtin.command: /usr/local/bin/rollback
      always:
        - ansible.builtin.service:
            name: app
            state: restarted
```

  {% /tab %}
{% /tabs %}

| Keyword | Level | Effect |
| --- | --- | --- |
| `loop` / `with_items` | task | Run the task once per list item |
| `when` | task, block | Run only if the condition is true (per item with loops) |
| `register` | task | Save the task result (a `results` list for loops) |
| `notify` | task | Trigger handlers if the task reports changed |
| `handlers` | play | Tasks run once at the end of the play, if notified |
| `force_handlers` | play | Run notified handlers even after a failure |
| `ignore_errors` | task | Report failure but continue |
| `failed_when` | task | Your own rule for failure |
| `changed_when` | task | Your own rule for changed |
| `ansible.builtin.fail` | module | Fail on purpose with a message |
| `block` / `rescue` / `always` | task | Group, recover, clean up |

{% flashcards
  title="Chapter 5 flashcards"
  ref="flashcards" /%}

{% callout type="exam" title="Speed drill" %}
In 15 minutes: write a play that fails fast unless the host has at least 1 GB of RAM, installs and starts `httpd` and `firewalld` with a loop, deploys an `index.html` that notifies a handler to restart `httpd`, and wraps the deployment in a block whose rescue prints a message. Run it twice; the second run must show `changed=0` and no handler.
{% /callout %}
