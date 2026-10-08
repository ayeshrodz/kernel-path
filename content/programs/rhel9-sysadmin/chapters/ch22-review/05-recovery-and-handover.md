---
title: Recovery and handover
seoTitle: "Linux Backup Restore and Handover Checklist"
description: "Restore data with ACLs and labels intact, prove it after a reboot and write a handover note. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 15
---

{% lead %}
A service is not finished when it works; it is finished when someone else can run it, and when you know it can be brought back. This lesson covers the two things that make the difference: a recovery you have actually tested, and a handover note that says what you did and what you did not check.
{% /lead %}

{% objectives %}
- Restore content from a backup into a staging area and replace only what is needed.
- Keep ACLs and SELinux labels through a backup and restore.
- Write a handover note and name the limits of your own testing.
{% /objectives %}

## A recovery you have tested

{% diagram ref="recovery" /%}

The backup from the build is made by a one-shot service run by a timer. Note the two extra options of `tar`:

```console
[root@servera ~]# systemctl start portal-backup.service; ls -l /srv/backups | tail -1
-rw-r--r--. 1 root root 461 Oct  3 20:32 portal.tar.gz
[root@servera ~]# tar -tzf /srv/backups/portal.tar.gz
portal/
portal/index.html
```

`--acls` stores the ACL entries and `--selinux` the labels. Without them, an archive of this content restores to files that the web server cannot read (the ACL for `apache` is gone, so the answer is 403). Now a fault: the page is replaced with wrong content, and a restore puts it right.

```console
[root@servera ~]# echo defaced > /srv/portal/index.html; curl -s localhost:8090
defaced
[root@servera ~]# mkdir /root/stage
[root@servera ~]# tar --acls --selinux -xzf /srv/backups/portal.tar.gz -C /root/stage
[root@servera ~]# cat /root/stage/portal/index.html
Portal status: OK
[root@servera ~]# ls -lZ /root/stage/portal/index.html
-rw-r-----+ 1 portaladm portal system_u:object_r:httpd_sys_content_t:s0 18 Oct  3 20:30 /root/stage/portal/index.html
[root@servera ~]# cp -a --preserve=all /root/stage/portal/index.html /srv/portal/index.html
[root@servera ~]# restorecon -v /srv/portal/index.html
[root@servera ~]# curl -s localhost:8090
Portal status: OK
```

The staging directory lets you check content, owner, ACL (`+`) and label before touching the live file; `restorecon` printing nothing means the label was already right. Then repeat the failing request from the real caller.

{% callout type="tip" title="Checksums help" %}
`sha256sum /srv/backups/portal.tar.gz` stored somewhere else lets you check later that the archive was not changed. The same idea works for the content (chapter 14).
{% /callout %}

Remember what makes a backup believable: it is copied off the machine it protects, a restore has been tried, and you know how long the restore takes. In this lab the archive stays on servera for simplicity; in real work copy it to another host (`rsync`, chapter 14).

## Try it

{% shell-practice ref="practice" /%}

## The handover note

Write the note while the details are fresh. Select a section:

{% diagram ref="handover" /%}

Record the commands with the condition they must meet ("prints `Enforcing`"), not invented fixed output. Keep passwords, keys and tokens out of the note.

## What next

You now know what a correct manual state looks like, and that is the basis for automation: the separate Ansible program of this site rebuilds exactly this kind of state from a description, and checks that it stays that way. Useful further topics: identity services, encrypted storage, monitoring, central logging, patching at scale, building images and high availability, depending on your role.

## Check your understanding

{% quiz id="quick" objectives=["ch22.handover"] ref="quick" /%}
