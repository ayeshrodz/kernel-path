---
title: "Exercise: Text and environment review"
seoTitle: "grep, vim and Bash Practice Lab (RHCSA Exam Style)"
description: "Graded RHCSA exam-style lab on grep, vim and Bash: a challenge with requirements, hints and solutions, and a grader that checks your work on your own lab."
kind: lab
minutes: 30
---

{% lead %}
Produce four small reports on servera with redirection, pipes and grep, write a notice with vim, and set up your shell so that three settings survive every new login. `lab grade` checks each result.
{% /lead %}

{% lab
  objectives=["ch05.redirect","ch05.grep","ch05.vim","ch05.environment"]
  id="review"
  title="Text and environment review"
  exercise="sa-text-review"
  ownExercise=true
  hosts=["workstation","servera"]
  outcomes=["Separate output from errors into files.","Select exactly the right lines with grep.","Edit files with vim and make shell settings permanent."] %}
{% lab-notes %}

**Before you start:** reset the servers and complete this chapter's lessons. You work on **servera** as `student`; `lab start` and `lab grade` run on workstation.

{% /lab-notes %}

{% lab-challenge %}

On servera, as student, create `~/reports`, then:

1. `bash-users.txt`: every line of `/etc/passwd` for an account whose login shell is `/bin/bash`, and no other line.
2. `repos.txt`: the `.repo` files under `/etc`, found with `find`, with no error messages in the file.
3. `find-errors.txt`: the error messages from that same `find` command.
4. `chrony-active.txt`: the lines of `/etc/chrony.conf` that are neither comments nor empty.
5. `~/notice.txt`, written with vim, containing exactly: `Welcome to servera.lab.example.com.` and `Contact: oncall@lab.example.com`.
6. In `~/.bashrc`: an alias `now` that runs `date +%T`, and `HISTTIMEFORMAT` exported as `"%F %T "`.
7. In `~/.bash_profile`: `EDITOR` exported as `vim`.

{% /lab-challenge %}

  {% task id="task-526d1f45b497" title="Start the exercise" %}

```console
[student@workstation ~]$ lab start sa-text-review
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ mkdir ~/reports
```
  {% /task %}

  {% task id="task-9fb3a557e687" title="Report the Bash users" %}

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ grep '/bin/bash$' /etc/passwd > ~/reports/bash-users.txt
[student@servera ~]$ cat ~/reports/bash-users.txt
root:x:0:0:root:/root:/bin/bash
student:x:1000:1000:Student User:/home/student:/bin/bash
```

    Anchoring to the end of the line matters: a plain `bash` would also match an account whose home directory or comment happened to contain the word.
    {% /reveal %}
  {% /task %}

  {% task id="task-ca5eb4dccecc" title="Find the repository files, keeping errors apart" %}

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ find /etc -name "*.repo" > ~/reports/repos.txt 2> ~/reports/find-errors.txt
[student@servera ~]$ wc -l ~/reports/repos.txt ~/reports/find-errors.txt
  5 /home/student/reports/repos.txt
 13 /home/student/reports/find-errors.txt
 18 total
```
    {% /reveal %}
  {% /task %}

  {% task id="task-d549e188d977" title="Extract chrony's active settings" %}

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ grep -Ev '^(#|$)' /etc/chrony.conf > ~/reports/chrony-active.txt
[student@servera ~]$ cat ~/reports/chrony-active.txt
pool 2.rocky.pool.ntp.org iburst
sourcedir /run/chrony-dhcp
driftfile /var/lib/chrony/drift
makestep 1.0 3
rtcsync
keyfile /etc/chrony.keys
ntsdumpdir /var/lib/chrony
leapsectz right/UTC
logdir /var/log/chrony
```

    Two pipelined greps, `grep -v '^#' … | grep -v '^$'`, give the same result.
    {% /reveal %}
  {% /task %}

  {% task id="task-6bab6d4146c6" title="Write the notice with vim" %}

    {% reveal title="Show solution" %}
    `vim ~/notice.txt`, press `i`, type the two lines, press {% kbd %}Esc{% /kbd %} and `:wq`.

```console
[student@servera ~]$ cat ~/notice.txt
Welcome to servera.lab.example.com.
Contact: oncall@lab.example.com
```
    {% /reveal %}
  {% /task %}

  {% task id="task-d3e6291724f4" title="Make the shell settings permanent" %}

    {% reveal title="Show solution" %}
    Add two lines to the end of `~/.bashrc` (`vim ~/.bashrc`, `G`, `o`):

```bash
alias now='date +%T'
export HISTTIMEFORMAT="%F %T "
```

    and one to the end of `~/.bash_profile`:

```bash
export EDITOR=vim
```

    Check from a fresh login:

```console
[student@servera ~]$ exit
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ type now
now is aliased to `date +%T'
[student@servera ~]$ echo $EDITOR
vim
[student@servera ~]$ exit
```
    {% /reveal %}
  {% /task %}

  {% task id="task-28043cd64cf1" title="Grade and finish" %}
    {% lab-finish exercise="sa-text-review" grade=true servers=true /%}
  {% /task %}
{% /lab %}
