---
title: "Ansible roles and collections cheat sheet"
seoTitle: "Ansible roles and collections Cheat Sheet (RHCE)"
description: "Ansible roles and collections cheat sheet: the key commands and ideas on one page, with flashcards for revision. Free RHCE study notes."
kind: summary
minutes: 6
---

{% lead %}
The chapter on one page: the role layout, the commands for roles and collections, and flashcards for quick revision.
{% /lead %}

## The chapter in six sentences

- A **role** packages tasks with their variables, templates, files and handlers in a standard directory layout, so the work can be reused and shared.
- A play runs **`pre_tasks`, roles, `tasks`, `post_tasks`**, in that order, with pending handlers run between the stages.
- Settings a user may change go in **`defaults/main.yml`**; values in **`vars/main.yml`** are internal and outrank inventory and play variables.
- **`ansible-galaxy role init`** creates a role skeleton; **`ansible-galaxy role install -r roles/requirements.yml -p roles`** installs roles from Git repositories, archives or Galaxy, and `roles_path = roles` saves the `-p`.
- **System roles** configure common services through variables and are used by their collection name, such as `redhat.rhel_system_roles.timesync`; the selinux role reports a needed reboot by failing, which a `rescue` section handles.
- A **collection** is a versioned package of modules, roles and plug-ins, named `namespace.collection`, installed with **`ansible-galaxy collection install`** and found through **`collections_path`**.

## Cheat sheet

{% tabs %}
  {% tab label="Role layout" %}

```text
roles/web_site/
├── defaults/main.yml     settings, lowest precedence: meant to be overridden
├── vars/main.yml         internal values, high precedence
├── tasks/main.yml        the tasks (the only required file)
├── handlers/main.yml     handlers the tasks notify
├── templates/            Jinja2 templates, found by file name
├── files/                static files, found by file name
└── meta/main.yml         author, licence, dependencies
```

  {% /tab %}
  {% tab label="Using roles" %}

```yaml
- name: Web servers
  hosts: web
  pre_tasks:                      # 1
    - ansible.builtin.debug: { msg: before }
  roles:                          # 2
    - role: web_site
      vars:
        web_site_title: Staff intranet
    - redhat.rhel_system_roles.timesync
  tasks:                          # 3
    - name: A role, as a task
      ansible.builtin.include_role:
        name: monitoring
      when: monitor | bool
  post_tasks:                     # 4
    - ansible.builtin.debug: { msg: after }
```

  {% /tab %}
  {% tab label="Role commands" %}

```bash
ansible-galaxy role init roles/web_site
ansible-galaxy role install -r roles/requirements.yml -p roles
ansible-galaxy role list -p roles
ansible-galaxy role remove -p roles acme.banner
ls /usr/share/doc/rhel-system-roles/          # system role READMEs and examples
```

```yaml
# roles/requirements.yml
- src: https://git.example.com/ops/ansible-role-banner.git
  scm: git
  version: v1.2
  name: acme.banner
- src: file:///home/student/project/archives/acme.motd-1.0.tar.gz
  name: acme.motd
```

  {% /tab %}
  {% tab label="Collections" %}

```bash
ansible-galaxy collection list
ansible-galaxy collection install community.crypto:2.26.0 -p collections
ansible-galaxy collection install -r collections/requirements.yml -p collections
ansible-navigator doc community.crypto.openssl_privatekey -m stdout
```

```yaml
# collections/requirements.yml
collections:
  - name: community.crypto
    version: 2.26.0
```

```ini
# ansible.cfg
[defaults]
collections_path = ./collections:~/.ansible/collections:/usr/share/ansible/collections
```

  {% /tab %}
{% /tabs %}

| A variable set in | Beats |
| --- | --- |
| Role `defaults/main.yml` | Nothing |
| Inventory (`group_vars`, `host_vars`) | Role defaults |
| Play `vars` | Inventory |
| `vars:` on the role entry | Play `vars` |
| Role `vars/main.yml` | All of the above |
| Inline role parameter | Role `vars` |
| `-e` on the command line | Everything |

{% flashcards
  title="Chapter 8 flashcards"
  ref="flashcards" /%}

{% callout type="exam" title="Speed drill" %}
In 20 minutes, from an empty directory: create a role `login_banner` with a default `login_banner_text` that templates `/etc/issue`; write `roles/requirements.yml` and `collections/requirements.yml` for one role archive and one pinned collection and install both into the project; write a play that applies your role and `redhat.rhel_system_roles.timesync` to two hosts, with the banner text overridden for one of them from `host_vars`. Run it twice; the second run must show `changed=0`.
{% /callout %}
