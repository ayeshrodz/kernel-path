---
title: Selecting hosts with host patterns
seoTitle: "Ansible Host Patterns and --limit Examples"
description: "Select hosts with patterns: groups, wildcards, intersections, exclusions and --limit. Free RHCE (EX294) lesson with diagrams and practice."
kind: lesson
minutes: 12
---

{% lead %}
Every play starts by answering one question: which machines? So far the answer has been a single group name. A host pattern can say much more: these two groups, this group except the staging machines, only the hosts that are in both. Getting the pattern right is what makes it safe to run a play against a large inventory.
{% /lead %}

{% objectives %}
- Select hosts by name, by group, with wildcards and with lists.
- Combine groups with intersections (`&`) and exclusions (`!`).
- Narrow a run from the command line with `--limit`.
- Check what a pattern selects before anything runs.
{% /objectives %}

## Where patterns are used

A **host pattern** is the value you give to `hosts:` in a play. The same syntax works in two other places:

| Place | Example |
| --- | --- |
| The `hosts` keyword of a play | `hosts: web` |
| The `--limit` option of `ansible-navigator run` | `--limit 'web,!staging'` |
| The host argument of an ad hoc command | `ansible web -m ansible.builtin.ping` |

Patterns are matched against the names **in the inventory**. A name that resolves in DNS but is not in the inventory matches nothing.

## Try it first

The rest of this lesson explains each form. Type a pattern, or pick one, and watch which hosts light up:

{% host-pattern-tester ref="host-pattern-tester" /%}

## Hosts and groups

The simplest patterns are a single name:

```yaml
hosts: servera.lab.example.com     # one managed host, exactly as the inventory names it
hosts: web                         # every host in the group web, including its child groups
hosts: all                         # every host in the inventory
hosts: ungrouped                   # hosts that are in no group except all
```

If the inventory lists a host by IP address, the pattern is that IP address. The pattern never looks anything up: it only compares names.

If you would rather use a name in patterns but must connect by address, give the host a name in the inventory and set `ansible_host` for it, for example `web01.example.com ansible_host=192.168.2.1`, or the same variable in `host_vars/web01.example.com`. Patterns and groups use the name; the connection uses the address.

A pattern decides which hosts **start** the play. A host that fails during the play, even in the automatic `Gathering Facts` task, is dropped from the rest of the play, so the recap can show fewer hosts finishing than the pattern selected.

## Wildcards

`*` matches any run of characters, in host names **and** group names:

```yaml
hosts: '*'                          # the same as all
hosts: '*.lab.example.com'          # every host whose name ends this way
hosts: 'prod*'                      # hosts and groups whose names begin with prod
hosts: 'server[ab]*'                # servera… and serverb…
```

{% callout type="warning" title="Wildcards match groups too" %}
`prod*` selects every host named `prod…` and also every member of any group named `prod…`. In a large inventory that can be far more than you meant. Prefer a group you defined on purpose over a clever wildcard.
{% /callout %}

## Lists

Separate several patterns with commas to add their hosts together:

```yaml
hosts: web,db
hosts: servera.lab.example.com,serverc.lab.example.com
```

A colon works as a separator too (`web:db`). It is the older form, and it is ambiguous with IPv6 addresses, so use commas.

## Intersections and exclusions

Two prefixes change what a term does:

{% cards cols=2 %}
  {% card title="&group" kicker="Intersection" tone="blue" %}
    Keep only the hosts that are **also** in this group. `web,&production` is the web servers that are in production.
  {% /card %}
  {% card title="!group" kicker="Exclusion" tone="red" %}
    Remove these hosts. `web,!staging` is every web server except the staging ones.
  {% /card %}
{% /cards %}

```yaml
hosts: 'web,&production'            # in web AND in production
hosts: 'all,!db'                    # everything except the database servers
hosts: 'staging,&db,!serverc*'      # three steps: see below
```

Ansible does not read a pattern left to right. Whatever order you write the terms in, it works in three passes:

{% steps %}
  {% step title="Add" %}
    Every plain term is added together into one set of hosts.
  {% /step %}
  {% step title="Intersect" %}
    Each `&` term then throws away the hosts that are not in it.
  {% /step %}
  {% step title="Exclude" %}
    Each `!` term finally removes its hosts.
  {% /step %}
{% /steps %}

So `!staging,web` and `web,!staging` select the same hosts. A pattern with no plain term, such as `!staging` on its own, starts from `all`.

## Regular expressions and positions

Two more forms are useful now and then:

```yaml
hosts: '~server[ab]'                # ~ starts a regular expression
hosts: 'db[0]'                      # the first host of the group db
hosts: 'site[1:2]'                  # the second and third hosts of the group site
hosts: 'web[-1]'                    # the last host of the group web
```

Positions count from 0 in the order the inventory lists the hosts, and a range includes both ends. They are handy for trying a change on one machine of a group first.

## Quote your patterns

`*`, `!` and `&` mean something in YAML, and `*`, `!`, `&` and `[` mean something to the shell. A pattern that **begins** with one of them must be quoted in a playbook, and any pattern that **contains** one should be quoted on the command line.

```yaml
hosts: '*.lab.example.com'          # without quotes, YAML reads * as an alias
hosts: '!staging'
```

```console
[student@workstation project]$ ansible-navigator run -m stdout site.yml --limit 'web,!staging'
```

Quoting every pattern that is more than a single name is a habit that costs nothing.

## Narrowing a run with --limit

`--limit` does not replace the play's `hosts:`. It **narrows** it: a play runs on the hosts that match both.

```console
[student@workstation project]$ ansible-navigator run -m stdout site.yml --limit servera.lab.example.com
```

If a play's hosts and the limit have nothing in common, that play is skipped and the run moves on:

```text
PLAY [Show which hosts a pattern selects] **************************************
skipping: no hosts matched
```

## Check before you run

Two read-only commands show what a pattern selects. Use them before a play that changes things.

```console
[student@workstation project]$ ansible 'web,!staging' --list-hosts
  hosts (1):
    serverb.lab.example.com
[student@workstation project]$ ansible-navigator run -m stdout site.yml --list-hosts

playbook: /home/student/project/site.yml

  play #1 (web): Web servers are configured	TAGS: []
    pattern: ['web']
    hosts (2):
      servera.lab.example.com
      serverb.lab.example.com
```

The first tests a pattern by itself. The second shows, play by play, the hosts a playbook would touch, and it takes `--limit` into account.

A term that matches nothing is not an error. Ansible warns and carries on with the rest:

```text
[WARNING]: Could not match supplied host pattern, ignoring: nosuch
```

{% callout type="exam" title="Read the warning" %}
A typo in a group name does not stop a play: it quietly runs on fewer hosts, or none. If a play finishes suspiciously fast, look for this warning and for `skipping: no hosts matched`.
{% /callout %}

{% quiz
  objectives=["ch07.patterns"]
  id="check"
  title="Check your understanding"
  ref="check" /%}

## Takeaway

Select hosts by name, by group, with wildcards and with lists. Use the chapter lab to check this on a real host.
