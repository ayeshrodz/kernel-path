---
title: Snapshots and rht-vmctl
seoTitle: "Snapshots and rht-vmctl: RHCE Home Lab Setup"
description: "Snapshots and rht-vmctl: part of building a free RHCE practice lab at home with Rocky Linux 9 virtual machines on LXD."
kind: lab
minutes: 20
---

{% lead %}
Phase 12. The classroom resets machines with `rht-vmctl`. Here you install a home-lab version with the same syntax, so resetting a machine is the same command in both places. It runs on the Ubuntu host and uses LXD snapshots underneath.
{% /lead %}

{% objectives %}
- Install `rht-vmctl` on the host.
- Verify the whole build, then take the `clean` baseline snapshot at the right moment.
- Reset machines at home the way you would in a classroom, and know the one snapshot rule ZFS imposes.
{% /objectives %}

## The reset loop

Build the lab once, save a `clean` snapshot, then break things freely: any machine can go back to `clean` in seconds.

{% diagram ref="baseline-timeline" /%}

## Install and use it

{% lab
  objectives=["ch01.lab-reset"]
  id="rhtvmctl"
  title="Phase 12 · Snapshots and rht-vmctl (~10 min)"
  hosts=["Ubuntu host"]
  outcomes=["Install rht-vmctl.","Verify the build and take the clean baseline."] %}
  {% task id="task-1f2c2379eecd" legacyIndex=1 title="Host: install the script" %}
    Open an empty file for the script. Run `sudo -v` first so the password prompt is out of the way; otherwise the paste would land in the password prompt.

```bash {% title="Ubuntu host" %}
sudo -v                                       # enter your password now
sudo tee /usr/local/bin/rht-vmctl >/dev/null
```

    It now waits for input. Copy the whole script below with its **Copy** button, paste it into the terminal, press {% kbd %}Enter{% /kbd %}, then {% kbd %}Ctrl{% /kbd %}+{% kbd %}D{% /kbd %} to save. The same command overwrites an older copy. Prefer an editor? `sudo nano /usr/local/bin/rht-vmctl`, paste, save with {% kbd %}Ctrl{% /kbd %}+{% kbd %}O{% /kbd %} and exit with {% kbd %}Ctrl{% /kbd %}+{% kbd %}X{% /kbd %}.

{% reveal title="Show the rht-vmctl script (303 lines, version 3)" %}

[Download the script](lab/setup/rht-vmctl). Read it before running it. The expandable example below matches the download.

