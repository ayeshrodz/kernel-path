---
title: "Exercise: Simplifying playbooks with roles and content collections"
seoTitle: "Ansible roles and collections Practice Lab (RHCE Exam Style)"
description: "Graded RHCE exam-style lab on Ansible roles and collections: a challenge with requirements, hints and solutions, and a grader that checks your work on your own lab."
kind: lab
minutes: 40
---

{% lead %}
Your developers need a web server of their own. It must be configured like production, which the infrastructure team manages with its own role; each developer gets a directory served on a personal, non-standard port; and SELinux must stay enforcing. You will combine a role from Git, a role you create, and a system role from a collection in one play. Solutions are hidden under each task. Try each one yourself first.
{% /lead %}

The project `~/role-review` has an `ansible.cfg`, an `inventory` with servera in the `dev_webserver` group, and some prepared pieces: `developer_tasks.yml` and `developer.conf.j2` (the tasks and template for your role), `web_developers.yml` and `selinux.yml` (variables), and the system roles collection archive.

{% lab
  objectives=["ch08.role-structure","ch08.role-create","ch08.role-install","ch08.collections","ch08.system-roles"]
  id="review"
  title="Simplifying Playbooks with Roles and Ansible Content Collections"
  exercise="role-review"
  hosts=["workstation","servera.lab.example.com"]
  outcomes=["Create a role that depends on another role installed from Git.","Use a system role from a collection to make an SELinux change.","Recover from a failure that a role reports on purpose."] %}
{% lab-notes %}

