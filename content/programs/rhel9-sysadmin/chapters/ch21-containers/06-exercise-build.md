---
title: "Exercise: Build and version an image"
kind: lab
minutes: 30
---

{% lead %}
Build a small web image from a Containerfile, read a build error, run the image, make a second version, and move a tag between versions.
{% /lead %}

{% lab
  objectives=["ch21.build"]
  id="build"
  title="Build and version an image"
  exercise="sa-containers-build"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera"]
  outcomes=["Write a Containerfile and build a tagged image.","Read a failed COPY step.","Run and compare two versions of an image."] %}

  {% task id="task-ac932c86ca1b" title="Start the exercise" %}
    On workstation, start the exercise. It installs podman on servera and pulls the base image `httpd-24` for student.

```console
[student@workstation ~]$ lab start sa-containers-build
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-94520ca5e1dd" title="The project directory" %}
    As student on servera, create `~/portal` with `index.html` containing `Portal is up`. Make sure the base image `registry.access.redhat.com/ubi9/httpd-24:latest` is pulled.

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ podman pull registry.access.redhat.com/ubi9/httpd-24:latest | tail -1
4e74cc90c2a4ab4fcc97976b9e382cd2b8e0711222a30206ae8089fc39b01bb9
[student@servera ~]$ mkdir -p ~/portal && cd ~/portal
[student@servera portal]$ echo "Portal is up" > index.html
```
    {% /reveal %}
  {% /task %}

  {% task id="task-7c7800cbfe6f" title="A Containerfile with a mistake" %}
    Write a `Containerfile` that starts from the base image and copies `missing.html` to `/var/www/html/index.html`. Build it as `localhost/portal:bad` and read the error.

    {% reveal title="Show solution" %}

```console
[student@servera portal]$ printf 'FROM registry.access.redhat.com/ubi9/httpd-24:latest\nCOPY missing.html /var/www/html/index.html\n' > Containerfile
[student@servera portal]$ podman build -t localhost/portal:bad . 2>&1 | tail -2
STEP 2/2: COPY missing.html /var/www/html/index.html
Error: building at STEP "COPY missing.html /var/www/html/index.html": checking on sources under "/home/student/portal": copier: stat: "/missing.html": no such file or directory
```

    The build stopped at step 2 because that file is not in the build context (the current directory).
    {% /reveal %}
  {% /task %}

  {% task id="task-df4a66ddd0d0" title="Fix it and build version 1" %}
    Correct the Containerfile to copy `index.html`, and build `localhost/portal:1`. List the images.

    {% reveal title="Show solution" %}

```console
[student@servera portal]$ printf 'FROM registry.access.redhat.com/ubi9/httpd-24:latest\nCOPY index.html /var/www/html/index.html\n' > Containerfile
[student@servera portal]$ podman build -t localhost/portal:1 . | tail -2
Successfully tagged localhost/portal:1
8783f7652eb1f58df91e9c935a51986cbb9e3de30809eb517a08e5e4f883b136
[student@servera portal]$ podman images --format "{{.Repository}}:{{.Tag}} {{.ID}}"
localhost/portal:1 8783f7652eb1
registry.access.redhat.com/ubi9/httpd-24:latest 4e74cc90c2a4
```
    {% /reveal %}
  {% /task %}

  {% task id="task-655e7121ca68" title="Run it" %}
    Run `localhost/portal:1` as `portal`, publishing host port 8081 to the container's 8080. Wait two seconds and fetch the page.

    {% reveal title="Show solution" %}

```console
[student@servera portal]$ podman run -d --name portal -p 8081:8080 localhost/portal:1
[student@servera portal]$ sleep 2; curl -s localhost:8081
Portal is up
```

    No volume was needed: the page is part of the image.
    {% /reveal %}
  {% /task %}

  {% task id="task-fcd4d187618a" title="Version 2 and a moving tag" %}
    Change the page to `Portal v2`, build `localhost/portal:2` and also tag it `localhost/portal:latest`. List the images: which two share an image ID? Replace the running container with one from `latest` and fetch the page again.

    {% reveal title="Show solution" %}

```console
[student@servera portal]$ echo "Portal v2" > index.html
[student@servera portal]$ podman build -t localhost/portal:2 . | tail -1
65755b3c59904919657cad23be6f3e8e87d42d648de4c04cb3cc43b15efc1f88
[student@servera portal]$ podman tag localhost/portal:2 localhost/portal:latest
[student@servera portal]$ podman images --format "{{.Repository}}:{{.Tag}} {{.ID}}" | grep portal
localhost/portal:latest 65755b3c5990
localhost/portal:2 65755b3c5990
localhost/portal:1 8783f7652eb1
[student@servera portal]$ podman rm -f -t 1 portal
portal
[student@servera portal]$ podman run -d --name portal -p 8081:8080 localhost/portal:latest
[student@servera portal]$ sleep 2; curl -s localhost:8081
Portal v2
```

    `latest` and `2` are two names for the same image. Move `latest` when you release; a deployment that names `:1` keeps getting the old page.
    {% /reveal %}
  {% /task %}

  {% task id="task-b61f73cd8580" title="Look at the layers and the digest" %}
    Show the history of `localhost/portal:2` (the first three lines) and the digest of the base image.

    {% reveal title="Show solution" %}

```console
[student@servera portal]$ podman history localhost/portal:2 | head -3 | cut -c1-90
ID            CREATED                 CREATED BY                                     SIZE
cf1e25990315  Less than a second ago  /bin/sh -c #(nop) COPY file:702c4212… in /var/www/html/index.html  2.56kB
[student@servera portal]$ podman image inspect registry.access.redhat.com/ubi9/httpd-24 --format '{{.Digest}}'
sha256:ea005876daf0c5ee8024c9334503c742a37ed5391ee0e32a9051540425298d76
```

    For a build that must be repeatable, write the base as `FROM registry.access.redhat.com/ubi9/httpd-24@sha256:…`.
    {% /reveal %}
  {% /task %}

  {% task id="task-44921bebd9b6" title="Grade and finish" %}
    {% lab-finish exercise="sa-containers-build" grade=true servers=true /%}
  {% /task %}
{% /lab %}
