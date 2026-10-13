---
title: Running tasks conditionally
seoTitle: "Ansible when Conditions With Examples"
description: "Run tasks conditionally with when, facts, registered results and combined conditions. Free RHCE (EX294) lesson with diagrams and practice."
kind: lesson
minutes: 12
---

{% lead %}
Not every task belongs on every host. Conditionals let a task decide, host by host, whether to run: only on RHEL, only with enough memory, only if a variable is set, only if an earlier command succeeded.
{% /lead %}

{% objectives %}
- Run a task only when a condition is true, with `when`.
- Compare strings and numbers, test whether variables are defined, and test list membership.
- Combine conditions with `and`, `or`, lists and parentheses.
- Avoid the string-versus-Boolean trap.
- Combine `when` with loops and with registered results.
{% /objectives %}

## Why conditionals

Conditionals let one playbook treat hosts differently according to what they are. Any variable can be tested: playbook variables, registered results and facts. Typical uses:

- Compare a limit you defined, such as `min_memory`, with the memory a host really has.
- Check a command's output before carrying on, and skip later steps if it failed.
- Use facts about a host's network configuration to decide which configuration file to send.
- Tune a service from the number of CPUs.
- Compare a registered checksum with a known value to see whether a file changed.

## The when keyword

Add **`when`** to a task with a condition as its value. If the condition is true on a host, the task runs there; if it is false, the task is **skipped** on that host.

```yaml
- name: Simple Boolean Task Demo
  hosts: all
  vars:
    run_my_task: true
  tasks:
    - name: httpd package is installed
      ansible.builtin.dnf:
        name: httpd
      when: run_my_task
```

{% callout type="important" title="when goes at the task level" %}
`when` is not a module argument. Indent it at the same level as the task's `name` and module, never under the module. By convention it is written last in the task, after the module and its arguments.
{% /callout %}

Notice that the condition is **not** wrapped in `{{ }}`. `when` is already evaluated as a Jinja2 expression, so you write variable names directly.

## Trying conditions

Pick a condition and see which of three hosts would run the task. `servera` and `serverb` run RHEL 9; `fedora1` runs Fedora 34; only two of them define `my_service`.

{% condition-playground ref="condition-playground" /%}

### Operators you will use

| Test | Example |
| --- | --- |
| Equal (string) | `ansible_facts['machine'] == "x86_64"` |
| Equal (number) | `max_memory == 512` |
| Less than / greater than | `min_memory < 128`, `min_memory > 256` |
| Less / greater or equal | `min_memory <= 256`, `min_memory >= 512` |
| Not equal | `min_memory != 512` |
| Variable exists | `min_memory is defined` |
| Variable does not exist | `min_memory is not defined` |
| Boolean is true (`1`, `True`, `yes` also count) | `memory_available` |
| Boolean is false (`0`, `False`, `no` also count) | `not memory_available` |
| Value is in a list | `ansible_facts['distribution'] in supported_distros` |

Strings are quoted; numbers are not. `is defined` is especially useful for optional settings: the task simply skips on hosts where the variable was never set, instead of failing.

```yaml
- name: Test Variable is Defined Demo
  hosts: all
  vars:
    my_service: httpd
  tasks:
    - name: "{{ my_service }} package is installed"
      ansible.builtin.dnf:
        name: "{{ my_service }}"
      when: my_service is defined
```

The `in` test compares one value with a list:

```yaml
- name: Demonstrate the "in" keyword
  hosts: all
  gather_facts: true
  vars:
    supported_distros:
      - RedHat
      - Fedora
  tasks:
    - name: Install httpd using dnf, where supported
      ansible.builtin.dnf:
        name: httpd
        state: present
      when: ansible_facts['distribution'] in supported_distros
```

## Booleans and the string trap

{% callout type="warning" title="\"false\" in quotes is true" %}
Since Ansible Core 2.12 (AAP 2.2 uses 2.13), `when` treats any **non-empty string** as true. So `run_my_task: "false"`, in quotes, is a string with content, and the task **runs**. Written without quotes, `run_my_task: false` is a real Boolean and the task is skipped.

