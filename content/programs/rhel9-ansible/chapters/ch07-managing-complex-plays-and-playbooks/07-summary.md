---
title: "Ansible complex playbooks cheat sheet"
seoTitle: "Ansible complex playbooks Cheat Sheet (RHCE)"
description: "Ansible complex playbooks cheat sheet: the key commands and ideas on one page, with flashcards for revision. Free RHCE study notes."
kind: summary
minutes: 6
---

{% lead %}
The chapter on one page: the pattern syntax in one place, the difference between importing and including, and flashcards for quick revision.
{% /lead %}

## The chapter in six sentences

- A **host pattern** selects hosts from the inventory by name: a host, a group, a wildcard, or a comma-separated list of those.
- **`&`** keeps only hosts that are also in a group and **`!`** removes hosts; whatever the order, plain terms are added first, then intersections, then exclusions.
- **`--limit`** narrows the hosts of every play for one run, and **`--list-hosts`** shows the result without running anything.
- **`import_playbook`** combines whole playbooks; **task files** hold a plain list of tasks that many plays can reuse.
- **`import_tasks`** is static: the file is read when the playbook is parsed. **`include_tasks`** is dynamic: the file is read when the task runs.
- Pass **`vars:`** to an import or include so that one task file can do different work each time it is used.

## Cheat sheet

{% tabs %}
  {% tab label="Patterns" %}

```yaml
hosts: all                          # everything
hosts: web                          # a group (and its children)
hosts: web,db                       # union
hosts: 'web,&production'            # in web AND in production
hosts: 'web,!staging'               # web except staging
hosts: '*.lab.example.com'          # wildcard: host and group names
hosts: '~server[ab]\.'              # regular expression
hosts: 'web[0]'                     # first host of web; [-1] last; [0:1] first two
```

  {% /tab %}
  {% tab label="Command line" %}

```bash
ansible 'web,!staging' --list-hosts                  # test a pattern
ansible-navigator run -m stdout site.yml --list-hosts  # hosts of each play
ansible-navigator run -m stdout site.yml --list-tasks  # tasks (imports expanded)
ansible-navigator run -m stdout site.yml --limit canary
ansible-navigator run -m stdout site.yml --limit 'all,!canary'
```

  {% /tab %}
  {% tab label="Playbooks" %}

```yaml
# site.yml: top level only
- name: Web tier
  ansible.builtin.import_playbook: web.yml

- name: Database tier
  ansible.builtin.import_playbook: db.yml
```

  {% /tab %}
  {% tab label="Task files" %}

```yaml
# tasks/install.yml: a list of tasks, nothing else
- name: Packages are installed
  ansible.builtin.dnf:
    name: "{{ packages }}"
    state: present
```

```yaml
tasks:
  - name: Packages                          # static
    ansible.builtin.import_tasks: tasks/install.yml
    vars:
      packages: [httpd, firewalld]

  - name: Firewall services                 # dynamic, once per item
    ansible.builtin.include_tasks: tasks/firewall.yml
    loop: [http, https]

  - name: TLS                               # dynamic, loaded only if true
    ansible.builtin.include_tasks: tasks/tls.yml
    when: enable_tls | bool
```

  {% /tab %}
{% /tabs %}

| | `import_tasks` | `include_tasks` |
| --- | --- | --- |
| Read | At parse time | At run time |
| `when` | Applied to each task inside | Decides once whether to load the file |
| `loop` | Error | Yes |
| File name from facts | No | Yes |
| `--list-tasks`, `--start-at-task` | See inside | See only the include |

{% flashcards
  title="Chapter 7 flashcards"
  ref="flashcards" /%}

{% callout type="exam" title="Speed drill" %}
In 15 minutes: write `tasks/user.yml` that creates one user from a variable `username`, a playbook `users.yml` that includes it in a loop over three names for the hosts in `'web,!staging'`, and a `site.yml` that imports `users.yml`. Show the affected hosts with `--list-hosts` before you run it, and run it twice; the second run must show `changed=0`.
{% /callout %}
