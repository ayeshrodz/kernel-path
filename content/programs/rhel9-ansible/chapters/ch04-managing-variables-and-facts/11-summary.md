---
title: "Ansible variables and Vault cheat sheet"
seoTitle: "Ansible variables and Vault Cheat Sheet (RHCE)"
description: "Ansible variables and Vault cheat sheet: the key commands and ideas on one page, with flashcards for revision. Free RHCE study notes."
kind: summary
minutes: 6
---

{% lead %}
The chapter on one page: what to remember, the commands and patterns to have at your fingertips, and flashcards for quick revision.
{% /lead %}

## The chapter in eight sentences

- **Variables** let you reuse values across an entire Ansible project; reference them with `{{ name }}`, and quote the value when the reference comes first.
- You can define variables for **hosts and host groups** in the inventory, and preferably in **`host_vars`** and **`group_vars`** directories.
- You can define variables for **plays and tasks** in the playbook (`vars`) or in external files (`vars_files`).
- **Precedence** decides which value wins: narrower beats wider, the playbook beats the inventory, and **extra variables** (`-e`) beat everything.
- **Dictionaries** group related values; read them with `dict['key']` or `dict.key`.
- **`register`** captures a task's result in a variable for later tasks.
- **Ansible Vault** encrypts sensitive data such as passwords and keys, so the project can be shared safely.
- **Facts** are variables Ansible discovers from each managed host, stored in `ansible_facts`; you can add your own with **custom facts**.

## Cheat sheet

{% tabs %}
  {% tab label="Variables" %}

```yaml {% title="playbook.yml" %}
- name: Example play
  hosts: webservers
  vars:
    web_pkg: httpd
  vars_files:
    - vars/common.yml
    - vars/secret.yml          # may be Vault-encrypted
  tasks:
    - name: Install {{ web_pkg }}
      ansible.builtin.dnf:
        name: "{{ web_pkg }}"  # quoted: the value starts with {{
      register: install_result

    - ansible.builtin.debug:
        var: install_result['changed']
```

  {% /tab %}
  {% tab label="Project layout" %}

{% project-tree ref="project-tree" /%}

  {% /tab %}
  {% tab label="Facts" %}

```yaml
- name: Facts demo
  hosts: all
  gather_facts: true            # the default; false skips setup
  tasks:
    - ansible.builtin.debug:
        msg: >
          {{ ansible_facts['fqdn'] }} runs
          {{ ansible_facts['distribution'] }} {{ ansible_facts['distribution_version'] }}
          at {{ ansible_facts['default_ipv4']['address'] }}

    - name: Refresh or limit facts
      ansible.builtin.setup:
        gather_subset:
          - '!hardware'
```

  {% /tab %}
{% /tabs %}

| Vault task | Command |
| --- | --- |
| Create an encrypted file | `ansible-vault create secret.yml` |
| Read it | `ansible-vault view secret.yml` |
| Change it | `ansible-vault edit secret.yml` |
| Encrypt existing files | `ansible-vault encrypt a.yml b.yml` |
| Remove encryption | `ansible-vault decrypt a.yml [--output=plain.yml]` |
| Change the password | `ansible-vault rekey secret.yml` |
| Run with a prompt | `ansible-navigator run -m stdout --playbook-artifact-enable false site.yml --vault-id @prompt` |
| Run with a password file | `ansible-navigator run -m stdout site.yml --vault-password-file=vault-pass` |

| Want | Use |
| --- | --- |
| Override for one run | `-e "name=value"` |
| Every fact of a host | `ansible.builtin.debug: var=ansible_facts` |
| A custom fact | `ansible_facts['ansible_local']['FILE']['SECTION']['KEY']` |
| Another host's variables | `hostvars['HOST']['VAR']` |
| This host's groups | `group_names` |
| All groups and hosts | `groups` |
| This host's inventory name | `inventory_hostname` |

{% flashcards
  title="Chapter 4 flashcards"
  ref="flashcards" /%}

{% callout type="exam" title="Speed drill" %}
From an empty directory, in under 15 minutes: create `group_vars/all` with a package name, a Vault-encrypted `vars/secret.yml` with a user password hash, and a playbook that installs the package, creates the user with that password, and writes `{{ ansible_facts['fqdn'] }}` into `/etc/motd`. Run it with a password file, then run it again and confirm `changed=0`.
{% /callout %}
