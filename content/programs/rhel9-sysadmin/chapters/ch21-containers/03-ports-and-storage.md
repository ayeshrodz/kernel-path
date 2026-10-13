---
title: Ports, settings and storage
seoTitle: "Podman Ports, Volumes and :Z SELinux Labels"
description: "Publish container ports, pass settings, keep data in volumes and bind mounts with the :Z label. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 20
---

{% lead %}
A container is isolated: its network, its files and its settings are its own. To make it useful you connect it on purpose: publish a port, hand it settings, and give it a place to keep data. SELinux and user mapping make two of those steps behave in ways that surprise people once.
{% /lead %}

{% objectives %}
- Publish ports with `-p` and explain the limits for rootless users.
- Pass settings with `-e` and keep data with bind mounts and volumes.
- Fix a bind mount that SELinux blocks, and explain the user mapping.
{% /objectives %}

## Publishing a port

{% diagram ref="ports" /%}

```console
[student@servera ~]$ podman run -d --name web -p 8080:8080 registry.access.redhat.com/ubi9/httpd-24
[student@servera ~]$ podman port web
8080/tcp -> 0.0.0.0:8080
```

The `httpd-24` image listens on 8080 inside, so that is the right side of `-p`. With `web` still running, two common errors:

```console
[student@servera ~]$ podman run -d --name two -p 8080:8080 registry.access.redhat.com/ubi9/ubi-minimal sleep 60
Error: pasta failed with exit code 1:
Failed to bind port 8080 (Address already in use) for option '-t 8080-8080:8080-8080'
[student@servera ~]$ podman run --rm -p 80:8080 registry.access.redhat.com/ubi9/ubi-minimal true
Error: pasta failed with exit code 1:
Failed to bind port 80 (Permission denied) for option '-t 80-80:8080-8080'
```

Some other process already uses 8080 in the first case (`ss -tlnp` shows which); an unprivileged user may not bind ports below 1024 in the second (`sysctl net.ipv4.ip_unprivileged_port_start` is 1024). The failed `two` container was created but never started: remove it with `podman rm two`. The usual answer is to publish a high port. Other machines also need the firewall to allow it: `sudo firewall-cmd --permanent --add-port=8080/tcp`, then `--reload` (chapter 20).

## Settings

`-e NAME=value` sets an environment variable inside the container:

```console
[student@servera ~]$ podman run --rm -e GREETING=hi registry.access.redhat.com/ubi9/ubi-minimal sh -c 'echo $GREETING'
hi
```

Use it for ordinary settings. A secret in `-e`, in the command line or in an image is visible to anyone who can run `podman inspect`, so keep secrets out of those places.

## Keeping data: bind mounts

The writable layer of a container disappears with it. To keep files, mount a directory of the host into the container with `-v HOST:CONTAINER[:options]`. Here the page comes from `~/web`:

```console
[student@servera ~]$ podman rm -f -t 1 web
web
[student@servera ~]$ mkdir -p ~/web; echo "hello from a container" > ~/web/index.html
[student@servera ~]$ podman run -d --name web -p 8080:8080 -v ~/web:/var/www/html:ro registry.access.redhat.com/ubi9/httpd-24
[student@servera ~]$ curl -s -o /dev/null -w "%{http_code}\n" localhost:8080
403
```

The mode of the file is fine, but the web server answers **403 Forbidden** (the Red Hat test page, because it cannot read your page). The reason is SELinux (chapter 16): the directory has a home-directory label, and the confined container may not read it.

{% diagram ref="bind-mount" /%}

```console
[student@servera ~]$ podman rm -f -t 1 web
web
[student@servera ~]$ podman run -d --name web -p 8080:8080 -v ~/web:/var/www/html:ro,Z registry.access.redhat.com/ubi9/httpd-24
[student@servera ~]$ curl -s localhost:8080
hello from a container
[student@servera ~]$ ls -dZ ~/web
system_u:object_r:container_file_t:s0:c183,c330 /home/student/web
```

`Z` relabels `~/web` for this container only. Never use it on a whole home directory or on `/etc`: mount a directory that exists for the job.

## Who owns the files?

The user inside the container is mapped to a range of host users. Root in the container (uid 0) is `student` (1000) on the host, and other container users become high numbers from `/etc/subuid`:

```console
[student@servera ~]$ mkdir -p ~/data
[student@servera ~]$ podman run --rm -v ~/data:/data:Z registry.access.redhat.com/ubi9/ubi-minimal sh -c 'echo made > /data/a.txt; ls -ln /data'
total 4
-rw-r--r--. 1 0 0 5 Oct  3 20:13 a.txt
[student@servera ~]$ ls -ln ~/data
total 4
-rw-r--r--. 1 1000 1000 5 Oct  3 20:13 a.txt
[student@servera ~]$ podman run --rm --user 1001 -v ~/data:/data:Z registry.access.redhat.com/ubi9/ubi-minimal sh -c 'echo x >> /data/a.txt'
sh: line 1: /data/a.txt: Permission denied
[student@servera ~]$ podman unshare ls -ln ~/data
total 4
-rw-r--r--. 1 0 0 5 Oct  3 20:13 a.txt
```

The file is root's inside the container and student's outside. A different container user (1001) has no right to it, because on the host that user is a different, high number. `podman unshare` runs a command in the same mapping, so you can see and fix ownership as the container sees it.

## Volumes

When you do not need the files in your own directories, let Podman manage them in a **named volume**. It survives container removal and needs no relabelling:

```console
[student@servera ~]$ podman volume create appdata
appdata
[student@servera ~]$ podman run --rm -v appdata:/data registry.access.redhat.com/ubi9/ubi-minimal sh -c 'echo persisted > /data/f'
[student@servera ~]$ podman run --rm -v appdata:/data registry.access.redhat.com/ubi9/ubi-minimal cat /data/f
persisted
[student@servera ~]$ podman volume ls
DRIVER      VOLUME NAME
local       appdata
```

{% callout type="warning" title="Data you care about" %}
Removing a container with `rm` does not remove a volume, but `podman volume rm` does. Back up a volume before changing the image that uses it.
{% /callout %}

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch21.storage"] ref="quick" /%}
