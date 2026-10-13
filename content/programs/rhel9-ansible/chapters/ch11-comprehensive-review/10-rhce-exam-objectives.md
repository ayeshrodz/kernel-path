---
title: "RHCE (EX294) exam objectives: a study map"
seoTitle: "RHCE EX294 Exam Objectives: Free Ansible Study Map"
description: "Every RHCE (EX294) objective area for RHEL 9 mapped to free Ansible lessons, exercises and labs. Use it as your RHCE study checklist and practice plan."
kind: lesson
minutes: 10
---

{% lead %}
The RHCE exam (EX294) is a hands-on Ansible test: you write and run automation against real systems, and the result is checked on them. This page lists the objective areas Red Hat publishes for the exam on RHEL 9, in our own words, and links each one to the lessons and exercises of this course that teach it. When you can do every line on your practice lab without notes, you are ready.
{% /lead %}

{% callout type="note" title="Check the official list" %}
Red Hat publishes and occasionally updates the objectives on the [EX294 exam page](https://www.redhat.com/en/services/training/ex294-red-hat-certified-engineer-rhce-exam-red-hat-enterprise-linux-9). This study map follows that list but is not an official document, and it makes no claim about what any particular exam contains. The RHCE also expects the system administration skills of the RHCSA, which the free Linux administration path of this site covers.
{% /callout %}

## Understand the core components of Ansible

- Inventories, modules, variables, facts, loops, conditions, plays and playbooks, configuration files and roles, and reading the documentation: [what Ansible is](#/ch02/what-is-ansible), [architecture](#/ch02/architecture), [inventory](#/ch03/inventory), [ansible.cfg](#/ch03/configuration), [modules and YAML](#/ch03/modules-and-yaml).
- Run playbooks and look up documentation with automation content navigator: [Ansible distributions and navigator](#/ch02/automation-platform), [inventory](#/ch03/inventory).

## Install and configure a control node

- Install the packages, create a static inventory with groups, and write a configuration file: [preparing the control node](#/ch02/control-node-and-hosts), [inventory](#/ch03/inventory), [configuration](#/ch03/configuration).

## Configure managed nodes

- Create and distribute SSH keys, configure privilege escalation, deploy files and check the setup with ad hoc commands: [preparing managed hosts](#/ch02/control-node-and-hosts), [multiple plays and become](#/ch03/multiple-plays), [file modules](#/ch06/file-modules), [troubleshooting hosts](#/ch09/troubleshooting-hosts).

## Create plays and playbooks

- Work with common modules, register results in variables, use conditions and loops, handle errors, and bring systems to a specified state: [writing playbooks](#/ch03/writing-playbooks), [variables](#/ch04/variables), [precedence](#/ch04/scope-and-precedence), [facts](#/ch04/facts), [loops](#/ch05/loops), [conditions](#/ch05/conditionals), [handlers](#/ch05/handlers), [task failure](#/ch05/task-failure), [host patterns](#/ch07/host-patterns), [imports and includes](#/ch07/reusing-content).

## Automate standard administration tasks

- Packages and repositories, services, firewall rules, file systems and storage, file content, archives, scheduled tasks, security, and users and groups: [software](#/ch10/software), [users](#/ch10/users), [boot and scheduling](#/ch10/boot-and-scheduling), [storage](#/ch10/storage), [network](#/ch10/network), [archives](#/ch10/archives), [file modules](#/ch06/file-modules).

## Manage content

- Create and use Jinja2 templates for customised configuration files: [templates](#/ch06/jinja2-templates).

## Protect sensitive data

- Use Ansible Vault in playbooks: [Ansible Vault](#/ch04/ansible-vault).

## Use roles and content collections

- Create roles, install them from Galaxy and requirements files, use collections and their modules, and reuse the RHEL system roles: [role structure](#/ch08/role-structure), [creating roles](#/ch08/creating-roles), [external roles](#/ch08/external-roles), [collections](#/ch08/collections), [system roles](#/ch08/system-roles).

## Practise like the exam

The review labs of this chapter and the two assessments state only the requirements, like exam tasks: [deploying Ansible](#/ch11/lab-review-deploy), [playbooks](#/ch11/lab-review-playbooks), [managing hosts](#/ch11/lab-review-admin), [roles](#/ch11/lab-review-roles), [releasing a web service](#/ch11/assessment-release) and [preparing an operations host](#/ch11/assessment-operations). Work through them on your [practice lab](#/ch01/overview), reset it, and repeat them without the lessons open.
