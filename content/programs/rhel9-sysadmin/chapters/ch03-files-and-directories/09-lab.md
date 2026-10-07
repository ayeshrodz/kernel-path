---
title: "Exercise: Files and directories review"
seoTitle: "Linux files and directories Practice Lab (RHCSA Exam Style)"
description: "Graded RHCSA exam-style lab on Linux files and directories: a challenge with requirements, hints and solutions, and a grader that checks your work on your own lab."
kind: lab
minutes: 30
---

{% lead %}
A podcast team is moving its files to serverb. Create their episodes and transcripts, sort them into directories, save one transcript under a second name, and give the team a shortcut to the newest season, using as few commands as you can.
{% /lead %}

Brace expansion and patterns do most of the work here. If a step takes you more than one or two commands, look for a pattern or a brace list that would shorten it.

{% lab
  objectives=["ch03.paths","ch03.manage","ch03.links","ch03.expansion"]
  id="review"
  title="Files and directories review"
  exercise="sa-files-review"
  ownExercise=true
  hosts=["workstation","serverb"]
  outcomes=["Create many files and directories with brace expansion.","Move files with patterns, and remove what is no longer needed.","Create a hard link and a symbolic link, and check them."] %}
{% lab-notes %}

**Before you start:** reset the servers and complete this chapter's lessons. You work on **serverb** as `student`, in your home directory; `lab start` and `lab grade` run on workstation.

{% /lab-notes %}

{% lab-challenge %}

On serverb, as student, in `/home/student`:

1. Create twelve empty episode files, `podcast_s1_e1.mp3` to `podcast_s2_e6.mp3` (two seasons of six), with one command.
2. Create `~/Podcasts/season1` and `~/Podcasts/season2` with one command, and move each season's episodes into its directory. Leave no episode files in your home directory.
3. Create eight empty transcripts, `transcript_e1.txt` to `transcript_e8.txt`.
4. Create `~/Documents/transcripts/drafts`, `review` and `published` with one command. Move every transcript into `drafts`, then episodes 1 and 2 on to `review`.
5. Episode 8 was cancelled: remove its transcript.
6. Make `published/transcript_e1.txt` the same file as `review/transcript_e1.txt`: a hard link, not a copy.
7. Create `~/latest`, a symbolic link that leads to `~/Podcasts/season2`.

{% /lab-challenge %}

  {% task id="task-68e16117d2ad" title="Start the exercise and log in to serverb" %}

```console
[student@workstation ~]$ lab start sa-files-review
[student@workstation ~]$ ssh student@serverb
[student@serverb ~]$
```

    `~/sa-files-review/README` on workstation has the same requirements as this page.
  {% /task %}

  {% task id="task-2efad17c256b" title="Create the twelve episode files" %}
    One `touch` with two brace lists: one for the season, one for the episode.

    {% reveal title="Show solution" %}

```console
[student@serverb ~]$ touch podcast_s{1,2}_e{1..6}.mp3
[student@serverb ~]$ ls
podcast_s1_e1.mp3  podcast_s1_e4.mp3  podcast_s2_e1.mp3  podcast_s2_e4.mp3
podcast_s1_e2.mp3  podcast_s1_e5.mp3  podcast_s2_e2.mp3  podcast_s2_e5.mp3
podcast_s1_e3.mp3  podcast_s1_e6.mp3  podcast_s2_e3.mp3  podcast_s2_e6.mp3
```

    Two lists combine into every pairing: 2 × 6 = 12 names.
    {% /reveal %}
  {% /task %}

  {% task id="task-cbd9c93ee765" title="Sort the episodes by season" %}

    {% reveal title="Show solution" %}

```console
[student@serverb ~]$ mkdir -p Podcasts/season{1,2}
[student@serverb ~]$ mv podcast_s1_* Podcasts/season1/
[student@serverb ~]$ mv podcast_s2_* Podcasts/season2/
[student@serverb ~]$ ls -R Podcasts
Podcasts:
season1  season2

Podcasts/season1:
podcast_s1_e1.mp3  podcast_s1_e3.mp3  podcast_s1_e5.mp3
podcast_s1_e2.mp3  podcast_s1_e4.mp3  podcast_s1_e6.mp3

Podcasts/season2:
podcast_s2_e1.mp3  podcast_s2_e3.mp3  podcast_s2_e5.mp3
podcast_s2_e2.mp3  podcast_s2_e4.mp3  podcast_s2_e6.mp3
```

    `-p` is needed because `Podcasts` doesn't exist yet. The braces give `mkdir` two paths; the patterns give `mv` six files each.
    {% /reveal %}
  {% /task %}

  {% task id="task-3b6661b7f41f" title="Create the transcripts and their directories" %}

    {% reveal title="Show solution" %}

```console
[student@serverb ~]$ touch transcript_e{1..8}.txt
[student@serverb ~]$ mkdir -p Documents/transcripts/{drafts,review,published}
[student@serverb ~]$ mv transcript_e*.txt Documents/transcripts/drafts/
```
    {% /reveal %}
  {% /task %}

  {% task id="task-8d9b983b7434" title="Move episodes 1 and 2 to review, and remove episode 8" %}
    Change into `Documents/transcripts` first, so the paths stay short.

    {% reveal title="Show solution" %}

```console
[student@serverb ~]$ cd Documents/transcripts
[student@serverb transcripts]$ mv drafts/transcript_e{1,2}.txt review/
[student@serverb transcripts]$ rm drafts/transcript_e8.txt
[student@serverb transcripts]$ ls drafts
transcript_e3.txt  transcript_e5.txt  transcript_e7.txt
transcript_e4.txt  transcript_e6.txt
```
    {% /reveal %}
  {% /task %}

  {% task id="task-d094109ddbac" title="Publish episode 1 with a hard link" %}
    Create the hard link and prove it is one file with two names.

    {% reveal title="Show solution" %}

```console
[student@serverb transcripts]$ ln review/transcript_e1.txt published/
[student@serverb transcripts]$ ls -li review published
published:
total 0
261909 -rw-r--r--. 2 student student 0 Oct  3 10:02 transcript_e1.txt

review:
total 0
261909 -rw-r--r--. 2 student student 0 Oct  3 10:02 transcript_e1.txt
261910 -rw-r--r--. 1 student student 0 Oct  3 10:02 transcript_e2.txt
```

    `published/` is an existing directory, so `ln` puts the new name inside it, keeping the file name, just as `cp` and `mv` would. Same inode, link count 2.
    {% /reveal %}
  {% /task %}

  {% task id="task-b3a5792d2a43" title="Point latest at season 2" %}

    {% reveal title="Show solution" %}

```console
[student@serverb transcripts]$ cd
[student@serverb ~]$ ln -s Podcasts/season2 latest
[student@serverb ~]$ ls -l latest
lrwxrwxrwx. 1 student student 16 Oct  3 10:02 latest -> Podcasts/season2
[student@serverb ~]$ ls latest/
podcast_s2_e1.mp3  podcast_s2_e3.mp3  podcast_s2_e5.mp3
podcast_s2_e2.mp3  podcast_s2_e4.mp3  podcast_s2_e6.mp3
```

    A relative target works here because the link lives in your home directory. `ln -s ~/Podcasts/season2 latest` would work too: the tilde expands to an absolute path.
    {% /reveal %}
  {% /task %}

  {% task id="task-c7f85590af3a" title="Grade and finish" %}
    Log out of serverb, then on workstation:

    {% lab-finish exercise="sa-files-review" grade=true servers=true /%}
  {% /task %}
{% /lab %}
