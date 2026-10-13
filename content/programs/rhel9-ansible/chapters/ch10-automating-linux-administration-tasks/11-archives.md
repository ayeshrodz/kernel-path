---
title: Archiving and restoring files
seoTitle: "Archive and Restore Files With Ansible"
description: "Create and extract archives and fetch files from managed hosts with Ansible modules. Free RHCE (EX294) lesson with diagrams and practice."
kind: lesson
minutes: 10
---

{% lead %}
Backups, releases and log collections all end up as archives. Ansible has one module to pack files on a managed host and another to unpack them, and with a few options both behave predictably on every run. A backup is only useful if you can restore it, so you will also check that a restore gives back the same files.
{% /lead %}

{% objectives %}
- Create compressed archives on managed hosts with `community.general.archive`.
- Extract archives with `ansible.builtin.unarchive`, from the control node or from the managed host.
- Control what goes into an archive and where its files land.
- Prove that a restore gives back the right content, owner and mode.
{% /objectives %}

## Two modules, two directions

| | `community.general.archive` | `ansible.builtin.unarchive` |
| --- | --- | --- |
| Does | Packs files into an archive | Unpacks an archive into a directory |
| Source | Files on the managed host | An archive on the **control node**, or on the managed host with `remote_src: true` |
| Result | An archive file on the managed host | Files in an existing directory on the managed host |
| Formats | `gz` (default), `bz2`, `xz`, `zip`, `tar` | tar (any of those compressions) and zip |

`archive` is in the `community.general` collection, which is installed on workstation. `unarchive` is part of ansible-core. Both need the archiving tools on the managed host, such as `tar` and `gzip`, which every RHEL system has.

## Create an archive

```yaml
- name: The release is packaged
  community.general.archive:
    path: /srv/release/
    dest: /tmp/release.tar.gz
    format: gz
    mode: "0644"
```

- **`path`** is what to pack: a file, a directory, a list, or a wildcard such as `/var/log/*.log`.
- **`dest`** is the archive to create. **`format`** chooses the compression; `gz` gives a `.tar.gz` file.
- **`mode`**, **`owner`** and **`group`** apply to the archive file itself.

### The trailing slash decides the layout

| `path` | The archive contains | Extracted into `/srv/restored` |
| --- | --- | --- |
| `/srv/release` | the directory `release/` and its files | `/srv/restored/release/version.txt` |
| `/srv/release/` | only the directory's contents | `/srv/restored/version.txt` |

Decide where the files must land after a restore, then choose the slash.

{% callout type="warning" title="remove deletes the originals" %}
`remove: true` deletes the source files after a successful archive. It is meant for log rotation and clean-ups, not for backups.
{% /callout %}

## Extract an archive

```yaml
- name: The restore directory exists
  ansible.builtin.file:
    path: /srv/restored
    state: directory
    mode: "0755"

- name: The release is restored
  ansible.builtin.unarchive:
    src: /tmp/release.tar.gz
    dest: /srv/restored
    remote_src: true
    owner: root
    group: root
```

- **`dest`** must already exist: `unarchive` does not create it.
- **`remote_src: true`** says the archive is already on the managed host. Without it, `unarchive` looks for `src` on the control node and copies it across first, which is how you ship a release that you built on the control node.
- **`owner`**, **`group`** and **`mode`** apply to the extracted files.

## Check the restore, not just the archive

An archive that exists is not proof of anything. Check that the restored files match the originals in content and in access:

```console
[student@workstation ~]$ ssh devops@servera.lab.example.com \
  'cmp /srv/release/version.txt /srv/restored/version.txt && stat -c "%a %U:%G" /srv/restored/version.txt'
644 root:root
```

`cmp` prints nothing and succeeds when two files are identical. If you put checks like these in a playbook, add `changed_when: false`: they only read, so they must not inflate the change count.

{% callout type="tip" title="An archive is a snapshot" %}
Changing the source after packaging does not change an existing archive. When the source changes, `archive` rebuilds the archive on the next run, and `unarchive` extracts again only when the archive's files differ from what is already in `dest`.
{% /callout %}

{% quiz
  objectives=["ch10.archives"]
  id="archives-check"
  ref="archives-check" /%}
