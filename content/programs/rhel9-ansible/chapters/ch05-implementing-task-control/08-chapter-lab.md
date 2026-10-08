---
title: "Exercise: Implementing task control"
seoTitle: "Ansible task control Practice Lab (RHCE Exam Style)"
description: "Graded RHCE exam-style lab on Ansible task control: a challenge with requirements, hints and solutions, and a grader that checks your work on your own lab."
kind: lab
minutes: 35
---

{% lead %}
Use everything in this chapter to deploy an HTTPS web server: stop early on unsuitable hosts, install and start everything with loops, copy the TLS files as a recoverable block, open the firewall, and restart the web server only when its configuration changes.
{% /lead %}

`~/control-review` contains a partly written `playbook.yml` (for the `webservers` group, which holds `serverb.lab.example.com`) with comments marking where each task goes, and a `vars.yml` that defines:

| Variable | Used for |
| --- | --- |
| `min_ram_mb` | Minimum memory required, `256` |
| `packages` | Packages to install |
| `services` | Services to start and enable |
| `ssl_cert_dir` | Directory for the web server's certificates |
| `web_config_files` | A list of dictionaries, each with `src` and `dest` |
| `web_service` | The web service to restart |

{% lab
  objectives=["ch05.loops-conditions","ch05.handlers","ch05.failure"]
  id="review"
  title="Implementing task control"
  exercise="control-review"
  hosts=["workstation","serverb.lab.example.com"]
  outcomes=["Define conditionals, loops and handlers in a playbook.","Handle task errors with a block."] %}
{% lab-notes %}

