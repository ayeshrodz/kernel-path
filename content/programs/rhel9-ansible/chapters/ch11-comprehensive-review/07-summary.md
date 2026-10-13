---
title: "Ansible final review cheat sheet"
seoTitle: "Ansible final review Cheat Sheet (RHCE)"
description: "Ansible final review cheat sheet: the key commands and ideas on one page, with flashcards for revision. Free RHCE study notes."
kind: summary
minutes: 12
---

{% lead %}
The whole course on one page: a sentence per chapter, the commands and file formats you reach for most, the module for each common job, and flashcards that mix every chapter.
{% /lead %}

## The course in nine sentences

1. **Ansible** connects over SSH from one control node, needs nothing installed on managed hosts but Python, and describes the state you want rather than the steps.
2. A **project** is a directory with its own `ansible.cfg` and **inventory**; plays in a **playbook** map groups of hosts to tasks that call modules.
3. **Variables** live in the inventory, `group_vars`, `host_vars`, plays and files; **facts** describe each host; **Ansible Vault** encrypts what must stay secret.
4. **Loops**, **conditions**, **handlers** and **blocks** decide what runs, how often, and what happens when something fails.
5. **Templates** turn one Jinja2 file into a different file on each host; file modules manage content, ownership, modes and SELinux contexts.
6. **Host patterns** select exactly the hosts you mean; **imports** and **includes** split large playbooks into reusable pieces.
7. **Roles** package tasks, defaults, templates and handlers; **collections** deliver roles and modules, including the **system roles**.
8. When a run fails, find the **stage** first (parse, connect, escalate, run), then use syntax checks, verbosity, check mode and diffs.
9. One module per administration job, for **software**, **users**, **services and schedules**, **storage** and **networking**, keeps every task idempotent.

## Cheat sheet

{% tabs %}
  {% tab label="Project" %}

```ini {% title="ansible.cfg" %}
[defaults]
inventory = ./inventory
remote_user = devops
roles_path = ./roles:/usr/share/ansible/roles
collections_path = ./collections:~/.ansible/collections:/usr/share/ansible/collections

[privilege_escalation]
become = true
become_method = sudo
become_user = root
become_ask_pass = false
```

```ini {% title="inventory" %}
[dev]
servera.lab.example.com

[prod]
server[c:d].lab.example.com

[webservers:children]
prod
```

```console
$ ansible-navigator inventory -m stdout --graph
$ ansible all -m ansible.builtin.ping
$ ansible-config dump --only-changed
$ ansible webservers -m ansible.builtin.command -a 'uptime'
```

  {% /tab %}
  {% tab label="Running" %}

```console
$ ansible-navigator run -m stdout site.yml --syntax-check
$ ansible-navigator run -m stdout site.yml --check --diff
$ ansible-navigator run -m stdout site.yml -v          # -vvv for connections
$ ansible-navigator run -m stdout site.yml --list-tasks
$ ansible-navigator run -m stdout site.yml --start-at-task "NAME"
$ ansible-navigator run -m stdout site.yml --step
$ ansible-navigator run -m stdout site.yml --limit servera.lab.example.com
$ ansible-navigator run -m stdout site.yml --vault-password-file vault-pass
$ ansible-doc -s MODULE        # task skeleton
$ ansible-doc MODULE           # full page, EXAMPLES at the end
```

  {% /tab %}
  {% tab label="Task control" %}

```yaml
- name: Web servers are configured
  hosts: webservers
  vars_files:
    - vars/users.yml
  tasks:
    - name: Users for this environment exist
      ansible.builtin.user:
        name: "{{ item['name'] }}"
      loop: "{{ users }}"
      when: item['env'] in group_names

    - name: Settings are in place
      ansible.builtin.template:
        src: templates/site.conf.j2
        dest: /etc/httpd/conf.d/site.conf
      notify: restart httpd

    - name: Try, recover, clean up
      block:
        - ansible.builtin.command: /usr/local/bin/migrate
          register: out
          changed_when: "'migrated' in out.stdout"
          failed_when: "'ERROR' in out.stdout"
      rescue:
        - ansible.builtin.debug:
            msg: Migration failed, rolled back
      always:
        - ansible.builtin.file:
            path: /tmp/migrate.lock
            state: absent

  handlers:
    - name: restart httpd
      ansible.builtin.service:
        name: httpd
        state: restarted
```

  {% /tab %}
  {% tab label="Vault" %}

