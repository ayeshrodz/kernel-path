---
title: "Exercise: Deliver the portal"
kind: lab
minutes: 50
---

{% lead %}
Deliver the status portal on servera, one layer at a time, and prove each layer before the next. The portal answers on port 8090, shows `Portal status: OK`, and can be used only by serverb.
{% /lead %}

{% lab
  objectives=["ch22.evidence"]
  id="portal"
  title="Deliver the portal"
  exercise="sa-portal"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera","serverb"]
  outcomes=["Create the account, content, ACL, labels and port label.","Limit access to one caller with a firewall zone.","Add a persistent journal and a scheduled backup, then prove it after a reboot."] %}

  {% task id="task-adcd1b489fa1" title="Start the exercise" %}
    On workstation, start the exercise. It removes a portal of an earlier run from servera, so you start from a plain system.

```console
[student@workstation ~]$ lab start sa-portal
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-9e657e0b66c2" title="Identity and software" %}
    On servera as root create the group `portal` (GID 4800) and the account `portaladm` (UID 3001, primary group `portal`, shell `/sbin/nologin`). Install `httpd` and check both.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ sudo -i
[root@servera ~]# groupadd -g 4800 portal
[root@servera ~]# useradd -u 3001 -g portal -s /sbin/nologin portaladm
[root@servera ~]# id portaladm
uid=3001(portaladm) gid=4800(portal) groups=4800(portal)
[root@servera ~]# dnf install -y httpd > /dev/null
[root@servera ~]# rpm -q httpd
httpd-2.4.62-13.el9_8.6.x86_64
```
    {% /reveal %}
  {% /task %}

  {% task id="task-5431d3b56895" title="The content and the access" %}
    Create `/srv/portal` owned by `portaladm:portal` with mode 2750, and `index.html` with `Portal status: OK` (owner `portaladm`, group `portal`, mode 640). The web server runs as `apache`, which is neither the owner nor in the group: give it read access with an ACL on the directory, and a default ACL so that new files inherit it.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# install -d -o portaladm -g portal -m 2750 /srv/portal
[root@servera ~]# echo "Portal status: OK" > /srv/portal/index.html
[root@servera ~]# chown portaladm:portal /srv/portal/index.html; chmod 640 /srv/portal/index.html
[root@servera ~]# setfacl -m u:apache:rX /srv/portal
[root@servera ~]# setfacl -d -m u:apache:rX /srv/portal
[root@servera ~]# setfacl -m u:apache:r /srv/portal/index.html
[root@servera ~]# getfacl -cp /srv/portal | head -4
user::rwx
user:apache:r-x
group::r-x
mask::r-x
```
    {% /reveal %}
  {% /task %}

  {% task id="task-dca6067929ab" title="Configure httpd and read the failure" %}
    Create `/etc/httpd/conf.d/portal.conf` with a virtual host on port 8090 whose document root is `/srv/portal` (with `Require all granted` for that directory). Enable and start httpd. It fails: find the reason in the journal.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# cat > /etc/httpd/conf.d/portal.conf <<'EOT'
Listen 8090
<VirtualHost *:8090>
    DocumentRoot /srv/portal
    <Directory /srv/portal>
        Require all granted
    </Directory>
</VirtualHost>
EOT
[root@servera ~]# systemctl enable --now httpd
Job for httpd.service failed because the control process exited with error code.
[root@servera ~]# journalctl -u httpd --no-pager | grep "could not bind" | tail -1 | cut -c40-170
 httpd[1055]: (13)Permission denied: AH00072: make_sock: could not bind to address [::]:8090
```

    A permission error while binding a port is the SELinux port label, not the firewall.
    {% /reveal %}
  {% /task %}

  {% task id="task-e6cc6c30bf6b" title="Labels" %}
    Label port 8090 as `http_port_t`, and map `/srv/portal` and everything below it to `httpd_sys_content_t` permanently, then apply the mapping. Start httpd and request the page locally.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# semanage port -a -t http_port_t -p tcp 8090
