---
title: Troubleshooting playbooks
seoTitle: "Debug Ansible Playbooks: -v, --check, debug Module"
description: "Troubleshoot playbooks with verbosity, syntax checks, check mode, diff and the debug module. Free RHCE (EX294) lesson with diagrams and practice."
kind: lesson
minutes: 12
---

{% lead %}
Most failed runs come down to a handful of mistakes: a quote missing, an indent too shallow, a variable misspelt, a value a module does not accept. Ansible's messages are long, but they are precise. Learning to read them, and knowing which tool answers which question, turns a frustrating hour into a two-minute fix.
{% /lead %}

{% objectives %}
- Tell from a message at which stage of a run a problem happened.
- Catch mistakes before anything runs with `--syntax-check`.
- See more of what Ansible is doing with verbosity, `debug`, and a log file.
- Re-run from the failing task, step through a play, and preview changes with check mode and diffs.
{% /objectives %}

## Start with where it failed

Every task goes through the same stages: the playbook is read, the hosts are chosen, Ansible connects, becomes root if asked, runs the module, and reports the result. A message tells you which stage failed, and that halves the search at once.

{% run-stages ref="run-stages" /%}

Two words in the output separate the big groups:

| Output | Meaning |
| --- | --- |
| `ERROR!` before any `PLAY` line | Ansible could not read the playbook. Nothing ran anywhere. |
| `UNREACHABLE!` | Ansible could not connect to that host. The task never started there. |
| `FAILED!` or `fatal:` | Ansible connected, and the task itself failed on that host. |

## Real messages, decoded

Every message below was produced by the ansible-core version this guide uses. Pick one to see what it means:

{% error-decoder ref="error-decoder" /%}

{% callout type="tip" title="Read the whole message" %}
Ansible usually points at a line and column, and then says "but may be elsewhere in the file". It is often the line **above** the one marked: a missing quote or colon only becomes a problem where the parser trips over it. For YAML errors, the last paragraph often suggests the fix, for example "Always quote template expression brackets when they start a value".
{% /callout %}

## Check the syntax first

```console
[student@workstation project]$ ansible-navigator run -m stdout site.yml --syntax-check

playbook: /home/student/project/site.yml
```

A syntax check reads every play, imported file and role, and stops at the first problem. It does not connect to any host, so it takes a second. Make it a habit before every run of a playbook you have just edited.

It cannot catch everything: an undefined variable, a wrong value for an argument, or a Jinja2 error inside a template only appear when the task runs.

## See more of what is happening

### Verbosity

Each `-v` adds detail, up to `-vvvv`:

{% verbosity ref="verbosity" /%}

`-v` shows each task's full result, which is often enough to see why a task did what it did. `-vvv` adds the SSH connection details, which is what you want for connection problems.

### The debug module

`ansible.builtin.debug` prints a message or a variable during the run. It is the quickest way to answer "what value did Ansible actually use?"

```yaml
- name: Show what the service task will use
  ansible.builtin.debug:
    var: web_service

- name: Show a fact in context
  ansible.builtin.debug:
    msg: "{{ inventory_hostname }} has {{ ansible_facts['memtotal_mb'] }} MiB of memory"
```

Give a debug task `verbosity: 2` to keep it in a playbook but show it only when you run with `-vv` or more.

### A log file

Output scrolls away. Set `log_path` in `ansible.cfg` and every run is also written to a file, with timestamps:

```ini {% title="ansible.cfg" %}
[defaults]
log_path = ./ansible.log
```

```text
2026-10-01 02:03:30,904 p=19809 u=student n=ansible | PLAY [Broken] ******************************************************************
2026-10-01 02:03:30,930 p=19809 u=student n=ansible | fatal: [servera.lab.example.com]: FAILED! => {"msg": "The task includes an option with an undefined variable. …
```

The user who runs Ansible must be able to write to the file. Keep log files out of version control. `ansible-navigator` also writes its own `ansible-navigator.log` in the directory you run it from; that one records what navigator did, not the playbook output.

### Playbook artifacts and replay

When it runs a playbook, `ansible-navigator` can also save everything about the run, every task result and every fact, in a JSON **playbook artifact** named after the playbook and the time, such as `site-artifact-2022-07-22T20:00:04.819343+00:00.json`. `ansible-navigator replay` shows a saved run again as if it had just happened, and in interactive mode lets you open each play, task and host result, which is a good way to study a failure after the terminal output is gone:

```console
[student@workstation project]$ ansible-navigator replay -m stdout samba-artifact.json
...output omitted...
PLAY RECAP *********************************************************************
servera.lab.example.com    : ok=8    changed=0    unreachable=0    failed=0  ...
```

Artifacts can contain sensitive values, and they pile up. Turn them off in `ansible-navigator.yml` when you do not want them:

