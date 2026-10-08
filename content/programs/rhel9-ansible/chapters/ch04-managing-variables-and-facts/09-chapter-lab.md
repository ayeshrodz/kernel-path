---
title: "Exercise: Managing variables and facts"
seoTitle: "Ansible variables and Vault Practice Lab (RHCE Exam Style)"
description: "Graded RHCE exam-style lab on Ansible variables and Vault: a challenge with requirements, hints and solutions, and a grader that checks your work on your own lab."
kind: lab
minutes: 35
---

{% lead %}
Put the whole chapter together: a play whose every name and path is a variable, a web page built from facts, and a test play that logs in with a password kept in a Vault-encrypted file. Try each task yourself before opening the solution.
{% /lead %}

A developer wants a web server on `serverb.lab.example.com` (in the `webserver` group) that protects its site with HTTP basic authentication. The `files` directory of `~/data-review` already contains:

- `httpd.conf`, an Apache configuration that enables basic authentication;
- `.htaccess`, which controls access to the document root;
- `htpasswd`, holding the credentials of permitted users.

Use these play variables:

| Variable | Value |
| --- | --- |
| `firewall_pkg` | `firewalld` |
| `firewall_svc` | `firewalld` |
| `web_pkg` | `httpd` |
| `web_svc` | `httpd` |
| `ssl_pkg` | `mod_ssl` |
| `httpdconf_src` | `files/httpd.conf` |
| `httpdconf_dest` | `/etc/httpd/conf/httpd.conf` |
| `htaccess_src` | `files/.htaccess` |
| `secrets_dir` | `/etc/httpd/secrets` |
| `secrets_src` | `files/htpasswd` |
| `secrets_dest` | `"{{ secrets_dir }}/htpasswd"` |
| `web_root` | `/var/www/html` |

Notice that `secrets_dest` is built from another variable.

{% lab
  objectives=["ch04.variables","ch04.vault","ch04.facts"]
  id="review"
  title="Managing variables and facts"
  exercise="data-review"
  hosts=["workstation","serverb.lab.example.com"]
  outcomes=["Define variables and use facts in a playbook, and use variables defined in an encrypted file."] %}
{% lab-notes %}

