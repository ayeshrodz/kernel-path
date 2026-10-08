---
title: "Exercise: Managing secrets"
seoTitle: "Managing secrets (RHCE Practice Exercise)"
description: "Hands-on RHCE practice: managing secrets. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 20
---

{% lead %}
You will unlock an encrypted variables file, use its secrets in a playbook that creates a user, run the playbook first with a password prompt and then with a password file, and finally log in as the new user to prove the password was set.
{% /lead %}

The project `~/data-secret` contains `secret.yml`, a Vault-encrypted file (password `redhat`) with two commented-out variables: `username` and `pwhash`, a hashed password.

{% lab
  objectives=["ch04.vault"]
  id="vault"
  title="Managing secrets"
  exercise="data-secret"
  hosts=["workstation","servera.lab.example.com"]
  outcomes=["Run a playbook that uses variables defined in an encrypted file."] %}
{% lab-notes %}

**Prerequisites:** Complete [control-node setup](#/ch01/control-node) and the preceding lessons in this chapter. Run commands as student on workstation unless a step names another machine.

{% reveal title="Verify your work" %}

From the project directory, run the relevant home-lab check. For an exercise with several checkpoints, grade each state before changing or removing it:

```bash
lab grade data-secret
```

The grader reads project files and host state. A passing report covers the listed checks; also perform the task’s independent connection, repeat-run, and reboot checks where requested.

{% /reveal %}

{% reveal title="Try an independent variation" %}

Create a second encrypted variable file for a different disposable account, without duplicating the provisioning tasks.

Record the published result first. The grader checks the original requirements, so a changed name or value may intentionally fail those checks.

{% /reveal %}

{% /lab-notes %}

{% lab-challenge %}

Provision the account described by `secret.yml` on `devservers`, using `create_users.yml`.

- The saved variable file must remain encrypted. Its supplied practice password is `redhat`; its username is `ansibleuser1`.
- Create the account using the stored password hash, connecting as devops with escalation.
- Demonstrate a prompted Vault operation and an operation using a `vault-pass` file readable only by its owner.
- Prove that the new account can log in with its practice password. Keep the decryption password separate from the encrypted variables.

{% /lab-challenge %}

  {% task id="task-d7abb6426853" legacyIndex=1 title="Move into the project directory" %}

```console
[student@workstation ~]$ cd ~/data-secret
[student@workstation data-secret]$
```
  {% /task %}

  {% lab-setup variant="homelab" %}
    `lab start` creates `secret.yml` on your workstation and encrypts it with the Vault password `redhat`, so the ciphertext differs from anyone else's. The home-lab navigator settings already disable playbook artifacts, so the `--playbook-artifact-enable false` options below are harmless but not needed.
  {% /lab-setup %}

  {% task id="task-ecd51d2dbdcd" legacyIndex=2 title="Edit the encrypted file" %}
    Open `secret.yml` with `ansible-vault edit` and enter `redhat` when asked. In the editor, remove the `#` in front of the `username` and `pwhash` lines, then save and quit.

```console
[student@workstation data-secret]$ ansible-vault edit secret.yml
Vault password: redhat
```

    After saving, run `cat secret.yml`: the file on disk is still ciphertext.
  {% /task %}

  {% task id="task-a28f416e9007" legacyIndex=3 title="Write the playbook" %}
    Create `create_users.yml` with one play, `create user accounts for all our servers`, that:
    - targets the `devservers` group, as the remote user `devops`, with privilege escalation;
    - loads `secret.yml` with `vars_files`;
    - creates the user named by `username` (its value is `ansibleuser1`), with the password hash in `pwhash`.

    {% reveal title="Show solution" %}

```yaml {% title="create_users.yml" %}
---
- name: create user accounts for all our servers
  hosts: devservers
  become: true
  remote_user: devops
  vars_files:
    - secret.yml
  tasks:
    - name: Creating user from secret.yml
      ansible.builtin.user:
        name: "{{ username }}"
        password: "{{ pwhash }}"
```
    {% /reveal %}

    {% callout type="note" %}
    The `password` option of `ansible.builtin.user` expects a **hash**, not a plain password. That is why the secret file stores `pwhash`.
    {% /callout %}
  {% /task %}

  {% task id="task-62563bba0dcc" legacyIndex=4 title="Check the syntax with a password prompt" %}
    The playbook reads an encrypted file, so even a syntax check needs the Vault password. Use `--vault-id @prompt`, and disable playbook artifacts so navigator can prompt you.

```console
[student@workstation data-secret]$ ansible-navigator run -m stdout \
> --playbook-artifact-enable false create_users.yml \
> --syntax-check --vault-id @prompt
Vault password (default): redhat

playbook: /home/student/data-secret/create_users.yml
```
  {% /task %}

  {% task id="task-a643127a7426" legacyIndex=5 title="Create a password file" %}
    Store the Vault password in `vault-pass` and make it readable only by you:

```console
[student@workstation data-secret]$ echo 'redhat' > vault-pass
[student@workstation data-secret]$ chmod 0600 vault-pass
```
  {% /task %}

  {% task id="task-0dcad73c2000" legacyIndex=6 title="Run the playbook with the password file" %}
    No prompt this time, so playbook artifacts can stay enabled.

```console
[student@workstation data-secret]$ ansible-navigator run \
> -m stdout create_users.yml --vault-password-file=vault-pass

PLAY [create user accounts for all our servers] ********************************

TASK [Gathering Facts] *********************************************************
ok: [servera.lab.example.com]

TASK [Creating user from secret.yml] *******************************************
changed: [servera.lab.example.com]

PLAY RECAP *********************************************************************
servera.lab.example.com    : ok=2    changed=1    unreachable=0    failed=0  ...
```
  {% /task %}

  {% task id="task-c9f0a8d7abde" legacyIndex=7 title="Log in as the new user" %}
    Force SSH to use a password rather than a key, and log in as `ansibleuser1` with the password `redhat`:

```console
[student@workstation data-secret]$ ssh -o PreferredAuthentications=password \
> ansibleuser1@servera.lab.example.com
ansibleuser1@servera.lab.example.com's password: redhat
...output omitted...
[ansibleuser1@servera ~]$ exit
```
  {% /task %}

  {% task id="task-359bfff83017" legacyIndex=8 title="Finish" %}
    {% lab-finish exercise="data-secret" /%}
  {% /task %}
{% /lab %}

{% callout type="warning" title="Never commit the password file" %}
In a real repository, add `vault-pass` to `.gitignore`. An encrypted secrets file next to its own plain-text password protects nothing.
{% /callout %}

{% callout type="exam" title="Generating a password hash" %}
If a task asks you to set a user's password, remember that `ansible.builtin.user` needs a hash. A common approach is the `password_hash` filter: `password: "{{ 'redhat' | password_hash('sha512') }}"`. Filters come up again in later chapters.
{% /callout %}
