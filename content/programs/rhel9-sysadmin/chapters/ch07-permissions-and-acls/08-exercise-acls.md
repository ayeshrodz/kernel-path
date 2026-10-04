---
title: "Exercise: Give the auditors read access"
kind: lab
minutes: 25
---

{% lead %}
maria's quarterly report is private. The auditors must be able to read it, one new colleague must be able to read the folder, and nobody else may see anything. You will use ACLs for the exceptions, watch the mask at work, and set up inheritance for new files.
{% /lead %}

{% lab
  objectives=["ch07.acls"]
  id="acls"
  title="Give the auditors read access"
  exercise="sa-acls"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera"]
  outcomes=["Grant a group read access to one file with setfacl.","Explain an effective permission cut by the mask.","Set a default ACL so new files inherit access."] %}

  {% task id="task-fd5a39e536f0" title="Start the exercise" %}
    On workstation, start the exercise. It creates the group auditors (4800), the users priya (an auditor), maria and john, and the private report `/srv/reports/q3/summary.txt` that only maria can read.

```console
[student@workstation ~]$ lab start sa-acls
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-ea7177a7713e" title="Grant the group read access" %}
    Give the group `auditors` read-only access to `summary.txt`. Test as priya. Why does it still fail? Fix the missing part, then verify that priya can read but not write.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# setfacl -m g:auditors:r /srv/reports/q3/summary.txt
[root@servera ~]# su - priya -c 'cat /srv/reports/q3/summary.txt'
cat: /srv/reports/q3/summary.txt: Permission denied
[root@servera ~]# namei -l /srv/reports/q3/summary.txt
f: /srv/reports/q3/summary.txt
drwxr-xr-x root  root  /
drwxr-xr-x root  root  srv
drwx------ maria maria reports
drwx------ maria maria q3
-rw-r----- maria maria summary.txt
[root@servera ~]# setfacl -m g:auditors:rX /srv/reports /srv/reports/q3
[root@servera ~]# su - priya -c 'cat /srv/reports/q3/summary.txt'
figures
[root@servera ~]# su - priya -c 'echo no >> /srv/reports/q3/summary.txt'
-bash: line 1: /srv/reports/q3/summary.txt: Permission denied
```

    The file entry was right, but the directories on the path blocked priya. Directories need `x` for the group too: `rX` gives it to directories only.
    {% /reveal %}
  {% /task %}

  {% task id="task-381f6454e9d0" title="Read the ACL and the mask" %}
    Run `getfacl` on the file and on the directory `/srv/reports/q3`. Which is the mask on the file, and what does `ls -l` show in the group position?

    {% reveal title="Show solution" %}

```console
[root@servera ~]# getfacl /srv/reports/q3/summary.txt
getfacl: Removing leading '/' from absolute path names
# file: srv/reports/q3/summary.txt
# owner: maria
# group: maria
user::rw-
group::---
group:auditors:r--
mask::r--
other::---
[root@servera ~]# ls -l /srv/reports/q3/summary.txt
-rw-r-----+ 1 maria maria 8 Oct  3 16:14 /srv/reports/q3/summary.txt
```

    The mask is `r--`, and that is what `ls -l` shows in the group position, even though the owning group entry is `---`. The `+` flags the extra entries.
    {% /reveal %}
  {% /task %}

  {% task id="task-7d823446a66c" title="Watch the mask cut an entry" %}
    Give john `rw-` on the file, then lower the mask to `r--` with `setfacl -m m::r--`. Read the ACL again. What can john do?

    {% reveal title="Show solution" %}

```console
[root@servera ~]# setfacl -m u:john:rw summary.txt 2>/dev/null || setfacl -m u:john:rw /srv/reports/q3/summary.txt
[root@servera ~]# setfacl -m u:john:rX /srv/reports /srv/reports/q3
[root@servera ~]# setfacl -m m::r /srv/reports/q3/summary.txt
[root@servera ~]# getfacl -cp /srv/reports/q3/summary.txt
user::rw-
user:john:rw-	#effective:r--
group::---
group:auditors:r--
mask::r--
other::---
```

    john's entry still says `rw-`, but the mask makes the effective permission `r--`, so he can read and not write. Raise the mask again with `setfacl -m m::rw` to see it change.
    {% /reveal %}
  {% /task %}

  {% task id="task-dd7edc8a65bc" title="Inheritance for new files" %}
    As maria, with `umask 027`, create a file in the folder; show that the auditors cannot read it. Then set a default ACL on `/srv/reports/q3` for `auditors` (`rX`), and create another file. Compare the two files' ACLs.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# su - maria -c 'umask 027; touch /srv/reports/q3/before.txt'
[root@servera ~]# su - priya -c 'cat /srv/reports/q3/before.txt'
cat: /srv/reports/q3/before.txt: Permission denied
[root@servera ~]# setfacl -d -m g:auditors:rX /srv/reports/q3
[root@servera ~]# su - maria -c 'umask 027; echo data > /srv/reports/q3/after.txt'
[root@servera ~]# getfacl -cp /srv/reports/q3/after.txt
user::rw-
group::---
group:auditors:r-x	#effective:r--
mask::r--
other::---
[root@servera ~]# su - priya -c 'cat /srv/reports/q3/after.txt && echo readable'
data
readable
```

    The default ACL applies only to files created after it was set. `before.txt` is unchanged. (The `umask 027` keeps the files private to others, so the test is fair.)
    {% /reveal %}
  {% /task %}

  {% task id="task-003b9abd0039" title="Remove entries" %}
    Remove john's entry from the file with one command, then remove all extended ACL entries from the directory `/srv/reports/q3`.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# setfacl -x u:john /srv/reports/q3/summary.txt
[root@servera ~]# setfacl -b /srv/reports/q3
[root@servera ~]# ls -ld /srv/reports/q3
drwx------. 2 maria maria 4096 Oct  3 16:14 /srv/reports/q3
```

    The `+` disappears from `ls -l` once no extended entries remain. `-b` removes access and default entries together, so use it with care.
    {% /reveal %}
  {% /task %}

  {% task id="task-c35a2b6e4c9d" title="Grade and finish" %}
    {% lab-finish exercise="sa-acls" grade=true servers=true /%}
  {% /task %}
{% /lab %}
