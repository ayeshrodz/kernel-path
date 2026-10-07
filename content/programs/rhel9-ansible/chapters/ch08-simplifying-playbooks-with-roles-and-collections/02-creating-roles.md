---
title: Creating roles
seoTitle: "How to Create an Ansible Role (ansible-galaxy init)"
description: "Create your own role with ansible-galaxy role init and use it from a playbook. Free RHCE (EX294) lesson with diagrams and practice."
kind: lesson
minutes: 10
---

{% lead %}
Writing a role is mostly a matter of putting things you already know how to write into the right directories. This section walks through the steps, from an empty skeleton to a role a play can use.
{% /lead %}

{% objectives %}
- Create a role skeleton with `ansible-galaxy role init`.
- Fill in tasks, defaults, handlers and templates.
- Declare dependencies on other roles.
- Follow the habits that make a role reusable.
{% /objectives %}

## Start from a skeleton

`ansible-galaxy role init` creates the standard directories with a `main.yml` in each:

```console
[student@workstation project]$ ansible-galaxy role init roles/web_site
- Role roles/web_site was created successfully
[student@workstation project]$ ls roles/web_site
defaults  files  handlers  meta  README.md  tasks  templates  tests  vars
```

Keeping a project's own roles in a `roles/` directory beside the playbooks means Ansible finds them without any configuration. Delete the directories you do not need; an empty `vars/` or `tests/` only adds noise.

## Write the tasks

`tasks/main.yml` is a task file: a list of tasks with no play around it.

```yaml {% title="roles/web_site/tasks/main.yml" %}
---
- name: Web packages are installed
  ansible.builtin.dnf:
    name: httpd
    state: present

- name: Site configuration is in place
  ansible.builtin.template:
    src: site.conf.j2
    dest: /etc/httpd/conf.d/site.conf
    mode: "0644"
  notify: restart httpd

- name: httpd is running
  ansible.builtin.service:
    name: httpd
    state: started
    enabled: true
```

A long role can split its tasks over several files and pull them in from `main.yml` with `import_tasks` or `include_tasks`, exactly as in chapter 7. Paths are relative to the role's `tasks/` directory.

## Give it defaults

Every value a user might reasonably change becomes a variable with a default:

```yaml {% title="roles/web_site/defaults/main.yml" %}
---
web_site_title: Welcome
web_site_admin: root@localhost
```

A role that works with no variables set at all is much easier to try out.

## Add handlers and templates

```yaml {% title="roles/web_site/handlers/main.yml" %}
---
- name: restart httpd
  ansible.builtin.service:
    name: httpd
    state: restarted
```

```jinja {% title="roles/web_site/templates/site.conf.j2" %}
# {{ ansible_managed }}
ServerAdmin {{ web_site_admin }}
ServerName {{ ansible_facts['fqdn'] }}
```

## Describe it in meta

`meta/main.yml` records who wrote the role and what it needs. The part that changes behaviour is **`dependencies`**: roles listed there run automatically **before** this one.

```yaml {% title="roles/web_site/meta/main.yml" %}
---
galaxy_info:
  author: your name
  description: Publishes a one-page web site with Apache
  license: MIT
  min_ansible_version: "2.14"

dependencies:
  - role: firewall_base
```

A dependency can pass its own variables to the role it pulls in:

```yaml
dependencies:
  - role: apache
    port: 8080
  - role: postgres
    dbname: serverlist
    admin_user: felix
```

A dependency runs **once per play**, however many roles in that play depend on it. If a role really must run every time it is listed, set `allow_duplicates: true` in that role's `meta/main.yml`.

{% callout type="note" title="Use dependencies sparingly" %}
A dependency is invisible from the playbook: a reader of the play cannot see that another role will run. Listing both roles in the play is often clearer. Keep dependencies for roles that truly cannot work without another.
{% /callout %}

## Use it

```yaml {% title="site.yml" %}
---
- name: Web servers run the site
  hosts: web
  roles:
    - role: web_site
      vars:
        web_site_title: Staff intranet
```

## Changing a role's behaviour with variables

A well-written role takes its settings from variables, so one role can serve many hosts. Where you set them decides whether they win:

| Set in | Overrides the role's `defaults/`? | Overrides the role's `vars/`? |
| --- | --- | --- |
| The inventory, `group_vars/` or `host_vars/` | Yes | No |
| The play's `vars:` | Yes | No |
| `vars:` under the role entry in `roles:` | Yes | No |
| A **role parameter**: a key written directly on the role entry | Yes | Yes |
| `include_vars`, `set_fact`, registered variables | Yes | Yes |

A role parameter looks like this, with the variable at the same level as `role:`:

```yaml
  roles:
    - role: motd
      system_owner: someone@host.example.com
```

That very high precedence is exactly why `vars/` is the place for values the role needs to work, and `defaults/` for everything a user is meant to change. Never put secrets in either: a role is meant to be shared. Let the playbook supply them, from an Ansible Vault file.

Task names in the output are prefixed with the role name, which shows at a glance where each task comes from:

```text
TASK [web_site : Web packages are installed] ***********************************
TASK [web_site : Site configuration is in place] *******************************
RUNNING HANDLER [web_site : restart httpd] *************************************
```

## What makes a role reusable

{% steps %}
  {% step title="One job" %}
    A role that installs a web server **and** a database is two roles. Small roles combine; large ones get copied and edited.
  {% /step %}
  {% step title="No host names, no site-specific values" %}
    Anything that differs between environments is a variable with a default. The role never mentions a particular host or group.
  {% /step %}
  {% step title="Prefixed variable names" %}
    `web_site_title`, `web_site_admin`. It avoids collisions and shows which role a variable belongs to.
  {% /step %}
  {% step title="Idempotent" %}
    Run the play twice; the second run must report `changed=0`. Use modules, not `command`, wherever a module exists.
  {% /step %}
  {% step title="Documented" %}
    List the variables and show an example play in `README.md`, and keep `meta/main.yml` accurate. Future you is the most likely reader.
  {% /step %}
  {% step title="Versioned" %}
    Keep each role in its own version control repository. Projects then pin the version they were tested with, and a bad change can be rolled back.
  {% /step %}
{% /steps %}

When a role does not quite fit a new case, improve the role (add a variable, split a task) rather than copying it into a near-duplicate. Test the change against the plays that already use it.

{% callout type="exam" title="Build the skeleton fast" %}
`ansible-galaxy role init roles/NAME`, fill `tasks/main.yml` and `defaults/main.yml`, write a three-line play that uses it, run it twice. Practise until that takes a few minutes; everything else about roles builds on it.
{% /callout %}

## Takeaway

Create a role skeleton with `ansible-galaxy role init`. Use the chapter lab to check this on a real host.
