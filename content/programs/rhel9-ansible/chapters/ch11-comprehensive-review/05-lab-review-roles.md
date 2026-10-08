---
title: "Exercise: Creating roles"
seoTitle: "Creating roles: RHCE Exam-Style Practice Lab"
description: "Graded RHCE exam-style lab on Ansible final review: a challenge with requirements, hints and solutions, and a grader that checks your work on your own lab."
kind: lab
minutes: 35
---

{% lead %}
Turn a working playbook into a role: create the skeleton, move the variables, tasks, template, file and handler into it, document it, remove what it does not use, and apply it to two web servers with a three-line play. Solutions are hidden under each task. Try each one yourself first.
{% /lead %}

This lab covers chapters 6 and 8. The project `~/review-roles` has an `ansible.cfg`, an `inventory` with serverb and serverc in the `webdev` group, the playbook `ansible-httpd.yml`, its template `templates/httpd.conf.j2`, and `files/index.html`.

{% lab
  objectives=["ch11.reusable-roles"]
  id="review-roles"
  title="Creating roles"
  exercise="review-roles"
  hosts=["workstation","serverb.lab.example.com","serverc.lab.example.com"]
  outcomes=["Create a role from an existing playbook.","Create a playbook to apply the role to managed hosts."] %}
{% lab-notes %}

