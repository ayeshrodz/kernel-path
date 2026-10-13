---
title: "dnf and rpm cheat sheet"
seoTitle: "dnf and rpm Cheat Sheet (RHCSA)"
description: "dnf and rpm cheat sheet: the key commands and ideas on one page, with flashcards for revision. Free RHCSA study notes."
kind: summary
minutes: 5
---

{% lead %}
The chapter on one page: what to remember, the commands to have at your fingertips, and flashcards for quick revision.
{% /lead %}

## The chapter in eight sentences

- A package is named **name-version-release.architecture**, carries files, metadata, dependencies and a signature, and is recorded in the RPM database.
- `rpm -q` answers questions about what is installed: `-i` info, `-l` files, `-c` config files, `-d` docs, `-f FILE` owner, `-a` everything.
- `rpm -V` compares files with the package: flags such as `S`, `5` and `T` reveal a modified file; `rpm -K` checks the signature of a `.rpm` file.
- `dnf` resolves dependencies from repositories: `search`, `info`, `provides`, `install`, `remove`, `reinstall`, `upgrade`; read the transaction summary before confirming.
- `dnf history` records every transaction; `dnf history undo` reverses one.
- Repositories are defined in `/etc/yum.repos.d/*.repo` (`baseurl`, `enabled`, `gpgcheck`, `gpgkey`); keep `gpgcheck=1`.
- A local repository is `dnf download --resolve`, `createrepo_c DIR`, and a `.repo` file; `--disablerepo='*' --enablerepo=ID` proves where a package comes from.
- AppStream **module streams** offer several versions of a program: `dnf module enable NAME:STREAM`, and `dnf module reset NAME` before switching; apply updates with `dnf upgrade` (`--security`) and check `dnf needs-restarting -r`.

## Cheat sheet

{% tabs %}
  {% tab label="rpm" %}

| Command | Does |
| --- | --- |
| `rpm -q NAME` / `-qi` / `-ql` / `-qc` / `-qd` | Installed? Info, files, config, docs |
| `rpm -qf /path` | Which package owns a file |
| `rpm -qa [--last]` | All packages (newest first) |
| `rpm -V NAME` | Verify files against the package |
| `rpm -K FILE.rpm`, `rpm -qpl FILE.rpm` | Check signature; list contents |
| `rpm --import KEYFILE` | Trust a vendor key |

  {% /tab %}
  {% tab label="dnf" %}

| Command | Does |
| --- | --- |
| `dnf search`, `info`, `provides "*/file"` | Find software |
| `dnf install`, `remove`, `reinstall NAME` | Change packages |
| `dnf upgrade [--security]`, `dnf check-update` | Updates |
| `dnf history`, `history info ID`, `history undo ID` | Review and reverse |
| `dnf group list`, `group install "NAME"` | Package groups |
| `dnf needs-restarting -r` | Is a reboot advisable? |
| `dnf clean all`, `dnf makecache` | Refresh the cache |

  {% /tab %}
  {% tab label="Repositories and modules" %}

| Command / file | Does |
| --- | --- |
| `dnf repolist [--all]` | Repositories |
| `/etc/yum.repos.d/NAME.repo` | `[id]`, `name`, `baseurl`, `enabled`, `gpgcheck`, `gpgkey` |
| `dnf download --resolve --destdir D NAME` | Fetch packages and dependencies |
| `createrepo_c D` | Build the catalogue |
| `dnf --disablerepo='*' --enablerepo=ID ...` | Use one repository |
| `dnf module list|enable|reset NAME[:STREAM]` | Streams |
| `/etc/dnf/modules.d/NAME.module` | The enabled stream |

  {% /tab %}
{% /tabs %}

## Flashcards

{% flashcards ref="flashcards" /%}
