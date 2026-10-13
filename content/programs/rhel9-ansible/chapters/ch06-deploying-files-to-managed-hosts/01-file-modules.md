---
title: Modifying and copying files to hosts
seoTitle: "Ansible copy, file, lineinfile and blockinfile Modules"
description: "Create, copy and change files on managed hosts with the Ansible file modules. Free RHCE (EX294) lesson with diagrams and practice."
kind: lesson
minutes: 12
---

{% lead %}
Most configuration work comes down to files: put one in place, fix its owner and permissions, change a line, or remove it. Ansible has a small set of modules for exactly these jobs. Each one describes the state a file should be in, so running it twice is safe.
{% /lead %}

{% objectives %}
- Choose the right module to create, copy, edit, fetch, check or remove a file.
- Set ownership, permissions and SELinux type as part of the same task.
- Edit a file in place with `lineinfile` and `blockinfile`, and know what makes them idempotent.
- Read a file's status with `stat` and use it in later tasks.
{% /objectives %}

## The file modules

Almost everything you need ships with `ansible-core`, in the `ansible.builtin` collection:

| Module | Use it to |
| --- | --- |
| `copy` | Put a file from the control node (or a few lines of inline text) onto managed hosts, with attributes. |
| `file` | Set owner, group, mode, SELinux context and timestamps; create or remove files, directories and links. |
| `lineinfile` | Make sure one particular line is present, replacing a matching line if there is one. |
| `blockinfile` | Insert, update or remove several lines as one marked block. |
| `fetch` | Copy a file from managed hosts back to the control node: `copy` in reverse. |
| `stat` | Read facts about a file, like the Linux `stat` command. Changes nothing. |

The `ansible.posix` collection adds two more:

| Module | Use it to |
| --- | --- |
| `synchronize` | Synchronise files and directories with `rsync`. |
| `patch` | Apply a patch file with GNU `patch`. |

Pick a job to see the module and a task that does it:

{% file-module-chooser ref="file-module-chooser" /%}

{% variant name="homelab" %}
`ansible.posix` is in `/usr/share/ansible/collections` on workstation (section 1.6), so `synchronize` and `patch` resolve without an execution environment. `synchronize` also needs the `rsync` package on both ends: the lab profile installs it on every VM.
{% /variant %}

## Creating files and setting attributes

`ansible.builtin.file` with `state: touch` behaves like the `touch` command: it creates an empty file if there is none, and the same task sets who owns it and what they may do with it.

```yaml
- name: Touch a file and set permissions
  ansible.builtin.file:
    path: /path/to/file
    owner: user1
    group: group1
    mode: '0640'
    state: touch
```

```console
[user@host ~]$ ls -l file
-rw-r-----. user1 group1 0 Nov 25 08:00 file
```

The attribute arguments `owner`, `group`, `mode` and the SELinux ones are shared by `file`, `copy`, `template` and several other modules. Learn them once.

### Getting the mode right

Click the bits to build a mode. Both the octal and the symbolic form are accepted:

{% mode-calculator ref="mode-calculator" /%}

### SELinux type

A file created in the wrong place keeps the SELinux type of where it was made. Here, a file meant for a Samba share still has the type of a home directory:

```console
[user@host ~]$ ls -Z samba_file
-rw-r--r--. owner group unconfined_u:object_r:user_home_t:s0 samba_file
```

`setype` fixes that, in the way `chcon` would:

```yaml
- name: SELinux type is set to samba_share_t
  ansible.builtin.file:
    path: /path/to/samba_file
    setype: samba_share_t
```

```console
[user@host ~]$ ls -Z samba_file
-rw-r--r--. owner group unconfined_u:object_r:samba_share_t:s0 samba_file
```

{% callout type="note" title="This change is not recorded in the SELinux policy" %}
Like `chcon`, `setype` changes the label on the file only. A later `restorecon`, or a full relabel, puts the policy's default type back. To make a type permanent, add a file-context rule to the policy with `community.general.sefcontext`, or use the `redhat.rhel_system_roles.selinux` role (chapter 8). Setting `seuser`, `serole`, `setype` and `selevel` to `_default` does the opposite: it resets the file to what the policy says.
{% /callout %}

## Copying files to managed hosts

`ansible.builtin.copy` looks for `src` on the control node, relative to the playbook, and also in a `files/` directory next to it.