```bash {% title="/usr/local/bin/rht-vmctl" %}
#!/usr/bin/env bash
# rht-vmctl - classroom-style VM control for the Kernel Path LXD home lab
# Install: sudo install -m 755 rht-vmctl /usr/local/bin/rht-vmctl
# Version 2 (2026-09-30): the servers' extra disks are snapshotted and reset too
# Version 3 (2026-10-04): 'servers' and 'all' mean the lab's VMs that exist, so the same
#   commands work in the system administration lab (servera, serverb) and the Ansible lab
set -uo pipefail

VERSION=3

PROJECT="${LAB_PROJECT:-rhce}"
BASELINE="${LAB_BASELINE:-clean}"
SERVERS=(servera serverb serverc serverd)

L()    { lxc --project "$PROJECT" "$@"; }
say()  { printf '\033[1;36m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m!!\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31mxx\033[0m %s\n' "$*" >&2; exit 1; }

exists()   { L info "$1" >/dev/null 2>&1; }
# 'lxc query' ignores --project, so the project goes in the URL
Q()        { lxc query "$1$([[ $1 == *\?* ]] && echo '&' || echo '?')project=$PROJECT"; }
has_snap() { Q "/1.0/instances/$1/snapshots/$2" >/dev/null 2>&1; }
state()    { L list "^${1}\$" -c s --format csv; }

# Extra disks (servera-disk2 ...) are separate volumes: instance snapshots don't
# include them, so each gets its own snapshot with the same name.
vols() {
  Q "/1.0/instances/$1" 2>/dev/null | python3 -c '
import sys, json
for d in json.load(sys.stdin).get("expanded_devices", {}).values():
    if d.get("type") == "disk" and d.get("pool") and d.get("source") and d.get("path") != "/":
        print(d["pool"], d["source"])'
}
vol_has_snap() { Q "/1.0/storage-pools/$1/volumes/custom/$2/snapshots/$3" >/dev/null 2>&1; }

# Put a VM's extra disks back to snapshot NAME (the VM must be stopped)
restore_vols() {
  local v="$1" name="$2" pool vol
  while read -r pool vol; do
    [[ -n $vol ]] || continue
    if ! vol_has_snap "$pool" "$vol" "$name"; then
      warn "$vol has no '$name' snapshot, so it was not reset (run: rht-vmctl save $v)"
    elif L storage volume restore "$pool" "$vol" "$name" </dev/null; then
      echo "  $vol reset"
    else
      fail "$vol: restore failed (see 'The ZFS snapshot rule' in the guide)"
    fi
  done < <(vols "$v")
}

# Snapshots taken after NAME. ZFS only restores a VM's newest snapshot.
newer_than() {
  Q "/1.0/instances/$1/snapshots?recursion=1" 2>/dev/null | python3 -c '
import sys, json
names = [s["name"] for s in sorted(json.load(sys.stdin), key=lambda s: s["created_at"])]
if sys.argv[1] in names: print(" ".join(names[names.index(sys.argv[1]) + 1:]))' "$2"
}
restore_failed() {
  local newer; newer=$(newer_than "$1" "$2")
  if [[ -n $newer ]]; then
    fail "$1: newer snapshot(s) exist: $newer. ZFS only restores the newest; remove them first: rht-vmctl rmsnap $1 NAME"
  else
    fail "$1: restore failed"
  fi
}

# Expand targets: a VM name, 'servers' (those of servera-serverd that exist) or 'all'
# (workstation, the servers and utility, when they exist)
targets() {
  local t s out=()
  for t in "$@"; do
    case "$t" in
      servers) for s in "${SERVERS[@]}"; do exists "$s" && out+=("$s"); done ;;
      all)     for s in workstation "${SERVERS[@]}" utility; do exists "$s" && out+=("$s"); done ;;
      *)       out+=("$t") ;;
    esac
  done
  for t in "${out[@]}"; do
    if exists "$t"; then echo "$t"; else warn "no such VM: $t (skipped)"; fi
  done
}

RC=0
fail() { warn "$1"; RC=1; }

# Wait until a VM has booted: the LXD agent answers, then systemd finishes starting up.
# Classroom rht-vmctl hands back a machine that is ready to use; this does the same.
wait_ready() {
  local v="$1" t=0 limit="${LAB_WAIT:-180}"
  [[ ${LAB_NOWAIT:-0} == 1 ]] && return 0
  until L exec "$v" -- true >/dev/null 2>&1; do
    sleep 2; t=$((t + 2))
    (( t >= limit )) && { fail "$v: not ready after ${limit}s (check: rht-vmctl view $v)"; return 1; }
  done
  L exec "$v" -- systemctl is-system-running --wait >/dev/null 2>&1
  echo "  $v ready"
}

need_target() { [[ $# -gt 0 ]] || die "which VM? e.g. 'rht-vmctl $SUB servera' or 'rht-vmctl $SUB all'"; }
confirm()     { local a; read -r -p "$1 [y/N] " a; [[ $a == [yY]* ]]; }
has_ws()      { printf '%s\n' "$@" | grep -qx workstation; }

usage() {
cat <<USAGE
rht-vmctl v$VERSION - Kernel Path home lab (LXD project: $PROJECT)

Classroom commands (same syntax):
  rht-vmctl status    VM|all       show state
  rht-vmctl start     VM|all       start
  rht-vmctl stop      VM|all       clean shutdown
  rht-vmctl poweroff  VM|all       force off
  rht-vmctl reset     VM|all       back to the '$BASELINE' snapshot, extra disks included
  rht-vmctl fullreset VM|all       same as reset in this lab
  rht-vmctl view      VM           text console (Ctrl+a then q to leave)

Home-lab extras:
  rht-vmctl save    [VM|all] [-n NAME]   take a snapshot (default: all, '$BASELINE')
  rht-vmctl snaps   [VM|all]             list snapshots, extra disks included
  rht-vmctl restore VM NAME              restore a named snapshot
  rht-vmctl rmsnap  VM NAME              delete a snapshot
  rht-vmctl login   VM [USER]            shell in a VM (default user: student)
  rht-vmctl ws                           shortcut for student@workstation

VM can also be 'servers' (servera to serverd, whichever exist) or 'all'.
start/reset/restore wait until each VM has booted, like the classroom.
  LAB_NOWAIT=1 rht-vmctl reset servera   # return immediately instead
Anything that resets workstation asks first: your playbooks live there.
USAGE
}

cmd_status() {
  need_target "$@"
  local v; mapfile -t vms < <(targets "$@")
  for v in "${vms[@]}"; do printf '%-12s %s\n' "$v" "$(state "$v")"; done
}

cmd_start() {
  need_target "$@"
  local v; mapfile -t vms < <(targets "$@")
  for v in "${vms[@]}"; do
    [[ $(state "$v") == RUNNING ]] && { echo "  $v already running"; continue; }
    if L start "$v"; then echo "  $v started"; else fail "$v: start failed"; fi
  done
  for v in "${vms[@]}"; do wait_ready "$v"; done
}

cmd_stop() {
  need_target "$@"
  local v; mapfile -t vms < <(targets "$@")
  for v in "${vms[@]}"; do
    [[ $(state "$v") == STOPPED ]] && { echo "  $v already stopped"; continue; }
    L stop "$v" && echo "  $v stopped"
  done
}

cmd_poweroff() {
  need_target "$@"
  local v; mapfile -t vms < <(targets "$@")
  for v in "${vms[@]}"; do
    [[ $(state "$v") == STOPPED ]] && { echo "  $v already off"; continue; }
    L stop --force "$v" && echo "  $v powered off"
  done
}

cmd_reset() {
  need_target "$@"
  local v done_vms=(); mapfile -t vms < <(targets "$@")
  [[ ${#vms[@]} -eq 0 ]] && die "nothing to reset"
  if has_ws "${vms[@]}"; then
    warn "this resets workstation too; your playbooks in ~/ansible will be lost"
    confirm "Continue?" || die "cancelled"
  fi
  say "resetting to '$BASELINE': ${vms[*]}"
  for v in "${vms[@]}"; do
    has_snap "$v" "$BASELINE" || { fail "$v has no '$BASELINE' snapshot (run: rht-vmctl save $v)"; continue; }
    [[ $(state "$v") == STOPPED ]] || L stop --force "$v"
    if L restore "$v" "$BASELINE"; then
      echo "  $v reset"
      restore_vols "$v" "$BASELINE"
      L start "$v"
      done_vms+=("$v")
    else
      restore_failed "$v" "$BASELINE"
      L start "$v" >/dev/null 2>&1 && done_vms+=("$v")
    fi
  done
  for v in "${done_vms[@]}"; do wait_ready "$v"; done
}

cmd_view() {
  [[ $# -eq 1 ]] || die "usage: rht-vmctl view VM"
  exists "$1" || die "no such VM: $1"
  L console "$1"
}

cmd_save() {
  local name="$BASELINE" args=() v over=()
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -n|--name) name="${2:?missing snapshot name}"; shift 2 ;;
      *) args+=("$1"); shift ;;
    esac
  done
  [[ ${#args[@]} -eq 0 ]] && args=(all)
  mapfile -t vms < <(targets "${args[@]}")
  [[ ${#vms[@]} -eq 0 ]] && die "nothing to snapshot"
  for v in "${vms[@]}"; do has_snap "$v" "$name" && over+=("$v"); done
  if [[ ${#over[@]} -gt 0 ]]; then
    warn "snapshot '$name' already exists on: ${over[*]}"
    confirm "Replace it?" || die "cancelled"
  fi
  say "snapshot '$name' on: ${vms[*]}"
  for v in "${vms[@]}"; do
    has_snap "$v" "$name" && L delete "$v/$name"
    [[ $(state "$v") == RUNNING ]] && L exec "$v" -- sync </dev/null >/dev/null 2>&1   # flush the guest's disk cache
    if L snapshot "$v" "$name" </dev/null; then echo "  $v saved"; else fail "$v: snapshot failed"; continue; fi
    while read -r pool vol; do
      [[ -n $vol ]] || continue
      vol_has_snap "$pool" "$vol" "$name" && L storage volume delete "$pool" "$vol/$name" </dev/null >/dev/null
      if L storage volume snapshot "$pool" "$vol" "$name" </dev/null >/dev/null; then echo "  $vol saved"
      else fail "$vol: snapshot failed"; fi
    done < <(vols "$v")
  done
}

cmd_snaps() {
  local v; [[ $# -eq 0 ]] && set -- all
  mapfile -t vms < <(targets "$@")
  for v in "${vms[@]}"; do
    printf '\033[1m%s\033[0m\n' "$v"
    Q "/1.0/instances/$v/snapshots?recursion=1" 2>/dev/null | python3 -c '
import sys, json
raw = sys.stdin.read().strip()
d = json.loads(raw) if raw else []
if not d: print("  (none)")
for s in d: print("  %-20s %s" % (s["name"], s["created_at"][:19].replace("T", " ")))'
    while read -r pool vol; do
      [[ -n $vol ]] || continue
      printf '  disk %-15s ' "$vol"
      Q "/1.0/storage-pools/$pool/volumes/custom/$vol/snapshots" </dev/null 2>/dev/null | python3 -c '
import sys, json
raw = sys.stdin.read().strip()
names = [u.split("/snapshots/")[1].split("?")[0] for u in (json.loads(raw) if raw else [])]
print(", ".join(names) or "(none)")'
    done < <(vols "$v")
  done
}

cmd_restore() {
  [[ $# -eq 2 ]] || die "usage: rht-vmctl restore VM NAME"
  exists "$1"      || die "no such VM: $1"
  has_snap "$1" "$2" || die "$1 has no snapshot '$2' (see: rht-vmctl snaps $1)"
  if [[ $1 == workstation ]]; then confirm "Restore workstation to '$2'? Newer work is lost." || die "cancelled"; fi
  [[ $(state "$1") == STOPPED ]] || L stop --force "$1"
  if L restore "$1" "$2"; then
    say "$1 restored to '$2'"
    restore_vols "$1" "$2"
    L start "$1"
    wait_ready "$1"
  else
    restore_failed "$1" "$2"
    L start "$1" >/dev/null 2>&1
  fi
}

cmd_rmsnap() {
  [[ $# -eq 2 ]] || die "usage: rht-vmctl rmsnap VM NAME"
  has_snap "$1" "$2" || die "$1 has no snapshot '$2'"
  L delete "$1/$2" && say "deleted $1/$2"
  local pool vol
  while read -r pool vol; do
    [[ -n $vol ]] && vol_has_snap "$pool" "$vol" "$2" && L storage volume delete "$pool" "$vol/$2" </dev/null >/dev/null && say "deleted $vol/$2"
  done < <(vols "$1")
}

cmd_login() {
  [[ $# -ge 1 ]] || die "usage: rht-vmctl login VM [USER]"
  local vm="$1" user="${2:-student}"
  exists "$vm" || die "no such VM: $vm"
  if [[ $user == root ]]; then L exec "$vm" -- bash -l
  else L exec "$vm" -- su - "$user"; fi
}

SUB="${1:-help}"; shift || true
case "$SUB" in
  status)            cmd_status "$@" ;;
  start)             cmd_start "$@" ;;
  stop)              cmd_stop "$@" ;;
  poweroff)          cmd_poweroff "$@" ;;
  reset|fullreset)   cmd_reset "$@" ;;
  view|console)      cmd_view "$@" ;;
  save|snap)         cmd_save "$@" ;;
  snaps)             cmd_snaps "$@" ;;
  restore)           cmd_restore "$@" ;;
  rmsnap)            cmd_rmsnap "$@" ;;
  login)             cmd_login "$@" ;;
  ws)                cmd_login workstation student ;;
  help|-h|--help)    usage ;;
  version|--version) echo "rht-vmctl $VERSION" ;;
  *)                 usage; exit 1 ;;
esac
exit $RC
```

