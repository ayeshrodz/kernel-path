---
title: Troubleshooting and fast rebuild
seoTitle: "Troubleshooting and fast rebuild: RHCE Home Lab Setup"
description: "Troubleshooting and fast rebuild: part of building a free RHCE practice lab at home with Rocky Linux 9 virtual machines on LXD."
kind: summary
minutes: 10
---

{% lead %}
Fixes for everything that went wrong while this lab was built and tested, a command to record your versions, and the whole build as a script for when you want to rebuild from scratch.
{% /lead %}

## ufw on the host

Ubuntu's **ufw** firewall is off by default, but if you have enabled it, its default policy blocks three things the lab needs. It doesn't show up until the VMs first try to use the network.

| Symptom | What ufw is blocking |
| --- | --- |
| VMs show no IPv4 address in `lxc list` | DHCP requests from the lab to the host (UDP 67) |
| Lab names like `servera.lab.example.com` don't resolve | DNS requests from the lab to the host (port 53) |
| `dnf` or `curl` to the internet hangs inside VMs | Forwarding of lab traffic out to the internet |

```bash {% title="Ubuntu host: allow the lab through ufw" %}
sudo ufw status                                             # "Status: active" means you need this
sudo ufw allow in on rhcebr0 to any port 67 proto udp       # DHCP: VMs get their IPs
sudo ufw allow in on rhcebr0 to any port 53                 # DNS: lab names resolve
sudo ufw route allow in on rhcebr0                          # forwarding: VMs reach the internet
sudo ufw reload
lxc restart --project rhce --all                            # VMs ask for their IPs again
```

These rules are scoped to `rhcebr0`, so nothing changes for the rest of the host. They don't open the lab to anyone either: ufw only *adds* permissions, and the `rhce_isolate` seal still drops traffic from the lab to your local network, and everything coming in.

```bash {% title="Ubuntu host: confirm" %}
sudo ufw status verbose | grep rhcebr0
lxc list --project rhce          # every VM has its 172.25.250.x address again
```

## General problems