```yaml
- name: Copy a file to managed hosts
  ansible.builtin.copy:
    src: file
    dest: /path/to/file
```

By default `force: true` applies: if the remote file exists but its content differs, it is overwritten. With `force: false` the file is copied only when it is missing, which suits files that people are expected to edit afterwards.

## Fetching files from managed hosts

`ansible.builtin.fetch` goes the other way. A typical use is collecting a log, or an SSH public key from a reference machine before handing it out to others:

```yaml
- name: Retrieve SSH key from reference host
  ansible.builtin.fetch:
    src: "/home/{{ user }}/.ssh/id_rsa.pub"
    dest: "files/keys/{{ user }}.pub"
```

Several hosts may each have a file with the same name, so by default `fetch` builds a separate path for each host. Switch `flat` to see the difference:

{% fetch-layout ref="fetch-layout" /%}

## Editing a file in place

When a file already exists and you only care about part of it, change just that part.

**One line:** `ansible.builtin.lineinfile`.

```yaml
- name: Add a line of text to a file
  ansible.builtin.lineinfile:
    path: /path/to/file
    line: 'Add this line to the file'
    state: present
```

**Several lines:** `ansible.builtin.blockinfile`.

```yaml
- name: Add additional lines to a file
  ansible.builtin.blockinfile:
    path: /path/to/file
    block: |
      First line in the additional block of text
      Second line in the additional block of text
    state: present
```

`blockinfile` surrounds its text with marker comments. They are how a later run recognises the block instead of adding a second copy:

```text
# BEGIN ANSIBLE MANAGED BLOCK
First line in the additional block of text
Second line in the additional block of text
# END ANSIBLE MANAGED BLOCK
```

Use the `marker` argument when the file needs a different comment character, or when one file holds more than one managed block.

Run each module against a small file, change the text, and run it twice:

{% file-edit-simulator ref="file-edit-simulator" /%}

{% callout type="tip" title="When to stop editing lines" %}
Line edits are fine for one or two settings in a file you do not otherwise manage. Once you are changing many lines, or the content depends on the host, deploy the whole file from a template instead: the next lesson.
{% /callout %}

## Removing files

`state: absent` removes a file, link or directory (with its contents).

```yaml
- name: Make sure a file does not exist on managed hosts
  ansible.builtin.file:
    dest: /path/to/file
    state: absent
```

{% callout type="important" title="Always write state" %}
Many modules default to `state: present`, so leaving it out often works. Write it anyway: `present` or `absent` tells the reader the intended end state, and protects you if a default ever differs from what you assumed.
{% /callout %}

## Checking a file with stat

`ansible.builtin.stat` gathers facts about one file: whether it exists, its type, owner, mode, size and checksum. Register the result and use it in later tasks.

```yaml
- name: Verify the checksum of a file
  ansible.builtin.stat:
    path: /path/to/file
    checksum_algorithm: md5
  register: result

- ansible.builtin.debug:
    msg: "The checksum of the file is {{ result.stat.checksum }}"
```

```text
TASK [debug] *******************************************************************
ok: [hostname] => {
    "msg": "The checksum of the file is 5f76590425303022e933c43a7f2092a3"
}
```

Everything sits under the `stat` key of the registered variable. Browse a sample result; the panel shows how to reference the value you select:

{% stat-explorer ref="stat-explorer" /%}

`stat.exists` is the one you will use most, in conditions such as `when: not result.stat.exists`.

## Synchronising directories

`ansible.posix.synchronize` wraps `rsync`, which is much faster than `copy` for large trees. By default the source is on the control node and the destination on the managed host.

```yaml
- name: Synchronize local file to remote files
  ansible.posix.synchronize:
    src: file
    dest: /path/to/file
```

{% callout type="exam" title="Let the documentation do the remembering" %}
Nobody memorises every argument. `ansible-navigator doc ansible.builtin.copy -m stdout` (or `ansible-doc ansible.builtin.copy`) lists them, and the EXAMPLES section at the end is usually one copy and paste away from the task you need.
{% /callout %}

{% quiz
  objectives=["ch06.files"]
  id="check"
  title="Check your understanding"
  ref="check" /%}

## Takeaway

Choose the right module to create, copy, edit, fetch, check or remove a file. Use the chapter lab to check this on a real host.
