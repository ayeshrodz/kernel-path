---
title: "Assessment: Release a web service"
seoTitle: "Release a web service: RHCE Exam-Style Practice Lab"
description: "Graded RHCE exam-style lab on Ansible final review: a challenge with requirements, hints and solutions, and a grader that checks your work on your own lab."
kind: lab
minutes: 90
---

{% lead %}Turn a clean host into a repeatable web release. Combine inventory, variables, Vault, a role, templates, handlers, firewall rules, and recovery.{% /lead %}

{% assessment-timer id="release" /%}

## Brief

Use a clean **serverb** and the tools from chapter 1. Complete chapters 3–8 and the [archiving exercise](#/ch10/lab-archives) first. Save everything in `~/assessment-release`. Choose Challenge mode to work from requirements; keep documentation available. The default checkpoint is the finished deployment.

{% lab objectives=["ch04.vault","ch06.templates","ch08.role-create","ch11.composition","ch11.reusable-roles"] id="release" title="Release a web service" exercise="assessment-release" ownExercise=true hosts=["serverb.lab.example.com"] outcomes=["Deploy a reusable web role with protected variables.","Verify HTTP, archive recovery, repeatability, and reboot persistence."] %}
{% lab-notes %}

**Prerequisites:** Complete the prerequisite chapters named above. Use the specified clean host and work as student on workstation.

{% reveal title="Verify your work" %}

From the project directory, run the relevant home-lab check. For an exercise with several checkpoints, grade each state before changing or removing it:

```bash
lab grade assessment-release
```

The grader reads project files and host state. A passing report covers the listed checks; also perform the task’s independent connection, repeat-run, and reboot checks where requested.

{% /reveal %}

{% reveal title="Try an independent variation" %}

Deploy release-3 after recording the graded release-2 state. Prove the page and recovery copy agree.

Record the published result first. The grader checks the original requirements, so a changed name or value may intentionally fail those checks.

{% /reveal %}

{% /lab-notes %}

{% lab-challenge %}

Deliver a reproducible web release on serverb from `site.yml` in `~/assessment-release`.

- Connect as devops with sudo through project-local configuration. Role `release_web` must default `release_id` to `release-1`; the `release_hosts` group must override it to `release-2`.
- Encrypted `vault.yml` must hold disposable `release_token: practice-only`. The deployed `/etc/kernel-path/release-token` must be root-owned, mode `0600`, with its task output suppressed.
- Apache and firewalld must run and start at boot, with HTTP allowed persistently. Root-owned `/var/www/html/index.html` (mode `0644`) must identify the resolved release and inventory host.
- `/etc/httpd/conf.d/release.conf` must contain `ServerTokens Prod` and `ServerSignature Off`; changes must trigger a named restart handler in the role.
- `/srv/release-site.tar.gz` must contain the web-root contents. Restored `/srv/site-recovered/index.html` must match content, ownership, and mode.
- Verify from workstation, repeat the playbook, and check again after an explicit reboot.

{% /lab-challenge %}

{% task id="release-inventory" title="Prepare a reproducible project" %}
Use the `release_hosts` group from the starter inventory. Keep configuration local to the project, connect as devops with sudo, and create `site.yml` plus a role named `release_web`. Put `release_id: release-1` in the role defaults and override it to `release-2` in `group_vars/release_hosts/main.yml`.
{% /task %}
{% task id="release-vault" title="Protect the deployment token" %}
Create encrypted `vault.yml` with `release_token: practice-only`. Use `ansible-vault create` and a prompt; this token is a disposable exercise value. Load it from `site.yml`. Deploy it to `/etc/kernel-path/release-token`, owned by root with mode `0600`, and suppress task output with `no_log: true`.
{% reveal title="Hint: the two protections do different jobs" %}Vault protects the saved variable file. File permissions and `no_log` protect the destination and task output. Make the destination directory before copying the token.{% /reveal %}
{% /task %}
{% task id="release-role" title="Deploy the web role" %}
Install httpd and firewalld. Start and enable both services. Open HTTP immediately and persistently. Template `/var/www/html/index.html` with the resolved release ID and inventory host name; use root ownership and mode `0644`.
{% /task %}
{% task id="release-handler" title="Notify a configuration handler" %}
Deploy `/etc/httpd/conf.d/release.conf` with `ServerTokens Prod` and `ServerSignature Off`. Notify a named handler that restarts httpd when this file changes. Keep the role's tasks, handler, defaults, and template in their conventional directories.
{% /task %}
{% task id="release-recovery" title="Prove recovery" %}
Archive the web-root contents to `/srv/release-site.tar.gz`. Restore into `/srv/site-recovered`. Prove the restored `index.html` matches the served file, including owner and mode. Keep the recovery tasks in `site.yml` after the role.
{% reveal title="Hint: archive layout" %}A trailing slash in the archive source (`/var/www/html/`) stores its contents. Create the restore directory before extracting.{% /reveal %}
{% /task %}
{% task id="release-verify" title="Check independently and after reboot" %}
Fetch the page from workstation and confirm it contains `release-2` and `serverb.lab.example.com`. Run `lab grade assessment-release`. Repeat your playbook, investigate unexpected changes, then explicitly reboot serverb and rerun the checks. Mark this task complete only after checking all three stages.
{% /task %}
{% /lab %}

## Review your approach

Record one failure you diagnosed and how you verified its cause. For an independent variation, set `release_id` through an extra variable and explain which value wins. Use the [learning dashboard](#/progress) to import your grader report and revisit missed skills.

{% reveal title="One working solution" %}

Create the encrypted variable file with `ansible-vault create vault.yml`, enter the practice token, and write these files. Run `ansible-playbook site.yml --ask-vault-pass`. No password file is required.

```yaml {% title="site.yml" %}
- name: Release a web service
  hosts: release_hosts
  become: true
  vars_files: [vault.yml]
  roles: [release_web]
  post_tasks:
    - name: Create recovery directory
      ansible.builtin.file:
        path: /srv/site-recovered
        state: directory
        mode: '0755'
    - name: Archive the release
      community.general.archive:
        path: /var/www/html/
        dest: /srv/release-site.tar.gz
        format: gz
        mode: '0644'
    - name: Recover the release
      ansible.builtin.unarchive:
        src: /srv/release-site.tar.gz
        dest: /srv/site-recovered
        remote_src: true
        owner: root
        group: root
```

```yaml {% title="roles/release_web/defaults/main.yml" %}
release_id: release-1
```

```yaml {% title="group_vars/release_hosts/main.yml" %}
release_id: release-2
```

```yaml {% title="roles/release_web/tasks/main.yml" %}
- name: Install services
  ansible.builtin.dnf:
    name: [httpd, firewalld]
    state: present
- name: Enable services
  ansible.builtin.service:
    name: "{{ item }}"
    state: started
    enabled: true
  loop: [httpd, firewalld]
- name: Permit HTTP
  ansible.posix.firewalld:
    service: http
    state: enabled
    immediate: true
    permanent: true
- name: Publish the release page
  ansible.builtin.template:
    src: index.html.j2
    dest: /var/www/html/index.html
    owner: root
    group: root
    mode: '0644'
- name: Configure Apache
  ansible.builtin.copy:
    content: "ServerTokens Prod\nServerSignature Off\n"
    dest: /etc/httpd/conf.d/release.conf
    owner: root
    group: root
    mode: '0644'
  notify: Restart Apache
- name: Create token directory
  ansible.builtin.file:
    path: /etc/kernel-path
    state: directory
    owner: root
    group: root
    mode: '0700'
- name: Install deployment token
  ansible.builtin.copy:
    content: "{{ release_token }}\n"
    dest: /etc/kernel-path/release-token
    owner: root
    group: root
    mode: '0600'
  no_log: true
```

```yaml {% title="roles/release_web/handlers/main.yml" %}
- name: Restart Apache
  ansible.builtin.service:
    name: httpd
    state: restarted
```

```jinja {% title="roles/release_web/templates/index.html.j2" %}
Kernel Path {{ release_id }} on {{ inventory_hostname }}
```

The role default is overridden by group variables. The configuration handler runs only when notified; changing just the page does not need a restart. Compare file contents with `cmp`, permissions with `stat`, HTTP from workstation with `curl`, and persistent firewall rules with `firewall-cmd --permanent --query-service=http`.

{% /reveal %}
