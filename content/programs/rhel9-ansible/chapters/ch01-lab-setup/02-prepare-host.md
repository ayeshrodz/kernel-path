---
title: Prepare the host and LXD
seoTitle: "Prepare the host and LXD: RHCE Home Lab Setup"
description: "Prepare the host and LXD: part of building a free RHCE practice lab at home with Rocky Linux 9 virtual machines on LXD."
kind: lab
minutes: 20
---

{% lead %}
Phases 01 and 02: update the Ubuntu host, check it can run virtual machines, install LXD from the long-term-support track, and open the LXD web UI in your browser.
{% /lead %}

{% lab
  objectives=["ch01.lab-network","ch01.lab-machines","ch01.lab-tools","ch01.lab-reset"]
  id="host"
  title="Phase 01 · Prepare the Ubuntu host (~15 min)"
  hosts=["Ubuntu host"]
  outcomes=["Confirm hardware virtualisation works.","Install LXD 5.21 LTS and hold it at that version.","Initialise LXD with a ZFS storage pool."] %}
  {% task id="task-c3f15967887d" legacyIndex=1 title="Host: update the system and check virtualisation" %}

```bash {% title="Ubuntu host" %}
sudo apt update && sudo apt full-upgrade -y
sudo apt install -y cpu-checker nftables
kvm-ok
# Expected: "KVM acceleration can be used"
```

    {% callout type="warning" title="If kvm-ok fails" %}
    Enable **Intel Virtualization Technology (VT-x)** or **AMD-V** in the BIOS/UEFI, and VT-d if offered. It is usually under *Advanced*, *CPU* or *Security*, depending on the vendor.
    {% /callout %}

    {% callout type="note" title="Is ufw enabled on this host?" %}
    Check now with `sudo ufw status`. If it says *active*, you will add three ufw rules for the lab in the next section.
    {% /callout %}
  {% /task %}

  {% task id="task-6ce4a47198c7" legacyIndex=2 title="Host: install LXD 5.21 LTS and hold it" %}
    Install from the **5.21 LTS** track (supported until June 2029), hold it so it cannot jump to a new version without you, and add yourself to the `lxd` group.

```bash {% title="Ubuntu host" %}
snap list lxd 2>/dev/null || sudo snap install lxd --channel=5.21/stable
sudo snap refresh lxd --channel=5.21/stable     # no-op if already on 5.21/stable
sudo snap refresh --hold lxd                    # stop automatic updates (undo: --unhold)
sudo usermod -aG lxd "$USER"
newgrp lxd          # or log out and back in
lxc version                                      # Client/Server version: 5.21.x LTS
```

    {% callout type="tip" title="Why hold the snap?" %}
    Snaps update themselves in the background. Holding LXD keeps the lab on the version you built it with. Apply security fixes when you choose: `sudo snap refresh lxd`.
    {% /callout %}
  {% /task %}

  {% task id="task-143e1f080c3f" legacyIndex=3 title="Host: run the first-time setup" %}

```bash {% title="Ubuntu host" %}
lxd init
```

    Answer the questions like this:

    | Question | Answer | Why |
    | --- | --- | --- |
    | Would you like to use LXD clustering? | no | One machine |
    | Do you want to configure a new storage pool? | yes | |
    | Name of the new storage pool | default | |
    | Name of the storage backend | zfs | Instant snapshots, thin disks |
    | Create a new ZFS pool? | yes | |
    | Use an existing empty block device? | no | Uses a file on your disk; simplest |
    | Size in GiB of the new loop device | 200 | Sparse file: grows only as used. The lab used about 2 GiB; 100 is plenty if space is tight. |
    | Connect to a MAAS server? | no | |
    | Create a new local network bridge? | no | You create the lab network yourself next |
    | Configure LXD to use an existing bridge or host interface? | no | |
    | Would you like the LXD server to be available over the network? | yes | Needed for the web UI |
    | Address to bind LXD to | `<HOST_LAN_IP>` | Only the host's LAN address, never the lab network |
    | Port to bind LXD to | 8443 | |
    | Would you like stale cached images to be updated automatically? | yes | |
    | Print a YAML "lxd init" preseed? | no | |

    {% callout type="note" title="LXD already set up?" %}
    Skip `lxd init` if `lxc storage list` already shows a pool. Just make sure the UI listens only on your LAN address: `lxc config set core.https_address <HOST_LAN_IP>:8443`
    {% /callout %}

    {% callout type="important" title="Keep the host's address fixed" %}
    Give the host a static IP or a DHCP reservation on your router. If `<HOST_LAN_IP>` changes, the UI address stops working.
    {% /callout %}
  {% /task %}
{% /lab %}

{% lab
  objectives=["ch01.lab-network","ch01.lab-machines","ch01.lab-tools","ch01.lab-reset"]
  id="ui"
  title="Phase 02 · Open the LXD UI (~5 min)"
  hosts=["Ubuntu host","your browser"]
  outcomes=["Log in to the LXD web UI with a client certificate."] %}
  {% task id="task-8e6cd2906b54" legacyIndex=1 title="LXD UI: open the address" %}
    From any browser on your local network, go to `https://<HOST_LAN_IP>:8443`. Accept the self-signed certificate warning (*Advanced → Proceed*).
  {% /task %}

  {% task id="task-f7f76ea9ca36" legacyIndex=2 title="LXD UI: create a certificate" %}
    Choose **Create a new certificate** and follow the wizard: **Generate** → copy the command it shows → run it on the host → **Download .pfx** → import it into your browser → restart the browser.

```bash {% title="Ubuntu host: run the command the wizard shows, usually" %}
lxc config trust add --name lxd-ui
# newer LXD 6.x shows: lxc auth identity create tls/lxd-ui --group admins
```
  {% /task %}

  {% task id="task-5b62233c33a2" legacyIndex=3 title="LXD UI: log in" %}
    Reload the page and pick the certificate when asked. You should land on **Instances**.

    {% callout type="tip" title="No UI at all?" %}
    `sudo snap set lxd ui.enable=true && sudo systemctl reload snap.lxd.daemon`
    {% /callout %}
  {% /task %}
{% /lab %}
