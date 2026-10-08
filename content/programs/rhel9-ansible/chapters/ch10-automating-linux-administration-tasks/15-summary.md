---
title: "Ansible Linux automation cheat sheet"
seoTitle: "Ansible Linux automation Cheat Sheet (RHCE)"
description: "Ansible Linux automation cheat sheet: the key commands and ideas on one page, with flashcards for revision. Free RHCE study notes."
kind: summary
minutes: 8
---

{% lead %}
The chapter on one page: one module per job in each of the five areas, and flashcards for quick revision.
{% /lead %}

## The chapter in seven sentences

- **`dnf`** installs, updates and removes packages; **`yum_repository`** and **`rpm_key`** configure where they come from; **`package_facts`** reports what is installed.
- **`group`**, **`user`** and **`authorized_key`** manage accounts and logins; sudo rules go in validated files in `/etc/sudoers.d/`.
- **`cron`** and **`at`** schedule work; **`service`** controls daemons; the default target is a link, and **`reboot`** waits for the host to come back.
- Storage is a stack: the **storage system role** builds it from `storage_pools` (volume groups and volumes, file systems, mounts, swap); the modules **`parted`**, **`lvg`**, **`lvol`**, **`filesystem`** and **`mount`** do it layer by layer.
- Network facts describe the configuration; the **network system role** (`network_connections`) or **`nmcli`** change it, preferably not on the interface Ansible is using.
- **`archive`** packs files on a managed host and **`unarchive`** restores them, from the control node or, with `remote_src: true`, from the host itself; check a restore by comparing content, owner and mode.
- Keep people, sizes and names in variables, so the tasks never change when the data does.

## Cheat sheet

{% tabs %}
  {% tab label="Software" %}

```yaml
- ansible.builtin.dnf:
    name: [httpd, "@Development Tools"]
    state: present                     # latest | absent
- ansible.builtin.rpm_key:
    key: /etc/pki/rpm-gpg/RPM-GPG-KEY-Rocky-9
- ansible.builtin.yum_repository:
    name: lab-crb
    description: Rocky Linux 9 CRB (lab)
    mirrorlist: https://mirrors.rockylinux.org/mirrorlist?arch=$basearch&repo=CRB-$releasever
    gpgcheck: true
    gpgkey: file:///etc/pki/rpm-gpg/RPM-GPG-KEY-Rocky-9
- ansible.builtin.package_facts:
```

  {% /tab %}
  {% tab label="Users" %}

```yaml
- ansible.builtin.group: { name: webdev }
- ansible.builtin.user:
    name: jane
    groups: webdev
    append: true
    password: "{{ pw | password_hash('sha512') }}"
    update_password: on_create
- ansible.posix.authorized_key:
    user: jane
    key: "{{ lookup('ansible.builtin.file', 'files/jane.pub') }}"
- ansible.builtin.copy:
    content: "%webdev ALL=(ALL) NOPASSWD: ALL\n"
    dest: /etc/sudoers.d/webdev
    mode: "0440"
    validate: /usr/sbin/visudo -cf %s
```

  {% /tab %}
  {% tab label="Boot and schedule" %}

```yaml
- ansible.builtin.cron:
    name: Log uptime                   # identifies the entry
    user: devops
    minute: "*/5"
    job: uptime >> /home/devops/uptime.log
- ansible.posix.at:
    command: date > /tmp/at-was-here
    count: 20
    units: minutes
    unique: true
- ansible.builtin.service: { name: httpd, state: started, enabled: true }
- ansible.builtin.file:
    src: /usr/lib/systemd/system/multi-user.target
    dest: /etc/systemd/system/default.target
    state: link
  notify: reboot                       # handler: ansible.builtin.reboot
```

  {% /tab %}
  {% tab label="Storage" %}

```yaml
- name: LVM with the storage role
  hosts: webservers
  roles:
    - name: redhat.rhel_system_roles.storage
      storage_pools:
        - name: apache-vg
          type: lvm
          disks: [/dev/vdb]
          volumes:
            - name: content-lv
              size: 512m
              mount_point: /var/www
              fs_type: xfs
              state: present
```

```yaml
- community.general.parted:
    device: /dev/sdb
    number: 1
    part_end: 1GiB
    flags: [lvm]
    state: present
- community.general.lvg: { vg: apps, pvs: /dev/sdb1 }
- community.general.lvol: { vg: apps, lv: data, size: 500m, resizefs: true }
- community.general.filesystem: { dev: /dev/apps/data, fstype: xfs }
- ansible.posix.mount:
    path: /srv/data
    src: /dev/apps/data
    fstype: xfs
    state: mounted
```

  {% /tab %}
  {% tab label="Network" %}

```yaml
- ansible.builtin.debug:
    var: ansible_facts['default_ipv4']
- community.general.nmcli:
    conn_name: lab-dummy0
    type: dummy
    ifname: dummy0
    ip4: 192.0.2.10/24
    state: present
- ansible.builtin.hostname: { name: web01.lab.example.com }
- ansible.posix.firewalld:
    service: https
    permanent: true
    immediate: true
    state: enabled
```

  {% /tab %}
  {% tab label="Archives" %}

```yaml
- name: Contents of /srv/release are packaged
  community.general.archive:
    path: /srv/release/          # trailing slash: contents only
    dest: /tmp/release.tar.gz
    format: gz

- name: Release is restored            # dest must already exist
  ansible.builtin.unarchive:
    src: /tmp/release.tar.gz
    dest: /srv/restored
    remote_src: true                   # archive is on the managed host
    owner: root
    group: root
```

  {% /tab %}
{% /tabs %}

{% flashcards
  title="Chapter 10 flashcards"
  ref="flashcards" /%}

{% callout type="exam" title="Speed drill" %}
In 25 minutes, one playbook for one host: a group and two users from a variables file with a hashed password; a sudo rule for the group; a 512 MiB logical volume with XFS mounted on `/srv/share`, group-owned; `httpd` installed and running with the `http` service open; a cron job every 15 minutes. Run it twice; the second run must show `changed=0`.
{% /callout %}
