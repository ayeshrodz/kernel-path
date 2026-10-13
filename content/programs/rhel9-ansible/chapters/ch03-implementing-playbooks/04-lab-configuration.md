---
title: "Exercise: Configuration files"
seoTitle: "Configuration files (RHCE Practice Exercise)"
description: "Hands-on RHCE practice: configuration files. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 20
---

{% lead %}
You will give a project its own navigator settings, its own `ansible.cfg` and its own inventory, then use small ping playbooks to prove each piece works, finishing with sudo escalation that prompts for a password.
{% /lead %}

{% lab
  objectives=["ch03.configuration"]
  id="config"
  title="Managing Ansible configuration files"
  exercise="playbook-manage"
  hosts=["workstation","servera.lab.example.com","serverb.lab.example.com"]
  outcomes=["Create project-level configuration files for ansible-navigator and Ansible.","Build an inventory with a nested group and verify it with playbooks.","Configure privilege escalation with a sudo password prompt."] %}
{% lab-notes %}

**Prerequisites:** Complete [control-node setup](#/ch01/control-node) and the preceding lessons in this chapter. Run commands as student on workstation unless a step names another machine.

{% reveal title="Verify your work" %}

From the project directory, run the relevant home-lab check. For an exercise with several checkpoints, grade each state before changing or removing it:

```bash
lab grade playbook-manage
```

The grader reads project files and host state. A passing report covers the listed checks; also perform the task’s independent connection, repeat-run, and reboot checks where requested.

{% /reveal %}

{% reveal title="Try an independent variation" %}

Add a separate database group, then prove its ping playbook uses the project inventory without a command-line inventory option.

Record the published result first. The grader checks the original requirements, so a changed name or value may intentionally fail those checks.

{% /reveal %}

{% /lab-notes %}

{% lab-challenge %}

Make the supplied ping playbooks work from this project without specifying an inventory on each run.

- Navigator must use project settings and avoid saving playbook artifacts. At home, execution environments must remain disabled; in a classroom, use the assigned image.
- The default inventory must be `./inventory`. `myself` contains workstation, `intranetweb` contains servera, and `internetweb` contains serverb; `web` contains the two web groups.
- Runs must escalate to root through sudo and request the become password. All three hosts must answer the supplied checks.

{% /lab-challenge %}

  {% task id="task-913f067f7a6e" legacyIndex=1 title="Move into the project directory" %}

```console
[student@workstation ~]$ cd ~/playbook-manage
[student@workstation playbook-manage]$
```
  {% /task %}

  {% lab-setup variant="homelab" %}
    The starter folder has the five `ping-*.yml` playbooks and nothing else: you write the configuration files. The plays connect as `student`, which works because of the SSH key step in [section 1.6](#/ch01/control-node).
  {% /lab-setup %}

  {% task id="task-1d63da6e737e" legacyIndex=2 title="Configure automation content navigator" %}
    Create `ansible-navigator.yml`, a project-level settings file for navigator that does not write playbook artifacts.

    {% variant-group %}
      {% variant name="classroom" %}
        Use the classroom EE image and pull it only if it is missing:

```yaml {% title="ansible-navigator.yml" %}
---
ansible-navigator:
  execution-environment:
    image: utility.lab.example.com/ee-supported-rhel8:latest
    pull:
      policy: missing
  playbook-artifact:
    enable: false
```

        Check it with `ansible-navigator images`. The first run prints the pull policy it read from your file and pulls the image:

```text
Execution environment image name:     utility.lab.example.com/ee-supported-rhel8:latest
Execution environment pull policy:    missing
Execution environment pull needed:    True
...output omitted...
Running the command: podman pull utility.lab.example.com/ee-supported-rhel8:latest
```

        Press {% kbd %}Esc{% /kbd %} to leave the image list.
      {% /variant %}
      {% variant name="homelab" %}
        There is no classroom image at home, so the project file keeps the execution environment off. A project file replaces `~/.ansible-navigator.yml` completely, so it has to repeat that setting:

```yaml {% title="ansible-navigator.yml" %}
---
ansible-navigator:
  execution-environment:
    enabled: false
  playbook-artifact:
    enable: false
```

        Check that navigator took both settings from a settings file, not from its defaults:

```console
[student@workstation playbook-manage]$ ansible-navigator settings --sources -m stdout | grep -E 'enabled|artifact.enable'
ansible-navigator.execution-environment.enabled: Settings file
ansible-navigator.playbook-artifact.enable: Settings file
```

        This file does not set `mode: stdout`, which is why the commands below pass `-m stdout`.
      {% /variant %}
    {% /variant-group %}
  {% /task %}

  {% task id="task-565406e065d8" legacyIndex=3 title="Point Ansible at a project inventory" %}
    Create `ansible.cfg` with a `[defaults]` section that makes `./inventory` the default inventory.

```ini {% title="ansible.cfg" %}
[defaults]
inventory = ./inventory
```
  {% /task %}

  {% task id="task-6e4faca6afd1" legacyIndex=4 title="Write the inventory" %}
    Create `inventory` with four groups:

    - `myself` contains the `workstation` host.
    - `intranetweb` contains `servera.lab.example.com`.
    - `internetweb` contains `serverb.lab.example.com`.
    - `web` contains the `intranetweb` and `internetweb` groups.

    {% reveal title="Show the finished inventory" %}

```ini {% title="inventory" %}
[myself]
workstation

[intranetweb]
servera.lab.example.com

[internetweb]
serverb.lab.example.com

[web:children]
intranetweb
internetweb
```
    {% /reveal %}
  {% /task %}

  {% task id="task-7fbd06b90b46" legacyIndex=5 title="Test each group with the provided playbooks" %}
    The project already contains playbooks that run `ansible.builtin.ping` against one group each. `ping` checks that Ansible can connect and run Python on the host; it does not use ICMP. Notice you no longer need `-i inventory`: `ansible.cfg` supplies it.

```console
[student@workstation playbook-manage]$ ansible-navigator run -m stdout ping-myself.yml
...output omitted...
[student@workstation playbook-manage]$ ansible-navigator run -m stdout ping-intranetweb.yml
...output omitted...
[student@workstation playbook-manage]$ ansible-navigator run -m stdout ping-internetweb.yml
...output omitted...
[student@workstation playbook-manage]$ ansible-navigator run -m stdout ping-web.yml
...output omitted...
[student@workstation playbook-manage]$ ansible-navigator run -m stdout ping-all.yml
```

    The last one should report `ok=1` for all three machines:

```text
PLAY RECAP *********************************************************************
servera.lab.example.com    : ok=1    changed=0    unreachable=0    failed=0  ...
serverb.lab.example.com    : ok=1    changed=0    unreachable=0    failed=0  ...
workstation                : ok=1    changed=0    unreachable=0    failed=0  ...
```
  {% /task %}

  {% task id="task-459de24c29de" legacyIndex=6 title="Add privilege escalation that prompts for the sudo password" %}
    Add a `[privilege_escalation]` section so Ansible uses `sudo` to become `root`, and asks for the password that `student` uses with sudo.

    {% reveal title="Show the finished ansible.cfg" %}

```ini {% title="ansible.cfg" %}
[defaults]
inventory = ./inventory

[privilege_escalation]
become = true
become_method = sudo
become_user = root
become_ask_pass = true
```
    {% /reveal %}
  {% /task %}

  {% task id="task-d3cc750236c2" legacyIndex=7 title="Prove the prompt works" %}
    Run a ping playbook again. You are now asked for the `BECOME password`; enter `student`.

```console
[student@workstation playbook-manage]$ ansible-navigator run \
> -m stdout ping-intranetweb.yml
BECOME password: student

PLAY [Validate inventory hosts] ************************************************

TASK [Ping intranetweb] ********************************************************
ok: [servera.lab.example.com]
...output omitted...
```

    This only works because you disabled playbook artifacts in task 2 and used `-m stdout`.
  {% /task %}

  {% task id="task-b1ad55584150" legacyIndex=8 title="Finish" %}
    {% lab-finish exercise="playbook-manage" /%}
  {% /task %}
{% /lab %}

{% callout type="exam" title="Build this from memory" %}
In a hands-on exam you should expect to start from an empty project directory. Practise writing `ansible.cfg` (inventory, remote_user and the four privilege escalation directives) and a grouped inventory quickly and without typos. Then prove them with a ping playbook before writing anything bigger.
{% /callout %}
