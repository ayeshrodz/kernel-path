---
title: "Exercise: SELinux review"
kind: lab
minutes: 40
---

{% lead %}
Publish a small portal on a non-standard port with SELinux enforcing: set up the web server, hit the denials one by one, and fix each one in the right way, without ever leaving enforcing mode.
{% /lead %}

{% lab
  objectives=["ch16.concepts","ch16.contexts","ch16.booleans","ch16.troubleshooting"]
  id="review"
  title="SELinux review"
  exercise="sa-selinux-review"
  ownExercise=true
  hosts=["workstation","servera"]
  outcomes=["Label a port and a directory tree for a service.","Set a boolean permanently.","Diagnose denials from the audit log."] %}
{% lab-notes %}

**Before you start:** reset the servers and complete this chapter's lessons. You work on **servera** as root (`sudo -i`); `lab start` and `lab grade` run on workstation. The grader checks the SELinux mode, the policy customisations you made, and that the portal answers.

{% /lab-notes %}

{% lab-challenge %}

On servera, keeping SELinux enforcing:

1. Install `httpd`, `audit` and `setroubleshoot-server`; start `auditd`; enable and start `httpd`.
2. Serve `/srv/portal` (with an `index.html` containing `Portal is up`) on TCP port **8090** only.
3. Fix the SELinux denials correctly: label port 8090, add a permanent file-context rule for `/srv/portal` and below and apply it, turn on `httpd_can_network_connect` permanently, and leave `httpd_enable_homedirs` off.
4. On workstation, fill in `answers.txt`.

{% /lab-challenge %}

  {% task id="task-b4a6e996bbf4" title="Start the exercise" %}

```console
[student@workstation ~]$ lab start sa-selinux-review
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ sudo -i
[root@servera ~]#
```
  {% /task %}

  {% task id="task-31c3968f6ac6" title="Install and configure httpd" %}

    {% reveal title="Show solution" %}

```console
[root@servera ~]# dnf install -y httpd audit setroubleshoot-server > /dev/null
[root@servera ~]# systemctl enable --now auditd
[root@servera ~]# mkdir -p /srv/portal
[root@servera ~]# echo "Portal is up" > /tmp/index.html && mv /tmp/index.html /srv/portal/
[root@servera ~]# sed -i 's/^Listen 80$/Listen 8090/' /etc/httpd/conf/httpd.conf
[root@servera ~]# cat > /etc/httpd/conf.d/portal.conf <<'EOT'
DocumentRoot "/srv/portal"
<Directory "/srv/portal">
    Require all granted
</Directory>
EOT
[root@servera ~]# systemctl enable --now httpd
Job for httpd.service failed because the control process exited with error code.
```

    The failure is expected: SELinux does not allow httpd on port 8090 yet.
    {% /reveal %}
  {% /task %}

  {% task id="task-87e94211649e" title="Fix the denials one at a time" %}

    {% reveal title="Show solution" %}

```console
[root@servera ~]# grep AVC /var/log/audit/audit.log | tail -1 | cut -c1-250
type=AVC msg=audit(...): avc:  denied  { name_bind } for  pid=1398 comm="httpd" src=8090 scontext=system_u:system_r:httpd_t:s0 tcontext=unconfined_u:object_r:unreserved_port_t:s0 tclass=tcp_socket permissive=0
[root@servera ~]# semanage port -a -t http_port_t -p tcp 8090
[root@servera ~]# systemctl restart httpd
[root@servera ~]# curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8090/
403
[root@servera ~]# semanage fcontext -a -t httpd_sys_content_t "/srv/portal(/.*)?"
[root@servera ~]# restorecon -Rv /srv/portal
[root@servera ~]# curl -s http://localhost:8090/
Portal is up
[root@servera ~]# setsebool -P httpd_can_network_connect on
[root@servera ~]# getsebool httpd_can_network_connect httpd_enable_homedirs
httpd_can_network_connect --> on
httpd_enable_homedirs --> off
[root@servera ~]# getenforce
Enforcing
```
    {% /reveal %}
  {% /task %}

  {% task id="task-b6866acf4bc6" title="Answers and grade" %}
    On workstation, fill in `answers.txt` (`ps -eZ | grep httpd` shows the process type), and grade:

    {% lab-finish exercise="sa-selinux-review" grade=true servers=true /%}
  {% /task %}
{% /lab %}
