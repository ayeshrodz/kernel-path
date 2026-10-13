---
title: Managing users and authentication
seoTitle: "Manage Linux Users and SSH Keys With Ansible"
description: "Create users and groups, set passwords and authorized keys, and manage sudo with Ansible. Free RHCE (EX294) lesson with diagrams and practice."
kind: lesson
minutes: 12
---

{% lead %}
Accounts are the classic job for automation: the same people, groups, keys and sudo rights on every server, kept in one place and applied the same way each time. Ansible has a module for each part, and a safe way to change the files that decide who may become root.
{% /lead %}

{% objectives %}
- Create groups and users, with passwords stored as hashes.
- Install SSH public keys for users.
- Grant sudo rights with a validated drop-in file.
- Keep account data in variables and loop over it.
{% /objectives %}

## Groups and users

```yaml
- name: The webdev group exists
  ansible.builtin.group:
    name: webdev
    state: present

- name: jane exists and is in webdev
  ansible.builtin.user:
    name: jane
    comment: Jane Doe
    groups: webdev
    append: true
    shell: /bin/bash
    state: present
```

| Argument | Effect |
| --- | --- |
| `groups` | Supplementary groups. Without `append: true`, the user is **removed** from any group not listed |
| `append: true` | Add to the listed groups, keep the others |
| `group` | The primary group |
| `uid`, `home`, `shell`, `comment` | As for `useradd` |
| `state: absent` with `remove: true` | Delete the user and the home directory |
| `generate_ssh_key: true` | Create a key pair for the user |

{% callout type="warning" title="groups without append" %}
`groups: webdev` on its own means "exactly these supplementary groups". Run it against an existing admin and they leave `wheel`. Add `append: true` unless replacing the list is what you want.
{% /callout %}

## Passwords

The `password` argument takes a **hash**, not the plain password. Create one with the `password_hash` filter:

```yaml
    password: "{{ user_password | password_hash('sha512') }}"
    update_password: on_create
```

Without a fixed salt the hash is different on every run, so the task reports `changed` every time. Two ways to keep it idempotent:

- `update_password: on_create` sets the password only when the user is first created, and never changes it afterwards.
- A second argument to the filter gives a fixed salt: `password_hash('sha512', 'mysecretsalt')`.

Keep the plain password in a Vault-encrypted file (chapter 4), never in the playbook.

## SSH keys

`ansible.posix.authorized_key` adds a public key to a user's `~/.ssh/authorized_keys`, creating the directory with the right permissions:

```yaml
- name: jane can log in with her key
  ansible.posix.authorized_key:
    user: jane
    key: "{{ lookup('ansible.builtin.file', 'files/jane.pub') }}"
    state: present
```

The `file` lookup reads a file **on the control node**. Keep public keys in the project, one file per person.

A user's own key pair can be created on the managed host by the `user` module:

```yaml
- name: user1 has an SSH key pair
  ansible.builtin.user:
    name: user1
    generate_ssh_key: true
    ssh_key_bits: 2048
    ssh_key_file: .ssh/id_my_rsa
```

It never overwrites an existing key unless you add `force: true`.

### Known host keys

`ansible.builtin.known_hosts` adds a server's public host key to a `known_hosts` file, so that SSH clients on the managed host trust that server without asking:

```yaml
- name: servera is a known host for everyone
  ansible.builtin.known_hosts:
    path: /etc/ssh/ssh_known_hosts
    name: servera.lab.example.com
    key: "{{ lookup('ansible.builtin.file', 'pubkeys/servera') }}"
```

The key line has the form `servera.lab.example.com,172.25.250.10 ssh-ed25519 AAAA…`: the names, the key type and the key. `ansible-navigator doc -l -t lookup` lists the other lookups you can read values with.

## Sudo rights

Never edit `/etc/sudoers` itself. Put each rule in its own file in `/etc/sudoers.d/`, and let `visudo` check it before it is installed:

```yaml
- name: webdev members may run commands as root
  ansible.builtin.copy:
    content: "%webdev ALL=(ALL) NOPASSWD: ALL\n"
    dest: /etc/sudoers.d/webdev
    owner: root
    group: root
    mode: "0440"
    validate: /usr/sbin/visudo -cf %s
```

`validate` runs against the new file before it replaces the old one. A syntax error in a sudoers file can lock everyone out of `sudo`, including Ansible; with `validate`, the task fails and the host keeps working.

{% callout type="tip" title="Narrow rules are better" %}
`ALL=(ALL) NOPASSWD: ALL` gives full root. Where you can, list the exact commands: `%apps ALL=(root) NOPASSWD: /usr/bin/systemctl restart httpd`.
{% /callout %}

## Data in variables

List the people once, in a variables file, and loop over it:

```yaml {% title="vars/users.yml" %}
---
users:
  - name: jane
    comment: Jane Doe
  - name: omar
    comment: Omar Haddad
```

```yaml
- name: Each user exists, in webdev
  ansible.builtin.user:
    name: "{{ item['name'] }}"
    comment: "{{ item['comment'] }}"
    groups: webdev
    append: true
  loop: "{{ users }}"
```

Adding a colleague is then a two-line change to data, with no change to any task.

{% callout type="note" title="Changing how SSH itself behaves" %}
Settings in `/etc/ssh/sshd_config`, such as `PermitRootLogin`, are changed with `lineinfile` and a handler that restarts `sshd`, or with the `redhat.rhel_system_roles.sshd` system role. Give such tasks `validate: /usr/sbin/sshd -t -f %s`, for the same reason as sudoers.
{% /callout %}

{% quiz
  objectives=["ch10.users"]
  id="check"
  title="Check your understanding"
  ref="check" /%}

## Takeaway

Create groups and users, with passwords stored as hashes. Use the chapter lab to check this on a real host.
