---
title: "SSH cheat sheet"
seoTitle: "SSH Cheat Sheet (RHCSA)"
description: "SSH cheat sheet: the key commands and ideas on one page, with flashcards for revision. Free RHCSA study notes."
kind: summary
minutes: 5
---

{% lead %}
The chapter on one page: what to remember, the commands to have at your fingertips, and flashcards for quick revision.
{% /lead %}

## The chapter in eight sentences

- `ssh user@host [command]` runs a shell or one command on another machine over an encrypted connection.
- The server proves who it is with a **host key**; `~/.ssh/known_hosts` remembers it, and a changed key stops the connection until you know why.
- A **key pair** replaces passwords: the private key stays on your machine (mode 600), the public key goes into `~/.ssh/authorized_keys` on the server (`ssh-copy-id`).
- sshd ignores keys when `~/.ssh` is not 700 or `authorized_keys` is not 600 and owned by the user; the server's log says so.
- `ssh-agent` and `ssh-add` hold an unlocked key so a passphrase is typed once.
- `scp` copies once, `sftp` browses, `rsync -av` copies only changes (mind the trailing slash, and use `-n` before `--delete`).
- `~/.ssh/config` gives a host a short alias with its user and key.
- Harden sshd in `/etc/ssh/sshd_config.d/10-NAME.conf` (first value wins), check with `sshd -t` and `sshd -T`, reload, and test a new login with a spare session open.

## Cheat sheet

{% tabs %}
  {% tab label="Client" %}

| Command | Does |
| --- | --- |
| `ssh user@host [cmd]` | Log in / run a command |
| `ssh -i KEY user@host` | Use a given private key |
| `ssh-keygen -lF HOST` | Fingerprint stored in known_hosts |
| `ssh-keygen -lf FILE.pub` | Fingerprint of a key file |
| `ssh-keygen -R HOST` | Forget a host key |
| `-o StrictHostKeyChecking=accept-new` | Accept new hosts, refuse changed ones |

  {% /tab %}
  {% tab label="Keys" %}

| Command | Does |
| --- | --- |
| `ssh-keygen -t ed25519 -f ~/.ssh/NAME -C TEXT` | New key pair |
| `ssh-keygen -p -f KEY` | Change the passphrase |
| `ssh-copy-id -i KEY.pub user@host` | Install the public key |
| `eval $(ssh-agent -s)`, `ssh-add KEY`, `ssh-add -l` | Agent |
| `~/.ssh` 700 · `authorized_keys` 600 | Required permissions |
| `journalctl -u sshd` | Why a login failed |

  {% /tab %}
  {% tab label="Transfer and server" %}

| Command | Does |
| --- | --- |
| `scp F host:` · `scp -r D host:/path/` · `scp host:F .` | Copy once |
| `sftp host` | Interactive transfer |
| `rsync -av D/ host:D/` | Synchronise |
| `rsync -avn --delete D/ host:D/` | Dry run of a mirror |
| `/etc/ssh/sshd_config.d/10-NAME.conf` | Your sshd settings |
| `sshd -t` · `sshd -T \| grep opt` | Check syntax · effective values |
| `systemctl reload sshd` | Apply without dropping sessions |

  {% /tab %}
{% /tabs %}

## Flashcards

{% flashcards ref="flashcards" /%}
