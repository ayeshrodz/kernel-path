---
title: "Exercise: Creating roles"
seoTitle: "Creating roles (RHCE Practice Exercise)"
description: "Hands-on RHCE practice: creating roles. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 25
---

{% lead %}
You will turn the setup of an Apache virtual host into a role, `myvhost`: a skeleton from `ansible-galaxy`, tasks, a handler and a template. Then you will use it from a play that also has tasks before and after the role, and check the result with three small verification playbooks.
{% /lead %}

The project `~/role-create` has an `ansible.cfg`, an `inventory` with `servera.lab.example.com` in the `webservers` group, a template `vhost.conf.j2`, and three playbooks named `verify-*.yml`.

{% lab
  objectives=["ch08.role-structure","ch08.role-create"]
  id="role-create"
  title="Creating roles"
  exercise="role-create"
  hosts=["workstation","servera.lab.example.com"]
  outcomes=["Create a role that uses variables and a handler, and use it in a play together with pre_tasks and post_tasks."] %}
{% lab-notes %}

**Prerequisites:** Complete [control-node setup](#/ch01/control-node) and the preceding lessons in this chapter. Run commands as student on workstation unless a step names another machine.

{% reveal title="Verify your work" %}

From the project directory, run the relevant home-lab check. For an exercise with several checkpoints, grade each state before changing or removing it:

```bash
lab grade role-create
```

The grader reads project files and host state. A passing report covers the listed checks; also perform the task’s independent connection, repeat-run, and reboot checks where requested.

{% /reveal %}

{% reveal title="Try an independent variation" %}

Apply the role to one additional lab host with a different host name and verify its document root.

Record the published result first. The grader checks the original requirements, so a changed name or value may intentionally fail those checks.

{% /reveal %}

{% /lab-notes %}

{% lab-challenge %}

Build `myvhost` as a reusable role and apply it through `use-vhost-role.yml` to `webservers`.

- The role must install Apache, start and enable it, and deploy the supplied virtual-host template with a restart on configuration change.
- Keep the template and handler within the role; web-page content belongs to this project outside the role.
- The play must announce before/after stages and publish the page to the host-specific document root.
- Verify configuration, content, handler timing, and a repeat run. At home, HTTP must also be allowed through the firewall.

{% /lab-challenge %}

  {% task id="task-e4c4bd1f3087" legacyIndex=1 title="Create the role skeleton" %}

```console
[student@workstation ~]$ cd ~/role-create
[student@workstation role-create]$ mkdir -v roles
mkdir: created directory 'roles'
[student@workstation role-create]$ cd roles
[student@workstation roles]$ ansible-galaxy init myvhost
- Role myvhost was created successfully
```

    This role needs no defaults, internal variables or tests. Remove those directories, then go back to the project:

```console
[student@workstation roles]$ rm -rvf myvhost/{defaults,vars,tests}
removed 'myvhost/defaults/main.yml'
removed directory 'myvhost/defaults'
removed 'myvhost/vars/main.yml'
removed directory 'myvhost/vars'
removed 'myvhost/tests/test.yml'
removed 'myvhost/tests/inventory'
removed directory 'myvhost/tests'
[student@workstation roles]$ cd ..
```

    `ansible-galaxy init` and `ansible-galaxy role init` are the same command; the short form is older.
  {% /task %}

  {% task id="task-64ceffee5269" legacyIndex=2 title="Write the tasks" %}
    Replace the contents of `roles/myvhost/tasks/main.yml` with three tasks: install `httpd`, start and enable it, and install the virtual host configuration from a template, notifying a handler.

```yaml {% title="roles/myvhost/tasks/main.yml" %}
---
# tasks file for myvhost
- name: Ensure httpd is installed
  ansible.builtin.dnf:
    name: httpd
    state: latest

- name: Ensure httpd is started and enabled
  ansible.builtin.service:
    name: httpd
    state: started
    enabled: true

- name: vhost file is installed
  ansible.builtin.template:
    src: vhost.conf.j2
    dest: /etc/httpd/conf.d/vhost.conf
    owner: root
    group: root
    mode: "0644"
  notify:
    - restart httpd
```

    `src: vhost.conf.j2` has no directory: inside a role, the `template` module looks in the role's own `templates/` directory.
  {% /task %}

  {% task id="task-a78e0f11ee8c" legacyIndex=3 title="Write the handler" %}

```yaml {% title="roles/myvhost/handlers/main.yml" %}
---
# handlers file for myvhost
- name: restart httpd
  ansible.builtin.service:
    name: httpd
    state: restarted
```
  {% /task %}

  {% task id="task-b4b81791c8b3" legacyIndex=4 title="Move the template into the role" %}
    Look at the template the project provides. Every host-specific value comes from a fact, so the role needs no variables of its own:

```jinja {% title="vhost.conf.j2" %}
# {{ ansible_managed }}

<VirtualHost *:80>
    ServerAdmin webmaster@{{ ansible_facts['fqdn'] }}
    ServerName {{ ansible_facts['fqdn'] }}
    ErrorLog logs/{{ ansible_facts['hostname'] }}-error.log
    CustomLog logs/{{ ansible_facts['hostname'] }}-common.log common
    DocumentRoot /var/www/vhosts/{{ ansible_facts['hostname'] }}/

    <Directory /var/www/vhosts/{{ ansible_facts['hostname'] }}/>
        Options +Indexes +FollowSymlinks +Includes
        Require all granted
    </Directory>
</VirtualHost>
```

```console
[student@workstation role-create]$ mv -v vhost.conf.j2 roles/myvhost/templates/
renamed 'vhost.conf.j2' -> 'roles/myvhost/templates/vhost.conf.j2'
```
  {% /task %}

  {% task id="task-f74d95e3a150" legacyIndex=5 title="Create the web content" %}
    The content is not part of the role: it belongs to this project. Put it in `files/html/`:

```console
[student@workstation role-create]$ mkdir -pv files/html
mkdir: created directory 'files'
mkdir: created directory 'files/html'
[student@workstation role-create]$ echo 'simple index' > files/html/index.html
```
  {% /task %}

  {% task id="task-259c8427fef7" legacyIndex=6 title="Use the role in a play" %}
    Create `use-vhost-role.yml`. The play for `webservers` prints a message **before** the role, applies `myvhost`, then copies the content and prints a message **after** it:

```yaml {% title="use-vhost-role.yml" %}
---
- name: Use myvhost role playbook
  hosts: webservers
  pre_tasks:
    - name: pre_tasks message
      ansible.builtin.debug:
        msg: 'Ensure web server configuration.'

  roles:
    - myvhost

  post_tasks:
    - name: HTML content is installed
      ansible.builtin.copy:
        src: files/html/
        dest: "/var/www/vhosts/{{ ansible_facts['hostname'] }}"

    - name: post_tasks message
      ansible.builtin.debug:
        msg: 'Web server is configured.'
```

    The trailing `/` on `src: files/html/` copies the **contents** of the directory. Without it, `copy` would create an `html` directory inside the destination.
  {% /task %}

  {% task id="task-484b454c474c" legacyIndex=7 title="Run it" %}

```console
[student@workstation role-create]$ ansible-navigator run \
> -m stdout use-vhost-role.yml --syntax-check
playbook: /home/student/role-create/use-vhost-role.yml
[student@workstation role-create]$ ansible-navigator run -m stdout use-vhost-role.yml

PLAY [Use myvhost role playbook] ***********************************************

TASK [Gathering Facts] *********************************************************
ok: [servera.lab.example.com]

TASK [pre_tasks message] *******************************************************
ok: [servera.lab.example.com] => {
    "msg": "Ensure web server configuration."
}

TASK [myvhost : Ensure httpd is installed] *************************************
changed: [servera.lab.example.com]

TASK [myvhost : Ensure httpd is started and enabled] ***************************
changed: [servera.lab.example.com]

TASK [myvhost : vhost file is installed] ***************************************
changed: [servera.lab.example.com]

RUNNING HANDLER [myvhost : restart httpd] **************************************
changed: [servera.lab.example.com]

TASK [HTML content is installed] ***********************************************
changed: [servera.lab.example.com]

TASK [post_tasks message] ******************************************************
ok: [servera.lab.example.com] => {
    "msg": "Web server is configured."
}

PLAY RECAP *********************************************************************
servera.lab.example.com    : ok=8    changed=5    unreachable=0    failed=0  ...
```

    Notice where the handler ran: after the role's tasks and **before** `post_tasks`. Handlers notified in each stage of a play run at the end of that stage.
  {% /task %}

  {% task id="task-4419805ccd19" legacyIndex=8 title="Verify the service" %}
    The project's verification playbooks each run a command and print what it returned:

```console
[student@workstation role-create]$ ansible-navigator run -m stdout verify-httpd.yml
...output omitted...
TASK [Is the httpd service installed] ******************************************
ok: [servera.lab.example.com] => {
    "installed.stdout": "httpd-2.4.62-13.el9_8.6.x86_64"
}
...output omitted...
TASK [Is the httpd service started] ********************************************
ok: [servera.lab.example.com] => {
    "started.stdout": "active"
}
...output omitted...
TASK [Is the httpd service enabled] ********************************************
ok: [servera.lab.example.com] => {
    "enabled.stdout": "enabled"
}
...output omitted...
```

    The exact `httpd` version depends on your repositories.
  {% /task %}

  {% task id="task-a1af029d5819" legacyIndex=9 title="Verify the configuration and the content" %}

```console
[student@workstation role-create]$ ansible-navigator run -m stdout verify-config.yml
...output omitted...
TASK [What does the httpd config file contain] *********************************
ok: [servera.lab.example.com] => {
    "config.stdout_lines": [
        "# Ansible managed",
        "",
        "<VirtualHost *:80>",
        "    ServerAdmin webmaster@servera.lab.example.com",
        "    ServerName servera.lab.example.com",
...output omitted...
[student@workstation role-create]$ ansible-navigator run -m stdout verify-content.yml
...output omitted...
TASK [What does the index.html file contain] ***********************************
ok: [servera.lab.example.com] => {
    "content.stdout": "simple index"
}
...output omitted...
```

    Finally, ask the web server itself:

    {% variant-group %}
      {% variant name="classroom" %}

```console
[student@workstation role-create]$ curl http://servera.lab.example.com
simple index
```
      {% /variant %}
      {% variant name="homelab" %}
        The home-lab servers run `firewalld` with only SSH open, and this role does not touch the firewall. Open `http` with an ad hoc command first, then ask:

```console
[student@workstation role-create]$ ansible webservers -m ansible.posix.firewalld \
> -a 'service=http permanent=true immediate=true state=enabled'
servera.lab.example.com | CHANGED => {
...output omitted...
[student@workstation role-create]$ curl http://servera.lab.example.com
simple index
```
      {% /variant %}
    {% /variant-group %}

    Run `use-vhost-role.yml` once more: `ok=7 changed=0`. Nothing changed, so the handler did not run.
  {% /task %}

  {% task id="task-4898882665f2" legacyIndex=10 title="Finish" %}
    {% lab-finish exercise="role-create" /%}
  {% /task %}
{% /lab %}

## Try it again, differently

Give the role a `defaults/main.yml` with `vhost_admin: webmaster`, use it in the template as `ServerAdmin {{ vhost_admin }}@{{ ansible_facts['fqdn'] }}`, and override it in the play with `vars:` under the role entry. Run it and look at the diff with `--diff`.
