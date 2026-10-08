---
title: Writing loops
seoTitle: "Ansible Loops: loop, with_items and Examples"
description: "Repeat tasks with loop over lists and dictionaries, and register results inside loops. Free RHCE (EX294) lesson with diagrams and practice."
kind: lesson
minutes: 10
---

{% lead %}
Five users to create means five nearly identical tasks, unless you use a loop. A loop runs one task once for each item in a list, so the playbook stays short and adding a sixth user is a one-line change.
{% /lead %}

{% objectives %}
- Loop a task over a list with `loop` and `item`.
- Loop over a list of dictionaries and read each key.
- Recognise the older `with_*` loop keywords.
- Register the results of a looping task and use them.
{% /objectives %}

## Simple loops

Add the **`loop`** keyword to a task and give it a list. Ansible runs the task once per list entry, and during each run the variable **`item`** holds the current entry.

{% columns %}
  {% column title="Without a loop" tone="gray" %}

```yaml
- name: Postfix is running
  ansible.builtin.service:
    name: postfix
    state: started

- name: Dovecot is running
  ansible.builtin.service:
    name: dovecot
    state: started
```

  {% /column %}
  {% column title="With a loop" tone="green" %}

```yaml
- name: Postfix and Dovecot are running
  ansible.builtin.service:
    name: "{{ item }}"
    state: started
  loop:
    - postfix
    - dovecot
```

  {% /column %}
{% /columns %}

`loop` is a task keyword, so it sits at the task level, aligned with the module name, not inside the module's arguments.

Add and remove items below, and switch to a list of dictionaries, to see how one task becomes several runs:

{% loop-unroller ref="loop-unroller" /%}

## Looping over a variable

The list can come from a variable instead of being written in the task. Because the value then starts with `{{`, quote it:

```yaml
vars:
  mail_services:
    - postfix
    - dovecot

tasks:
  - name: Postfix and Dovecot are running
    ansible.builtin.service:
      name: "{{ item }}"
      state: started
    loop: "{{ mail_services }}"
```

## Looping over a list of dictionaries

Each list entry can be a dictionary. `item` is then the whole dictionary, and you read its keys with `item['key']`:

```yaml
- name: Users exist and are in the correct groups
  ansible.builtin.user:
    name: "{{ item['name'] }}"
    state: present
    groups: "{{ item['groups'] }}"
  loop:
    - name: jane
      groups: wheel
    - name: joe
      groups: root
```

The result: `jane` exists and is in `wheel`, and `joe` exists and is in `root`.

## Older loop keywords

Before Ansible 2.5, loops were written with keywords that start with `with_`, followed by the name of a lookup plug-in. You will still meet them in older playbooks and roles:

| Keyword | Behaviour |
| --- | --- |
| `with_items` | Like `loop` for simple lists. Unlike `loop`, if you give it a list of lists, it flattens them into one list first. |
| `with_file` | Takes a list of file names on the control node. `item` holds the **content** of each file in turn. |
| `with_sequence` | Generates a list from a numeric sequence. `item` holds each generated number. |

```yaml
vars:
  data:
    - user0
    - user1
    - user2
tasks:
  - name: "with_items"
    ansible.builtin.debug:
      msg: "{{ item }}"
    with_items: "{{ data }}"
```

{% callout type="important" title="Prefer loop" %}
Since Ansible 2.5, `loop` is the recommended keyword. Read `with_items` comfortably, because it is everywhere, but write `loop`. Any `with_*` loop can be rewritten with `loop` plus filters; the Ansible documentation's *Migrating from with_X to loop* page shows how. Everything in this course can be done with `loop` or `with_items`.
{% /callout %}

## Registering the results of a loop

`register` works on a looping task too, but the variable's shape changes. Instead of one result, it holds a **`results` list** with one entry per item, and each entry records which `item` it belongs to.

```yaml {% title="loop_register.yml" %}
- name: Loop Register Test
  gather_facts: false
  hosts: localhost
  tasks:
    - name: Looping Echo Task
      ansible.builtin.shell: "echo This is my item: {{ item }}"
      loop:
        - one
        - two
      register: echo_results

    - name: Show echo_results variable
      ansible.builtin.debug:
        var: echo_results
```

Explore the registered variable (trimmed to the most useful keys):

{% data-explorer ref="data-explorer" /%}

To use each result, loop over the `results` list. Inside that loop, `item` is one result dictionary:

```yaml
- name: Show stdout from the previous task
  ansible.builtin.debug:
    msg: "STDOUT from previous task: {{ item['stdout'] }}"
  loop: "{{ echo_results['results'] }}"
```

```text
ok: [localhost] => (item={'changed': True, 'stdout': 'This is my item: one', ...}) => {
    "msg": "STDOUT from previous task: This is my item: one"
}
ok: [localhost] => (item={'changed': True, 'stdout': 'This is my item: two', ...}) => {
    "msg": "STDOUT from previous task: This is my item: two"
}
```

{% quiz
  objectives=["ch05.loops-conditions"]
  id="check"
  title="Check your understanding"
  ref="check" /%}

## Takeaway

Loop a task over a list with `loop` and `item`. Use the chapter lab to check this on a real host.
