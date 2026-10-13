---
title: Snapshots and rht-vmctl
seoTitle: "LXD Snapshots: Reset Lab VMs in Seconds"
description: "Save clean snapshots and reset every VM in seconds with one command. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lab
minutes: 20
---

{% lead %}
Phase 11. Training labs reset their machines with `rht-vmctl`. Here you install a home-lab version with the same syntax. It runs on the Ubuntu host and uses LXD snapshots underneath.
{% /lead %}

{% objectives %}
- Install `rht-vmctl` on the host.
- Verify the whole build, then take the `clean` baseline snapshot at the right moment.
- Reset machines in seconds, and know the one snapshot rule ZFS imposes.
{% /objectives %}

## The reset loop

Build the lab once, save a `clean` snapshot, then break things freely: any machine can go back to `clean` in seconds.

{% diagram ref="baseline-timeline" /%}

## Install and use it

{% lab
  objectives=["ch01.lab-reset"]
  id="rhtvmctl"
  title="Phase 11 · Snapshots and rht-vmctl (~10 min)"
  hosts=["Ubuntu host"]
  outcomes=["Install rht-vmctl.","Verify the build and take the clean baseline."] %}
  {% task id="task-bf7a2980d7d8" legacyIndex=1 title="Host: install the script" %}
    The script is a single Bash file of about 300 lines. [Read it first](lab/setup/rht-vmctl), then download and install it. The same commands replace an older copy.

```bash {% title="Ubuntu host" %}
curl -fsSL https://kernelpath.dev/lab/setup/rht-vmctl -o /tmp/rht-vmctl
less /tmp/rht-vmctl                            # read it; press q to leave
sudo install -m 755 /tmp/rht-vmctl /usr/local/bin/rht-vmctl
```
  {% /task %}

  {% task id="task-defbd8bd0ef3" legacyIndex=2 title="Host: try it" %}

```bash {% title="Ubuntu host" %}
rht-vmctl version                        # "rht-vmctl 3"
rht-vmctl status all                     # workstation, servera, serverb: RUNNING
```

    {% callout type="note" title="Same commands, any lab size" %}
    `servers` means the servers your lab has, and `all` means every VM in it. In this lab that is servera and serverb; in the larger Ansible lab the same commands also cover serverc, serverd and utility. Version 2 or older? Install version 3 the same way.
    {% /callout %}
  {% /task %}

  {% task id="task-2c3c17b28575" legacyIndex=3 title="Host: verify the whole build" %}
    The `clean` snapshot is what every reset returns to, so check everything first. This changes nothing: it prints PASS or FAIL for every requirement in this chapter, including that workstation has no practice files yet. Every line should pass.