{% callout type="tip" title="First step for any network problem" %}
Temporarily remove the lab firewall with `sudo systemctl stop rhce-isolate`. If the problem goes away, it's the rules; if not, it's something else. Start the firewall again afterwards.
{% /callout %}

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| VM stuck at boot; *Console* shows a UEFI / secure boot error | Secure boot | Check `security.secureboot: "false"` in the profile, then restart the VM |
| `lxc exec` says the agent isn't running | First boot not finished, or not the *cloud* image | Wait two minutes, or use the UI *Console* tab and log in as root/redhat. If still broken, recreate the VM from the cloud image. |
| Users don't exist | cloud-init didn't run or hit a YAML error | In the VM: `cloud-init status --long`, `less /var/log/cloud-init-output.log`. Fix the profile and recreate the VM. |
| No IPv4 address in `lxc list` | DHCP blocked, or NIC not on `rhcebr0` | Check `devices.eth0` in the VM's YAML. If ufw is active, see above. |
| "Instance DHCP static allocation … already used" | Two VMs share an IP | Give each a unique `ipv4.address` |
| Names like `servera.lab.example.com` don't resolve | DNS domain missing | Check `dns.domain: lab.example.com` on `rhcebr0`, then restart the VMs |
| VMs can't reach the internet | NAT off, or ufw/Docker blocking forwarding | `ipv4.nat: "true"`. With ufw: see above. With Docker installed: `sudo iptables -I DOCKER-USER -i rhcebr0 -j ACCEPT` and `sudo iptables -I DOCKER-USER -o rhcebr0 -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT` |
| Need a VM to reach your local network temporarily | Blocked by design | Remove `192.168.0.0/16` from the `forward` chain, then `sudo systemctl restart rhce-isolate` |
| Packages such as `lvm2` or `tar` missing, `getenforce` says *Disabled*, yet `cloud-init status` says *done* | No DNS or internet on the first boot (usually ufw); cloud-init only logs a warning | Fix the network, then [repair the lab](#repair-an-existing-lab). `grep -i "failed to download" /var/log/cloud-init-output.log` confirms it |
| `lxc exec`: *"LXD VM agent is not currently running"* after switching SELinux on | The agent's label rule is missing, so SELinux blocks it (the console log shows `denied { create } … vsock_socket`) | Log in from workstation (`ssh devops@servera`) and run the three SELinux lines from [the repair steps](#repair-an-existing-lab), or `rht-vmctl reset` the VM |
| Same, straight after an SELinux exercise | A playbook purged local SELinux changes (for example `selinux_fcontexts_purge: true` in the SELinux system role) | `rht-vmctl reset` the VM; in your own playbooks, leave purging off |
| *"couldn't resolve module/action 'ansible.posix.firewalld'"* | Collections not installed, or `collections_path` in `ansible.cfg` lists only `./collections` | Install them as in [section 1.6](#/ch01/control-node), step 2, and use the three-path line from [section 1.8](#/ch01/first-project-and-daily-use) |
| *"Collection … does not support Ansible version 2.14"* | An unpinned `ansible-galaxy` install picked the newest release | Pin `ansible.posix:1.5.4` and `community.general:9.5.13` |
| `lab: command not found`, or `lab start` says there is no such exercise | The `lab` command is not installed, or workstation has no internet | [Section 1.6](#/ch01/control-node), step 7. `lab list` shows the exercise names |
| A playbook with `remote_user: root` (or none) fails with *Permission denied (publickey…)* | The SSH key is only installed for `devops` | [Section 1.6](#/ch01/control-node), step 6. `lab check` shows which logins are missing |
| Those logins worked, then stopped after `rht-vmctl reset servers` | The `clean` baseline was saved before the keys were set up, so every reset removes them | Repeat steps 5 and 6 of [section 1.6](#/ch01/control-node), confirm with `lab check`, then run `rht-vmctl save` on the host |
| `lab finish` did not reset the servers | By design: `lab` runs inside the sealed lab network and cannot reach the host | Run `rht-vmctl reset servers` on the Ubuntu host |
| `curl http://servera` from workstation fails, but the web server is running | firewalld on the server, as in the classroom | Open the port in your playbook with `ansible.posix.firewalld` (`service: http`, `permanent: true`, `immediate: true`) |
| `lsblk` doesn't show the 5 GiB disk | Volume made as filesystem, not block | Recreate it with *Content type: block*; attach it with the VM stopped |
| VM-to-VM SSH: "Permission denied (publickey)" | Password login disabled | Check `ssh_pwauth: true` in the profile, or on the VM: `sudo sed -i 's/^PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config.d/*.conf && sudo systemctl restart sshd` |
| Warning: *"is using the discovered Python interpreter at /usr/bin/python3.9"* | Harmless; Ansible found Python by searching | Add `interpreter_python = auto_silent` to `[defaults]` in `ansible.cfg` |
| Every host shows yellow **CHANGED** for `ansible … -m command` | Normal for `command`/`shell` | Nothing to fix; those modules always report changed |
| Restore fails: *"cannot be restored due to subsequent snapshot(s)"* | ZFS only rolls back to the newest snapshot | See [the ZFS snapshot rule](#/ch01/snapshots-and-rht-vmctl). Restore the newest snapshot, or delete newer ones with `rht-vmctl rmsnap` |
| After `rht-vmctl reset`, `sdb` still has partitions or a volume group | The extra disk has no `clean` snapshot: an older `rht-vmctl` only snapshotted the VM | Install the current script from [section 1.7](#/ch01/snapshots-and-rht-vmctl), clear the disk once (`vgremove`, `wipefs -a /dev/sdb1 /dev/sdb`), then `rht-vmctl save`. `reset` warns when a disk has no snapshot |
| `rht-vmctl reset` says there's no `clean` snapshot | Baseline never taken | `rht-vmctl snaps` to check, then `rht-vmctl save` |
| Snapshot times look hours off | LXD shows them in UTC | Convert from UTC to your local time zone |
| `ansible --version` shows `core 2.19` or newer | A pip-installed `ansible-core` is ahead of Rocky's on PATH | See the warning in [section 1.6](#/ch01/control-node), step 3 |
| `which -a ansible` lists the same path several times | A PATH line was appended to `~/.bashrc` more than once | Rocky's default `~/.bashrc` already adds `~/.local/bin`; delete the extra `export PATH=…` lines |
| Navigator: *"Additional properties are not allowed ('enable' was unexpected)"* | `execution-environment` needs `enabled`, not `enable` | Recreate the file with the command in [section 1.6](#/ch01/control-node), step 4, then `rm -f ~/ansible-navigator.log` |
| `ansible-navigator: command not found` | Symlink missing, or a new shell not started | Re-run the `ln -sf` line from section 1.6 step 3, then `exec bash -l` |

## Repair an existing lab

For a lab whose first boot missed its packages, or one built before the profile in [section 1.4](#/ch01/project-profile-disks) switched on SELinux, firewalld and chrony, or added the manual pages and everyday tools the system administration path uses. It brings running VMs up to date in place, keeps everything on them, and takes about five minutes.

```bash {% title="Ubuntu host: install what the profile should have, then reboot to relabel" %}
for vm in workstation servera serverb serverc serverd utility; do
  lxc info --project rhce "$vm" >/dev/null 2>&1 || continue
  lxc exec --project rhce "$vm" -- bash -c '
    dnf install -y python3 python3-libselinux vim-enhanced bash-completion lvm2 tar rsync \
      man-db man-pages tree tmux lsof nano bind-utils \
      selinux-policy-targeted policycoreutils-python-utils firewalld chrony
    semanage fcontext -a -t bin_t "/var/run/lxd_agent(/.*)?" 2>/dev/null || true
    systemctl enable --now firewalld chronyd' </dev/null
done
lxc exec --project rhce utility -- bash -c 'firewall-cmd --permanent --add-service=http && firewall-cmd --reload' 2>/dev/null
lxc restart --project rhce --all      # each VM boots twice while SELinux labels its disk
```

{% callout type="important" title="The semanage line must come before the reboot" %}
Without it, SELinux starts enforcing and blocks the LXD agent, so `lxc exec` and `rht-vmctl ws` stop working for that VM. If that happens, SSH in from workstation as `devops` and run `sudo semanage fcontext -a -t bin_t "/var/run/lxd_agent(/.*)?" && sudo restorecon -R /run/lxd_agent && sudo systemctl restart lxd-agent`.
{% /callout %}

Then install the current `rht-vmctl` from [section 1.7](#/ch01/snapshots-and-rht-vmctl) (it also snapshots the extra disks), and on workstation run steps 1, 2, 5, 6 and 7 of [section 1.6](#/ch01/control-node) (packages, collections, SSH keys for `devops`, `student` and `root`, and the `lab` command), and if utility serves collections, download the pinned versions there too. After about two minutes, run the verification in [section 1.7](#/ch01/snapshots-and-rht-vmctl). When every line passes, replace the baseline with `rht-vmctl save`: the old `clean` doesn't have these fixes.

## Record your versions

Handy when comparing notes or filing an issue. Run it on the host once the lab is built:

```bash {% title="Ubuntu host" %}
echo "== host";  grep PRETTY /etc/os-release; uname -r; snap list lxd; lxc version
echo "== image"; lxc config get --project rhce servera image.description
for vm in workstation servera; do
  echo "== $vm"; lxc exec --project rhce "$vm" -- bash -c 'cat /etc/rocky-release; getenforce; rpm -q selinux-policy-targeted'
done
echo "== workstation tools"
lxc exec --project rhce workstation -- su - student -c '
  which -a ansible; ansible --version | head -1
  rpm -q ansible-core rhel-system-roles podman python3.11
  ansible-navigator --version
  ansible-galaxy collection list 2>/dev/null | grep -E "^(ansible|community|redhat)\."'
```

## Rebuild everything fast

Everything in this chapter as commands, once you know what each step does. It assumes the host is prepared and the seal is enabled (sections 1.2 and 1.3, plus the ufw rules if ufw is active), and that the profile YAML from [section 1.4](#/ch01/project-profile-disks) is saved as `rhce-profile.yaml` on the host. Afterwards, continue with sections 1.6 and 1.7 as normal: prepare workstation (including the collections), add utility if you want it, run the verification, then save `clean`.

[Download the script](lab/setup/build-rhce-lab.sh). Read it before running it. The expandable example below matches the download.

```bash {% title="Ubuntu host: build-rhce-lab.sh" %}
#!/usr/bin/env bash
set -euo pipefail

# Network (Phase 03)
lxc network create rhcebr0 --project default \
  ipv4.address=172.25.250.254/24 ipv4.nat=true \
  ipv4.dhcp.ranges=172.25.250.100-172.25.250.199 \
  ipv6.address=none dns.domain=lab.example.com
lxc network set rhcebr0 --project default \
  raw.dnsmasq="$(printf 'host-record=content.example.com,172.25.250.8\nhost-record=materials.example.com,172.25.250.8')"

# Project (Phase 05)
lxc project create rhce -c features.images=false -c features.profiles=true \
  -c features.storage.volumes=true -c features.networks=false
lxc project switch rhce

# Profile (Phase 06)
lxc profile edit default < rhce-profile.yaml

# Disks and VMs (Phases 07–08)
declare -A IP=( [workstation]=9 [servera]=10 [serverb]=11 [serverc]=12 [serverd]=13 )
for vm in workstation servera serverb serverc serverd; do
  lxc init "${IMAGE:-images:rockylinux/9/cloud}" "$vm" --vm    # IMAGE=rocky9-lab to use a frozen copy
  lxc config device override "$vm" eth0 ipv4.address=172.25.250.${IP[$vm]}
  if [[ $vm == server* ]]; then
    lxc storage volume create default "$vm-disk2" --type=block size=5GiB
    lxc config device add "$vm" disk2 disk pool=default source="$vm-disk2"
  fi
done
lxc config set workstation limits.cpu=2 limits.memory=2GiB

sudo systemctl restart rhce-isolate     # make sure the seal is on before first boot
lxc start --all
sleep 240                                # first boot + the SELinux relabel reboot
lxc list
```

## Tear the whole lab down

{% callout type="warning" title="This deletes every lab VM and disk" %}
Save anything you want to keep from workstation first (`lxc file pull`, or push your Git repository somewhere).
{% /callout %}

The same commands remove the lighter system administration lab, which has only workstation, servera and serverb.

```bash {% title="Ubuntu host" %}
lxc project switch rhce
for vm in workstation servera serverb serverc serverd utility; do
  lxc delete --force "$vm" 2>/dev/null || true
done
for v in servera serverb serverc serverd; do
  lxc storage volume delete default "$v-disk2" 2>/dev/null || true
done
lxc project switch default
lxc project delete rhce
lxc network delete rhcebr0
sudo systemctl disable --now rhce-isolate
```

{% callout type="important" %}
The home lab is built on Rocky Linux 9 VMs on LXD 5.21 LTS, sealed behind an nftables firewall on Ubuntu Server 26.04 LTS, and laid out like a conventional RHEL 9 training classroom. UI labels can differ slightly between LXD versions; the YAML shown is the same everywhere.
{% /callout %}
