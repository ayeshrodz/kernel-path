---
title: "Exercise: Deploying roles from external content sources"
seoTitle: "Deploying roles from external content sources (RHCE Practice Exercise)"
description: "Hands-on RHCE practice: deploying roles from external content sources. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 20
---

{% lead %}
You will install a role that another team keeps in a Git repository, use it to set the default shell environment for new users, and then switch to a newer branch of the same role and see what changes.
{% /lead %}

The project `~/role-galaxy` has an `ansible.cfg` and an `inventory` with `servera.lab.example.com` in the `devservers` group. The role, `bash_env`, writes `.bashrc`, `.bash_profile` and `.vimrc` into `/etc/skel`, so every user created afterwards gets them.

{% lab
  objectives=["ch08.role-install"]
  id="role-galaxy"
  title="Deploying roles from external content sources"
  exercise="role-galaxy"
  hosts=["workstation","servera.lab.example.com"]
  outcomes=["Record a project’s role dependencies in a requirements file.","Install roles from a requirements file and list them.","Switch an installed role to another branch."] %}
{% lab-notes %}

**Prerequisites:** Complete [control-node setup](#/ch01/control-node) and the preceding lessons in this chapter. Run commands as student on workstation unless a step names another machine.

{% reveal title="Verify your work" %}

From the project directory, run the relevant home-lab check. For an exercise with several checkpoints, grade each state before changing or removing it:

```bash
lab grade role-galaxy
lab grade role-galaxy --checkpoint applied
```

The grader reads project files and host state. A passing report covers the listed checks; also perform the task’s independent connection, repeat-run, and reboot checks where requested.

{% /reveal %}

{% reveal title="Try an independent variation" %}

Choose a different prompt color supported by the role and verify which files change.

Record the published result first. The grader checks the original requirements, so a changed name or value may intentionally fail those checks.

{% /reveal %}

{% /lab-notes %}

{% lab-challenge %}

Manage a role dependency through `roles/requirements.yml` and prove its behavior through a fresh user login.

- Install the supplied Git role as `student.bash_env`, initially from `main`, into the project's role directory.
- `use-bash_env-role.yml` must apply its default prompt and recreate `student2` so the account receives the updated skeleton files. The disposable login password is `redhat`.
- Change the dependency to `dev`, make the project role path discoverable, and configure a blue prompt.
- Prove the installed version and login result. Explain why changing `/etc/skel` alone does not rewrite an existing user's home files.

{% /lab-challenge %}

  {% lab-setup variant="homelab" %}
    `lab start role-galaxy` creates the Git repository on workstation, in `~/git-repos/student/bash_env.git`, with two branches: `main` and `dev`. Wherever the steps below use the repository, use its `file://` path.
  {% /lab-setup %}

  {% task id="task-190e425eb796" legacyIndex=1 title="Write the requirements file" %}
    In `~/role-galaxy`, create `roles/requirements.yml`. It installs the `bash_env` role from Git, on the `main` branch, under the name `student.bash_env`.

    {% variant-group %}
      {% variant name="classroom" %}

```yaml {% title="roles/requirements.yml" %}
---
# requirements.yml

- src: git@workstation.lab.example.com:student/bash_env
  scm: git
  version: main
  name: student.bash_env
```
      {% /variant %}
      {% variant name="homelab" %}

```yaml {% title="roles/requirements.yml" %}
---
# requirements.yml

- src: file:///home/student/git-repos/student/bash_env.git
  scm: git
  version: main
  name: student.bash_env
```
      {% /variant %}
    {% /variant-group %}
  {% /task %}

  {% task id="task-d4d6bf9805bd" legacyIndex=2 title="Install the role into the project" %}

```console
[student@workstation role-galaxy]$ ls roles/
requirements.yml
[student@workstation role-galaxy]$ ansible-galaxy install -r roles/requirements.yml -p roles
Starting galaxy role install process
- extracting student.bash_env to /home/student/role-galaxy/roles/student.bash_env
- student.bash_env (main) was installed successfully
[student@workstation role-galaxy]$ ls roles/
requirements.yml  student.bash_env
```
  {% /task %}

  {% task id="task-4b4a67148ca8" legacyIndex=3 title="List the roles" %}

```console
[student@workstation role-galaxy]$ ansible-galaxy list -p roles
# /home/student/role-galaxy/roles
- student.bash_env, main
# /usr/share/ansible/roles
- rhel-system-roles.firewall, (unknown version)
...output omitted...
[WARNING]: - the configured path /home/student/.ansible/roles does not exist.
```

    Run the same command without `-p roles`: the project's role is not listed, because `roles/` is not in the configured `roles_path` yet. The warning is harmless; it only says that one of the default directories does not exist.
  {% /task %}

  {% task id="task-bd87b7f2ed3b" legacyIndex=4 title="Use the role" %}
    Create `use-bash_env-role.yml`. Before the role, make sure a test user `student2` does not exist; after it, create that user again, so it gets the new files from `/etc/skel`. Set the prompt through the role's `default_prompt` variable.

```yaml {% title="use-bash_env-role.yml" %}
---
- name: Use student.bash_env role playbook
  hosts: devservers
  vars:
    default_prompt: '[\u on \h in \W dir]\$ '
  pre_tasks:
    - name: Ensure test user does not exist
      ansible.builtin.user:
        name: student2
        state: absent
        force: true
        remove: true

  roles:
    - student.bash_env

  post_tasks:
    - name: Create the test user
      ansible.builtin.user:
        name: student2
        state: present
        password: "{{ 'redhat' | password_hash('sha512', 'mysecretsalt') }}"
```

    The `password_hash` filter turns the plain-text password into the hash that `/etc/shadow` expects. The fixed salt keeps the task idempotent.
  {% /task %}

  {% task id="task-1239aad62c32" legacyIndex=5 title="Run it" %}

```console
[student@workstation role-galaxy]$ ansible-navigator run -m stdout use-bash_env-role.yml

PLAY [Use student.bash_env role playbook] **************************************

TASK [Gathering Facts] *********************************************************
ok: [servera.lab.example.com]

TASK [Ensure test user does not exist] *****************************************
ok: [servera.lab.example.com]

TASK [student.bash_env : put away .bashrc] *************************************
changed: [servera.lab.example.com]

TASK [student.bash_env : put away .bash_profile] *******************************
changed: [servera.lab.example.com]

TASK [student.bash_env : put away .vimrc] **************************************
changed: [servera.lab.example.com]

TASK [Create the test user] ****************************************************
changed: [servera.lab.example.com]

PLAY RECAP *********************************************************************
servera.lab.example.com    : ok=6    changed=4    unreachable=0    failed=0  ...
```

    You may also see a deprecation warning about the Python `crypt` module, from `password_hash`. It does not affect the result.
  {% /task %}

  {% task id="task-d9b440fe3e5a" legacyIndex=6 title="Log in as the new user" %}
    Connect as `student2`, with the password `redhat`. The prompt is the one from the role:

```console
[student@workstation role-galaxy]$ ssh student2@servera
student2@servera's password: redhat
...output omitted...
[student2 on servera in ~ dir]$ exit
```
  {% /task %}

  {% task id="task-da21db5cbeb0" legacyIndex=7 title="Switch to the dev branch" %}
    The `dev` branch of the role adds a `prompt_color` variable. Change `version: main` to `version: dev` in `roles/requirements.yml`.

    This time, add `roles_path` to the `[defaults]` section of `ansible.cfg`, so you no longer need `-p roles`:

```ini {% title="ansible.cfg" %}
[defaults]
inventory = ./inventory
remote_user = devops
interpreter_python = auto_silent
roles_path = roles
...output omitted...
```

    Remove the installed role and install it again from the new branch:

```console
[student@workstation role-galaxy]$ ansible-galaxy remove student.bash_env
- successfully removed student.bash_env
[student@workstation role-galaxy]$ ansible-galaxy install -r roles/requirements.yml
Starting galaxy role install process
- extracting student.bash_env to /home/student/role-galaxy/roles/student.bash_env
- student.bash_env (dev) was installed successfully
```
  {% /task %}

  {% task id="task-698378252684" legacyIndex=8 title="Use the new variable" %}
    Add `prompt_color: blue` to the play's `vars`, next to `default_prompt`, and run the playbook again:

```console
[student@workstation role-galaxy]$ ansible-navigator run -m stdout use-bash_env-role.yml
...output omitted...
TASK [Ensure test user does not exist] *****************************************
changed: [servera.lab.example.com]

TASK [student.bash_env : put away .bashrc] *************************************
changed: [servera.lab.example.com]

TASK [student.bash_env : put away .bash_profile] *******************************
ok: [servera.lab.example.com]

TASK [student.bash_env : put away .vimrc] **************************************
ok: [servera.lab.example.com]

TASK [Create the test user] ****************************************************
changed: [servera.lab.example.com]

PLAY RECAP *********************************************************************
servera.lab.example.com    : ok=6    changed=3    unreachable=0    failed=0  ...
```

    Only `.bashrc` changed between the branches. Log in as `student2` again: the prompt is now blue.
  {% /task %}

  {% task id="task-740ffb8ef49e" legacyIndex=9 title="Finish" %}
    {% lab-finish exercise="role-galaxy" /%}
  {% /task %}
{% /lab %}
