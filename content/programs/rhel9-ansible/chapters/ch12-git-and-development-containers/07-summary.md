---
title: "Git for Ansible cheat sheet"
seoTitle: "Git for Ansible Cheat Sheet (RHCE)"
description: "Git for Ansible cheat sheet: the key commands and ideas on one page, with flashcards for revision. Free RHCE study notes."
kind: summary
minutes: 6
---

{% lead %}
The chapter on one page: the Git cycle, the container commands and settings files, and flashcards for quick revision.
{% /lead %}

## The chapter in six sentences

- **Git** keeps every version of a project; the **working tree**, **staging area**, **local repository** and **remote** are the four places your work moves through.
- Every change follows the same cycle: **edit, check** (`status`, `diff`), **stage** (`add`), **commit**, **push**.
- **Pull** before you start and whenever a push is rejected, so your commits build on your teammates' work.
- A committed **`.gitignore`** keeps vault password files and generated files such as `ansible-navigator.log` out of the history; a secret that was pushed must be changed.
- A **development container** gives everyone the same tools for writing and checking a project; `.devcontainer/devcontainer.json` tells VS Code which image to open.
- A project **`ansible-navigator.yml`** chooses the **execution environment** that runs its playbooks, for everyone who clones it.

## Cheat sheet

{% tabs %}
  {% tab label="Git" %}

```bash
git config --global user.name 'Student'      # once per account
git config --global user.email 'student@example.com'
git config --global pull.rebase false        # pull merges

git clone REMOTE DIR        # copy a project and its history
git status --short          # what changed (?? = untracked)
git diff                    # unstaged changes
git add FILE                # stage
git diff --cached           # what the next commit contains
git commit -m 'Message'     # save the staged draft
git push                    # send commits to origin
git pull --no-edit          # bring in teammates' commits
git log --oneline --graph   # history
git restore FILE            # discard uncommitted edits
```

  {% /tab %}
  {% tab label=".gitignore" %}

```text
vault-pass
ansible-navigator.log
*-artifact-*.json
```

Encrypted vault files are safe to commit; their password file is not.

  {% /tab %}
  {% tab label="Dev container" %}

```bash
IMAGE=ghcr.io/ansible/community-ansible-dev-tools:latest
podman run --rm --security-opt label=disable \
  -v "$PWD:/workdir" -w /workdir $IMAGE ansible-lint site.yml

podman run --rm --security-opt label=disable \
  -v "$HOME/.ssh:/root/.ssh:ro" \
  -v "$PWD:/workdir" -w /workdir $IMAGE ansible-playbook site.yml
```

```json
{
  "name": "Ansible development",
  "image": "ghcr.io/ansible/community-ansible-dev-tools:latest",
  "runArgs": ["--security-opt", "label=disable"],
  "customizations": { "vscode": { "extensions": ["redhat.ansible"] } }
}
```

  {% /tab %}
  {% tab label="Navigator" %}

```yaml
# ansible-navigator.yml, in the project directory
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

```bash
ansible-navigator run site.yml                  # runs in the EE
ansible-navigator exec -- ansible --version     # any command in the EE
```

  {% /tab %}
{% /tabs %}

{% flashcards
  title="Chapter 12 flashcards"
  ref="flashcards" /%}
