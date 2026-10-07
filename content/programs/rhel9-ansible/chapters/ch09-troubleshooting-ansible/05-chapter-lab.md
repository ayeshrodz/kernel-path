---
title: "Exercise: Troubleshooting Ansible"
seoTitle: "Ansible troubleshooting Practice Lab (RHCE Exam Style)"
description: "Graded RHCE exam-style lab on Ansible troubleshooting: a challenge with requirements, hints and solutions, and a grader that checks your work on your own lab."
kind: lab
minutes: 30
---

{% lead %}
The playbook `secure-web.yml` should set up Apache with TLS on the web servers, but several problems stop it: in the playbook, in the inventory and in how it connects. Find and fix each one until the playbook runs cleanly. Solutions are hidden under each task. Try each one yourself first.
{% /lead %}

The project `~/troubleshoot-review` has an `ansible.cfg`, an `inventory`, the playbook `secure-web.yml`, the Apache configuration `vhosts.conf` and the page `index.html`. `serverb.lab.example.com` should be the only host in the `webservers` group. Ansible can reach it as `devops`, with the SSH keys already in place, and `devops` can become `root` without a password.

{% lab
  objectives=["ch09.playbook-errors","ch09.host-errors"]
  id="review"
  title="Troubleshooting Ansible"
  exercise="troubleshoot-review"
  hosts=["workstation","serverb.lab.example.com"]
  outcomes=["Troubleshoot playbooks.","Troubleshoot managed hosts."] %}
{% lab-notes %}