**Prerequisites:** Complete [control-node setup](#/ch01/control-node) and the preceding lessons in this chapter. Run commands as student on workstation unless a step names another machine.

{% reveal title="Verify your work" %}

From the project directory, run the relevant home-lab check. For an exercise with several checkpoints, grade each state before changing or removing it:

```bash
lab grade review-roles
```

The grader reads project files and host state. A passing report covers the listed checks; also perform the task’s independent connection, repeat-run, and reboot checks where requested.

{% /reveal %}

{% reveal title="Try an independent variation" %}

Expose one safe page setting as a role default and override it for only one target host.

Record the published result first. The grader checks the original requirements, so a changed name or value may intentionally fail those checks.

{% /reveal %}

{% /lab-notes %}

{% lab-challenge %}

Refactor `ansible-httpd.yml` into the reusable `ansible-httpd` role and apply it to `webdev` through `site.yml`.

- Retain all package, service, configuration, page, firewall, and handler behavior.
- Put each asset in its conventional role location; keep internal service values within the role.
- Document variables, dependencies, usage, author, and BSD license; remove unused skeleton directories.
- Verify the resulting web service and configuration on serverb and serverc. A repeat application must make no unintended change.

{% /lab-challenge %}

  {% lab-setup variant="homelab" %}
    Reset the servers first: `rht-vmctl reset servers` on the Ubuntu host.
  {% /lab-setup %}

  {% task id="task-9451fe9e663a" legacyIndex=1 title="Read the playbook" %}

```yaml {% title="ansible-httpd.yml" %}
---
- name: Install and configure the web server
  hosts: webdev
  vars:
    web_package: httpd
    web_service: httpd
    web_config_file: /etc/httpd/conf/httpd.conf
    web_root: /var/www/html/index.html
    web_fw_service: http

  tasks:
    - name: Packages are installed
      ...output omitted...
  handlers:
    - name: restart httpd
      ...output omitted...
```

    Five variables, five tasks (package, service, configuration file, page, firewall) and one handler.
  {% /task %}

  {% task id="task-084eed535c78" legacyIndex=2 title="Create the role skeleton" %}
    Create the role `ansible-httpd` in `~/review-roles/roles`.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ cd ~/review-roles
[student@workstation review-roles]$ mkdir -v roles
mkdir: created directory 'roles'
[student@workstation review-roles]$ cd roles
[student@workstation roles]$ ansible-galaxy init ansible-httpd
- Role ansible-httpd was created successfully
[student@workstation roles]$ cd ..
[student@workstation review-roles]$ tree roles
roles
└── ansible-httpd
    ├── defaults
    │   └── main.yml
    ├── files
    ├── handlers
    │   └── main.yml
    ├── meta
    │   └── main.yml
    ├── README.md
    ├── tasks
    │   └── main.yml
    ├── templates
    ├── tests
    │   ├── inventory
    │   └── test.yml
    └── vars
        └── main.yml

9 directories, 8 files
```
    {% /reveal %}
  {% /task %}

  {% task id="task-afa91065a15b" legacyIndex=3 title="Move everything into the role" %}
    Move the playbook's variables, tasks, template, file and handler into the right places in the role. The variables name fixed facts about the service, so they belong with the role's internal values.

    {% reveal title="Show solution" %}

```yaml {% title="roles/ansible-httpd/vars/main.yml" %}
---
# vars file for ansible-httpd
web_package: httpd
web_service: httpd
web_config_file: /etc/httpd/conf/httpd.conf
web_root: /var/www/html/index.html
web_fw_service: http
```

```console
[student@workstation review-roles]$ cp -v templates/httpd.conf.j2 roles/ansible-httpd/templates/
'templates/httpd.conf.j2' -> 'roles/ansible-httpd/templates/httpd.conf.j2'
[student@workstation review-roles]$ cp -v files/index.html roles/ansible-httpd/files/
'files/index.html' -> 'roles/ansible-httpd/files/index.html'
```

```yaml {% title="roles/ansible-httpd/tasks/main.yml" %}
---
# tasks file for ansible-httpd
- name: Packages are installed
  ansible.builtin.dnf:
    name: "{{ web_package }}"
    state: present

- name: Ensure service is started
  ansible.builtin.service:
    name: "{{ web_service }}"
    state: started
    enabled: true

- name: Deploy configuration file
  ansible.builtin.template:
    src: templates/httpd.conf.j2
    dest: "{{ web_config_file }}"
    owner: root
    group: root
    mode: '0644'
    setype: httpd_config_t
  notify: restart httpd

- name: Deploy index.html file
  ansible.builtin.copy:
    src: files/index.html
    dest: "{{ web_root }}"
    owner: root
    group: root
    mode: '0644'

- name: Web port is open
  ansible.posix.firewalld:
    service: "{{ web_fw_service }}"
    permanent: true
    state: enabled
    immediate: true
```

```yaml {% title="roles/ansible-httpd/handlers/main.yml" %}
---
# handlers file for ansible-httpd
- name: restart httpd
  ansible.builtin.service:
    name: "{{ web_service }}"
    state: restarted
```

    The tasks still say `src: templates/httpd.conf.j2` and `src: files/index.html`. Inside a role, Ansible looks for those paths in the role's own `templates/` and `files/` directories first, so they work unchanged.
    {% /reveal %}
  {% /task %}

  {% task id="task-97a0d8bb7979" legacyIndex=4 title="Describe the role" %}
    In `meta/main.yml`, set the author, a one-line description, your organisation as the company, and the licence `BSD`. In `README.md`, describe the role's variables, its dependencies (none), an example playbook, the licence and the author.

    {% reveal title="Show solution" %}

```yaml {% title="roles/ansible-httpd/meta/main.yml (galaxy_info)" %}
galaxy_info:
  author: Your Name
  description: Installs and configures the Apache web server
  company: Example Inc.
  license: BSD
  ...output omitted...
```

```text {% title="roles/ansible-httpd/README.md" %}
ansible-httpd
=============

Installs Apache, deploys its configuration and a default page, and opens
the firewall for it.

Role Variables
--------------

* vars/main.yml contains the name of the httpd package and service, the
  location of the service's configuration file, the path of the default
  page, and the name of the firewall service.

Dependencies
------------

None.

Example Playbook
----------------

    - hosts: servers
      roles:
        - ansible-httpd

License
-------

BSD

Author Information
------------------

Your Name (you@example.com)
```
    {% /reveal %}
  {% /task %}

  {% task id="task-010775a0a2b4" legacyIndex=5 title="Remove what the role does not use" %}
    {% reveal title="Show solution" %}

```console
[student@workstation review-roles]$ rm -rfv roles/ansible-httpd/defaults/ roles/ansible-httpd/tests/
removed 'roles/ansible-httpd/defaults/main.yml'
removed directory 'roles/ansible-httpd/defaults/'
removed 'roles/ansible-httpd/tests/test.yml'
removed 'roles/ansible-httpd/tests/inventory'
removed directory 'roles/ansible-httpd/tests/'
```
    {% /reveal %}
  {% /task %}

  {% task id="task-26c4a235e70c" legacyIndex=6 title="Apply the role" %}
    Write `site.yml`, which applies `ansible-httpd` to the `webdev` group, and run it.

    {% reveal title="Show solution" %}

```yaml {% title="site.yml" %}
---
- name: Apply the ansible-httpd role
  hosts: webdev

  roles:
    - ansible-httpd
```

```console
[student@workstation review-roles]$ ansible-navigator run -m stdout site.yml

PLAY [Apply the ansible-httpd role] ********************************************

TASK [Gathering Facts] *********************************************************
ok: [serverb.lab.example.com]
ok: [serverc.lab.example.com]

TASK [ansible-httpd : Packages are installed] **********************************
changed: [serverb.lab.example.com]
changed: [serverc.lab.example.com]

TASK [ansible-httpd : Ensure service is started] *******************************
changed: [serverb.lab.example.com]
changed: [serverc.lab.example.com]

TASK [ansible-httpd : Deploy configuration file] *******************************
changed: [serverb.lab.example.com]
changed: [serverc.lab.example.com]

TASK [ansible-httpd : Deploy index.html file] **********************************
changed: [serverb.lab.example.com]
changed: [serverc.lab.example.com]

TASK [ansible-httpd : Web port is open] ****************************************
changed: [serverb.lab.example.com]
changed: [serverc.lab.example.com]

RUNNING HANDLER [ansible-httpd : restart httpd] ********************************
changed: [serverb.lab.example.com]
changed: [serverc.lab.example.com]

PLAY RECAP *********************************************************************
serverb.lab.example.com    : ok=7    changed=6    unreachable=0    failed=0  ...
serverc.lab.example.com    : ok=7    changed=6    unreachable=0    failed=0  ...
[student@workstation review-roles]$ curl http://serverc.lab.example.com
This is the web server built by the ansible-httpd role.
```

    The template is installed with the SELinux type `httpd_config_t`, which `ls -Z /etc/httpd/conf/httpd.conf` on either server confirms. A second run reports `changed=0`.
    {% /reveal %}
  {% /task %}

  {% task id="task-583265e67b5a" legacyIndex=7 title="Grade and finish" %}
    {% lab-finish exercise="review-roles" grade=true /%}
  {% /task %}
{% /lab %}
