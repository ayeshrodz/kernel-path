---
title: "Exercise: Customise your shell"
kind: lab
minutes: 20
---

{% lead %}
On servera, use variables and PATH to run your own command, create an alias, and make your settings survive a new login by adding them to Bash's startup files with vim.
{% /lead %}

{% lab
  objectives=["ch05.environment","ch05.vim"]
  id="environment"
  title="Customise your shell"
  hosts=["workstation","servera"]
  outcomes=["Use and export variables.","Run your own script through PATH.","Make an alias and environment settings permanent."] %}

  {% task id="task-8ef6dff987b9" title="See exporting at work" %}
    On servera, set a variable, check that a child shell doesn't see it, export it, and check again.

    {% reveal title="Show solution" %}

```console
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ TEAM=platform
[student@servera ~]$ bash -c 'echo team: $TEAM'
team:
[student@servera ~]$ export TEAM
[student@servera ~]$ bash -c 'echo team: $TEAM'
team: platform
```
    {% /reveal %}
  {% /task %}

  {% task id="task-a6baa3a91bd2" title="Run your own command through PATH" %}
    `~/bin` is already in your `PATH`. Create the directory, write a two-line script into it, make it executable, and run it by name from anywhere. `chmod +x` marks a file as executable; chapter 7 explains it.

```console
[student@servera ~]$ mkdir ~/bin
[student@servera ~]$ vim ~/bin/up
```

    Type these two lines in insert mode, then save with `:wq`:

```bash {% title="~/bin/up" %}
#!/bin/bash
echo "$(hostname -s) has been up $(uptime -p | cut -d" " -f2-)"
```

```console
[student@servera ~]$ chmod +x ~/bin/up
[student@servera ~]$ cd /tmp
[student@servera tmp]$ up
servera has been up 16 minutes
[student@servera tmp]$ cd
```

    The first line tells the system which program runs the script. Chapter 15 is all about writing scripts.
  {% /task %}

  {% task id="task-74894e54e420" title="Add an alias and history time stamps to ~/.bashrc" %}
    Open `~/.bashrc` with vim, press `G` to jump to the end, `o` to open a new line, and add:

```bash {% title="~/.bashrc (added at the end)" %}
alias now='date +%T'
export HISTTIMEFORMAT="%F %T "
```

    Save with `:wq`, then apply it to your current shell:

```console
[student@servera ~]$ source ~/.bashrc
[student@servera ~]$ now
10:24:15
[student@servera ~]$ history 2
   41  2026-10-03 10:24:12 source ~/.bashrc
   42  2026-10-03 10:24:15 now
```
  {% /task %}

  {% task id="task-fd456dcbc413" title="Set your editor for every login" %}
    `EDITOR` is an environment variable that programs read, so it belongs in `~/.bash_profile`. Add this line at its end with vim:

```bash {% title="~/.bash_profile (added at the end)" %}
export EDITOR=vim
```
  {% /task %}

  {% task id="task-4f36cff39c67" title="Prove the settings survive a new login" %}
    Log out and back in, then check all three:

```console
[student@servera ~]$ exit
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ type now
now is aliased to `date +%T'
[student@servera ~]$ echo $EDITOR
vim
[student@servera ~]$ echo "$HISTTIMEFORMAT"
%F %T
```

    A new login shell read `~/.bash_profile`, which ran `~/.bashrc`, exactly as the startup diagram showed.
  {% /task %}

  {% task id="task-c9d653868e39" title="Put servera back" %}
    Remove the lines you added (in vim, `dd` on each), or leave them: the next reset restores the original files.

```console
[student@servera ~]$ exit
```
  {% /task %}
{% /lab %}
