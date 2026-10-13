---
title: "Exercise: Managing software and subscriptions"
seoTitle: "Managing software and subscriptions (RHCE Practice Exercise)"
description: "Hands-on RHCE practice: managing software and subscriptions. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 20
---

{% lead %}
Your web servers need a package that is only published in an internal repository, whose packages are signed. You will configure the repository and its key, install the package, and use the package facts to report on it before and after.
{% /lead %}

The project `~/system-software` has an `ansible.cfg` and an `inventory` with servera in the `webservers` group.

{% lab
  objectives=["ch10.software"]
  id="software"
  title="Managing software and subscriptions"
  exercise="system-software"
  hosts=["workstation","servera.lab.example.com"]
  outcomes=["Configure a repository and its GPG key.","Install a package from it, and report on it with package_facts."] %}
{% lab-notes %}

**Prerequisites:** Complete [control-node setup](#/ch01/control-node) and the preceding lessons in this chapter. Run commands as student on workstation unless a step names another machine.

{% reveal title="Verify your work" %}

From the project directory, run the relevant home-lab check. For an exercise with several checkpoints, grade each state before changing or removing it:

```bash
lab grade system-software
lab grade system-software --checkpoint installed
```

The grader reads project files and host state. A passing report covers the listed checks; also perform the task’s independent connection, repeat-run, and reboot checks where requested.

{% /reveal %}

{% reveal title="Try an independent variation" %}

After cleanup, rerun the installation and compare package facts before and after.

Record the published result first. The grader checks the original requirements, so a changed name or value may intentionally fail those checks.

{% /reveal %}

{% /lab-notes %}

{% lab-challenge %}

Install a package from a trusted repository with `repo_playbook.yml`, then return the hosts to the published cleanup state.

- Report whether the selected package exists before and after installation using newly gathered package facts.
- The configured repository must enforce package-signature checking and trust its matching signing key.
- Use the classroom's internal package when available. At home, use the Rocky CRB repository and `python3-pyxattr` as described in the environment notes.
- Verify the installed checkpoint before removing the practice package. Keep the repository configuration and playbook for inspection.

{% /lab-challenge %}

  {% lab-setup variant="homelab" %}
    The home lab has no internal repository, so the exercise uses Rocky Linux's **CRB** repository, through the lab's internet access, and the package `python3-pyxattr`, which only CRB provides. Its signing key is already on every server, in `/etc/pki/rpm-gpg/RPM-GPG-KEY-Rocky-9`.
  {% /lab-setup %}

  {% task id="task-e61b47949ed2" legacyIndex=1 title="Start the playbook" %}
    In `~/system-software`, create `repo_playbook.yml` with a play for all hosts and a variable naming the package to install:

    {% variant-group %}
      {% variant name="classroom" %}

```yaml {% title="repo_playbook.yml" %}
---
- name: Config yum repo for installing simple-agent
  hosts: all
  vars:
    custom_pkg: simple-agent
  tasks:
```
      {% /variant %}
      {% variant name="homelab" %}

```yaml {% title="repo_playbook.yml" %}
---
- name: Config yum repo for installing simple-agent
  hosts: all
  vars:
    custom_pkg: python3-pyxattr
  tasks:
```
      {% /variant %}
    {% /variant-group %}
  {% /task %}

  {% task id="task-df4a1426fc07" legacyIndex=2 title="Report on the package first" %}
    Add two tasks: gather the package facts, then show the facts for `custom_pkg`, only if it is installed.

```yaml
    - name: Gather Package Facts
      ansible.builtin.package_facts:
        manager: auto

    - name: Show Package Facts for the custom package
      ansible.builtin.debug:
        var: ansible_facts['packages'][custom_pkg]
      when: custom_pkg in ansible_facts['packages']
```

    Run it now if you like: the second task is skipped, because the package is not installed yet.
  {% /task %}

  {% task id="task-764aadd7dd06" legacyIndex=3 title="Add the repository and its key" %}

    {% variant-group %}
      {% variant name="classroom" %}

```yaml
    - name: Ensure Example Repo exists
      ansible.builtin.yum_repository:
        name: example-internal
        description: Example Inc. Internal YUM repo
        file: example
        baseurl: http://materials.example.com/yum/repository/
        gpgcheck: true

    - name: Ensure Repo RPM Key is Installed
      ansible.builtin.rpm_key:
        key: http://materials.example.com/yum/repository/RPM-GPG-KEY-example
        state: present
```
      {% /variant %}
      {% variant name="homelab" %}

```yaml
    - name: Ensure Example Repo exists
      ansible.builtin.yum_repository:
        name: lab-crb
        description: Rocky Linux 9 CRB (lab)
        file: lab-crb
        mirrorlist: https://mirrors.rockylinux.org/mirrorlist?arch=$basearch&repo=CRB-$releasever
        gpgcheck: true
        gpgkey: file:///etc/pki/rpm-gpg/RPM-GPG-KEY-Rocky-9

    - name: Ensure Repo RPM Key is Installed
      ansible.builtin.rpm_key:
        key: /etc/pki/rpm-gpg/RPM-GPG-KEY-Rocky-9
        state: present
```

        `$basearch` and `$releasever` are dnf variables, not Ansible ones: dnf fills them in on the host.
      {% /variant %}
    {% /variant-group %}

    `yum_repository` writes `/etc/yum.repos.d/FILE.repo`. With `gpgcheck: true`, dnf refuses any package from it that is not signed by a key it trusts, which is what `rpm_key` provides.
  {% /task %}

  {% task id="task-e7ce98c3eecc" legacyIndex=4 title="Install the package, and report again" %}
    Add a task that installs `custom_pkg`, then copy the two reporting tasks after it:

```yaml
    - name: Install Example package
      ansible.builtin.dnf:
        name: "{{ custom_pkg }}"
        state: present

    - name: Gather Package Facts
      ansible.builtin.package_facts:
        manager: auto

    - name: Show Package Facts for the custom package
      ansible.builtin.debug:
        var: ansible_facts['packages'][custom_pkg]
      when: custom_pkg in ansible_facts['packages']
```

    The facts must be gathered **again**: facts describe the host as it was when they were collected, not as it is now.
  {% /task %}

  {% task id="task-7da9f35a0ab0" legacyIndex=5 title="Run it" %}

```console
[student@workstation system-software]$ ansible-navigator run -m stdout repo_playbook.yml

PLAY [Config yum repo for installing simple-agent] *****************************

TASK [Gathering Facts] *********************************************************
ok: [servera.lab.example.com]

TASK [Gather Package Facts] ****************************************************
ok: [servera.lab.example.com]

TASK [Show Package Facts for the custom package] *******************************
skipping: [servera.lab.example.com]

TASK [Ensure Example Repo exists] **********************************************
changed: [servera.lab.example.com]

TASK [Ensure Repo RPM Key is Installed] ****************************************
ok: [servera.lab.example.com]

TASK [Install Example package] *************************************************
changed: [servera.lab.example.com]

TASK [Gather Package Facts] ****************************************************
ok: [servera.lab.example.com]

TASK [Show Package Facts for the custom package] *******************************
ok: [servera.lab.example.com] => {
    "ansible_facts['packages'][custom_pkg]": [
        {
            "arch": "x86_64",
            "epoch": null,
            "name": "python3-pyxattr",
            "release": "4.el9",
            "source": "rpm",
            "version": "0.7.2"
        }
    ]
}

PLAY RECAP *********************************************************************
servera.lab.example.com    : ok=7    changed=2    unreachable=0    failed=0    skipped=1  ...
```

    The facts are a list per package, because several versions of one package (kernels, for example) can be installed side by side. In a classroom the key is new too, so `changed=3`.
  {% /task %}

  {% task id="task-c57b99c3bc21" legacyIndex=6 title="Clean up with an ad hoc command" %}
    Remove the package again, so that later exercises start from the same state:

```console
[student@workstation system-software]$ ansible all -m ansible.builtin.dnf \
> -a 'name=python3-pyxattr state=absent'
servera.lab.example.com | CHANGED => {
...output omitted...
```

    In a classroom, remove `simple-agent` instead.
  {% /task %}

  {% task id="task-463415f6a554" legacyIndex=7 title="Finish" %}
    {% lab-finish exercise="system-software" /%}
  {% /task %}
{% /lab %}
