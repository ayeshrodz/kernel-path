---
title: "Exercise: Find six faults"
kind: lab
minutes: 45
---

{% lead %}
The portal from the previous exercise works. You will break it six ways, one at a time, read each symptom from the client, find the layer, fix it, and prove that the original request works again. Repair every fault before starting the next.
{% /lead %}

{% lab
  objectives=["ch22.faults"]
  id="faults"
  title="Find six faults"
  exercise="sa-portal-faults"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera","serverb"]
  outcomes=["Map each symptom to one layer.","Repair with one change and repeat the failing request.","Keep the other requirements intact."] %}

  {% task id="task-956de9dc6ae5" title="Start the exercise" %}
    On workstation, start the exercise. It builds the finished portal of the previous exercise on servera: account, content with ACL, labels, httpd on port 8090 and the firewall zone for serverb.

```console
[student@workstation ~]$ lab start sa-portal-faults
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-671ba214e616" title="The test request" %}
    Make the portal from the previous exercise work again if needed. Then define your test: on serverb, `curl -sS -m 3 -o /dev/null -w "HTTP %{http_code}\n" http://servera:8090/` must print `HTTP 200`.

    {% reveal title="Show solution" %}

```console
[student@serverb ~]$ curl -sS -m 3 -o /dev/null -w "HTTP %{http_code}\n" http://servera:8090/
HTTP 200
```
    {% /reveal %}
  {% /task %}

  {% task id="task-020c1e76a7dc" title="Fault 1: the daemon is stopped" %}
    On servera stop `httpd`. What does serverb see? Which two commands on servera confirm the cause? Fix it.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# systemctl stop httpd
[student@serverb ~]$ curl -sS -m 3 -o /dev/null -w "HTTP %{http_code}\n" http://servera:8090/
curl: (7) Failed to connect to servera port 8090: Connection refused
HTTP 000
[root@servera ~]# systemctl is-active httpd; ss -tln | grep -c 8090
inactive
0
[root@servera ~]# systemctl start httpd
```

    "Refused" means the packet arrived and nothing listened.
    {% /reveal %}
  {% /task %}

  {% task id="task-9ec741d4aaf2" title="Fault 2: the firewall rule is gone" %}
    Remove the port from the zone `portal` (permanently, then reload). Which request still works, and which fails? Confirm with the zone listing and repair it.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# firewall-cmd --permanent --zone=portal --remove-port=8090/tcp; firewall-cmd --reload
success
success
[root@servera ~]# curl -s localhost:8090
Portal status: OK
[student@serverb ~]$ curl -sS -m 3 -o /dev/null -w "HTTP %{http_code}\n" http://servera:8090/
curl: (7) Failed to connect to servera port 8090: No route to host
HTTP 000
[root@servera ~]# firewall-cmd --zone=portal --list-ports; firewall-cmd --get-zone-of-source=172.25.250.11
portal
[root@servera ~]# firewall-cmd --permanent --zone=portal --add-port=8090/tcp; firewall-cmd --reload
success
success
```

    The local request works (the daemon and content are fine) and the remote one is rejected, so the fault is in the network path.
    {% /reveal %}
  {% /task %}

  {% task id="task-4ea3043c06e4" title="Fault 3: the wrong label" %}
    Give the page the type `var_t` with `chcon -t var_t`. Which status code do you get? Which command shows the cause, and which one repairs it permanently, using the mapping you stored?

    {% reveal title="Show solution" %}

```console
[root@servera ~]# chcon -t var_t /srv/portal/index.html
[root@servera ~]# curl -s -o /dev/null -w "HTTP %{http_code}\n" localhost:8090
HTTP 403
[root@servera ~]# ls -lZ /srv/portal/index.html
-rw-r-----+ 1 portaladm portal system_u:object_r:var_t:s0 18 Oct  3 20:30 /srv/portal/index.html
[root@servera ~]# restorecon -v /srv/portal/index.html
Relabeled /srv/portal/index.html from system_u:object_r:var_t:s0 to system_u:object_r:httpd_sys_content_t:s0
[root@servera ~]# curl -s -o /dev/null -w "HTTP %{http_code}\n" localhost:8090
HTTP 200
```
    {% /reveal %}
  {% /task %}

  {% task id="task-640d3c9a4311" title="Fault 4: the ACL is lost" %}
    Remove all ACL entries from the page (`setfacl -b`). The label is fine; what do you get, and how does `ls -l` differ from before? Restore the entry for `apache`.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# setfacl -b /srv/portal/index.html
[root@servera ~]# curl -s -o /dev/null -w "HTTP %{http_code}\n" localhost:8090
HTTP 403
[root@servera ~]# ls -lZ /srv/portal/index.html
-rw-r-----. 1 portaladm portal system_u:object_r:httpd_sys_content_t:s0 18 Oct  3 20:30 /srv/portal/index.html
[root@servera ~]# getfacl -cp /srv/portal/index.html
user::rw-
group::r--
other::---

[root@servera ~]# setfacl -m u:apache:r /srv/portal/index.html
[root@servera ~]# curl -s -o /dev/null -w "HTTP %{http_code}\n" localhost:8090
HTTP 200
```

    The `+` after the mode (an ACL is present) is gone, and with it the access of `apache`. Same 403 as the label fault, different cause: that is why you check both.
    {% /reveal %}
  {% /task %}

  {% task id="task-2ee4f53f3289" title="Fault 5: the port label is missing" %}
    Remove the port label (`semanage port -d -t http_port_t -p tcp 8090`) and restart httpd. Read the journal, and repair it.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# semanage port -d -t http_port_t -p tcp 8090
[root@servera ~]# systemctl restart httpd
Job for httpd.service failed because the control process exited with error code.
[root@servera ~]# systemctl is-active httpd
failed
[root@servera ~]# journalctl -u httpd --no-pager | grep "could not bind" | tail -1 | cut -c40-170
 httpd[1055]: (13)Permission denied: AH00072: make_sock: could not bind to address [::]:8090
[root@servera ~]# semanage port -a -t http_port_t -p tcp 8090
[root@servera ~]# systemctl restart httpd; systemctl is-active httpd
active
```
    {% /reveal %}
  {% /task %}

  {% task id="task-d2a7f943e180" title="Fault 6: the wrong content" %}
    Overwrite the page with `Portal status: DOWN`. What status does the request return? Why is this the hardest fault to notice?

    {% reveal title="Show solution" %}

```console
[root@servera ~]# echo "Portal status: DOWN" > /srv/portal/index.html
[student@serverb ~]$ curl -sS -m 3 http://servera:8090/ -w "HTTP %{http_code}\n"
Portal status: DOWN
HTTP 200
```

    Every layer works and the status code is 200. Only a check of the content (or a comparison with the backup) notices. The next exercise restores it.
    {% /reveal %}
  {% /task %}

  {% task id="task-4ee76f1fbd21" title="Grade and finish" %}
    {% lab-finish exercise="sa-portal-faults" grade=true servers=true /%}
  {% /task %}
{% /lab %}
