---
title: Developing with VS Code and development containers
seoTitle: "VS Code Dev Containers and Ansible Execution Environments"
description: "Develop Ansible in VS Code with development containers and consistent execution environments. Free RHCE (EX294) lesson with diagrams and practice."
kind: lesson
minutes: 15
---

{% lead %}
A playbook is only half of what runs. The other half is the tools: which ansible-core, which collections, which version of the linter. A development container puts those tools in an image, so everyone who opens the project, on any machine, gets the same ones.
{% /lead %}

{% objectives %}
- Tell installed tools, a development container and an execution environment apart.
- Lint and run playbooks from the Ansible development container.
- Describe a project's development container for VS Code in `.devcontainer/devcontainer.json`.
- Configure `ansible-navigator` for a project, and set up the VS Code Ansible extension.
{% /objectives %}

## Three places your tools can come from

So far you have run Ansible with the tools installed on workstation. That works, but it ties the project to one machine: a colleague with a different ansible-core version can get different results from the same playbook. Containers fix the tools as well as the code.

{% diagram ref="tool-runtimes" /%}

| Runtime | Where it comes from | What it is for |
| --- | --- | --- |
| **Installed tools** | Packages and `pip` on the machine | Whatever that machine happens to have |
| **Development container** | An image, opened by VS Code or `podman run` | Writing, linting and testing the project with a known toolset |
| **Execution environment** | An image, started by `ansible-navigator` | Running playbooks with known engine and collection versions |

The Ansible community publishes a ready-made development container image, `ghcr.io/ansible/community-ansible-dev-tools`. It includes ansible-core, `ansible-navigator`, `ansible-lint` and the other development tools. It is about 1.4 GB, so the first pull takes a minute or two.

## Run the development container yourself

VS Code starts the development container for you, but it is an ordinary container, and you can start it with Podman. Doing that once shows exactly what the editor does. Compare the engine on workstation with the one in the image:

```console
[student@workstation ~]$ ansible --version | head -1
ansible [core 2.14.18]
[student@workstation ~]$ podman run --rm ghcr.io/ansible/community-ansible-dev-tools:latest ansible --version | head -1
ansible [core 2.21.4]
```

Same machine, two different engines. The image's versions change over time, so yours may be newer.

To work on a project, the container needs to see it. From the project directory:

```bash
podman run --rm --security-opt label=disable \
  -v "$PWD:/workdir" -w /workdir \
  ghcr.io/ansible/community-ansible-dev-tools:latest ansible-lint site.yml
```

- **`-v "$PWD:/workdir" -w /workdir`** mounts the project into the container and works there. Files the container writes belong to you, because rootless Podman maps the container's root user to your account.
- **`--security-opt label=disable`** lets the container read your home directory. Without it, SELinux on workstation blocks access to files that were not labelled for containers.
- **`--rm`** removes the container when the command ends. The image stays, so the next run starts at once.

### Lint the project

`ansible-lint` checks a playbook against good practice and reports every rule it breaks, with the file and line. This is part of its report for the exercise's `site.yml`:

```text
yaml[truthy]: Truthy value should be one of [false, true]
site.yml:4

fqcn[action-core]: Use FQCN for builtin module actions (file).
site.yml:7:7 Use `ansible.builtin.file` or `ansible.legacy.file` instead.

no-changed-when: Commands should not change things if nothing needs doing.
site.yml:12 Task/Handler: Kernel version is recorded

Failed: 3 failure(s), 0 warning(s) in 1 files processed of 1 encountered.
```

Each finding names a rule and points to a line. Fix the line and run the linter again until it reports `Passed`. These rules come up often:

| Rule | Problem | Fix |
| --- | --- | --- |
| `yaml[truthy]` | `yes`, `no`, `on` used as booleans | Write `true` or `false` |
| `fqcn[action-core]` | A short module name such as `file` | Use the full name, `ansible.builtin.file` |
| `no-changed-when` | `command` or `shell` reports `changed` on every run | Add `creates`/`removes`, or `changed_when` |
| `yaml[octal-values]` | `mode: 0644` without quotes | Quote it: `mode: "0644"` (chapter 6) |

