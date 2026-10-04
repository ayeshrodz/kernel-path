---
title: "Exercise: Restore and hand over"
kind: lab
minutes: 35
---

{% lead %}
Use the backup from the build to repair the wrong-content fault, see what a careless restore loses, and write the handover note for the portal.
{% /lead %}

{% lab
  objectives=["ch22.handover"]
  id="recovery"
  title="Restore and hand over"
  exercise="sa-portal-recovery"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera","serverb"]
  outcomes=["Restore into a staging directory and replace only the bad file.","Show what a restore without ACLs and labels loses.","Write the handover note."] %}

  {% task id="task-1c1640dedc53" title="Start the exercise" %}
    On workstation, start the exercise. It builds the finished portal on servera, with the daily backup service and timer from the build exercise, and runs the backup once.

```console
[student@workstation ~]$ lab start sa-portal-recovery
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-ed6fdaccaf4f" title="Damage the content" %}
    Replace the page with `defaced`, change its mode to 600, and remove its ACL. Which status code does the portal give?

    {% reveal title="Show solution" %}

```console
[root@servera ~]# echo defaced > /srv/portal/index.html; chmod 600 /srv/portal/index.html; setfacl -b /srv/portal/index.html
[root@servera ~]# curl -s -o /dev/null -w "HTTP %{http_code}\n" localhost:8090
HTTP 403
```
    {% /reveal %}
  {% /task %}

  {% task id="task-5ce451c370f3" title="A careless restore" %}
    Restore with a plain `tar -xzf` into a new staging directory `/root/bad`. What do `ls -lZ` and `getfacl` show for the restored page? What would a restore of that file give?

    {% reveal title="Show solution" %}

```console
[root@servera ~]# mkdir /root/bad; tar -xzf /srv/backups/portal.tar.gz -C /root/bad
[root@servera ~]# ls -lZ /root/bad/portal/index.html
-rw-r-----. 1 portaladm portal unconfined_u:object_r:admin_home_t:s0 18 Oct  3 20:30 /root/bad/portal/index.html
[root@servera ~]# getfacl -cp /root/bad/portal/index.html | grep -c apache
0
```

    The archive was made with `--acls --selinux`, but a plain extract ignores them. Root keeps the owner and group, yet the `+` is gone, so the ACL entry for `apache` is lost, and the label comes from the staging directory in root's home (`admin_home_t`). Copied into place, this file would give the web server a 403 again.
    {% /reveal %}
  {% /task %}

  {% task id="task-613015b65e1c" title="The proper restore" %}
    Restore with the right options into `/root/stage`, check the page, owner, ACL and label there, copy it back with all attributes, apply `restorecon`, and repeat the failing request from serverb.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# mkdir /root/stage; tar --acls --selinux -xzf /srv/backups/portal.tar.gz -C /root/stage
[root@servera ~]# ls -lZ /root/stage/portal/index.html
-rw-r-----+ 1 portaladm portal system_u:object_r:httpd_sys_content_t:s0 18 Oct  3 20:30 /root/stage/portal/index.html
[root@servera ~]# cp -a --preserve=all /root/stage/portal/index.html /srv/portal/index.html
[root@servera ~]# restorecon -v /srv/portal/index.html
[student@serverb ~]$ curl -sS -m 3 http://servera:8090/
Portal status: OK
```
    {% /reveal %}
  {% /task %}

  {% task id="task-33f8b92e9216" title="The handover note" %}
    Write `/root/portal-handover.txt` with the six sections of the lesson (purpose and hosts, changes, operation, backup and recovery, known failures, limits). Take the facts from the system with the evidence commands, not from memory.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# cat > /root/portal-handover.txt <<'EOT'
Portal handover
Purpose: internal status page on servera, port 8090, partner serverb only.
Software: httpd (rpm -q httpd), SELinux enforcing (getenforce prints Enforcing).
Changes: group portal 4800, account portaladm 3001; /srv/portal (2750, ACL for apache);
  /etc/httpd/conf.d/portal.conf; fcontext /srv/portal(/.*)? httpd_sys_content_t;
  port 8090 http_port_t; zone portal (source = serverb, port 8090/tcp);
  journald drop-in 10-persistent.conf; portal-backup.service and .timer.
Operate: systemctl status|restart httpd; journalctl -u httpd; curl http://servera:8090/
Recover: /srv/backups/portal.tar.gz (daily timer); restore with tar --acls --selinux
  into a staging directory, cp -a --preserve=all, restorecon -v, repeat the request.
Known failures: refused = httpd stopped; no route = zone lacks 8090/tcp; 403 = label or
  ACL; start fails with bind error = port label; 200 with wrong text = restore.
Limits: tested on a RHEL-compatible lab, one reboot; no subscription behaviour tested.
EOT
[root@servera ~]# wc -l /root/portal-handover.txt
12 /root/portal-handover.txt
```
    {% /reveal %}
  {% /task %}

  {% task id="task-74facf7bb787" title="Grade and finish" %}
    {% lab-finish exercise="sa-portal-recovery" grade=true servers=true /%}
  {% /task %}
{% /lab %}
