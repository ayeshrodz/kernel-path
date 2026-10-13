---
title: Describing role structure
seoTitle: "Ansible Role Directory Structure Explained"
description: "What each directory in an Ansible role does: tasks, handlers, templates, defaults and vars. Free RHCE (EX294) lesson with diagrams and practice."
kind: lesson
minutes: 12
---

{% lead %}
Task files let you reuse a list of tasks. A role goes further: it bundles tasks with the variables, templates, files and handlers they need, in a standard layout that Ansible understands. A well-made role can be dropped into any project and used with one line.
{% /lead %}

{% objectives %}
- Explain what a role is and why roles make playbooks easier to maintain.
- Name the directories of a role and what belongs in each.
- Use a role in a play, and predict the order in which roles, tasks and handlers run.
- Predict which value a role variable gets when it is set in several places.
{% /objectives %}

## What a role is

A **role** is a directory with a fixed structure. Each subdirectory has one job, and Ansible loads `main.yml` from each automatically. Because the layout is always the same, anyone who has seen one role can find their way around another.

Roles pay off in three ways:

- **Reuse.** Write "set up a web server" once; use it in every project that needs one.
- **Sharing.** A role is a self-contained folder, so it can be handed to a colleague, stored in its own repository, or published.
- **Shorter playbooks.** A play that uses roles reads like a summary: which hosts, which roles.

## The role layout

Select a file to see what it is for:

{% role-anatomy ref="role-anatomy" /%}

No individual file is mandatory: a role may provide tasks, variables, handlers, or files. A role that runs tasks normally uses `tasks/main.yml`. Leave out, or delete, any directory a role does not use.

| Directory | Holds |
| --- | --- |
| `tasks` | The tasks the role runs |
| `defaults` | Default variable values, meant to be overridden |
| `vars` | Variables internal to the role, not meant to be overridden |
| `handlers` | Handlers the role's tasks notify |
| `templates` | Jinja2 templates used by the role's tasks |
| `files` | Static files used by the role's tasks |
| `meta` | Information about the role, including its dependencies |

Inside a role, `template` and `copy` tasks refer to their source by file name alone. Ansible looks in the role's own `templates/` and `files/` directories first.

## Using a role in a play

List roles under the **`roles`** keyword of a play:

```yaml
- name: Web servers run the site
  hosts: web
  roles:
    - web_site
    - monitoring_agent
```

Ansible looks for each role in a `roles/` directory next to the playbook, then in the directories of the `roles_path` setting (by default `~/.ansible/roles`, `/usr/share/ansible/roles` and `/etc/ansible/roles`).

To set a role's variables for one play, give the role entry a `vars` section:

```yaml
  roles:
    - role: web_site
      vars:
        web_site_title: Staff intranet
```

## The order things run in

A play can contain roles and its own tasks. Ansible does not run them in the order they are written. It runs **`pre_tasks`**, then **`roles`**, then **`tasks`**, then **`post_tasks`**, with handler flushes after `pre_tasks`, after `roles` and `tasks` together, and after `post_tasks`. Select a step to see where it comes from:

{% play-order ref="play-order" /%}

Use `pre_tasks` for something that must happen before any role, such as taking a host out of a load balancer, and `post_tasks` for the matching step afterwards.

{% callout type="note" title="Roles as tasks" %}
You can also start a role from the task list, with `ansible.builtin.import_role` (static) or `ansible.builtin.include_role` (dynamic). They follow the same rules as `import_tasks` and `include_tasks` in chapter 7, and they run at that point in the task list rather than before it.

```yaml
  tasks:
    - name: Set up the site
      ansible.builtin.include_role:
        name: web_site
      when: deploy_site | bool
```
{% /callout %}

## Variables in a role

A role has two places for variables, and they behave very differently:

{% columns %}
{% column title="defaults/main.yml" tone="green" %}

The role's settings, with sensible starting values. They have the **lowest** precedence of anything in Ansible, so inventory, play variables and the command line can all override them.

{% /column %}
{% column title="vars/main.yml" tone="amber" %}

Values the role needs internally, such as a path that must not change. They have **high** precedence: inventory and play variables do not override them.

{% /column %}
{% /columns %}

Tick the places where a variable is set and see which value the role ends up with:

{% role-var-resolver ref="role-var-resolver" /%}

{% callout type="tip" title="Two habits for role variables" %}
**Put anything a user might change in `defaults`**, and keep `vars` for values that really are fixed.

**Prefix every variable with the role's name** (`web_site_title`, not `title`). All variables of a play share one namespace, so a generic name in one role can collide with the same name in another.
{% /callout %}

{% callout type="warning" title="Secrets do not belong in a role" %}
Pass passwords and keys into a role as variables from a Vault-encrypted file (chapter 4). A role with a secret inside it cannot be shared.
{% /callout %}

{% quiz
  objectives=["ch08.role-structure"]
  id="check"
  title="Check your understanding"
  ref="check" /%}

## Takeaway

Explain what a role is and why roles make playbooks easier to maintain. Use the chapter lab to check this on a real host.
