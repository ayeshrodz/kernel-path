---
title: "Exercise: Organise a website's files"
kind: lab
minutes: 15
---

{% lead %}
A colleague left a website's files in one heap. On servera, sort them into directories, make a backup and an archive copy, rename a page, and clean up after yourself.
{% /lead %}

{% lab
  objectives=["ch03.manage","ch03.paths"]
  id="manage-files"
  title="Organise a website's files"
  hosts=["workstation","servera"]
  outcomes=["Create directories and empty files.","Move, rename and copy files and whole directories.","Remove files and directories, and see why rmdir is the safe choice."] %}

  {% task id="task-5bf66e090adf" title="Create the site directory and its three subdirectories" %}

```console
[student@workstation ~]$ ssh student@servera
[student@servera ~]$ mkdir site
[student@servera ~]$ cd site
[student@servera site]$ mkdir images css pages
```
  {% /task %}

  {% task id="task-bf51e03fb2f1" title="Create the heap of files" %}
    `touch` creates all six empty files at once:

```console
[student@servera site]$ touch logo.png banner.png style.css home.html about.html contact.html
[student@servera site]$ ls
about.html  contact.html  home.html  logo.png  style.css
banner.png  css           images     pages
```
  {% /task %}

  {% task id="task-a593069853fb" title="Move each kind of file into its directory" %}
    With several files to move, the last argument is the directory they go into:

    {% reveal title="Show solution" %}

```console
[student@servera site]$ mv logo.png banner.png images
[student@servera site]$ mv style.css css
[student@servera site]$ mv home.html about.html contact.html pages
[student@servera site]$ ls -R
.:
css  images  pages

./css:
style.css

./images:
banner.png  logo.png

./pages:
about.html  contact.html  home.html
```
    {% /reveal %}
  {% /task %}

  {% task id="task-a0587f8e1f0a" title="Rename the contact page" %}
    Rename `pages/contact.html` to `pages/contact-us.html`.

    {% reveal title="Show solution" %}

```console
[student@servera site]$ mv pages/contact.html pages/contact-us.html
```

    The destination isn't an existing directory, so `mv` treats it as the new name.
    {% /reveal %}
  {% /task %}

  {% task id="task-ae109b533d43" title="Back up the pages directory" %}
    Copy the whole `pages` directory to `pages-backup`, next to it.

    {% reveal title="Show solution" %}

```console
[student@servera site]$ cp -r pages pages-backup
[student@servera site]$ ls pages pages-backup
pages:
about.html  contact-us.html  home.html

pages-backup:
about.html  contact-us.html  home.html
```

    Without `-r`, `cp` would skip the directory.
    {% /reveal %}
  {% /task %}

  {% task id="task-006fc03764d7" title="Archive a copy of the whole site" %}
    Create `~/archive/2026` (both levels, with one command), then copy the whole site into it as `site-v1`.

    {% reveal title="Show solution" %}

```console
[student@servera site]$ mkdir -p ~/archive/2026
[student@servera site]$ cp -r ~/site ~/archive/2026/site-v1
[student@servera site]$ ls ~/archive/2026/site-v1
css  images  pages  pages-backup
```

    `~/archive/2026/site-v1` didn't exist, so it became the name of the copy. Had it existed, you would have got `site-v1/site` instead. Run the same `cp -r` again now and check with `ls ~/archive/2026/site-v1` to see it happen.
    {% /reveal %}
  {% /task %}

  {% task id="task-aea7e1c0cc42" title="Remove the backup directory" %}
    Try `rmdir` first, then remove it properly.

    {% reveal title="Show solution" %}

```console
[student@servera site]$ rmdir pages-backup
rmdir: failed to remove 'pages-backup': Directory not empty
[student@servera site]$ rm -r pages-backup
[student@servera site]$ ls
css  images  pages
```

    `rmdir`'s refusal is a safety check: it only removes directories that are already empty.
    {% /reveal %}
  {% /task %}

  {% task id="task-702d8c50e48e" title="Remove the archive interactively, and log out" %}
    Remove `~/archive` with `rm -ri`, answering `y` at each question, and watch the order: `rm` goes into each directory, removes its contents, then the directory itself.

```console
[student@servera site]$ cd
[student@servera ~]$ rm -ri archive
rm: descend into directory 'archive'? y
rm: descend into directory 'archive/2026'? y
rm: descend into directory 'archive/2026/site-v1'? y
...output omitted...
rm: remove directory 'archive'? y
[student@servera ~]$ exit
```

    Leave `~/site` for now, or run `rht-vmctl reset servera` on the host to put servera back.
  {% /task %}
{% /lab %}
