---
title: "Exercise: Selecting hosts with host patterns"
seoTitle: "Selecting hosts with host patterns (RHCE Practice Exercise)"
description: "Hands-on RHCE practice: selecting hosts with host patterns. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 20
---

{% lead %}
You will point one small play at two example inventories and change only its `hosts:` line, fourteen times, to see exactly what each kind of pattern selects. Predict each result before you run it. Nothing in this exercise connects to a managed host.
{% /lead %}

The project `~/projects-host` has an `ansible.cfg`, two inventories and a playbook. Most hosts in `inventory1` do not exist. That does not matter: the play does not gather facts, and its only task, `debug`, runs on the control node, so Ansible never tries to connect. It just shows which hosts the pattern matched.

{% lab
  objectives=["ch07.patterns"]
  id="patterns"
  title="Selecting hosts with host patterns"
  exercise="projects-host"
  hosts=["workstation"]
  outcomes=["Use names, groups, wildcards, lists, exclusions and intersections to select hosts from an inventory."] %}
{% lab-notes %}

**Prerequisites:** Complete [control-node setup](#/ch01/control-node) and the preceding lessons in this chapter. Run commands as student on workstation unless a step names another machine.

{% reveal title="Verify your work" %}

From the project directory, run the relevant home-lab check. For an exercise with several checkpoints, grade each state before changing or removing it:

```bash
lab grade projects-host
```

The grader reads project files and host state. A passing report covers the listed checks; also perform the task’s independent connection, repeat-run, and reboot checks where requested.

{% /reveal %}

{% reveal title="Try an independent variation" %}

Find hosts in London that are not databases. Predict their names before testing your pattern.

Record the published result first. The grader checks the original requirements, so a changed name or value may intentionally fail those checks.

{% /reveal %}

{% /lab-notes %}

{% lab-challenge %}

Predict and verify host selection without altering any systems. Use the two supplied inventories and `playbook.yml`.

- In `inventory1`, select a single named host, a listed IP, all hosts, names ending in `example.com`, and that domain excluding `lab.example.com`.
- Select exactly `lb1.lab.example.com`, `s1.lab.example.com`, and `db1.example.com`; then select addresses beginning `172.25.`.
- Compare a wildcard that matches `stage` with one that matches individual host names. Select the union of production, addresses beginning `172`, and names containing `lab`; then the intersection of database and London hosts.
- In `inventory2`, verify London, Europe, ungrouped, and the missing Australia group. Explain why a missing group can produce a successful run that performs no work.

{% /lab-challenge %}

  {% task id="task-f242ad3b5bb6" legacyIndex=1 title="Look at the project" %}

```console
[student@workstation ~]$ cd ~/projects-host
[student@workstation projects-host]$ ls
ansible.cfg  inventory1  inventory2  playbook.yml
```

    Read `inventory1`. It has four hosts outside any group, groups by function (`web`, `db`, `lb`), by city (`boston`, `london`) and by environment (`dev`, `stage`, `prod`, `new`), and three layers of parent groups. Some hosts are in `lab.example.com`, some directly in `example.com`, and `new` lists three IP addresses.

```ini {% title="inventory1 (the groups)" %}
[web]
jupiter.lab.example.com
saturn.example.com

[db]
db1.example.com
db2.example.com
db3.example.com

[lb]
lb1.lab.example.com
lb2.lab.example.com

[boston]
db1.example.com
jupiter.lab.example.com
lb2.lab.example.com

[london]
db2.example.com
db3.example.com
file1.lab.example.com
lb1.lab.example.com

[dev]
web1.lab.example.com
db3.example.com

[stage]
file2.example.com
db2.example.com

[prod]
lb2.lab.example.com
db1.example.com
jupiter.lab.example.com

[function:children]
web
db
lb
city

[city:children]
boston
london
environments

[environments:children]
dev
stage
prod
new

[new]
172.25.252.23
172.25.252.44
172.25.252.32
```

    `inventory2` is much smaller: `workstation.lab.example.com` outside any group, one server in each of `london`, `berlin`, `tokyo` and `atlanta`, and a parent group `europe` made of `london` and `berlin`.

    The playbook prints the name of each host it matches:

```yaml {% title="playbook.yml" %}
---
- name: Resolve host patterns
  hosts: db1.example.com
  gather_facts: false
  tasks:
    - name: Display managed hosts matching the host pattern
      ansible.builtin.debug:
        msg: "{{ inventory_hostname }}"
```
  {% /task %}

  {% task id="task-4c82b8cef257" legacyIndex=2 title="One host by name" %}
    Run the playbook against `inventory1` as it is:

```console
[student@workstation projects-host]$ ansible-navigator run \
> -m stdout playbook.yml -i inventory1

PLAY [Resolve host patterns] ***************************************************

TASK [Display managed hosts matching the host pattern] *************************
ok: [db1.example.com] => {
    "msg": "db1.example.com"
}

PLAY RECAP *********************************************************************
db1.example.com            : ok=1    changed=0    unreachable=0    failed=0  ...
```

    For the rest of the exercise, only change the `hosts:` line and run the same command. The outputs below show just the `ok:` line of each matched host.
  {% /task %}

  {% task id="task-89eff933ba5b" legacyIndex=3 title="One host by IP address" %}
    Set `hosts: 172.25.252.44`.

```text
ok: [172.25.252.44]
```

    This works only because the inventory lists that address. An address that merely resolves to an inventory host, or a DNS name that the inventory does not contain, matches nothing.
  {% /task %}

  {% task id="task-117e9b17ddc2" legacyIndex=4 title="Every host" %}
    Set `hosts: all`. All seventeen hosts are listed: the four without a group, the ten named hosts in groups, and the three addresses.
  {% /task %}

  {% task id="task-0d976cb50072" legacyIndex=5 title="A domain, with a wildcard" %}
    Set `hosts: '*example.com'`, with the quotes.

```text
ok: [srv1.example.com]
ok: [srv2.example.com]
ok: [s1.lab.example.com]
ok: [s2.lab.example.com]
ok: [jupiter.lab.example.com]
ok: [saturn.example.com]
ok: [db1.example.com]
ok: [db2.example.com]
ok: [db3.example.com]
ok: [lb1.lab.example.com]
ok: [lb2.lab.example.com]
ok: [file1.lab.example.com]
ok: [web1.lab.example.com]
ok: [file2.example.com]
```

    Fourteen hosts: every name that ends in `example.com`, including those in `lab.example.com`. Only the three IP addresses are left out.

    {% callout type="warning" title="Quote a pattern that starts with *" %}
    Without the quotes, YAML reads `*example.com` as a reference to an anchor, and the playbook does not even load: `ERROR! We were unable to read either as JSON nor YAML`.
    {% /callout %}
  {% /task %}

  {% task id="task-735b16c3af22" legacyIndex=6 title="Leave out a subdomain" %}
    Keep the hosts in `example.com` but drop everything in `lab.example.com`:

```yaml
  hosts: '*.example.com, !*.lab.example.com'
```

```text
ok: [srv1.example.com]
ok: [srv2.example.com]
ok: [saturn.example.com]
ok: [db1.example.com]
ok: [db2.example.com]
ok: [db3.example.com]
ok: [file2.example.com]
```
  {% /task %}

  {% task id="task-0aee66c811f8" legacyIndex=7 title="A list of hosts" %}
    Without using any group, select exactly `lb1.lab.example.com`, `s1.lab.example.com` and `db1.example.com`.

    {% reveal title="Show the pattern" %}

```yaml
  hosts: lb1.lab.example.com,s1.lab.example.com,db1.example.com
```

```text
ok: [lb1.lab.example.com]
ok: [s1.lab.example.com]
ok: [db1.example.com]
```
    {% /reveal %}
  {% /task %}

  {% task id="task-b7cd55ea55ef" legacyIndex=8 title="Addresses by prefix" %}
    Select every host whose address starts with `172.25.`

    {% reveal title="Show the pattern" %}

```yaml
  hosts: '172.25.*'
```

```text
ok: [172.25.252.23]
ok: [172.25.252.44]
ok: [172.25.252.32]
```
    {% /reveal %}
  {% /task %}

  {% task id="task-f6438705f5a6" legacyIndex=9 title="A wildcard that matches a group" %}
    Set `hosts: 's*'` and predict the result before you run it.

```text
ok: [file2.example.com]
ok: [db2.example.com]
ok: [srv1.example.com]
ok: [srv2.example.com]
ok: [s1.lab.example.com]
ok: [s2.lab.example.com]
ok: [saturn.example.com]
```

    `file2` and `db2` do not start with `s`. They are here because they are in the group `stage`, which does. A wildcard is matched against host names **and** group names, and it cannot tell them apart.
  {% /task %}

  {% task id="task-333fe9fe3ffc" legacyIndex=10 title="Mix groups and wildcards" %}
    In one pattern, select the hosts in `prod`, every address that starts with `172`, and every host with `lab` in its name.

    {% reveal title="Show the pattern" %}

```yaml
  hosts: 'prod,172*,*lab*'
```

```text
ok: [lb2.lab.example.com]
ok: [db1.example.com]
ok: [jupiter.lab.example.com]
ok: [172.25.252.23]
ok: [172.25.252.44]
ok: [172.25.252.32]
ok: [s1.lab.example.com]
ok: [s2.lab.example.com]
ok: [lb1.lab.example.com]
ok: [file1.lab.example.com]
ok: [web1.lab.example.com]
```

    Each host appears once, even when several terms match it.
    {% /reveal %}
  {% /task %}

  {% task id="task-3a2a11eb1a42" legacyIndex=11 title="Hosts in two groups at once" %}
    Select the hosts that are in both `db` and `london`.

    {% reveal title="Show the pattern" %}

```yaml
  hosts: db,&london
```

```text
ok: [db2.example.com]
ok: [db3.example.com]
```

    `db1` is in `db` but in `boston`, so the intersection drops it.
    {% /reveal %}
  {% /task %}

  {% task id="task-a2605d529778" legacyIndex=12 title="Groups and nested groups in inventory2" %}
    Switch to the second inventory and try three patterns, running with `-i inventory2`:

```console
[student@workstation projects-host]$ ansible-navigator run \
> -m stdout playbook.yml -i inventory2
```

    | `hosts:` | Matches |
    | --- | --- |
    | `london` | servera.lab.example.com |
    | `europe` | servera.lab.example.com, serverb.lab.example.com |
    | `ungrouped` | workstation.lab.example.com |

    `europe` has no hosts of its own; it contains the hosts of its child groups. `ungrouped` is a built-in group of the hosts that are in no other group.
  {% /task %}

  {% task id="task-ea3f377de5a1" legacyIndex=13 title="A group that does not exist" %}
    Set `hosts: australia` and run against `inventory2`:

```console
[student@workstation projects-host]$ ansible-navigator run \
> -m stdout playbook.yml -i inventory2
[WARNING]: Could not match supplied host pattern, ignoring: australia

PLAY [Resolve host patterns] ***************************************************
skipping: no hosts matched

PLAY RECAP *********************************************************************
```

    Not an error: a warning, and a play that does nothing. A misspelled group name behaves exactly like this, which is why the warning is worth reading.
  {% /task %}

  {% task id="task-ed4dfc2e5a8e" legacyIndex=14 title="Finish" %}
    {% lab-finish exercise="projects-host" /%}
  {% /task %}
{% /lab %}

## Try it again, differently

Without running anything first, write down the hosts each pattern selects from `inventory1`, then check with `ansible 'PATTERN' -i inventory1 --list-hosts`: `'city,!london'`, `'environments,&*.lab.example.com'`, `'d*'`, `'all,!function'`.
