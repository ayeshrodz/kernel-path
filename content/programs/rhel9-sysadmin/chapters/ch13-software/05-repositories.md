---
title: Repositories and package signatures
seoTitle: "Add a dnf Repository and GPG Keys on RHEL 9"
description: "Configure repositories in /etc/yum.repos.d, check package signatures and build a local repo. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 20
---

{% lead %}
dnf can only install what a repository offers, and it trusts a repository to the extent that you tell it to. A **repository** is a place (a web server, a directory) that holds packages together with a catalogue describing them. This lesson shows how repositories are defined, how package signatures keep them honest, and how to build a small repository of your own, which is a common need for isolated systems.
{% /lead %}

{% objectives %}
- Read a `.repo` file and explain `baseurl`, `enabled`, `gpgcheck` and `gpgkey`.
- List, enable and disable repositories, and use a single repository for one command.
- Create a local repository with `dnf download` and `createrepo_c`, and install from it.
{% /objectives %}

## Where repositories are defined

Each file in `/etc/yum.repos.d/` ending in `.repo` can define one or more repositories:

```console
[root@servera ~]# ls /etc/yum.repos.d
rocky-addons.repo  rocky-devel.repo  rocky-extras.repo  rocky-security.repo  rocky.repo
[root@servera ~]# dnf repolist
repo id                         repo name
appstream                       Rocky Linux 9 - AppStream
baseos                          Rocky Linux 9 - BaseOS
extras                          Rocky Linux 9 - Extras
[root@servera ~]# dnf repolist --all | head -4
repo id                    repo name                                    status
appstream                  Rocky Linux 9 - AppStream                    enabled
appstream-debuginfo        Rocky Linux 9 - AppStream - Debug            disabled
appstream-source           Rocky Linux 9 - AppStream - Source           disabled
```

RHEL's own software is split in two main repositories: **BaseOS** (the core operating system) and **AppStream** (applications, languages and databases, some available in several versions: next lesson). The names you see in your lab depend on the distribution. The shape of the files is the same everywhere:

{% diagram ref="repo-file" /%}

## Signatures: why gpgcheck matters

Anyone who can change a repository can change its packages. Each package is therefore **signed** by its publisher, and `gpgcheck=1` makes dnf verify the signature before installing. The public key that verifies it lives in `/etc/pki/rpm-gpg/` and is imported into the RPM database as a `gpg-pubkey` entry:

```console
[root@servera ~]# grep -h gpgkey /etc/yum.repos.d/*.repo | sort -u | head -2
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-Rocky-9
[root@servera ~]# rpm -qa 'gpg-pubkey*'
gpg-pubkey-350d275d-6279464b
```

`rpm -K package.rpm` verifies a file you already hold. If you must trust a new vendor, import their key yourself, after checking its fingerprint through a separate channel: `rpm --import URL-or-file`.

## Using one repository, or more

```console
[root@servera ~]# dnf --enablerepo=crb repolist       # enable for this command
[root@servera ~]# dnf --disablerepo='*' --enablerepo=baseos list available | head -3
```

To change the default permanently, set `enabled=0/1` in the `.repo` file (or use `dnf config-manager --set-enabled ID`, from the `dnf-plugins-core` package). `--disablerepo='*' --enablerepo=ID` is also the way to **prove** which repository a package comes from.

## Build a local repository

When machines cannot reach a vendor mirror, or you want a fixed, reviewed set of packages, you can serve your own. The recipe has four steps:

{% diagram ref="local-repo" /%}

First the tools (the `download` command and the metadata builder):

```console
[root@servera ~]# dnf install -y dnf-plugins-core createrepo_c
```

Then download the packages, **with their dependencies**, and build the catalogue:

```console
[root@servera ~]# mkdir -p /srv/localrepo
[root@servera ~]# dnf download --resolve --destdir /srv/localrepo zip
(1/2): zip-3.0-35.el9.x86_64.rpm                1.2 MB/s | 263 kB     00:00
(2/2): unzip-6.0-60.el9_8.x86_64.rpm            778 kB/s | 180 kB     00:00
[root@servera ~]# createrepo_c /srv/localrepo
Directory walk started
Directory walk done - 2 packages
Preparing sqlite DBs
Pool started (with 5 workers)
Pool finished
[root@servera ~]# ls /srv/localrepo
repodata  unzip-6.0-60.el9_8.x86_64.rpm  zip-3.0-35.el9.x86_64.rpm
```

Now describe it. Because these packages are signed by the distribution, keep `gpgcheck=1` and point `gpgkey` at the same key the other repositories use (copy the path from the `grep` above):

```console
[root@servera ~]# cat > /etc/yum.repos.d/local.repo <<'EOT'
[localrepo]
name=Local repository
baseurl=file:///srv/localrepo
enabled=1
gpgcheck=1
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-Rocky-9
EOT
[root@servera ~]# dnf clean all > /dev/null
[root@servera ~]# dnf --disablerepo='*' --enablerepo=localrepo list available
Available Packages
unzip.x86_64                       6.0-60.el9_8                        localrepo
zip.x86_64                         3.0-35.el9                          localrepo
```

Finally install from it only, and check where the package came from:

```console
[root@servera ~]# dnf --disablerepo='*' --enablerepo=localrepo install -y zip
...output omitted...
Complete!
[root@servera ~]# dnf info zip | grep 'From repo'
From repo    : localrepo
```

A web server can serve the same directory to many machines (`baseurl=http://host/repo`); chapter 19 offers another way, over NFS.

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch13.repositories"] ref="quick" /%}
