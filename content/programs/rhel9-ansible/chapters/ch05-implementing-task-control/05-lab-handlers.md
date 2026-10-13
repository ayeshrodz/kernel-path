---
title: "Exercise: Implementing handlers"
seoTitle: "Implementing handlers (RHCE Practice Exercise)"
description: "Hands-on RHCE practice: implementing handlers. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 15
---

{% lead %}
You will finish a playbook that deploys nginx and php-fpm, so that each service restarts only when its own configuration file changes, then run it twice to watch the handlers fire and then stay quiet.
{% /lead %}

The project `~/control-handlers` has a `configure_webapp.yml` playbook that starts with these variables:

```yaml
- name: Web application server is deployed
  hosts: webapp
  vars:
    packages:
      - nginx
      - php-fpm
    web_service: nginx
    app_service: php-fpm
    resources_dir: /home/student/control-handlers/files
    web_config_src: "{{ resources_dir }}/nginx.conf.standard"
    web_config_dst: /etc/nginx/nginx.conf
    app_config_src: "{{ resources_dir }}/php-fpm.conf.standard"
    app_config_dst: /etc/php-fpm.conf

  tasks:
```

| Variable | Meaning |
| --- | --- |
| `packages` | Packages to install for the web application |
| `web_service`, `app_service` | Web server and application server services |
| `resources_dir` | Where the configuration files are kept on the control node |
| `web_config_src`, `web_config_dst` | nginx configuration: source and installed location |
| `app_config_src`, `app_config_dst` | php-fpm configuration: source and installed location |

{% lab
  objectives=["ch05.handlers"]
  id="handlers"
  title="Implementing handlers"
  exercise="control-handlers"
  hosts=["workstation","servera.lab.example.com"]
  outcomes=["Define handlers in playbooks and notify them to apply configuration changes."] %}
{% lab-notes %}

**Prerequisites:** Complete [control-node setup](#/ch01/control-node) and the preceding lessons in this chapter. Run commands as student on workstation unless a step names another machine.

{% reveal title="Verify your work" %}

From the project directory, run the relevant home-lab check. For an exercise with several checkpoints, grade each state before changing or removing it:

```bash
lab grade control-handlers
```

The grader reads project files and host state. A passing report covers the listed checks; also perform the task’s independent connection, repeat-run, and reboot checks where requested.

{% /reveal %}

{% reveal title="Try an independent variation" %}

Change only the php-fpm configuration. Verify that nginx does not restart.

Record the published result first. The grader checks the original requirements, so a changed name or value may intentionally fail those checks.

{% /reveal %}

{% /lab-notes %}

{% lab-challenge %}

Complete the supplied deployment so nginx and php-fpm restart only when their own configuration changes.

- Install the packages named by the project variables, then start and enable both services.
- Deploy the supplied nginx and php-fpm configurations to the destinations specified by the project.
- A change to one configuration must restart only its corresponding service. An unchanged repeat run must restart neither.
- Save the complete playbook and explain when the notified handlers execute.

{% /lab-challenge %}

  {% lab-setup variant="homelab" %}
    The two `.standard` files are the stock Rocky Linux configuration files with one comment line added at the top. That extra line is what makes the copy tasks report `changed` on the first run.
  {% /lab-setup %}

  {% task id="task-1cbee31bad8a" legacyIndex=1 title="Move into the project directory" %}

```console
[student@workstation ~]$ cd ~/control-handlers
```
  {% /task %}

  {% task id="task-a3c13e1041fa" legacyIndex=2 title="Install the packages" %}
    Add a task that installs everything in `packages`. `dnf` accepts the whole list.

```yaml
  tasks:
    - name: "{{ packages }} packages are installed"
      ansible.builtin.dnf:
        name: "{{ packages }}"
        state: present
```
  {% /task %}

  {% task id="task-385f1823b352" legacyIndex=3 title="Start and enable both services" %}

```yaml
    - name: Make sure the web service is running
      ansible.builtin.service:
        name: "{{ web_service }}"
        state: started
        enabled: true

    - name: Make sure the application service is running
      ansible.builtin.service:
        name: "{{ app_service }}"
        state: started
        enabled: true
```
  {% /task %}

  {% task id="task-f585c84867f5" legacyIndex=4 title="Deploy each configuration file and notify its handler" %}
    Add two `ansible.builtin.copy` tasks: one installs the nginx configuration and notifies `restart web service`; the other installs the php-fpm configuration and notifies `restart app service`.

    {% reveal title="Show solution" %}

```yaml
    - name: The {{ web_config_dst }} file has been deployed
      ansible.builtin.copy:
        src: "{{ web_config_src }}"
        dest: "{{ web_config_dst }}"
        force: true
      notify:
        - restart web service

    - name: The {{ app_config_dst }} file has been deployed
      ansible.builtin.copy:
        src: "{{ app_config_src }}"
        dest: "{{ app_config_dst }}"
        force: true
      notify:
        - restart app service
```
    {% /reveal %}
  {% /task %}

  {% task id="task-6dd03225b742" legacyIndex=5 title="Define the two handlers" %}
    Add a `handlers` section, aligned with `tasks`, with a handler that restarts `web_service` and one that restarts `app_service`. Their names must match the `notify` entries exactly.

    {% reveal title="Show solution" %}

```yaml
  handlers:
    - name: restart web service
      ansible.builtin.service:
        name: "{{ web_service }}"
        state: restarted

    - name: restart app service
      ansible.builtin.service:
        name: "{{ app_service }}"
        state: restarted
```
    {% /reveal %}
  {% /task %}

  {% task id="task-5a090c4548f0" legacyIndex=6 title="Check the syntax" %}

```console
[student@workstation control-handlers]$ ansible-navigator run \
> -m stdout configure_webapp.yml --syntax-check
playbook: /home/student/control-handlers/configure_webapp.yml
```
  {% /task %}

  {% task id="task-755703a8038c" legacyIndex=7 title="Run it: the handlers fire" %}

```console
[student@workstation control-handlers]$ ansible-navigator run \
> -m stdout configure_webapp.yml
...output omitted...
TASK [The /etc/nginx/nginx.conf file has been deployed] ************************
changed: [servera.lab.example.com]

TASK [The /etc/php-fpm.conf file has been deployed] ****************************
changed: [servera.lab.example.com]

RUNNING HANDLER [restart web service] ******************************************
changed: [servera.lab.example.com]

RUNNING HANDLER [restart app service] ******************************************
changed: [servera.lab.example.com]

PLAY RECAP *********************************************************************
servera.lab.example.com    : ok=8    changed=7    unreachable=0    failed=0  ...
```

    The handlers appear as `RUNNING HANDLER`, after the last task.
  {% /task %}

  {% task id="task-8a389ab98648" legacyIndex=8 title="Run it again: the handlers stay quiet" %}

```console
[student@workstation control-handlers]$ ansible-navigator run \
> -m stdout configure_webapp.yml
...output omitted...
PLAY RECAP *********************************************************************
servera.lab.example.com    : ok=6    changed=0    unreachable=0    failed=0  ...
```

    The files already match, so the copy tasks report `ok`, nothing is notified, and neither service is restarted. If only `nginx.conf` changed in future, only `restart web service` would run.
  {% /task %}

  {% task id="task-69fb2be4d311" legacyIndex=9 title="Finish" %}
    {% lab-finish exercise="control-handlers" /%}
  {% /task %}
{% /lab %}
