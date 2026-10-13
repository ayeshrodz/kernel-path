---
title: "Exercise: Configure a static connection"
seoTitle: "Configure a static connection (RHCSA Practice Exercise)"
description: "Hands-on RHCSA practice: configure a static connection. Step-by-step tasks with full solutions, on a practice lab you build yourself."
kind: lab
minutes: 25
---

{% lead %}
Build a static network configuration from scratch on a virtual interface: create it, check that it works, extend it, change it, and see that it survives a reboot. Your real network connection is never touched.
{% /lead %}

{% lab
  objectives=["ch12.networkmanager"]
  id="nmcli"
  title="Configure a static connection"
  exercise="sa-nmcli"
  ownExercise=true
  guided=true
  starter=false
  hosts=["workstation","servera"]
  outcomes=["Create a static dummy connection with nmcli.","Add and replace addresses, applying them with connection up.","Verify persistence across a reboot and clean up."] %}

  {% task id="task-35822c99c20e" title="Start the exercise" %}
    On workstation, start the exercise. It removes a dummy0 connection left by an earlier run from servera.

```console
[student@workstation ~]$ lab start sa-nmcli
```

    Later tasks assume that you are logged in to the server they name: `ssh student@servera` from workstation, then `sudo -i` for a root shell.
  {% /task %}

  {% task id="task-fcdedbe17877" title="Look before you touch" %}
    On servera as root (`sudo -i`), list the devices and the connections.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ sudo -i
[root@servera ~]# nmcli device status
DEVICE  TYPE      STATE                   CONNECTION
enp5s0  ethernet  connected               System enp5s0
lo      loopback  connected (externally)  lo
[root@servera ~]# nmcli connection show
NAME           UUID                                  TYPE      DEVICE
System enp5s0  9310e179-14b6-430a-6843-6491c047d532  ethernet  enp5s0
lo             f70215b4-09f6-4aeb-b431-8be72ac28cce  loopback  lo
```
    {% /reveal %}
  {% /task %}

  {% task id="task-634a7a33d2b0" title="Create dummy0" %}
    Create a connection named `dummy0` for the device `dummy0`, with the static address `10.20.30.1/24` and IPv6 disabled. Check the address with `ip`.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# nmcli connection add type dummy ifname dummy0 con-name dummy0 ipv4.method manual ipv4.addresses 10.20.30.1/24 ipv6.method disabled
Connection 'dummy0' (1eb3d901-8d60-465a-98fb-d365ea4b7649) successfully added.
[root@servera ~]# ip -br addr show dummy0
dummy0           UNKNOWN        10.20.30.1/24
```

    A dummy device shows state `UNKNOWN` because it has no cable to sense. That is normal.
    {% /reveal %}
  {% /task %}

  {% task id="task-c6d8de9baafc" title="Test the address" %}
    Ping your own new address once. Which route handles it?

    {% reveal title="Show solution" %}

```console
[root@servera ~]# ping -c 1 10.20.30.1 | head -2
PING 10.20.30.1 (10.20.30.1) 56(84) bytes of data.
64 bytes from 10.20.30.1: icmp_seq=1 ttl=64 time=0.104 ms
[root@servera ~]# ip route | grep 10.20.30
10.20.30.0/24 dev dummy0 proto kernel scope link src 10.20.30.1 metric 550
```

    The kernel added the connected route for `10.20.30.0/24` automatically.
    {% /reveal %}
  {% /task %}

  {% task id="task-f73585d97700" title="Add a second address" %}
    Add `10.20.30.2/24` to the profile. Check `ip addr` before and after applying the change. Why do they differ?

    {% reveal title="Show solution" %}

```console
[root@servera ~]# nmcli connection modify dummy0 +ipv4.addresses 10.20.30.2/24
[root@servera ~]# ip -br addr show dummy0
dummy0           UNKNOWN        10.20.30.1/24
[root@servera ~]# nmcli connection up dummy0
Connection successfully activated (D-Bus active path: /org/freedesktop/NetworkManager/ActiveConnection/4)
[root@servera ~]# ip -br addr show dummy0
dummy0           UNKNOWN        10.20.30.1/24 10.20.30.2/24
```

    `modify` only edited the saved profile. `up` applied it to the device.
    {% /reveal %}
  {% /task %}

  {% task id="task-dc0047f7c5d0" title="Replace the addresses, add a gateway and DNS" %}
    Replace the whole list with one address, `10.20.30.9/24`, and add a DNS server `10.20.30.53` and a gateway `10.20.30.254` to the profile. Apply it. What changes in the routing table and in `/etc/resolv.conf`?

    {% reveal title="Show solution" %}

```console
[root@servera ~]# nmcli connection modify dummy0 ipv4.addresses 10.20.30.9/24 ipv4.dns 10.20.30.53 ipv4.gateway 10.20.30.254
[root@servera ~]# nmcli connection up dummy0 > /dev/null
[root@servera ~]# ip -br addr show dummy0
dummy0           UNKNOWN        10.20.30.9/24
[root@servera ~]# ip route
default via 172.25.250.254 dev enp5s0 proto dhcp src 172.25.250.10 metric 100
default via 10.20.30.254 dev dummy0 proto static metric 550
10.20.30.0/24 dev dummy0 proto kernel scope link src 10.20.30.9 metric 550
172.25.250.0/24 dev enp5s0 proto kernel scope link src 172.25.250.10 metric 100
[root@servera ~]# cat /etc/resolv.conf
# Generated by NetworkManager
search lab.example.com
nameserver 172.25.250.254
nameserver 10.20.30.53
```

    Without the `+`, the address list was replaced. There are now **two default routes**; the one with the lower metric (100, on enp5s0) is used, so the dummy gateway does not take over. The DNS server was appended to `resolv.conf`, after the existing one.
    {% /reveal %}
  {% /task %}

  {% task id="task-28ad97adbc58" title="See the file, reboot, and check" %}
    Show the profile file. Reboot, log in again, and check that `dummy0` came back with its address.

    {% reveal title="Show solution" %}

```console
[root@servera ~]# cat /etc/NetworkManager/system-connections/dummy0.nmconnection
[connection]
id=dummy0
uuid=1eb3d901-8d60-465a-98fb-d365ea4b7649
type=dummy
interface-name=dummy0
...output omitted...
[ipv4]
address1=10.20.30.9/24
dns=10.20.30.53;
gateway=10.20.30.254
method=manual
...output omitted...
[root@servera ~]# systemctl reboot
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ ip -br addr show dummy0
dummy0           UNKNOWN        10.20.30.9/24
```

    The address came back because it is in a profile. (`ip addr add` alone would have vanished.)
    {% /reveal %}
  {% /task %}

  {% task id="task-d8fa62b42805" title="Delete it" %}

```console
[student@servera ~]$ sudo nmcli connection delete dummy0
Connection 'dummy0' (1eb3d901-8d60-465a-98fb-d365ea4b7649) successfully deleted.
[student@servera ~]$ sleep 3; ip -br addr
lo               UNKNOWN        127.0.0.1/8 ::1/128
enp5s0           UP             172.25.250.10/24 fe80::216:3eff:fe88:153c/64
[student@servera ~]$ cat /etc/resolv.conf | tail -1
nameserver 172.25.250.254
[student@servera ~]$ exit
```

    The virtual device and the extra DNS server disappear a moment after the profile is deleted.
  {% /task %}

  {% task id="task-cac4d7d77de1" title="Grade and finish" %}
    {% lab-finish exercise="sa-nmcli" grade=true servers=true /%}
  {% /task %}
{% /lab %}
