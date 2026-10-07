---
title: "Exercise: One trusted host, a custom port and a forward"
seoTitle: "One trusted host, a custom port and a forward (RHCSA Practice Exercise)"
description: "Hands-on RHCSA practice: one trusted host, a custom port and a forward. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 35
---

{% lead %}
servera runs a web server on ports 80, 8080 and 9000. You will let only serverb in, give port 9000 a service name, forward 8081 to 8080, shut one host out, and read the log of what is rejected. Workstation plays the stranger.
{% /lead %}

{% lab
  objectives=["ch20.special"]
  id="special"
  title="One trusted host, a custom port and a forward"
  exercise="sa-fw-special"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera","serverb"]
  outcomes=["Build a source-based zone and test it from two hosts.","Create a custom service and a forward port.","Read rejected packets in the kernel log."] %}

  {% task id="task-1fe0885ae68c" title="Start the exercise" %}
    On workstation, start the exercise. It installs httpd on servera, serves the page `hello from servera` on ports 80, 8080 and 9000, and starts it.

```console
[student@workstation ~]$ lab start sa-fw-special
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-21c0703eb160" title="A zone for serverb" %}
    Create the permanent zone `lanonly` and reload. Give it serverb's address as a source (use `172.25.250.11`, or whatever `getent hosts serverb` shows on your lab) and the `http` service. Reload and check which zone handles serverb.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# firewall-cmd --permanent --new-zone=lanonly
success
[root@servera ~]# firewall-cmd --reload
success
[root@servera ~]# firewall-cmd --permanent --zone=lanonly --add-source=172.25.250.11
success
[root@servera ~]# firewall-cmd --permanent --zone=lanonly --add-service=http
success
[root@servera ~]# firewall-cmd --reload
success
[root@servera ~]# firewall-cmd --get-active-zones
lanonly
  sources: 172.25.250.11
public
  interfaces: enp1s0
[root@servera ~]# firewall-cmd --get-zone-of-source=172.25.250.11
lanonly
```
    {% /reveal %}
  {% /task %}

  {% task id="task-d84d7c5b928f" title="Two callers, two answers" %}
    Fetch `http://servera/` from serverb and from workstation, both with `curl -sS -m 3`.

    {% reveal title="Show solution" %}

```console
[student@serverb ~]$ curl -sS -m 3 http://servera/
hello from servera
[student@workstation ~]$ curl -sS -m 3 http://servera/
curl: (7) Failed to connect to servera port 80: No route to host
```

    The same service, but only the host with its own zone is let in.
    {% /reveal %}
  {% /task %}

  {% task id="task-9532e56e3b89" title="Read the rejections" %}
    Switch on `--set-log-denied=all`. Repeat the request from workstation and find the rejected packet in the kernel journal. Which zone rejected it, and from which address? Then switch logging off.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# firewall-cmd --set-log-denied=all
success
[student@workstation ~]$ curl -sS -m 3 http://servera/ 2>&1 | cut -c1-40
curl: (7) Failed to connect to servera p
[root@servera ~]# journalctl -k --no-pager | grep REJECT | tail -1 | cut -c1-140
Oct  3 19:57:58 servera.lab.example.com kernel: filter_IN_public_REJECT: IN=enp1s0 OUT= MAC=… SRC=172.25.250.9 DST=172.25.250.10 …
[root@servera ~]# firewall-cmd --set-log-denied=off
success
```

    The zone is `public` (`filter_IN_public_REJECT`) and the sender is workstation, `SRC=172.25.250.9`.
    {% /reveal %}
  {% /task %}

  {% task id="task-db61229934bf" title="Shut workstation out completely" %}
    Put workstation's address (`172.25.250.9`) in the `drop` zone, permanently, reload, and repeat the request from workstation. How does the failure differ from before?

    {% reveal title="Show solution" %}

```console
[root@servera ~]# firewall-cmd --permanent --zone=drop --add-source=172.25.250.9; firewall-cmd --reload
success
success
[student@workstation ~]$ curl -sS -m 3 http://servera/
curl: (28) Connection timed out after 3001 milliseconds
```

    Rejected traffic gets an immediate answer; dropped traffic gets none, so the client waits until its timeout. Remove it again with `--remove-source`.
    {% /reveal %}
  {% /task %}

  {% task id="task-d5f7cee4a731" title="Your own service, and a forward" %}
    Define the service `myapp` for `9000/tcp`, allow it in `lanonly`, and forward `8081` to `8080` in the same zone. Reload. From serverb test ports 9000, 8081 and 8080.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# firewall-cmd --permanent --zone=drop --remove-source=172.25.250.9
success
[root@servera ~]# firewall-cmd --permanent --new-service=myapp; firewall-cmd --permanent --service=myapp --add-port=9000/tcp
success
success
[root@servera ~]# firewall-cmd --permanent --zone=lanonly --add-service=myapp
success
[root@servera ~]# firewall-cmd --permanent --zone=lanonly --add-forward-port=port=8081:proto=tcp:toport=8080
success
[root@servera ~]# firewall-cmd --reload
success
[student@serverb ~]$ for p in 9000 8081 8080; do curl -sS -m 3 -o /dev/null -w "port $p -> %{http_code}\n" http://servera:$p/ 2>&1 | cut -c1-70; done
port 9000 -> 200
port 8081 -> 200
curl: (7) Failed to connect to servera port 8080: No route to host
port 8080 -> 000
```
    {% /reveal %}
  {% /task %}

  {% task id="task-3ef85d70ac21" title="A rich rule" %}
    Serve everyone in `lanonly` except for port 9000 for serverb itself: add a rich rule that rejects serverb on `9000/tcp`. Test port 9000 and port 80 from serverb. Look at the zone with `--list-all`.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# firewall-cmd --permanent --zone=lanonly --add-rich-rule='rule family="ipv4" source address="172.25.250.11" port port="9000" protocol="tcp" reject'
success
[root@servera ~]# firewall-cmd --reload
success
[student@serverb ~]$ for p in 80 9000; do curl -sS -m 3 -o /dev/null -w "port $p -> %{http_code}\n" http://servera:$p/ 2>&1 | cut -c1-70; done
port 80 -> 200
curl: (7) Failed to connect to servera port 9000: Connection refused
port 9000 -> 000
[root@servera ~]# firewall-cmd --zone=lanonly --list-all | grep -A1 "rich rules"
  rich rules: 
	rule family="ipv4" source address="172.25.250.11" port port="9000" protocol="tcp" reject
```

    The rich rule is checked before the allowed service, so it wins. The "Connection refused" is the reject action's own reply.
    {% /reveal %}
  {% /task %}

  {% task id="task-8e819d93d3fc" title="Grade and finish" %}
    {% lab-finish exercise="sa-fw-special" grade=true servers=true /%}
  {% /task %}
{% /lab %}