**Prerequisites:** Complete [control-node setup](#/ch01/control-node) and the preceding lessons in this chapter. Run commands as student on workstation unless a step names another machine.

{% reveal title="Verify your work" %}

From the project directory, run the relevant home-lab check. For an exercise with several checkpoints, grade each state before changing or removing it:

```bash
lab grade troubleshoot-review
```

The grader reads project files and host state. A passing report covers the listed checks; also perform the task’s independent connection, repeat-run, and reboot checks where requested.

Starter files contain deliberate YAML, inventory, or task errors. Repair them before the final checkpoint.

{% /reveal %}

{% reveal title="Try an independent variation" %}

Use the wrong inventory group in a copy of the playbook. Explain why zero hosts processed is not a successful deployment.

Record the published result first. The grader checks the original requirements, so a changed name or value may intentionally fail those checks.

{% /reveal %}

{% /lab-notes %}

{% lab-challenge %}

Repair `secure-web.yml` so serverb runs the intended TLS web service.

- Correct the playbook's syntax, its target inventory, and the connection/escalation settings as needed.
- All intended deployment tasks must remain and complete. The configured Apache service must be running and the supplied TLS content reachable.
- Record one diagnostic observation for each correction. A syntax check alone is insufficient evidence of a working service.
- Repeat the deployment and verify both host state and HTTPS behavior.

{% /lab-challenge %}

  {% task id="task-3e92568ef802" legacyIndex=1 title="Check the syntax" %}
    From `~/troubleshoot-review`, check the syntax of `secure-web.yml` and fix the problem it reports.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ cd ~/troubleshoot-review
[student@workstation troubleshoot-review]$ ansible-navigator run \
> -m stdout secure-web.yml --syntax-check
...output omitted...
Syntax Error while loading YAML.
  mapping values are not allowed in this context

The error appears to be in '/home/student/troubleshoot-review/secure-web.yml': line 7, column 30, but may
be elsewhere in the file depending on the exact syntax problem.

The offending line appears to be:

  vars:
    random_var: This is colon: test
                             ^ here
```

    A colon followed by a space inside a value must be protected by quotes:

```yaml
  vars:
    random_var: "This is colon: test"
```
    {% /reveal %}
  {% /task %}

  {% task id="task-7e07ab3e2ab4" legacyIndex=2 title="Check the syntax again" %}
    It still has a problem. Fix the next one.

    {% reveal title="Show solution" %}

```console
[student@workstation troubleshoot-review]$ ansible-navigator run \
> -m stdout secure-web.yml --syntax-check
...output omitted...
Syntax Error while loading YAML.
  did not find expected key

The error appears to be in '/home/student/troubleshoot-review/secure-web.yml': line 44, column 7, but may
be elsewhere in the file depending on the exact syntax problem.

The offending line appears to be:

      - name: Start and enable web services
      ^ here
```

    The task is indented two spaces too far. Remove the extra spaces from all its lines:

```yaml
    - name: Start and enable web services
      ansible.builtin.service:
        name: httpd
        state: started
        enabled: true
```
    {% /reveal %}
  {% /task %}

  {% task id="task-c6119f891da6" legacyIndex=3 title="And a third time" %}

    {% reveal title="Show solution" %}

```console
[student@workstation troubleshoot-review]$ ansible-navigator run \
> -m stdout secure-web.yml --syntax-check
...output omitted...
  found unacceptable key (unhashable type: 'AnsibleMapping')

The error appears to be in '/home/student/troubleshoot-review/secure-web.yml': line 12, column 16, but may
be elsewhere in the file depending on the exact syntax problem.

The offending line appears to be:

      ansible.builtin.dnf:
        name: {{ item }}
               ^ here
...output omitted...
```

    A value that starts with `{{` must be quoted:

```yaml
    - name: Install web server packages
      ansible.builtin.dnf:
        name: "{{ item }}"
        state: latest
      notify:
        - Restart services
      loop:
        - httpd
        - mod_ssl
```

```console
[student@workstation troubleshoot-review]$ ansible-navigator run \
> -m stdout secure-web.yml --syntax-check
playbook: /home/student/troubleshoot-review/secure-web.yml
```
    {% /reveal %}
  {% /task %}

  {% task id="task-9b58ffa8e50e" legacyIndex=4 title="Fix the connection" %}
    Run the playbook. Ansible cannot connect to `serverb.lab.example.com`. Two problems prevent it; fix both. (You may well find them in a different order, or both at once.)

    {% reveal title="Show solution" %}

```console
[student@workstation troubleshoot-review]$ ansible-navigator run -m stdout secure-web.yml

PLAY [Create secure web service] ***********************************************

TASK [Gathering Facts] *********************************************************
fatal: [serverb.lab.example.com]: UNREACHABLE! => {"changed": false, "msg": "Failed to connect to the host via ssh: students@serverc.lab.example.com: Permission denied (publickey,gssapi-keyex,gssapi-with-mic,password).", "unreachable": true}
```

    For `serverb`, Ansible connected to **serverc**, as a user called **students**. With `-vvv` the connection details confirm it:

```console
[student@workstation troubleshoot-review]$ ansible-navigator run -m stdout secure-web.yml -vvv
...output omitted...
<serverc.lab.example.com> ESTABLISH SSH CONNECTION FOR USER: students
<serverc.lab.example.com> SSH: EXEC ssh -C -o ControlMaster=auto ... -o 'User="students"' ... serverc.lab.example.com ...
<serverc.lab.example.com> (255, b'', b'students@serverc.lab.example.com: Permission denied (publickey,gssapi-keyex,gssapi-with-mic,password).\r\n')
...output omitted...
```

    The inventory sets `ansible_host` for serverb, redirecting the connection. Remove it:

```ini {% title="inventory" %}
[webservers]
serverb.lab.example.com
```

    The play sets the wrong `remote_user`. Change it to `devops`:

```yaml
---
# start of secure web server playbook
- name: Create secure web service
  hosts: webservers
  remote_user: devops
```
    {% /reveal %}
  {% /task %}

  {% task id="task-0d83750a5bb3" legacyIndex=5 title="Fix the next failure" %}
    Run the playbook again. The connection works now, but a task fails. Fix it.

    {% reveal title="Show solution" %}

```console
[student@workstation troubleshoot-review]$ ansible-navigator run -m stdout secure-web.yml
...output omitted...
TASK [Install web server packages] *********************************************
failed: [serverb.lab.example.com] (item=httpd) => {"ansible_loop_var": "item", "changed": false, "item": "httpd", "msg": "This command has to be run under the root user.", "results": []}
failed: [serverb.lab.example.com] (item=mod_ssl) => {"ansible_loop_var": "item", "changed": false, "item": "mod_ssl", "msg": "This command has to be run under the root user.", "results": []}
```

    Nothing in the configuration or the play turns on privilege escalation. Add it to the play:

```yaml
- name: Create secure web service
  hosts: webservers
  remote_user: devops
  become: true
```
    {% /reveal %}
  {% /task %}

  {% task id="task-48973b1a9c19" legacyIndex=6 title="Run it to the end" %}
    Run the playbook once more. It must complete; then confirm with an ad hoc command that `httpd` is running on serverb.

    {% reveal title="Show solution" %}

```console
[student@workstation troubleshoot-review]$ ansible-navigator run -m stdout secure-web.yml
...output omitted...
TASK [Install web server packages] *********************************************
changed: [serverb.lab.example.com] => (item=httpd)
changed: [serverb.lab.example.com] => (item=mod_ssl)
...output omitted...
TASK [Httpd_conf_syntax variable] **********************************************
ok: [serverb.lab.example.com] => {
    "msg": "The httpd_conf_syntax variable value is {'changed': False, 'stdout': '', 'stderr': 'Syntax OK', 'rc': 0, 'cmd': ['/sbin/httpd', '-t'], ...output omitted...
}
...output omitted...
RUNNING HANDLER [Restart services] *********************************************
changed: [serverb.lab.example.com]

PLAY RECAP *********************************************************************
serverb.lab.example.com    : ok=11   changed=8    unreachable=0    failed=0  ...
[student@workstation troubleshoot-review]$ ansible webservers -u devops -b \
> -m command -a 'systemctl status httpd'
serverb.lab.example.com | CHANGED | rc=0 >>
● httpd.service - The Apache HTTP Server
     Loaded: loaded (/usr/lib/systemd/system/httpd.service; enabled; preset: disabled)
     Active: active (running) since ...
...output omitted...
```

    `-u devops` and `-b` make the ad hoc command connect and escalate the same way the play now does. A second run of the playbook reports `changed=0`.
    {% /reveal %}
  {% /task %}

  {% task id="task-7f9b6eee9e04" legacyIndex=7 title="Grade and finish" %}
    {% lab-finish exercise="troubleshoot-review" grade=true /%}
  {% /task %}
{% /lab %}

{% callout type="exam" title="Work in order" %}
Syntax first, without touching any host. Then the connection: who connects, to which address, as which user. Then privilege. Then the tasks themselves. Each layer hides the next, so fix them from the outside in.
{% /callout %}
