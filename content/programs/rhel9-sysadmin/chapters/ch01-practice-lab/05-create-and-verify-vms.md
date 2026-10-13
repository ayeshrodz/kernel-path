---
title: Create the VMs and check the seal
seoTitle: "Create Rocky Linux 9 VMs and Test the Lab"
description: "Launch the workstation and server VMs and check that the lab network is sealed. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lab
minutes: 30
---

{% lead %}
Phases 08 and 09: create workstation and the two servers from the Rocky Linux 9 cloud image, then step inside and prove two things: everything works *inside* the lab, and everything *outside* is blocked.
{% /lead %}

{% lab
  objectives=["ch01.lab-machines"]
  id="vms"
  title="Phase 08 · Create the VMs (~20 min)"
  hosts=["LXD UI"]
  outcomes=["Create servera in full, then workstation and serverb with fixed IPs."] %}
  {% task id="task-1fc07290400b" legacyIndex=1 title="LXD UI: start a new instance" %}
    Project **rhce** → **Instances** → **Create instance**.
  {% /task %}

  {% task id="task-f0de4ac80c37" legacyIndex=2 title="LXD UI: choose the Rocky Linux 9 cloud image" %}
    **Browse images**, then filter and click **Select**. The first download takes a few minutes; later VMs reuse it.

    | Filter | Value |
    | --- | --- |
    | Distribution | Rocky Linux |
    | Release | 9 |
    | Variant | cloud |
    | Type | VM |

    {% callout type="important" title="Pick the cloud variant" %}
    Only the cloud variant runs cloud-init, which creates the users from the profile.
    {% /callout %}

    {% callout type="tip" title="Optional: freeze the image for reproducible rebuilds" %}
    The image server publishes a new Rocky 9 build every few days and keeps only recent ones. To rebuild later from the exact same image, copy it into your local image store once (copied images don't auto-update), then choose **rocky9-lab** under *Local images*:

```bash {% title="Ubuntu host" %}
lxc image copy images:rockylinux/9/cloud local: --vm --alias rocky9-lab     # into the current project, rhce
lxc image info rocky9-lab | grep -E 'Fingerprint|serial|description'
```
    {% /callout %}
  {% /task %}

  {% task id="task-952f939ea59b" legacyIndex=3 title="LXD UI: name and profile" %}
    Main configuration: name `servera`, instance type `VM`, profile `default`.
  {% /task %}

  {% task id="task-163f9021aa16" legacyIndex=4 title="LXD UI: pin the IP and attach the extra disk" %}
    Open the **YAML configuration** tab and replace the `devices:` section with this:

```yaml {% title="servera: YAML configuration, devices section" %}
devices:
  eth0:
    type: nic
    name: eth0
    network: rhcebr0
    ipv4.address: 172.25.250.10
  disk2:
    type: disk
    pool: default
    source: servera-disk2
```
  {% /task %}

  {% task id="task-b07f33706619" legacyIndex=5 title="LXD UI: create and start" %}
    **Create and start**. The first boot takes 2–3 minutes: cloud-init installs the packages, then the VM reboots once more to switch SELinux on. The UI shows it running the whole time.
  {% /task %}

  {% task id="task-06ea7fce0778" legacyIndex=6 title="LXD UI: create workstation and serverb the same way" %}

    | Name | ipv4.address | disk2 source | Resource limits (left menu) |
    | --- | --- | --- | --- |
    | workstation | 172.25.250.9 | none: delete the `disk2` lines | CPU `2`, memory `2GiB` |
    | serverb | 172.25.250.11 | serverb-disk2 | from profile |

```yaml {% title="workstation: YAML configuration, devices section" %}
devices:
  eth0:
    type: nic
    name: eth0
    network: rhcebr0
    ipv4.address: 172.25.250.9
```

  {% /task %}
{% /lab %}

{% lab
  objectives=["ch01.lab-machines"]
  id="verify"
  title="Phase 09 · Get inside and check everything (~10 min)"
  hosts=["Ubuntu host","workstation"]
  outcomes=["Enter VMs with lxc exec.","Prove the inside works and the outside is blocked."] %}
  {% task id="task-8680d0539498" legacyIndex=1 title="Host: every VM is running with its address" %}
    `lxc exec` and the UI's **Terminal** tab are how you will always get in. Neither uses the network, so the firewall doesn't get in the way.

```bash {% title="Ubuntu host" %}
lxc list
```
  {% /task %}

  {% task id="task-82f78b3a4ca7" legacyIndex=2 title="Host: step inside servera and check the first boot" %}

```bash {% title="Ubuntu host" %}
lxc exec servera -- bash
```

```bash {% title="servera, as root" %}
cloud-init status --wait          # "status: done"
hostname                          # servera.lab.example.com
id student                        # the student user exists
lsblk                             # a 5G disk (sdb) with nothing on it
getenforce                        # Enforcing
rpm -q lvm2 firewalld chrony      # all three installed, no "not installed"
exit
```

    {% callout type="warning" title="cloud-init says done, but packages are missing?" %}
    If the VM had no working DNS or internet on its first boot (usually ufw on the host), cloud-init skips the whole `packages:` list, only logs a warning, and still reports *done*. Then `getenforce` says *Disabled* and `rpm -q` reports packages as not installed. Fix the network first, then use [the repair steps](#/ch01/troubleshooting#repair-an-existing-lab) instead of recreating the VM.
    {% /callout %}

    {% callout type="important" title="sdb, not vdb" %}
    LXD attaches the extra disk as `/dev/sdb`, where other hypervisors often show `/dev/vdb`. Use `sdb` in the storage chapters.
    {% /callout %}
  {% /task %}

  {% task id="task-6844dc030e56" legacyIndex=3 title="VM: the inside works" %}
    Enter workstation as `student` and move around by SSH, as you will in the later chapters.

```bash {% title="Ubuntu host" %}
lxc exec workstation -- su - student
```

```bash {% title="student@workstation" %}
ping -c2 servera.lab.example.com      # works: VM to VM
ssh student@servera                   # password: student. Short names work too
exit
curl -sI https://rockylinux.org | head -1   # works: internet via NAT
```

    {% callout type="warning" title="Stuck here? Check ufw first" %}
    If the host has **ufw** enabled, this is where it shows: `lxc list` shows no IPv4 address, `servera.lab.example.com` doesn't resolve, or `curl` to the internet hangs. Run `sudo ufw status` on the host. If it's active and you skipped the ufw step in [the previous section](#/ch01/network-and-seal), add those rules now, restart the VMs (`lxc restart --all`), and repeat this step.
    {% /callout %}
  {% /task %}

  {% task id="task-6e9b5ecf9a59" legacyIndex=4 title="VM: the outside is blocked from inside the lab" %}
    These should all **fail**. The ufw rules don't weaken the seal: if one of them succeeds, check that the seal is loaded with `sudo systemctl status rhce-isolate`.

```bash {% title="student@workstation: these should all FAIL" %}
ping -c2 -W2 <HOST_LAN_IP>          # the host's LAN address: no reply
ping -c2 -W2 <ROUTER_IP>            # your router: no reply
curl -m3 -k https://172.25.250.254:8443   # the host's LXD API: times out
```
  {% /task %}

  {% task id="task-898297dafe21" legacyIndex=5 title="Host: the lab is blocked from the host too" %}

```bash {% title="Ubuntu host: these should FAIL" %}
ping -c2 -W2 172.25.250.10            # "Operation not permitted" or no reply
ssh -o ConnectTimeout=3 student@172.25.250.10
```

    From any other machine on your local network, 172.25.250.x doesn't exist at all: your router has no route to it, and the host would drop it anyway.
  {% /task %}
{% /lab %}