**Prerequisites:** Complete [control-node setup](#/ch01/control-node) and the preceding lessons in this chapter. Run commands as student on workstation unless a step names another machine.

{% reveal title="Verify your work" %}

From the project directory, run the relevant home-lab check. For an exercise with several checkpoints, grade each state before changing or removing it:

```bash
lab grade control-review
```

The grader reads project files and host state. A passing report covers the listed checks; also perform the task’s independent connection, repeat-run, and reboot checks where requested.

{% /reveal %}

{% reveal title="Try an independent variation" %}

Raise the minimum RAM above your VM allocation. Verify the play stops before changing the web service, then restore it.

Record the published result first. The grader checks the original requirements, so a changed name or value may intentionally fail those checks.

{% /reveal %}

{% /lab-notes %}

{% lab-challenge %}

Complete the supplied HTTPS deployment using the values in `vars.yml`.

- Reject hosts below `min_ram_mb` or outside the required OS before installation. For the home lab, accept the RedHat OS family; the classroom requires the RedHat distribution.
- Install the listed packages and start and enable the listed services through loops.
- Deploy all TLS and web configuration files as a recoverable group of tasks. On a configuration failure, report that failure clearly.
- Allow HTTP and HTTPS immediately and persistently. Configuration changes must request one web-service restart per handler stage.
- Prove serverb serves the expected HTTPS content with its lab certificate.

{% /lab-challenge %}

  {% lab-setup variant="homelab" %}
    `server.key` and `server.crt` are a self-signed certificate that `lab start` generates on your workstation for `serverb.lab.example.com`. `ssl.conf` is Rocky's stock file with its two certificate paths pointed at `/etc/httpd/conf.d/ssl/`.
  {% /lab-setup %}

  {% task id="task-99753cb43bac" legacyIndex=1 title="Fail fast on unsuitable hosts" %}
    Under `#Fail Fast Message`, add a task that uses `ansible.builtin.fail` to stop with the message `The <hostname> did not meet minimum reqs.` when the host has less memory than `min_ram_mb` **or** is not running Red Hat Enterprise Linux.

    {% reveal title="Show solution" %}

```yaml
  tasks:
    #Fail Fast Message
    - name: Show Failed System Requirements Message
      ansible.builtin.fail:
        msg: "The {{ inventory_hostname }} did not meet minimum reqs."
      when: >
        ansible_facts['memtotal_mb'] < min_ram_mb or
        ansible_facts['distribution'] != "RedHat"
```
    {% /reveal %}

    {% variant name="homelab" title="At home this check stops the play" %}
    serverb reports `Rocky`, so the condition as written is true and the play fails at once with *"did not meet minimum reqs"*. That is the task working correctly. To carry on with the rest of the lab, test the family instead:

```yaml
      when: >
        ansible_facts['memtotal_mb'] < min_ram_mb or
        ansible_facts['os_family'] != "RedHat"
```

    Run it once as written above first: watching a fail-fast task stop a play is worth seeing.
    {% /variant %}
  {% /task %}

  {% task id="task-206edff35bc8" legacyIndex=2 title="Install the packages" %}
    Under `#Install all Packages`, add `Ensure required packages are present`, installing the latest version of everything in `packages`.

    {% reveal title="Show solution" %}

```yaml
    #Install all Packages
    - name: Ensure required packages are present
      ansible.builtin.dnf:
        name: "{{ packages }}"
        state: latest
```
    {% /reveal %}
  {% /task %}

  {% task id="task-7ac41c7ef7c5" legacyIndex=3 title="Start and enable the services with a loop" %}
    Under `#Enable and start services`, start and enable every service in `services`.

    {% reveal title="Show solution" %}

```yaml
    #Enable and start services
    - name: Ensure services are started and enabled
      ansible.builtin.service:
        name: "{{ item }}"
        state: started
        enabled: true
      loop: "{{ services }}"
```
    {% /reveal %}
  {% /task %}

  {% task id="task-38f17331b99f" legacyIndex=4 title="Copy the TLS and web files in a block" %}
    Under `#Block of config tasks`, add a block with two tasks:
    - create the `ssl_cert_dir` directory;
    - copy every file in `web_config_files` to its destination (each item has `src` and `dest`), notifying `restart web service`.

    If either task fails, a rescue task prints: `One or more of the configuration changes failed, but the web service is still active.`

    {% reveal title="Show solution" %}

```yaml
    #Block of config tasks
    - name: Setting up the SSL cert directory and config files
      block:
        - name: Create SSL cert directory
          ansible.builtin.file:
            path: "{{ ssl_cert_dir }}"
            state: directory

        - name: Copy Config Files
          ansible.builtin.copy:
            src: "{{ item['src'] }}"
            dest: "{{ item['dest'] }}"
          loop: "{{ web_config_files }}"
          notify: restart web service

      rescue:
        - name: Configuration Error Message
          ansible.builtin.debug:
            msg: >
              One or more of the configuration
              changes failed, but the web service
              is still active.
```
    {% /reveal %}
  {% /task %}

  {% task id="task-5f6fc930e00c" legacyIndex=5 title="Open HTTP and HTTPS" %}
    Under `#Configure the firewall`, allow the `http` and `https` services in firewalld, immediately and permanently, with one looping task.

    {% reveal title="Show solution" %}

```yaml
    #Configure the firewall
    - name: ensure web server ports are open
      ansible.posix.firewalld:
        service: "{{ item }}"
        immediate: true
        permanent: true
        state: enabled
      loop:
        - http
        - https
```
    {% /reveal %}

    {% callout type="note" %}
    The course's printed solution writes this module as `ansible.builtin.firewalld`. The firewalld module is in the `ansible.posix` collection, so use `ansible.posix.firewalld`.
    {% /callout %}
  {% /task %}

  {% task id="task-55c8acc2c73a" legacyIndex=6 title="Add the handler" %}
    At the end of the play, add a `handlers` section with `restart web service`, which restarts `web_service`.

    {% reveal title="Show solution" %}

```yaml
  #Add handlers
  handlers:
    - name: restart web service
      ansible.builtin.service:
        name: "{{ web_service }}"
        state: restarted
```
    {% /reveal %}
  {% /task %}

  {% task id="task-3b9579b4e587" legacyIndex=7 title="Run the playbook" %}

```console
[student@workstation control-review]$ ansible-navigator run -m stdout playbook.yml
...output omitted...
TASK [Show Failed System Requirements Message] *********************************
skipping: [serverb.lab.example.com]
...output omitted...
TASK [Copy Config Files] *******************************************************
changed: [serverb.lab.example.com] => (item={'src': 'server.key', 'dest': '/etc/httpd/conf.d/ssl'})
changed: [serverb.lab.example.com] => (item={'src': 'server.crt', 'dest': '/etc/httpd/conf.d/ssl'})
changed: [serverb.lab.example.com] => (item={'src': 'ssl.conf', 'dest': '/etc/httpd/conf.d'})
changed: [serverb.lab.example.com] => (item={'src': 'index.html', 'dest': '/var/www/html'})
...output omitted...
RUNNING HANDLER [restart web service] ******************************************
changed: [serverb.lab.example.com]

PLAY RECAP *********************************************************************
serverb.lab.example.com    : ok=7    changed=6    unreachable=0    failed=0
skipped=1    rescued=0    ignored=0
```

    serverb meets the requirements, so the fail task is skipped, and the handler runs once even though four files changed.
  {% /task %}

  {% task id="task-19eeebcb0cb9" legacyIndex=8 title="Test HTTPS" %}

```console
[student@workstation control-review]$ curl -k -vvv https://serverb.lab.example.com
...output omitted...
< HTTP/1.1 200 OK
...output omitted...
Configured for both HTTP and HTTPS.
```

    `-k` accepts the self-signed certificate.
  {% /task %}

  {% task id="task-c8a5a26da924" legacyIndex=9 title="Grade and finish" %}
    {% lab-finish exercise="control-review" grade=true /%}
  {% /task %}
{% /lab %}

{% callout type="exam" title="Fail fast" %}
Putting checks like memory and distribution first, with `ansible.builtin.fail` and a clear message, is a good habit: the play stops with an explanation before it half-configures an unsuitable host.
{% /callout %}