{% /reveal %}
  {% /task %}

  {% task id="task-a4caf1b94492" legacyIndex=2 title="Host: make it executable and try it" %}

```bash {% title="Ubuntu host" %}
sudo chmod 755 /usr/local/bin/rht-vmctl
bash -n /usr/local/bin/rht-vmctl && rht-vmctl version    # no syntax errors; "rht-vmctl 3"
rht-vmctl status all
```

    {% callout type="note" title="Updating from an older version" %}
    Install the current version the same way: the `tee` command overwrites the old file and keeps its permissions. Version 3 only changes what `servers` and `all` mean (the VMs that exist), so the same commands also work in the smaller system administration lab. Coming from version 1, which didn't snapshot the servers' extra disks, also run `rht-vmctl save` once and answer `y`: that retakes `clean` with disk snapshots, and `rht-vmctl snaps` then shows a `disk` line under each server.
    {% /callout %}
  {% /task %}

  {% task id="task-9f6ba446521d" legacyIndex=3 title="Host: verify the whole build" %}
    The `clean` snapshot is what every reset returns to, so check everything first. This changes nothing: it prints PASS or FAIL for every requirement in this chapter, including that workstation has no project yet. Every line should pass (the utility line only matters if you built it).

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

echo "== VMs"
for vm in workstation servera serverb serverc serverd utility; do
  lxc info --project $P "$vm" >/dev/null 2>&1 || { echo "  skip $vm (not created)"; continue; }
  chk "$vm running"                 "lxc list --project $P ^$vm\$ -c s --format csv | grep -q RUNNING"
  chk "$vm FQDN hostname"           "X $vm 'hostname | grep -q ^$vm.lab.example.com\$'"
  chk "$vm profile packages"        "X $vm 'rpm -q lvm2 tar rsync vim-enhanced firewalld chrony policycoreutils-python-utils'"
  chk "$vm SELinux enforcing"       "X $vm 'test \$(getenforce) = Enforcing'"
  chk "$vm firewalld running"       "X $vm 'systemctl is-active --quiet firewalld'"
