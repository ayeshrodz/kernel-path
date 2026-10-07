---
title: "File contexts: rules, restorecon and chcon"
seoTitle: "semanage fcontext, restorecon and chcon Explained"
description: "Fix SELinux file labels permanently with semanage fcontext and restorecon, and why chcon is temporary. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 25
---

{% lead %}
The most frequent SELinux problem in practice is a service that cannot read a directory you created, because the files have the wrong **type**. This lesson shows how a file gets its label, how to see what label it *should* have, and how to fix it so that the fix survives a relabel, a restore and a reboot.
{% /lead %}

{% objectives %}
- Explain how the policy's path rules decide the label of a file, and see the expected type with `matchpathcon`.
- Set a permanent label rule with `semanage fcontext` and apply it with `restorecon`.
- Explain why `chcon` is only temporary, and what `cp` and `mv` do to a label.
{% /objectives %}

## The scenario

You install the Apache web server (`dnf install httpd`), put a page in a new directory `/srv/web`, and point `DocumentRoot` at it. The page is world-readable, yet:

```console
[root@servera ~]# ls -Z /srv/web/index.html
unconfined_u:object_r:var_t:s0 /srv/web/index.html
[root@servera ~]# curl -s -o /dev/null -w "%{http_code}\n" http://localhost/
403
```

The file is labelled `var_t`, because the policy has a rule that labels everything below `/srv` that way. The web server's process type `httpd_t` is not allowed to read `var_t`; it is allowed to read `httpd_sys_content_t`, which is the label of `/var/www`. Ask the policy what a path should have:

```console
[root@servera ~]# matchpathcon /var/www/html/index.html /srv/web/index.html
/var/www/html/index.html	system_u:object_r:httpd_sys_content_t:s0
/srv/web/index.html	system_u:object_r:var_t:s0
```

## The permanent fix: a rule, then restorecon

{% diagram ref="fcontext-flow" /%}

```console
[root@servera ~]# semanage fcontext -a -t httpd_sys_content_t "/srv/web(/.*)?"
[root@servera ~]# semanage fcontext -l | grep /srv/web
/srv/web(/.*)?                                     all files          system_u:object_r:httpd_sys_content_t:s0
[root@servera ~]# restorecon -Rv /srv/web
Relabeled /srv/web from unconfined_u:object_r:var_t:s0 to unconfined_u:object_r:httpd_sys_content_t:s0
Relabeled /srv/web/index.html from unconfined_u:object_r:var_t:s0 to unconfined_u:object_r:httpd_sys_content_t:s0
[root@servera ~]# curl -s -o /dev/null -w "%{http_code}\n" http://localhost/
200
```

In the pattern `"/srv/web(/.*)?"`, `/srv/web` is the directory and `(/.*)?` means "and optionally a slash followed by anything": the directory plus everything below it. **Quote it**, so the shell does not touch the special characters. `semanage` is in the package `policycoreutils-python-utils`.

Useful variations: `semanage fcontext -l -C` lists only your own rules, `semanage fcontext -d "PATTERN"` deletes one, and `restorecon -Rnv PATH` previews what a relabel would change without doing it. Files created in `/srv/web` from now on get the label automatically.

## chcon: handy, but temporary

`chcon` sets a label directly on one file, with no rule behind it:

```console
[root@servera ~]# chcon -t user_home_t /srv/web/copy.html
[root@servera ~]# ls -Z /srv/web/copy.html
unconfined_u:object_r:user_home_t:s0 /srv/web/copy.html
[root@servera ~]# restorecon -v /srv/web/copy.html
Relabeled /srv/web/copy.html from unconfined_u:object_r:user_home_t:s0 to unconfined_u:object_r:httpd_sys_content_t:s0
```

The next `restorecon`, or a full relabel after an update or a reboot with `/.autorelabel`, puts the rule's label back. Use `chcon` to experiment; use `semanage fcontext` for the real fix.

## cp versus mv

How a file arrives in the directory matters:

{% diagram ref="cp-mv" /%}

```console
[root@servera ~]# cp /tmp/second.html /srv/web/copy.html
[root@servera ~]# mv /tmp/moved.html /srv/web/moved.html
[root@servera ~]# ls -Z /srv/web/copy.html /srv/web/moved.html
unconfined_u:object_r:httpd_sys_content_t:s0 /srv/web/copy.html
              unconfined_u:object_r:user_tmp_t:s0 /srv/web/moved.html
```

The copy is a new file and takes the label from the directory's rule; the moved file is the same file with its old `user_tmp_t` label, and the web server cannot read it. After moving files into a service directory, run `restorecon -R` on them.

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch16.contexts"] ref="quick" /%}
