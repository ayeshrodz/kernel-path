---
title: Check your Linux foundations
seoTitle: "Linux Skills You Need Before Learning Ansible"
description: "Check the Linux foundations Ansible assumes: shell, SSH, sudo, services and files. Free RHCE (EX294) lesson with diagrams and practice."
kind: lesson
minutes: 6
---

{% lead %}New to Ansible? You need a little Linux first. Use these five checks to find what to practise before your first real lab.{% /lead %}

## Five useful skills

| Skill | Try it | What you should understand |
| --- | --- | --- |
| SSH | `ssh devops@servera.lab.example.com hostname` | The command runs on the remote host. |
| Permissions | `ls -l /etc/passwd` | Who owns the file and who can read it. |
| Privilege escalation | `sudo id` | A permitted user can run a command as root. |
| Services | `systemctl is-active sshd` | A running service and an enabled service are different states. |
| Networking | `ip -br address` and `getent hosts servera.lab.example.com` | An address belongs to an interface; a name resolves to an address. |

Run these only after building the lab. Until then, answer the questions below. You can begin the browser activities immediately and return to the VM setup before a hands-on exercise.

{% quiz
  objectives=["ch02.automation","ch02.architecture","ch02.distributions","ch02.runtime"]
  id="linux-foundations"
  ref="linux-foundations" /%}

## Choose your next step

If these ideas are familiar, continue with [inventory](#/ch03/inventory). If they are new, try each check in the [practice lab](#/ch01), explain its output, and repeat without notes. You do not need to memorise every command before learning Ansible.
