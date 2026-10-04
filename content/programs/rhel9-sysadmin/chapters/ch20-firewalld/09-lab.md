---
title: "Exercise: Firewall review"
kind: lab
minutes: 40
---

{% lead %}
Publish a web server on servera so that only the partner serverb can use it, through a zone of its own, a service you define and a forwarded port. The default zone must stay closed, and everything must survive a reload.
{% /lead %}

{% lab
  objectives=["ch20.zones","ch20.stores","ch20.special","ch20.diagnosis"]
  id="review"
  title="Firewall review"
  exercise="sa-firewalld-review"
  ownExercise=true
  hosts=["workstation","servera","serverb"]
  outcomes=["Build a source zone with a service, a custom service and a forward port.","Keep the default zone closed.","Verify the result from the partner host."] %}
{% lab-notes %}

**Before you start:** reset the servers and complete this chapter's lessons. servera is the web server and serverb the partner; `lab start` and `lab grade` run on workstation.

{% /lab-notes %}

{% lab-challenge %}

On servera:

1. Install, start and enable `httpd`, with the home page `Welcome to servera`, listening also on ports 8080 and 9000.
2. Create the permanent zone `partners` with serverb's address as its source.
3. In `partners`, allow `http`, a new service `portal` for `9000/tcp`, and a forward of 8081 to 8080.
4. Keep `http`, 8080 and 9000 closed in the default zone.
5. Reload, then check from serverb with `curl`.
6. On workstation, fill in `answers.txt`.

{% /lab-challenge %}

  {% task id="task-3d663988dfb1" title="Start the exercise" %}

```console
[student@workstation ~]$ lab start sa-firewalld-review
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ sudo -i
[root@servera ~]#
```
  {% /task %}

  {% task id="task-55617c850416" title="The web server" %}

    {% reveal title="Show solution" %}

```console
[root@servera ~]# dnf install -y httpd > /dev/null
[root@servera ~]# echo "Welcome to servera" > /var/www/html/index.html
[root@servera ~]# printf 'Listen 8080\nListen 9000\n' > /etc/httpd/conf.d/extra.conf
[root@servera ~]# systemctl enable --now httpd 2>&1 | tail -1
Created symlink /etc/systemd/system/multi-user.target.wants/httpd.service → /usr/lib/systemd/system/httpd.service.
[root@servera ~]# curl -s localhost:9000
Welcome to servera
```
    {% /reveal %}
  {% /task %}

  {% task id="task-831089baaaeb" title="The zone, the service and the forward" %}

    {% reveal title="Show solution" %}

```console
[root@servera ~]# getent hosts serverb
172.25.250.11   serverb.lab.example.com
[root@servera ~]# firewall-cmd --permanent --new-zone=partners; firewall-cmd --reload
success
success
[root@servera ~]# firewall-cmd --permanent --zone=partners --add-source=172.25.250.11
success
[root@servera ~]# firewall-cmd --permanent --new-service=portal
success
[root@servera ~]# firewall-cmd --permanent --service=portal --add-port=9000/tcp
success
[root@servera ~]# firewall-cmd --permanent --zone=partners --add-service=http --add-service=portal
success
[root@servera ~]# firewall-cmd --permanent --zone=partners --add-forward-port=port=8081:proto=tcp:toport=8080
success
[root@servera ~]# firewall-cmd --reload
success
[root@servera ~]# firewall-cmd --zone=partners --list-all | grep -E "sources|services|forward-ports" -A1 | head -8
  sources: 172.25.250.11
  services: http portal
  ports: 
  protocols: 
  forward: no
  masquerade: no
  forward-ports: 
	port=8081:proto=tcp:toport=8080:toaddr=
```

    Use the address your lab shows, which may differ from the one printed here. `--add-service` can be repeated in one command.
    {% /reveal %}
  {% /task %}

  {% task id="task-fd81d45bec83" title="Check from the partner and the stranger" %}

    {% reveal title="Show solution" %}

```console
[student@serverb ~]$ for p in 80 9000 8081 8080; do curl -sS -m 3 -o /dev/null -w "port $p -> %{http_code}\n" http://servera:$p/ 2>&1 | cut -c1-70; done
port 80 -> 200
port 9000 -> 200
port 8081 -> 200
curl: (7) Failed to connect to servera port 8080: No route to host
port 8080 -> 000
[student@workstation ~]$ curl -sS -m 3 http://servera/
curl: (7) Failed to connect to servera port 80: No route to host
```
    {% /reveal %}
  {% /task %}

  {% task id="task-686e1f06ad46" title="Grade" %}
    On workstation, fill in `answers.txt` and grade:

    {% lab-finish exercise="sa-firewalld-review" grade=true servers=true /%}
  {% /task %}
{% /lab %}
