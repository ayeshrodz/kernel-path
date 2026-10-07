---
title: Your first session and daily use
seoTitle: "Using the Practice Lab Day to Day"
description: "Start, use and reset the lab in a normal study session. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lab
minutes: 15
---

{% lead %}
Phases 12 and 13. With the baseline saved, everything from here on is your own work. Run a first short session so you know the loop, then set up a one-command way into the lab from your own computer.
{% /lead %}

{% lab
  objectives=["ch01.lab-network","ch01.lab-machines","ch01.lab-tools","ch01.lab-reset"]
  id="first-session"
  title="Phase 12 · A first practice session (~10 min)"
  hosts=["workstation","servera"]
  outcomes=["Create a practice folder on workstation.","Change a server, then put it back with one command."] %}
  {% task id="task-7b2d9e5a1c04" legacyIndex=1 title="VM: create the practice folder" %}
    It lives on workstation, so resetting the servers never touches it. Get there with `rht-vmctl ws`.

```bash {% title="student@workstation" %}
mkdir -p ~/practice && cd ~/practice
echo "my first note" > notes.txt
ls -l
```
  {% /task %}

  {% task id="task-a95c3f7d2e68" legacyIndex=2 title="VM: change a server" %}
    Log in to servera, add a user and a file, and install a package. This is the kind of change every later chapter makes.

```bash {% title="student@workstation" %}
ssh student@servera
sudo useradd demo && sudo touch /root/demo-was-here
sudo dnf -y install nano
id demo
exit
```
  {% /task %}

  {% task id="task-1e6a4c8f0b73" legacyIndex=3 title="Host: put the server back" %}
    On the Ubuntu host, reset servera to the `clean` baseline. It returns once the machine has booted.

```bash {% title="Ubuntu host" %}
rht-vmctl reset servera
```

    Then check on workstation that the change is gone while your folder is still there:

```bash {% title="student@workstation" %}
ssh student@servera 'id demo'          # id: 'demo': no such user
ls ~/practice                          # notes.txt is still here
```
  {% /task %}

  {% task id="task-d3f7b1a5c926" legacyIndex=4 title="Host: keep what matters" %}
    Resetting workstation to `clean` removes `~/practice`. Copy anything you want to keep to the host first:

```bash {% title="Ubuntu host" %}
lxc file pull --project rhce workstation/home/student/practice/notes.txt .
```
  {% /task %}
{% /lab %}

## Daily use

### Getting in

{% diagram ref="access-paths" /%}

On the host, `rht-vmctl ws` drops you at the student prompt on workstation. From your own computer, one SSH alias takes you straight there:

```text {% title="~/.ssh/config on your computer" %}
Host rhce
    HostName <HOST_LAN_IP>
    User <HOST_USER>
    RequestTTY yes
    RemoteCommand lxc exec --project rhce workstation -- su - student
```

```bash {% title="your computer" %}
ssh rhce            # lands on [student@workstation ~]$
```

### Starting and stopping the lab

```bash {% title="Ubuntu host" %}
rht-vmctl stop all       # frees ~7 GiB of RAM
rht-vmctl start all
```

### Moving files in and out

Because the host can't reach the VMs over the network, copy files through LXD instead:

```bash {% title="Ubuntu host" %}
lxc file push notes.txt workstation/home/student/            # host → VM
lxc file pull workstation/home/student/practice/notes.txt .   # VM → host
```

### Every exercise follows the same loop

Each chapter ends with an exercise, and many lessons have a shorter guided one. They all use the same five steps, whichever lab you built:

{% steps %}
  {% step title="Reset the servers" %}
    `rht-vmctl reset servers` on the host, so every exercise starts from the same state.
  {% /step %}
  {% step title="Start the exercise" %}
    `lab start NAME` on workstation, with the name the exercise page gives. It creates `~/NAME` with the brief and any starter files.
  {% /step %}
  {% step title="Work" %}
    Follow the steps on workstation and the servers. Break things on purpose; the reset is a few seconds away. firewalld runs on every server, as on a RHEL server, so a new network service needs its port opened before you can reach it from workstation.
  {% /step %}
  {% step title="Check" %}
    `lab grade NAME` checks your result on the servers and prints PASS or FAIL for each requirement. It only reads; fix what failed and run it again. For lasting changes, reboot the server and grade once more: a change that does not survive a reboot is not finished.
  {% /step %}
  {% step title="Finish" %}
    `lab finish NAME` on workstation puts the folder away in `~/lab-archive/`. Then reset the servers on the host for the next one.
  {% /step %}
{% /steps %}

{% callout type="tip" title="You are ready" %}
The lab is built, checked and saved. Head to [chapter 2](#/ch02) when it opens, or come back here whenever you need to rebuild or reset.
{% /callout %}
