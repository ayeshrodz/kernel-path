---
title: "Exercise: Serve your own repository"
kind: lab
minutes: 30
---

{% lead %}
Build a small repository from downloaded packages, define it for dnf with signature checking left on, and install software from it alone.
{% /lead %}

{% lab
  objectives=["ch13.repositories"]
  id="local-repo"
  title="Serve your own repository"
  exercise="sa-local-repo"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera"]
  outcomes=["Download packages with their dependencies.","Create repository metadata with createrepo_c.","Define a repository, keep gpgcheck on, and install from it only."] %}

  {% task id="task-10d8a144bf5a" title="Start the exercise" %}
    On workstation, start the exercise. It installs `dnf-plugins-core` and `createrepo_c` on servera, and removes a repository left by an earlier run.

```console
[student@workstation ~]$ lab start sa-local-repo
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-feece255f9d1" title="Look at the existing repositories" %}
    On servera as root (`sudo -i`), list the enabled repositories and find the `gpgkey` line that the distribution's repositories use.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ sudo -i
[root@servera ~]# dnf repolist
repo id                         repo name
appstream                       Rocky Linux 9 - AppStream
baseos                          Rocky Linux 9 - BaseOS
extras                          Rocky Linux 9 - Extras
[root@servera ~]# grep -h '^gpgkey' /etc/yum.repos.d/*.repo | sort -u
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-Rocky-9
```

    On Red Hat Enterprise Linux the key path is different (`RPM-GPG-KEY-redhat-release`). Always copy what your own system shows.
    {% /reveal %}
  {% /task %}

  {% task id="task-10e2bfc26016" title="Download the packages" %}
    Create `/srv/localrepo` and download `zip` with its dependencies into it. Check one signature with `rpm -K`.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# mkdir -p /srv/localrepo
[root@servera ~]# dnf download --resolve --destdir /srv/localrepo zip
(1/2): zip-3.0-35.el9.x86_64.rpm                1.2 MB/s | 263 kB     00:00
(2/2): unzip-6.0-60.el9_8.x86_64.rpm            778 kB/s | 180 kB     00:00
[root@servera ~]# ls -l /srv/localrepo
-rw-r--r--. 1 root root 184214 Oct  3 17:26 unzip-6.0-60.el9_8.x86_64.rpm
-rw-r--r--. 1 root root 269065 Oct  3 17:26 zip-3.0-35.el9.x86_64.rpm
[root@servera ~]# rpm -K /srv/localrepo/zip-3.0-35.el9.x86_64.rpm
/srv/localrepo/zip-3.0-35.el9.x86_64.rpm: digests signatures OK
```
    {% /reveal %}
  {% /task %}

  {% task id="task-b1ac9715eb94" title="Create the metadata and define the repository" %}
    Build the metadata, then create `/etc/yum.repos.d/local.repo` for a repository `localrepo` at `file:///srv/localrepo`, enabled, with `gpgcheck=1` and the key you found. Clean dnf's cache and make sure the repository is listed.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# createrepo_c /srv/localrepo
Directory walk started
Directory walk done - 2 packages
...output omitted...
[root@servera ~]# ls /srv/localrepo/repodata | head -3
044c77de9e91d22279d49d9488bfb4e5bb43dabc0cb3fc16ac6f11d09150ce58-other.sqlite.bz2
...output omitted...
[root@servera ~]# cat > /etc/yum.repos.d/local.repo <<'EOT'
[localrepo]
name=Local repository
baseurl=file:///srv/localrepo
enabled=1
gpgcheck=1
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-Rocky-9
EOT
[root@servera ~]# dnf clean all > /dev/null
[root@servera ~]# dnf repolist
repo id                         repo name
appstream                       Rocky Linux 9 - AppStream
baseos                          Rocky Linux 9 - BaseOS
extras                          Rocky Linux 9 - Extras
localrepo                       Local repository
```
    {% /reveal %}
  {% /task %}

  {% task id="task-e19a70b9252b" title="Install from it, and only from it" %}
    List the packages available from `localrepo` alone, install `zip` using only that repository, and confirm where it came from.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# dnf --disablerepo='*' --enablerepo=localrepo list available
Available Packages
unzip.x86_64                       6.0-60.el9_8                        localrepo
zip.x86_64                         3.0-35.el9                          localrepo
[root@servera ~]# dnf --disablerepo='*' --enablerepo=localrepo install -y zip
...output omitted...
Installed:
  unzip-6.0-60.el9_8.x86_64                zip-3.0-35.el9.x86_64

Complete!
[root@servera ~]# dnf info zip | grep 'From repo'
From repo    : localrepo
```
    {% /reveal %}
  {% /task %}

  {% task id="task-d85d24fd5360" title="Grade and finish" %}
    {% lab-finish exercise="sa-local-repo" grade=true servers=true /%}
  {% /task %}
{% /lab %}
