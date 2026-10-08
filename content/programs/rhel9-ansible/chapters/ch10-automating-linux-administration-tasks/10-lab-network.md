---
title: "Exercise: Managing network configuration"
seoTitle: "Managing network configuration (RHCE Practice Exercise)"
description: "Hands-on RHCE practice: managing network configuration. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 20
---

{% lead %}
servera has a second network interface, `eth1`, that is not configured yet. You will give it a static address with the network system role, keeping the setting in `group_vars`, and then read the result back from the facts.
{% /lead %}

The project `~/system-network` has an `ansible.cfg`, an `inventory` with servera in `webservers`, a playbook `get-eth1.yml` that shows the facts for `eth1`, and the system roles collection archive.

{% lab
  objectives=["ch10.network"]
  id="network"
  title="Managing network configuration"
  exercise="system-network"
  hosts=["workstation","servera.lab.example.com"]
  outcomes=["Configure a network interface with the network system role.","Read network facts."] %}
{% lab-notes %}

**Prerequisites:** Complete [control-node setup](#/ch01/control-node) and the preceding lessons in this chapter. Run commands as student on workstation unless a step names another machine.

{% reveal title="Verify your work" %}

From the project directory, run the relevant home-lab check. For an exercise with several checkpoints, grade each state before changing or removing it:

```bash
lab grade system-network
```

The grader reads project files and host state. A passing report covers the listed checks; also perform the task’s independent connection, repeat-run, and reboot checks where requested.

{% /reveal %}

{% reveal title="Try an independent variation" %}

Change the dummy interface address to another documentation address, then verify the old address is gone.

Record the published result first. The grader checks the original requirements, so a changed name or value may intentionally fail those checks.

{% /reveal %}

{% /lab-notes %}

{% lab-challenge %}

Add a persistent secondary connection on servera with `playbook.yml`, without interrupting its management connection.

- Use the network system role, with the connection values stored in `group_vars/webservers/network.yml`.
- In the classroom, use `eth1` at `172.25.250.30/24`. At home, use the dummy connection named `eth1` at `192.0.2.30/24`.
- `get-eth1.yml` must report the resulting interface facts.
- Verify the address, active connection, and continued SSH access, including after an explicit reboot.

{% /lab-challenge %}

  {% lab-setup variant="homelab" %}
    The home-lab VMs have one network card, which Ansible uses. Instead of a second card, `eth1` is a **dummy** interface, created by the same role from `type: dummy`, with an address from `192.0.2.0/24`, a range reserved for documentation. Everything else is the same.
  {% /lab-setup %}

  {% task id="task-cd220ddcb60d" legacyIndex=1 title="Install the collection" %}

```console
[student@workstation ~]$ cd ~/system-network
[student@workstation system-network]$ ansible-galaxy collection install \
> ./redhat-rhel_system_roles-1.120.5.tar.gz -p collections
...output omitted...
redhat.rhel_system_roles:1.120.5 was installed successfully
```
  {% /task %}

  {% task id="task-3afc041de50a" legacyIndex=2 title="Write the playbook" %}

```yaml {% title="playbook.yml" %}
---
- name: NIC Configuration
  hosts: webservers

  roles:
    - redhat.rhel_system_roles.network
```
  {% /task %}

  {% task id="task-1561270b14a8" legacyIndex=3 title="Find the variable in the documentation" %}
    The role's `README.md` has a section for each kind of setting. Look for "Setting the IP configuration":

```console
[student@workstation system-network]$ less \
> collections/ansible_collections/redhat/rhel_system_roles/roles/network/README.md
```

    Its example shows a `network_connections` entry with an `ip` dictionary, whose `address` is a list of addresses with their prefix.
  {% /task %}

  {% task id="task-da82ed3d27c2" legacyIndex=4 title="Put the setting in group_vars" %}

```console
[student@workstation system-network]$ mkdir -pv group_vars/webservers
mkdir: created directory 'group_vars'
mkdir: created directory 'group_vars/webservers'
```

    {% variant-group %}
      {% variant name="classroom" %}

```yaml {% title="group_vars/webservers/network.yml" %}
---
network_connections:
  - name: eth1
    type: ethernet
    ip:
      address:
        - 172.25.250.30/24
```
      {% /variant %}
      {% variant name="homelab" %}

```yaml {% title="group_vars/webservers/network.yml" %}
---
network_connections:
  - name: eth1
    type: dummy
    interface_name: eth1
    ip:
      address:
        - 192.0.2.30/24
```
      {% /variant %}
    {% /variant-group %}
  {% /task %}

  {% task id="task-72f23c628514" legacyIndex=5 title="Run it" %}

```console
[student@workstation system-network]$ ansible-navigator run -m stdout playbook.yml
...output omitted...
TASK [redhat.rhel_system_roles.network : Print network provider] ***************
ok: [servera.lab.example.com] => {
    "msg": "Using network provider: nm"
}
...output omitted...
TASK [redhat.rhel_system_roles.network : Configure networking connection profiles] ***
changed: [servera.lab.example.com]
...output omitted...
ok: [servera.lab.example.com] => {
    "__network_connections_result.stderr_lines": [
        "[002] <info>  #0, state:None persistent_state:present, 'eth1': add connection eth1, 08b92940-ef4a-49ad-a309-e4f05eae64af"
    ]
}
...output omitted...
TASK [redhat.rhel_system_roles.network : Re-test connectivity] *****************
ok: [servera.lab.example.com]
...output omitted...
```

    The role uses NetworkManager (`nm`), added a connection profile called `eth1`, and finally checked that it can still reach the host.
  {% /task %}

  {% task id="task-9d0d81b5873d" legacyIndex=6 title="Read it back from the facts" %}

```yaml {% title="get-eth1.yml" %}
---
- name: Obtain network info for webservers
  hosts: webservers

  tasks:
    - name: Display eth1 info
      ansible.builtin.debug:
        var: ansible_facts['eth1']['ipv4']
```

```console
[student@workstation system-network]$ ansible-navigator run -m stdout get-eth1.yml
...output omitted...
TASK [Display eth1 info] *******************************************************
ok: [servera.lab.example.com] => {
    "ansible_facts['eth1']['ipv4']": {
        "address": "192.0.2.30",
        "broadcast": "192.0.2.255",
        "netmask": "255.255.255.0",
        "network": "192.0.2.0",
        "prefix": "24"
    }
}
...output omitted...
```

    In a classroom, the address is `172.25.250.30`.
  {% /task %}

  {% task id="task-fcda0efb4bda" legacyIndex=7 title="Finish" %}
    {% lab-finish exercise="system-network" /%}
  {% /task %}
{% /lab %}

{% callout type="tip" title="Changing an existing connection" %}
The role adds a new profile and NetworkManager brings it up. When you **change** the address of a profile that already exists, add `state: up` to the entry so that the role reactivates the connection and the new address takes effect at once.
{% /callout %}
