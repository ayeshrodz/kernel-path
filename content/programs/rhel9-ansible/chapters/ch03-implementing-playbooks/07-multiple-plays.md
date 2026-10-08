---
title: Implementing multiple plays
seoTitle: "Ansible Playbook With Multiple Plays and become"
description: "Use several plays in one playbook, privilege escalation with become and per-play settings. Free RHCE (EX294) lesson with diagrams and practice."
kind: lesson
minutes: 10
---

{% lead %}
A playbook can contain as many plays as you need. Each play targets its own hosts and can use its own connection and privilege settings, so one playbook can orchestrate a whole deployment across different machines.
{% /lead %}

{% objectives %}
- Write a playbook with several plays.
- Override the remote user and privilege escalation per play.
- Know the order Ansible uses to pick the connection user.
{% /objectives %}

## Writing multiple plays

A playbook is a YAML list of plays, and a play is an ordered list of tasks against hosts from the inventory. So a playbook with several plays simply has several top-level list items, each with the usual play keys.

This is handy for multi-step orchestration: configure the web tier in one play, then the database tier in the next.

```yaml {% title="site.yml" %}
---
# This is a simple playbook with two plays

- name: First play
  hosts: web.example.com
  tasks:
    - name: First task
      ansible.builtin.dnf:
        name: httpd
        state: present

    - name: Second task
      ansible.builtin.service:
        name: httpd
        enabled: true

- name: Second play
  hosts: database.example.com
  tasks:
    - name: First task
      ansible.builtin.service:
        name: mariadb
        enabled: true
```

The second play only starts once the first has finished on all of its hosts.

{% diagram ref="multi-play-flow" /%}

## Per-play users and privilege escalation

Plays can use a different remote user or privilege settings from the defaults in `ansible.cfg`. Set them in the play itself, at the same level as `hosts` and `tasks`.

### The remote user

Tasks run over a connection to each managed host, so Ansible needs a user to log in as. With `ansible-navigator run`, the default is the current user **inside the execution environment**, which is `root`. You can change it in `ansible.cfg` with `remote_user`, or override it for one play:

```yaml
remote_user: remoteuser
```

{% precedence-resolver ref="precedence-resolver" /%}

### Privilege escalation

The `become` keyword enables or disables escalation for one play (or one task), overriding `ansible.cfg`. It accepts `yes`/`true` or `no`/`false`.

```yaml
become: true
```

If escalation is on, `become_method` and `become_user` choose how and to whom:

```yaml
become_method: sudo
become_user: privileged_user
```

Put together, a play that connects as `automation`, becomes root with sudo, and edits `/etc/hosts` looks like this:

```yaml {% title="hosts.yml" %}
- name: /etc/hosts is up-to-date
  hosts: datacenter-west
  remote_user: automation
  become: true

  tasks:
    - name: server.example.com in /etc/hosts
      ansible.builtin.lineinfile:
        path: /etc/hosts
        line: '192.0.2.42 server.example.com server'
        state: present
```

{% callout type="exam" title="Escalate only where needed" %}
A common pattern: leave `become` off in `ansible.cfg`, set `become: true` on the plays that change the system, and `become: false` on plays that only test or query (like a play against `localhost` that checks a web page).
{% /callout %}

## Plays that run on localhost

A play with `hosts: localhost` runs its tasks without SSH. With `ansible-navigator`, **localhost is the execution environment container**, not your workstation itself. That makes it a good place for testing tasks, for example requesting a URL from a managed web server:

```yaml
- name: Test intranet web server
  hosts: localhost
  become: false
  tasks:
    - name: Connect to intranet web server
      ansible.builtin.uri:
        url: http://servera.lab.example.com
        return_content: true
        status_code: 200
```

`ansible.builtin.uri` fails the task unless the server answers with the expected `status_code`, so a green run means the site is really up.

{% quiz
  objectives=["ch03.inventory","ch03.configuration","ch03.playbooks","ch03.modules"]
  id="check"
  title="Check your understanding"
  ref="check" /%}

## Takeaway

Write a playbook with several plays. Use the chapter lab to check this on a real host.
