---
title: "Exercise: Two faults, one symptom"
seoTitle: "Two faults, one symptom (RHCSA Practice Exercise)"
description: "Hands-on RHCSA practice: two faults, one symptom. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 35
---

{% lead %}
A colleague has set up a web site on port 8085 serving `/srv/site`, and it does not work. Use the routine, step by step: the first fault stops the service from starting, and once that is fixed, a second one shows up.
{% /lead %}

{% lab
  objectives=["ch16.troubleshooting"]
  id="troubleshooting"
  title="Two faults, one symptom"
  exercise="sa-two-faults"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera"]
  outcomes=["Use the journal and the audit log to find a name_bind denial.","Fix the port and then the file label.","Verify the result in enforcing mode."] %}

  {% task id="task-ca0b7c73b438" title="Start the exercise" %}
    On workstation, start the exercise. It installs httpd and the audit tools on servera and builds the "hurried colleague's" site: a page moved in from `/tmp`, and Apache set to port 8085. httpd fails to start.

```console
[student@workstation ~]$ lab start sa-two-faults
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-796cb6ad962f" title="Symptom, then the service log" %}
    State the symptom in a sentence. Check `systemctl is-active httpd` and read the last lines of the service log.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# systemctl is-active httpd
failed
[root@servera ~]# journalctl -u httpd -n 6 --no-pager | cut -c40- | grep -E "AH|Permission|Failed"
httpd[1398]: (13)Permission denied: AH00072: make_sock: could not bind to address 0.0.0.0:8085
httpd[1398]: AH00015: Unable to open logs
systemd[1]: Failed to start The Apache HTTP Server.
```

    Symptom: "httpd should be running on port 8085, and it fails to start with *Permission denied* when binding the port." File permissions play no role in binding a port.
    {% /reveal %}
  {% /task %}

  {% task id="task-14f082c40ca1" title="Is it SELinux? What does the denial say?" %}
    Test with permissive mode (restart httpd, then go back to enforcing). Then find the denial and read what it says about the target.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# setenforce 0; systemctl restart httpd; systemctl is-active httpd; setenforce 1
active
[root@servera ~]# systemctl stop httpd
[root@servera ~]# grep AVC /var/log/audit/audit.log | tail -1 | cut -c1-330
type=AVC msg=audit(1791051028.901:70): avc:  denied  { name_bind } for  pid=1398 comm="httpd" src=8085 scontext=system_u:system_r:httpd_t:s0 tcontext=unconfined_u:object_r:unreserved_port_t:s0 tclass=tcp_socket permissive=0
[root@servera ~]# sealert -a /var/log/audit/audit.log 2>&1 | grep -E "^SELinux is preventing|semanage port" | head -2
SELinux is preventing /usr/sbin/httpd from name_bind access on the tcp_socket port 8085.
# semanage port -a -t PORT_TYPE -p tcp 8085
```

    It starts in permissive mode, so SELinux is the cause. `name_bind` on a `tcp_socket` whose target type is `unreserved_port_t`: httpd may only bind ports labelled for web use.
    {% /reveal %}
  {% /task %}

  {% task id="task-f03a999c3869" title="First fix: the port" %}
    Label TCP port 8085 with the web type, start httpd, and test the page.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# semanage port -a -t http_port_t -p tcp 8085
[root@servera ~]# systemctl restart httpd
[root@servera ~]# systemctl is-active httpd
active
[root@servera ~]# curl -s -o /dev/null -w "site:%{http_code}\n" http://localhost:8085/
site:403
```

    The service runs now, but the page returns 403: a second, different problem.
    {% /reveal %}
  {% /task %}

  {% task id="task-dfd1485b034e" title="Second fault: read the new denial" %}
    Look at the newest AVC record and the label of the page. Which command from this chapter fixes it, and why was it labelled that way?

    {% reveal title="Show solution" %}

```console
[root@servera ~]# grep AVC /var/log/audit/audit.log | tail -1 | cut -c1-330
type=AVC msg=audit(1791051038.280:82): avc:  denied  { open } for  pid=1438 comm="httpd" path="/srv/site/index.html" dev="sda2" ino=32370 scontext=system_u:system_r:httpd_t:s0 tcontext=unconfined_u:object_r:user_tmp_t:s0 tclass=file permissive=0
[root@servera ~]# ls -Z /srv/site/index.html
unconfined_u:object_r:user_tmp_t:s0 /srv/site/index.html
```

    The page is `user_tmp_t` because it was *moved* in from `/tmp`: `mv` keeps the label. The directory itself has no web rule either (it is `var_t`).
    {% /reveal %}
  {% /task %}

  {% task id="task-6d55dda7cd89" title="Second fix: the label, permanently" %}
    Add a file-context rule for `/srv/site` and everything below, apply it, and test. Then confirm that no new denial appears and that the system is enforcing.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# semanage fcontext -a -t httpd_sys_content_t "/srv/site(/.*)?"
[root@servera ~]# restorecon -Rv /srv/site
Relabeled /srv/site from unconfined_u:object_r:var_t:s0 to unconfined_u:object_r:httpd_sys_content_t:s0
Relabeled /srv/site/index.html from unconfined_u:object_r:user_tmp_t:s0 to unconfined_u:object_r:httpd_sys_content_t:s0
[root@servera ~]# curl -s http://localhost:8085/
<h1>Site OK</h1>
[root@servera ~]# getenforce
Enforcing
```
    {% /reveal %}
  {% /task %}

  {% task id="task-80ba98e0c20d" title="Review and clean up" %}
    List your local SELinux customisations, then remove them and the site.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# semanage port -l -C
SELinux Port Type              Proto    Port Number

http_port_t                    tcp      8085
[root@servera ~]# semanage fcontext -l -C
SELinux fcontext                                   type               Context

/srv/site(/.*)?                                    all files          system_u:object_r:httpd_sys_content_t:s0
[root@servera ~]# exit
[student@servera ~]$ exit
```

    (The lab image may list one more rule, for its own management agent: leave that one alone.) The review is the habit that matters: every customisation should be one you can name and explain.
    {% /reveal %}
  {% /task %}

  {% task id="task-6c87f915ab2c" title="Grade and finish" %}
    {% lab-finish exercise="sa-two-faults" grade=true servers=true /%}
  {% /task %}
{% /lab %}
