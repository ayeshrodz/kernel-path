---
title: "Exercise: Get the permissions right"
kind: lab
minutes: 35
---

{% lead %}
See user IDs cross the network: a file created on the client, a user that exists only on the server, root being squashed, and a shared group directory that works the same on both machines because the numbers match.
{% /lead %}

{% lab
  objectives=["ch19.access"]
  id="permissions"
  title="Get the permissions right"
  exercise="sa-nfs-permissions"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera","serverb"]
  outcomes=["Show that NFS carries numeric IDs.","Make a user work on both sides with a matching UID.","Build a setgid group directory on a share."] %}

  {% task id="task-ee7f3e44c540" title="Start the exercise" %}
    On workstation, start the exercise. It installs nfs-utils, exports `/srv/shared` read-write from serverb to the lab network, starts the NFS server and opens the `nfs` firewall service.

```console
[student@workstation ~]$ lab start sa-nfs-permissions
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-49cd65115f6e" title="Make the share writable for student" %}
    The share must be exported read-write and mounted from the previous exercise (export `/srv/shared` read-write, firewall open, mounted on servera in `/mnt/shared`). On serverb, give the directory to `student`, who has UID 1000 on both machines. On servera, create a file as `student` in the share and list it by number and by name.

    {% reveal title="Show solution" %}

```console
[root@serverb ~]# chown student:student /srv/shared
[root@serverb ~]# ls -ld /srv/shared
drwxr-xr-x. 2 student student 38 Oct  3 18:47 /srv/shared
[root@servera ~]# mount -t nfs serverb:/srv/shared /mnt/shared
[root@servera ~]# su - student
[student@servera ~]$ id -u
1000
[student@servera ~]$ echo "from servera as student" > /mnt/shared/st.txt
[student@servera ~]$ ls -ln /mnt/shared
total 8
-rw-r--r--. 1    0    0 12 Oct  3 18:47 hello.txt
-rw-r--r--. 1 1000 1000 24 Oct  3 18:48 st.txt
```

    (`hello.txt` was created by root on the server, so it shows UID 0.) The same file on serverb belongs to `student`: `ls -l /srv/shared/st.txt` there prints `student student`, because UID 1000 is `student` on both.
    {% /reveal %}
  {% /task %}

  {% task id="task-6baf0d06afe2" title="A user that only the server knows" %}
    On serverb, create the user `alice` with UID 2001 and a directory `/srv/shared/alice` that she owns, with a file in it. On servera, look at the owner (by name and by number) and try to write into her directory as `student`.

    {% reveal title="Show solution" %}

```console
[root@serverb ~]# useradd -u 2001 alice
[root@serverb ~]# mkdir /srv/shared/alice; echo "alice's file" > /srv/shared/alice/note.txt
[root@serverb ~]# chown -R alice:alice /srv/shared/alice
[student@servera ~]$ ls -l /mnt/shared
total 12
drwxr-xr-x. 2    2001    2001 4096 Oct  3 18:48 alice
-rw-r--r--. 1 root    root      12 Oct  3 18:47 hello.txt
-rw-r--r--. 1 student student   24 Oct  3 18:48 st.txt
[student@servera ~]$ ls -ld /mnt/shared/alice
drwxr-xr-x. 2 2001 2001 4096 Oct  3 18:48 /mnt/shared/alice
[student@servera ~]$ cat /mnt/shared/alice/note.txt
alice's file
[student@servera ~]$ echo x > /mnt/shared/alice/hack.txt
-bash: /mnt/shared/alice/hack.txt: Permission denied
```

    servera has no user 2001, so only the number appears. Everyone may read the directory (755) but only UID 2001 may write.
    {% /reveal %}
  {% /task %}

  {% task id="task-2e0022647dc3" title="Give alice the same number on the client" %}
    On servera, create `alice` with the same UID 2001. What does `ls -l` show now? Write a file as alice from servera, and see who owns it on serverb.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# useradd -u 2001 alice
[root@servera ~]# ls -l /mnt/shared | grep alice
drwxr-xr-x. 2 alice   alice   4096 Oct  3 18:48 alice
[root@servera ~]# su - alice -c 'echo "written from servera" > /mnt/shared/alice/from-servera.txt; ls -l /mnt/shared/alice'
total 8
-rw-r--r--. 1 alice alice 21 Oct  3 18:50 from-servera.txt
-rw-r--r--. 1 alice alice 13 Oct  3 18:48 note.txt
[root@serverb ~]# ls -ln /srv/shared/alice
total 8
-rw-r--r--. 1 2001 2001 21 Oct  3 18:50 from-servera.txt
-rw-r--r--. 1 2001 2001 13 Oct  3 18:48 note.txt
```

    The data did not change: only servera's ability to translate the number into a name. Matching numbers is what makes the share behave.
    {% /reveal %}
  {% /task %}

  {% task id="task-930c95daf5c2" title="root is squashed" %}
    As root on servera, try to create a file in `/mnt/shared/alice`. Why does it fail? Check how `/etc/exports` shapes this.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# touch /mnt/shared/alice/rootfile
touch: cannot touch '/mnt/shared/alice/rootfile': Permission denied
[root@serverb ~]# exportfs -v | cut -c1-110
/srv/shared   	172.25.250.0/24(sync,wdelay,hide,no_subtree_check,sec=sys,rw,secure,root_squash,no_all_squash)
```

    `root_squash` turns client root into `nobody`, who has no write access in alice's directory. Becoming `alice` (`su - alice`) works; becoming root does not. Do not "fix" this with `no_root_squash` unless you fully trust every root on every client.
    {% /reveal %}
  {% /task %}

  {% task id="task-150954b5af02" title="A shared group directory" %}
    On **both** servers create the group `team` with GID 5000 and add `student` and `alice` to it. On serverb create `/srv/shared/team` owned by `root:team` with mode 2775. From servera, let both users create a file there and check the group of each file.

    {% reveal title="Show solution" %}

```console
[root@serverb ~]# groupadd -g 5000 team; usermod -aG team student; usermod -aG team alice
[root@servera ~]# groupadd -g 5000 team; usermod -aG team student; usermod -aG team alice
[root@serverb ~]# mkdir /srv/shared/team; chgrp team /srv/shared/team; chmod 2775 /srv/shared/team
[root@servera ~]# su - alice -c 'umask 002; echo a > /mnt/shared/team/by-alice.txt'
[root@servera ~]# su - student -c 'umask 002; echo s > /mnt/shared/team/by-student.txt'
[root@servera ~]# ls -ln /mnt/shared/team
total 8
-rw-rw-r--. 1 2001 5000 2 Oct  3 18:55 by-alice.txt
-rw-rw-r--. 1 1000 5000 2 Oct  3 18:55 by-student.txt
```

    The setgid bit gave both files the group 5000 (`team`), the umask gave the group write permission, and since GID 5000 is `team` on both machines, the group can edit each other's files. This is chapter 7's shared directory, carried over NFS by matching numbers.
    {% /reveal %}
  {% /task %}

  {% task id="task-d0c4c5654cc5" title="Grade and finish" %}
    {% lab-finish exercise="sa-nfs-permissions" grade=true servers=true /%}
  {% /task %}
{% /lab %}
