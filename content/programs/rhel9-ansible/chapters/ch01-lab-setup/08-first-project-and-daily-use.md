---
title: First project and daily use
seoTitle: "First project and daily use: RHCE Home Lab Setup"
description: "First project and daily use: part of building a free RHCE practice lab at home with Rocky Linux 9 virtual machines on LXD."
kind: lab
minutes: 15
---

{% lead %}
Phases 13 and 14. With the baseline saved, everything from here on is your own work. Create the base Ansible project the exercises copy from, prove it reaches every server, and set up a one-command way into the lab from your own computer.
{% /lead %}

{% lab
  objectives=["ch01.lab-network","ch01.lab-machines","ch01.lab-tools","ch01.lab-reset"]
  id="project"
  title="Phase 13 · Your first Ansible project (~10 min)"
  hosts=["workstation"]
  outcomes=["Create ~/ansible with ansible.cfg and an inventory.","Prove SSH, the devops user and sudo work on every server."] %}
  {% task id="task-6b05df6627f0" legacyIndex=1 title="VM: create the project folder" %}
    It lives on workstation, so resetting the servers never touches it. Get there with `rht-vmctl ws`.

```bash {% title="student@workstation" %}
mkdir -p ~/ansible/{roles,collections} && cd ~/ansible
```
  {% /task %}

  {% task id="task-3b3b4da08fdf" legacyIndex=2 title="VM: write ansible.cfg" %}

```ini {% title="~/ansible/ansible.cfg" %}
[defaults]
inventory          = ./inventory
remote_user        = devops
roles_path         = ./roles:/usr/share/ansible/roles
collections_path   = ./collections:~/.ansible/collections:/usr/share/ansible/collections
host_key_checking  = False
interpreter_python = auto_silent     # stops the "discovered Python interpreter" warning

[privilege_escalation]
become          = True
become_method   = sudo
become_user     = root
become_ask_pass = False
```

    Every setting here is explained in [chapter 3](#/ch03/configuration).

    {% callout type="warning" title="Keep all three collection paths" %}
    `collections_path` *replaces* Ansible's search list rather than adding to it. With only `./collections`, Ansible can no longer see `ansible.posix`, `community.general` or `redhat.rhel_system_roles` in `/usr/share/ansible/collections`, and tasks fail with *"couldn't resolve module/action"*. The three-path line keeps the defaults and adds the project folder in front.
    {% /callout %}
  {% /task %}

  {% task id="task-7111ab693da6" legacyIndex=3 title="VM: write the inventory" %}
    A set of groups that is handy for practice:

```ini {% title="~/ansible/inventory" %}
[dev]
servera.lab.example.com

[test]
serverb.lab.example.com

[prod]
serverc.lab.example.com
serverd.lab.example.com

[webservers:children]
prod
```
  {% /task %}

  {% task id="task-27d11c0dd567" legacyIndex=4 title="VM: prove it reaches every server" %}

```bash {% title="student@workstation:~/ansible" %}
ansible-inventory --graph
ansible all -m ping                  # every server: "pong"
ansible all -m command -a id         # uid=0(root) everywhere
ansible --version | head -1          # ansible [core 2.14.18]
```

    {% callout type="note" title="Reading the output" %}
    Each server should print `uid=0(root)`, which proves SSH, the `devops` user and sudo all work. The yellow **CHANGED** is normal: the `command` module can't tell whether a command changed anything, so it always reports changed ([chapter 2](#/ch02/architecture) explains why). Without the `interpreter_python` line you would also see a harmless *"discovered Python interpreter"* warning per host. Don't point it at `python3.11`: that exists only on workstation, for `ansible-navigator`.
    {% /callout %}
  {% /task %}

  {% task id="task-7e5e11ba56c6" legacyIndex=5 title="VM: put it under Git" %}
    Restoring workstation to `clean` removes `~/ansible`, so keep your work in Git and commit as you go:

```bash {% title="student@workstation" %}
cd ~/ansible && git init
```
  {% /task %}
{% /lab %}

## Daily use

### Getting in

{% diagram ref="access-paths" /%}

On the host, `rht-vmctl ws` drops you at the student prompt on workstation. From your own computer, one SSH alias takes you straight there:

```text {% title="~/.ssh/config on your computer" %}
Host rhce
    HostName <HOST_LAN_IP>
    User <HOST_USER>
    RequestTTY yes
    RemoteCommand lxc exec --project rhce workstation -- su - student
```

```bash {% title="your computer" %}
ssh rhce            # lands on [student@workstation ~]$
```

### Starting and stopping the lab

```bash {% title="Ubuntu host" %}
rht-vmctl stop all       # frees ~7 GiB of RAM
rht-vmctl start all
```

### Moving files in and out

Because the host can't reach the VMs over the network, copy files through LXD instead:

```bash {% title="Ubuntu host" %}
lxc file push notes.txt workstation/home/student/            # host → VM
lxc file pull workstation/home/student/ansible/site.yml .     # VM → host
```

### Before each exercise in this guide

{% steps %}
  {% step title="Reset the servers" %}
    `rht-vmctl reset servers` on the host.
  {% /step %}
  {% step title="Start the exercise" %}
    `lab start NAME` on workstation. It creates `~/NAME` with that exercise's `ansible.cfg`, inventory and starter files.
  {% /step %}
  {% step title="Remember the firewall" %}
    firewalld runs on every server, as in the classroom. If an exercise sets up a web server, the playbook has to open the port (`ansible.posix.firewalld`) before `curl` from workstation works.
  {% /step %}
  {% step title="Work, then check twice" %}
    Run the playbook, verify the result, then run it again: the second run should report `changed=0`.
  {% /step %}
  {% step title="Finish" %}
    `lab finish NAME` on workstation puts the project away in `~/lab-archive/`. Then reset the servers on the host.
  {% /step %}
{% /steps %}

{% callout type="exam" title="You are ready" %}
The lab now matches the classroom closely enough to follow every chapter of this guide. Head to [chapter 2](#/ch02) and start practising.
{% /callout %}
