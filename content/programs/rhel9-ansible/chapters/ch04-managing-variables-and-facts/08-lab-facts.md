---
title: "Exercise: Managing facts"
seoTitle: "Managing facts (RHCE Practice Exercise)"
description: "Hands-on RHCE practice: managing facts. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 20
---

{% lead %}
You will print a host's facts, pick out specific ones, then create a custom fact file on servera and write a play that decides what to install and start purely from that file.
{% /lead %}

{% lab
  objectives=["ch04.facts"]
  id="facts"
  title="Managing facts"
  exercise="data-facts"
  hosts=["workstation","servera.lab.example.com"]
  outcomes=["Gather facts from a host.","Create tasks that use the gathered facts, including custom facts."] %}
{% lab-notes %}

**Prerequisites:** Complete [control-node setup](#/ch01/control-node) and the preceding lessons in this chapter. Run commands as student on workstation unless a step names another machine.

{% reveal title="Verify your work" %}

From the project directory, run the relevant home-lab check. For an exercise with several checkpoints, grade each state before changing or removing it:

```bash
lab grade data-facts
```

The grader reads project files and host state. A passing report covers the listed checks; also perform the task’s independent connection, repeat-run, and reboot checks where requested.

{% /reveal %}

{% reveal title="Try an independent variation" %}

Change a custom fact to request a stopped service. Gather facts again and predict the resulting service state.

Record the published result first. The grader checks the original requirements, so a changed name or value may intentionally fail those checks.

{% /reveal %}

{% /lab-notes %}

{% lab-challenge %}

Make servera's web configuration depend on gathered facts rather than package and service names hardcoded in tasks.

- `display_facts.yml` must report all facts; `display_specific_facts.yml` must report FQDN, Python version, processor count, memory, and local custom facts.
- `/etc/ansible/facts.d/custom.fact` must describe the web package and service, requested service state, and enabled setting.
- `playbook.yml` must apply those custom values. `check_httpd.yml` must demonstrate the service state before and after configuration.
- Explain why editing a fact file requires gathering facts again before using the new values.

{% /lab-challenge %}

  {% task id="task-9a77e738e146" legacyIndex=1 title="Move into the project directory" %}

```console
[student@workstation ~]$ cd ~/data-facts
[student@workstation data-facts]$
```
  {% /task %}

  {% task id="task-83120ce7b323" legacyIndex=2 title="Print every fact" %}
    Create `display_facts.yml` for the `webserver` host and run it. Scroll through the output and find a few facts you recognise.

```yaml {% title="display_facts.yml" %}
---
- name: Display ansible_facts
  hosts: webserver
  tasks:
    - name: Display facts
      ansible.builtin.debug:
        var: ansible_facts
```

```console
[student@workstation data-facts]$ ansible-navigator run \
> -m stdout display_facts.yml
...output omitted...
        "system": "Linux",
        "system_vendor": "Red Hat",
        "user_dir": "/root",
...output omitted...
```

    The `user_*` facts describe the account that ran `setup`. Here they show `root`, which means this project escalates privileges.
  {% /task %}

  {% task id="task-7d244833be22" legacyIndex=3 title="Print specific facts" %}
    Create `display_specific_facts.yml` that prints one sentence built from four facts: the FQDN, the Python version, the processor count and the total memory in MiB.

    {% reveal title="Show solution" %}

```yaml {% title="display_specific_facts.yml" %}
---
- name: Display specific ansible_facts
  hosts: webserver
  tasks:
    - name: Display specific facts
      ansible.builtin.debug:
        msg: >
          Host "{{ ansible_facts['fqdn'] }}" with Python
          version "{{ ansible_facts['python_version'] }}" has
          "{{ ansible_facts['processor_count'] }}" processors and
          "{{ ansible_facts['memtotal_mb'] }}" MiB of total system memory.
```
    {% /reveal %}

```text
ok: [servera.lab.example.com] => {
    "msg": "Host \"servera.lab.example.com\" with Python version \"3.9.10\" has
            \"1\" processors and \"960\" MiB of total system memory.\n"
}
```
  {% /task %}

  {% task id="task-fb91427a23d7" legacyIndex=4 title="Check for custom facts" %}
    Add a second task to `display_specific_facts.yml` that prints `ansible_facts['ansible_local']`, and run it again. It is empty, because no custom facts exist yet.

```yaml
    - name: Display ansible_local variable
      ansible.builtin.debug:
        msg: The ansible_local variable is set to "{{ ansible_facts['ansible_local'] }}"
```

```text
    "msg": "The ansible_local variable is set to \"{}\""
```
  {% /task %}

  {% task id="task-f0c74d158cf8" legacyIndex=5 title="Create a custom fact file on servera" %}
    Log in to servera, create the facts directory, and write `custom.fact` describing what the host should run.

```console
[student@workstation data-facts]$ ssh servera
[student@servera ~]$ sudo mkdir -p /etc/ansible/facts.d
[sudo] password for student: student
[student@servera ~]$ sudo vim /etc/ansible/facts.d/custom.fact
```

```ini {% title="/etc/ansible/facts.d/custom.fact" %}
[general]
package = httpd
service = httpd
state = started
enabled = true
```

    Log out of servera when done.
  {% /task %}

  {% task id="task-36ad89145070" legacyIndex=6 title="Write a play driven by custom facts" %}
    Create `playbook.yml` with a play, `Install Apache and starts the service`, for the `webserver` group. It has two tasks:
    1. install the latest version of the package named by the custom fact `package`;
    2. manage the service named by `service`, using the `state` and `enabled` custom facts.

    {% reveal title="Show solution" %}

```yaml {% title="playbook.yml" %}
---
- name: Install Apache and starts the service
  hosts: webserver

  tasks:
    - name: Install the required package
      ansible.builtin.dnf:
        name: "{{ ansible_facts['ansible_local']['custom']['general']['package'] }}"
        state: latest

    - name: Start the service
      ansible.builtin.service:
        name: "{{ ansible_facts['ansible_local']['custom']['general']['service'] }}"
        state: "{{ ansible_facts['ansible_local']['custom']['general']['state'] }}"
        enabled: "{{ ansible_facts['ansible_local']['custom']['general']['enabled'] }}"
```
    {% /reveal %}

    Nothing in the playbook says "httpd": change the fact file on a host and the same playbook installs something else there.
  {% /task %}

  {% task id="task-8b5b0ec69015" legacyIndex=7 title="Check the syntax" %}

```console
[student@workstation data-facts]$ ansible-navigator run \
> -m stdout playbook.yml --syntax-check
playbook: /home/student/data-facts/playbook.yml
```
  {% /task %}

  {% task id="task-7fc410701d7d" legacyIndex=8 title="Confirm httpd is not running yet" %}
    Create `check_httpd.yml`, which runs `systemctl status httpd`, registers the result and prints it. Run it: it fails, because httpd is not installed yet.

```yaml {% title="check_httpd.yml" %}
---
- name: Check httpd status
  hosts: webserver
  tasks:
    - name: Check httpd status
      ansible.builtin.command: systemctl status httpd
      register: result

    - name: Display http status
      ansible.builtin.debug:
        var: result
```

```text
fatal: [servera.lab.example.com]: FAILED! => {"changed": false, "msg": "Could not
find the requested service httpd: host"}
```
  {% /task %}

  {% task id="task-567978b344f5" legacyIndex=9 title="Run the fact-driven playbook" %}

```console
[student@workstation data-facts]$ ansible-navigator run -m stdout playbook.yml
...output omitted...
TASK [Install the required package] ********************************************
changed: [servera.lab.example.com]

TASK [Start the service] *******************************************************
changed: [servera.lab.example.com]

PLAY RECAP *********************************************************************
servera.lab.example.com    : ok=3    changed=2    unreachable=0    failed=0  ...
```
  {% /task %}

  {% task id="task-d369aa498d86" legacyIndex=10 title="Check again" %}
    Run `check_httpd.yml` once more. The registered `result` now shows the service loaded, enabled and `active (running)`.

```text
        "stdout_lines": [
            "● httpd.service - The Apache HTTP Server",
            "     Loaded: loaded (/usr/lib/systemd/system/httpd.service; enabled; ...)",
            "     Active: active (running) since ...",
...output omitted...
```
  {% /task %}

  {% task id="task-a1b26ea23336" legacyIndex=11 title="Finish" %}
    {% lab-finish exercise="data-facts" /%}
  {% /task %}
{% /lab %}

{% callout type="tip" title="Write the fact file with Ansible" %}
Here you created `custom.fact` by hand to see how it works. In practice you would deploy it with a task (`ansible.builtin.copy` with `content:` or `src:`) and then run `ansible.builtin.setup` again so the new facts are picked up in the same play.
{% /callout %}
