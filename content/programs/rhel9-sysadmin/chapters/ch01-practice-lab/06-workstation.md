---
title: Prepare workstation and the lab tools
seoTitle: "Set Up the Workstation VM and Lab Tools"
description: "Prepare the workstation VM, SSH keys and the lab command that starts and grades exercises. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lab
minutes: 20
---

{% lead %}
Phase 10: turn workstation into the machine you work from. You check the everyday tools, give `student` an SSH key that reaches both servers, and install the `lab` command that starts and grades every exercise in this path. There is no automation software to install.
{% /lead %}

Everything in this phase happens on workstation as `student`. Get there with:

```bash {% title="Ubuntu host" %}
lxc exec workstation -- su - student
```

{% lab
  objectives=["ch01.lab-tools"]
  id="workstation"
  title="Phase 10 · Prepare workstation and the lab tools (~20 min)"
  hosts=["workstation","servera","serverb"]
  outcomes=["Check the everyday tools are installed.","Log in to both servers with an SSH key, as student and as root.","Install the lab command and confirm the lab is ready."] %}
  {% task id="task-5a1d2f6e7b30" legacyIndex=1 title="VM: check the everyday tools" %}
    The lab profile installed these on every VM. Check that they are there on workstation:

```bash {% title="student@workstation" %}
rpm -q man-db man-pages tree tmux bind-utils lsof nano vim-enhanced
man --version | head -1
```

    Every line should show a package version. If one says *not installed*, follow [Repair an existing lab](#/ch01/troubleshooting#repair-an-existing-lab).
  {% /task %}

  {% task id="task-0c9e84b3d1a7" legacyIndex=2 title="VM: bring workstation up to date" %}

```bash {% title="student@workstation" %}
sudo dnf -y upgrade                  # password: student
```
  {% /task %}

  {% task id="task-3e7b5c0a9f12" legacyIndex=3 title="VM: set up vim and tmux" %}
    Four spaces instead of tabs, line numbers and highlighted search, so editing files in the later chapters is comfortable. Each command writes one small file:

```bash {% title="student@workstation: writes ~/.vimrc" %}
printf '%s\n' 'set number' 'set autoindent' 'set tabstop=4' 'set shiftwidth=4' 'set expandtab' 'set hlsearch' > ~/.vimrc
```

```bash {% title="student@workstation: writes ~/.tmux.conf" %}
printf '%s\n' 'set -g mouse on' 'set -g history-limit 10000' > ~/.tmux.conf
```
  {% /task %}

  {% task id="task-8d4f1a2c6e95" legacyIndex=4 title="VM: reach both servers by name" %}
    The lab's DNS knows every machine by its full name, and the search domain lets you use the short name too.

```bash {% title="student@workstation" %}
getent hosts servera.lab.example.com     # 172.25.250.10 servera.lab.example.com
ping -c2 serverb                         # short names work
```
  {% /task %}

  {% task id="task-2b7c4e9a1d58" legacyIndex=5 title="VM: an SSH key for student, on both servers" %}
    Make a key pair and copy its public half to `student` on each server. Each server asks for the password `student` once; after that, logins need no password. Chapter 10 explains how keys work; for now, this is what lets you and the lab tools move between machines quickly.

```bash {% title="student@workstation" %}
ssh-keygen -t ed25519 -N '' -f ~/.ssh/id_ed25519
for h in servera serverb; do
  ssh-copy-id -o StrictHostKeyChecking=accept-new student@$h.lab.example.com
  ssh -o StrictHostKeyChecking=accept-new student@$h true     # trust the short name too
done
ssh student@servera hostname         # servera.lab.example.com, no password asked
```
  {% /task %}

  {% task id="task-6d0f3a8c2e17" legacyIndex=6 title="VM: let the same key log in as root" %}
    `lab grade` checks your work on the servers as `root`, the way a classroom's own tools do. The servers refuse root logins with a password but accept them with a key, so put the same key in root's `authorized_keys`. Each server asks for the sudo password, `student`, once:

```bash {% title="student@workstation" %}
for h in servera serverb; do
  ssh -t student@$h 'sudo install -d -m 700 /root/.ssh &&
    sudo install -m 600 ~/.ssh/authorized_keys /root/.ssh/authorized_keys &&
    sudo restorecon -R /root/.ssh'
done
ssh root@servera id                  # uid=0(root), no password asked
ssh root@serverb hostname            # serverb.lab.example.com
```

    Running it again is harmless: it replaces root's key list with the same single key.

    {% callout type="note" title="A key that opens root" %}
    On a real server you would think hard before allowing root logins at all. Here it is a deliberate part of the lab, like a classroom's: the key lives only on workstation, inside a network nothing outside can reach. Chapter 10 shows how to restrict root logins, and its exercise keeps this one working.
    {% /callout %}
  {% /task %}

  {% task id="task-9e4a6b1f0c38" legacyIndex=7 title="VM: install the lab command" %}
    In a training classroom, each exercise starts with `lab start NAME`. That command exists only inside the classroom, so this site provides its own small script with the same syntax. It downloads each exercise's starter files from this site and checks your results on the servers. It is a short shell script; [read it first](lab/lab) if you like.

```bash {% title="student@workstation" %}
mkdir -p ~/.local/bin
curl -fsSL https://kernelpath.dev/lab/lab -o ~/.local/bin/lab
chmod +x ~/.local/bin/lab
lab version                          # lab 6
lab check                            # every line PASS
```

    | Command | What it does |
    | --- | --- |
    | `lab start NAME` | Creates `~/NAME` with that exercise's brief and starter files |
    | `lab grade NAME` | Read-only checks of your result on the servers, PASS or FAIL for each requirement; `--json` exports a report |
    | `lab finish NAME` | Moves `~/NAME` into `~/lab-archive/`, so your notes are kept and your home directory is clear. Add `--delete` to remove it instead |
    | `lab start NAME --force` | Starts over in one step: archives the existing folder and creates a fresh one |
    | `lab list` | Every exercise on the site |
    | `lab check` | Tests that the lab is ready: the servers, key logins and the site |
    | `lab update` | Replaces the command with the newest version from this site |

    {% callout type="important" title="lab cannot reset the servers" %}
    `lab` runs on workstation, inside the sealed lab network, which has no way to reach the Ubuntu host. Putting the servers back to `clean` is always a command on the host: `rht-vmctl reset servers`, which you install in the next section.
    {% /callout %}
  {% /task %}

  {% task id="task-b2c6e0f4a813" legacyIndex=8 title="VM: don't create practice files yet" %}
    Leave workstation as it is for now. Your first practice folder comes in [section 1.8](#/ch01/daily-use), *after* the `clean` snapshot, so the baseline contains the tools but none of your work.
  {% /task %}
{% /lab %}
