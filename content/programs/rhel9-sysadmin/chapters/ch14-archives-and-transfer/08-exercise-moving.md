---
title: "Exercise: Move a tree between servers"
kind: lab
minutes: 25
---

{% lead %}
Create data on servera, send it to serverb through a pipe, prove it arrived intact, then pull a copy to the workstation with rsync and check that nothing differs.
{% /lead %}

{% lab
  objectives=["ch14.transfer"]
  id="moving"
  title="Move a tree between servers"
  exercise="sa-moving"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera","serverb"]
  outcomes=["Stream a tar archive between hosts through ssh.","Verify a transfer with sha256sum.","Mirror with rsync and confirm identity with a dry run."] %}

  {% task id="task-ed923932f474" title="Start the exercise" %}
    On workstation, start the exercise. It creates `/tmp/arch/work/docs` with three small files on servera, and removes leftovers of an earlier run.

```console
[student@workstation ~]$ lab start sa-moving
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-9a52dcc13d7d" title="Stream it to serverb" %}
    Use a pipe of two `ssh` commands to create a gzip tar archive of `/tmp/arch/work` on servera and extract it directly into `/tmp/recv` on serverb. List what arrived.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh root@servera 'cd /tmp/arch && tar -czf - work' | ssh root@serverb 'mkdir -p /tmp/recv && tar -xzf - -C /tmp/recv && find /tmp/recv -type f | sort'
/tmp/recv/work/docs/a.txt
/tmp/recv/work/docs/c.txt
/tmp/recv/work/docs/d.txt
```
    {% /reveal %}
  {% /task %}

  {% task id="task-9528a77ab2dc" title="Prove it" %}
    Compute the checksums of the three files on servera, save them on workstation, and verify them on serverb.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh root@servera 'cd /tmp/arch/work && sha256sum docs/*' > sums.txt
[student@workstation ~]$ ssh root@serverb 'cd /tmp/recv/work && sha256sum -c -' < sums.txt
docs/a.txt: OK
docs/c.txt: OK
docs/d.txt: OK
```
    {% /reveal %}
  {% /task %}

  {% task id="task-4dc7039be88c" title="Damage and detect" %}
    On serverb change one of the files, then verify again. Which file fails?

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh root@serverb 'echo oops >> /tmp/recv/work/docs/c.txt'
[student@workstation ~]$ ssh root@serverb 'cd /tmp/recv/work && sha256sum -c -' < sums.txt
docs/a.txt: OK
docs/c.txt: FAILED
docs/d.txt: OK
sha256sum: WARNING: 1 computed checksum did NOT match
```
    {% /reveal %}
  {% /task %}

  {% task id="task-f8c1d4dc1911" title="Pull a copy with rsync and compare" %}
    Pull `/tmp/arch/work/` from servera into `~/xfer/work/` on workstation with `rsync -aHAX`. Then run `rsync -avc --dry-run` for the same pair. What does an empty file list mean?

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ mkdir -p ~/xfer/work
[student@workstation ~]$ rsync -aHAX root@servera:/tmp/arch/work/ ~/xfer/work/
[student@workstation ~]$ rsync -avc --dry-run root@servera:/tmp/arch/work/ ~/xfer/work/ | tail -3

sent 21 bytes  received 185 bytes  412.00 bytes/sec
total size is 23  speedup is 0.11 (DRY RUN)
```

    No files were listed, so the content is identical to the source. Change a file in `~/xfer/work/docs/` and run the dry run again: the changed file is listed.
    {% /reveal %}
  {% /task %}

  {% task id="task-4031fbe4f4fd" title="Grade and finish" %}
    {% lab-finish exercise="sa-moving" grade=true servers=true /%}
  {% /task %}
{% /lab %}
