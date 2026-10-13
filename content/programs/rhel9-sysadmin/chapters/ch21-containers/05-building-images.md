---
title: Building your own image
seoTitle: "Build a Container Image With a Containerfile"
description: "Write a Containerfile and build, tag and version your own images with podman build. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 15
---

{% lead %}
You rarely run an image exactly as you find it. A **Containerfile** is a short recipe that starts from a base image and adds your files, so the result is the same on every machine. `podman build` turns it into a new local image.
{% /lead %}

{% objectives %}
- Write a short Containerfile with `FROM`, `COPY` and, where needed, `USER` and `CMD`.
- Build, tag, run and inspect the image.
- Explain layers, tags and digests, and what does not belong in an image.
{% /objectives %}

## The recipe

{% diagram ref="containerfile" /%}

The simplest useful image puts a web page inside the web server image. In a directory `~/portal` create the page and the recipe:

```console
[student@servera ~]$ mkdir -p ~/portal && cd ~/portal
[student@servera portal]$ echo "Portal is up" > index.html
[student@servera portal]$ cat > Containerfile <<'EOT'
FROM registry.access.redhat.com/ubi9/httpd-24:latest
COPY index.html /var/www/html/index.html
EOT
```

## Build and run

{% diagram ref="build-flow" /%}

```console
[student@servera portal]$ podman build -t localhost/portal:1 .
STEP 1/2: FROM registry.access.redhat.com/ubi9/httpd-24:latest
STEP 2/2: COPY index.html /var/www/html/index.html
COMMIT localhost/portal:1
--> 49203ad043a3
Successfully tagged localhost/portal:1
49203ad043a3e208fce8ed4aeb3ff117a24e0cd63f212dd89e3aac708edab38c
[student@servera portal]$ podman run -d --name portal -p 8080:8080 localhost/portal:1
[student@servera portal]$ curl -s localhost:8080
Portal is up
```

`-t` names and tags the image; the `.` is the **build context**, the directory whose files `COPY` may use. The page is part of the image now: there is no volume, and every container from this image shows the same page.

```console
[student@servera portal]$ podman history localhost/portal:1 | head -3 | cut -c1-90
ID            CREATED                 CREATED BY                                     SIZE
cf1e25990315  Less than a second ago  /bin/sh -c #(nop) COPY file:702c4212… in /var/www/html/index.html  2.56kB
```

Each instruction is a **layer**; the small `COPY` layer sits on top of the large base image, so the new image costs almost no extra disk space.

## Good habits

- **Pin what you build on.** `:latest` can change under you. Use a tested tag, or the digest: `FROM registry.access.redhat.com/ubi9/httpd-24@sha256:…`.
- **Build in the image what is fixed** (program, page, configuration) and **keep in a volume what changes** (data, uploads, logs).
- **No secrets** in `COPY`, `ENV` or `RUN`: they stay in the layers for good.
- **A container lives as long as its main process.** A one-shot image (print a line and exit) is useful for commands, but it is not a service; under `Restart=always` it would restart forever.
- Give versions to your own images (`:1`, `:2`) so you can go back: `podman tag localhost/portal:1 localhost/portal:latest` adds a second name, and `podman rmi` removes a name.
- The image exists only in your storage until you push it to a registry you control. Another machine cannot use `localhost/portal:1`.

```console
[student@servera portal]$ podman rm -f -t 1 portal
portal
[student@servera portal]$ podman images --format "{{.Repository}}:{{.Tag}} {{.Size}}"
localhost/portal:1 310 MB
registry.access.redhat.com/ubi9/httpd-24:latest 310 MB
```

Both lines show the same size because they share the base layers. (Stopping this web image waits ten seconds for a polite exit; `-t 1` shortens that.)

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch21.build"] ref="quick" /%}
