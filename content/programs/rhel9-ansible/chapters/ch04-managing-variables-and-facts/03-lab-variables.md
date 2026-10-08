---
title: "Exercise: Managing variables"
seoTitle: "Managing variables (RHCE Practice Exercise)"
description: "Hands-on RHCE practice: managing variables. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 20
---

{% lead %}
You will rewrite a web server play so that every package and service name comes from a variable, then add a second play that checks the site is reachable.
{% /lead %}

The play targets the `webserver` group, which contains `servera.lab.example.com`. Define these variables in the play's `vars` section:

| Variable | Value | Used for |
| --- | --- | --- |
| `web_pkg` | `httpd` | Web server package to install |
| `firewall_pkg` | `firewalld` | Firewall package to install |
| `web_service` | `httpd` | Web service to manage |
| `firewall_service` | `firewalld` | Firewall service to manage |
| `python_pkg` | `python3-PyMySQL` | Extra Python package the course installs alongside the others |
| `rule` | `http` | firewalld service to open |

{% lab
  objectives=["ch04.variables"]
  id="variables"
  title="Managing variables"
  exercise="data-variables"
  hosts=["workstation","servera.lab.example.com"]
  outcomes=["Define variables in a playbook.","Create tasks that use those variables."] %}
{% lab-notes %}

**Prerequisites:** Complete [control-node setup](#/ch01/control-node) and the preceding lessons in this chapter. Run commands as student on workstation unless a step names another machine.

{% reveal title="Verify your work" %}

From the project directory, run the relevant home-lab check. For an exercise with several checkpoints, grade each state before changing or removing it:

```bash
lab grade data-variables
```

The grader reads project files and host state. A passing report covers the listed checks; also perform the task’s independent connection, repeat-run, and reboot checks where requested.

{% /reveal %}

{% reveal title="Try an independent variation" %}

Change one package or service variable to an invalid value. Identify which task fails and why, then restore it.

Record the published result first. The grader checks the original requirements, so a changed name or value may intentionally fail those checks.

{% /reveal %}

{% /lab-notes %}

{% lab-challenge %}

Deploy the web service on servera with `playbook.yml`, using the six variables in the table above.

- Package, service, and firewall names must come from those variables, so changing a value changes the corresponding task's behavior.
- The required packages must be current, the services running and enabled, and HTTP allowed now and persistently.
- The page must say `Example web content`.
- A separate unprivileged play on workstation must verify an HTTP 200 response.

{% /lab-challenge %}

  {% task id="task-a787b59f1544" legacyIndex=1 title="Move into the project directory" %}

```console
[student@workstation ~]$ cd ~/data-variables
[student@workstation data-variables]$
```
  {% /task %}

  {% task id="task-7a723773963d" legacyIndex=2 title="Start the play and define its variables" %}
    Create `playbook.yml` with a play named `Deploy and start Apache HTTPD service` for the `webserver` group, and a `vars` section holding the six variables from the table.

    {% reveal title="Show solution" %}

```yaml
---
- name: Deploy and start Apache HTTPD service
  hosts: webserver
  vars:
    web_pkg: httpd
    firewall_pkg: firewalld
    web_service: httpd
    firewall_service: firewalld
    python_pkg: python3-PyMySQL
    rule: http
```
    {% /reveal %}
  {% /task %}

  {% task id="task-519d5468cca1" legacyIndex=3 title="Install the packages with one task" %}
    Add a `tasks` section and a first task that uses `ansible.builtin.dnf` to make sure the latest versions of the three packages are installed. The module's `name` accepts a list, so one task is enough. Remember to quote each list item, because each one starts with `{{`.

    {% reveal title="Show solution" %}

```yaml
  tasks:
    - name: Required packages are installed and up to date
      ansible.builtin.dnf:
        name:
          - "{{ web_pkg }}"
          - "{{ firewall_pkg }}"
          - "{{ python_pkg }}"
        state: latest
```
    {% /reveal %}

    {% callout type="tip" %}
    Check the module's options any time with `ansible-navigator doc ansible.builtin.dnf -m stdout`.
    {% /callout %}
  {% /task %}

  {% task id="task-aa40f7dea118" legacyIndex=4 title="Start and enable both services" %}
    `ansible.builtin.service` manages exactly one service per task, so write two tasks. Variables work in task names too.

    {% reveal title="Show solution" %}

```yaml
    - name: The {{ firewall_service }} service is started and enabled
      ansible.builtin.service:
        name: "{{ firewall_service }}"
        enabled: true
        state: started

    - name: The {{ web_service }} service is started and enabled
      ansible.builtin.service:
        name: "{{ web_service }}"
        enabled: true
        state: started
```
    {% /reveal %}

    In chapter 5 you will learn to do both with a single looping task.
  {% /task %}

  {% task id="task-f3fae7a2c389" legacyIndex=5 title="Deploy some web content" %}

```yaml
    - name: Web content is in place
      ansible.builtin.copy:
        content: "Example web content"
        dest: /var/www/html/index.html
```
  {% /task %}

  {% task id="task-c1937505cded" legacyIndex=6 title="Open the firewall" %}
    Use `ansible.posix.firewalld` to allow the service named in `rule`, permanently and immediately.

    {% reveal title="Show solution" %}

```yaml
    - name: The firewall port for {{ rule }} is open
      ansible.posix.firewalld:
        service: "{{ rule }}"
        permanent: true
        immediate: true
        state: enabled
```
    {% /reveal %}
  {% /task %}

  {% task id="task-b66601efefc6" legacyIndex=7 title="Add a verification play" %}
    Add a second play, `Verify the Apache service`, that runs on `workstation` without privilege escalation, and uses `ansible.builtin.uri` to check that `http://servera.lab.example.com` returns status 200.

    {% reveal title="Show solution" %}

```yaml
- name: Verify the Apache service
  hosts: workstation
  become: false
  tasks:
    - name: Ensure the webserver is reachable
      ansible.builtin.uri:
        url: http://servera.lab.example.com
        status_code: 200
```
    {% /reveal %}
  {% /task %}

  {% task id="task-119df69b92bb" legacyIndex=8 title="Check the syntax" %}

```console
[student@workstation data-variables]$ ansible-navigator run \
> -m stdout playbook.yml --syntax-check
playbook: /home/student/data-variables/playbook.yml
```
  {% /task %}

  {% task id="task-64cb54d91b02" legacyIndex=9 title="Run the playbook" %}
    Watch the variable values appear in the task names:

```console
[student@workstation data-variables]$ ansible-navigator run -m stdout playbook.yml
...output omitted...
TASK [The firewalld service is started and enabled] ****************************
ok: [servera.lab.example.com]

TASK [The httpd service is started and enabled] ********************************
changed: [servera.lab.example.com]
...output omitted...
TASK [The firewall port for http is open] **************************************
changed: [servera.lab.example.com]
...output omitted...
PLAY RECAP *********************************************************************
servera.lab.example.com    : ok=6    changed=4    unreachable=0    failed=0  ...
workstation                : ok=2    changed=0    unreachable=0    failed=0  ...
```
  {% /task %}

  {% task id="task-93152b8dd1dd" legacyIndex=10 title="Finish" %}
    {% lab-finish exercise="data-variables" /%}
  {% /task %}
{% /lab %}

{% callout type="exam" title="Try it with an extra variable" %}
Run the playbook once more with `-e "rule=https"`. The extra variable overrides the play's `rule`, and the task name changes to "The firewall port for https is open". It is a quick way to feel precedence in action.
{% /callout %}