done

echo "== servers"
for vm in servera serverb serverc serverd; do
  chk "$vm sdb present and empty"    "X $vm 'test -b /dev/sdb && [ -z \"\$(lsblk -no FSTYPE /dev/sdb)\" ] && [ \$(lsblk -no NAME /dev/sdb | wc -l) -eq 1 ]'"
  chk "$vm devops passwordless sudo" "X $vm 'sudo -u devops sudo -n true'"
done

echo "== workstation"
chk "ansible is /usr/bin, core 2.14"    "S 'which -a ansible | grep -vq /usr/bin/ansible && exit 1; ansible --version | grep -q \"core 2.14\"'"
chk "ansible-navigator 26.9.0"          "S 'ansible-navigator --version | grep -q 26.9.0'"
chk "navigator EE disabled"             "S 'grep -q \"enabled: false\" ~/.ansible-navigator.yml'"
chk "collections for core 2.14"         "S 'ansible-galaxy collection list 2>/dev/null | grep -q \"^ansible.posix  *1.5\" && ansible-galaxy collection list 2>/dev/null | grep -q \"^community.general  *9\\.\"'"
chk "no ~/ansible project (clean)"      "S '! test -e ~/ansible'"
chk "SSH keys: devops, student, root"   "S 'for h in workstation servera serverb serverc serverd; do for u in devops student root; do ssh -o BatchMode=yes \$u@\$h true || exit 1; done; done'"
chk "lab command installed"             "S 'lab version'"
chk "names resolve inside lab"          "S 'getent hosts serverd.lab.example.com'"
chk "internet via NAT"                  "S 'curl -sfI -m5 https://rockylinux.org'"
chk "utility serves files (optional)"   "S 'curl -sf -m5 http://materials.example.com/files/user_list.yml'"
chk_not "lab cannot reach host LAN IP"  "S 'ping -c1 -W2 $LANIP'"
chk_not "lab cannot reach router"       "S 'ping -c1 -W2 $GW'"
```

    | If this fails | Go to |
    | --- | --- |
    | LXD on 5.21/stable and held | [Section 1.2](#/ch01/prepare-host), `sudo snap refresh --hold lxd` |
    | seal service / host cannot ping / lab cannot reach | [Section 1.3](#/ch01/network-and-seal), Phase 04 |
    | FQDN hostname, sdb, devops sudo | [Section 1.4](#/ch01/project-profile-disks) profile; recreate the VM |
    | profile packages, SELinux, firewalld | [Repair an existing lab](#/ch01/troubleshooting#repair-an-existing-lab) (no need to recreate) |
    | ansible / navigator / collections lines | [Section 1.6](#/ch01/control-node), steps 1–4 |
    | no ~/ansible project | "Already created files?" below |
    | SSH keys | [Section 1.6](#/ch01/control-node), steps 5 and 6 (running them again is safe) |
    | lab command | [Section 1.6](#/ch01/control-node), step 7 |
    | names resolve / internet | The ufw step in [section 1.3](#/ch01/network-and-seal), then [troubleshooting](#/ch01/troubleshooting) |
  {% /task %}

  {% task id="task-cc2d89cae313" legacyIndex=4 title="Host: take the clean baseline" %}
    When everything passes:

```bash {% title="Ubuntu host" %}
rht-vmctl save          # snapshot 'clean' on every VM; asks before replacing an existing one
```

    Then confirm each VM has exactly one snapshot, `clean`. Remove any older ones with `rht-vmctl rmsnap VM NAME`, so that `clean` is always the newest (see the ZFS rule below).

```bash {% title="Ubuntu host: every line should read PASS …: clean" %}
for vm in workstation servera serverb serverc serverd utility; do
  lxc info --project rhce "$vm" >/dev/null 2>&1 || continue
  n=$(lxc query "/1.0/instances/$vm/snapshots?project=rhce" | sed -n 's#.*/snapshots/\([^?"]*\).*#\1#p' | paste -sd,)
  [ "$n" = clean ] && echo "  PASS $vm: $n" || echo "  FAIL $vm: $n"
