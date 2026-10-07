---
title: "Exercise: Networking review"
seoTitle: "Linux networking Practice Lab (RHCSA Exam Style)"
description: "Graded RHCSA exam-style lab on Linux networking: a challenge with requirements, hints and solutions, and a grader that checks your work on your own lab."
kind: lab
minutes: 30
---

{% lead %}
Prepare servera for an application network: a static virtual interface with two addresses and a DNS server, a local name for it, and a few facts read from the live system.
{% /lead %}

{% lab
  objectives=["ch12.basics","ch12.networkmanager","ch12.names","ch12.troubleshooting"]
  id="review"
  title="Networking review"
  exercise="sa-network-review"
  ownExercise=true
  hosts=["workstation","servera"]
  outcomes=["Create a static NetworkManager connection with two addresses and a DNS server.","Add a local host name entry.","Read gateway, prefix and name order from the system."] %}
{% lab-notes %}

**Before you start:** reset the servers and complete this chapter's lessons. You work on **servera** as root (`sudo -i`); `lab start` and `lab grade` run on workstation. Leave the connection of your SSH session alone.

{% /lab-notes %}

{% lab-challenge %}

On servera:

1. Create the NetworkManager connection `dummy1` (type `dummy`, interface `dummy1`) with the static addresses `10.50.60.1/24` and `10.50.60.2/24`, IPv6 disabled and the DNS server `10.50.60.53`. Both addresses must be active.
2. Add `10.50.60.1 appnet.lab.example.com appnet` to `/etc/hosts` and check it with `getent hosts appnet`.
3. On workstation, fill in `answers.txt` from what you read on servera.

{% /lab-challenge %}

  {% task id="task-fec43e1f2f83" title="Start the exercise" %}

```console
[student@workstation ~]$ lab start sa-network-review
[student@workstation ~]$ cd ~/sa-network-review
[student@workstation sa-network-review]$ ssh student@servera
[student@servera ~]$ sudo -i
[root@servera ~]#
```
  {% /task %}

  {% task id="task-efe966c0e919" title="The connection" %}

    {% reveal title="Show solution" %}

```console
[root@servera ~]# nmcli connection add type dummy ifname dummy1 con-name dummy1 ipv4.method manual ipv4.addresses 10.50.60.1/24 ipv4.dns 10.50.60.53 ipv6.method disabled
Connection 'dummy1' (6b0f7e1d-2b32-4c27-b1c4-6c9e1f5d0e54) successfully added.
[root@servera ~]# nmcli connection modify dummy1 +ipv4.addresses 10.50.60.2/24
[root@servera ~]# nmcli connection up dummy1
Connection successfully activated (D-Bus active path: /org/freedesktop/NetworkManager/ActiveConnection/5)
[root@servera ~]# ip -br addr show dummy1
dummy1           UNKNOWN        10.50.60.1/24 10.50.60.2/24
```
    {% /reveal %}
  {% /task %}

  {% task id="task-9bd913416c8d" title="The name" %}

    {% reveal title="Show solution" %}

```console
[root@servera ~]# echo "10.50.60.1 appnet.lab.example.com appnet" >> /etc/hosts
[root@servera ~]# getent hosts appnet
10.50.60.1      appnet.lab.example.com appnet
```
    {% /reveal %}
  {% /task %}

  {% task id="task-3c9154cef667" title="Facts for answers.txt" %}

    {% reveal title="Show solution" %}

```console
[root@servera ~]# ip route | head -1
default via 172.25.250.254 dev enp5s0 proto dhcp src 172.25.250.10 metric 100
[root@servera ~]# ip -br addr show enp5s0
enp5s0           UP             172.25.250.10/24 fe80::216:3eff:fe88:153c/64
[root@servera ~]# grep ^hosts /etc/nsswitch.conf
hosts:      files dns myhostname
[root@servera ~]# exit
[student@servera ~]$ exit
```

    GATEWAY is the address after `default via`, PREFIX is `24`, LISTEN_TOOL is `ss`, and NAME_ORDER is `files dns`.
    {% /reveal %}
  {% /task %}

  {% task id="task-cc0c66b2e1ec" title="Grade" %}
    On workstation, with `answers.txt` filled in:

    {% lab-finish exercise="sa-network-review" grade=true servers=true /%}
  {% /task %}
{% /lab %}
