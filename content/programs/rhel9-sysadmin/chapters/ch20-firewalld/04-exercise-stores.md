---
title: "Exercise: Runtime, permanent and temporary rules"
seoTitle: "Runtime, permanent and temporary rules (RHCSA Practice Exercise)"
description: "Hands-on RHCSA practice: runtime, permanent and temporary rules. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 25
---

{% lead %}
Watch the two stores part company: a runtime rule that a reload erases, a permanent rule that does nothing until it is loaded, a temporary rule that expires, and a test rule that gets saved by accident.
{% /lead %}

{% lab
  objectives=["ch20.stores"]
  id="stores"
  title="Runtime, permanent and temporary rules"
  exercise="sa-fw-stores"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera","serverb"]
  outcomes=["Show that a runtime rule is lost on reload.","Use --timeout for a temporary rule.","Explain what --runtime-to-permanent saves."] %}

  {% task id="task-ed0f6cf56a1f" title="Start the exercise" %}
    On workstation, start the exercise. It installs httpd on servera with the page `hello from servera` and starts it.

```console
[student@workstation ~]$ lab start sa-fw-stores
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-2a976c4335b2" title="A runtime rule" %}
    Allow `http` without `--permanent`. Compare the runtime and permanent lists, test from serverb, then reload and test again.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# firewall-cmd --add-service=http
success
[root@servera ~]# firewall-cmd --list-services; firewall-cmd --permanent --list-services
cockpit dhcpv6-client http ssh
cockpit dhcpv6-client ssh
[student@serverb ~]$ curl -s -m 3 http://servera/
hello from servera
[root@servera ~]# firewall-cmd --reload
success
[student@serverb ~]$ curl -sS -m 3 http://servera/
curl: (7) Failed to connect to servera port 80: No route to host
```

    The reload replaced the runtime state with the saved one, where http was never written.
    {% /reveal %}
  {% /task %}

  {% task id="task-2d318b65bdeb" title="A permanent rule that is not loaded yet" %}
    Add `http` with `--permanent` only. Is port 80 open now? Then reload and check again.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# firewall-cmd --permanent --add-service=http
success
[root@servera ~]# firewall-cmd --query-service=http; firewall-cmd --permanent --query-service=http
no
yes
[root@servera ~]# firewall-cmd --reload
success
[root@servera ~]# firewall-cmd --query-service=http
yes
```
    {% /reveal %}
  {% /task %}

  {% task id="task-0986f95097de" title="A temporary rule" %}
    Open `8080/tcp` for 30 seconds with `--timeout`, list the ports, wait, and list again. (httpd does not listen on 8080 yet; you are only watching the rule.)

    {% reveal title="Show solution" %}

```console
[root@servera ~]# firewall-cmd --add-port=8080/tcp --timeout=30
success
[root@servera ~]# firewall-cmd --list-ports
8080/tcp
[root@servera ~]# sleep 32; firewall-cmd --list-ports
[root@servera ~]#
```
    {% /reveal %}
  {% /task %}

  {% task id="task-225ca67960ac" title="The runtime-to-permanent trap" %}
    Open `8080/tcp` for 300 seconds, then run `--runtime-to-permanent`. Look at the saved ports. Remove the port from both stores again.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# firewall-cmd --add-port=8080/tcp --timeout=300
success
[root@servera ~]# firewall-cmd --runtime-to-permanent
success
[root@servera ~]# firewall-cmd --permanent --list-ports
8080/tcp
[root@servera ~]# firewall-cmd --permanent --remove-port=8080/tcp; firewall-cmd --reload
success
success
```

    The "temporary" test port became permanent. That is why you read `--list-all` first.
    {% /reveal %}
  {% /task %}

  {% task id="task-4853f4c284e2" title="Survive a reboot" %}
    Reboot servera. After it comes back, is http still allowed and does serverb still get the page?

    {% reveal title="Show solution" %}

```console
[root@servera ~]# systemctl reboot
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ sudo firewall-cmd --list-services
cockpit dhcpv6-client http ssh
[student@serverb ~]$ curl -s -m 3 http://servera/
hello from servera
```
    {% /reveal %}
  {% /task %}

  {% task id="task-b5a458a4e2ba" title="Grade and finish" %}
    {% lab-finish exercise="sa-fw-stores" grade=true servers=true /%}
  {% /task %}
{% /lab %}