done
for vm in servera serverb serverc serverd; do          # the extra disks have their own snapshots
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
- ansible-core 2.14, rhel-system-roles, podman, Python 3.11
- `ansible.posix` and `community.general` in `/usr/share/ansible/collections`
- `ansible-navigator` (in `~/.venvs/navigator`), `~/.ansible-navigator.yml`, `~/.vimrc`
- SSH keys from `student@workstation` to `devops`, `student` and `root` on every machine
- The `lab` command for starting exercises
- Empty extra disks (`sdb`) on the servers

{% /column %}
{% column title="Not in it (created afterwards)" tone="gray" %}

- The `~/ansible` project folder and any exercise folders created by `lab start`
- `ansible.cfg`, inventory and playbooks
- Collections or roles you install with `ansible-galaxy`
- Anything a playbook changes on the servers

{% /column %}
{% /columns %}

{% callout type="warning" title="Already created files before the snapshot?" %}
If you worked through section 1.8 (or any exercise) before saving, `clean` contains that work. Remove it and save again; `rht-vmctl save` asks before replacing the old snapshot.

```bash {% title="student@workstation: remove Ansible work, keep the tools" %}
rm -rf ~/ansible ~/.ansible            # project, installed collections/roles, Ansible temp files
# ~/.venvs/navigator and ~/.ansible-navigator.yml stay: they're tools, not work
```

