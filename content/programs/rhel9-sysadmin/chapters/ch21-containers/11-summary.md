---
title: "Podman containers cheat sheet"
seoTitle: "Podman containers Cheat Sheet (RHCSA)"
description: "Podman containers cheat sheet: the key commands and ideas on one page, with flashcards for revision. Free RHCSA study notes."
kind: summary
minutes: 5
---

{% lead %}
The chapter on one page: what to remember, the commands to have at your fingertips, and flashcards for quick revision.
{% /lead %}

## The chapter in eight sentences

- A container is a set of ordinary processes started from an image and isolated from the rest of the system; Podman runs them without a daemon and, by default, without root.
- Pull images by their full name (`registry.access.redhat.com/ubi9/...`); a tag can move, a digest cannot.
- A container lives as long as its main process; `podman ps -a`, `podman logs` and `podman exec` explain what happened.
- Rootless and root Podman have separate storage; root inside a container is only your own user outside.
- `-p HOST:CONTAINER` publishes a port (rootless needs 1024 or higher), and the firewall must allow it for other hosts.
- Keep data outside the container: `-v DIR:/path:Z` (the `Z` fixes the SELinux label) or a named volume.
- A Containerfile (`FROM`, `COPY`, `CMD`) plus `podman build -t localhost/name:1 .` makes your own image.
- A `.container` file in `~/.config/containers/systemd/` becomes a user service after `systemctl --user daemon-reload`; `Restart=always` restarts it and `loginctl enable-linger` starts it at boot.

## Cheat sheet

{% tabs %}
  {% tab label="Run" %}

| Command | Does |
| --- | --- |
| `podman pull FULLNAME` · `podman images` | Get and list images |
| `podman run --rm IMAGE cmd` | One-off container |
| `podman run -d --name N -p 8080:8080 IMAGE` | Background container |
| `podman ps [-a]` · `podman logs N` · `podman exec N cmd` | Look inside |
| `podman stop -t 1 N` · `podman rm [-f] N` · `podman rmi IMAGE` | Stop and remove |

  {% /tab %}
  {% tab label="Data and build" %}

| Command | Does |
| --- | --- |
| `-v ~/web:/var/www/html:ro,Z` | Bind mount with private SELinux label |
| `podman volume create V` · `-v V:/data` | Named volume |
| `-e NAME=value` | Setting |
| `podman unshare ls -ln DIR` | Files as the container sees them |
| `podman build -t localhost/app:1 .` | Build from a Containerfile |
| `podman tag A B` · `podman history IMAGE` | Names and layers |

  {% /tab %}
  {% tab label="Service" %}

| Item | Does |
| --- | --- |
| `~/.config/containers/systemd/NAME.container` | Quadlet file |
| `[Container] Image= PublishPort= Volume=` | What to run |
| `[Service] Restart=always` · `[Install] WantedBy=default.target` | Policy |
| `systemctl --user daemon-reload` · `start NAME.service` | Generate and start |
| `journalctl _SYSTEMD_USER_UNIT=NAME.service` | Its log |
| `sudo loginctl enable-linger USER` | Start at boot |
| `sudo firewall-cmd --permanent --add-port=8080/tcp` | Let others in |

  {% /tab %}
{% /tabs %}

## Flashcards

{% flashcards ref="flashcards" /%}
