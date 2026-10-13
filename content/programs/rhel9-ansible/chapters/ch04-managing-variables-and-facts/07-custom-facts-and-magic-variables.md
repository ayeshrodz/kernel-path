---
title: Custom facts and magic variables
seoTitle: "Ansible Custom Facts and Magic Variables (hostvars)"
description: "Create custom facts in facts.d and use magic variables such as hostvars and groups. Free RHCE (EX294) lesson with diagrams and practice."
kind: lesson
minutes: 10
---

{% lead %}
Facts do not have to come only from Ansible. You can store your own facts on a managed host, and Ansible will pick them up with everything else. Ansible also provides a handful of magic variables that describe the inventory and the play itself.
{% /lead %}

{% objectives %}
- Create static custom facts in `/etc/ansible/facts.d`, and read them through `ansible_local`.
- Use `hostvars`, `group_names`, `groups` and `inventory_hostname`.
{% /objectives %}

## Custom facts

**Custom facts** are values you define on each managed host. Plays can use them to fill in configuration files or decide which tasks to run, so a host can effectively describe its own role.

They live in the **`/etc/ansible/facts.d`** directory of the managed host. When `setup` runs, it reads every file there whose name ends in **`.fact`** and adds the contents to the facts it reports.

- A **static** custom fact file is written in **INI** or **JSON** format.
- A **dynamic** custom fact is an **executable** `.fact` script that prints JSON.
- YAML is **not** accepted in fact files. JSON is the closest equivalent.

The same facts, in both formats:

{% columns %}
  {% column title="custom.fact (INI)" tone="amber" %}

```ini
[packages]
web_package = httpd
db_package = mariadb-server

[users]
user1 = joe
user2 = jane
```

  {% /column %}
  {% column title="custom.fact (JSON)" tone="blue" %}

```json
{
  "packages": {
    "web_package": "httpd",
    "db_package": "mariadb-server"
  },
  "users": {
    "user1": "joe",
    "user2": "jane"
  }
}
```

  {% /column %}
{% /columns %}

### Where they appear

Custom facts are stored under **`ansible_facts['ansible_local']`**, then the file name without `.fact`, then the section, then the key. For the file above:

```text
ansible_facts['ansible_local']['custom']['users']['user1']   →   joe
```

Edit this fact file, or rename it, and watch the path change:

{% custom-fact-builder ref="custom-fact-builder" /%}

To inspect the structure on a real host, print `ansible_local`:

```yaml
- name: Custom fact testing
  hosts: demo1.example.com
  gather_facts: true
  tasks:
    - name: Display all facts in ansible_local
      ansible.builtin.debug:
        var: ansible_local
```

Then use custom facts exactly like built-in ones:

```yaml
- hosts: all
  tasks:
    - name: Prints various Ansible facts
      ansible.builtin.debug:
        msg: >
          The package to install on {{ ansible_facts['fqdn'] }}
          is {{ ansible_facts['ansible_local']['custom']['packages']['web_package'] }}
```

```text
ok: [demo1.example.com] => {
    "msg": "The package to install on demo1.example.com  is httpd"
}
```

{% callout type="tip" title="Custom facts in INI are strings" %}
Values from an INI fact file arrive as strings, so `enabled = true` becomes the text `"true"`. Modules such as `ansible.builtin.service` accept that happily for their boolean options, which is what the next exercise relies on.
{% /callout %}

## Magic variables

Ansible also sets some variables itself, describing the inventory and the current host. Their names are **reserved**: do not define your own variables with these names. The four you will use most:

{% glossary %}
  {% term name="hostvars" %}The variables of every managed host, keyed by host name. Use it to read another host's variables, for example `hostvars['demo2.example.com']`. It includes another host's facts only after they have been gathered, earlier in the play or by a previous play.{% /term %}
  {% term name="group_names" %}The list of groups the current host belongs to.{% /term %}
  {% term name="groups" %}Every group in the inventory, with the hosts in each.{% /term %}
  {% term name="inventory_hostname" %}The current host's name as written in the inventory. It can differ from the host name reported by facts, for example when the inventory uses an alias.{% /term %}
{% /glossary %}

Pick the host a task is running on and see what each one contains:

{% magic-variables ref="magic-variables" /%}

For example, this task prints the network interfaces of `demo2.example.com` from whichever host runs it, as long as facts for demo2 were already gathered:

```yaml
- name: Print list of network interfaces for demo2
  ansible.builtin.debug:
    var: hostvars['demo2.example.com']['ansible_facts']['interfaces']
```

The same works for ordinary variables, not just facts. The task above runs once on every host in the play; later chapters show more efficient ways to share one host's data with others.

{% callout type="note" %}
Ansible has several more special variables. The full list is in the Ansible documentation, under *Special Variables*.
{% /callout %}

{% quiz
  objectives=["ch04.variables","ch04.vault","ch04.facts"]
  id="check"
  title="Check your understanding"
  ref="check" /%}

## Takeaway

Create static custom facts in `/etc/ansible/facts.d`, and read them through `ansible_local`. Use the chapter lab to check this on a real host.
