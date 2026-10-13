---
title: "Exercise: Including and importing files"
seoTitle: "Including and importing files (RHCE Practice Exercise)"
description: "Hands-on RHCE practice: including and importing files. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 20
---

{% lead %}
You will assemble a playbook almost entirely out of existing pieces: three task files, pulled into a play with one include and two imports, each given its own variables, and a whole play imported from another playbook to test the result.
{% /lead %}

The project `~/projects-file` has an `ansible.cfg`, an `inventory` with `servera.lab.example.com` and `workstation`, a `tasks` directory with three task files, and a `plays` directory with one playbook.

{% lab
  objectives=["ch07.reuse"]
  id="reuse"
  title="Including and importing files"
  exercise="projects-file"
  hosts=["workstation","servera.lab.example.com"]
  outcomes=["Include and import task files, and import a playbook, passing variables to each."] %}
{% lab-notes %}

**Prerequisites:** Complete [control-node setup](#/ch01/control-node) and the preceding lessons in this chapter. Run commands as student on workstation unless a step names another machine.

{% reveal title="Verify your work" %}

From the project directory, run the relevant home-lab check. For an exercise with several checkpoints, grade each state before changing or removing it:

```bash
lab grade projects-file
```

The grader reads project files and host state. A passing report covers the listed checks; also perform the task’s independent connection, repeat-run, and reboot checks where requested.

{% /reveal %}

{% reveal title="Try an independent variation" %}

Reuse the environment task file for a different service in a separate disposable play without editing that file.

Record the published result first. The grader checks the original requirements, so a changed name or value may intentionally fail those checks.

{% /reveal %}

{% /lab-notes %}

{% lab-challenge %}

Compose a web deployment from the supplied reusable files in `playbook.yml`.

- Servera must run Apache with the supplied placeholder page and persistent HTTP/HTTPS firewall access.
- Reuse `tasks/environment.yml` dynamically, and the firewall and placeholder task files statically, with parameters for their package, service, rule, and path values.
- Reuse `plays/test.yml` as a separate play to verify the deployed URL.
- Compare the task listing before a run with the tasks executed during the run. Explain which reused content can be expanded before execution.

{% /lab-challenge %}

  {% lab-setup variant="homelab" %}
    The last play runs on `workstation` itself, as the user `devops`, using the key set up in [section 1.6](#/ch01/control-node).
  {% /lab-setup %}

  {% task id="task-aa6c2eaea533" legacyIndex=1 title="Read the task files" %}

```console
[student@workstation ~]$ cd ~/projects-file
```

    None of the three files names a package, a service or a path. Everything that changes from one use to the next is a variable, to be filled in by whoever imports or includes the file.

```yaml {% title="tasks/environment.yml" %}
---
- name: Install the {{ package }} package
  ansible.builtin.dnf:
    name: "{{ package }}"
    state: latest

- name: Start the {{ service }} service
  ansible.builtin.service:
    name: "{{ service }}"
    enabled: true
    state: started
```

```yaml {% title="tasks/firewall.yml" %}
---
- name: Install the firewall
  ansible.builtin.dnf:
    name: "{{ firewall_pkg }}"
    state: latest

- name: Start the firewall
  ansible.builtin.service:
    name: "{{ firewall_svc }}"
    enabled: true
    state: started

- name: Open the port for {{ rule }}
  ansible.posix.firewalld:
    service: "{{ item }}"
    immediate: true
    permanent: true
    state: enabled
  loop: "{{ rule }}"
```

```yaml {% title="tasks/placeholder.yml" %}
---
- name: Create placeholder file
  ansible.builtin.copy:
    content: "{{ ansible_facts['fqdn'] }} has been customized using Ansible.\n"
    dest: "{{ file }}"
```

    `rule` in `firewall.yml` is a list: the loop opens one firewall service per item.
  {% /task %}

  {% task id="task-997baaaf812d" legacyIndex=2 title="Read the test play" %}
    `plays/test.yml` is a complete playbook with one play. It runs on workstation, without privilege escalation, and asks for a URL that it expects to answer with HTTP status 200:

```yaml {% title="plays/test.yml" %}
---
- name: Test web service
  hosts: workstation
  become: false
  tasks:
    - name: Connect to the web server
      ansible.builtin.uri:
        url: "{{ url }}"
        status_code: 200
```
  {% /task %}

  {% task id="task-ff87f0a04eed" legacyIndex=3 title="Start the playbook" %}
    Create `playbook.yml` with a play named `Configure web server` for `servera.lab.example.com`, and an empty `tasks:` section.

```yaml {% title="playbook.yml" %}
---
- name: Configure web server
  hosts: servera.lab.example.com
  tasks:
```
  {% /task %}

  {% task id="task-55c28157d3f7" legacyIndex=4 title="Include the environment tasks" %}
    As the first task, **include** `tasks/environment.yml`, with `package` and `service` both set to `httpd`:

```yaml
    - name: Include the environment task file and set the variables
      ansible.builtin.include_tasks: tasks/environment.yml
      vars:
        package: httpd
        service: httpd
```

    `vars` on an include or import applies only to the tasks it brings in.
  {% /task %}

  {% task id="task-2e6ea89f68e2" legacyIndex=5 title="Import the firewall tasks" %}
    As the second task, **import** `tasks/firewall.yml`. Install and start `firewalld`, and open both `http` and `https`:

```yaml
    - name: Import the firewall task file and set the variables
      ansible.builtin.import_tasks: tasks/firewall.yml
      vars:
        firewall_pkg: firewalld
        firewall_svc: firewalld
        rule:
          - http
          - https
```
  {% /task %}

  {% task id="task-d016c03a4c8a" legacyIndex=6 title="Import the placeholder task" %}
    As the third task, import `tasks/placeholder.yml` and have it write `/var/www/html/index.html`:

```yaml
    - name: Import the placeholder task file and set the variable
      ansible.builtin.import_tasks: tasks/placeholder.yml
      vars:
        file: /var/www/html/index.html
```
  {% /task %}

  {% task id="task-b498083be0f7" legacyIndex=7 title="Import the test play" %}
    After the first play, at the top level of the file, import `plays/test.yml` and set `url` to the new web server:

```yaml
- name: Import test play file and set the variable
  ansible.builtin.import_playbook: plays/test.yml
  vars:
    url: http://servera.lab.example.com
```

    {% reveal title="Show the complete playbook.yml" %}

```yaml {% title="playbook.yml" %}
---
- name: Configure web server
  hosts: servera.lab.example.com
  tasks:
    - name: Include the environment task file and set the variables
      ansible.builtin.include_tasks: tasks/environment.yml
      vars:
        package: httpd
        service: httpd

    - name: Import the firewall task file and set the variables
      ansible.builtin.import_tasks: tasks/firewall.yml
      vars:
        firewall_pkg: firewalld
        firewall_svc: firewalld
        rule:
          - http
          - https

    - name: Import the placeholder task file and set the variable
      ansible.builtin.import_tasks: tasks/placeholder.yml
      vars:
        file: /var/www/html/index.html

- name: Import test play file and set the variable
  ansible.builtin.import_playbook: plays/test.yml
  vars:
    url: http://servera.lab.example.com
```
    {% /reveal %}
  {% /task %}

  {% task id="task-03130d16fac6" legacyIndex=8 title="See the difference before running" %}
    Check the syntax, then list the tasks Ansible knows about before the run:

```console
[student@workstation projects-file]$ ansible-navigator run \
> -m stdout playbook.yml --syntax-check
playbook: /home/student/projects-file/playbook.yml
[student@workstation projects-file]$ ansible-navigator run \
> -m stdout playbook.yml --list-tasks

playbook: /home/student/projects-file/playbook.yml

  play #1 (servera.lab.example.com): Configure web server	TAGS: []
    tasks:
      Include the environment task file and set the variables	TAGS: []
      Install the firewall	TAGS: []
      Start the firewall	TAGS: []
      Open the port for {{ rule }}	TAGS: []
      Create placeholder file	TAGS: []

  play #2 (workstation): Test web service	TAGS: []
    tasks:
      Connect to the web server	TAGS: []
```

    The imported tasks are listed one by one, and the imported play appears as play 2. The include is a single line: what is inside `environment.yml` is not read until the play reaches that task.
  {% /task %}

  {% task id="task-94dedae9ac67" legacyIndex=9 title="Run it" %}

```console
[student@workstation projects-file]$ ansible-navigator run -m stdout playbook.yml

PLAY [Configure web server] ****************************************************

TASK [Gathering Facts] *********************************************************
ok: [servera.lab.example.com]

TASK [Include the environment task file and set the variables] *****************
included: /home/student/projects-file/tasks/environment.yml for servera.lab.example.com

TASK [Install the httpd package] ***********************************************
changed: [servera.lab.example.com]

TASK [Start the httpd service] *************************************************
changed: [servera.lab.example.com]

TASK [Install the firewall] ****************************************************
ok: [servera.lab.example.com]

TASK [Start the firewall] ******************************************************
ok: [servera.lab.example.com]

TASK [Open the port for ['http', 'https']] *************************************
changed: [servera.lab.example.com] => (item=http)
changed: [servera.lab.example.com] => (item=https)

TASK [Create placeholder file] *************************************************
changed: [servera.lab.example.com]

PLAY [Test web service] ********************************************************

TASK [Gathering Facts] *********************************************************
ok: [workstation]

TASK [Connect to the web server] ***********************************************
ok: [workstation]

PLAY RECAP *********************************************************************
servera.lab.example.com    : ok=8    changed=4    unreachable=0    failed=0  ...
workstation                : ok=2    changed=0    unreachable=0    failed=0  ...
```

    The `included:` line is where the include is processed during the run; the task names now show the values of the variables. `firewalld` was already installed and running, so those two tasks report `ok`.
  {% /task %}

  {% task id="task-c3518a0e7610" legacyIndex=10 title="Check the page" %}

```console
[student@workstation projects-file]$ curl http://servera.lab.example.com
servera.lab.example.com has been customized using Ansible.
```
  {% /task %}

  {% task id="task-d5655fd1e341" legacyIndex=11 title="Finish" %}
    {% lab-finish exercise="projects-file" /%}
  {% /task %}
{% /lab %}

## Try it again, differently

Change the first task from `include_tasks` to `import_tasks` and run `--list-tasks` again: the two httpd tasks now appear in the list, with `{{ package }}` and `{{ service }}` not yet filled in, because variables are only applied when the tasks run. Then add `when: false` to the firewall import and run the playbook: each of its three tasks is listed and skipped, because an import copies the condition onto every task.
