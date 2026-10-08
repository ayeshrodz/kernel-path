---
title: "Exercise: Archiving and restoring files"
seoTitle: "Archiving and restoring files (RHCE Practice Exercise)"
description: "Hands-on RHCE practice: archiving and restoring files. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 20
---

{% lead %}
You will package a small application release on servera, restore it into a separate directory, and prove that the restored file has the same content, owner and mode. Then you publish a new release and show that the archive and the restore follow it.
{% /lead %}

The project `~/system-archive` has an `ansible.cfg` and an `inventory` with servera. You write one playbook, `release.yml`, with one play for `servera.lab.example.com` and privilege escalation.

{% lab
  objectives=["ch10.archives"]
  id="archive-recovery"
  title="Archiving and restoring files"
  exercise="system-archive"
  ownExercise=true
  hosts=["workstation","servera.lab.example.com"]
  outcomes=["Create an archive and restore it with explicit ownership and permissions.","Prove that the restored file matches the source."] %}
{% lab-notes %}

**Prerequisites:** Complete the [archiving lesson](#/ch10/archives). Run commands as student on workstation unless a step names another machine.

{% reveal title="Verify your work" %}

From `~/system-archive`, run:

```bash
lab grade system-archive
```

The grader checks that the archive is readable and that the restored file matches the source, with owner root and mode `0644`.

{% /reveal %}

{% reveal title="Try an independent variation" %}

Add a second file, `notes.txt`, to the release. Before you run the playbook, list the old archive with `tar -tzf /tmp/release.tar.gz` on servera and confirm the file is missing; after the run, confirm it is in the archive and in `/srv/restored`.

{% /reveal %}

{% /lab-notes %}

{% lab-challenge %}

Package and restore a release on servera with `release.yml`.

- Root-owned `/srv/release` (mode `0755`) must contain `version.txt` with `release-1` followed by a newline, owned by root with mode `0644`.
- Package the directory's contents as `/tmp/release.tar.gz`, and restore them so that `/srv/restored/version.txt` exists directly under the restore directory.
- Prove that the restored file matches the source's content, owner and mode.
- Publish `release-2`, run the playbook again, and show that the restored file follows the new release.

{% /lab-challenge %}

{% task id="task-612e24cb8c2a" legacyIndex=1 title="Prepare a release" %}

Start the exercise:

```console
[student@workstation ~]$ lab start system-archive
[student@workstation ~]$ cd ~/system-archive
```

Create `release.yml`. First create `/srv/release` and `/srv/restored`, owned by root with mode `0755`; a loop handles both. Then write the release's version file with `ansible.builtin.copy`:

```yaml {% title="release.yml" %}
---
- name: Package and restore a release
  hosts: servera.lab.example.com
  become: true
  tasks:
    - name: Release and restore directories exist
      ansible.builtin.file:
        path: "{{ item }}"
        state: directory
        owner: root
        group: root
        mode: "0755"
      loop:
        - /srv/release
        - /srv/restored

    - name: The version is published
      ansible.builtin.copy:
        content: "release-1\n"
        dest: /srv/release/version.txt
        owner: root
        group: root
        mode: "0644"
```

{% /task %}
{% task id="task-56ef7e8d45cf" legacyIndex=2 title="Archive and restore" %}

Add two tasks at the end of the play: one packages the **contents** of `/srv/release`, the other extracts them on servera:

```yaml {% title="release.yml (append)" %}
    - name: The release is packaged
      community.general.archive:
        path: /srv/release/
        dest: /tmp/release.tar.gz
        format: gz
        mode: "0644"

    - name: The release is restored
      ansible.builtin.unarchive:
        src: /tmp/release.tar.gz
        dest: /srv/restored
        remote_src: true
        owner: root
        group: root
```

The trailing slash on `path` keeps the `release/` directory out of the archive, so the file lands directly in `/srv/restored`. `remote_src: true` says the archive is already on servera. If you are unsure about an option, read the module documentation:

```console
[student@workstation system-archive]$ ansible-navigator doc community.general.archive -m stdout
[student@workstation system-archive]$ ansible-navigator doc ansible.builtin.unarchive -m stdout
```

{% /task %}
{% task id="task-4f1408ad97e1" legacyIndex=3 title="Run and verify the restore" %}

Check the syntax, run the playbook, and compare the restored file with the source:

```console
[student@workstation system-archive]$ ansible-navigator run release.yml -m stdout --syntax-check
[student@workstation system-archive]$ ansible-navigator run release.yml -m stdout
...output omitted...
[student@workstation system-archive]$ ssh devops@servera.lab.example.com \
  'cat /srv/restored/version.txt; stat -c "%a %U:%G" /srv/restored/version.txt; cmp /srv/release/version.txt /srv/restored/version.txt && echo identical'
release-1
644 root:root
identical
```

Run the playbook a second time. Nothing has changed in the source, so the second recap should report `changed=0`.

{% /task %}
{% task id="task-ed2f86815758" legacyIndex=4 title="Publish a new release" %}

In the copy task, change the content to `"release-2\n"`. Run the playbook and repeat the check: the restored file now says `release-2` and is still identical to the source.

The archive is a snapshot: it only changed because the playbook rebuilt it after the source changed. Then `unarchive` saw that the archive's file differed from the one in `/srv/restored` and extracted it again. Grade your work:

```console
[student@workstation system-archive]$ lab grade system-archive
```

When you are done, run `lab finish system-archive`.

{% /task %}
{% /lab %}
