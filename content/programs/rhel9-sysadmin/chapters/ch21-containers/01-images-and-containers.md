---
title: Images and containers
seoTitle: "Podman Tutorial: Run and Manage Containers"
description: "Pull images and run, inspect, stop and remove rootless containers with Podman on RHEL 9. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 15
---

{% lead %}
A container is an ordinary Linux process started from a ready-made package and kept apart from the rest of the system. RHEL ships **Podman** to run them. You need no daemon and no root account: a normal user can pull images and run containers of their own.
{% /lead %}

{% objectives %}
- Explain images, containers and registries, and where rootless Podman keeps them.
- Pull an image and run, inspect, stop and remove containers.
- Find out why a container exited or could not start.
{% /objectives %}

## The parts

{% diagram ref="model" /%}

Podman is part of the container tools of RHEL 9 (`sudo dnf install podman`). It accepts the same arguments as the better known Docker command line, and it runs **rootless** by default: a container started by `student` is a set of processes owned by `student`, kept in `student`'s home directory.

```console
[student@servera ~]$ podman --version
podman version 5.8.2
[student@servera ~]$ podman pull registry.access.redhat.com/ubi9/ubi-minimal:latest
Trying to pull registry.access.redhat.com/ubi9/ubi-minimal:latest...
Getting image source signatures
Copying blob 5d5a5ce3a8d4 done   |
Copying config 791c6eb32e done   |
Writing manifest to image destination
791c6eb32e560d616e601ed273b35b07118ba234a56e027937dee10c2e7f026c
[student@servera ~]$ podman images
REPOSITORY                                   TAG         IMAGE ID      CREATED     SIZE
registry.access.redhat.com/ubi9/ubi-minimal  latest      791c6eb32e56  3 days ago  109 MB
```

Always give the **full name** of the registry. A short name such as `httpd` could come from any registry, so Podman refuses it when it cannot ask you:

```console
[student@servera ~]$ podman pull httpd
Error: short-name resolution enforced but cannot prompt without a TTY
```

Version numbers and sizes in this chapter come from the lab (Podman 5.8); yours may differ slightly. The lab needs access to `registry.access.redhat.com`.

## The life of a container

{% diagram ref="lifecycle" /%}

```console
[student@servera ~]$ podman run --rm registry.access.redhat.com/ubi9/ubi-minimal cat /etc/os-release | head -2
NAME="Red Hat Enterprise Linux"
VERSION="9.8 (Plow)"
[student@servera ~]$ podman run -d --name idle registry.access.redhat.com/ubi9/ubi-minimal sleep 600
2fd01c4a6e18d21bbd4b0f3a1b7ce7d3de9bb6bf1d1e5d9d0a5f1c7f0c6b2c11
[student@servera ~]$ podman ps
CONTAINER ID  IMAGE                                        COMMAND     CREATED        STATUS        PORTS       NAMES
2fd01c4a6e18  registry.access.redhat.com/ubi9/ubi-minimal  sleep 600   2 seconds ago  Up 2 seconds              idle
[student@servera ~]$ podman exec idle id
uid=0(root) gid=0(root) groups=0(root)
[student@servera ~]$ podman stop -t 1 idle
idle
[student@servera ~]$ podman ps -a --format "{{.Names}} {{.Status}}"
idle Exited (137) 1 second ago
[student@servera ~]$ podman rm idle
idle
```

- `run --rm` starts a container for one command and deletes it afterwards.
- `run -d` starts it in the background; `--name` gives it a name you can use in later commands.
- A container lives exactly as long as its **main process**. `sleep 600` keeps it up; a command that ends makes the container `Exited`.
- `podman ps` shows running containers; `podman ps -a` includes the stopped ones. `podman logs NAME` shows what the main process printed. This is the first place to look when a container exits at once.
- Inside the container the process is `root` (uid 0), but on the host it is only `student`. This mapping is why rootless containers are safer; the next lesson shows its effect on files.

## Two stores

Ordinary `podman` and `sudo podman` use different storage. An image pulled by `student` is invisible to root, and the other way round. Pick one user for a job and use it consistently. Use root only when you must, for example to bind a privileged port.

```console
[student@servera ~]$ podman system df
TYPE           TOTAL       ACTIVE      SIZE        RECLAIMABLE
Images         4           1           418.6MB     108.8MB (26%)
Containers     1           1           39.48kB     0B (0%)
Local Volumes  0           0           0B          0B (0%)
```

`podman rmi IMAGE` removes an image and `podman image prune` removes unused ones.

{% callout type="tip" title="Tags move, digests do not" %}
`ubi9/ubi-minimal:latest` is a label that the publisher moves when they release an update. `podman image inspect IMAGE --format '{{.Digest}}'` shows the **digest**, which names one exact image. For repeatable work, note the digest of an image you have tested.
{% /callout %}

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch21.containers"] ref="quick" /%}
