---
title: "Exercise: Git and development containers"
seoTitle: "Git for Ansible Practice Lab (RHCE Exam Style)"
description: "Graded RHCE exam-style lab on Git for Ansible: a challenge with requirements, hints and solutions, and a grader that checks your work on your own lab."
kind: lab
minutes: 30
---

{% lead %}
A colleague left a status-page project in the team's Git repository. It works on their machine, but it fails the team's lint check and does not say which tools it needs. Clone it, fix it in the development container, record its tools, run it in an execution environment, and publish your work. Solutions are hidden under each task. Try each one yourself first.
{% /lead %}

`lab start workflow-review` publishes the project as a shared remote at `~/git-repos/ops/web-status.git` and gives you an empty `~/workflow-review` directory. The project deploys a status page with Apache to serverb.

{% lab
  objectives=["ch12.git","ch12.development"]
  id="review"
  title="Git and Development Containers"
  exercise="workflow-review"
  ownExercise=true
  hosts=["workstation","serverb.lab.example.com"]
  outcomes=["Clone a project and fix its lint findings in the development container.","Record the development container and execution environment in the project.","Run the project in an execution environment and verify the result.","Commit and push the work, without generated files."] %}
{% lab-notes %}

**Prerequisites:** Complete both exercises in this chapter. The two container images from the previous exercise should already be on workstation. Run commands as student on workstation.

{% reveal title="Verify your work" %}

From `~/workflow-review`, run:

```bash
lab grade workflow-review
```

The grader checks the clone, runs `ansible-lint` in the development container, checks that everything is committed and pushed (including both settings files), and checks the status page on serverb.

{% /reveal %}

{% reveal title="Try an independent variation" %}

Add a `README.md` section that explains how to open the project in VS Code and how to run it. Commit and push it, then clone the remote into a temporary directory and check that a fresh clone contains everything a new colleague needs.

{% /reveal %}

{% /lab-notes %}

{% lab-challenge %}

Clone the shared `web-status` project into `~/workflow-review` and make it ready for the team.

- `site.yml` must pass `ansible-lint` in the development container, without disabling any rule.
- The project must contain `.devcontainer/devcontainer.json` for the development container image with the Ansible extension, and an `ansible-navigator.yml` that runs playbooks in `ghcr.io/ansible-community/community-ee-minimal:latest`, with standard output and no playbook artifacts.
- Running the project from its execution environment must leave Apache running and enabled on serverb, serving the status page.
- Commit and push all of this. `ansible-navigator.log` must never be committed. Finish with a clean working tree that matches the remote.

{% /lab-challenge %}

  {% task id="task-2e7a9c4f0b18" title="Clone the project" %}

Start the exercise and clone the remote into the empty project directory. Look at the history and the files.

{% reveal title="Solution" %}

```console
[student@workstation ~]$ lab start workflow-review
[student@workstation ~]$ cd ~/workflow-review
[student@workstation workflow-review]$ git clone ~/git-repos/ops/web-status.git .
[student@workstation workflow-review]$ git log --oneline
[student@workstation workflow-review]$ ls
ansible.cfg  inventory  README.md  site.yml  templates
```

{% /reveal %}

  {% /task %}
  {% task id="task-b4d0f8e6a2c3" title="Fix the lint findings" %}

Run `ansible-lint` in the development container and fix every finding.

{% reveal title="Solution" %}

```console
[student@workstation workflow-review]$ podman run --rm --security-opt label=disable \
  -v "$PWD:/workdir" -w /workdir \
  ghcr.io/ansible/community-ansible-dev-tools:latest ansible-lint site.yml
...output omitted...
fqcn[action-core]: Use FQCN for builtin module actions (dnf).
site.yml:6:7 Use `ansible.builtin.dnf` or `ansible.legacy.dnf` instead.

yaml[octal-values]: Forbidden implicit octal value "0644"
site.yml:14

yaml[truthy]: Truthy value should be one of [false, true]
site.yml:20
```

Change `dnf:` to `ansible.builtin.dnf:`, quote the mode as `mode: "0644"`, and change `enabled: yes` to `enabled: true`. Run the linter again until it reports `Passed`.

```yaml {% title="site.yml" %}
---
- name: Status page is published
  hosts: web
  tasks:
    - name: Web server is installed
      ansible.builtin.dnf:
        name: httpd
        state: present

    - name: Status page is deployed
      ansible.builtin.template:
        src: templates/index.html.j2
        dest: /var/www/html/index.html
        mode: "0644"

    - name: Web server is running
      ansible.builtin.service:
        name: httpd
        state: started
        enabled: true
```

{% /reveal %}

  {% /task %}
  {% task id="task-5f1c3a7e9d04" title="Record the project's tools" %}

Add the development container settings, the navigator settings and a `.gitignore` for the navigator log.

{% reveal title="Solution" %}

Create `.devcontainer/devcontainer.json` and `ansible-navigator.yml` with the same content as in the previous exercise, then:

```text {% title=".gitignore" %}
ansible-navigator.log
```

{% /reveal %}

  {% /task %}
  {% task id="task-9a6e2b0d4c57" title="Run and verify" %}

Run the project with `ansible-navigator`, twice, and check the page on serverb.

{% reveal title="Solution" %}

```console
[student@workstation workflow-review]$ ansible-navigator run site.yml
...output omitted...
serverb.lab.example.com    : ok=4    changed=3    unreachable=0    failed=0  ...
[student@workstation workflow-review]$ ansible-navigator run site.yml
...output omitted...
serverb.lab.example.com    : ok=4    changed=0    unreachable=0    failed=0  ...
[student@workstation workflow-review]$ ssh devops@serverb.lab.example.com curl -s localhost
<h1>Status: serverb.lab.example.com</h1>
<p>Deployed from Git.</p>
```

{% /reveal %}

  {% /task %}
  {% task id="task-c0e8d5a3f612" title="Commit, push and grade" %}

Review what you are about to commit, commit it with a clear message, push it, and grade.

{% reveal title="Solution" %}

```console
[student@workstation workflow-review]$ git status --short
 M site.yml
?? .devcontainer/
?? .gitignore
?? ansible-navigator.yml
[student@workstation workflow-review]$ git add -A
[student@workstation workflow-review]$ git diff --cached --stat
[student@workstation workflow-review]$ git commit -m 'Fix lint findings and record the project tools'
[student@workstation workflow-review]$ git push
[student@workstation workflow-review]$ git status
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
[student@workstation workflow-review]$ lab grade workflow-review
```

`ansible-navigator.log` is on disk but not in `git status`, because `.gitignore` lists it. When you are done, run `lab finish workflow-review`.

{% /reveal %}

  {% /task %}
{% /lab %}
