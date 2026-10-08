---
title: "Exercise: Creating playbooks"
seoTitle: "Creating playbooks: RHCE Exam-Style Practice Lab"
description: "Graded RHCE exam-style lab on Ansible final review: a challenge with requirements, hints and solutions, and a grader that checks your work on your own lab."
kind: lab
minutes: 40
---

{% lead %}
Write three playbooks: one that installs and configures web servers from a template, with a handler; one that tests the result from workstation and records any failure with a block and rescue; and one that imports the other two. Solutions are hidden under each task. Try each one yourself first.
{% /lead %}

This lab covers chapters 3 to 7. The project `~/review-playbooks` has an `ansible.cfg`, an `inventory` with servera and serverb in `webservers` (and `workstation`), the template `templates/vhost.conf.j2` and the page `files/index.html`.

{% lab
  objectives=["ch11.composition"]
  id="review-playbooks"
  title="Creating playbooks"
  exercise="review-playbooks"
  hosts=["workstation","servera.lab.example.com","serverb.lab.example.com"]
  outcomes=["Create and run playbooks that perform tasks on managed hosts.","Use Jinja2 templates, blocks and handlers in playbooks."] %}
{% lab-notes %}

**Prerequisites:** Complete [control-node setup](#/ch01/control-node) and the preceding lessons in this chapter. Run commands as student on workstation unless a step names another machine.

{% reveal title="Verify your work" %}

From the project directory, run the relevant home-lab check. For an exercise with several checkpoints, grade each state before changing or removing it:

```bash
lab grade review-playbooks
lab grade review-playbooks --checkpoint deployed
lab grade review-playbooks --checkpoint rescued
```

The grader reads project files and host state. A passing report covers the listed checks; also perform the task’s independent connection, repeat-run, and reboot checks where requested.

{% /reveal %}

{% reveal title="Try an independent variation" %}

Point the verification at serverb and deliberately stop that service. Prove the same recovery path records the failure.

Record the published result first. The grader checks the original requirements, so a changed name or value may intentionally fail those checks.

{% /reveal %}

{% /lab-notes %}

{% lab-challenge %}

Deliver and test the supplied virtual-host site on `webservers` through `site.yml`.

- `dev_deploy.yml` must leave Apache running and enabled, HTTP allowed persistently, and `files/index.html` under `/var/www/vhosts/HOSTNAME/`.
- `/etc/httpd/conf.d/vhost.conf` must come from the supplied host-specific template, root-owned with mode `0644`. Configuration changes must restart Apache.
- `get_web_content.yml` must retrieve servera's page from workstation and write the failed result to the project's `error.log` if retrieval fails.
- `site.yml` must deploy before testing. Prove the successful path, a failed request with recovery, and the restored final deployment. Grade the recovered checkpoint before restoring the service.

{% /lab-challenge %}

  {% lab-setup variant="homelab" %}
    Reset the servers first: `rht-vmctl reset servers` on the Ubuntu host.
  {% /lab-setup %}

  {% task id="task-822ba5c68791" legacyIndex=1 title="Install the web server" %}
    Create `dev_deploy.yml` with one play for `webservers`, with privilege escalation, whose first task installs `httpd`.

    {% reveal title="Show solution" %}

```yaml {% title="dev_deploy.yml" %}
---
- name: Install and configure web servers
  hosts: webservers
  become: true

  tasks:
    - name: Install httpd package
      ansible.builtin.dnf:
        name: httpd
        state: present
```
    {% /reveal %}
  {% /task %}

  {% task id="task-28ecde6859fc" legacyIndex=2 title="Start it" %}
    Add a task that starts `httpd` and enables it at boot.

    {% reveal title="Show solution" %}

```yaml
    - name: Start httpd service
      ansible.builtin.service:
        name: httpd
        state: started
        enabled: true
```
    {% /reveal %}
  {% /task %}

  {% task id="task-0295ea7348e3" legacyIndex=3 title="Configure it from the template" %}
    Add a task that deploys `templates/vhost.conf.j2` to `/etc/httpd/conf.d/vhost.conf`, owned by root, mode `0644`, and notifies a handler called `Restart httpd`.

    {% reveal title="Show solution" %}

```yaml
    - name: Deploy configuration template
      ansible.builtin.template:
        src: templates/vhost.conf.j2
        dest: /etc/httpd/conf.d/vhost.conf
        owner: root
        group: root
        mode: '0644'
      notify: Restart httpd
```

    The template sets each host's `DocumentRoot` to `/var/www/vhosts/HOSTNAME/`, from `ansible_facts['hostname']`.
    {% /reveal %}
  {% /task %}

  {% task id="task-29c45fd951c2" legacyIndex=4 title="Publish the content" %}
    Add a task that copies `files/index.html` into `/var/www/vhosts/{{ ansible_facts['hostname'] }}` on the managed hosts. The directory must be created if it does not exist.

    {% reveal title="Show solution" %}

```yaml
    - name: Copy index.html
      ansible.builtin.copy:
        src: files/
        dest: "/var/www/vhosts/{{ ansible_facts['hostname'] }}/"
        owner: root
        group: root
        mode: '0644'
```

    Copying the **directory** `files/` (with its trailing slash) copies its contents and creates the destination directory on the way.
    {% /reveal %}
  {% /task %}

  {% task id="task-fd914a350488" legacyIndex=5 title="Open the firewall, and add the handler" %}
    Add a task that allows `http` through the firewall, now and permanently, and the `Restart httpd` handler.

    {% reveal title="Show solution" %}

```yaml
    - name: Ensure web server port is open
      ansible.posix.firewalld:
        state: enabled
        permanent: true
        immediate: true
        service: http

  handlers:
    - name: Restart httpd
      ansible.builtin.service:
        name: httpd
        state: restarted
```
    {% /reveal %}
  {% /task %}

  {% task id="task-10b1c4b6ed1f" legacyIndex=6 title="Test the content, and record a failure" %}
    Create `get_web_content.yml` with a play named `Test web content` for `workstation`, with privilege escalation. Its one task, `Retrieve web content and write to error log on failure`, is a block:

    - in the block, a task `Retrieve web content` uses `ansible.builtin.uri` to fetch `http://servera.lab.example.com`, returning the content, registered in `content`;
    - in its rescue section, a task `Write to error file` writes the value of `content` to `/home/student/review-playbooks/error.log`, creating the file if needed.

    {% reveal title="Show solution" %}

```yaml {% title="get_web_content.yml" %}
---
- name: Test web content
  hosts: workstation
  become: true

  tasks:
    - name: Retrieve web content and write to error log on failure
      block:
        - name: Retrieve web content
          ansible.builtin.uri:
            url: http://servera.lab.example.com
            return_content: true
          register: content
      rescue:
        - name: Write to error file
          ansible.builtin.lineinfile:
            path: /home/student/review-playbooks/error.log
            line: "{{ content }}"
            create: true
```

    `register` keeps the result even when the task fails, so the rescue task can write the error into the log.
    {% /reveal %}
  {% /task %}

  {% task id="task-5cbdf22d22f9" legacyIndex=7 title="Tie them together" %}
    Create `site.yml` that imports `dev_deploy.yml` and then `get_web_content.yml`, and run it. A second run must report no changes.

    {% reveal title="Show solution" %}

```yaml {% title="site.yml" %}
---
# Deploy web servers
- name: Deploy web servers
  ansible.builtin.import_playbook: dev_deploy.yml

# Retrieve web content
- name: Retrieve web content
  ansible.builtin.import_playbook: get_web_content.yml
```

```console
[student@workstation review-playbooks]$ ansible-navigator run -m stdout site.yml

PLAY [Install and configure web servers] ***************************************
...output omitted...
TASK [Install httpd package] ***************************************************
changed: [servera.lab.example.com]
changed: [serverb.lab.example.com]
...output omitted...
RUNNING HANDLER [Restart httpd] ************************************************
changed: [servera.lab.example.com]
changed: [serverb.lab.example.com]

PLAY [Test web content] ********************************************************

TASK [Gathering Facts] *********************************************************
ok: [workstation]

TASK [Retrieve web content] ****************************************************
ok: [workstation]

PLAY RECAP *********************************************************************
servera.lab.example.com    : ok=7    changed=6    unreachable=0    failed=0  ...
serverb.lab.example.com    : ok=7    changed=6    unreachable=0    failed=0  ...
workstation                : ok=2    changed=0    unreachable=0    failed=0  ...
[student@workstation review-playbooks]$ curl http://servera.lab.example.com
This is a test page.
```

    The page did load, so the rescue did not run and there is no `error.log`.
    {% /reveal %}
  {% /task %}

  {% task id="task-b9ff39f4f54c" legacyIndex=8 title="See the rescue at work" %}
    Stop `httpd` on servera, run `get_web_content.yml` again, and read `error.log`.

```console
[student@workstation review-playbooks]$ ansible servera.lab.example.com -b \
> -m ansible.builtin.service -a 'name=httpd state=stopped'
...output omitted...
[student@workstation review-playbooks]$ ansible-navigator run -m stdout get_web_content.yml
...output omitted...
TASK [Retrieve web content] ****************************************************
fatal: [workstation]: FAILED! => {"changed": false, "content": "", "elapsed": 0, "msg": "Status code was -1 and not [200]: Request failed: <urlopen error [Errno 111] Connection refused>", ...output omitted...}

TASK [Write to error file] *****************************************************
changed: [workstation]

PLAY RECAP *********************************************************************
workstation                : ok=2    changed=1    unreachable=0    failed=0    skipped=0    rescued=1  ...
[student@workstation review-playbooks]$ cat error.log
{'content': '', 'redirected': False, 'url': 'http://servera.lab.example.com', 'status': -1, 'elapsed': 0, 'changed': False, 'failed': True, 'msg': 'Status code was -1 and not [200]: Request failed: <urlopen error [Errno 111] Connection refused>'}
```

    `failed=0` and `rescued=1`: the failure was handled. At home, run `lab grade review-playbooks --checkpoint rescued` while the service is stopped. Run `site.yml` once more to start `httpd` again, then grade the final state.
  {% /task %}

  {% task id="task-45b7d79a5413" legacyIndex=9 title="Grade and finish" %}
    {% lab-finish exercise="review-playbooks" grade=true /%}
  {% /task %}
{% /lab %}
