---
title: "Exercise: Containers review"
kind: lab
minutes: 45
---

{% lead %}
Build a small web image, run it as a systemd service of the user student with Quadlet, and make it survive a reboot and serve another machine. Everything runs rootless, except the two commands that change the system (lingering and the firewall).
{% /lead %}

{% lab
  objectives=["ch21.containers","ch21.storage","ch21.build","ch21.services"]
  id="review"
  title="Containers review"
  exercise="sa-containers-review"
  ownExercise=true
  hosts=["workstation","servera","serverb"]
  outcomes=["Build a tagged image from a Containerfile.","Run it as a Quadlet user service.","Enable lingering and open the port for another host."] %}
{% lab-notes %}

**Before you start:** reset the servers and complete this chapter's lessons. You work on **servera** as student, connected with `ssh student@servera`; `lab start` and `lab grade` run on workstation. The lab needs access to `registry.access.redhat.com`.

{% /lab-notes %}

{% lab-challenge %}

On servera, as student:

1. Install `podman` if needed. Create `~/portal/index.html` with `Portal is up` and a `Containerfile` that builds on `registry.access.redhat.com/ubi9/httpd-24` and copies the page.
2. Build it as `localhost/portal:1`.
3. Write `~/.config/containers/systemd/portal.container`: that image, `PublishPort=8080:8080`, `Restart=always`, wanted by `default.target`.
4. Start `portal.service`; the container `systemd-portal` must run.
5. Enable lingering for student, open `8080/tcp` permanently, and test from serverb.
6. On workstation, fill in `answers.txt`.

{% /lab-challenge %}

  {% task id="task-df8d20974d51" title="Start the exercise" %}

```console
[student@workstation ~]$ lab start sa-containers-review
[student@workstation ~]$ ssh student@servera
[student@servera ~]$
```
  {% /task %}

  {% task id="task-1a92e7d2afa7" title="The image" %}

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ sudo dnf install -y podman > /dev/null
[student@servera ~]$ mkdir -p ~/portal && cd ~/portal
[student@servera portal]$ echo "Portal is up" > index.html
[student@servera portal]$ cat > Containerfile <<'EOT'
FROM registry.access.redhat.com/ubi9/httpd-24:latest
COPY index.html /var/www/html/index.html
EOT
[student@servera portal]$ podman build -t localhost/portal:1 . | tail -2
Successfully tagged localhost/portal:1
8783f7652eb1f58df91e9c935a51986cbb9e3de30809eb517a08e5e4f883b136
```
    {% /reveal %}
  {% /task %}

  {% task id="task-ac3fedb273c3" title="The service" %}

    {% reveal title="Show solution" %}

```console
[student@servera portal]$ mkdir -p ~/.config/containers/systemd
[student@servera portal]$ cat > ~/.config/containers/systemd/portal.container <<'EOT'
[Unit]
Description=Portal container

[Container]
Image=localhost/portal:1
PublishPort=8080:8080

[Service]
Restart=always

[Install]
WantedBy=default.target
EOT
[student@servera portal]$ systemctl --user daemon-reload
[student@servera portal]$ systemctl --user start portal.service
[student@servera portal]$ sleep 3; systemctl --user is-active portal.service; curl -s localhost:8080
active
Portal is up
```
    {% /reveal %}
  {% /task %}

  {% task id="task-becb7640d883" title="Boot and network" %}

    {% reveal title="Show solution" %}

```console
[student@servera portal]$ sudo loginctl enable-linger student
[student@servera portal]$ sudo firewall-cmd --permanent --add-port=8080/tcp; sudo firewall-cmd --reload
success
success
[student@serverb ~]$ curl -s -m 3 http://servera:8080/
Portal is up
```

    A reboot of servera is the final proof: the portal answers again after a minute, with nobody logged in.
    {% /reveal %}
  {% /task %}

  {% task id="task-b9e0a99c36c8" title="Grade" %}
    On workstation, fill in `answers.txt` and grade:

    {% lab-finish exercise="sa-containers-review" grade=true servers=true /%}
  {% /task %}
{% /lab %}
