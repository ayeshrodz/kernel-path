---
title: "Exercise: Software review"
seoTitle: "dnf and rpm Practice Lab (RHCSA Exam Style)"
description: "Graded RHCSA exam-style lab on dnf and rpm: a challenge with requirements, hints and solutions, and a grader that checks your work on your own lab."
kind: lab
minutes: 30
---

{% lead %}
Set up software management on servera: your own repository with signature checking, a package installed from it, a version of nginx selected, and some routine installs and removals.
{% /lead %}

{% lab
  objectives=["ch13.rpm","ch13.dnf","ch13.repositories","ch13.updates"]
  id="review"
  title="Software review"
  exercise="sa-software-review"
  ownExercise=true
  hosts=["workstation","servera"]
  outcomes=["Create a local repository and install from it with gpgcheck on.","Enable a module stream.","Install, remove and query packages."] %}
{% lab-notes %}

**Before you start:** reset the servers and complete this chapter's lessons. You work on **servera** as root (`sudo -i`); `lab start` and `lab grade` run on workstation.

{% /lab-notes %}

{% lab-challenge %}

On servera:

1. Build a repository in `/srv/localrepo` from `zip` and its dependency (`dnf download --resolve`), with `createrepo_c`.
2. Define it in `/etc/yum.repos.d/local.repo` (id `localrepo`, `enabled=1`, `gpgcheck=1`, with the `gpgkey` your system uses elsewhere) and install `zip` using only that repository.
3. Install `wget`, remove `tree`, and enable the `nginx:1.24` module stream (without installing nginx).
4. On workstation, fill in `answers.txt`.

{% /lab-challenge %}

  {% task id="task-e911f72b2bb4" title="Start the exercise" %}

```console
[student@workstation ~]$ lab start sa-software-review
[student@workstation ~]$ cd ~/sa-software-review
[student@workstation sa-software-review]$ ssh student@servera
[student@servera ~]$ sudo -i
[root@servera ~]#
```
  {% /task %}

  {% task id="task-be0a61199778" title="The repository and the install" %}

    {% reveal title="Show solution" %}

```console
[root@servera ~]# dnf install -y dnf-plugins-core createrepo_c
[root@servera ~]# mkdir -p /srv/localrepo
[root@servera ~]# dnf download --resolve --destdir /srv/localrepo zip
[root@servera ~]# createrepo_c /srv/localrepo
[root@servera ~]# key=$(grep -h '^gpgkey' /etc/yum.repos.d/*.repo | sort -u | head -1)
[root@servera ~]# cat > /etc/yum.repos.d/local.repo <<EOT
[localrepo]
name=Local repository
baseurl=file:///srv/localrepo
enabled=1
gpgcheck=1
$key
EOT
[root@servera ~]# dnf clean all > /dev/null
[root@servera ~]# dnf --disablerepo='*' --enablerepo=localrepo install -y zip
...output omitted...
Complete!
```

    The `key=` line copies the `gpgkey=` line used by your distribution's repositories, so the same command works on any of them.
    {% /reveal %}
  {% /task %}

  {% task id="task-7b11bd83c244" title="Routine changes and the module" %}

    {% reveal title="Show solution" %}

```console
[root@servera ~]# dnf install -y wget
[root@servera ~]# dnf remove -y tree
[root@servera ~]# dnf module enable -y nginx:1.24
[root@servera ~]# cat /etc/dnf/modules.d/nginx.module
[nginx]
name=nginx
stream=1.24
profiles=
state=enabled
```
    {% /reveal %}
  {% /task %}

  {% task id="task-757ba1fcfcad" title="Facts for answers.txt" %}

    {% reveal title="Show solution" %}

```console
[root@servera ~]# rpm -qf /usr/bin/passwd
passwd-0.80-12.el9.x86_64
[root@servera ~]# ls -d /etc/yum.repos.d
/etc/yum.repos.d
[root@servera ~]# exit
[student@servera ~]$ exit
```

    PASSWD_PACKAGE is `passwd` (the name only), CHECKSUM_FLAG is `5` (see the verification diagram in the first lesson), and REPO_DIR is `/etc/yum.repos.d`.
    {% /reveal %}
  {% /task %}

  {% task id="task-49c5be688098" title="Grade" %}
    On workstation, with `answers.txt` filled in:

    {% lab-finish exercise="sa-software-review" grade=true servers=true /%}
  {% /task %}
{% /lab %}
