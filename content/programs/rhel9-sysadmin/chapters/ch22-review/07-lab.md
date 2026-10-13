---
title: "Exercise: Capstone review"
seoTitle: "Linux administration final review Practice Lab (RHCSA Exam Style)"
description: "Graded RHCSA exam-style lab on Linux administration final review: a challenge with requirements, hints and solutions, and a grader that checks your work on your own lab."
kind: lab
minutes: 60
---

{% lead %}
The same method, new constraints: deliver a read-only status page for the partner, with a different port, a second reader and a different group. Nothing here repeats the guided exercise word for word; decide which layers must change and prove each one.
{% /lead %}

{% lab
  objectives=["ch22.evidence","ch22.faults","ch22.handover"]
  id="review"
  title="Capstone review"
  exercise="sa-review-final"
  ownExercise=true
  hosts=["workstation","servera","serverb"]
  outcomes=["Deliver a service with proof for every layer.","Limit access to one caller and keep SELinux enforcing.","Add a persistent journal and a scheduled backup that keeps ACLs and labels."] %}
{% lab-notes %}

**Before you start:** reset the servers and complete the chapter's lessons and exercises. servera hosts the page and serverb is the partner. `lab start` and `lab grade` run on workstation. Finish by rebooting servera and grading again.

{% /lab-notes %}

{% lab-challenge %}

On servera:

1. Create the group `ops` (GID 4900) and the accounts `statusadm` (UID 3100, group `ops`, nologin) and `auditor` (UID 3101). Install and enable `httpd`.
2. `/srv/status` (statusadm:ops, 2750) holds `index.html` with `Status page: ready` (640). `apache` and `auditor` read through ACLs; new files inherit them.
3. httpd serves `/srv/status` on port **8095**. Store the content mapping and the port label; SELinux stays enforcing.
4. Zone `statuspartners` with serverb as source and `8095/tcp`; the default zone stays closed.
5. Persistent journal; `status-backup.service` and a daily, enabled `status-backup.timer` keeping ACLs and labels in `/srv/backups/status.tar.gz`. Run the backup once.
6. Test from serverb, reboot servera, test again.
7. On workstation, fill in `answers.txt`.

{% /lab-challenge %}

  {% task id="task-c793d634c897" title="Start the exercise" %}

```console
[student@workstation ~]$ lab start sa-review-final
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ sudo -i
[root@servera ~]#
```
  {% /task %}

  {% task id="task-b1dc8bef0c34" title="Identity, software, content" %}

    {% reveal title="Show solution" %}

```console
[root@servera ~]# groupadd -g 4900 ops
[root@servera ~]# useradd -u 3100 -g ops -s /sbin/nologin statusadm
[root@servera ~]# useradd -u 3101 auditor
[root@servera ~]# dnf install -y httpd > /dev/null
[root@servera ~]# install -d -o statusadm -g ops -m 2750 /srv/status
[root@servera ~]# echo "Status page: ready" > /srv/status/index.html
[root@servera ~]# chown statusadm:ops /srv/status/index.html; chmod 640 /srv/status/index.html
[root@servera ~]# setfacl -m u:apache:rX,u:auditor:rX /srv/status
[root@servera ~]# setfacl -d -m u:apache:rX,u:auditor:rX /srv/status
[root@servera ~]# setfacl -m u:apache:r,u:auditor:r /srv/status/index.html
```
    {% /reveal %}
  {% /task %}

  {% task id="task-95da6106518f" title="Service and labels" %}

    {% reveal title="Show solution" %}

```console
[root@servera ~]# cat > /etc/httpd/conf.d/status.conf <<'EOT'
Listen 8095
<VirtualHost *:8095>
    DocumentRoot /srv/status
    <Directory /srv/status>
        Require all granted
    </Directory>
</VirtualHost>
EOT
[root@servera ~]# semanage port -a -t http_port_t -p tcp 8095
[root@servera ~]# semanage fcontext -a -t httpd_sys_content_t "/srv/status(/.*)?"
[root@servera ~]# restorecon -Rv /srv/status
[root@servera ~]# systemctl enable --now httpd; curl -s localhost:8095
Status page: ready
```
    {% /reveal %}
  {% /task %}

  {% task id="task-af69981f0dfa" title="Network, journal and backup" %}

    {% reveal title="Show solution" %}

```console
[root@servera ~]# getent hosts serverb
172.25.250.11   serverb.lab.example.com
[root@servera ~]# firewall-cmd --permanent --new-zone=statuspartners; firewall-cmd --reload
success
success
[root@servera ~]# firewall-cmd --permanent --zone=statuspartners --add-source=172.25.250.11
success
[root@servera ~]# firewall-cmd --permanent --zone=statuspartners --add-port=8095/tcp; firewall-cmd --reload
success
success
[root@servera ~]# mkdir -p /etc/systemd/journald.conf.d /srv/backups
[root@servera ~]# printf '[Journal]\nStorage=persistent\n' > /etc/systemd/journald.conf.d/10-persistent.conf
[root@servera ~]# systemctl restart systemd-journald; journalctl --flush
[root@servera ~]# chmod 750 /srv/backups
[root@servera ~]# cat > /etc/systemd/system/status-backup.service <<'EOT'
[Unit]
Description=Back up the status page

[Service]
Type=oneshot
ExecStart=/usr/bin/tar --acls --selinux -czf /srv/backups/status.tar.gz -C /srv status
EOT
[root@servera ~]# cat > /etc/systemd/system/status-backup.timer <<'EOT'
[Unit]
Description=Daily status backup

[Timer]
OnCalendar=daily
Persistent=true

[Install]
WantedBy=timers.target
EOT
[root@servera ~]# systemctl daemon-reload; systemctl enable --now status-backup.timer
[root@servera ~]# systemctl start status-backup.service; tar -tzf /srv/backups/status.tar.gz
status/
status/index.html
```

    Use the address that `getent hosts serverb` shows on your lab.
    {% /reveal %}
  {% /task %}

  {% task id="task-4ddab80e48c6" title="Prove it, reboot, grade" %}

    {% reveal title="Show solution" %}

```console
[student@serverb ~]$ curl -s -m 3 http://servera:8095/
Status page: ready
[root@servera ~]# systemctl reboot
[student@serverb ~]$ sleep 60; curl -s -m 3 http://servera:8095/
Status page: ready
```

    Grade once before and once after the reboot.
    {% /reveal %}
  {% /task %}

  {% task id="task-324ae14d4e05" title="Grade" %}
    On workstation, fill in `answers.txt` and grade:

    {% lab-finish exercise="sa-review-final" grade=true servers=true /%}
  {% /task %}
{% /lab %}
