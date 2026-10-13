---
title: "Exercise: Map the network"
seoTitle: "Map the network (RHCSA Practice Exercise)"
description: "Hands-on RHCSA practice: map the network. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 20
---

{% lead %}
You have just been handed servera and serverb. Before you change anything, find out how they are connected: their addresses, the network they share, the gateway, their neighbours, and what is listening.
{% /lead %}

{% lab
  objectives=["ch12.basics"]
  id="inspect"
  title="Map the network"
  hosts=["workstation","servera","serverb"]
  outcomes=["Read the address, prefix, gateway and DNS of a host.","Test reachability and trace a path.","Find the listening services of a host."] %}

  {% task id="task-8f839b48e7a7" title="Addresses and interfaces" %}
    On servera, list all interfaces in brief form, with their MAC addresses. Which interface carries the address, and what is its prefix length?

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ ip -br addr
lo               UNKNOWN        127.0.0.1/8 ::1/128
enp5s0           UP             172.25.250.10/24 fe80::216:3eff:fe88:153c/64
[student@servera ~]$ ip -br link
lo               UNKNOWN        00:00:00:00:00:00 <LOOPBACK,UP,LOWER_UP>
enp5s0           UP             00:16:3e:88:15:3c <BROADCAST,MULTICAST,UP,LOWER_UP>
```

    `enp5s0` carries `172.25.250.10/24`: prefix 24, which is the netmask 255.255.255.0. The interface name and MAC will differ on your lab.
    {% /reveal %}
  {% /task %}

  {% task id="task-5841829288bb" title="Routes" %}
    Show the routing table. Which address is the default gateway, and which network is directly connected?

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ ip route
default via 172.25.250.254 dev enp5s0 proto dhcp src 172.25.250.10 metric 100
172.25.250.0/24 dev enp5s0 proto kernel scope link src 172.25.250.10 metric 100
```

    The gateway is 172.25.250.254. The directly connected network is 172.25.250.0/24.
    {% /reveal %}
  {% /task %}

  {% task id="task-d923a01cf634" title="Reach the neighbours" %}
    Ping serverb and the gateway twice each. Then list the neighbours that servera now knows.

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ ping -c 2 serverb | tail -2
2 packets transmitted, 2 received, 0% packet loss, time 1006ms
rtt min/avg/max/mdev = 0.535/0.713/0.891/0.178 ms
[student@servera ~]$ ping -c 2 172.25.250.254 | tail -2
2 packets transmitted, 2 received, 0% packet loss, time 1001ms
rtt min/avg/max/mdev = 0.279/0.290/0.301/0.011 ms
[student@servera ~]$ ip neigh
172.25.250.254 dev enp5s0 lladdr 00:16:3e:42:55:32 REACHABLE
172.25.250.11 dev enp5s0 lladdr 00:16:3e:04:a5:a7 REACHABLE
```
    {% /reveal %}
  {% /task %}

  {% task id="task-5cc3a13d0eb9" title="Trace the path" %}
    Use `tracepath -n` to the gateway. How many hops are there?

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ tracepath -n -m 3 172.25.250.254
 1?: [LOCALHOST]                      pmtu 1500
 1:  172.25.250.254                                        0.301ms reached
     Resume: pmtu 1500 hops 1 back 1
```

    One hop: the gateway is directly on servera's network.
    {% /reveal %}
  {% /task %}

  {% task id="task-095391f38322" title="What is listening?" %}
    Run `sudo ss -tulpn`. Which programs are listening, on which ports, and on which addresses? Which of them can be reached from another machine?

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ sudo ss -tulpn
Netid State  Recv-Q Send-Q Local Address:Port Peer Address:Port Process
udp   UNCONN 0      0          127.0.0.1:323       0.0.0.0:*   users:(("chronyd",pid=465,fd=5))
tcp   LISTEN 0      128          0.0.0.0:22        0.0.0.0:*   users:(("sshd",pid=641,fd=7))
tcp   LISTEN 0      128             [::]:22           [::]:*   users:(("sshd",pid=641,fd=8))
```

    sshd listens on port 22 on all addresses, so it can be reached from other machines. chronyd's UDP port 323 is bound to 127.0.0.1 only: it is for local control, not for the network. You may also see other services, such as `cockpit` on 9090, depending on the image.
    {% /reveal %}
  {% /task %}

  {% task id="task-7b311d5beaf0" title="Compare with serverb" %}
    Run the same `ip -br addr` and `ip route` on serverb (from workstation: the servers have no ssh key for each other). What is the same, and what differs?

    {% reveal title="Show solution" %}

```console
[student@servera ~]$ exit
[student@workstation ~]$ ssh student@serverb 'ip -br addr show enp5s0; ip route | head -1'
enp5s0           UP             172.25.250.11/24 fe80::216:3eff:fe04:a5a7/64
default via 172.25.250.254 dev enp5s0 proto dhcp src 172.25.250.11 metric 100
```

    Same network and gateway; different host part of the address (.11) and a different MAC address.
    {% /reveal %}
  {% /task %}
{% /lab %}
