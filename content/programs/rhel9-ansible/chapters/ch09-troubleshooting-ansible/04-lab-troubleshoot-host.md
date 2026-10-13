---
title: "Exercise: Troubleshooting Ansible managed hosts"
seoTitle: "Troubleshooting Ansible managed hosts (RHCE Practice Exercise)"
description: "Hands-on RHCE practice: troubleshooting Ansible managed hosts. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 20
---

{% lead %}
You will troubleshoot two playbooks that fail on a managed host: one that fails only in check mode, and one that cannot reach its host at all, even though an ad hoc command can.
{% /lead %}

The project `~/troubleshoot-host` has an `ansible.cfg`, an `inventory`, the playbooks `mailrelay.yml` and `samba.yml`, and their templates. `mailrelay.yml` sets up servera as a Postfix mail relay; `samba.yml` is the playbook you fixed in the previous exercise.

{% lab
  objectives=["ch09.host-errors"]
  id="troubleshoot-host"
  title="Troubleshooting Ansible managed hosts"
  exercise="troubleshoot-host"
  hosts=["workstation","servera.lab.example.com"]
  outcomes=["Troubleshoot managed hosts with check mode, ad hoc commands and verbose output."] %}
{% lab-notes %}

**Prerequisites:** Complete [control-node setup](#/ch01/control-node) and the preceding lessons in this chapter. Run commands as student on workstation unless a step names another machine.

{% reveal title="Verify your work" %}

From the project directory, run the relevant home-lab check. For an exercise with several checkpoints, grade each state before changing or removing it:

```bash
lab grade troubleshoot-host
```

The grader reads project files and host state. A passing report covers the listed checks; also perform the task’s independent connection, repeat-run, and reboot checks where requested.

Starter files contain deliberate YAML, inventory, or task errors. Repair them before the final checkpoint.

{% /reveal %}

{% reveal title="Try an independent variation" %}

Temporarily remove SMTP firewall access. Compare a successful service check with a failed connection from workstation.

Record the published result first. The grader checks the original requirements, so a changed name or value may intentionally fail those checks.

{% /reveal %}

{% /lab-notes %}

{% lab-challenge %}

Determine which failures come from the execution mode and which come from host access.

- Explain why the supplied mail playbook can fail in check mode on a clean host; its real run must prepare the service.
- Servera must accept SMTP connections on port 25 through its firewall.
- The Samba playbook must reach the intended server and complete successfully.
- Use independent SSH/Ansible connection evidence before changing access settings. Record the failing target, cause, and correction for each issue.

{% /lab-challenge %}

  {% task id="task-260280c9d635" legacyIndex=1 title="Try the mail relay in check mode" %}

```console
[student@workstation ~]$ cd ~/troubleshoot-host
[student@workstation troubleshoot-host]$ ansible-navigator run -m stdout mailrelay.yml --check

PLAY [Create mail relay servers] ***********************************************

TASK [Gathering Facts] *********************************************************
ok: [servera.lab.example.com]

TASK [Install postfix package] *************************************************
changed: [servera.lab.example.com]

TASK [Install mail config files] ***********************************************
changed: [servera.lab.example.com]

TASK [Check main.cf file] ******************************************************
ok: [servera.lab.example.com]

TASK [Verify main.cf file exists] **********************************************
skipping: [servera.lab.example.com]

TASK [Start and enable mail services] ******************************************
fatal: [servera.lab.example.com]: FAILED! => {"changed": false, "msg": "Could not find the requested service postfix: host"}

PLAY RECAP *********************************************************************
servera.lab.example.com    : ok=4    changed=2    unreachable=0    failed=1    skipped=1  ...
```

    `Check main.cf file` uses the `stat` module, and `Verify main.cf file exists` reports only when the file is there. Both tell the same story: in check mode the `postfix` package was not really installed, so neither its configuration file nor its service exists. The failure is an artefact of check mode, not a problem in the playbook.
  {% /task %}

  {% task id="task-0eaaea1c8a3d" legacyIndex=2 title="Run it for real" %}

```console
[student@workstation troubleshoot-host]$ ansible-navigator run -m stdout mailrelay.yml
...output omitted...
TASK [Check main.cf file] ******************************************************
ok: [servera.lab.example.com]

TASK [Verify main.cf file exists] **********************************************
ok: [servera.lab.example.com] => {
    "msg": "The main.cf file exists"
}

TASK [Start and enable mail services] ******************************************
changed: [servera.lab.example.com]
...output omitted...
PLAY RECAP *********************************************************************
servera.lab.example.com    : ok=8    changed=4    unreachable=0    failed=0    skipped=1  ...
```

    The error is gone.
  {% /task %}

  {% task id="task-c3eaa3944498" legacyIndex=3 title="Let mail in through the firewall" %}
    Postfix runs, but other hosts cannot reach it. Add a task at the end of the play, before the handlers, that enables the `smtp` service in the firewall:

```yaml
    - name: Postfix firewalld config
      ansible.posix.firewalld:
        state: enabled
        permanent: true
        immediate: true
        service: smtp
```

```console
[student@workstation troubleshoot-host]$ ansible-navigator run -m stdout mailrelay.yml
...output omitted...
TASK [Postfix firewalld config] ************************************************
changed: [servera.lab.example.com]

PLAY RECAP *********************************************************************
servera.lab.example.com    : ok=8    changed=1    unreachable=0    failed=0    skipped=1  ...
```
  {% /task %}

  {% task id="task-abda28e1c058" legacyIndex=4 title="Test the mail port" %}

    {% variant-group %}
      {% variant name="classroom" %}

```console
[student@workstation troubleshoot-host]$ telnet servera.lab.example.com 25
Trying 172.25.250.10...
Connected to servera.lab.example.com.
Escape character is '^]'.
220 servera.lab.example.com ESMTP Postfix
quit
221 2.0.0 Bye
Connection closed by foreign host.
```
      {% /variant %}
      {% variant name="homelab" %}
        `telnet` is not installed on the home-lab workstation. Bash can open the connection itself:

```console
[student@workstation troubleshoot-host]$ exec 3<>/dev/tcp/servera.lab.example.com/25; \
> head -1 <&3; printf 'QUIT\r\n' >&3; head -1 <&3; exec 3<&-
220 servera.lab.example.com ESMTP Postfix
221 2.0.0 Bye
```
      {% /variant %}
    {% /variant-group %}

    The relay answers on TCP port 25.
  {% /task %}

  {% task id="task-a780e5758806" legacyIndex=5 title="Run the Samba playbook" %}

```console
[student@workstation troubleshoot-host]$ ansible-navigator run -m stdout samba.yml

PLAY [Install a samba server] **************************************************

TASK [Gathering Facts] *********************************************************
fatal: [servera.lab.exammple.com]: UNREACHABLE! => {"changed": false, "msg": "Failed to connect to the host via ssh: ssh: connect to host servera.lab.exammple.com port 22: Network is unreachable", "unreachable": true}

PLAY RECAP *********************************************************************
servera.lab.exammple.com   : ok=0    changed=0    unreachable=1    failed=0  ...
```

    The very first task cannot connect. In a classroom the message may instead end in `Connection timed out`; either way, SSH never reached a server.
  {% /task %}

  {% task id="task-c389582f9dd3" legacyIndex=6 title="Is it the connection?" %}
    Check, outside Ansible, that you can log in to servera as `devops`, then with an ad hoc command:

```console
[student@workstation troubleshoot-host]$ ssh devops@servera.lab.example.com hostname
servera.lab.example.com
[student@workstation troubleshoot-host]$ ansible servera.lab.example.com -m ansible.builtin.ping
servera.lab.example.com | SUCCESS => {
    "ansible_facts": {
        "discovered_interpreter_python": "/usr/bin/python3"
    },
    "changed": false,
    "ping": "pong"
}
```

    Both work. So the keys, the user and SSH are fine: the problem is in what the playbook asks Ansible to connect to.
  {% /task %}

  {% task id="task-80dee2838b4c" legacyIndex=7 title="Ask for detail" %}

```console
[student@workstation troubleshoot-host]$ ansible-navigator run -m stdout samba.yml -vvvv
ansible-playbook [core 2.14.18]
  config file = /home/student/troubleshoot-host/ansible.cfg
...output omitted...
PLAYBOOK: samba.yml ************************************************************
...output omitted...
verbosity: 4
...output omitted...
inventory: ('/home/student/troubleshoot-host/inventory',)
...output omitted...
<servera.lab.exammple.com> ESTABLISH SSH CONNECTION FOR USER: devops
...output omitted...
fatal: [servera.lab.exammple.com]: UNREACHABLE! => {
...output omitted...
```

    The first lines show which configuration file and inventory are in use. `ESTABLISH SSH CONNECTION` shows the name Ansible is really connecting to: `servera.lab.exammple.com`, with two `m`s.
  {% /task %}

  {% task id="task-d2c1463dbdea" legacyIndex=8 title="Fix the inventory" %}
    The host in the `samba_servers` group is misspelled. Correct it:

```ini {% title="inventory" %}
[mailrelay]
servera.lab.example.com

[samba_servers]
servera.lab.example.com
```

```console
[student@workstation troubleshoot-host]$ ansible-navigator run -m stdout samba.yml
...output omitted...
PLAY RECAP *********************************************************************
servera.lab.example.com    : ok=8    changed=4    unreachable=0    failed=0  ...
```

    Every task succeeds. If you did not reset the servers after the previous exercise, Samba is already set up and the run reports `changed=0` instead.
  {% /task %}

  {% task id="task-40692fc504fd" legacyIndex=9 title="Finish" %}
    {% lab-finish exercise="troubleshoot-host" /%}
  {% /task %}
{% /lab %}