[root@servera ~]# semanage fcontext -a -t httpd_sys_content_t "/srv/portal(/.*)?"
[root@servera ~]# restorecon -Rv /srv/portal
Relabeled /srv/portal from system_u:object_r:var_t:s0 to system_u:object_r:httpd_sys_content_t:s0
Relabeled /srv/portal/index.html from system_u:object_r:var_t:s0 to system_u:object_r:httpd_sys_content_t:s0
[root@servera ~]# systemctl enable --now httpd; systemctl is-active httpd
active
[root@servera ~]# curl -s localhost:8090
Portal status: OK
[root@servera ~]# getenforce
Enforcing
```
    {% /reveal %}
  {% /task %}

  {% task id="task-706cdfd84db4" title="Only the partner" %}
    From serverb the page does not load yet. Create the permanent zone `portal` that has serverb's address as its source and allows `8090/tcp`. Test from serverb and from workstation.

    {% reveal title="Show solution" %}

```console
[student@serverb ~]$ curl -sS -m 3 http://servera:8090/
curl: (7) Failed to connect to servera port 8090: No route to host
[root@servera ~]# firewall-cmd --permanent --new-zone=portal; firewall-cmd --reload
success
success
[root@servera ~]# firewall-cmd --permanent --zone=portal --add-source=172.25.250.11
success
[root@servera ~]# firewall-cmd --permanent --zone=portal --add-port=8090/tcp; firewall-cmd --reload
success
success
[student@serverb ~]$ curl -sS -m 3 http://servera:8090/
Portal status: OK
[student@workstation ~]$ curl -sS -m 3 http://servera:8090/
curl: (7) Failed to connect to servera port 8090: No route to host
```

    Use serverb's real address (`getent hosts serverb`) if your lab differs from the printed one. Both tests matter: the partner works, the stranger does not.
    {% /reveal %}
  {% /task %}

  {% task id="task-dc177d502efd" title="Logs and backup" %}
    Make the journal persistent with a drop-in, and write a one-shot service `portal-backup.service` plus the timer `portal-backup.timer` (daily, `Persistent=true`) that saves `/srv/portal` into `/srv/backups/portal.tar.gz`, keeping ACLs and labels. Run the service once and list the archive.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# mkdir -p /etc/systemd/journald.conf.d
[root@servera ~]# printf '[Journal]\nStorage=persistent\n' > /etc/systemd/journald.conf.d/10-persistent.conf
[root@servera ~]# systemctl restart systemd-journald; journalctl --flush; ls -d /var/log/journal
/var/log/journal
[root@servera ~]# mkdir -p /srv/backups; chmod 750 /srv/backups
[root@servera ~]# cat > /etc/systemd/system/portal-backup.service <<'EOT'
[Unit]
Description=Back up the portal content

[Service]
Type=oneshot
ExecStart=/usr/bin/tar --acls --selinux -czf /srv/backups/portal.tar.gz -C /srv portal
EOT
[root@servera ~]# cat > /etc/systemd/system/portal-backup.timer <<'EOT'
[Unit]
Description=Daily portal backup

[Timer]
OnCalendar=daily
Persistent=true

[Install]
WantedBy=timers.target
EOT
[root@servera ~]# systemctl daemon-reload; systemctl enable --now portal-backup.timer
Created symlink /etc/systemd/system/timers.target.wants/portal-backup.timer → /etc/systemd/system/portal-backup.timer.
[root@servera ~]# systemctl start portal-backup.service; tar -tzf /srv/backups/portal.tar.gz
portal/
portal/index.html
```
    {% /reveal %}
  {% /task %}

  {% task id="task-1585ca644cc3" title="Prove it after a reboot" %}
    Reboot servera. Without logging in to it, request the page from serverb and from workstation. Then log in and confirm the timer, the journal directory and enforcing mode.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# systemctl reboot
[student@serverb ~]$ sleep 60; curl -sS -m 3 http://servera:8090/
Portal status: OK
[student@workstation ~]$ curl -sS -m 3 http://servera:8090/
curl: (7) Failed to connect to servera port 8090: No route to host
[student@servera ~]$ sudo systemctl is-enabled portal-backup.timer; ls -d /var/log/journal; getenforce
enabled
/var/log/journal
Enforcing
```
    {% /reveal %}
  {% /task %}

  {% task id="task-90e051ce5e15" title="Grade and finish" %}
    {% lab-finish exercise="sa-portal" grade=true servers=true /%}
  {% /task %}
{% /lab %}