**Prerequisites:** Complete [control-node setup](#/ch01/control-node) and the preceding lessons in this chapter. Run commands as student on workstation unless a step names another machine.

{% reveal title="Verify your work" %}

From the project directory, run the relevant home-lab check. For an exercise with several checkpoints, grade each state before changing or removing it:

```bash
lab grade role-review
```

The grader reads project files and host state. A passing report covers the listed checks; also perform the task’s independent connection, repeat-run, and reboot checks where requested.

{% /reveal %}

{% reveal title="Try an independent variation" %}

Add a third developer on a new port. Update its data and SELinux access, then verify all three sites.

Record the published result first. The grader checks the original requirements, so a changed name or value may intentionally fail those checks.

{% /reveal %}

{% /lab-notes %}

{% lab-challenge %}

Give each developer the web endpoint described in the supplied data, while preserving SELinux enforcement.

- `web_dev_server.yml` must configure `dev_webserver`, ensuring notified handlers still run after later ordinary task failures.
- The project must install `infra.apache` version `v1.4` from its supplied Git repository. The new `apache.developer_configs` role must declare that dependency and use `developer_tasks.yml` and `developer.conf.j2`.
- Developer data must apply to the target group. Ports 9081 and 9082 must have the correct web-service SELinux type.
- Recover from a required SELinux reboot, and prove both endpoints return their intended content. Repeat without unnecessary changes.

{% /lab-challenge %}

  {% lab-setup variant="homelab" %}
    `lab start role-review` publishes the infrastructure team's role on workstation, in the Git repository `~/git-repos/infra/apache.git`, with the tags `v1.3` and `v1.4`. Where the steps below use the repository, use its `file://` path.
  {% /lab-setup %}

  {% task id="task-1a4ddac08d15" legacyIndex=1 title="Install the system roles into the project" %}

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ cd ~/role-review
[student@workstation role-review]$ ansible-galaxy collection install \
> -p collections/ redhat-rhel_system_roles-1.120.5.tar.gz
...output omitted...
redhat.rhel_system_roles:1.120.5 was installed successfully
```
    {% /reveal %}
  {% /task %}

  {% task id="task-cc6a433c4707" legacyIndex=2 title="Start the playbook" %}
    Create `web_dev_server.yml` with one play, `Configure Dev Web Server`, for `dev_webserver`. Handlers must run even if a later task fails. Check the syntax and run it.

    {% reveal title="Show solution" %}

```yaml {% title="web_dev_server.yml" %}
---
- name: Configure Dev Web Server
  hosts: dev_webserver
  force_handlers: true
```

```console
[student@workstation role-review]$ ansible-navigator run -m stdout web_dev_server.yml
...output omitted...
servera.lab.example.com    : ok=1    changed=0    unreachable=0    failed=0  ...
```

    A play with no tasks still gathers facts, so it is a quick test that the inventory and connection work.
    {% /reveal %}
  {% /task %}

  {% task id="task-c5ffdd5e910f" legacyIndex=3 title="Install the infrastructure team's role" %}
    Write `roles/requirements.yml` to install the role `infra.apache`, version `v1.4`, from the team's Git repository, and install it into `roles/`.

    {% reveal title="Show solution" %}

    {% variant-group %}
      {% variant name="classroom" %}

```yaml {% title="roles/requirements.yml" %}
---
- name: infra.apache
  src: git@workstation.lab.example.com:infra/apache
  scm: git
  version: v1.4
```
      {% /variant %}
      {% variant name="homelab" %}

```yaml {% title="roles/requirements.yml" %}
---
- name: infra.apache
  src: file:///home/student/git-repos/infra/apache.git
  scm: git
  version: v1.4
```
      {% /variant %}
    {% /variant-group %}

```console
[student@workstation role-review]$ mkdir -v roles
mkdir: created directory 'roles'
[student@workstation role-review]$ ansible-galaxy install -r roles/requirements.yml -p roles
Starting galaxy role install process
- extracting infra.apache to /home/student/role-review/roles/infra.apache
- infra.apache (v1.4) was installed successfully
```
    {% /reveal %}
  {% /task %}

  {% task id="task-40f755761dc4" legacyIndex=4 title="Create the developer role" %}
    Create the role `apache.developer_configs` in `roles/`. It depends on `infra.apache` at version `v1.4`. Use `developer_tasks.yml` as its tasks and `developer.conf.j2` as its template.

    {% reveal title="Show solution" %}

```console
[student@workstation role-review]$ cd roles
[student@workstation roles]$ ansible-galaxy init apache.developer_configs
- Role apache.developer_configs was created successfully
[student@workstation roles]$ cd ..
[student@workstation role-review]$ mv -v developer_tasks.yml \
> roles/apache.developer_configs/tasks/main.yml
renamed 'developer_tasks.yml' -> 'roles/apache.developer_configs/tasks/main.yml'
[student@workstation role-review]$ mv -v developer.conf.j2 \
> roles/apache.developer_configs/templates/
renamed 'developer.conf.j2' -> 'roles/apache.developer_configs/templates/developer.conf.j2'
```

    In `roles/apache.developer_configs/meta/main.yml`, declare the dependency (keep or simplify the generated `galaxy_info`):

```yaml {% title="roles/apache.developer_configs/meta/main.yml" %}
---
galaxy_info:
  author: student
  description: Web server configuration for each developer
  license: MIT
  min_ansible_version: "2.14"

dependencies:
  - name: infra.apache
    src: file:///home/student/git-repos/infra/apache.git
    scm: git
    version: v1.4
```

    In a classroom, use the same `src` as in the requirements file. The tasks you moved create a user for each developer, give `student` SSH access to those accounts, create a content directory with a default page, open each developer's port in the firewall, and install an Apache configuration per developer that listens on that port. They read everything from a variable, `web_developers`, and notify `restart apache`, a handler that `infra.apache` provides.
    {% /reveal %}
  {% /task %}

  {% task id="task-d890d9c01f72" legacyIndex=5 title="Give the role its data" %}
    `web_developers.yml` lists the developers and their ports. Make it apply to the `dev_webserver` group.

    {% reveal title="Show solution" %}

```yaml {% title="web_developers.yml" %}
---
web_developers:
  - username: jdoe
    name: John Doe
    user_port: 9081
  - username: jdoe2
    name: Jane Doe
    user_port: 9082
```

```console
[student@workstation role-review]$ mkdir -pv group_vars/dev_webserver
mkdir: created directory 'group_vars'
mkdir: created directory 'group_vars/dev_webserver'
[student@workstation role-review]$ mv -v web_developers.yml group_vars/dev_webserver/
renamed 'web_developers.yml' -> 'group_vars/dev_webserver/web_developers.yml'
```
    {% /reveal %}
  {% /task %}

  {% task id="task-40c5c621a517" legacyIndex=6 title="Add the role and run the play" %}
    Add `apache.developer_configs` to the play's roles and run it. It fails. Read the error and work out why.

    {% reveal title="Show solution" %}

```yaml
  roles:
    - apache.developer_configs
```

```console
[student@workstation role-review]$ ansible-navigator run -m stdout web_dev_server.yml
...output omitted...
TASK [infra.apache : Apache Package is installed] ******************************
changed: [servera.lab.example.com]
...output omitted...
TASK [apache.developer_configs : Copy Per-Developer Config files] **************
changed: [servera.lab.example.com] => (item={'username': 'jdoe', 'name': 'John Doe', 'user_port': 9081})
changed: [servera.lab.example.com] => (item={'username': 'jdoe2', 'name': 'Jane Doe', 'user_port': 9082})

RUNNING HANDLER [infra.apache : restart firewalld] *****************************
changed: [servera.lab.example.com]

RUNNING HANDLER [infra.apache : restart apache] ********************************
fatal: [servera.lab.example.com]: FAILED! => {"changed": false, "msg": "Unable to restart service httpd: Job for httpd.service failed because the control process exited with error code.\nSee \"systemctl status httpd.service\" and \"journalctl -xeu httpd.service\" for details.\n"}

PLAY RECAP *********************************************************************
servera.lab.example.com    : ok=13   changed=11   unreachable=0    failed=1  ...
```

    The dependency ran first, then the developer role. Apache now has to listen on ports 9081 and 9082, and SELinux does not allow the web server to use them: only ports labelled `http_port_t` are allowed. Because of `force_handlers`, the handlers still ran, and the restart is where the problem showed.
    {% /reveal %}
  {% /task %}

  {% task id="task-094867f57ec1" legacyIndex=7 title="Label the ports with the SELinux system role" %}
    `selinux.yml` holds the variables for the selinux role: keep SELinux enforcing with the targeted policy, and label 9081 and 9082 as `http_port_t`. Make it apply to `dev_webserver`. Then, in `pre_tasks`, apply the role so that it runs before the other roles, and handle a failure that is caused only by a required reboot: reboot, then apply the role again. The role's example playbook in `/usr/share/doc/rhel-system-roles/selinux/` shows the pattern.

    {% reveal title="Show solution" %}

```yaml {% title="group_vars/dev_webserver/selinux.yml" %}
---
# variables used by redhat.rhel_system_roles.selinux

selinux_policy: targeted
selinux_state: enforcing

selinux_ports:
  - ports:
      - "9081"
      - "9082"
    proto: 'tcp'
    setype: 'http_port_t'
    state: 'present'
```

```console
[student@workstation role-review]$ mv -v selinux.yml group_vars/dev_webserver/
renamed 'selinux.yml' -> 'group_vars/dev_webserver/selinux.yml'
```

```yaml {% title="web_dev_server.yml" %}
---
- name: Configure Dev Web Server
  hosts: dev_webserver
  force_handlers: true
  roles:
    - apache.developer_configs
  pre_tasks:
    - name: Verify SELinux configuration
      block:
        - name: Apply the SELinux role
          ansible.builtin.include_role:
            name: redhat.rhel_system_roles.selinux
      rescue:
        # Fail if failed for a different reason than selinux_reboot_required.
        - name: Handle general failure
          ansible.builtin.fail:
            msg: "SELinux role failed."
          when: not selinux_reboot_required

        - name: Restart managed host
          ansible.builtin.reboot:
            msg: "Ansible rebooting system for updates."

        - name: Reapply SELinux role to complete changes
          ansible.builtin.include_role:
            name: redhat.rhel_system_roles.selinux
```

    `pre_tasks` is written after `roles` here, and it still runs first: the order of sections in the file does not matter.
    {% /reveal %}
  {% /task %}

  {% task id="task-f0ba33af5e66" legacyIndex=8 title="Run it again" %}

```console
[student@workstation role-review]$ ansible-navigator run -m stdout web_dev_server.yml
...output omitted...
TASK [redhat.rhel_system_roles.selinux : Set an SELinux label on a port] *******
changed: [servera.lab.example.com] => (item={'ports': ['9081', '9082'], 'proto': 'tcp', 'setype': 'http_port_t', 'state': 'present'})
...output omitted...
TASK [infra.apache : Apache Service is started] ********************************
changed: [servera.lab.example.com]
...output omitted...
TASK [apache.developer_configs : Copy Per-Developer Config files] **************
ok: [servera.lab.example.com] => (item={'username': 'jdoe', 'name': 'John Doe', 'user_port': 9081})
ok: [servera.lab.example.com] => (item={'username': 'jdoe2', 'name': 'Jane Doe', 'user_port': 9082})

PLAY RECAP *********************************************************************
servera.lab.example.com    : ok=29   changed=2    unreachable=0    failed=0    skipped=22  ...
```

    Only two changes: the port labels, and starting `httpd`, which had stopped when the earlier restart failed. A third run reports `changed=0`.
  {% /task %}

  {% task id="task-262bbcbb3942" legacyIndex=9 title="Test every site" %}

```console
[student@workstation role-review]$ curl servera
This is the production server on servera.lab.example.com
[student@workstation role-review]$ curl servera:9081
This is index.html for user: John Doe (jdoe)
[student@workstation role-review]$ curl servera:9082
This is index.html for user: Jane Doe (jdoe2)
```
  {% /task %}

  {% task id="task-72d64dba48d1" legacyIndex=10 title="Grade and finish" %}
    {% lab-finish exercise="role-review" grade=true /%}
  {% /task %}
{% /lab %}
