---
title: "Ansible files and templates cheat sheet"
seoTitle: "Ansible files and templates Cheat Sheet (RHCE)"
description: "Ansible files and templates cheat sheet: the key commands and ideas on one page, with flashcards for revision. Free RHCE study notes."
kind: summary
minutes: 6
---

{% lead %}
The chapter on one page: what each file module is for, the template syntax in one place, and flashcards for quick revision.
{% /lead %}

## The chapter in six sentences

- The file modules in **`ansible.builtin`** and **`ansible.posix`** cover most file work: creating, copying, editing, fetching, checking and removing files.
- `file`, `copy` and `template` share the **attribute arguments**: `owner`, `group`, `mode`, and the SELinux fields such as `setype`.
- **`lineinfile`** and **`blockinfile`** change part of an existing file; **`stat`** reads a file's status into a registered variable.
- **Jinja2 templates** build a file dynamically: fixed text plus variables and expressions that are replaced with each host's values when the template is rendered.
- **`ansible.builtin.template`** renders a template on the control node and deploys the result to the managed hosts.
- **Filters** turn a value into another form or format on its way into the file.

## Cheat sheet

{% tabs %}
  {% tab label="Files" %}

```yaml
- ansible.builtin.file:             # attributes, directories, links, removal
    path: /srv/app
    state: directory                # touch | directory | link | absent
    owner: app
    group: app
    mode: '0750'                    # quoted, leading zero
    setype: httpd_sys_content_t

- ansible.builtin.copy:             # control node -> managed host
    src: files/app.conf             # or  content: "text\n"
    dest: /etc/app.conf
    mode: '0644'
    force: false                    # only if missing

- ansible.builtin.fetch:            # managed host -> control node
    src: /var/log/secure
    dest: backups                   # backups/HOST/var/log/secure
```

  {% /tab %}
  {% tab label="Edit and check" %}

```yaml
- ansible.builtin.lineinfile:
    path: /etc/ssh/sshd_config
    regexp: '^#?PermitRootLogin'    # replace the last match...
    line: PermitRootLogin no        # ...or append this line
    state: present

- ansible.builtin.blockinfile:
    path: /etc/hosts
    block: |
      172.25.250.10 servera
      172.25.250.11 serverb
    marker: "# {mark} LAB HOSTS"    # optional custom markers

- ansible.builtin.stat:
    path: /etc/motd
  register: motd

- ansible.builtin.debug:
    msg: "present"
  when: motd.stat.exists
```

  {% /tab %}
  {% tab label="Template task" %}

```yaml
- name: Deploy the configuration
  ansible.builtin.template:
    src: templates/app.conf.j2      # on the control node
    dest: /etc/app.conf             # on the managed host
    owner: root
    group: root
    mode: '0644'
    validate: /usr/sbin/app --check %s
  notify: restart app
```

```ini
# ansible.cfg
[defaults]
ansible_managed = Ansible managed
```

  {% /tab %}
  {% tab label="Jinja2" %}

```jinja
# {{ ansible_managed }}
{# a comment: not in the output #}
Listen {{ ansible_facts['default_ipv4']['address'] }}:{{ http_port }}

{% for host in groups['all'] %}
{{ hostvars[host]['ansible_facts']['default_ipv4']['address'] }} {{ host }}
{% endfor %}

{% for u in users if u != "root" %}
{{ loop.index }}: {{ u }}
{% endfor %}

{% if ansible_facts['memtotal_mb'] >= 2048 %}
workers 8
{% else %}
workers 2
{% endif %}

{{ settings | to_nice_yaml }}
{{ owner | default('nobody') }}
```

  {% /tab %}
{% /tabs %}

| You want to | Module |
| --- | --- |
| Copy a file, or write inline text | `ansible.builtin.copy` |
| Deploy a per-host file | `ansible.builtin.template` |
| Attributes, directory, link, remove | `ansible.builtin.file` |
| One line in a file | `ansible.builtin.lineinfile` |
| A block of lines in a file | `ansible.builtin.blockinfile` |
| Bring a file back | `ansible.builtin.fetch` |
| Status or checksum | `ansible.builtin.stat` |
| Sync a directory tree (rsync) | `ansible.posix.synchronize` |

{% flashcards
  title="Chapter 6 flashcards"
  ref="flashcards" /%}

{% callout type="exam" title="Speed drill" %}
In 15 minutes: write `templates/hosts.j2` that lists the address, FQDN and short name of every host in the inventory, deploy it to `/etc/myhosts` on all hosts with mode `0644`, and add a task that fails unless a `stat` of the file shows it is owned by `root`. Run it twice; the second run must show `changed=0`.
{% /callout %}
