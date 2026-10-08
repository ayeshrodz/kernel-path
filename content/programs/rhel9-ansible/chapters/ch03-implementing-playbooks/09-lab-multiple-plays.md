---
title: "Exercise: Implementing multiple plays"
seoTitle: "Implementing multiple plays (RHCE Practice Exercise)"
description: "Hands-on RHCE practice: implementing multiple plays. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 20
---

{% lead %}
You will write `intranet.yml`, a playbook with two plays. The first configures `servera` as an intranet web server with root privileges. The second runs unprivileged on localhost and checks that the site answers.
{% /lead %}

The project `~/playbook-multi` already has an `ansible.cfg` and an `inventory` that defines `servera.lab.example.com`.

{% diagram ref="multi-play-flow" /%}

{% lab
  objectives=["ch03.modules"]
  id="multi"
  title="Implementing multiple plays"
  exercise="playbook-multi"
  hosts=["workstation","servera.lab.example.com"]
  outcomes=["Build and run a playbook with two plays.","Enable privilege escalation for one play and disable it for another."] %}
{% lab-notes %}

**Prerequisites:** Complete [control-node setup](#/ch01/control-node) and the preceding lessons in this chapter. Run commands as student on workstation unless a step names another machine.

{% reveal title="Verify your work" %}

From the project directory, run the relevant home-lab check. For an exercise with several checkpoints, grade each state before changing or removing it:

```bash
lab grade playbook-multi
```

The grader reads project files and host state. A passing report covers the listed checks; also perform the task’s independent connection, repeat-run, and reboot checks where requested.

{% /reveal %}

{% reveal title="Try an independent variation" %}

Make the verification require a specific phrase in the returned page as well as HTTP 200.

Record the published result first. The grader checks the original requirements, so a changed name or value may intentionally fail those checks.

{% /reveal %}

{% /lab-notes %}

{% lab-challenge %}

Deliver an intranet site on servera and verify it in the same run. Save your work in `intranet.yml`.

- The host must have current `httpd` and `firewalld` packages, with both services running and enabled.
- `/var/www/html/index.html` must contain `Welcome to the example.com intranet!` and HTTP must be allowed now and after reboot.
- A separate, unprivileged play on localhost must confirm an HTTP 200 response and retrieve the content.
- Show that the verification runs after deployment and that a repeat run has no unexpected changes.

{% /lab-challenge %}

  {% task id="task-1e7df0708233" legacyIndex=1 title="Start the first play" %}
    In `~/playbook-multi`, create `intranet.yml` with the document marker and a play named `Enable intranet services` for `servera.lab.example.com`, with privilege escalation on and an empty task list to fill in.

```yaml {% title="intranet.yml" %}
---
- name: Enable intranet services
  hosts: servera.lab.example.com
  become: true
  tasks:
```
  {% /task %}

  {% task id="task-7de83234a5db" legacyIndex=2 title="Install the latest httpd and firewalld" %}
    One `ansible.builtin.dnf` task can handle both packages: give `name` a list.

```yaml
    - name: Latest version of httpd and firewalld installed
      ansible.builtin.dnf:
        name:
          - httpd
          - firewalld
        state: latest
```

    The task starts at four spaces, the module at six, its arguments at eight, and the package list items at ten.
  {% /task %}

  {% task id="task-a2d204610a52" legacyIndex=3 title="Deploy a test page" %}
    Use `ansible.builtin.copy` with inline `content` rather than a source file.

```yaml
    - name: Test html page is installed
      ansible.builtin.copy:
        content: "Welcome to the example.com intranet!\n"
        dest: /var/www/html/index.html
```
  {% /task %}

  {% task id="task-7821c75cd7a4" legacyIndex=4 title="Start firewalld and open HTTP" %}
    Two tasks: make sure `firewalld` is enabled and running, then allow the `http` service permanently **and** immediately.

```yaml
    - name: Firewall enabled and running
      ansible.builtin.service:
        name: firewalld
        enabled: true
        state: started

    - name: Firewall permits access to httpd service
      ansible.posix.firewalld:
        service: http
        permanent: true
        state: enabled
        immediate: true
```

    Note that `firewalld` comes from the `ansible.posix` collection, not `ansible.builtin`.
  {% /task %}

  {% task id="task-41141086c8ce" legacyIndex=5 title="Start the web server" %}

```yaml
    - name: Web server enabled and running
      ansible.builtin.service:
        name: httpd
        enabled: true
        state: started
```
  {% /task %}

  {% task id="task-089b534996df" legacyIndex=6 title="Add the test play" %}
    Start a second play at the left margin (no indentation). It targets `localhost`, which with navigator is the execution environment (on the home lab, where no container is used, it is workstation itself), and does not need privilege escalation.

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

    `return_content: true` adds the server's response to the task result, and `status_code: 200` makes the task fail if the page does not load.

    {% reveal title="Show the complete intranet.yml" %}

```yaml {% title="intranet.yml" %}
---
- name: Enable intranet services
  hosts: servera.lab.example.com
  become: true
  tasks:
    - name: Latest version of httpd and firewalld installed
      ansible.builtin.dnf:
        name:
          - httpd
          - firewalld
        state: latest

    - name: Test html page is installed
      ansible.builtin.copy:
        content: "Welcome to the example.com intranet!\n"
        dest: /var/www/html/index.html

    - name: Firewall enabled and running
      ansible.builtin.service:
        name: firewalld
        enabled: true
        state: started

    - name: Firewall permits access to httpd service
      ansible.posix.firewalld:
        service: http
        permanent: true
        state: enabled
        immediate: true

    - name: Web server enabled and running
      ansible.builtin.service:
        name: httpd
        enabled: true
        state: started

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
    {% /reveal %}
  {% /task %}

  {% task id="task-7aaf1f0f02e5" legacyIndex=7 title="Check the syntax" %}

```console
[student@workstation playbook-multi]$ ansible-navigator run \
> -m stdout intranet.yml --syntax-check
playbook: /home/student/playbook-multi/intranet.yml
```
  {% /task %}

  {% task id="task-ec9a223362a4" legacyIndex=8 title="Run it and read the recap" %}

```console
[student@workstation playbook-multi]$ ansible-navigator run -m stdout intranet.yml
PLAY [Enable intranet services] ************************************************
...output omitted...
PLAY [Test intranet web server] ************************************************
...output omitted...
PLAY RECAP *********************************************************************
localhost                  : ok=2    changed=0    unreachable=0    failed=0  ...
servera.lab.example.com    : ok=6    changed=5    unreachable=0    failed=0  ...
```

    Both plays appear in order, and each host gets its own line in the recap.
  {% /task %}

  {% task id="task-0d4c28ac9b74" legacyIndex=9 title="Confirm from the workstation" %}

```console
[student@workstation playbook-multi]$ curl http://servera.lab.example.com
Welcome to the example.com intranet!
```
  {% /task %}

  {% task id="task-69531c0ca500" legacyIndex=10 title="Finish" %}
    {% lab-finish exercise="playbook-multi" /%}
  {% /task %}
{% /lab %}
