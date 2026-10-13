---
title: "Exercise: Building an inventory"
seoTitle: "Building an inventory (RHCE Practice Exercise)"
description: "Hands-on RHCE practice: building an inventory. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 15
---

{% lead %}
You will build a static inventory for four web servers, grouping them three different ways (by city, by environment, and by country), then prove the groups are right with `ansible-navigator inventory`.
{% /lead %}

These are the four managed hosts and their properties:

| Host name | Purpose | Location | Environment |
| --- | --- | --- | --- |
| `servera.lab.example.com` | Web server | Raleigh | Development |
| `serverb.lab.example.com` | Web server | Raleigh | Testing |
| `serverc.lab.example.com` | Web server | Mountain View | Production |
| `serverd.lab.example.com` | Web server | London | Production |

The US cities (Raleigh and Mountain View) must also be children of a `us` group, so all US hosts can be managed together.

{% lab
  objectives=["ch03.inventory"]
  id="inventory"
  title="Building an Ansible inventory"
  exercise="playbook-inventory"
  hosts=["workstation","servera … serverd"]
  outcomes=["Create a custom static inventory with groups and child groups.","Verify hosts and groups with ansible-navigator inventory."] %}
{% lab-notes %}

**Prerequisites:** Complete [control-node setup](#/ch01/control-node) and the preceding lessons in this chapter. Run commands as student on workstation unless a step names another machine.

{% reveal title="Verify your work" %}

From the project directory, run the relevant home-lab check. For an exercise with several checkpoints, grade each state before changing or removing it:

```bash
lab grade playbook-inventory
```

The grader reads project files and host state. A passing report covers the listed checks; also perform the task’s independent connection, repeat-run, and reboot checks where requested.

{% /reveal %}

{% reveal title="Try an independent variation" %}

Add a fifth host in London for testing. Predict which city, country, environment, and function selections change.

Record the published result first. The grader checks the original requirements, so a changed name or value may intentionally fail those checks.

{% /reveal %}

{% /lab-notes %}

{% lab-challenge %}

An operations team needs to target these four servers by function, city, environment, and country.

- Save a static `inventory` matching the host table above, using lowercase group names: `webservers`, `raleigh`, `mountainview`, `london`, `development`, `testing`, and `production`.
- `us` must contain the Raleigh and Mountain View groups. Every host must belong to a named group.
- Prove the complete host list, the production membership, and the inherited membership of `us`. No server configuration should change.

{% /lab-challenge %}

  {% task id="task-fa234038afb7" legacyIndex=1 title="Move into the project directory" %}

```console
[student@workstation ~]$ cd ~/playbook-inventory
[student@workstation playbook-inventory]$
```
  {% /task %}

  {% task id="task-7b4906552ab0" legacyIndex=2 title="Write the inventory file" %}
    Create a file called `inventory` in the project directory. Try it yourself from the table above first, then compare with the solution.

    {% reveal title="Show the finished inventory" %}

```ini {% title="inventory" %}
[webservers]
server[a:d].lab.example.com

[raleigh]
servera.lab.example.com
serverb.lab.example.com

[mountainview]
serverc.lab.example.com

[london]
serverd.lab.example.com

[development]
servera.lab.example.com

[testing]
serverb.lab.example.com

[production]
serverc.lab.example.com
serverd.lab.example.com

[us:children]
raleigh
mountainview
```

    Notice the alphabetic range `server[a:d]` for the `webservers` group.
    {% /reveal %}
  {% /task %}

  {% task id="task-aa93e194a7fc" legacyIndex=3 title="List every host and group" %}
    Because this inventory is not the default, every command needs `-i inventory`.

```console
[student@workstation playbook-inventory]$ ansible-navigator inventory \
> -i inventory -m stdout --list
```

    In the JSON, check that `all.children` lists `development`, `london`, `mountainview`, `production`, `raleigh`, `testing`, `ungrouped`, `us` and `webservers`, and that `us` has `mountainview` and `raleigh` as children.
  {% /task %}

  {% task id="task-3fa584c5566c" legacyIndex=4 title="Confirm nothing is ungrouped" %}

```console
[student@workstation playbook-inventory]$ ansible-navigator inventory \
> -i inventory -m stdout --graph ungrouped
@ungrouped:
```

    An empty group is the right answer: every host belongs to at least one named group.
  {% /task %}

  {% task id="task-33d5633c31ab" legacyIndex=5 title="Graph the environment groups" %}

```console
[student@workstation playbook-inventory]$ ansible-navigator inventory \
> -i inventory -m stdout --graph development
@development:
  |--servera.lab.example.com
[student@workstation playbook-inventory]$ ansible-navigator inventory \
> -i inventory -m stdout --graph testing
@testing:
  |--serverb.lab.example.com
[student@workstation playbook-inventory]$ ansible-navigator inventory \
> -i inventory -m stdout --graph production
@production:
  |--serverc.lab.example.com
  |--serverd.lab.example.com
```
  {% /task %}

  {% task id="task-69fb390048f8" legacyIndex=6 title="Graph the nested us group" %}

```console
[student@workstation playbook-inventory]$ ansible-navigator inventory \
> -i inventory -m stdout --graph us
@us:
  |--@mountainview:
  |  |--serverc.lab.example.com
  |--@raleigh:
  |  |--servera.lab.example.com
  |  |--serverb.lab.example.com
```

    Child groups are shown with an `@` and their hosts are indented beneath them.
  {% /task %}

  {% task id="task-e50e9ac21f3f" legacyIndex=7 title="Browse it interactively" %}
    Run the command without `-m stdout`. Type `:0` to browse groups, `:1` to browse hosts, and `:q` to quit.

```console
[student@workstation playbook-inventory]$ ansible-navigator inventory -i inventory
  Title              Description
0│Browse groups      Explore each inventory group and group members members
1│Browse hosts       Explore the inventory with a list of all hosts
```
  {% /task %}

  {% task id="task-86a3adc7baa0" legacyIndex=8 title="Finish" %}
    {% lab-finish exercise="playbook-inventory" /%}
  {% /task %}
{% /lab %}

{% callout type="tip" title="Stretch goal" %}
Without looking, add a `europe` group containing `london`, and a `web_prod` group that holds only production web servers. Check both with `--graph`. You can rehearse in the inventory explorer on the previous page first.
{% /callout %}