**Prerequisites:** Complete [control-node setup](#/ch01/control-node) and the preceding lessons in this chapter. Run commands as student on workstation unless a step names another machine.

{% reveal title="Verify your work" %}

From the project directory, run the relevant home-lab check. For an exercise with several checkpoints, grade each state before changing or removing it:

```bash
lab grade data-review
```

The grader reads project files and host state. A passing report covers the listed checks; also perform the task’s independent connection, repeat-run, and reboot checks where requested.

{% /reveal %}

{% reveal title="Try an independent variation" %}

Try an incorrect guest password in the verification play. Explain the HTTP response and restore the correct secret.

Record the published result first. The grader checks the original requirements, so a changed name or value may intentionally fail those checks.

{% /reveal %}

{% /lab-notes %}

{% lab-challenge %}

Deliver an authenticated HTTPS page on serverb from `playbook.yml`, using the variables and supplied configuration files described above.

- Install the web, firewall, and TLS packages. Apache and the firewall must run and start at boot; HTTPS must be allowed persistently.
- Configuration files must be root-owned, mode `0644`. The secrets directory must be apache-owned, mode `0500`; its password file and the web-root `.htaccess` must be apache-owned, mode `0400`.
- The index page must identify the host's FQDN and default IPv4 address using facts.
- A workstation play must retrieve it as `guest` using `web_pass` from encrypted `vars/secret.yml` (practice password `redhat`). The lab's self-signed certificate is expected.

{% /lab-challenge %}

  {% lab-setup variant="homelab" %}
    `files/httpd.conf` is Rocky's stock Apache configuration with one change: `AllowOverride AuthConfig` for the document root, so that `.htaccess` can require a login. `files/htpasswd` is generated on your workstation with one user, `guest`, password `redhat`.
  {% /lab-setup %}

  {% task id="task-baa87f70759f" legacyIndex=1 title="Start the play and its variables" %}
    In `~/data-review`, create `playbook.yml` with a play named `install and configure webserver with basic auth` for the `webserver` group, and define all the variables from the table.

    {% reveal title="Show solution" %}

```yaml
---
- name: install and configure webserver with basic auth
  hosts: webserver
  vars:
    firewall_pkg: firewalld
    firewall_svc: firewalld
    web_pkg: httpd
    web_svc: httpd
    ssl_pkg: mod_ssl
    httpdconf_src: files/httpd.conf
    httpdconf_dest: /etc/httpd/conf/httpd.conf
    htaccess_src: files/.htaccess
    secrets_dir: /etc/httpd/secrets
    secrets_src: files/htpasswd
    secrets_dest: "{{ secrets_dir }}/htpasswd"
    web_root: /var/www/html
```
    {% /reveal %}
  {% /task %}

  {% task id="task-40b08c71d240" legacyIndex=2 title="Install the packages" %}
    Add `tasks` and one task that installs the latest `firewall_pkg`, `web_pkg` and `ssl_pkg`.

    {% reveal title="Show solution" %}

```yaml
  tasks:
    - name: latest version of necessary packages installed
      ansible.builtin.dnf:
        name:
          - "{{ firewall_pkg }}"
          - "{{ web_pkg }}"
          - "{{ ssl_pkg }}"
        state: latest
```
    {% /reveal %}
  {% /task %}

  {% task id="task-cef4c99e072d" legacyIndex=3 title="Deploy the Apache configuration" %}
    Copy `httpdconf_src` to `httpdconf_dest`, owned by `root:root`, mode `0644`.

    {% reveal title="Show solution" %}

```yaml
    - name: configure web service
      ansible.builtin.copy:
        src: "{{ httpdconf_src }}"
        dest: "{{ httpdconf_dest }}"
        owner: root
        group: root
        mode: 0644
```
    {% /reveal %}
  {% /task %}

  {% task id="task-d88c9c2dac5a" legacyIndex=4 title="Create the secrets directory" %}
    Use `ansible.builtin.file` to create `secrets_dir`, owned by `apache:apache`, mode `0500`.

    {% reveal title="Show solution" %}

```yaml
    - name: secrets directory exists
      ansible.builtin.file:
        path: "{{ secrets_dir }}"
        state: directory
        owner: apache
        group: apache
        mode: 0500
```
    {% /reveal %}
  {% /task %}

  {% task id="task-b587159d1829" legacyIndex=5 title="Install the password file" %}
    Copy `secrets_src` to `secrets_dest`, owned by `apache:apache`, mode `0400`.

    {% reveal title="Show solution" %}

```yaml
    - name: htpasswd file exists
      ansible.builtin.copy:
        src: "{{ secrets_src }}"
        dest: "{{ secrets_dest }}"
        owner: apache
        group: apache
        mode: 0400
```
    {% /reveal %}
  {% /task %}

  {% task id="task-40318d27146d" legacyIndex=6 title="Install .htaccess in the document root" %}
    Copy `htaccess_src` to `{{ web_root }}/.htaccess`, owned by `apache:apache`, mode `0400`.

    {% reveal title="Show solution" %}

```yaml
    - name: .htaccess file installed in docroot
      ansible.builtin.copy:
        src: "{{ htaccess_src }}"
        dest: "{{ web_root }}/.htaccess"
        owner: apache
        group: apache
        mode: 0400
```
    {% /reveal %}
  {% /task %}

  {% task id="task-584ea28704ce" legacyIndex=7 title="Build index.html from facts" %}
    Create `{{ web_root }}/index.html` with the content `HOSTNAME (IPADDRESS) has been customized by Ansible.`, where HOSTNAME is the host's FQDN and IPADDRESS its default IPv4 address. Use `ansible.builtin.copy` with `content:`.

    {% reveal title="Show solution" %}

```yaml
    - name: create index.html
      ansible.builtin.copy:
        content: "{{ ansible_facts['fqdn'] }} ({{ ansible_facts['default_ipv4']['address'] }}) has been customized by Ansible.\n"
        dest: "{{ web_root }}/index.html"
```
    {% /reveal %}
  {% /task %}

  {% task id="task-6f5c50fc77c9" legacyIndex=8 title="Start the firewall, open HTTPS, start Apache" %}
    Three tasks: enable and start `firewall_svc`; permanently and immediately allow the `https` service in firewalld; enable and start `web_svc`.

    {% reveal title="Show solution" %}

```yaml
    - name: firewall service enabled and started
      ansible.builtin.service:
        name: "{{ firewall_svc }}"
        state: started
        enabled: true

    - name: open the port for the web server
      ansible.posix.firewalld:
        service: https
        state: enabled
        immediate: true
        permanent: true

    - name: web service enabled and started
      ansible.builtin.service:
        name: "{{ web_svc }}"
        state: started
        enabled: true
```
    {% /reveal %}
  {% /task %}

  {% task id="task-3f9eafae9edf" legacyIndex=9 title="Add a test play that uses a secret" %}
    Add a second play, `test web server with basic auth`, on `workstation`, without privilege escalation. Give it a play variable `web_user: guest`, and load `vars/secret.yml` with `vars_files` (you create that file next). Its tasks:
    1. request `https://serverb.lab.example.com` with `ansible.builtin.uri`, using basic authentication as `web_user` / `web_pass`, expecting status 200, and register the result as `auth_test`. serverb's certificate is not trusted, so turn off certificate validation;
    2. print `auth_test.content`.

    {% reveal title="Show solution" %}

```yaml
- name: test web server with basic auth
  hosts: workstation
  become: false
  vars:
    web_user: guest
  vars_files:
    - vars/secret.yml
  tasks:
    - name: connect to web server with basic auth
      ansible.builtin.uri:
        url: https://serverb.lab.example.com
        validate_certs: false
        force_basic_auth: true
        user: "{{ web_user }}"
        password: "{{ web_pass }}"
        return_content: true
        status_code: 200
      register: auth_test

    - ansible.builtin.debug:
        var: auth_test.content
```
    {% /reveal %}
  {% /task %}

  {% task id="task-23d9f57f129f" legacyIndex=10 title="Create the encrypted secret" %}
    Create `vars/secret.yml` with Ansible Vault, password `redhat`, containing `web_pass: redhat`.

```console
[student@workstation data-review]$ mkdir vars
[student@workstation data-review]$ ansible-vault create vars/secret.yml
New Vault password: redhat
Confirm New Vault password: redhat
```

```yaml {% title="vars/secret.yml (decrypted view)" %}
web_pass: redhat
```
  {% /task %}

  {% task id="task-08c7f598a53d" legacyIndex=11 title="Check the syntax, then run" %}

```console
[student@workstation data-review]$ ansible-navigator run -m stdout \
> --playbook-artifact-enable false \
> playbook.yml --syntax-check --vault-id @prompt
Vault password (default): redhat

playbook: /home/student/data-review/playbook.yml
[student@workstation data-review]$ ansible-navigator run -m stdout \
> --playbook-artifact-enable false \
> playbook.yml --vault-id @prompt
Vault password (default): redhat
...output omitted...
TASK [ansible.builtin.debug] ***************************************************
ok: [workstation] => {
    "auth_test.content": "serverb.lab.example.com (172.25.250.11) has been customized by Ansible.\n"
}

PLAY RECAP *********************************************************************
serverb.lab.example.com    : ok=10   changed=8    unreachable=0    failed=0  ...
workstation                : ok=3    changed=0    unreachable=0    failed=0  ...
```

    The content returned over HTTPS, after authenticating with the vaulted password, is the page you built from serverb's facts.
  {% /task %}

  {% task id="task-4dce4e5ad1cb" legacyIndex=12 title="Grade and finish" %}
    {% lab-finish exercise="data-review" grade=true /%}
  {% /task %}
{% /lab %}

{% callout type="note" title="true or yes?" %}
The course solution writes some booleans as `yes`/`no` and others as `true`/`false`. Ansible accepts both. Modern style guides and `ansible-lint` prefer `true`/`false`, which is what this guide uses.
{% /callout %}
