---
title: "Exercise: Managing a project with Git"
seoTitle: "Managing a project with Git (RHCE Practice Exercise)"
description: "Hands-on RHCE practice: managing a project with Git. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 25
---

{% lead %}
The operations team keeps its message-of-the-day project in a shared Git repository. You will clone it, change it, keep a password file out of it, and publish your work. Along the way a teammate pushes at the same time as you, and you combine both changes.
{% /lead %}

`lab start workflow-git` publishes the project as a shared remote at `~/git-repos/ops/web-motd.git`, with two commits of history, and gives you an empty `~/workflow-git` directory to clone it into.

{% lab
  objectives=["ch12.git"]
  id="git"
  title="Managing a project with Git"
  exercise="workflow-git"
  ownExercise=true
  hosts=["workstation","servera.lab.example.com","serverb.lab.example.com"]
  outcomes=["Clone a project and read its history.","Review, commit and push a tested change.","Keep a password file and tool output out of the repository.","Combine a teammate's commit with yours after a rejected push."] %}
{% lab-notes %}

**Prerequisites:** Complete [control-node setup](#/ch01/control-node) and the [Git lesson](#/ch12/git-for-automation). Run commands as student on workstation.

{% reveal title="Verify your work" %}

From `~/workflow-git`, run:

```bash
lab grade workflow-git
```

The grader checks the clone, the history, that everything is committed and pushed, the ignore rule, and `/etc/motd` on both web servers. It never changes your project or the hosts.

{% /reveal %}

{% reveal title="Try an independent variation" %}

Change the contact address in a new commit, push it, then use `git log -p -1` to show exactly what your last commit changed. Use `git show HEAD~1:templates/motd.j2` to print the previous version of the template without changing your files.

The grader checks the original contact line, so a changed address intentionally fails that check.

{% /reveal %}

{% /lab-notes %}

{% lab-challenge %}

Work in a clone of the shared `web-motd` project, in `~/workflow-git`.

- Add the line `Contact: ops@lab.example.com` to the MOTD template, apply it to both web servers, and commit and push the change.
- Create a vault password file named `vault-pass` (mode `0600`) in the project. Make sure Git never offers to commit it, nor the `ansible-navigator.log` file that navigator writes on every run.
- A teammate adds the line `Check: run the playbook twice; the second run reports changed=0.` to `README.md` and pushes it while you are working. Combine their commit with yours and push the result.
- Finish with a clean working tree that matches the remote.

{% /lab-challenge %}

  {% task id="task-3f2c9a1d7b40" title="Tell Git who you are" %}

Set your identity and how `git pull` combines histories. These settings are stored in `~/.gitconfig` and apply to every repository you use as student:

```console
[student@workstation ~]$ git config --global user.name 'Student'
[student@workstation ~]$ git config --global user.email 'student@workstation.lab.example.com'
[student@workstation ~]$ git config --global pull.rebase false
[student@workstation ~]$ git config --global --list
user.name=Student
user.email=student@workstation.lab.example.com
pull.rebase=false
```

  {% /task %}
  {% task id="task-8d41e6b2c9a5" title="Clone the project" %}

Start the exercise, then clone the remote into the empty project directory. The `.` at the end means "clone into the current directory":

```console
[student@workstation ~]$ lab start workflow-git
[student@workstation ~]$ cd ~/workflow-git
[student@workstation workflow-git]$ git clone ~/git-repos/ops/web-motd.git .
Cloning into '.'...
done.
[student@workstation workflow-git]$ ls
ansible.cfg  inventory  motd.yml  README.md  templates
[student@workstation workflow-git]$ git log --oneline
de3139f Warn that the MOTD is managed
71096de Add the MOTD project
[student@workstation workflow-git]$ git status
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
```

Your commit IDs differ: they include the time each commit was made. Read `motd.yml` and `templates/motd.j2`. The play deploys the template to `/etc/motd` on servera and serverb.

  {% /task %}
  {% task id="task-c75b0e3a91f4" title="Run the project as it is" %}

Before you change anything, check that the project works:

```console
[student@workstation workflow-git]$ ansible-navigator run motd.yml -m stdout
...output omitted...
servera.lab.example.com    : ok=2    changed=1    unreachable=0    failed=0  ...
serverb.lab.example.com    : ok=2    changed=1    unreachable=0    failed=0  ...
[student@workstation workflow-git]$ git status --short
?? ansible-navigator.log
```

Navigator wrote a log file into the project. Git lists it with `??`: a file it does not track. You will deal with it in a later step; do not commit it.

  {% /task %}
  {% task id="task-5a9e27d4c1b8" title="Make, test and commit a change" %}

Add the contact line to the template, review the change, apply it, and check one host:

```console
[student@workstation workflow-git]$ echo 'Contact: ops@lab.example.com' >> templates/motd.j2
[student@workstation workflow-git]$ git diff
diff --git a/templates/motd.j2 b/templates/motd.j2
index dd8ce2e..d3a141a 100644
--- a/templates/motd.j2
+++ b/templates/motd.j2
@@ -1,2 +1,3 @@
 Welcome to {{ inventory_hostname }}.
 This host is managed by Ansible: local changes to this file are overwritten.
+Contact: ops@lab.example.com
[student@workstation workflow-git]$ ansible-navigator run motd.yml -m stdout
...output omitted...
[student@workstation workflow-git]$ ssh devops@servera.lab.example.com cat /etc/motd
Welcome to servera.lab.example.com.
This host is managed by Ansible: local changes to this file are overwritten.
Contact: ops@lab.example.com
```

It works, so commit it. Stage only the template, check what you staged, then commit and push:

```console
[student@workstation workflow-git]$ git add templates/motd.j2
[student@workstation workflow-git]$ git diff --cached --stat
 templates/motd.j2 | 1 +
 1 file changed, 1 insertion(+)
[student@workstation workflow-git]$ git commit -m 'Add a contact line to the MOTD'
[main 48b3081] Add a contact line to the MOTD
 1 file changed, 1 insertion(+)
[student@workstation workflow-git]$ git push
To /home/student/git-repos/ops/web-motd.git
   de3139f..48b3081  main -> main
```

  {% /task %}
  {% task id="task-e0b6f3a8d217" title="A teammate pushes a change" %}

Play the teammate yourself, in a second clone of the same remote. They document the repeat-run check in the README and push it:

```console
[student@workstation workflow-git]$ git clone ~/git-repos/ops/web-motd.git ~/web-motd-teammate
[student@workstation workflow-git]$ cd ~/web-motd-teammate
[student@workstation web-motd-teammate]$ echo 'Check: run the playbook twice; the second run reports changed=0.' >> README.md
[student@workstation web-motd-teammate]$ git commit -am 'Document the repeat-run check'
[student@workstation web-motd-teammate]$ git push
[student@workstation web-motd-teammate]$ cd ~/workflow-git
```

`git commit -a` stages every modified tracked file before committing. It never adds untracked files.

  {% /task %}
  {% task id="task-71d4a0c6e9b3" title="Keep the password file and the log out of Git" %}

Your project will use Ansible Vault later, so create its password file now. Git offers it for committing straight away, together with navigator's log:

```console
[student@workstation workflow-git]$ echo 'redhat' > vault-pass
[student@workstation workflow-git]$ chmod 600 vault-pass
[student@workstation workflow-git]$ git status --short
?? ansible-navigator.log
?? vault-pass
```

Create `.gitignore` with both names, one per line:

```text {% title=".gitignore" %}
vault-pass
ansible-navigator.log
```

Now Git only offers the `.gitignore` file itself. Commit it:

```console
[student@workstation workflow-git]$ git status --short
?? .gitignore
[student@workstation workflow-git]$ git check-ignore -v vault-pass
.gitignore:1:vault-pass	vault-pass
[student@workstation workflow-git]$ git add .gitignore
[student@workstation workflow-git]$ git commit -m 'Keep the vault password and navigator log out of Git'
```

  {% /task %}
  {% task id="task-b2f8c5e04a69" title="Combine your work with your teammate's" %}

Push your new commit. The remote has your teammate's commit, which you do not have, so Git refuses:

```console
[student@workstation workflow-git]$ git push
To /home/student/git-repos/ops/web-motd.git
 ! [rejected]        main -> main (fetch first)
error: failed to push some refs to '/home/student/git-repos/ops/web-motd.git'
...output omitted...
```

Pull their commit. Git merges it with yours in a new **merge commit**; `--no-edit` accepts the default message instead of opening an editor. Then push again:

```console
[student@workstation workflow-git]$ git pull --no-edit
From /home/student/git-repos/ops/web-motd
   48b3081..43eabe1  main       -> origin/main
Merge made by the 'ort' strategy.
 README.md | 1 +
 1 file changed, 1 insertion(+)
[student@workstation workflow-git]$ git push
[student@workstation workflow-git]$ git log --oneline --graph
*   eb79d6a Merge branch 'main' of /home/student/git-repos/ops/web-motd
|\
| * 43eabe1 Document the repeat-run check
* | 7590b93 Keep the vault password and navigator log out of Git
|/
* 48b3081 Add a contact line to the MOTD
* de3139f Warn that the MOTD is managed
* 71096de Add the MOTD project
```

The graph shows the two lines of work, yours and your teammate's, joining in the merge commit. Remove the teammate's clone; its work is safe on the remote:

```console
[student@workstation workflow-git]$ rm -rf ~/web-motd-teammate
```

  {% /task %}
  {% task id="task-4c0a9d7e5f12" title="Check and grade" %}

Your working tree should be clean and match the remote, with `vault-pass` and the log still on disk but ignored:

```console
[student@workstation workflow-git]$ git status
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
[student@workstation workflow-git]$ ls
ansible.cfg  ansible-navigator.log  inventory  motd.yml  README.md  templates  vault-pass
[student@workstation workflow-git]$ lab grade workflow-git
```

Every check should pass. When you are done, run `lab finish workflow-git`.

  {% /task %}
{% /lab %}