If a value might arrive as a string (from an INI custom fact, a survey, or `-e`), convert it explicitly:

```yaml
when: run_my_task | bool
```
{% /callout %}

YAML 1.1, which Ansible uses, also accepts `yes`/`no`, `True`/`False` and `1`/`0` as Booleans. The YAML 1.2 standard only accepts `true` and `false`, and the Ansible community is gradually standardising on those. You will see both in existing content.

{% callout type="note" title="Newer cores require booleans" %}
Core 2.19 rejects non-boolean conditional results. Use actual booleans or an explicit conversion such as `run_my_task | bool` when working with input strings.
{% /callout %}

## Several conditions

Combine conditions with **`or`** (either is enough) and **`and`** (both are needed):

```yaml
when: ansible_facts['distribution'] == "RedHat" or ansible_facts['distribution'] == "Fedora"
```

{% variant name="homelab" title="Your servers answer Rocky" %}
The home-lab VMs run Rocky Linux, so `ansible_facts['distribution']` is `"Rocky"` and a condition that tests for `"RedHat"` is **false** there. Two ways to practise these examples at home:

- test for `"Rocky"` where an example says `"RedHat"`;
- or test the family instead: `ansible_facts['os_family'] == "RedHat"` is true on RHEL, Rocky, AlmaLinux and CentOS Stream alike, which is usually what a real playbook wants.

Check what your hosts report: `ansible all -m ansible.builtin.setup -a 'filter=ansible_distribution*'`.
{% /variant %}

```yaml
when: ansible_facts['distribution_version'] == "9.0" and ansible_facts['kernel'] == "5.14.0-70.13.1.el9_0.x86_64"
```

A **list** under `when` means all of its conditions must be true (an implicit `and`), and is easier to read:

```yaml
when:
  - ansible_facts['distribution_version'] == "9.0"
  - ansible_facts['kernel'] == "5.14.0-70.13.1.el9_0.x86_64"
```

Use **parentheses** to group more complex logic, and the YAML `>` folded style to split it over several lines:

```yaml
when: >
  ( ansible_facts['distribution'] == "RedHat" and
    ansible_facts['distribution_major_version'] == "9" )
  or
  ( ansible_facts['distribution'] == "Fedora" and
    ansible_facts['distribution_major_version'] == "34" )
```

## Loops and conditions together

When a task has both `loop` and `when`, the condition is checked **for each item**. Here `ansible_facts['mounts']` is a list of dictionaries, one per mounted file system, and the package is installed only if `/` has more than 300 MB free:

```yaml
- name: install mariadb-server if enough space on root
  ansible.builtin.dnf:
    name: mariadb-server
    state: latest
  loop: "{{ ansible_facts['mounts'] }}"
  when: item['mount'] == "/" and item['size_available'] > 300000000
```

## Conditions on registered results

A common pattern: run a check, register the result, and decide what to do next. This play restarts Apache only if Postfix is running:

```yaml
- name: Restart HTTPD if Postfix is Running
  hosts: all
  tasks:
    - name: Get Postfix server status
      ansible.builtin.command: /usr/bin/systemctl is-active postfix
      register: result

    - name: Restart Apache HTTPD based on Postfix status
      ansible.builtin.service:
        name: httpd
        state: restarted
      when: result.rc == 0
```

`systemctl is-active` exits with `0` when the service is active, so `result.rc == 0` means "Postfix is running". (If Postfix is not running, the first task fails; in the task failure section you will see how to keep the play going with `ignore_errors`.)

{% quiz
  objectives=["ch05.loops-conditions","ch05.handlers","ch05.failure"]
  id="check"
  title="Check your understanding"
  ref="check" /%}

## Takeaway

Run a task only when a condition is true, with `when`. Use the chapter lab to check this on a real host.
