---
title: Managing Ansible configuration files
seoTitle: "ansible.cfg Explained: Configuration File Examples"
description: "Where Ansible reads ansible.cfg, the settings that matter and how to check them. Free RHCE (EX294) lesson with diagrams and practice."
kind: lesson
minutes: 12
---

{% lead %}
Two small files in your project directory shape how every command behaves: `ansible.cfg` tells Ansible where the inventory is, how to log in and how to become root, and `ansible-navigator.yml` tells navigator which execution environment to use and how to run.
{% /lead %}

{% objectives %}
- Write an `ansible.cfg` with `[defaults]` and `[privilege_escalation]` sections.
- Predict which configuration file Ansible and navigator will actually use.
- Set up SSH key authentication and sudo so playbooks run without prompts.
{% /objectives %}

## Two files per project

{% cards %}
  {% card title="ansible.cfg" kicker="INI format" tone="gray" %}
    Configures Ansible itself: inventory location, remote user, connection options, privilege escalation. Read by every Ansible tool.
  {% /card %}
  {% card title="ansible-navigator.yml" kicker="YAML (or JSON)" tone="amber" %}
    Configures `ansible-navigator`: which execution environment image, when to pull it, whether to write playbook artifacts, default mode.
  {% /card %}
{% /cards %}

## Writing ansible.cfg

The file is made of **sections**, each holding `key = value` settings. Section names are in square brackets. For basic work you need two sections:

- **`[defaults]`** sets defaults for how Ansible operates and connects.
- **`[privilege_escalation]`** configures how Ansible becomes another user (usually root) on managed hosts.

```ini {% title="ansible.cfg" %}
[defaults]
inventory = ./inventory
remote_user = user
ask_pass = false

[privilege_escalation]
become = true
become_method = sudo
become_user = root
become_ask_pass = false
```

| Directive | What it does |
| --- | --- |
| `inventory` | Path to the inventory file (or a directory of inventory files and scripts). |
| `remote_user` | User to log in as on managed hosts. If unset, the current user's name is used. Inside an execution environment run by `ansible-navigator`, that is always `root`. |
| `ask_pass` | Prompt for an SSH password? `false` is the default and is right when you use SSH keys. |
| `become` | Switch user on the managed host (typically to root) after connecting? Plays can override this. |
| `become_method` | How to switch users. `sudo` is the default; `su` is an alternative. |
| `become_user` | User to switch to. Defaults to `root`. |
| `become_ask_pass` | Prompt for the `become_method` password? Defaults to `false`. |

Here is how those settings line up along the path from your terminal to a task running as root:

{% diagram ref="privilege-escalation" /%}

## Which configuration file wins?

Ansible looks for its configuration in several places, **uses the first file it finds, and ignores the rest**. Settings are not merged across files. Toggle the files below to see which one Ansible would use.

{% precedence-resolver ref="precedence-resolver" /%}

{% callout type="exam" title="Keep ansible.cfg in the project directory" %}
Always run commands from the directory that contains your `ansible.cfg` and inventory. A surprising number of "it can't find my hosts" problems come from running `ansible-navigator` from the wrong directory.
{% /callout %}

{% callout type="warning" title="World-writable directories are ignored" %}
For security, Ansible refuses to load `ansible.cfg` from the current directory if that directory is world-writable, and prints a warning. Keep project directories owned by you with normal permissions.
{% /callout %}

### Checking the active settings

`ansible-navigator config` shows every setting, its default, where the current value came from, and the value in effect:

```text
  Name                        Default  Source                               Current
...output omitted...
44│Default ask pass           True     default                              False
45│Default ask vault pass     True     default                              False
46│Default become             False    /home/student/project/ansible.cfg    True
47│Default become ask pass    False    /home/student/project/ansible.cfg    True
...output omitted...
50│Default become method      False    /home/student/project/ansible.cfg    sudo
51│Default become user        False    /home/student/project/ansible.cfg    root
```

Read the **Default** column carefully: `True` means "this setting is still at its default value", not that the setting itself is true. Here `become` and `become_ask_pass` were set in the project's `ansible.cfg` (Default is `False`, Source is the file, Current is `True`). Press {% kbd %}Esc{% /kbd %} or type `:q` to leave.

{% callout type="tip" title="Classic equivalent" %}
With the classic tools, `ansible-config dump --only-changed` prints only the settings that differ from the defaults. It is a quick way to confirm your project file is being read.
{% /callout %}

## Configuring automation content navigator

Navigator reads its own settings file, in YAML (`.yml` or `.yaml`) or JSON. It uses the first one it finds:

{% precedence-resolver ref="precedence-resolver-2" /%}

Like `ansible.cfg`, each project can have its own navigator settings. A typical file:

```yaml {% title="ansible-navigator.yml" %}
ansible-navigator:
  execution-environment:
    image: utility.lab.example.com/ee-supported-rhel8:latest
    pull:
      policy: missing
  playbook-artifact:
    enable: false
```

- **`execution-environment`** groups the settings for the EE that navigator uses.
- **`image`** is the container image to run.
- **`pull.policy: missing`** pulls the image only if it is not already present locally.
- **`playbook-artifact.enable: false`** stops navigator writing a JSON log of each run. You must disable artifacts whenever a playbook needs to **prompt for a password**.

