---
title: "Exercise: Managing complex plays and playbooks"
seoTitle: "Ansible complex playbooks Practice Lab (RHCE Exam Style)"
description: "Graded RHCE exam-style lab on Ansible complex playbooks: a challenge with requirements, hints and solutions, and a grader that checks your work on your own lab."
kind: lab
minutes: 30
---

{% lead %}
You have inherited a working playbook from the previous administrator of four web servers. It does its job, but it lists every host by hand and keeps every task in one play. Make it easier to maintain with a host pattern, task files and one reusable, parameterised task file. Solutions are hidden under each task. Try each one yourself first.
{% /lead %}

The project `~/projects-review` has an `ansible.cfg`, an `inventory`, the inherited `playbook.yml`, a small `host-test.yml` for trying out patterns, and `files/tune.conf`.

{% lab
  objectives=["ch07.patterns","ch07.reuse"]
  id="review"
  title="Managing Complex Plays and Playbooks"
  exercise="projects-review"
  hosts=["workstation","servera.lab.example.com","serverb.lab.example.com","serverc.lab.example.com","serverd.lab.example.com"]
  outcomes=["Simplify the hosts of a play with a host pattern.","Move tasks into task files and import them.","Replace similar tasks with one task file driven by variables."] %}
{% lab-notes %}

