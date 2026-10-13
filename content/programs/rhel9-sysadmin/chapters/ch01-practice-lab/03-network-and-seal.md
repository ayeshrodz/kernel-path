---
title: Create and seal the lab network
seoTitle: "Create an Isolated Lab Network in LXD"
description: "Create a private bridge network and seal it so the lab cannot reach your home network. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lab
minutes: 15
---

{% lead %}
Phases 03 and 04: build the virtual switch `rhcebr0` with the lab's addresses and DNS names, then add a small nftables firewall that makes it one-way. This is what makes the lab safe to run on your home network.
{% /lead %}

{% lab
  objectives=["ch01.lab-network"]
  id="network"
  title="Phase 03 · Create the lab network (~5 min)"
  hosts=["LXD UI","Ubuntu host"]
  outcomes=["Create the rhcebr0 bridge at 172.25.250.254/24 with DHCP, DNS and NAT."] %}
  {% task id="task-0687138b20ce" legacyIndex=1 title="LXD UI: start in the default project" %}
    The project selector (top left) must say **default**: networks made here are shared with every project. Then go to **Networks** → **Create network**.
  {% /task %}

  {% task id="task-e408698e7506" legacyIndex=2 title="LXD UI: fill in the form" %}

    | Field | Value |
    | --- | --- |
    | Type | Bridge |
    | Name | rhcebr0 |
    | Description | Kernel Path sealed lab network |
    | IPv4 address | 172.25.250.254/24 |
    | IPv4 NAT | On |
    | IPv6 address | none |
    | DNS domain (in the *DNS* section) | lab.example.com |
  {% /task %}

  {% task id="task-6c96de461c7e" legacyIndex=3 title="LXD UI: check the YAML configuration" %}
    Open the **YAML configuration** tab and make it match this. The `raw.dnsmasq` lines point `content.example.com` and `materials.example.com` at the utility VM. Then click **Create**.

```yaml {% title="rhcebr0: YAML configuration" %}
name: rhcebr0
type: bridge
description: Kernel Path sealed lab network
config:
  ipv4.address: 172.25.250.254/24
  ipv4.nat: "true"
  ipv4.dhcp.ranges: 172.25.250.100-172.25.250.199   # .8 to .13 stay free for fixed IPs
  ipv6.address: none
  dns.domain: lab.example.com
  raw.dnsmasq: |-
    host-record=content.example.com,172.25.250.8
    host-record=materials.example.com,172.25.250.8
```

    {% callout type="note" title="Your YAML will have extra lines" %}
    The UI adds read-only fields such as `access_entitlements` and `project`, may order keys differently, and may write `'true'` instead of `"true"`. None of that matters: leave those fields alone and make sure the `config:` block has the same keys and values. If the project selector showed `rhce` when you created it, that's fine too: the rhce project doesn't keep its own networks, so LXD stores `rhcebr0` in `default` either way.
    {% /callout %}
  {% /task %}

  {% task id="task-7617ba8ab2a9" legacyIndex=4 title="Host: confirm the bridge is up" %}
    You will see both of the host's addresses, as explained in [the overview](#/ch01/overview).

```bash {% title="Ubuntu host" %}
ip -brief -4 addr
# enp1s0    UP   <HOST_LAN_IP>/24     ← your LAN side (name and /prefix vary; Wi-Fi shows wlp… or wlx…)
# rhcebr0   UP   172.25.250.254/24     ← the lab gateway
```
  {% /task %}
{% /lab %}

## How the seal works

The seal is a small **nftables** table on the host that only looks at traffic touching `rhcebr0`. Your local network and the rest of the host are untouched. It has three chains, one for each direction traffic can take:

{% cards cols=3 %}
  {% card kicker="chain forward" title="Through the host" tone="red" %}
    - VM ↔ VM: allow
    - New connections **into** the lab: drop
    - Lab → private and VPN ranges: drop
    - Lab → internet: allow
  {% /card %}
  {% card kicker="chain output" title="Host → lab" tone="amber" %}
    - DHCP replies and DNS replies: allow
    - Anything the host starts (ssh, ping): drop
  {% /card %}
  {% card kicker="chain input" title="Lab → host" tone="purple" %}
    - DHCP and DNS requests: allow
    - Everything else (SSH, LXD UI, …): drop
  {% /card %}
{% /cards %}

