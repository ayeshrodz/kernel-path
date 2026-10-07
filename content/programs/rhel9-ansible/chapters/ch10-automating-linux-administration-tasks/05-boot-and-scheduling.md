---
title: Managing the boot process and scheduled processes
seoTitle: "Ansible cron, at and Boot Targets"
description: "Schedule jobs with the Ansible cron and at modules, and manage services, targets and reboots. Free RHCE (EX294) lesson with diagrams and practice."
kind: lesson
minutes: 12
---

{% lead %}
Some work runs on a timetable: nightly backups, log rotation, a report every Monday. Some needs a reboot, or a different boot target. Ansible manages cron and at jobs, services, the default target and reboots, and waits for a rebooted host to come back before it carries on.
{% /lead %}

{% objectives %}
- Schedule recurring jobs with `ansible.builtin.cron` and one-off jobs with `ansible.posix.at`.
- Start, stop and enable services.
- Set the default boot target, and reboot a host from a playbook.
{% /objectives %}

## Recurring jobs: cron

`ansible.builtin.cron` manages entries in a user's crontab. Build a schedule and see both the task and the line it writes:

{% cron-builder ref="cron-builder" /%}

```yaml
- name: Uptime is logged every five minutes
  ansible.builtin.cron:
    name: Log uptime
    user: devops
    minute: "*/5"
    job: uptime >> /home/devops/uptime.log
    state: present
```

The `name` is written into the crontab as a comment, `#Ansible: Log uptime`, and it is how the module recognises its entry on later runs. Change the `name` and you get a second job; keep it and change the schedule, and the existing line is updated. To remove a job, use the same `name` with `state: absent`.

| Argument | Meaning |
| --- | --- |
| `minute`, `hour`, `day`, `month`, `weekday` | The schedule; each defaults to `*` |
| `special_time` | `reboot`, `daily`, `weekly` and so on, instead of the five fields |
| `user` | Whose crontab |
| `cron_file` | Write to a file in `/etc/cron.d/` instead of a user's crontab |

A **system** cron job lives in a file of its own in `/etc/cron.d/`, and its lines name the user the job runs as. With `cron_file`, `user` sets that field instead of choosing a crontab:

```yaml
- name: Flush the application cache every day
  ansible.builtin.cron:
    name: Flush Bolt cache
    cron_file: flush_bolt
    user: root
    minute: "45"
    hour: "11"
    job: php ./app/nut cache:clear
```

Never point `cron_file` at `/etc/crontab`: the module manages whole files, and that one belongs to the system.

## One-off jobs: at

`ansible.posix.at` schedules a command to run once, after a delay. The `atd` service must be installed and running:

```yaml
- name: at is installed
  ansible.builtin.dnf:
    name: at
    state: present

- name: atd is running
  ansible.builtin.service:
    name: atd
    state: started
    enabled: true

- name: A one-off job runs in 20 minutes
  ansible.posix.at:
    command: date > /tmp/at-was-here
    count: 20
    units: minutes
    unique: true
```

`unique: true` stops a second run of the playbook from queueing the same job again.

{% variant name="homelab" %}
The lab's Rocky Linux image does not include `at`, so install it first, as above. On a standard RHEL server it is usually already there.
{% /variant %}

## Services

`ansible.builtin.service` (or `ansible.builtin.systemd`, for systemd-specific options) controls services:

```yaml
- name: httpd is running and starts at boot
  ansible.builtin.service:
    name: httpd
    state: started
    enabled: true
```

| `state` | Result |
| --- | --- |
| `started` / `stopped` | Running or not; nothing happens if it already is |
| `restarted` | Always restarted: use in a handler, not a normal task |
| `reloaded` | Told to reread its configuration |

`ansible.builtin.systemd` adds `daemon_reload: true`, needed after you install or change a unit file, and `masked`.

`service` works with whatever init system the host uses; `systemd` only with systemd, but it can also manage **timers**, the systemd alternative to cron:

```yaml
- name: The dnf cache is no longer refreshed on a timer
  ansible.builtin.systemd:
    name: dnf-makecache.timer
    state: stopped
    enabled: false
```

## The default boot target

The default target decides what a host boots into: `multi-user.target` for a server console, `graphical.target` for a desktop. It is a symbolic link, so the `file` module sets it idempotently:

```yaml
- name: The system boots to the text console
  ansible.builtin.file:
    src: /usr/lib/systemd/system/multi-user.target
    dest: /etc/systemd/system/default.target
    state: link
```

The `systemd` module cannot set the default target. Another way, closer to what you would type by hand, runs `systemctl` and uses a condition to stay idempotent:

```yaml
- name: Get current boot target
  ansible.builtin.command:
    cmd: systemctl get-default
  changed_when: false
  register: target

- name: Set default boot target
  ansible.builtin.command:
    cmd: systemctl set-default {{ default_target }}
  when: default_target not in target['stdout']
```

A change of target takes effect at the next boot, which leads to reboots.

## Rebooting from a playbook

`ansible.builtin.reboot` reboots the host, **waits** for it to come back and answer again, and then continues with the next task:

```yaml
- name: The system boots to the text console
  ansible.builtin.file:
    src: /usr/lib/systemd/system/multi-user.target
    dest: /etc/systemd/system/default.target
    state: link
  notify: reboot

handlers:
  - name: reboot
    ansible.builtin.reboot:
      reboot_timeout: 300
```

As a handler it reboots only when something actually changed, and only once however many tasks notified it.

{% callout type="warning" title="Rebooting many hosts" %}
A play reboots every host in it at the same time. For a group that serves users, add `serial: 1` to the play (or a small number, or a percentage) so hosts are rebooted a few at a time.
{% /callout %}

{% quiz
  objectives=["ch10.scheduling"]
  id="check"
  title="Check your understanding"
  ref="check" /%}

## Takeaway

Schedule recurring jobs with `ansible.builtin.cron` and one-off jobs with `ansible.posix.at`. Use the chapter lab to check this on a real host.