**Prerequisites:** Complete [control-node setup](#/ch01/control-node) and the preceding lessons in this chapter. Run commands as student on workstation unless a step names another machine.

{% reveal title="Verify your work" %}

From the project directory, run the relevant home-lab check. For an exercise with several checkpoints, grade each state before changing or removing it:

```bash
lab grade projects-review
```

The grader reads project files and host state. A passing report covers the listed checks; also perform the task’s independent connection, repeat-run, and reboot checks where requested.

{% /reveal %}

{% reveal title="Try an independent variation" %}

Parameterize the tuning-file destination and explain which layer should supply its value.

Record the published result first. The grader checks the original requirements, so a changed name or value may intentionally fail those checks.

{% /reveal %}

{% /lab-notes %}

{% lab-challenge %}

Refactor the inherited playbook without changing the desired host state.

- One wildcard host pattern must select exactly servera through serverd; verify it with `host-test.yml`.
- Web and firewall work must be separated into `tasks/web_tasks.yml` and `tasks/firewall_tasks.yml`.
- Their shared package-and-service behavior must appear once in `tasks/install_and_enable.yml`, parameterized by `package` and `service`.
- The refactored `playbook.yml` must leave both services running, HTTP allowed, and the supplied tuning configuration installed. Repeat it and check for unintended changes.

{% /lab-challenge %}

  {% task id="task-be615ad83aee" legacyIndex=1 title="Read the inherited playbook" %}

```console
[student@workstation ~]$ cd ~/projects-review
[student@workstation projects-review]$ cat playbook.yml
```

```yaml {% title="playbook.yml (as inherited)" %}
---
- name: Install and configure web service
  hosts:
    - servera.lab.example.com
    - serverb.lab.example.com
    - serverc.lab.example.com
    - serverd.lab.example.com
  tasks:
    - name: Install httpd
      ansible.builtin.dnf:
        name: httpd
        state: latest

    - name: Enable and start httpd
      ansible.builtin.service:
        name: httpd
        enabled: true
        state: started

    - name: Tuning configuration installed
      ansible.builtin.copy:
        src: files/tune.conf
        dest: /etc/httpd/conf.d/tune.conf
        owner: root
        group: root
        mode: "0644"
      notify:
        - restart httpd

    - name: Install firewalld
      ansible.builtin.dnf:
        name: firewalld
        state: latest

    - name: Enable and start the firewall
      ansible.builtin.service:
        name: firewalld
        enabled: true
        state: started

    - name: Open the port for http
      ansible.posix.firewalld:
        service: http
        immediate: true
        permanent: true
        state: enabled

  handlers:
    - name: restart httpd
      ansible.builtin.service:
        name: httpd
        state: restarted
```

    Six tasks in two groups of three: the web server, then the firewall. Both groups start with the same two steps: install a package, then enable and start its service.
  {% /task %}

  {% task id="task-1e99ea301edf" legacyIndex=2 title="Replace the host list with a pattern" %}
    Find one wildcard pattern that selects exactly the four servers. Test it in `host-test.yml` first, then use it in `playbook.yml`.

    {% reveal title="Show solution" %}

    Put the pattern in `host-test.yml` and run it:

```yaml {% title="host-test.yml" %}
---
- name: List inventory hostnames
  hosts: server*.lab.example.com
  gather_facts: false
  tasks:
    - name: List inventory hostnames
      ansible.builtin.debug:
        msg: "{{ inventory_hostname }}"
```

```console
[student@workstation projects-review]$ ansible-navigator run -m stdout host-test.yml
...output omitted...
ok: [servera.lab.example.com] => {
    "msg": "servera.lab.example.com"
}
ok: [serverb.lab.example.com] => {
    "msg": "serverb.lab.example.com"
}
ok: [serverc.lab.example.com] => {
    "msg": "serverc.lab.example.com"
}
ok: [serverd.lab.example.com] => {
    "msg": "serverd.lab.example.com"
}
...output omitted...
```

    Exactly the four servers, so replace the list in `playbook.yml`:

```yaml
- name: Install and configure web service
  hosts: server*.lab.example.com
```
    {% /reveal %}
  {% /task %}

  {% task id="task-1cec2f186611" legacyIndex=3 title="Move the web tasks to a task file" %}
    Move the first three tasks into `tasks/web_tasks.yml`, and import that file where they were.

    {% reveal title="Show solution" %}

```console
[student@workstation projects-review]$ mkdir tasks
```

```yaml {% title="tasks/web_tasks.yml" %}
---
- name: Install httpd
  ansible.builtin.dnf:
    name: httpd
    state: latest

- name: Enable and start httpd
  ansible.builtin.service:
    name: httpd
    enabled: true
    state: started

- name: Tuning configuration installed
  ansible.builtin.copy:
    src: files/tune.conf
    dest: /etc/httpd/conf.d/tune.conf
    owner: root
    group: root
    mode: "0644"
  notify:
    - restart httpd
```

    In `playbook.yml`, in place of the three tasks:

```yaml
    - name: Import the web_tasks.yml task file
      ansible.builtin.import_tasks: tasks/web_tasks.yml
```

    The handler stays in the play. A task in an imported file can notify it, because handlers are looked up in the play.
    {% /reveal %}
  {% /task %}

  {% task id="task-a3859838baf8" legacyIndex=4 title="Move the firewall tasks to a task file" %}
    Do the same with the last three tasks, in `tasks/firewall_tasks.yml`.

    {% reveal title="Show solution" %}

```yaml {% title="tasks/firewall_tasks.yml" %}
---
- name: Install firewalld
  ansible.builtin.dnf:
    name: firewalld
    state: latest

- name: Enable and start the firewall
  ansible.builtin.service:
    name: firewalld
    enabled: true
    state: started

- name: Open the port for http
  ansible.posix.firewalld:
    service: http
    immediate: true
    permanent: true
    state: enabled
```

```yaml
    - name: Import the firewall_tasks.yml task file
      ansible.builtin.import_tasks: tasks/firewall_tasks.yml
```
    {% /reveal %}
  {% /task %}

  {% task id="task-eed91fb253ed" legacyIndex=5 title="One task file for both install-and-start steps" %}
    Both task files begin with the same pattern: install a package, enable and start a service. Write that pattern once, in `tasks/install_and_enable.yml`, with the variables `package` and `service`. Then replace those two tasks in `web_tasks.yml` and in `firewall_tasks.yml` with an import of the new file, passing the right values.

    {% reveal title="Show solution" %}

```yaml {% title="tasks/install_and_enable.yml" %}
---
- name: Install {{ package }}
  ansible.builtin.dnf:
    name: "{{ package }}"
    state: latest

- name: Enable and start {{ service }}
  ansible.builtin.service:
    name: "{{ service }}"
    enabled: true
    state: started
```

```yaml {% title="tasks/web_tasks.yml" %}
---
- name: Install and start httpd
  ansible.builtin.import_tasks: install_and_enable.yml
  vars:
    package: httpd
    service: httpd

- name: Tuning configuration installed
  ansible.builtin.copy:
    src: files/tune.conf
    dest: /etc/httpd/conf.d/tune.conf
    owner: root
    group: root
    mode: "0644"
  notify:
    - restart httpd
```

```yaml {% title="tasks/firewall_tasks.yml" %}
---
- name: Install and start firewalld
  ansible.builtin.import_tasks: install_and_enable.yml
  vars:
    package: firewalld
    service: firewalld

- name: Open the port for http
  ansible.posix.firewalld:
    service: http
    immediate: true
    permanent: true
    state: enabled
```

    Inside a task file, the path of another task file is relative to the file doing the importing, so `install_and_enable.yml` needs no `tasks/` prefix. `files/tune.conf`, on the other hand, is still found next to the playbook.
    {% /reveal %}
  {% /task %}

  {% task id="task-9993dfa2fde9" legacyIndex=6 title="Check the finished playbook, then run it" %}

    {% reveal title="Show the finished playbook.yml" %}

```yaml {% title="playbook.yml" %}
---
- name: Install and configure web service
  hosts: server*.lab.example.com
  tasks:
    - name: Import the web_tasks.yml task file
      ansible.builtin.import_tasks: tasks/web_tasks.yml

    - name: Import the firewall_tasks.yml task file
      ansible.builtin.import_tasks: tasks/firewall_tasks.yml

  handlers:
    - name: restart httpd
      ansible.builtin.service:
        name: httpd
        state: restarted
```
    {% /reveal %}

```console
[student@workstation projects-review]$ ansible-navigator run \
> -m stdout playbook.yml --syntax-check
playbook: /home/student/projects-review/playbook.yml
[student@workstation projects-review]$ ansible-navigator run -m stdout playbook.yml

PLAY [Install and configure web service] ***************************************

TASK [Gathering Facts] *********************************************************
ok: [servera.lab.example.com]
...output omitted...

TASK [Install httpd] ***********************************************************
changed: [servera.lab.example.com]
...output omitted...

TASK [Enable and start httpd] **************************************************
changed: [servera.lab.example.com]
...output omitted...

TASK [Tuning configuration installed] ******************************************
changed: [servera.lab.example.com]
...output omitted...

TASK [Install firewalld] *******************************************************
ok: [servera.lab.example.com]
...output omitted...

TASK [Enable and start firewalld] **********************************************
ok: [servera.lab.example.com]
...output omitted...

TASK [Open the port for http] **************************************************
changed: [servera.lab.example.com]
...output omitted...

RUNNING HANDLER [restart httpd] ************************************************
changed: [servera.lab.example.com]
...output omitted...

PLAY RECAP *********************************************************************
servera.lab.example.com    : ok=8    changed=5    unreachable=0    failed=0  ...
serverb.lab.example.com    : ok=8    changed=5    unreachable=0    failed=0  ...
serverc.lab.example.com    : ok=8    changed=5    unreachable=0    failed=0  ...
serverd.lab.example.com    : ok=8    changed=5    unreachable=0    failed=0  ...
```

    The task names come from the shared file, with the variables filled in. Run it again: every host reports `ok=7 changed=0`, one fewer `ok` because the handler is not notified.
  {% /task %}

  {% task id="task-2763bf19327e" legacyIndex=7 title="Verify" %}

```console
[student@workstation projects-review]$ ssh devops@serverc \
> 'cat /etc/httpd/conf.d/tune.conf; systemctl is-active httpd firewalld; sudo firewall-cmd --list-services'
# Keep-alive tuning for the web servers
KeepAlive On
MaxKeepAliveRequests 200
KeepAliveTimeout 3
active
active
cockpit dhcpv6-client http ssh
```

    In a classroom, the content of `tune.conf` may differ; what matters is that it is there, and that both services run with `http` allowed.
  {% /task %}

  {% task id="task-5ab3d2084dae" legacyIndex=8 title="Grade and finish" %}
    {% lab-finish exercise="projects-review" grade=true /%}
  {% /task %}
{% /lab %}
