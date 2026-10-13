---
title: "Exercise: Find four faults"
seoTitle: "Find four faults (RHCSA Practice Exercise)"
description: "Hands-on RHCSA practice: find four faults. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 30
---

{% lead %}
A web server on servera answers on port 80. You will break it four different ways, read each symptom from serverb, and find the layer that is responsible. This is the order of work to use whenever a service "does not connect".
{% /lead %}

{% lab
  objectives=["ch20.diagnosis"]
  id="diagnosis"
  title="Find four faults"
  exercise="sa-fw-diagnosis"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera","serverb"]
  outcomes=["Match each client symptom to a layer.","Use ss, firewall-cmd and the journal to confirm the cause.","Fix each fault at the right layer."] %}

  {% task id="task-13eced3e5d26" title="Start the exercise" %}
    On workstation, start the exercise. It installs httpd on servera with the page `hello from servera`, starts it and allows http in the firewall.

```console
[student@workstation ~]$ lab start sa-fw-diagnosis
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-e270a5c4b302" title="Fault 1: the service is stopped" %}
    Stop `httpd` on servera. What does serverb see? Which of the four layers shows it, and which command? Fix it.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# systemctl stop httpd
[student@serverb ~]$ curl -sS -m 3 http://servera/
curl: (7) Failed to connect to servera port 80: Connection refused
[root@servera ~]# systemctl is-active httpd; ss -tln | grep -c ':80 '
inactive
0
[root@servera ~]# systemctl start httpd
```

    "Refused": the packet reached servera (the firewall let it through) and nothing was listening.
    {% /reveal %}
  {% /task %}

  {% task id="task-66735884dfa8" title="Fault 2: the firewall rule is missing" %}
    Remove `http` permanently (and reload). What does serverb see now? Confirm from servera which zone judges serverb and what it allows, then repair the rule.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# firewall-cmd --permanent --remove-service=http; firewall-cmd --reload
success
success
[student@serverb ~]$ curl -sS -m 3 http://servera/
curl: (7) Failed to connect to servera port 80: No route to host
[root@servera ~]# systemctl is-active httpd; firewall-cmd --get-zone-of-source=172.25.250.11; firewall-cmd --list-services
active
no zone
cockpit dhcpv6-client ssh
[root@servera ~]# firewall-cmd --permanent --add-service=http; firewall-cmd --reload
success
success
```

    The service is active, so the layer to blame is the firewall: `no zone` for the source means the interface zone `public` is used, and it does not list http.
    {% /reveal %}
  {% /task %}

  {% task id="task-300ce5db4780" title="Fault 3: the client is dropped" %}
    Add serverb's address (`172.25.250.11`) to the `drop` zone permanently, reload, and test. What is different about this symptom? Find out why, and remove the entry.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# firewall-cmd --permanent --zone=drop --add-source=172.25.250.11; firewall-cmd --reload
success
success
[student@serverb ~]$ curl -sS -m 3 http://servera/
curl: (28) Connection timed out after 3001 milliseconds
[root@servera ~]# firewall-cmd --get-zone-of-source=172.25.250.11
drop
[root@servera ~]# firewall-cmd --permanent --zone=drop --remove-source=172.25.250.11; firewall-cmd --reload
success
success
```

    A timeout instead of an immediate error means the packets were discarded. The command `--get-zone-of-source` names the zone responsible.
    {% /reveal %}
  {% /task %}

  {% task id="task-5a5eb117c7ee" title="Fault 4: the port is not allowed to the daemon" %}
    Make httpd listen on port 82 (`Listen 82` in `/etc/httpd/conf.d/extra.conf`) and restart it. It fails to start although the firewall is irrelevant. Find the reason in the journal (a permission error binding the port points to SELinux, chapter 16), then fix both gates: the SELinux port label and the firewall port.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# echo "Listen 82" > /etc/httpd/conf.d/extra.conf
[root@servera ~]# systemctl restart httpd
Job for httpd.service failed because the control process exited with error code.
See "systemctl status httpd.service" and "journalctl -xeu httpd.service" for details.
[root@servera ~]# journalctl -u httpd --no-pager -n 6 | grep -m1 Permission | cut -d: -f4-
 (13)Permission denied: AH00072: make_sock: could not bind to address 0.0.0.0:82
[root@servera ~]# semanage port -a -t http_port_t -p tcp 82
[root@servera ~]# systemctl restart httpd; systemctl is-active httpd
active
[root@servera ~]# firewall-cmd --permanent --add-port=82/tcp; firewall-cmd --reload
success
success
[student@serverb ~]$ curl -s -m 3 http://servera:82/
hello from servera
```

    Two independent gates: the firewall opens the port to the network, and the SELinux label lets the daemon use it.
    {% /reveal %}
  {% /task %}

  {% task id="task-da8afc057516" title="Grade and finish" %}
    {% lab-finish exercise="sa-fw-diagnosis" grade=true servers=true /%}
  {% /task %}
{% /lab %}