```console
$ ansible-vault create secret.yml
$ ansible-vault view secret.yml
$ ansible-vault edit secret.yml
$ ansible-vault encrypt vars.yml
$ ansible-vault decrypt vars.yml
$ ansible-vault rekey secret.yml
$ ansible-vault encrypt_string 'Secret123' --name db_password
```

```yaml
password: "{{ db_password | password_hash('sha512', 'fixedsalt') }}"
```

  {% /tab %}
  {% tab label="Roles and collections" %}

```console
$ ansible-galaxy role init roles/NAME
$ ansible-galaxy role install -r roles/requirements.yml -p roles
$ ansible-galaxy role list
$ ansible-galaxy collection install -r collections/requirements.yml -p collections
$ ansible-galaxy collection list
```

```yaml {% title="roles/requirements.yml" %}
---
- src: file:///home/student/review-roles/archives/acme.motd-1.0.tar.gz
  name: acme.motd
- src: https://git.example.com/roles/web.git
  scm: git
  version: main
  name: web
```

```yaml {% title="collections/requirements.yml" %}
---
collections:
  - name: ansible.posix
    version: 1.5.4
  - name: community.general
```

  {% /tab %}
{% /tabs %}

## One module per job

| Job | Module or role |
| --- | --- |
| Install, update, remove packages | `ansible.builtin.dnf` |
| Add a repository and its key | `ansible.builtin.yum_repository`, `ansible.builtin.rpm_key` |
| Users, groups, SSH keys | `ansible.builtin.user`, `ansible.builtin.group`, `ansible.posix.authorized_key` |
| Services | `ansible.builtin.service`, `ansible.builtin.systemd` |
| Firewall | `ansible.posix.firewalld` |
| Files: create, copy, edit a line, a block | `file`, `copy`, `lineinfile`, `blockinfile` (all `ansible.builtin`) |
| A file per host from a template | `ansible.builtin.template` |
| SELinux booleans and file contexts | `ansible.posix.seboolean`, `community.general.sefcontext` |
| Scheduled jobs | `ansible.builtin.cron`, `ansible.posix.at` |
| Reboot and wait | `ansible.builtin.reboot` |
| Partitions, LVM, file systems, mounts | `community.general.parted`, `lvg`, `lvol`, `filesystem`, `ansible.posix.mount` |
| Network connections | `community.general.nmcli`, or the network system role |
| Time, SELinux, storage, network in one role | `redhat.rhel_system_roles.timesync`, `.selinux`, `.storage`, `.network` |
| Test a web page | `ansible.builtin.uri` |
| Show a value | `ansible.builtin.debug` |

{% flashcards
  title="Whole-course flashcards"
  ref="flashcards" /%}

## Where to go from here

{% cards cols=2 %}
  {% card title="Repeat the review labs" kicker="Speed" tone="purple" %}
    Reset the servers and do each review lab again from the start, timed. Stop when you finish every lab well inside the time with the solutions closed.
  {% /card %}
  {% card title="Do the speed drills" kicker="Breadth" tone="teal" %}
    The summaries of chapters 3 to 10 each end with a short timed drill. Work through all of them in one sitting, as one mixed session.
  {% /card %}
  {% card title="Break things on purpose" kicker="Troubleshooting" tone="amber" %}
    Take a working project, introduce one error, and have a friend do the same for you. Diagnosing a failure you did not cause is the fastest way to learn the error messages.
  {% /card %}
  {% card title="Read the module documentation" kicker="Depth" tone="coral" %}
    For every module in the table above, read the options and examples in `ansible-doc`. Most useful options are ones you have not needed yet.
  {% /card %}
{% /cards %}
