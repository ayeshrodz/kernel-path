---
title: "Exercise: Ports, mounts and volumes"
kind: lab
minutes: 30
---

{% lead %}
Publish a web container, meet the SELinux 403 and fix it with the right mount option, collide on a port, and keep data in a named volume. Then see how user IDs inside the container map to the host.
{% /lead %}

{% lab
  objectives=["ch21.storage"]
  id="storage"
  title="Ports, mounts and volumes"
  exercise="sa-containers-storage"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera"]
  outcomes=["Publish ports and recognise the two port errors.","Fix an SELinux-blocked bind mount with :Z.","Keep data in a volume and understand the user mapping."] %}

  {% task id="task-6b26c2956c7c" title="Start the exercise" %}
    On workstation, start the exercise. It installs podman, pulls the web and minimal images for student on servera and creates `~/web/index.html` with the line `hello from a container`.

```console
[student@workstation ~]$ lab start sa-containers-storage
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-72cbd79c173b" title="A bind mount that fails" %}
    Run the image as `web`, publishing 8080 and mounting `~/web` read-only on `/var/www/html`. Fetch the page with `curl -s -o /dev/null -w "%{http_code}\n" localhost:8080`. Read the SELinux label of `~/web` with `ls -dZ`.

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ podman run -d --name web -p 8080:8080 -v ~/web:/var/www/html:ro registry.access.redhat.com/ubi9/httpd-24
[student@servera ~]$ curl -s -o /dev/null -w "%{http_code}\n" localhost:8080
403
[student@servera ~]$ ls -dZ ~/web
unconfined_u:object_r:httpd_user_content_t:s0 /home/student/web
```

    The file modes are fine; the label is the problem. The confined container may not read `httpd_user_content_t`.
    {% /reveal %}
  {% /task %}

  {% task id="task-1d4fe9c67d67" title="Relabel with Z" %}
    Remove the container and start it again with the `Z` option added. Fetch the page, then look at the label of `~/web` again.

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ podman rm -f -t 1 web
web
[student@servera ~]$ podman run -d --name web -p 8080:8080 -v ~/web:/var/www/html:ro,Z registry.access.redhat.com/ubi9/httpd-24
[student@servera ~]$ curl -s localhost:8080
hello from a container
[student@servera ~]$ ls -dZ ~/web
system_u:object_r:container_file_t:s0:c183,c330 /home/student/web
```

    The new label (`container_file_t` with a private category) is what lets this container, and only this one, read the directory.
    {% /reveal %}
  {% /task %}

  {% task id="task-7144a0671f81" title="Two port errors" %}
    With `web` running, start a second container from `ubi-minimal` that publishes 8080 too (`sleep 60`). Then try to publish host port 80 for a container. Read both messages and clean up the first failed container.

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ podman run -d --name two -p 8080:8080 registry.access.redhat.com/ubi9/ubi-minimal sleep 60
Error: pasta failed with exit code 1:
Failed to bind port 8080 (Address already in use) for option '-t 8080-8080:8080-8080'
[student@servera ~]$ podman run --rm -p 80:8080 registry.access.redhat.com/ubi9/ubi-minimal true
Error: pasta failed with exit code 1:
Failed to bind port 80 (Permission denied) for option '-t 80-80:8080-8080'
[student@servera ~]$ podman rm two
two
[student@servera ~]$ sysctl net.ipv4.ip_unprivileged_port_start
net.ipv4.ip_unprivileged_port_start = 1024
```
    {% /reveal %}
  {% /task %}

  {% task id="task-639486a9fc2e" title="A named volume" %}
    Create the volume `appdata`. In one container write `persisted` to `/data/f` on it, then read the file from a second container. Where does Podman keep the volume on the host? Remove it at the end.

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ podman volume create appdata
appdata
[student@servera ~]$ podman run --rm -v appdata:/data registry.access.redhat.com/ubi9/ubi-minimal sh -c 'echo persisted > /data/f'
[student@servera ~]$ podman run --rm -v appdata:/data registry.access.redhat.com/ubi9/ubi-minimal cat /data/f
persisted
[student@servera ~]$ podman volume inspect appdata --format '{{.Mountpoint}}'
/home/student/.local/share/containers/storage/volumes/appdata/_data
[student@servera ~]$ podman volume rm appdata
appdata
```
    {% /reveal %}
  {% /task %}

  {% task id="task-519b90850b8c" title="Who owns the files?" %}
    Run a container that writes `/data/a.txt` into the bind mount `~/data` (create the directory, use `:Z`), and compare the owner seen inside the container and on the host. Then try to append to the file as container user 1001. Finally show the file with `podman unshare`.

    {% reveal title="Show solution" %}

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

    Root in the container is student on the host. User 1001 inside is some other high number outside, with no right to student's file.
    {% /reveal %}
  {% /task %}

  {% task id="task-b8085e8906ea" title="Grade and finish" %}
    {% lab-finish exercise="sa-containers-storage" grade=true servers=true /%}
  {% /task %}
{% /lab %}
