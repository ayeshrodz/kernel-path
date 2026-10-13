---
title: Managing network configuration
seoTitle: "Configure Networking With Ansible (nmcli, network role)"
description: "Manage network interfaces and settings with the nmcli module and the network system role. Free RHCE (EX294) lesson with diagrams and practice."
kind: lesson
minutes: 12
---

{% lead %}
Network changes are the ones most likely to cut off the very connection Ansible is using. Reading the configuration is safe; changing it calls for the right module and some care. This section covers both: facts for reading, NetworkManager connections for changing, and the related jobs of host names, name resolution and the firewall.
{% /lead %}

{% objectives %}
- Read a host's addresses and interfaces from its facts.
- Add and change network connections with `community.general.nmcli` or the network system role.
- Set host names and name resolution entries.
- Avoid changes that disconnect Ansible from the host.
{% /objectives %}

## Reading the configuration

Facts already describe the network. The ones you will use most:

| Fact | Holds |
| --- | --- |
| `ansible_facts['default_ipv4']` | The interface, address, gateway and network of the default route |
| `ansible_facts['interfaces']` | The names of all interfaces |
| `ansible_facts['enp5s0']` (one per interface) | That interface's addresses, MAC address, MTU and state |
| `ansible_facts['all_ipv4_addresses']` | Every IPv4 address on the host |
| `ansible_facts['fqdn']`, `['hostname']`, `['domain']` | The host's names |
| `ansible_facts['dns']` | Name servers and search domains |

```yaml
- name: Show the current default interface
  ansible.builtin.debug:
    msg: "{{ ansible_facts['default_ipv4']['interface'] }} has {{ ansible_facts['default_ipv4']['address'] }}"
```

```text
ok: [serverb.lab.example.com] => {
    "msg": "enp5s0 has 172.25.250.11"
}
```

Each interface's fact holds its `active` state, `device`, `ipv4` (`address`, `broadcast`, `netmask`, `network`, `prefix`), `ipv6` (a list), `macaddress`, `module` (the driver), `mtu` and `type`. The host name that the inventory uses is not a fact: it is the magic variable `inventory_hostname`, which may differ from `ansible_facts['fqdn']`.

`gather_subset: network` collects only the network facts, which is quicker when that is all you need.

## Changing connections

RHEL manages networking with NetworkManager. Ansible talks to it in two ways:

{% cards cols=2 %}
  {% card title="community.general.nmcli" kicker="A module" tone="teal" %}
    One connection per task, with arguments that mirror `nmcli`: connection name, type, interface, addresses, gateway, DNS.
  {% /card %}
  {% card title="redhat.rhel_system_roles.network" kicker="A system role" tone="purple" %}
    The supported way on RHEL: describe every connection in one `network_connections` variable, and the role applies them together.
  {% /card %}
{% /cards %}

```yaml
- name: A dummy interface carries 192.0.2.10
  community.general.nmcli:
    conn_name: lab-dummy0
    type: dummy
    ifname: dummy0
    ip4: 192.0.2.10/24
    autoconnect: true
    state: present
```

With the system role, the same result is a variable:

```yaml
- name: Internal address
  hosts: servers
  vars:
    network_connections:
      - name: lab-dummy0
        type: dummy
        interface_name: dummy0
        ip:
          address:
            - 192.0.2.10/24
        state: up
  roles:
    - redhat.rhel_system_roles.network
```

### The network role's variables

`network_provider` chooses `nm` (NetworkManager, the default on RHEL 9) or `initscripts`. Each entry of `network_connections` describes one connection profile:

| Key | Meaning |
| --- | --- |
| `name` | The connection profile's name |
| `state` | `up` (active) or `down` |
| `persistent_state` | `present` (the profile exists) or `absent` (deleted) |
| `type` | `ethernet`, `bridge`, `bond`, `team`, `vlan`, `macvlan`, `infiniband`, `wireless`, `dummy` … |
| `interface_name`, `mac` | Which device the profile applies to |
| `autoconnect` | Bring the connection up at boot |
| `zone` | The firewalld zone for the interface |
| `ip` | `address` (a list), `gateway4`, `gateway6`, `dns`, `dhcp4`, `auto6` |

```yaml
network_connections:
  - name: eth0
    persistent_state: present
    type: ethernet
    autoconnect: true
    mac: 00:00:5e:00:53:5d
    ip:
      address:
        - 172.25.250.40/24
      dns:
        - 8.8.8.8
    zone: external
```

Set `state: down` to deactivate a connection and keep its profile; add `persistent_state: absent` to delete the profile too. Like the other system roles' variables, `network_connections` usually lives in `group_vars` or `host_vars`, not in the play. The role's `README.md` has a section for each kind of setting.

{% callout type="warning" title="Do not saw off the branch you sit on" %}
Changing the address or gateway of the interface Ansible connects through can drop the SSH session halfway through the play, and leave the host unreachable. Practise on an extra interface, as the exercise does with a dummy interface. Make changes to the main interface from a console, or with the network role, which is designed to apply a whole configuration in one go.
{% /callout %}

{% variant name="homelab" %}
The lab VMs have one network card, managed by the connection `System enp5s0`. That is the one Ansible uses, so the exercise adds a **dummy** interface instead. It behaves like a real interface for configuration purposes and cannot cut you off. The address comes from `192.0.2.0/24`, a range reserved for documentation that is never routed.
{% /variant %}

## Names

`ansible.builtin.hostname` sets the host name; it does not change `/etc/hosts`, which you manage separately:

```yaml
- name: The host name is set
  ansible.builtin.hostname:
    name: web01.lab.example.com

- name: The internal name resolves
  ansible.builtin.lineinfile:
    path: /etc/hosts
    line: 192.0.2.10 internal.lab.example.com
    state: present
```

For more than a line or two, generate `/etc/hosts` from a template, looping over `groups['all']` and `hostvars` as in chapter 6.

## The firewall

Opening a service or port is part of most network changes. You have used `ansible.posix.firewalld` since chapter 3; remember `permanent: true` **and** `immediate: true`, or the change applies only now or only after a reload:

```yaml
- name: https is allowed
  ansible.posix.firewalld:
    service: https
    permanent: true
    immediate: true
    state: enabled
```

The module manages more than services: `port` (`8080/tcp`), `source` (an address range), `rich_rule`, `interface`, and the `zone` each of those belongs to. This moves an interface into the `external` zone:

```yaml
- name: eth0 is in the external zone
  ansible.posix.firewalld:
    zone: external
    interface: eth0
    permanent: true
    state: enabled
```

The `redhat.rhel_system_roles.firewall` role does the same for a whole list of services, ports and zones.

{% quiz
  objectives=["ch10.network"]
  id="check"
  title="Check your understanding"
  ref="check" /%}

## Takeaway

Read a host's addresses and interfaces from its facts. Use the chapter lab to check this on a real host.
