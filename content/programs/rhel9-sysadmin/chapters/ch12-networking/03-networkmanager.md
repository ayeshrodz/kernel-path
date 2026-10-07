---
title: Configuring the network with NetworkManager
seoTitle: "nmcli Static IP Configuration on RHEL 9"
description: "Configure static IP addresses, gateways and DNS with nmcli connection and NetworkManager. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 20
---

{% lead %}
`ip addr add` changes the network instantly, and forgets everything at the next reboot. To make a setting last, you give it to **NetworkManager**, the service that owns the network configuration on RHEL. Its command-line client is `nmcli`. This lesson teaches the one idea behind it, the difference between a *device* and a *connection*, and then the handful of commands you need.
{% /lead %}

{% objectives %}
- Explain the difference between a device and a connection profile.
- Create, modify, activate and delete a static connection with `nmcli`.
- Know where profiles are stored, and why `connection modify` needs a `connection up`.
{% /objectives %}

## Devices and connections

{% diagram ref="device-profile" /%}

```console
[root@servera ~]# nmcli device status
DEVICE  TYPE      STATE                   CONNECTION
enp5s0  ethernet  connected               System enp5s0
lo      loopback  connected (externally)  lo
[root@servera ~]# nmcli connection show
NAME           UUID                                  TYPE      DEVICE
System enp5s0  9310e179-14b6-430a-6843-6491c047d532  ethernet  enp5s0
lo             f70215b4-09f6-4aeb-b431-8be72ac28cce  loopback  lo
```

The profile called `System enp5s0` is applied to the device `enp5s0`. Show its settings with `nmcli connection show NAME`; on this machine `ipv4.method` is `auto`, meaning DHCP.

{% callout type="warning" title="Do not experiment on the connection you are using" %}
Changing the address of the connection that carries your SSH session can disconnect you, and on a remote machine you cannot easily get back in. In the exercises you work with a **dummy** interface: a virtual interface that behaves like a real one but is not connected to anything, so you can practise freely.
{% /callout %}

## A static connection, step by step

Create a profile for a new dummy interface with a fixed address:

```console
[root@servera ~]# nmcli connection add type dummy ifname dummy0 con-name dummy0 ipv4.method manual ipv4.addresses 10.20.30.1/24 ipv6.method disabled
Connection 'dummy0' (1eb3d901-8d60-465a-98fb-d365ea4b7649) successfully added.
[root@servera ~]# ip -br addr show dummy0
dummy0           UNKNOWN        10.20.30.1/24
```

| Part | Means |
| --- | --- |
| `type dummy` | The kind of device (for a real card: `ethernet`) |
| `ifname dummy0` | The interface it belongs to |
| `con-name dummy0` | The name of the profile |
| `ipv4.method manual` | Static; `auto` is DHCP |
| `ipv4.addresses 10.20.30.1/24` | Address and prefix |
| `ipv4.gateway`, `ipv4.dns` | Gateway and DNS server (optional) |

A profile is **added and activated** in one step. To change it, edit the profile with `modify`, then apply with `up`:

```console
[root@servera ~]# nmcli connection modify dummy0 +ipv4.addresses 10.20.30.2/24
[root@servera ~]# ip -br addr show dummy0
dummy0           UNKNOWN        10.20.30.1/24
[root@servera ~]# nmcli connection up dummy0
Connection successfully activated (D-Bus active path: /org/freedesktop/NetworkManager/ActiveConnection/4)
[root@servera ~]# ip -br addr show dummy0
dummy0           UNKNOWN        10.20.30.1/24 10.20.30.2/24
```

Notice that the address did not appear until `up`. Without a `+` (or with `-` to remove an entry), a property is **replaced** instead of extended:

```console
[root@servera ~]# nmcli -g ipv4.addresses,ipv4.method connection show dummy0
10.20.30.1/24, 10.20.30.2/24
manual
```

Use `nmcli connection show NAME` to see every property, and `nmcli -g PROPERTY connection show NAME` to print one value.

## Where profiles live

Each profile is a small text file, which `nmcli` writes for you:

```console
[root@servera ~]# cat /etc/NetworkManager/system-connections/dummy0.nmconnection
[connection]
id=dummy0
uuid=1eb3d901-8d60-465a-98fb-d365ea4b7649
type=dummy
interface-name=dummy0

[dummy]

[ipv4]
address1=10.20.30.1/24
method=manual

[ipv6]
addr-gen-mode=default
method=disabled
```

You can edit such files, but then you must run `nmcli connection reload` for NetworkManager to notice. Preferring `nmcli` avoids mistakes. (The lab's main connection is an older `ifcfg` file under `/etc/sysconfig/network-scripts/`, which NetworkManager also understands.)

## Stopping and removing

```console
[root@servera ~]# nmcli connection down dummy0
[root@servera ~]# nmcli connection delete dummy0
Connection 'dummy0' (1eb3d901-8d60-465a-98fb-d365ea4b7649) successfully deleted.
```

`down` removes the settings from the device but keeps the profile; `delete` removes the profile and its file. Deleting the profile of a dummy interface also removes the device and its settings (such as an added DNS server) within a moment.

## Try it

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch12.networkmanager"] ref="quick" /%}
