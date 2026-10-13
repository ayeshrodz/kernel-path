---
title: Deploying roles from external content sources
seoTitle: "Install Ansible Roles From Galaxy With requirements.yml"
description: "Install roles from Ansible Galaxy and Git with a requirements file and ansible-galaxy. Free RHCE (EX294) lesson with diagrams and practice."
kind: lesson
minutes: 12
---

{% lead %}
Most of the automation you need has been written before, by your own organisation or by the community. Roles are shared through Git repositories, archives on a web server, and the Ansible Galaxy site, and `ansible-galaxy` installs them from any of those with one command. Knowing how to find, install and read a role is as useful as knowing how to write one.
{% /lead %}

{% objectives %}
- Find roles on Ansible Galaxy, from the web site or the command line.
- Install roles with `ansible-galaxy role install`, from a Git repository, an archive or Galaxy.
- Record a project's roles in a requirements file so the set is repeatable.
- List and remove installed roles.
{% /objectives %}

## Where roles come from

| Source | Typical use |
| --- | --- |
| A **Git repository** of your organisation | Roles your teams write and maintain, each in its own repository |
| An **archive** (`.tar.gz`) on a web server or a file share | Releases published by a team or a vendor |
| **Ansible Galaxy** (galaxy.ansible.com) | Thousands of community roles, of varying quality and without vendor support |

More and more roles are now shipped inside **collections** instead, together with modules and plug-ins; the next sections cover those. This section is about roles distributed on their own.

{% callout type="warning" title="Community content is unreviewed" %}
A role from Galaxy has not been checked by anyone but its author. It runs as root on your hosts. Read its tasks and defaults before you use it, and pin the version you reviewed.
{% /callout %}

## Finding roles on Ansible Galaxy

On galaxy.ansible.com, search by keyword and filter by platform, tags and author; each role shows its download count, its source repository and a quality score. The same search works from the command line:

```console
[student@workstation ~]$ ansible-galaxy search 'redis' --platforms EL
Found 251 roles matching your search:
 Name                             Description
 ----                             -----------
 geerlingguy.redis                Redis for Linux
...output omitted...
[student@workstation ~]$ ansible-galaxy info geerlingguy.redis
Role: geerlingguy.redis
        description: Redis for Linux
        ...output omitted...
        github_repo: ansible-role-redis
        ...output omitted...
```

`--author`, `--platforms` and `--galaxy-tags` narrow a search; `info` shows a role's details, including the minimum Ansible version and where its source lives.

{% variant name="homelab" %}
The home lab's servers are isolated, but workstation reaches the internet, so `search` and `info` work there. The exercises in this chapter use Git repositories and archives created on workstation instead, so they do not depend on a third-party site.
{% /variant %}

## Installing roles with ansible-galaxy

`ansible-galaxy role install` fetches a role and unpacks it into a roles directory. The source can be the public Ansible Galaxy site, a Git repository, or an archive:

```console
[student@workstation project]$ ansible-galaxy role install -p roles \
> https://git.example.com/ops/ansible-role-banner.git,v1.2,acme.banner
```

`-p roles` installs into the project's own `roles/` directory. Without it, the role goes to the first directory of `roles_path`, by default `~/.ansible/roles`, outside the project. `ansible-navigator` running in an execution environment cannot see that directory, and a colleague who clones the project will not have it.

Set it once in the project's `ansible.cfg`, and both `install` and `list` use it without `-p`:

```ini {% title="ansible.cfg" %}
[defaults]
roles_path = roles
```

## A requirements file

Typing sources on the command line does not scale and is not repeatable. List the roles a project needs in **`roles/requirements.yml`** instead:

```yaml {% title="roles/requirements.yml" %}
---
# from a Git repository over HTTPS, at a tag
- src: https://git.example.com/ops/ansible-role-banner.git
  scm: git
  version: v1.2
  name: acme.banner

# from a Git repository over SSH, on a branch
- src: git@git.example.com:ops/bash_env
  scm: git
  version: main
  name: ops.bash_env

# from an archive, by URL or file path
- src: file:///home/student/project/archives/acme.motd-1.0.tar.gz
  name: acme.motd

# from Ansible Galaxy, by author.role name
- src: some_author.ntp
  version: "1.4.0"
```

| Key | Meaning |
| --- | --- |
| `src` | Where the role comes from: a Galaxy name, a Git URL, or an archive URL or path |
| `scm` | `git` when `src` is a Git repository |
| `version` | A tag, branch or commit for Git; a release for Galaxy. Without it you get the latest commit of the default branch, so pin it for anything that matters |
| `name` | The name the role is installed under, and used by in plays |

Install everything in the file with `-r`:

```console
[student@workstation project]$ ansible-galaxy role install -r roles/requirements.yml -p roles
Starting galaxy role install process
- downloading role from file:///home/student/project/archives/acme.motd-1.0.tar.gz
- extracting acme.motd to /home/student/project/roles/acme.motd
- acme.motd was installed successfully
```

Commit `requirements.yml`, not the downloaded roles. Anyone who clones the project runs the same command and gets the same versions. Automation controller goes one step further and installs `roles/requirements.yml` automatically before each run.

## Listing and removing roles

```console
[student@workstation project]$ ansible-galaxy role list -p roles
# /home/student/project/roles
- acme.motd, (unknown version)
[student@workstation project]$ ansible-galaxy role remove -p roles acme.motd
- successfully removed acme.motd
```

`list` shows the roles in each directory it searches. A role installed from Git shows the branch or tag it came from; one installed from an archive has no version recorded, hence `(unknown version)`. Without `-p roles` (or `roles_path`), `list` does not look in the project at all, and a role you just installed seems to be missing.

{% callout type="exam" title="The pattern to know" %}
Write `roles/requirements.yml`, install with `ansible-galaxy role install -r roles/requirements.yml -p roles`, confirm with `ansible-galaxy role list -p roles`, then name the role in a play. Practise it with an archive source, which needs no internet access.
{% /callout %}

{% quiz
  objectives=["ch08.role-install"]
  id="check"
  title="Check your understanding"
  ref="check" /%}

## Takeaway

Find roles on Ansible Galaxy, from the web site or the command line. Use the chapter lab to check this on a real host.
