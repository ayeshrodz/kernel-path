---
title: Prepare the control node
seoTitle: "Prepare the control node: RHCE Home Lab Setup"
description: "Prepare the control node: part of building a free RHCE practice lab at home with Rocky Linux 9 virtual machines on LXD."
kind: lab
minutes: 25
---

{% lead %}
Phases 10 and 11: turn workstation into the Ansible control node, with the same `ansible-core` generation RHEL 9 uses, `ansible-navigator` in its own virtual environment, and SSH keys to every server. Optionally, add the utility server that serves practice files.
{% /lead %}

Everything in Phase 10 happens on workstation as `student`. Get there with:

```bash {% title="Ubuntu host" %}
lxc exec workstation -- su - student
```

{% lab
  objectives=["ch01.lab-tools"]
  id="control"
  title="Phase 10 · Prepare workstation as the control node (~15 min)"
  hosts=["workstation"]
  outcomes=["Install ansible-core 2.14 and its companions from Rocky’s repositories.","Install ansible-navigator without shadowing the home-lab ansible-core.","Add the ansible.posix and community.general collections, pinned to versions that support ansible-core 2.14.","Configure navigator and SSH keys to every managed host.","Install the home-lab lab command, so lab start works here as it does in a classroom."] %}
  {% task id="task-36204c1d80c4" legacyIndex=1 title="VM: install Ansible from Rocky's repositories" %}
    This home-lab baseline uses `ansible-core` 2.14 from Rocky Linux 9. It supports this course's labs; check the objectives for your booked exam version separately.

```bash {% title="student@workstation" %}
sudo dnf install -y ansible-core rhel-system-roles podman git python3.11 tree
ansible --version | head -1          # ansible [core 2.14.18]
```
  {% /task %}

  {% task id="task-4cd9c852f576" legacyIndex=2 title="VM: add the collections the exercises use" %}
    From chapter 3 on, the exercises use modules such as `ansible.posix.firewalld` and `ansible.posix.authorized_key`. In the classroom they come inside the execution environment; here you install them once, system-wide, where every project finds them. Pin the versions: the latest releases need ansible-core 2.16 or newer and refuse to run on 2.14.