```bash {% title="Ubuntu host: verify the build" %}
P=rhce; ok(){ printf '  \e[32mPASS\e[0m %s\n' "$1"; }; ko(){ printf '  \e[31mFAIL\e[0m %s\n' "$1"; }
chk(){ if eval "$2" >/dev/null 2>&1; then ok "$1"; else ko "$1"; fi; }
chk_not(){ if eval "$2" >/dev/null 2>&1; then ko "$1"; else ok "$1"; fi; }
X(){ lxc exec --project $P "$1" -- bash -c "$2" </dev/null; }
S(){ lxc exec --project $P workstation -- su - student -c "$1" </dev/null; }
GW=$(ip route | awk '/^default/{print $3; exit}')
LANIP=$(hostname -I | awk '{print $1}')

echo "== host"
chk "LXD on 5.21/stable and held"   "snap list lxd | grep -q '5.21/stable.*held'"
chk "seal service active"           "systemctl is-active --quiet rhce-isolate"
chk "rhcebr0 up at .254"            "ip -4 addr show rhcebr0 | grep -q 172.25.250.254/24"
chk_not "host cannot ping servera"  "ping -c1 -W2 172.25.250.10"
chk "rht-vmctl 3 or newer"          "[ \$(rht-vmctl version | awk '{print \$2}') -ge 3 ]"

echo "== VMs"
for vm in workstation servera serverb; do
  chk "$vm running"                 "lxc list --project $P ^$vm\$ -c s --format csv | grep -q RUNNING"
  chk "$vm FQDN hostname"           "X $vm 'hostname | grep -q ^$vm.lab.example.com\$'"
  chk "$vm profile packages"        "X $vm 'rpm -q lvm2 tar rsync vim-enhanced man-db tree firewalld chrony policycoreutils-python-utils'"
  chk "$vm SELinux enforcing"       "X $vm 'test \$(getenforce) = Enforcing'"
  chk "$vm firewalld running"       "X $vm 'systemctl is-active --quiet firewalld'"
done

echo "== servers"
for vm in servera serverb; do
  chk "$vm sdb present and empty"   "X $vm 'test -b /dev/sdb && [ -z \"\$(lsblk -no FSTYPE /dev/sdb)\" ] && [ \$(lsblk -no NAME /dev/sdb | wc -l) -eq 1 ]'"
done

echo "== workstation"
chk "student can use sudo"              "S 'echo student | sudo -S true'"
chk "tools installed"                   "S 'which tree tmux dig man'"
chk "SSH key: student and root on both" "S 'for h in servera serverb; do for u in student root; do ssh -o BatchMode=yes \$u@\$h true || exit 1; done; done'"
chk "lab command ready"                 "S 'lab check'"
chk "no practice files yet (clean)"     "S 'test -z \"\$(ls -A ~/practice 2>/dev/null)\"'"
chk "names resolve inside lab"          "S 'getent hosts serverb.lab.example.com'"
chk "internet via NAT"                  "S 'curl -sfI -m5 https://rockylinux.org'"
chk_not "lab cannot reach host LAN IP"  "S 'ping -c1 -W2 $LANIP'"
chk_not "lab cannot reach router"       "S 'ping -c1 -W2 $GW'"
```

    | If this fails | Go to |
    | --- | --- |
    | LXD on 5.21/stable and held | [Section 1.2](#/ch01/prepare-host), `sudo snap refresh --hold lxd` |
    | seal service / host cannot ping / lab cannot reach | [Section 1.3](#/ch01/network-and-seal), Phase 04 |
    | rht-vmctl 3 or newer | Step 1 above |
    | FQDN hostname, sdb | [Section 1.4](#/ch01/project-profile-disks) profile; recreate the VM |
    | profile packages, SELinux, firewalld | [Repair an existing lab](#/ch01/troubleshooting#repair-an-existing-lab) (no need to recreate) |
    | tools installed, sudo | [Section 1.6](#/ch01/workstation), step 1 |
    | SSH key | [Section 1.6](#/ch01/workstation), steps 5 and 6 (running them again is safe) |
    | lab command ready | [Section 1.6](#/ch01/workstation), step 7; `lab check` on workstation says which part fails |
    | no practice files yet | "Already created files?" below |
    | names resolve / internet | The ufw step in [section 1.3](#/ch01/network-and-seal), then [troubleshooting](#/ch01/troubleshooting) |
  {% /task %}

  {% task id="task-989d4fcd1193" legacyIndex=4 title="Host: take the clean baseline" %}
    When everything passes:

```bash {% title="Ubuntu host" %}
rht-vmctl save          # snapshot 'clean' on every VM; asks before replacing an existing one
```

    Then confirm each VM has exactly one snapshot, `clean`. Remove any older ones with `rht-vmctl rmsnap VM NAME`, so that `clean` is always the newest (see the ZFS rule below).

```bash {% title="Ubuntu host: every line should read PASS …: clean" %}
for vm in workstation servera serverb; do
  n=$(lxc query "/1.0/instances/$vm/snapshots?project=rhce" | sed -n 's#.*/snapshots/\([^?"]*\).*#\1#p' | paste -sd,)
  [ "$n" = clean ] && echo "  PASS $vm: $n" || echo "  FAIL $vm: $n"
done
for vm in servera serverb; do          # the extra disks have their own snapshots
  n=$(lxc query "/1.0/storage-pools/default/volumes/custom/$vm-disk2/snapshots?project=rhce" | sed -n 's#.*/snapshots/\([^?"]*\).*#\1#p' | paste -sd,)
  [ "$n" = clean ] && echo "  PASS $vm-disk2: $n" || echo "  FAIL $vm-disk2: $n"
done
```
  {% /task %}
{% /lab %}

### What the baseline contains

{% columns %}
{% column title="In the clean snapshot" tone="green" %}

- Users, passwords and hostnames from cloud-init
- SELinux enforcing, firewalld and chrony running on every VM
- Manual pages, `tree`, `tmux`, `dig`, `lsof`, `nano` and `vim`
- `~/.vimrc` and `~/.tmux.conf` on workstation
- The SSH key from `student@workstation` to `student` and `root` on both servers
- The `lab` command
- Empty extra disks (`sdb`) on the servers

{% /column %}
{% column title="Not in it (created afterwards)" tone="gray" %}

- Exercise folders that `lab start` creates, your `~/practice` folder, and anything else you create in a home directory
- Other SSH keys you generate in the SSH chapter
- Users, packages, files and partitions you add while practising

{% /column %}
{% /columns %}

{% callout type="warning" title="Already created files before the snapshot?" %}
If you practised anything before saving, `clean` contains that work. Remove it and save again; `rht-vmctl save` asks before replacing the old snapshot.

```bash {% title="student@workstation: remove your practice files, keep the tools" %}
rm -rf ~/practice ~/lab-archive
lab list | awk 'NF && !/^#/{print $1}' | while read -r n; do rm -rf ~/"$n"; done   # exercise folders
```

If you changed the servers (packages, users, files, partitions on `sdb`), cleaning them by hand is unreliable. It is quicker to delete and recreate those VMs (section 1.5) and then save.
{% /callout %}

## Command reference

A *VM* is a name like `servera`, or `servers` (servera and serverb here), or `all` (every VM).

| Command | What it does |
| --- | --- |
| `rht-vmctl status all` | State of each VM |
| `rht-vmctl start all` | Start VMs and wait until they have booted |
| `rht-vmctl stop all` | Clean shutdown |
| `rht-vmctl poweroff serverb` | Force off |
| `rht-vmctl reset servera` | Back to the `clean` snapshot, extra disk (`sdb`) included, booted and ready |
| `rht-vmctl reset servers` | Reset the servers, never workstation. Run it before each exercise |
| `rht-vmctl reset all` | Reset everything; asks first because of workstation |
| `rht-vmctl fullreset serverb` | Same as reset in this lab |
| `rht-vmctl view servera` | Text console; leave with {% kbd %}Ctrl{% /kbd %}+{% kbd %}a{% /kbd %} then {% kbd %}q{% /kbd %} |
| `rht-vmctl save` | Create/replace the `clean` baseline on every VM and its extra disk |
| `rht-vmctl save workstation -n ch04-done` | Named checkpoint |
| `rht-vmctl snaps` | List snapshots (UTC times) |
| `rht-vmctl restore VM NAME` | Go back to a named snapshot |
| `rht-vmctl rmsnap VM NAME` | Delete a snapshot (and the extra disk's snapshot of the same name) |
| `rht-vmctl ws` | Log in as `student@workstation` |
| `rht-vmctl login servera root` | Shell on any VM (default user: student) |
| `rht-vmctl version` | Which version is installed |

{% callout type="note" title="Resetting is housekeeping" %}
`rht-vmctl` keeps the practice lab tidy. It is a tool of the lab, not a skill this path teaches.
{% /callout %}

## The ZFS snapshot rule

{% callout type="note" title="The extra disks have snapshots too" %}
LXD keeps `servera-disk2` and the other extra disks as separate volumes, and a VM snapshot doesn't include them. `rht-vmctl` therefore snapshots each extra disk alongside its VM, with the same name, and restores both together. Without that, partitions and volume groups from a storage exercise would survive every reset.
{% /callout %}

ZFS stores a VM's snapshots as a chain and can only roll back to the **newest** one. Going back to an older snapshot would mean deleting every snapshot taken after it, so LXD refuses. Try it:

{% snapshot-chain ref="snapshot-chain" /%}

| Situation | What happens |
| --- | --- |
| `clean` is the newest snapshot on a VM | `rht-vmctl reset` always works. This is the normal case for the servers. |
| You took another snapshot after `clean` | Reset to `clean` fails with the error above |
| You want an older snapshot anyway | Restore the newer one instead, or delete the newer snapshots first with `rht-vmctl rmsnap VM NAME` |

{% callout type="tip" title="How to live with it" %}
**Servers:** keep `clean` as their only (or newest) snapshot, and resets always work.

**Workstation:** snapshots are one-way; restoring `clean` is only possible while it's still the newest. Copy anything you want to keep to the host with `lxc file pull` instead of relying on a chain of workstation snapshots.
{% /callout %}
