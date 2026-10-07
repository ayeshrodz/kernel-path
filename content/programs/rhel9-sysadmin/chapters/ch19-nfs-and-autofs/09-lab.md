---
title: "Exercise: NFS and autofs review"
seoTitle: "NFS and autofs Practice Lab (RHCSA Exam Style)"
description: "Graded RHCSA exam-style lab on NFS and autofs: a challenge with requirements, hints and solutions, and a grader that checks your work on your own lab."
kind: lab
minutes: 40
---

{% lead %}
Serve two directories from serverb, mount one permanently on servera, write a file across the network, and give servera an on-demand, read-only view of the other with an autofs wildcard map.
{% /lead %}

{% lab
  objectives=["ch19.nfs","ch19.access","ch19.persistent","ch19.maps"]
  id="review"
  title="NFS and autofs review"
  exercise="sa-nfs-review"
  ownExercise=true
  hosts=["workstation","servera","serverb"]
  outcomes=["Export directories, start the server and open the firewall.","Mount an export permanently with fstab and _netdev.","Serve a read-only wildcard autofs map."] %}
{% lab-notes %}

**Before you start:** reset the servers and complete this chapter's lessons. serverb is the server and servera the client; `lab start` and `lab grade` run on workstation.

{% /lab-notes %}

{% lab-challenge %}

1. On both servers install `nfs-utils` if needed. On serverb, create `/srv/projects` (owned by student) and `/srv/archive/2025/notes.txt`.
2. Export `/srv/projects` read-write and `/srv/archive` read-only to your lab network.
3. Start and enable `nfs-server` and open the `nfs` firewall service permanently.
4. On servera, mount `serverb:/srv/projects` on `/mnt/projects` through fstab with `_netdev`.
5. As student on servera, write `written from servera` into `/mnt/projects/from-client.txt`.
6. On servera, install and enable autofs and serve `/remote/archive/KEY` from `serverb:/srv/archive/KEY` read-only with one wildcard line.
7. On workstation, fill in `answers.txt`.

{% /lab-challenge %}

  {% task id="task-f670f7b95863" title="Start the exercise" %}

```console
[student@workstation ~]$ lab start sa-nfs-review
```
  {% /task %}

  {% task id="task-9b07f3f5ca77" title="The server" %}

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh student@serverb
[student@serverb ~]$ sudo -i
[root@serverb ~]# dnf install -y nfs-utils > /dev/null
[root@serverb ~]# mkdir -p /srv/projects /srv/archive/2025
[root@serverb ~]# chown student:student /srv/projects
[root@serverb ~]# echo "old notes" > /srv/archive/2025/notes.txt
[root@serverb ~]# cat > /etc/exports <<'EOT'
/srv/projects  172.25.250.0/24(rw,sync)
/srv/archive   172.25.250.0/24(ro,sync)
EOT
[root@serverb ~]# systemctl enable --now nfs-server
[root@serverb ~]# firewall-cmd --permanent --add-service=nfs; firewall-cmd --reload
success
success
[root@serverb ~]# exportfs -v | cut -c1-55
/srv/projects 	172.25.250.0/24(sync,wdelay,hide,no_subtree_check,
/srv/archive  	172.25.250.0/24(sync,wdelay,hide,no_subtree_check,
```

    On the lab, replace the network with the one your servers use (`ip -br addr`); the lab's own network may differ from the printed one.
    {% /reveal %}
  {% /task %}

  {% task id="task-41c3b342d0b1" title="The permanent mount and a write" %}

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ sudo -i
[root@servera ~]# dnf install -y nfs-utils > /dev/null
[root@servera ~]# mkdir -p /mnt/projects
[root@servera ~]# echo 'serverb:/srv/projects  /mnt/projects  nfs  defaults,_netdev  0 0' >> /etc/fstab
[root@servera ~]# systemctl daemon-reload; mount -a
[root@servera ~]# findmnt /mnt/projects -o TARGET,SOURCE,FSTYPE
TARGET        SOURCE                FSTYPE
/mnt/projects serverb:/srv/projects nfs4
[root@servera ~]# su - student -c 'echo "written from servera" > /mnt/projects/from-client.txt'
[root@servera ~]# ls -l /mnt/projects
-rw-r--r--. 1 student student 21 Oct  3 19:20 from-client.txt
```
    {% /reveal %}
  {% /task %}

  {% task id="task-9382345d4ff5" title="autofs" %}

    {% reveal title="Show solution" %}

```console
[root@servera ~]# dnf install -y autofs > /dev/null
[root@servera ~]# echo '/remote/archive  /etc/auto.archive' > /etc/auto.master.d/archive.autofs
[root@servera ~]# echo '*  -ro,sync  serverb:/srv/archive/&' > /etc/auto.archive
[root@servera ~]# systemctl enable --now autofs
[root@servera ~]# cat /remote/archive/2025/notes.txt
old notes
[root@servera ~]# touch /remote/archive/2025/x
touch: cannot touch '/remote/archive/2025/x': Read-only file system
```
    {% /reveal %}
  {% /task %}

  {% task id="task-df9cf7463e73" title="Grade" %}
    On workstation, fill in `answers.txt` and grade:

    {% lab-finish exercise="sa-nfs-review" grade=true servers=true /%}
  {% /task %}
{% /lab %}