```bash {% title="Ubuntu host: tidy the servers, then retake" %}
for vm in servera serverb serverc serverd; do
  lxc exec --project rhce "$vm" -- rm -rf /home/devops/.ansible /root/.ansible
done
rht-vmctl save                          # answer y to replace 'clean', then re-run the verification
```

If exercises already changed the servers (packages, users, files, partitions on `sdb`), cleaning them by hand is unreliable. It's quicker to delete and recreate those VMs (section 1.5), redo the SSH key step for them (section 1.6), then save.
{% /callout %}

## Command reference

A *VM* is a name like `servera`, or `servers` (servera–serverd), or `all`.

| Command | What it does | Classroom equivalent |
| --- | --- | --- |
| `rht-vmctl status all` | State of each VM | same |
| `rht-vmctl start all` | Start VMs and wait until they have booted | same |
| `rht-vmctl stop all` | Clean shutdown | same |
| `rht-vmctl poweroff serverb` | Force off | same |
| `rht-vmctl reset servera` | Back to the `clean` snapshot, extra disk (`sdb`) included, booted and ready | same |
| `rht-vmctl reset servers` | Reset servera–serverd, never workstation | — |
| `rht-vmctl reset all` | Reset everything; asks first because of workstation | same |
| `rht-vmctl fullreset serverc` | Same as reset in this lab | same |
| `rht-vmctl view servera` | Text console; leave with {% kbd %}Ctrl{% /kbd %}+{% kbd %}a{% /kbd %} then {% kbd %}q{% /kbd %} | same |
| `rht-vmctl save` | Create/replace the `clean` baseline on every VM and its extra disk | — |
| `rht-vmctl save workstation -n ch04-done` | Named checkpoint | — |
| `rht-vmctl snaps` | List snapshots (UTC times) | — |
| `rht-vmctl restore VM NAME` | Go back to a named snapshot | — |
| `rht-vmctl rmsnap VM NAME` | Delete a snapshot (and the extra disk's snapshot of the same name) | — |
| `rht-vmctl ws` | Log in as `student@workstation` | — |
| `rht-vmctl version` | Which version is installed | — |
| `rht-vmctl login servera root` | Shell on any VM (default user: student) | — |

{% callout type="exam" title="Only for the classroom" %}
`rht-vmctl` is lab housekeeping. It is not an Ansible skill and not something to study for the exam.
{% /callout %}

## Coming from a classroom

Where classroom instructions run a command on the classroom's host machine, run the same command on the Ubuntu host as yourself.

| Classroom command | Home lab | Same behaviour? |
| --- | --- | --- |
| `rht-vmctl reset servera` | identical | Yes. Returns once servera has booted and is ready |
| `rht-vmctl reset workstation` | identical | Yes, but asks first, because your playbooks live there |
| `rht-vmctl reset all` | identical | Yes, with the same confirmation. Use `reset servers` to skip it |
| `rht-vmctl start` / `stop` / `status` | identical | Yes |
| `rht-vmctl view servera` | identical | Text console instead of a graphical window. Log in as `root` / `redhat` |
| `rht-vmctl fullreset servera` | identical | Same as `reset` here; the classroom also re-fetches the original disk image |
| `lab start NAME` | identical, on workstation | Creates the project folder and starter files. It does not reset the servers: run `rht-vmctl reset servers` first |
| `lab finish NAME` | identical, on workstation | Moves `~/NAME` into `~/lab-archive/`. It cannot reset the servers: run `rht-vmctl reset servers` on the host afterwards |
| `lab grade NAME` | available | Read-only checks, with named checkpoints and optional JSON reports |

### lab start at home

In the classroom, `lab start` prepares each exercise: it creates the exercise folder on workstation (for example `~/playbook-basic`) with a ready-made `ansible.cfg`, `inventory` and any other files, and resets the servers. At home the two halves are separate commands:

{% steps %}
  {% step title="Reset the servers" %}
    On the Ubuntu host: `rht-vmctl reset servers`.
  {% /step %}
  {% step title="Start the exercise" %}
    On workstation: `lab start playbook-basic`, the same command as in a classroom. The home-lab `lab` command from [section 1.6](#/ch01/control-node) downloads that exercise's starter files into `~/playbook-basic`. Each exercise page lists them; click one to read it.
  {% /step %}
  {% step title="Finish" %}
    Check your result with the exercise's own verification steps and repeat the playbook and inspect unexpected changes. Then `lab finish playbook-basic` on workstation, which moves your project into `~/lab-archive/`, and `rht-vmctl reset servers` on the host. Use `lab grade playbook-basic` before finishing, or `lab grade playbook-basic --json > result.json` to save a report.
  {% /step %}
{% /steps %}

{% callout type="tip" title="Classroom or home: pick once" %}
Every exercise has a small switch, *Red Hat classroom* or *Home lab*. It decides which preparation steps, and which output where they differ, you are shown. The site remembers your choice.
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

**Workstation:** snapshots are one-way; restoring `clean` is only possible while it's still the newest. Keep your playbooks in Git (`cd ~/ansible && git init`) instead of relying on a chain of workstation snapshots.
{% /callout %}
