---
title: Protecting secrets with Ansible Vault
seoTitle: "Ansible Vault Tutorial: Encrypt Secrets in Playbooks"
description: "Encrypt files and variables with ansible-vault and run playbooks with vault passwords. Free RHCE (EX294) lesson with diagrams and practice."
kind: lesson
minutes: 12
---

{% lead %}
Playbooks often need passwords, API keys or private keys. Kept as plain text in a variables file, those secrets are readable by anyone who can see the project, including everyone with access to its Git repository. Ansible Vault encrypts them so the project can be shared safely.
{% /lead %}

{% objectives %}
- Create, view, edit, encrypt, decrypt and rekey files with `ansible-vault`.
- Run a playbook that uses Vault-encrypted variables, with a prompt or a password file.
- Lay out a project so secrets are encrypted and everything else stays readable.
{% /objectives %}

## What Vault does

Ansible Vault ships with Ansible. Its command-line tool, **`ansible-vault`**, encrypts and decrypts any data file Ansible uses: inventory variables, variable files loaded by a playbook, files passed as extra variables, or variables in roles.

{% diagram ref="vault-flow" /%}

The encrypted file starts with a header like `$ANSIBLE_VAULT;1.1;AES256`, followed by ciphertext. It is safe to commit to version control. When a playbook needs the values, `ansible-navigator` decrypts them in memory using the Vault password you provide.

{% callout type="important" title="How strong is it?" %}
Vault does not implement its own cryptography. It uses an external Python toolkit and protects files with **AES256** symmetric encryption, using your password as the secret key. (Files encrypted by very old Ansible versions may use 128-bit AES.) The way Vault does this has not been formally audited by a third party.
{% /callout %}

## The ansible-vault commands

Pick a subcommand to see what it does to the file:

{% vault-commands ref="vault-commands" /%}

A few details worth knowing:

- `create` opens the file in `vi` by default. Run `export EDITOR=nano` first to use a different editor.
- Instead of typing the password, most subcommands accept `--vault-password-file=FILE`, a file containing the password on a single line. Protect that file carefully (for example with mode `0600`), because it holds the password in plain text.

```console
[student@demo ~]$ ansible-vault create --vault-password-file=vault-pass secret.yml
```

- `view` shows the content without changing anything. `edit` always rewrites the file, so under version control it looks modified even if you changed nothing. Use `view` to read.

```console
[student@demo ~]$ ansible-vault view secret1.yml
Vault password: secret
my_secret: "yJJvPqhsiusmmPPZdnjndkdnYNDjdj782meUZcw"
```

## Running playbooks that use Vault

If a playbook reads an encrypted file and you give no password, it stops immediately:

```console
[student@demo ~]$ ansible-navigator run -m stdout test-secret.yml
ERROR! Attempting to decrypt but no vault secrets found
```

There are three ways to provide the password.

{% tabs %}
  {% tab label="Prompt" %}

```console
[student@demo ~]$ ansible-navigator run -m stdout \
> --playbook-artifact-enable false \
> site.yml --vault-id @prompt
Vault password (default): redhat
```

`--vault-id @prompt` asks for the password interactively. Playbook artifacts must be disabled, either with `--playbook-artifact-enable false` as here, or in `ansible-navigator.yml`:

```yaml {% title="ansible-navigator.yml" %}
ansible-navigator:
  playbook-artifact:
    enable: false
```

  {% /tab %}
  {% tab label="Password file" %}

```console
[student@demo ~]$ ansible-navigator run -m stdout site.yml \
> --vault-password-file=vault-pw-file
```

The file contains the password as a single line of plain text. Restrict its permissions and never commit it to Git.

  {% /tab %}
  {% tab label="Environment variable" %}

```console
[student@demo ~]$ export ANSIBLE_VAULT_PASSWORD_FILE=~/vault-pw-file
[student@demo ~]$ ansible-navigator run -m stdout site.yml
```

`ANSIBLE_VAULT_PASSWORD_FILE` sets the default password file, so you do not need the option on every run.

  {% /tab %}
{% /tabs %}

{% callout type="warning" title="Prompts need artifacts disabled" %}
If playbook artifacts are enabled (the default), `ansible-navigator` hangs when it needs to ask you for the Vault password. This is the same rule you met for SSH and sudo passwords in chapter 3.
{% /callout %}

### Several Vault passwords

Larger projects sometimes encrypt different files with different passwords, for example one for development and one for production. Pass several `--vault-id` (or `--vault-password-file`) options:

```console
[student@demo ~]$ ansible-navigator run -m stdout \
> --playbook-artifact-enable false site.yml \
> --vault-id one@prompt --vault-id two@prompt
Vault password (one):
Vault password (two):
...output omitted...
```

The labels `one` and `two` are **Vault IDs**. If a file was encrypted with a matching ID (`ansible-vault encrypt --vault-id one@prompt …`), Ansible tries that password first; otherwise it tries each password until one works. `@prompt` on its own is shorthand for `default@prompt`.

## Organising secrets in a project

The simplest approach is to keep sensitive variables in **their own files** and encrypt only those files, leaving everything else readable.

With `group_vars` and `host_vars`, you can use a **directory** named after a group or host instead of a single file. Every file inside the directory applies to that group or host, so you can split plain and secret variables:

{% project-tree ref="project-tree" /%}

The file names `vars` and `vault` are only a convention. The directory can hold any number of files with any names, some encrypted and some not.

Playbook variables can be protected the same way: put the secrets in their own file, encrypt it, and load it with `vars_files`. Because playbook variables beat inventory variables, this is also a handy way to override values.

```yaml
- name: Create user accounts for all our servers
  hosts: devservers
  vars_files:
    - secret.yml
  tasks:
    ...
```

{% callout type="tip" title="Use Vault IDs with several passwords" %}
If you use more than one Vault password, give each encrypted file a Vault ID and supply the matching ID when you run the playbook. Ansible then tries the right password first instead of working through all of them.
{% /callout %}

{% quiz
  objectives=["ch04.vault"]
  id="check"
  title="Check your understanding"
  ref="check" /%}

## Takeaway

Create, view, edit, encrypt, decrypt and rekey files with `ansible-vault`. Use the chapter lab to check this on a real host.
