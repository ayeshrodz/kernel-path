---
title: "Exercise: Running a project in a development container"
seoTitle: "Running a project in a development container (RHCE Practice Exercise)"
description: "Hands-on RHCE practice: running a project in a development container. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 25
---

{% lead %}
You will run a small project with the Ansible development container instead of the tools installed on workstation: lint it, fix what the linter finds, and run it. Then you record the tools in the project itself, so VS Code and `ansible-navigator` use the same images for anyone who opens it.
{% /lead %}

The project `~/workflow-container` has an `ansible.cfg`, an `inventory` with servera in the `web` group, and `site.yml`. The playbook creates `/opt/tools` and records the running kernel version in `/opt/tools/kernel.txt`. It works, but it has three problems that `ansible-lint` reports.

{% lab
  objectives=["ch12.development"]
  id="containers"
  title="Running a project in a development container"
  exercise="workflow-container"
  ownExercise=true
  hosts=["workstation","servera.lab.example.com"]
  outcomes=["Compare the installed tools with the development container's.","Fix the findings of ansible-lint and run the playbook from the container.","Describe the development container and execution environment in the project."] %}
{% lab-notes %}

**Prerequisites:** Complete the [development container lesson](#/ch12/development-containers). Workstation needs internet access to pull two images: about 1.4 GB and 450 MB. Run commands as student on workstation.

{% reveal title="Verify your work" %}

From `~/workflow-container`, run:

```bash
lab grade workflow-container
```

The grader runs `ansible-lint` in the development container, checks the two settings files and reads `/opt/tools/kernel.txt` on servera. It uses the image you already pulled and never downloads one.

{% /reveal %}

{% reveal title="Try an independent variation" %}

Add a task that copies the text `Managed from Git` to `/opt/tools/README`, mode `0644`. Write it with a short module name first, see which rule fails, then fix it. Run the play twice from the execution environment; the second run must report `changed=0`.

{% /reveal %}

{% /lab-notes %}

{% lab-challenge %}

Make `~/workflow-container` run the same way for anyone, whatever is installed on their machine.

- `site.yml` must pass `ansible-lint` in the development container `ghcr.io/ansible/community-ansible-dev-tools:latest`, without disabling any rule.
- Run it from that container against servera. A second run must report `changed=0`.
- Add `.devcontainer/devcontainer.json` so that VS Code opens the same image with the Ansible extension.
- Add a project `ansible-navigator.yml` so that `ansible-navigator run site.yml` uses the execution environment `ghcr.io/ansible-community/community-ee-minimal:latest`, prints to standard output and saves no playbook artifacts.

{% /lab-challenge %}

  {% task id="task-0e6c4b9a2d71" title="Compare the tools" %}

Start the exercise and check the engine installed on workstation. Then pull the development container and check its engine:

```console
[student@workstation ~]$ lab start workflow-container
[student@workstation ~]$ cd ~/workflow-container
[student@workstation workflow-container]$ ansible --version | head -1
ansible [core 2.14.18]
[student@workstation workflow-container]$ podman pull ghcr.io/ansible/community-ansible-dev-tools:latest
...output omitted...
[student@workstation workflow-container]$ podman run --rm ghcr.io/ansible/community-ansible-dev-tools:latest ansible --version | head -1
ansible [core 2.21.4]
```

The image is rebuilt from time to time, so you may see a newer version.

  {% /task %}
  {% task id="task-a5f17d3e8c02" title="Lint the playbook in the container" %}

Run `ansible-lint` in the container, with the project mounted as `/workdir`:

```console
[student@workstation workflow-container]$ podman run --rm --security-opt label=disable \
  -v "$PWD:/workdir" -w /workdir \
  ghcr.io/ansible/community-ansible-dev-tools:latest ansible-lint site.yml
...output omitted...
yaml[truthy]: Truthy value should be one of [false, true]
site.yml:4

fqcn[action-core]: Use FQCN for builtin module actions (file).
site.yml:7:7 Use `ansible.builtin.file` or `ansible.legacy.file` instead.

no-changed-when: Commands should not change things if nothing needs doing.
site.yml:12 Task/Handler: Kernel version is recorded

Failed: 3 failure(s), 0 warning(s) in 1 files processed of 1 encountered. ...
```

Fix the three lines in `site.yml`:

- Line 4: `become: yes` becomes `become: true`.
- Line 7: `file:` becomes `ansible.builtin.file:`.
- Line 12: the `shell` task rewrites the file on every run. Give it `creates: /opt/tools/kernel.txt`, so it runs only when the file is missing. With an extra option, the command moves to the `cmd` key.

{% reveal title="The fixed site.yml" %}

```yaml {% title="site.yml" %}
---
- name: Build host keeps a record of its kernel
  hosts: web
  become: true
  tasks:
    - name: Tools directory exists
      ansible.builtin.file:
        path: /opt/tools
        state: directory
        mode: "0755"

    - name: Kernel version is recorded
      ansible.builtin.shell:
        cmd: uname -r > /opt/tools/kernel.txt
        creates: /opt/tools/kernel.txt
```

{% /reveal %}

Run the linter again. It should report:

```text
Passed: 0 failure(s), 0 warning(s) in 1 files processed of 1 encountered. Last profile that met the validation criteria was 'production'.
```

  {% /task %}
  {% task id="task-6b2d8e0f4a93" title="Run the playbook from the container" %}

Mount your SSH directory too, read-only, so the container can log in to servera. Run the play twice:

```console
[student@workstation workflow-container]$ podman run --rm --security-opt label=disable \
  -v "$HOME/.ssh:/root/.ssh:ro" \
  -v "$PWD:/workdir" -w /workdir \
  ghcr.io/ansible/community-ansible-dev-tools:latest ansible-playbook site.yml
...output omitted...
servera.lab.example.com    : ok=3    changed=2    unreachable=0    failed=0  ...
```

Press {% kbd %}↑{% /kbd %} and {% kbd %}Enter{% /kbd %} to run it again. The second recap shows `changed=0`: thanks to `creates`, the kernel task is skipped. Check the result:

```console
[student@workstation workflow-container]$ ssh devops@servera.lab.example.com cat /opt/tools/kernel.txt
```

  {% /task %}
  {% task id="task-d9417c0b5e26" title="Describe the development container" %}

Create `.devcontainer/devcontainer.json`, so that VS Code opens the same image, with the Ansible extension, for anyone who opens the project:

```console
[student@workstation workflow-container]$ mkdir .devcontainer
[student@workstation workflow-container]$ vim .devcontainer/devcontainer.json
```

```json {% title=".devcontainer/devcontainer.json" %}
{
  "name": "Ansible development",
  "image": "ghcr.io/ansible/community-ansible-dev-tools:latest",
  "runArgs": ["--security-opt", "label=disable"],
  "customizations": {
    "vscode": {
      "extensions": ["redhat.ansible"]
    }
  }
}
```

  {% /task %}
  {% task id="task-3c8f0a6d2b17" title="Run the project in an execution environment" %}

Create the project's navigator settings:

```yaml {% title="ansible-navigator.yml" %}
---
ansible-navigator:
  mode: stdout
  execution-environment:
    enabled: true
    image: ghcr.io/ansible-community/community-ee-minimal:latest
    pull:
      policy: missing
  playbook-artifact:
    enable: false
```

Run the playbook with no options. Navigator reads the project file, pulls the image the first time, and runs the play inside it:

```console
[student@workstation workflow-container]$ ansible-navigator run site.yml
...output omitted...
servera.lab.example.com    : ok=3    changed=0    unreachable=0    failed=0  ...
[student@workstation workflow-container]$ ansible-navigator exec -- ansible --version | head -1
ansible [core 2.21.3]
```

`changed=0`: a different runtime, the same result on the host.

  {% /task %}
  {% task id="task-8a0e5c3f71d4" title="Check and grade" %}

```console
[student@workstation workflow-container]$ lab grade workflow-container
```

Every check should pass. When you are done, run `lab finish workflow-container`. The images stay on workstation for the chapter lab.

  {% /task %}
{% /lab %}
