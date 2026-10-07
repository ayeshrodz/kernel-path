---
title: How hosts find each other on a network
seoTitle: "Linux Networking Basics: ip addr, Routes, Ports"
description: "IP addresses, subnets, routes, ports and ip, ping and ss commands for Linux administrators. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 20
---

{% lead %}
A server is only useful when other machines can reach it, and every "I can't connect" has the same few possible causes: the link, the address, the route, the name, or the service. Before changing any configuration, you need to read the one you have. This lesson explains the four numbers that define a host's network identity, and the commands that show them.
{% /lead %}

{% objectives %}
- Explain the IP address, prefix, network, gateway and DNS server of a host.
- Read `ip addr`, `ip route` and `ip neigh`, and test reachability with `ping` and `tracepath`.
- List listening ports and the programs behind them with `ss`.
{% /objectives %}

## The four numbers

Every host on an IP network is described by a few values. Select one to see what it means:

{% diagram ref="cidr" /%}

Two hosts on the **same network** (same prefix bits) reach each other directly. Anything else goes through the **gateway**: the host sends the packet to the router, which passes it on. That decision is the **routing table**.

{% diagram ref="host-view" /%}

## Interfaces and addresses: ip

The `ip` command (package `iproute`) replaced the older `ifconfig`. Add `-br` for a brief, tabular view:

```console
[student@servera ~]$ ip -br addr
lo               UNKNOWN        127.0.0.1/8 ::1/128
enp5s0           UP             172.25.250.10/24 fe80::216:3eff:fe88:153c/64
[student@servera ~]$ ip -br link
lo               UNKNOWN        00:00:00:00:00:00 <LOOPBACK,UP,LOWER_UP>
enp5s0           UP             00:16:3e:88:15:3c <BROADCAST,MULTICAST,UP,LOWER_UP>
```

- `lo` is the **loopback** interface: `127.0.0.1` always means "this machine".
- `enp5s0` is the Ethernet card. The name encodes its place on the bus (en = Ethernet, p5 = PCI bus 5, s0 = slot 0). Names differ from machine to machine.
- `UP` means the link is working. The `fe80::` address is IPv6 link-local, created automatically.
- In `ip link`, the `00:16:3e:…` value is the **MAC address**, the hardware address that is used inside one network.

`ip -s link show enp5s0` adds counters for packets and errors, which is how you notice a bad cable or a flooding host.

## The routing table

```console
[student@servera ~]$ ip route
default via 172.25.250.254 dev enp5s0 proto dhcp src 172.25.250.10 metric 100
172.25.250.0/24 dev enp5s0 proto kernel scope link src 172.25.250.10 metric 100
```

Read it from the bottom: traffic for `172.25.250.0/24` goes straight out of `enp5s0`; **everything else** (`default`) goes via the gateway `172.25.250.254`. `proto dhcp` tells you the route came from DHCP, and `metric` ranks competing routes (lower wins).

`ip neigh` lists the neighbours the host has talked to recently, with their MAC addresses:

```console
[student@servera ~]$ ip neigh
172.25.250.254 dev enp5s0 lladdr 00:16:3e:42:55:32 DELAY
172.25.250.11 dev enp5s0 lladdr 00:16:3e:04:a5:a7 REACHABLE
```

## Testing reachability

`ping` sends small echo requests and reports whether answers come back, and how long they take. Use `-c` to limit the count (otherwise it never stops; Ctrl+C ends it):

```console
[student@servera ~]$ ping -c 2 serverb
PING serverb.lab.example.com (172.25.250.11) 56(84) bytes of data.
64 bytes from serverb.lab.example.com (172.25.250.11): icmp_seq=1 ttl=64 time=0.535 ms
64 bytes from serverb.lab.example.com (172.25.250.11): icmp_seq=2 ttl=64 time=0.891 ms

--- serverb.lab.example.com ping statistics ---
2 packets transmitted, 2 received, 0% packet loss, time 1006ms
rtt min/avg/max/mdev = 0.535/0.713/0.891/0.178 ms
```

A successful ping proves the address is reachable, not that any service on it works. `tracepath -n ADDRESS` shows each router on the way, which finds where a path stops:

```console
[student@servera ~]$ tracepath -n -m 3 172.25.250.254
 1?: [LOCALHOST]                      pmtu 1500
 1:  172.25.250.254                                        0.301ms reached
     Resume: pmtu 1500 hops 1 back 1
```

## What is listening: ss

`ss` (socket statistics) replaced `netstat`. The most useful combination is **`ss -tulpn`**: TCP and UDP, listening, with the process, numeric.

```console
[student@servera ~]$ ss -tulpn
Netid State  Recv-Q Send-Q Local Address:Port Peer Address:Port Process
udp   UNCONN 0      0          127.0.0.1:323       0.0.0.0:*   users:(("chronyd",pid=465,fd=5))
tcp   LISTEN 0      128          0.0.0.0:22        0.0.0.0:*   users:(("sshd",pid=641,fd=7))
tcp   LISTEN 0      128             [::]:22           [::]:*   users:(("sshd",pid=641,fd=8))
```

The **Local Address** is crucial. `0.0.0.0:22` (or `[::]:22`) means "on every address of this machine". `127.0.0.1:323` means "only on the loopback", so no other machine can ever reach it. Process names appear only when you run `ss` as root (use `sudo`).

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch12.basics"] ref="quick" /%}
