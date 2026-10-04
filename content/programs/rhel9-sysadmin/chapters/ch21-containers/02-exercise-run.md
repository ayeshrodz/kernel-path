---
title: "Exercise: Run and manage containers"
kind: lab
minutes: 25
---

{% lead %}
Pull an image, run a one-off container and a background one, look inside, read its output, then stop and remove it. You work as the ordinary user student, with no root access at all.
{% /lead %}

{% lab
  objectives=["ch21.containers"]
  id="run"
  title="Run and manage containers"
  exercise="sa-containers-run"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera"]
  outcomes=["Pull an image by its full name.","Run, inspect, stop and remove containers.","Use logs and ps -a to understand a container that exited."] %}

  {% task id="task-366d25c96e0e" title="Start the exercise" %}
    On workstation, start the exercise. It installs podman on servera and removes containers of an earlier run.

```console
[student@workstation ~]$ lab start sa-containers-run
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-35a22b8c74d5" title="Install Podman and pull an image" %}
    On servera, install `podman` with sudo if it is not there. As student, pull `registry.access.redhat.com/ubi9/ubi-minimal:latest` and list your images. Then try to pull the short name `httpd`: what does Podman say?

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ sudo dnf install -y podman > /dev/null
[student@servera ~]$ podman pull registry.access.redhat.com/ubi9/ubi-minimal:latest
Trying to pull registry.access.redhat.com/ubi9/ubi-minimal:latest...
...output omitted...
791c6eb32e560d616e601ed273b35b07118ba234a56e027937dee10c2e7f026c
[student@servera ~]$ podman images
REPOSITORY                                   TAG         IMAGE ID      CREATED     SIZE
registry.access.redhat.com/ubi9/ubi-minimal  latest      791c6eb32e56  3 days ago  109 MB
[student@servera ~]$ podman pull httpd
Error: short-name resolution enforced but cannot prompt without a TTY
```

    A short name could come from any registry, so Podman will not guess.
    {% /reveal %}
  {% /task %}

  {% task id="task-bf80dda598a4" title="A one-off container" %}
    Run a container that prints the first two lines of `/etc/os-release` and is removed when it ends. Check that nothing is left with `podman ps -a`.

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ podman run --rm registry.access.redhat.com/ubi9/ubi-minimal cat /etc/os-release | head -2
NAME="Red Hat Enterprise Linux"
VERSION="9.8 (Plow)"
[student@servera ~]$ podman ps -a
CONTAINER ID  IMAGE       COMMAND     CREATED     STATUS      PORTS       NAMES
```
    {% /reveal %}
  {% /task %}

  {% task id="task-cc810cba116a" title="A container in the background" %}
    Start a container named `idle` from the same image that runs `sleep 600`. Show it with `podman ps`, run `id` and `cat /etc/redhat-release` inside it, and list its processes.

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ podman run -d --name idle registry.access.redhat.com/ubi9/ubi-minimal sleep 600
2fd01c4a6e18d21bbd4b0f3a1b7ce7d3de9bb6bf1d1e5d9d0a5f1c7f0c6b2c11
[student@servera ~]$ podman ps --format "{{.Names}} {{.Status}}"
idle Up 2 seconds
[student@servera ~]$ podman exec idle id
uid=0(root) gid=0(root) groups=0(root)
[student@servera ~]$ podman exec idle cat /etc/redhat-release
Red Hat Enterprise Linux release 9.8 (Plow)
[student@servera ~]$ podman top idle | cut -c1-70
USER        PID         PPID        %CPU        ELAPSED       TTY         TIME        COMMAND
root        1           0           0.000       1.2s          ?           0s          /usr/bin/coreutils --coreutils-prog-shebang=sleep /usr/bin/sleep 600
```

    The process is root inside the container, but on the host it belongs to student. Compare with `ps -u student | grep -c sleep`.
    {% /reveal %}
  {% /task %}

  {% task id="task-eac55623e4f6" title="A container that exits at once" %}
    Start a container named `quick` that runs `echo done` in the background. Why is it not in `podman ps`? Find it, read its output and remove it.

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ podman run -d --name quick registry.access.redhat.com/ubi9/ubi-minimal echo done
[student@servera ~]$ podman ps -a --format "{{.Names}} {{.Status}}"
idle Up About a minute
quick Exited (0) 2 seconds ago
[student@servera ~]$ podman logs quick
done
[student@servera ~]$ podman rm quick
quick
```

    The main process ended, so the container is `Exited (0)`. A wrong command gives a different message: `podman run --rm IMAGE nosuchcommand` ends with "executable file `nosuchcommand` not found in $PATH".
    {% /reveal %}
  {% /task %}

  {% task id="task-796619cdcdd7" title="Stop, remove, and the two stores" %}
    Stop `idle` (use `-t 1` to be quick) and remove it. Then run `sudo podman images`: do you see the image? Why not?

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ podman stop -t 1 idle
idle
[student@servera ~]$ podman rm idle
idle
[student@servera ~]$ sudo podman images
REPOSITORY  TAG         IMAGE ID    CREATED     SIZE
```

    root has its own, empty storage. Images and containers belong to the user who ran Podman.
    {% /reveal %}
  {% /task %}

  {% task id="task-c08c7862d8b4" title="Grade and finish" %}
    {% lab-finish exercise="sa-containers-run" grade=true servers=true /%}
  {% /task %}
{% /lab %}
