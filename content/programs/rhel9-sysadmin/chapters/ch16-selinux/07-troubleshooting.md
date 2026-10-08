---
title: Troubleshooting SELinux denials
seoTitle: "Troubleshoot SELinux Denials: AVC, ausearch, sealert"
description: "Find and fix SELinux denials from AVC messages with ausearch and sealert, without disabling SELinux. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 20
---

{% lead %}
Eventually something breaks and SELinux is the reason. The skill is not memorising every type and boolean, but following the same short routine each time: prove that SELinux is involved, read the denial, decide which of the three adjustments it calls for, change as little as possible, and test again with SELinux enforcing.
{% /lead %}

{% objectives %}
- Follow the five-step routine from symptom to verified fix.
- Read an AVC record: action, program, source and target contexts, class.
- Use `sealert` and the audit log, and know why a custom policy module is the last resort.
{% /objectives %}

## The routine

{% diagram ref="workflow" /%}

**1 · Is it SELinux?** A quick, safe experiment:

```console
[root@servera ~]# curl -s -o /dev/null -w "%{http_code}\n" http://localhost/moved.html
403
[root@servera ~]# setenforce 0; getenforce
Permissive
[root@servera ~]# curl -s -o /dev/null -w "%{http_code}\n" http://localhost/moved.html
200
[root@servera ~]# setenforce 1; getenforce
Enforcing
```

It works in permissive mode, so SELinux was blocking. (If it fails the same way, SELinux is *not* the problem, and you save yourself an hour. Always switch back.)

**2 · Read the denial.** Denials are logged by the audit daemon (`auditd`) in `/var/log/audit/audit.log` as `AVC` records ("Access Vector Cache"):

```console
[root@servera ~]# grep AVC /var/log/audit/audit.log | tail -1 | cut -c1-260
type=AVC msg=audit(1791050803.921:146): avc:  denied  { open } for  pid=2279 comm="httpd" path="/srv/web/moved.html" dev="sda2" ino=32383 scontext=system_u:system_r:httpd_t:s0 tcontext=unconfined_u:object_r:user_tmp_t:s0 tclass=file permissive=0
```

{% diagram ref="avc" /%}

The same information in plain words comes from `sealert`, part of the `setroubleshoot-server` package:

```console
[root@servera ~]# sealert -a /var/log/audit/audit.log | head -6
found 2 alerts in /var/log/audit/audit.log
--------------------------------------------------------------------------------

SELinux is preventing /usr/sbin/httpd from open access on the file /srv/web/moved.html.

*****  Plugin catchall_labels (83.8 confidence) suggests   *******************
```

Each suggestion lists commands to try, with a confidence. Read them, do not paste them blindly. `ausearch -m AVC -ts recent` is the classic search tool too (on this lab image add `-if /var/log/audit/audit.log`; without the auditd service running there is no audit log, and the denials end up only in the journal or the kernel messages).

**3 · Decide which kind.** Look at `tcontext` and `tclass`:

- A **file** with the wrong type → `semanage fcontext` + `restorecon`.
- A **port** (`tclass=tcp_socket`, `name_bind`, `unreserved_port_t`) → `semanage port`.
- A **feature** the policy has a switch for → `setsebool -P`.

**4 · Smallest fix.** One change, then test.

**5 · Test in enforcing mode,** and check the log for new denials. The job is done when the original action works *and* the machine is still enforcing.

## Custom policy modules: the last resort

If a legitimate program really needs something the policy does not allow, `audit2allow` can turn the denials into a policy module:

```console
# ausearch -c 'httpd' --raw | audit2allow -M my-httpd
# semodule -X 300 -i my-httpd.pp
```

This **adds permissions** the policy authors did not intend. Use it only after you have ruled out the label, boolean and port explanations, and read the generated rules (`my-httpd.te`) before installing. `semodule -l` lists installed modules, and `semodule -r NAME` removes one.

{% callout type="tip" title="dontaudit" %}
The policy deliberately hides some denials ("dontaudit" rules) that are harmless noise. If a program fails with no AVC at all, `semodule -DB` rebuilds the policy without those rules so everything is logged; `semodule -B` restores them. Rarely needed, but it explains the occasional "silent" denial.
{% /callout %}

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch16.troubleshooting"] ref="quick" /%}