{% variant name="homelab" title="The home-lab navigator file" %}
At home there is no image to name. The file from [section 1.6](#/ch01/control-node) switches the execution environment off instead, so navigator runs workstation's own `ansible-core`:

```yaml {% title="~/.ansible-navigator.yml" %}
---
ansible-navigator:
  mode: stdout
  playbook-artifact:
    enable: false
  execution-environment:
    enabled: false
```

A project-level `ansible-navigator.yml` replaces this file rather than adding to it. If an exercise has you create one, keep the `execution-environment: enabled: false` lines in it.
{% /variant %}

{% callout type="note" %}
Navigator has many more settings; see the navigator documentation.
{% /callout %}

## Configuring connections

Ansible needs to know several things to reach its managed hosts:

- where the **inventory** is,
- which **protocol** to use (SSH by default) and whether a non-standard port is needed,
- which **remote user** to log in as, and
- whether and how to **escalate privileges**, and whether to prompt for passwords.

### Inventory location

```ini {% title="ansible.cfg" %}
[defaults]
inventory = ./inventory
```

The path can point at a single static file or at a directory holding several inventory files and dynamic inventory scripts.

### SSH key authentication

By default Ansible logs in as the same user name as the person running it; `remote_user` changes that. If the local user has an SSH private key that the remote user trusts, Ansible logs in automatically. That is how you should set things up.

{% steps %}
  {% step title="Create a key pair on the control node (if you do not have one)" %}

```console
[user@controlnode ~]$ ssh-keygen
```
  {% /step %}
  {% step title="Install the public key on each managed host" %}
    `ssh-copy-id` also records the host key in your `~/.ssh/known_hosts`.

```console
[user@controlnode ~]$ ssh-copy-id root@web1.example.com
The authenticity of host 'web1.example.com (192.0.2.181)' can't be established.
ECDSA key fingerprint is 70:9c:03:cd:de:ba:2f:11:98:fa:a0:b3:7c:40:86:4b.
Are you sure you want to continue connecting (yes/no)? yes
...output omitted...
Number of key(s) added: 1
```
  {% /step %}
  {% step title="Test a key-based login" %}

```console
[user@controlnode ~]$ ssh root@web1.example.com
```
  {% /step %}
{% /steps %}

### If you must use passwords

Password-based SSH works, but `ansible-navigator` then needs playbook artifacts disabled so it can prompt you:

```yaml {% title="ansible-navigator.yml" %}
ansible-navigator:
  playbook-artifact:
    enable: false
```

Then run with `-m stdout` and `--ask-pass` (or set `ask_pass = true` in `ansible.cfg` to always be prompted):

```console
[user@controlnode ~]$ ansible-navigator run -m stdout --ask-pass site.yml
```

{% callout type="important" title="Prompts need stdout mode and no artifacts" %}
If you do not disable playbook artifacts, or you forget `-m stdout`, a playbook that needs to prompt for a password can hang or fail.
{% /callout %}

{% callout type="tip" title="Let Ansible distribute the keys" %}
Once one password login works, a play can push your public key to every host using the `ansible.posix.authorized_key` module. Run it once with `--ask-pass`, and key-based logins work from then on.

```yaml {% title="deploy-key.yml" %}
- name: Public key is deployed to managed hosts for Ansible
  hosts: all
  tasks:
    - name: Ensure key is in root's ~/.ssh/authorized_keys
      ansible.posix.authorized_key:
        user: root
        state: present
        key: '{{ item }}'
      with_file:
        - ~/.ssh/id_rsa.pub
```
{% /callout %}

## Escalating privileges

For security and auditing, you often connect as an unprivileged user and then escalate to root. That is configured in `[privilege_escalation]`:

- `become = true` turns escalation on by default. Ad hoc commands and plays can still override it, for example for a play that should run unprivileged.
- `become_method` chooses how (default `sudo`) and `become_user` chooses whom to become (default `root`).
- If the method needs a password, set `become_ask_pass = true`. With `ansible-navigator` that also means disabling playbook artifacts and using `-m stdout`.

On RHEL 8 and 9, members of the `wheel` group can use sudo after typing their password. To let an automation user use sudo **without** a password, drop a file into `/etc/sudoers.d/` (owned by root, mode `0400`):

```text {% title="/etc/sudoers.d/someuser" %}
## password-less sudo for Ansible user
someuser ALL=(ALL) NOPASSWD:ALL
```

With key-based SSH as `someuser` and password-less sudo, the whole configuration becomes:

```ini {% title="ansible.cfg" %}
[defaults]
inventory = ./inventory
remote_user = someuser
ask_pass = false

[privilege_escalation]
become = true
become_method = sudo
become_user = root
become_ask_pass = false
```

{% callout type="note" title="Think about the security trade-off" %}
`become = true` in `ansible.cfg` makes *every* task run as root. It can be better practice to escalate only in the plays or tasks that need it, which you will see in the multiple-plays section. Different organisations weigh this differently.
{% /callout %}

## Comments

{% reveal title="Read the supporting details" %}

Both files accept `#` at the start of a line as a comment. `ansible.cfg` also accepts `;`, which comments out everything to its right.

```ini {% title="ansible.cfg" %}
# The whole line is a comment
[defaults]
inventory = ./inventory   ; the rest of this line is a comment
```

{% quiz
  objectives=["ch03.configuration"]
  id="check"
  title="Check your understanding"
  ref="check" /%}

{% /reveal %}

## Takeaway

Write an `ansible.cfg` with `[defaults]` and `[privilege_escalation]` sections. Use the chapter lab to check this on a real host.
