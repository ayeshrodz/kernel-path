---
title: "Exercise: Implementing a playbook"
seoTitle: "Ansible playbooks Practice Lab (RHCE Exam Style)"
description: "Graded RHCE exam-style lab on Ansible playbooks: a challenge with requirements, hints and solutions, and a grader that checks your work on your own lab."
kind: lab
minutes: 30
---

{% lead %}
The chapter's end-of-chapter lab: no step-by-step code this time. Build a two-play playbook that sets up a PHP and MariaDB web server on `serverb`, then tests it from the workstation. Solutions are hidden under each task. Try each one yourself first.
{% /lead %}

The project `~/playbook-review` already contains an `ansible.cfg`, an `inventory` that defines `serverb.lab.example.com`, and an `index.php` page.

{% lab
  objectives=["ch03.inventory","ch03.configuration","ch03.playbooks","ch03.modules"]
  id="review"
  title="Implementing an Ansible Playbook"
  exercise="playbook-review"
  hosts=["workstation","serverb.lab.example.com"]
  outcomes=["Write and run a playbook that installs, configures and verifies web and database services on a managed host."] %}
{% lab-notes %}

**Prerequisites:** Complete [control-node setup](#/ch01/control-node) and the preceding lessons in this chapter. Run commands as student on workstation unless a step names another machine.

{% reveal title="Verify your work" %}

From the project directory, run the relevant home-lab check. For an exercise with several checkpoints, grade each state before changing or removing it:

```bash
lab grade playbook-review
```

The grader reads project files and host state. A passing report covers the listed checks; also perform the task’s independent connection, repeat-run, and reboot checks where requested.

{% /reveal %}

{% reveal title="Try an independent variation" %}

Remove the PHP page in the disposable lab. Explain whether the verification catches that fault, then repair it.

Record the published result first. The grader checks the original requirements, so a changed name or value may intentionally fail those checks.

{% /reveal %}

{% /lab-notes %}

{% lab-challenge %}

Prepare serverb to serve the provided PHP page, using `internet.yml`.

- Install current `firewalld`, `httpd`, `mariadb-server`, `php`, and `php-mysqlnd` packages. The firewall, Apache, and MariaDB must run and start at boot.
- HTTP must be allowed persistently. The supplied `index.php` must be under `/var/www/html/` with mode `0644`.
- An unprivileged verification play on workstation must require HTTP 200 from serverb. Repeat the deployment and investigate unexpected changes.

{% /lab-challenge %}

  {% task id="task-38c7bc9491e8" legacyIndex=1 title="Start a play for serverb" %}
    In `~/playbook-review`, create `internet.yml`. Add a play named `Enable internet services` for `serverb.lab.example.com`, with privilege escalation enabled and a task list.

    {% reveal title="Show solution" %}

```yaml
---
- name: Enable internet services
  hosts: serverb.lab.example.com
  become: true
  tasks:
```
    {% /reveal %}
  {% /task %}

  {% task id="task-95aed2c47f59" legacyIndex=2 title="Install the packages" %}
    Add one task that installs the **latest** versions of `firewalld`, `httpd`, `mariadb-server`, `php` and `php-mysqlnd`.

    {% reveal title="Show solution" %}

```yaml
    - name: Latest version of all required packages installed
      ansible.builtin.dnf:
        name:
          - firewalld
          - httpd
          - mariadb-server
          - php
          - php-mysqlnd
        state: latest
```
    {% /reveal %}
  {% /task %}

  {% task id="task-2adb154d7c7c" legacyIndex=3 title="Configure the firewall" %}
    Make sure `firewalld` is enabled and running, and that the `http` service is allowed, permanently and immediately.

    {% reveal title="Show solution" %}

```yaml
    - name: firewalld enabled and running
      ansible.builtin.service:
        name: firewalld
        enabled: true
        state: started

    - name: firewalld permits http service
      ansible.posix.firewalld:
        service: http
        permanent: true
        state: enabled
        immediate: true
```
    {% /reveal %}
  {% /task %}

  {% task id="task-3cc9e1a8fa70" legacyIndex=4 title="Start the services" %}
    Make sure `httpd` and `mariadb` are both enabled and running.

    {% reveal title="Show solution" %}

```yaml
    - name: httpd enabled and running
      ansible.builtin.service:
        name: httpd
        enabled: true
        state: started

    - name: mariadb enabled and running
      ansible.builtin.service:
        name: mariadb
        enabled: true
        state: started
```
    {% /reveal %}
  {% /task %}

  {% task id="task-0a61f2642eca" legacyIndex=5 title="Deploy the PHP page" %}
    Copy `~/playbook-review/index.php` to `/var/www/html/` on the managed host, with file mode `0644`.

    {% reveal title="Show solution" %}

```yaml
    - name: Test php page is installed
      ansible.builtin.copy:
        src: index.php
        dest: /var/www/html/index.php
        mode: 0644
```

    Relative `src` paths are looked up next to the playbook (and in a `files/` directory beside it).
    {% /reveal %}
  {% /task %}

  {% task id="task-bc43e93c2183" legacyIndex=6 title="Add a test play" %}
    Add a second play named `Test internet web server` that runs on the `workstation` host without privilege escalation, and uses `ansible.builtin.uri` to request `http://serverb.lab.example.com`, expecting status code `200`.

    {% reveal title="Show solution" %}

```yaml
- name: Test internet web server
  hosts: workstation
  become: false
  tasks:
    - name: Connect to internet web server
      ansible.builtin.uri:
        url: http://serverb.lab.example.com
        status_code: 200
```
    {% /reveal %}
  {% /task %}

  {% task id="task-1a90023e84c5" legacyIndex=7 title="Validate and run" %}
    Syntax-check the playbook, then run it and read the output.

```console
[student@workstation playbook-review]$ ansible-navigator run \
> -m stdout internet.yml --syntax-check
playbook: /home/student/playbook-review/internet.yml
[student@workstation playbook-review]$ ansible-navigator run -m stdout internet.yml
...output omitted...
PLAY RECAP *********************************************************************
serverb.lab.example.com    : ok=7    changed=5    unreachable=0    failed=0  ...
workstation                : ok=2    changed=0    unreachable=0    failed=0  ...
```

    Why `changed=5` and not 6? In the classroom `firewalld` is already running on `serverb`, so that task reports `ok`.
  {% /task %}

  {% task id="task-1ea37e735fb9" legacyIndex=8 title="Grade and finish" %}
    {% lab-finish exercise="playbook-review" grade=true /%}
  {% /task %}
{% /lab %}

{% reveal title="Show the complete internet.yml" %}

```yaml {% title="internet.yml" %}
---
- name: Enable internet services
  hosts: serverb.lab.example.com
  become: true
  tasks:
    - name: Latest version of all required packages installed
      ansible.builtin.dnf:
        name:
          - firewalld
          - httpd
          - mariadb-server
          - php
          - php-mysqlnd
        state: latest

    - name: firewalld enabled and running
      ansible.builtin.service:
        name: firewalld
        enabled: true
        state: started

    - name: firewalld permits http service
      ansible.posix.firewalld:
        service: http
        permanent: true
        state: enabled
        immediate: true

    - name: httpd enabled and running
      ansible.builtin.service:
        name: httpd
        enabled: true
        state: started

    - name: mariadb enabled and running
      ansible.builtin.service:
        name: mariadb
        enabled: true
        state: started

    - name: Test php page is installed
      ansible.builtin.copy:
        src: index.php
        dest: /var/www/html/index.php
        mode: 0644

- name: Test internet web server
  hosts: workstation
  become: false
  tasks:
    - name: Connect to internet web server
      ansible.builtin.uri:
        url: http://serverb.lab.example.com
        status_code: 200
```

{% /reveal %}

{% callout type="tip" title="Quote file modes" %}
`mode: 0644` works here, but YAML can read unquoted numbers with a leading zero in surprising ways. Many people write `mode: '0644'` (quoted) to be safe. Chapter 6 returns to this.
{% /callout %}