```yaml {% title="ansible-navigator.yml" %}
ansible-navigator:
  playbook-artifact:
    enable: false
```

{% variant name="homelab" %}
Section 1.6 switched artifacts off for the home lab, because a playbook that prompts for a password cannot run with them on. To save one for a single run, add `--pae true --pas FILE.json` (`--playbook-artifact-enable`, `--playbook-artifact-save-as`).
{% /variant %}

## Write playbooks that are easy to troubleshoot

{% reveal title="Read the supporting details" %}

Most errors are easier to avoid than to find:

- Give every play and task a short **name** that says what it achieves. The output then reads like a checklist.
- Add **comments** where the reason for a task is not obvious.
- Use **blank lines** between tasks, and indent with spaces only, consistently.
- Keep it **simple**: a playbook that tries to be clever is the hardest to debug.

`ansible-lint` checks a playbook against a list of rules for style and good practice, and reports syntax errors like `--syntax-check` does:

```console
[student@workstation project]$ ansible-lint secure-web.yml
...output omitted...
# Rule Violation Summary

  1 package-latest profile:safety tags:idempotency

Failed: 1 failure(s), 0 warning(s) in 1 files processed of 1 encountered. Last profile that met the validation criteria was 'moderate'. Rating: 2/5 star
package-latest: Package installs should not use latest.
secure-web.yml:11 Task/Handler: Install web server packages
```

Each finding names the rule, the file and line, and the task. A project can switch rules off, or turn them into warnings, in `.ansible-lint` or `.config/ansible-lint.yml`, with `skip_list` and `warn_list`. Treat its findings as advice: `state: latest` is a deliberate choice in some playbooks.

{% variant name="homelab" %}
`ansible-lint` was installed with `ansible-navigator`, in the same virtual environment, but section 1.6 linked only `ansible-navigator` into your path. Run it as `~/.venvs/navigator/bin/ansible-lint`, or link it too: `ln -s ~/.venvs/navigator/bin/ansible-lint ~/.local/bin/`.
{% /variant %}

{% /reveal %}

## Rerun only what matters

A long playbook that fails on its last task does not need to run from the top again.

| Option | Use it to |
| --- | --- |
| `--start-at-task "NAME"` | Start at the named task, skipping everything before it |
| `--list-tasks` | See the exact task names, to copy into `--start-at-task` |
| `--step` | Confirm each task before it runs: `(N)o/(y)es/(c)ontinue` |
| `--limit HOST` | Try a fix on one host first |

```console
[student@workstation project]$ ansible-navigator run -m stdout site.yml --start-at-task "Web service is running"
```

{% callout type="warning" title="Skipped tasks can matter" %}
With `--start-at-task`, the earlier tasks do not run, so anything they would have registered or set is missing. If a later task depends on a registered variable, start earlier. Use `--step` with `-m stdout`, as everywhere in this guide, so that its prompts appear in your terminal.
{% /callout %}

## Preview changes: check mode and diffs

`--check` runs the play without changing anything. Each task that supports check mode reports what it **would** do. `--diff` shows, line by line, how files would change. Together they are the safest way to see the effect of a playbook on a production host:

{% check-mode-sim ref="check-mode-sim" /%}

A task can opt in or out whatever the command line says: `check_mode: true` always simulates, `check_mode: false` always really runs. The second is handy for a read-only command whose result later tasks need even in check mode.

## Test the result, not just the run

A recap full of `ok` means the tasks succeeded, not that the service works. End a playbook, or a separate test playbook, with tasks that check the outcome:

```yaml
- name: The site answers
  hosts: localhost
  gather_facts: false
  tasks:
    - name: Home page returns our text
      ansible.builtin.uri:
        url: http://servera.lab.example.com
        return_content: true
      register: page
      failed_when: "'Deployed by Ansible' not in page.content"

    - name: There is enough memory
      ansible.builtin.assert:
        that:
          - hostvars['servera.lab.example.com']['ansible_facts']['memtotal_mb'] >= 512
        fail_msg: servera has too little memory for this service
```

`ansible.builtin.assert` fails with your message when a condition is false:

```text
    "assertion": "ansible_facts[\"memtotal_mb\"] >= 4096",
    "evaluated_to": false,
    "msg": "Not enough memory: 937 MiB"
```

{% callout type="exam" title="A routine for any failure" %}
Syntax check. Read the whole message and note the stage. Look at the line above the one marked. Add `-v` or a `debug` task if the cause is not obvious. Fix, and rerun with `--start-at-task`. When it passes, run the whole playbook once more and look for `changed=0`.
{% /callout %}

{% quiz
  objectives=["ch09.playbook-errors"]
  id="check"
  title="Check your understanding"
  ref="check" /%}

## Takeaway

Tell from a message at which stage of a run a problem happened. Use the chapter lab to check this on a real host.