The map in [the overview](#/ch01/overview) lets you trace each of these flows.

{% lab
  objectives=["ch01.lab-network"]
  id="seal"
  title="Phase 04 · Seal the lab network (~10 min)"
  hosts=["Ubuntu host"]
  outcomes=["Load an nftables table that makes rhcebr0 one-way, on every boot."] %}
  {% task id="task-8cf1ab398a18" legacyIndex=1 title="Host: create the rules file" %}

```text {% title="/etc/nftables-rhce.nft" %}
#!/usr/sbin/nft -f
# Seals the RHCE lab bridge (rhcebr0). Loaded by rhce-isolate.service.
# The first two lines let this file be reloaded safely.
table inet rhce_isolate
delete table inet rhce_isolate

table inet rhce_isolate {

  # Traffic passing THROUGH the host (between the lab and anything else)
  chain forward {
    type filter hook forward priority -10; policy accept;

    iifname "rhcebr0" oifname "rhcebr0" accept                   # VM to VM
    oifname "rhcebr0" ct state established,related accept         # replies to the VMs
    oifname "rhcebr0" drop                                        # anything new INTO the lab

    iifname "rhcebr0" ip daddr { 10.0.0.0/8, 172.16.0.0/12,
                                 192.168.0.0/16, 100.64.0.0/10 } drop   # lab to private/VPN ranges
    # everything else from the lab (the internet) is allowed
  }

  # Traffic FROM the host itself TO the lab
  chain output {
    type filter hook output priority -10; policy accept;

    oifname "rhcebr0" udp sport 67 accept                         # DHCP replies to VMs
    oifname "rhcebr0" ct state established,related accept         # DNS replies to VMs
    oifname "rhcebr0" drop                                        # host can't start connections
  }

  # Traffic FROM the lab TO the host itself
  chain input {
    type filter hook input priority -10; policy accept;

    iifname "rhcebr0" udp dport { 53, 67 } accept                 # DNS + DHCP
    iifname "rhcebr0" tcp dport 53 accept                         # DNS over TCP
    iifname "rhcebr0" drop                                        # nothing else on the host
  }
}
```

    | Chain | Controls | Result |
    | --- | --- | --- |
    | `forward` | Traffic *passing through* the host | Nobody from your LAN gets in; the lab can't reach your LAN; the lab *can* reach the internet |
    | `output` | Traffic the host *sends* to the lab | The host can't ssh or ping the VMs. It only hands out IPs and answers DNS. |
    | `input` | Traffic the lab *sends* to the host | VMs can only ask the host for an IP and name lookups. No access to its SSH, LXD UI or anything else. |
  {% /task %}

  {% task id="task-bd2abfb52b42" legacyIndex=2 title="Host: create a service that loads it on boot" %}

```ini {% title="/etc/systemd/system/rhce-isolate.service" %}
[Unit]
Description=Seal the RHCE lab network (rhcebr0)
After=network-pre.target snap.lxd.daemon.service
Wants=network-pre.target

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/usr/sbin/nft -f /etc/nftables-rhce.nft
ExecStop=/usr/sbin/nft delete table inet rhce_isolate

[Install]
WantedBy=multi-user.target
```
  {% /task %}

  {% task id="task-b8c842ef8ad0" legacyIndex=3 title="Host: check the syntax, then turn it on" %}

```bash {% title="Ubuntu host" %}
sudo nft -c -f /etc/nftables-rhce.nft          # -c = check only; no output means OK
sudo systemctl daemon-reload
sudo systemctl enable --now rhce-isolate.service
sudo nft list table inet rhce_isolate          # shows the three chains
```

    {% callout type="tip" title="Turning it off temporarily" %}
    `sudo systemctl stop rhce-isolate` removes the rules; `start` puts them back. You will test the seal once VMs exist, in section 1.5.
    {% /callout %}
  {% /task %}

  {% task id="task-11b115c32006" legacyIndex=4 title="Host: only if ufw is active, let the lab through it" %}
    ufw's default policy blocks the lab's DHCP and DNS requests and its internet traffic. That only shows up later as a confusing failure, so add these now:

```bash {% title="Ubuntu host" %}
sudo ufw status | head -1                                   # "Status: inactive"? skip this step
sudo ufw allow in on rhcebr0 to any port 67 proto udp       # DHCP: VMs get their IPs
sudo ufw allow in on rhcebr0 to any port 53                 # DNS: lab names resolve
sudo ufw route allow in on rhcebr0                          # forwarding: VMs reach the internet
sudo ufw reload
```

    These rules only add permissions on `rhcebr0`. The seal still drops everything aimed at your local network. More detail in [troubleshooting](#/ch01/troubleshooting).

    {% callout type="warning" title="Docker on this host?" %}
    Docker also changes forwarding rules and can block the lab's internet access. The fix is in [troubleshooting](#/ch01/troubleshooting) under "VMs can't reach the internet".
    {% /callout %}
  {% /task %}
{% /lab %}
