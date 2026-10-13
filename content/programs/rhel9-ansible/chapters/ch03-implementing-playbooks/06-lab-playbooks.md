---
title: "Exercise: Writing and running playbooks"
seoTitle: "Writing and running playbooks (RHCE Practice Exercise)"
description: "Hands-on RHCE practice: writing and running playbooks. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 20
---

{% lead %}
You will write your first real playbook: one play that installs Apache, deploys a web page and starts the service on two hosts. Then you will syntax-check it, run it, run it again to prove it is idempotent, and test the result with `curl`.
{% /lead %}

The project directory `~/playbook-basic` already contains an `ansible.cfg` and an `inventory` with a `web` group containing `serverc.lab.example.com` and `serverd.lab.example.com`. Your playbook, `site.yml`, must make sure that on every host in `web`:

| Requirement | Module |
| --- | --- |
| The `httpd` package is present | `ansible.builtin.dnf` |
| `files/index.html` is copied to `/var/www/html/index.html` | `ansible.builtin.copy` |
| The `httpd` service is started and enabled at boot | `ansible.builtin.service` |

{% callout type="tip" title="Use the documentation" %}
Not sure what arguments a module takes? `ansible-navigator doc ansible.builtin.copy -m stdout` shows them, with examples. Getting comfortable with it now will pay off in the exam.
{% /callout %}

{% lab
  objectives=["ch03.playbooks"]
  id="playbooks"
  title="Writing and running playbooks"
  exercise="playbook-basic"
  hosts=["workstation","serverc.lab.example.com","serverd.lab.example.com"]
  outcomes=["Write a playbook using correct YAML and playbook structure.","Validate and run it with ansible-navigator run."] %}
{% lab-notes %}

**Prerequisites:** Complete [control-node setup](#/ch01/control-node) and the preceding lessons in this chapter. Run commands as student on workstation unless a step names another machine.

{% reveal title="Verify your work" %}

From the project directory, run the relevant home-lab check. For an exercise with several checkpoints, grade each state before changing or removing it:

```bash
lab grade playbook-basic
```

The grader reads project files and host state. A passing report covers the listed checks; also perform the task’s independent connection, repeat-run, and reboot checks where requested.

{% /reveal %}

{% reveal title="Try an independent variation" %}

Change the page content and predict which task changes on each host before rerunning.

Record the published result first. The grader checks the original requirements, so a changed name or value may intentionally fail those checks.

{% /reveal %}

{% /lab-notes %}

{% lab-challenge %}

Publish the provided page on both hosts in `web` using `site.yml`.

- Apache must be installed, running, and enabled at boot.
- The provided `files/index.html` must be available as `/var/www/html/index.html`.
- HTTP requests from workstation must return the page; account for the home-lab firewall.
- A repeat playbook run must leave the desired state unchanged. Explain the difference between a successful playbook run and a reachable web service.

{% /lab-challenge %}

  {% task id="task-f8615ccc9dff" legacyIndex=1 title="Move into the project directory" %}

```console
[student@workstation ~]$ cd ~/playbook-basic
[student@workstation playbook-basic]$
```
  {% /task %}

  {% task id="task-db438de9dddd" legacyIndex=2 title="Start the play" %}
    Create `site.yml`. Begin with the document marker, then a play named `Install and start Apache HTTPD` that targets the `web` group. `hosts` must line up with `name`.

```yaml {% title="site.yml" %}
---
- name: Install and start Apache HTTPD
  hosts: web
```
  {% /task %}

  {% task id="task-12e168405f1c" legacyIndex=3 title="Add the tasks key and the package task" %}
    Add `tasks:` at the same indentation as `hosts`. Then add the first task, indented further, that uses `ansible.builtin.dnf` to make sure `httpd` is `present`.

```yaml
  tasks:
    - name: Ensure httpd package is present
      ansible.builtin.dnf:
        name: httpd
        state: present
```
  {% /task %}

  {% task id="task-2b78738e5ef9" legacyIndex=4 title="Add the web page task" %}
    Match the format of the previous task. Use `ansible.builtin.copy` with `src` and `dest`.

```yaml
    - name: Correct index.html is present
      ansible.builtin.copy:
        src: files/index.html
        dest: /var/www/html/index.html
```
  {% /task %}

  {% task id="task-733631c5f524" legacyIndex=5 title="Add the service task" %}
    Use `ansible.builtin.service` so `httpd` is `started` now and `enabled` at boot.

    {% reveal title="Show the complete site.yml" %}

```yaml {% title="site.yml" %}
---
- name: Install and start Apache HTTPD
  hosts: web
  tasks:
    - name: Ensure httpd package is present
      ansible.builtin.dnf:
        name: httpd
        state: present

    - name: Correct index.html is present
      ansible.builtin.copy:
        src: files/index.html
        dest: /var/www/html/index.html

    - name: Ensure httpd is started
      ansible.builtin.service:
        name: httpd
        state: started
        enabled: true
```
    {% /reveal %}
  {% /task %}

  {% task id="task-16933d0cc598" legacyIndex=6 title="Check the syntax" %}
    Fix anything it reports before continuing.

```console
[student@workstation playbook-basic]$ ansible-navigator run \
> -m stdout site.yml --syntax-check
playbook: /home/student/playbook-basic/site.yml
```
  {% /task %}

  {% task id="task-9c10c6ff823d" legacyIndex=7 title="Run the playbook" %}

```console
[student@workstation playbook-basic]$ ansible-navigator run -m stdout site.yml
...output omitted...
PLAY RECAP *********************************************************************
serverc.lab.example.com    : ok=4    changed=3    unreachable=0    failed=0  ...
serverd.lab.example.com    : ok=4    changed=3    unreachable=0    failed=0  ...
```

    Four tasks ran on each host (Gathering Facts plus your three), and all three of yours changed something.
  {% /task %}

  {% task id="task-b1a29dcaedd7" legacyIndex=8 title="Run it again" %}
    This time nothing should change:

```text
PLAY RECAP *********************************************************************
serverc.lab.example.com    : ok=4    changed=0    unreachable=0    failed=0  ...
serverd.lab.example.com    : ok=4    changed=0    unreachable=0    failed=0  ...
```
  {% /task %}

  {% task id="task-dab94357098a" legacyIndex=9 title="Test the web servers" %}

```console
[student@workstation playbook-basic]$ curl serverc.lab.example.com
This is a test page.
[student@workstation playbook-basic]$ curl serverd.lab.example.com
This is a test page.
```

    {% variant name="homelab" title="curl hangs or is refused at home" %}
    The home-lab servers run `firewalld` from the first boot, as a standard RHEL installation does, and this playbook never opens the HTTP port. The play itself succeeds; only the test fails. Add a fourth task and run the playbook again:

```yaml
    - name: firewalld permits http service
      ansible.posix.firewalld:
        service: http
        permanent: true
        state: enabled
        immediate: true
```

    You meet this module properly in the next sections. A web server that is running but unreachable is almost always this.
    {% /variant %}
  {% /task %}

  {% task id="task-32186255913b" legacyIndex=10 title="Finish" %}
    {% lab-finish exercise="playbook-basic" /%}
  {% /task %}
{% /lab %}

{% callout type="exam" title="Common mistakes to watch for" %}
- A module name indented at a different level from the task's `name`.
- A missing space after a colon (`name:httpd`).
- Using `state: started` on the **dnf** task instead of the **service** task.
- Forgetting `enabled: true`: the service runs now but not after a reboot, and exam systems are commonly rebooted before grading.
{% /callout %}
