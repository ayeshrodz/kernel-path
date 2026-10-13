---
title: Managing automation projects with Git
seoTitle: "Git for Ansible Projects: Branches, Commits, Remotes"
description: "Keep Ansible automation in Git: commits, branches, merges and pushing to a remote. Free RHCE (EX294) lesson with diagrams and practice."
kind: lesson
minutes: 14
---

{% lead %}
A playbook is code, so treat it like code. Git keeps every version of your project, shows exactly what changed and who changed it, and lets a team work on one project without overwriting each other's work.
{% /lead %}

{% objectives %}
- Clone a project from a shared remote and read its history.
- Review, stage and commit a change.
- Push your commits and pull your teammates' commits.
- Keep secrets and generated files out of the repository.
{% /objectives %}

## Why automation belongs in Git

In chapter 2 you met **infrastructure as code**: the playbook describes the state your systems should be in. Once that description lives in Git, you gain three things:

- **History.** Every change is recorded with an author, a date and a message. When something breaks, `git log` shows what changed last.
- **Review.** Before anything is saved, `git diff` shows the exact lines you are about to change. Nothing slips in by accident.
- **One shared copy.** The project lives in a **remote** repository. Anyone can clone it to their control node, and everyone runs the same playbooks.

## Four places your work lives

Git keeps your project in four places. Step through one change, from cloning the project to pulling a teammate's work back:

{% diagram ref="git-flow" /%}

| Place | What it holds | Commands that move work into it |
| --- | --- | --- |
| **Working tree** | The files you edit, in the project directory | `git clone`, `git pull`, your editor |
| **Staging area** | The draft of your next commit | `git add` |
| **Local repository** | Your commits, in the hidden `.git` directory | `git commit` |
| **Remote** | The shared copy everybody clones from | `git push` |

## Tell Git who you are

Every commit records an author. Set your name and email once per user account; `--global` applies them to every repository you work in. The third setting tells `git pull` to **merge** a teammate's work with yours, which is the easiest way to start. Without it, a pull that has to combine two histories stops and asks you to choose a strategy.

```bash
git config --global user.name 'Student'
git config --global user.email 'student@workstation.lab.example.com'
git config --global pull.rebase false
git config --global --list
```

## Clone a project

`git clone` copies a remote repository, with its full history, into a directory. Its argument is the remote's address. In this lab the remotes are directories on workstation; in a company it is usually an HTTPS or SSH URL from a Git server. The commands that follow are the same either way.

```console
[student@workstation ~]$ git clone ~/git-repos/ops/web-motd.git web-motd
Cloning into 'web-motd'...
done.
[student@workstation ~]$ cd web-motd
[student@workstation web-motd]$ git log --oneline
fe7941c Warn that the MOTD is managed
8d7ff6c Add the MOTD project
[student@workstation web-motd]$ git remote -v
origin	/home/student/git-repos/ops/web-motd.git (fetch)
origin	/home/student/git-repos/ops/web-motd.git (push)
```

Git names the remote you cloned from **origin**. `git push` and `git pull` use it when you do not name another one.

## The everyday cycle

Every change follows the same five steps: **edit, check, stage, commit, push**.

```console
[student@workstation web-motd]$ echo 'Contact: ops@lab.example.com' >> templates/motd.j2
[student@workstation web-motd]$ git status --short
 M templates/motd.j2
[student@workstation web-motd]$ git diff
--- a/templates/motd.j2
+++ b/templates/motd.j2
@@ -1,2 +1,3 @@
 Welcome to {{ inventory_hostname }}.
 This host is managed by Ansible: local changes to this file are overwritten.
+Contact: ops@lab.example.com
[student@workstation web-motd]$ git add templates/motd.j2
[student@workstation web-motd]$ git diff --cached --stat
 templates/motd.j2 | 1 +
 1 file changed, 1 insertion(+)
[student@workstation web-motd]$ git commit -m 'Add a contact line to the MOTD'
[main df86f6e] Add a contact line to the MOTD
 1 file changed, 1 insertion(+)
[student@workstation web-motd]$ git push
To /home/student/git-repos/ops/web-motd.git
   fe7941c..df86f6e  main -> main
```

- **`git status`** lists what changed. `M` means modified and `??` means a file Git does not track yet.
- **`git diff`** shows unstaged changes; **`git diff --cached`** shows what the next commit will contain.
- **`git add`** stages a file. `git add -A` stages every change, so check `git status` before you use it.
- **`git commit -m`** saves the staged draft. Write the message as what the change does: *Add a contact line to the MOTD*.
- **`git push`** sends your commits to origin.

{% callout type="tip" title="Test before you commit" %}
Run the playbook, and check the result on a managed host, before you commit. A commit says "this version works"; make sure it does.
{% /callout %}

## Bring in your teammates' work

A teammate may push while you work. `git pull` downloads their commits and updates your working tree. Pull before you start a change, and pull again if Git rejects your push:

```console
[student@workstation web-motd]$ git push
To /home/student/git-repos/ops/web-motd.git
 ! [rejected]        main -> main (fetch first)
error: failed to push some refs to '/home/student/git-repos/ops/web-motd.git'
hint: Updates were rejected because the remote contains work that you do not
hint: have locally. This is usually caused by another repository pushing to
hint: the same ref. If you want to integrate the remote changes, use
hint: 'git pull' before pushing again.
...output omitted...
[student@workstation web-motd]$ git pull --no-edit
Merge made by the 'ort' strategy.
 README.md | 1 +
 1 file changed, 1 insertion(+)
[student@workstation web-motd]$ git push
```

Git refuses the push so that it never silently discards your teammate's commit. The pull **merges** their commit with yours in a new merge commit; `--no-edit` keeps Git's default message for it instead of opening an editor. Now your history contains both changes and the push succeeds. If you both changed the same lines, Git stops and asks you to choose. Edit the file, then `git add` and `git commit` to finish.

## Keep secrets and generated files out

Some files must never be committed. Others are created by tools and are not worth keeping:

- **Secrets:** vault password files, private SSH keys, API tokens. Files encrypted with `ansible-vault` are safe to commit; the password that opens them is not.
- **Generated files:** `ansible-navigator` writes `ansible-navigator.log` into the project directory on every run, and saves `*-artifact-*.json` files when playbook artifacts are enabled.

List them in a `.gitignore` file at the top of the project and commit that file. Git then leaves them out of `git status` and `git add -A`:

```text {% title=".gitignore" %}
vault-pass
ansible-navigator.log
*-artifact-*.json
```

```console
[student@workstation web-motd]$ git check-ignore -v vault-pass
.gitignore:1:vault-pass	vault-pass
```

{% callout type="warning" title="A committed secret stays in the history" %}
Deleting a password file in a later commit does not remove it: every earlier commit still contains it, and so does every clone. If a secret was ever pushed, change the secret.
{% /callout %}

## Undo a change you have not committed

| You want to | Command |
| --- | --- |
| Throw away your edits to a file | `git restore templates/motd.j2` |
| Unstage a file but keep your edits | `git restore --staged templates/motd.j2` |
| See what one commit changed | `git show df86f6e` |

{% quiz
  objectives=["ch12.git"]
  id="git-check"
  ref="git-check" /%}
