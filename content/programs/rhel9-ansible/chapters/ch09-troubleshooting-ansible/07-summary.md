---
title: "Ansible troubleshooting cheat sheet"
seoTitle: "Ansible troubleshooting Cheat Sheet (RHCE)"
description: "Ansible troubleshooting cheat sheet: the key commands and ideas on one page, with flashcards for revision. Free RHCE study notes."
kind: summary
minutes: 6
---

{% lead %}
The chapter on one page: which tool answers which question, the messages you will meet most, and flashcards for quick revision.
{% /lead %}

## The chapter in six sentences

- An `ERROR!` before any play means the playbook could not be read; `UNREACHABLE!` means Ansible could not connect; `FAILED!` means it connected and the task failed.
- **`--syntax-check`** finds reading problems in a second, without touching any host; variables, values and templates are only tested when tasks run.
- **Verbosity** (`-v` to `-vvvv`), **`debug`** tasks and a **`log_path`** show what Ansible did and with which values.
- **`--start-at-task`**, **`--step`** and **`--limit`** rerun only the part you are fixing; **`--check`** and **`--diff`** preview a change without making it.
- Connection problems are solved with **`ansible … -m ansible.builtin.ping`**, **`ansible-navigator inventory --host`** and `-vvv`; privilege problems show up as `FAILED`, not `UNREACHABLE`.
- A successful run is not a working service: test the result with **`uri`**, **`stat`**, **`assert`** or ad hoc commands.

## Cheat sheet

{% tabs %}
  {% tab label="Playbook tools" %}

```bash
ansible-navigator run -m stdout site.yml --syntax-check
ansible-navigator run -m stdout site.yml -v              # up to -vvvv
ansible-navigator run -m stdout site.yml --list-tasks
ansible-navigator run -m stdout site.yml --start-at-task "Task name"
ansible-navigator run -m stdout site.yml --check --diff
ansible-navigator run -m stdout site.yml --limit servera.lab.example.com
ansible-navigator replay -m stdout site-artifact-….json   # a saved run, again
ansible-lint site.yml                                    # style and good practice
```

```ini
# ansible.cfg
[defaults]
log_path = ./ansible.log
```

  {% /tab %}
  {% tab label="Host tools" %}

```bash
ansible all -m ansible.builtin.ping
ansible-navigator inventory -m stdout --host serverb.lab.example.com
ansible serverc.lab.example.com -m ansible.builtin.ping -vvv
ansible web -m ansible.builtin.command -a id --become
ansible web -m ansible.builtin.setup -a 'filter=ansible_default_ipv4'
ansible web -m ansible.builtin.command -a 'systemctl is-active httpd'
```

  {% /tab %}
  {% tab label="Checks in playbooks" %}

```yaml
- ansible.builtin.debug:
    var: web_service
    verbosity: 2                  # only shown with -vv or more

- ansible.builtin.assert:
    that:
      - ansible_facts['memtotal_mb'] >= 512
    fail_msg: Not enough memory

- ansible.builtin.uri:
    url: http://servera.lab.example.com
    return_content: true
  register: page
  failed_when: "'Welcome' not in page.content"
```

  {% /tab %}
{% /tabs %}

| Message contains | Look at |
| --- | --- |
| `found unacceptable key` … `{{ }}` | Quote a value that starts with `{{` |
| `conflicting action statements` | Indentation of the task's arguments |
| `couldn't resolve module/action` | Module spelling, collection, `collections_path` |
| `Could not match supplied host pattern` | The play's `hosts` against the inventory |
| `Could not resolve hostname` / `No route to host` | Inventory name, `ansible_host` |
| `Permission denied (publickey…)` | `remote_user`, `ansible_user`, SSH keys |
| `Missing sudo password` / `not writable` | `become` and sudo rights |
| `is undefined` | Variable name, where it is defined |
| `must be one of` | The argument's value; the module's documentation |
| `template error while templating string` | Braces and tags in the template |
| `handler … was not found` | `notify` against the handler's `name` |

{% flashcards
  title="Chapter 9 flashcards"
  ref="flashcards" /%}

{% callout type="exam" title="Speed drill" %}
Ask someone to break one of your earlier projects in three places without telling you where, or break it yourself and wait a day. Find all three in under ten minutes using only the messages and the tools on this page.
{% /callout %}
