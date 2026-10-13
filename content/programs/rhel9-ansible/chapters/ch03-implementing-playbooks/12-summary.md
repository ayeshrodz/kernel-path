---
title: "Ansible playbooks cheat sheet"
seoTitle: "Ansible playbooks Cheat Sheet (RHCE)"
description: "Ansible playbooks cheat sheet: the key commands and ideas on one page, with flashcards for revision. Free RHCE study notes."
kind: summary
minutes: 6
---

{% lead %}
Everything from chapter 3 that you should be able to do without notes, plus the commands and file templates worth memorising.
{% /lead %}

## The chapter in nine sentences

- A **play** is an ordered list of tasks that runs against hosts selected from the inventory.
- A **playbook** is a text file containing one or more plays, run in order.
- Playbooks are written in **YAML**, which uses **space indentation** (never tabs) to show structure.
- Plays are **idempotent**: they change nothing when the current state already matches the desired state.
- Tasks use **modules**, standard code that implements one kind of change.
- Modules are packaged in **Ansible Content Collections** and named by their **FQCN**, like `ansible.builtin.copy`.
- **`ansible-navigator doc`** lists the modules in your execution environment and shows their documentation and examples.
- **`ansible-navigator run`** runs playbooks and, with `--syntax-check`, validates them.
- **`ansible.cfg`** and **`ansible-navigator.yml`** in the project directory configure the inventory, connection user, privilege escalation and execution environment.

## Templates to memorise

{% tabs %}
  {% tab label="ansible.cfg" %}

```ini {% title="ansible.cfg" %}
[defaults]
inventory = ./inventory
remote_user = devops
ask_pass = false

[privilege_escalation]
become = true
become_method = sudo
become_user = root
become_ask_pass = false
```

  {% /tab %}
  {% tab label="ansible-navigator.yml" %}

```yaml {% title="ansible-navigator.yml" %}
---
ansible-navigator:
  execution-environment:
    image: utility.lab.example.com/ee-supported-rhel8:latest   # home lab: use  enabled: false  instead of image/pull
    pull:
      policy: missing
  playbook-artifact:
    enable: false
```

  {% /tab %}
  {% tab label="inventory" %}

```ini {% title="inventory" %}
[web]
server[a:b].lab.example.com

[db]
serverc.lab.example.com

[prod:children]
web
db
```

  {% /tab %}
  {% tab label="site.yml" %}

```yaml {% title="site.yml" %}
---
- name: Web server is configured
  hosts: web
  become: true
  tasks:
    - name: httpd is installed
      ansible.builtin.dnf:
        name: httpd
        state: present

    - name: httpd is started and enabled
      ansible.builtin.service:
        name: httpd
        state: started
        enabled: true

- name: Web server responds
  hosts: localhost
  become: false
  tasks:
    - name: Home page returns 200
      ansible.builtin.uri:
        url: http://servera.lab.example.com
        status_code: 200
```

  {% /tab %}
{% /tabs %}

## Command cheat sheet

| Goal | Command |
| --- | --- |
| Show one group as a tree | `ansible-navigator inventory -m stdout --graph GROUP` |
| Dump the whole inventory as JSON | `ansible-navigator inventory -m stdout --list` |
| Is this host in the inventory? | `ansible-navigator inventory -m stdout --host HOST` |
| Use a different inventory | add `-i PATH` to any command |
| See the effective configuration | `ansible-navigator config` |
| List modules in the EE | `ansible-navigator doc -l -m stdout` |
| Read a module's docs | `ansible-navigator doc MODULE -m stdout` |
| Browse collections | `ansible-navigator collections` |
| Check syntax | `ansible-navigator run -m stdout site.yml --syntax-check` |
| Dry run | `ansible-navigator run -m stdout site.yml --check` |
| Run | `ansible-navigator run -m stdout site.yml` |
| Run with more detail | add `-v` … `-vvvv` |
| Prompt for SSH password | add `--ask-pass` (artifacts disabled, `-m stdout`) |

| File | Lookup order (first found wins) |
| --- | --- |
| `ansible.cfg` | `$ANSIBLE_CONFIG` → `./ansible.cfg` → `~/.ansible.cfg` → `/etc/ansible/ansible.cfg` |
| `ansible-navigator.yml` | `$ANSIBLE_NAVIGATOR_CONFIG` → `./ansible-navigator.yml` → `~/.ansible-navigator.yml` |
| Connection user | `ansible_user` → play `remote_user` → `ansible.cfg` `remote_user` → root in the EE |

{% flashcards
  title="Chapter 3 flashcards"
  ref="flashcards" /%}

{% callout type="exam" title="Speed drill" %}
Set a 15-minute timer. From an empty directory, write `ansible.cfg`, `ansible-navigator.yml`, a grouped inventory and a two-play playbook that installs and starts a web server and then tests it. Run it twice; the second run must report `changed=0`. Repeat until you finish with time to spare.
{% /callout %}