```bash {% title="student@workstation" %}
sudo ansible-galaxy collection install -p /usr/share/ansible/collections \
  ansible.posix:1.5.4 community.general:9.5.13        # sudo password: student
ansible-galaxy collection list
# ansible.posix 1.5.4 · community.general 9.5.13 · redhat.rhel_system_roles 1.120.5
```

    | Collection | Why this version |
    | --- | --- |
    | `ansible.posix` 1.5.4 | Last release that supports ansible-core 2.14 (1.6 and later need 2.15+) |
    | `community.general` 9.5.13 | Last 9.x release; 10.x needs 2.15+, the current 13.x needs 2.18+ |

    {% callout type="tip" title="Why not in ~/.ansible/collections?" %}
    `/usr/share/ansible/collections` is part of the tools, like the execution environment in the classroom. It stays in the `clean` baseline, and clearing `~/.ansible` or a project's `collections/` folder never removes it. Chapter 8 still teaches installing collections into a project, which takes priority over these.
    {% /callout %}
  {% /task %}

  {% task id="task-71cdf056a41b" legacyIndex=3 title="VM: install ansible-navigator in a virtual environment" %}
    Navigator needs Python 3.10 or later (Rocky 9's system Python is 3.9, hence `python3.11`). Keep it in a virtual environment: pip also installs a newer `ansible-core` as a navigator dependency, and a plain `pip install --user` would put that copy in front of the exam-aligned one.

```bash {% title="student@workstation" %}
python3.11 -m venv ~/.venvs/navigator
~/.venvs/navigator/bin/pip install --upgrade pip
~/.venvs/navigator/bin/pip install "ansible-navigator==26.9.0"

# expose ONLY the navigator command; ~/.local/bin is already on PATH in Rocky's default ~/.bashrc
mkdir -p ~/.local/bin
ln -sf ~/.venvs/navigator/bin/ansible-navigator ~/.local/bin/ansible-navigator

ansible-navigator --version          # ansible-navigator 26.9.0
which -a ansible                     # /usr/bin/ansible only
```

    {% callout type="warning" title="Installed navigator with pip install --user earlier?" %}
    If `which -a ansible` lists `~/.local/bin/ansible`, a pip copy of `ansible-core` is shadowing Rocky's. Remove the user-level pip packages and any PATH line you added to `~/.bashrc`, then repeat this step:

```bash {% title="student@workstation: undo a --user install" %}
python3.11 -m pip show ansible-core ansible-navigator
# Confirm these packages are in your user site before removing only these tools.
python3.11 -m pip uninstall ansible-core ansible-navigator
sed -i '/export PATH=\$HOME\/.local\/bin:\$PATH/d' ~/.bashrc
exec bash -l                         # reload the shell
which -a ansible                     # should now be /usr/bin/ansible only
```
    {% /callout %}
  {% /task %}

  {% task id="task-4f100baad6ce" legacyIndex=4 title="VM: configure navigator" %}
    Plain output, no artifact files (which also lets Vault password prompts work, see chapter 4), and run playbooks with workstation's own `ansible-core` rather than inside a container. Create the file with one command so there is nothing to mistype:

```bash {% title="student@workstation: writes ~/.ansible-navigator.yml" %}
cat > ~/.ansible-navigator.yml <<'EOF'
---
ansible-navigator:
  mode: stdout
  playbook-artifact:
    enable: false         # "enable" here...
  execution-environment:
    enabled: false        # ...but "enabled" here. Uses /usr/bin ansible-core 2.14
EOF
```

    {% callout type="warning" title="enable vs enabled" %}
    Navigator spells these two keys differently: `playbook-artifact.enable` but `execution-environment.enabled`. Mixing them up stops every navigator command with *"Additional properties are not allowed ('enable' was unexpected)"*.
    {% /callout %}

    Prove which Ansible navigator uses:

```bash {% title="student@workstation" %}
cat > /tmp/version.yml <<'EOF'
- hosts: localhost
  gather_facts: false
  tasks:
    - ansible.builtin.debug:
        msg: "ansible-core {{ ansible_version.full }}"
EOF
ansible-navigator run /tmp/version.yml     # msg: ansible-core 2.14.18
rm /tmp/version.yml
```

    If it prints a newer version, check `which -a ansible-playbook`: the first entry must be `/usr/bin/ansible-playbook`.

    {% callout type="note" title="Why no execution environment by default?" %}
    A Red Hat classroom runs playbooks inside Red Hat's supported execution environment, which needs a Red Hat registry login. The free community image works too, but it carries a much newer `ansible-core` (2.19+), whose templating rules changed. Running without a container keeps every playbook on 2.14. To practise the chapter 2 container workflow anyway, run `ansible-navigator images --ee true` once, then add `--ee true` to any command.
    {% /callout %}
  {% /task %}

  {% task id="task-69894a7c7b7b" legacyIndex=5 title="VM: SSH keys from student to devops on every machine" %}
    Enter the password `redhat` once for each machine. Workstation is in the list because some exercises manage it like any other host.

```bash {% title="student@workstation" %}
ssh-keygen -t ed25519 -N '' -f ~/.ssh/id_ed25519
for h in workstation servera serverb serverc serverd; do
  ssh-copy-id -o StrictHostKeyChecking=accept-new devops@$h.lab.example.com
  ssh -o StrictHostKeyChecking=accept-new devops@$h true     # trust the short name too
done
ssh devops@servera sudo id           # uid=0(root), no password asked
```
  {% /task %}

  {% task id="task-815d188a1d19" legacyIndex=6 title="VM: let the same key log in as student and root" %}
    In the classroom, `student` on workstation can also log in to every machine as `student` and as `root` without a password, and a few exercises rely on it (`remote_user: root`, or no `remote_user` at all). This reuses `devops`'s sudo, so there are no more passwords to type:

```bash {% title="student@workstation" %}
pub=$(cat ~/.ssh/id_ed25519.pub)
for h in workstation servera serverb serverc serverd; do
  ssh devops@$h "for u in student root; do
      d=\$(getent passwd \$u | cut -d: -f6)/.ssh
      sudo install -d -m 700 -o \$u -g \$u \$d
      sudo grep -qxF '$pub' \$d/authorized_keys 2>/dev/null || echo '$pub' | sudo tee -a \$d/authorized_keys >/dev/null
      sudo chown \$u:\$u \$d/authorized_keys; sudo chmod 600 \$d/authorized_keys; sudo restorecon -R \$d
    done"
done
ssh root@servera id                  # uid=0(root)
ssh student@serverb hostname         # serverb.lab.example.com
```

    Running it again is harmless: it adds the key only where it is missing.
  {% /task %}

  {% task id="task-6bc6181e3dd9" legacyIndex=7 title="VM: install the lab command" %}
    In a training classroom, each exercise starts with `lab start NAME`, which creates the exercise's project folder and starter files. That command exists only inside the classroom, so this guide provides its own small script with the same syntax. It downloads the starter files for an exercise from this site into `~/NAME`. It is a short shell script; [read it first](lab/lab) if you like.

```bash {% title="student@workstation" %}
curl -fsSL https://kernelpath.dev/lab/lab -o ~/.local/bin/lab
chmod +x ~/.local/bin/lab
lab version                          # lab 6
lab list                             # every exercise that has starter files
lab check                            # key logins, collections and starter files: every line PASS
```

    | Command | What it does |
    | --- | --- |
    | `lab start playbook-basic` | Creates `~/playbook-basic` with that exercise's `ansible.cfg`, inventory and other starter files |
    | `lab finish playbook-basic` | Moves `~/playbook-basic` into `~/lab-archive/`, so your work is kept and your home directory is clear for the next exercise. Add `--delete` to remove it instead |
    | `lab start playbook-basic --force` | Starts over in one step: archives the existing folder and creates a fresh one |
    | `lab check` | Tests that the lab is ready: key logins to every machine, collections, starter files |
    | `lab update` | Replaces the command with the newest version from this site |
    | `lab grade playbook-basic` | Read-only project and host checks; use `--json` to export results |

    {% callout type="note" title="Installed lab before October 2026?" %}
    The site moved to a new address, and older copies of `lab` still download from the old one, so `lab start` and `lab update` fail. Run the `curl` and `chmod` lines above again to install the current version.
    {% /callout %}

    {% callout type="important" title="lab cannot reset the servers" %}
    `lab` runs on workstation, inside the sealed lab network, which has no way to reach the Ubuntu host. Putting the managed hosts back to `clean` is always a second command, on the host: `rht-vmctl reset servers`. Finishing an exercise is therefore two steps: `lab finish NAME` on workstation, then the reset on the host.
    {% /callout %}
  {% /task %}

  {% task id="task-9c145d8aa995" legacyIndex=8 title="VM: set up vim for YAML" %}
    Two-space indentation and spaces instead of tabs, as chapter 3 recommends:

```text {% title="~/.vimrc" %}
set autoindent
set tabstop=2
set shiftwidth=2
set expandtab
```
  {% /task %}

  {% task id="task-4269fceb0cce" legacyIndex=9 title="VM: don't create a project yet" %}
    Leave workstation as it is for now. Your first Ansible project comes in [section 1.8](#/ch01/first-project-and-daily-use), *after* the `clean` snapshot, so the baseline contains the tools but none of your work.
  {% /task %}
{% /lab %}

{% lab
  objectives=["ch01.lab-tools"]
  id="utility"
  title="Phase 11 · The utility server, optional (~10 min)"
  hosts=["utility.lab.example.com","workstation"]
  outcomes=["Serve practice files over HTTP for \"download this from utility\" style tasks."] %}
  {% task id="task-987fb4e47997" legacyIndex=1 title="LXD UI: create utility" %}
    Create it as in section 1.5: name `utility`, `ipv4.address: 172.25.250.8`, no `disk2`. `content.example.com` and `materials.example.com` already point here, from the network's `raw.dnsmasq` lines.
  {% /task %}

  {% task id="task-fc08b2e12a0f" legacyIndex=2 title="VM: install a web server and the practice files" %}

```bash {% title="Ubuntu host" %}
lxc exec utility -- bash
```

```bash {% title="utility, as root" %}
dnf install -y httpd ansible-core
mkdir -p /var/www/html/files && cd /var/www/html/files
systemctl enable --now httpd
firewall-cmd --permanent --add-service=http && firewall-cmd --reload   # firewalld is on, as in RHEL

# versions that work with ansible-core 2.14, as on workstation
ansible-galaxy collection download ansible.posix:1.5.4 community.general:9.5.13 -p /var/www/html/files

printf 'Hostname: inventory_hostname\nMemory: ansible_memory_mb\nProcessor count: ansible_proc_count\nDisk size sda: sda_size\nDisk size sdb: sdb_size\n' > hwreport.empty

cat > user_list.yml <<'EOF'
---
users:
  - name: bob
    job: developer
  - name: fred
    job: manager
  - name: susan
    job: developer
EOF
ls
```
  {% /task %}

  {% task id="task-72b0aaf9b03d" legacyIndex=3 title="VM: check it from workstation" %}

```bash {% title="student@workstation" %}
curl http://utility.lab.example.com/files/
curl -s http://materials.example.com/files/user_list.yml
```
  {% /task %}
{% /lab %}
