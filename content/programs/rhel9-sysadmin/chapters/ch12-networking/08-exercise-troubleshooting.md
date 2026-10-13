---
title: "Exercise: The service nobody can reach"
seoTitle: "The service nobody can reach (RHCSA Practice Exercise)"
description: "Hands-on RHCSA practice: the service nobody can reach. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 30
---

{% lead %}
A small web service on serverb answers on its own machine and from nowhere else. Work up the ladder from servera, read each error message, and make exactly one change per layer until `curl` returns the page.
{% /lead %}

{% lab
  objectives=["ch12.troubleshooting"]
  id="troubleshooting"
  title="The service nobody can reach"
  exercise="sa-reach"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera","serverb"]
  outcomes=["Use the error message to pick the next layer to check.","Find a loopback-only listener with ss.","Open a port and fix the bind address."] %}

  {% task id="task-aeb68e6f8fc8" title="Start the exercise" %}
    On workstation, start the exercise. It starts a small web server on serverb that listens on port 8080 of the loopback address only, with the page `hello from serverb`.

```console
[student@workstation ~]$ lab start sa-reach
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.

    Then, as root on serverb, change to the exercise directory:

```console
[root@serverb ~]# cd /srv/web
```
  {% /task %}

  {% task id="task-f3c90437d725" title="Rung 1 to 5: is the machine reachable?" %}
    In a second terminal, log in to servera. Check that serverb resolves, that its address answers a ping, and then try the service. Write down the exact error.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ getent hosts serverb
172.25.250.11   serverb.lab.example.com
[student@servera ~]$ ping -c 1 serverb | tail -2
1 packets transmitted, 1 received, 0% packet loss, time 0ms
rtt min/avg/max/mdev = 0.134/0.134/0.134/0.000 ms
[student@servera ~]$ curl -sS -m 5 http://serverb:8080/
curl: (7) Failed to connect to serverb port 8080: No route to host
```

    The name and the address are fine, so rungs 1 to 5 hold. "No route to host" with a working ping means the port is being rejected.
    {% /reveal %}
  {% /task %}

  {% task id="task-8a7ea30c63a7" title="Rung 6a: the firewall" %}
    On serverb, look at which services and ports the firewall allows, and open TCP port 8080 for the running system (not permanently). Test from servera again. What is the error now?

    {% reveal title="Show solution" %}

```console
[root@serverb web]# firewall-cmd --list-services; firewall-cmd --list-ports
cockpit dhcpv6-client ssh

[root@serverb web]# firewall-cmd --add-port=8080/tcp
success
[student@servera ~]$ curl -sS -m 5 http://serverb:8080/
curl: (7) Failed to connect to serverb port 8080: Connection refused
```

    Progress: the packets now arrive, and the answer changed from "no route" to "refused". (Chapter 20 teaches firewalld properly, including permanent rules.)
    {% /reveal %}
  {% /task %}

  {% task id="task-fce797b434b1" title="Rung 6b: is anything listening where it should?" %}
    On serverb, show what listens on port 8080 and on which address.

    {% reveal title="Show solution" %}

```console
[root@serverb web]# ss -tlnp | grep 8080
LISTEN 0      5          127.0.0.1:8080      0.0.0.0:*    users:(("python3",pid=679,fd=3))
```

    The local address is `127.0.0.1`: the loopback. Only programs on serverb itself can connect.
    {% /reveal %}
  {% /task %}

  {% task id="task-ed7cebfd87cb" title="Fix it and verify" %}
    Restart the web server so that it listens on all addresses (`--bind 0.0.0.0`). Check `ss` on serverb, then `curl` from servera.

    {% reveal title="Show solution" %}

```console
[root@serverb web]# pkill -f 'http.server 8080'
[root@serverb web]# nohup python3 -m http.server 8080 --bind 0.0.0.0 > /tmp/http.log 2>&1 &
[root@serverb web]# ss -tlnp | grep 8080
LISTEN 0      5            0.0.0.0:8080      0.0.0.0:*    users:(("python3",pid=708,fd=3))
[student@servera ~]$ curl -sS -m 5 http://serverb:8080/
hello from serverb
```
    {% /reveal %}
  {% /task %}

  {% task id="task-e77fdca4e4c7" title="Grade and finish" %}
    {% lab-finish exercise="sa-reach" grade=true servers=true /%}
  {% /task %}
{% /lab %}