### Run a playbook from the container

To reach the managed hosts, the container also needs your SSH key. Mount your `.ssh` directory read-only. The container runs as root, so it goes to `/root/.ssh`:

```bash
podman run --rm --security-opt label=disable \
  -v "$HOME/.ssh:/root/.ssh:ro" \
  -v "$PWD:/workdir" -w /workdir \
  ghcr.io/ansible/community-ansible-dev-tools:latest ansible-playbook site.yml
```

The play runs with the container's ansible-core 2.21, against the same hosts and with the same `ansible.cfg` and inventory.

## Open the same container in VS Code

VS Code reads the container's settings from `.devcontainer/devcontainer.json` in the project. Commit that file, and everyone who opens the project gets the same tools:

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

- **`image`** is the development container image.
- **`runArgs`** are extra options for the container engine; here, the same SELinux option as on the command line.
- **`extensions`** are installed inside the container: the Ansible extension, `redhat.ansible`.

To use it:

1. Install [VS Code](https://code.visualstudio.com/) and a container engine (Podman or Docker).
2. In the Extensions view, install **Dev Containers** (Microsoft) and **Ansible** (Red Hat).
3. Open the project folder, open the Command Palette ({% kbd %}Ctrl{% /kbd %}+{% kbd %}Shift{% /kbd %}+{% kbd %}P{% /kbd %}) and choose **Dev Containers: Reopen in Container**. The bottom-left corner of the window then shows that you are inside the container.
4. Open a terminal with **Terminal > New Terminal**. It runs inside the container, in the project directory: `ansible --version` reports the image's engine.
5. Open a playbook. The Ansible extension underlines lint findings as you type. Right-click the playbook in the editor or the Explorer to run it with `ansible-navigator run` or `ansible-playbook`.

{% callout type="note" title="VS Code and the home lab" %}
The home lab is sealed: your computer cannot reach the managed hosts, and workstation has no desktop. You can still use VS Code to edit, lint and syntax-check a project. Copy the project out with `lxc file pull -r --project rhce workstation/home/student/PROJECT .` on the Ubuntu host, open it, and reopen it in the container. Run playbooks against the lab from workstation, as in the exercise.
{% /callout %}

## Configure ansible-navigator for the project

`ansible-navigator` looks for a settings file in the project directory before it reads `~/.ansible-navigator.yml`. A project file travels with the project in Git, so everyone runs it the same way:

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

- **`mode: stdout`** prints output like `ansible-playbook`, instead of the interactive interface.
- **`execution-environment`** runs playbooks inside the named image. `policy: missing` pulls it only if it is not there yet.
- **`playbook-artifact`** turns off the JSON file navigator otherwise saves after each run.

Now a plain `ansible-navigator run site.yml` runs in that execution environment, and `ansible-navigator exec` runs any command inside it:

```console
[student@workstation workflow-container]$ ansible-navigator exec -- ansible --version | head -1
ansible [core 2.21.3]
```

The Ansible extension in VS Code has its own settings, in `.vscode/settings.json` or under **File > Preferences > Settings > Extensions > Ansible**. The ones you are most likely to change:

| Setting | Default | Meaning |
| --- | --- | --- |
| `ansible.ansibleNavigator.path` | `ansible-navigator` | Which `ansible-navigator` the extension runs |
| `ansible.validation.lint.enabled` | `true` | Run `ansible-lint` as you edit |
| `ansible.executionEnvironment.enabled` | `false` | Use an execution environment for the extension's own checks |
| `ansible.executionEnvironment.image` | the dev tools image | Which image those checks use |

Inside the development container, leave the defaults: the container already provides `ansible-navigator` and `ansible-lint`, and runs started from the editor read the project's `ansible-navigator.yml`.

{% callout type="tip" title="Record the exact image" %}
The `latest` tag moves when the image is rebuilt. Once a project works, record the exact image with `podman image inspect --format '{{.Digest}}' IMAGE` and write `IMAGE@sha256:…` in place of the tag, so later runs use the same tools.
{% /callout %}

{% quiz
  objectives=["ch12.development"]
  id="containers-check"
  ref="containers-check" /%}
