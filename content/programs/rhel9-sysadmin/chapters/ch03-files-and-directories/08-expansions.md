---
title: Work on many files at once
seoTitle: "Bash Wildcards, Brace Expansion and Globbing"
description: "Work on many files at once with wildcards, brace expansion, tilde and command substitution. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 20
---

{% lead %}
Before Bash runs a command, it rewrites the command line: patterns become lists of matching file names, braces become sequences, `~` becomes your home directory, and `$(…)` becomes a command's output. These *expansions* let one short command act on hundreds of files. Quoting lets you switch them off when you don't want them.
{% /lead %}

{% objectives %}
- Match file names with `*`, `?` and `[…]`, and predict which names a pattern selects.
- Generate lists of names with brace expansion, and use `~`, variables and command substitution.
- Use double quotes, single quotes and backslashes to control which expansions happen.
{% /objectives %}

## The shell expands, the command never knows

When you type `ls *.html`, `ls` never sees the `*`. Bash finds the matching names first and runs `ls about.html index.html`. Every command therefore gets the same pattern features for free, and you can always check what a pattern will do by putting `echo` in front of it:

```console
[student@servera site]$ echo rm *.html
rm about.html index.html
```

## Match file names with patterns

| Pattern | Matches |
| --- | --- |
| `*` | Any run of characters, including none |
| `?` | Exactly one character |
| `[abc]` | One character from the set; `[a-m]` a range |
| `[!abc]` or `[^abc]` | One character *not* in the set |
| `[[:digit:]]` `[[:alpha:]]` `[[:upper:]]` `[[:lower:]]` `[[:alnum:]]` `[[:space:]]` `[[:punct:]]` | One character of that class |

Two rules surprise people:

- A pattern never matches a name that starts with a dot unless the pattern starts with a dot too. `*` skips hidden files; `.*` finds them.
- If nothing matches, Bash passes the pattern on **unchanged**. Then the command looks for a file literally named `*.zip`, and usually says it doesn't exist.

Try patterns against a directory of a website's files. The directory list highlights what matches, and the last line shows the command Bash actually runs:

{% glob-tester ref="patterns" /%}

## Generate names with braces

Braces don't look at files at all. They generate one word for each item in a list or a range, whether or not such files exist, which makes them perfect for creating things:

```console
[student@servera ~]$ echo {Sunday,Monday,Tuesday,Wednesday}.log
Sunday.log Monday.log Tuesday.log Wednesday.log
[student@servera ~]$ echo file{1..3}.txt
file1.txt file2.txt file3.txt
[student@servera ~]$ echo file{a..c}.txt
filea.txt fileb.txt filec.txt
[student@servera ~]$ echo file{a,b}{1,2}.txt
filea1.txt filea2.txt fileb1.txt fileb2.txt
[student@servera ~]$ echo ep{01..03}
ep01 ep02 ep03
```

So `mkdir -p project/{src,docs,tests}` creates three directories in one go, and `touch report-{jan,feb,mar}.txt` three files. Brace expansion happens first, so its results can still contain patterns: `ls *.{html,css}` lists every HTML and CSS file.

## The tilde, variables and command substitution

```console
[student@servera ~]$ echo ~
/home/student
[student@servera ~]$ echo ~root
/root
[student@servera ~]$ echo $HOME
/home/student
[student@servera ~]$ echo "Today is $(date +%A)."
Today is Saturday.
```

- `~` is your home directory; `~user` is another user's.
- `$NAME` (or `${NAME}`) is replaced with the value of the variable `NAME`. You set one with `NAME=value`, no spaces around the `=`. Chapter 5 covers variables properly.
- `$(command)` runs the command and puts its output in its place. That is **command substitution**: `cd $(dirname /etc/ssh/sshd_config)` changes to `/etc/ssh`.

```console
[student@servera ~]$ host=$(hostname)
[student@servera ~]$ echo "***** hostname is ${host} *****"
***** hostname is servera.lab.example.com *****
```

## Quoting turns expansion off

| Quoting | Effect | Example | Prints |
| --- | --- | --- | --- |
| None | Everything expands, and spaces split words | `echo $HOME *.txt` | `/home/student a.txt b.txt` |
| `"double"` | Only `$` and `$(…)` expand; spaces and patterns are kept | `echo "Will $HOME expand?"` | `Will /home/student expand?` |
| `'single'` | Nothing expands | `echo 'Will $HOME expand?'` | `Will $HOME expand?` |
| `\` | The next character is taken literally | `echo Will \$HOME expand?` | `Will $HOME expand?` |

Leave out the quotes in the hostname example above and the asterisks become patterns. In a directory full of files, the line fills with file names:

```console
[student@servera w]$ echo ***** hostname is ${host} *****
about.html app.js index.html logo.png ... hostname is servera.lab.example.com about.html app.js ...
```

{% callout type="tip" title="A rule of thumb" %}
Put double quotes around anything containing a variable or `$(…)`, unless you specifically want it split into words. Use single quotes when you want text taken exactly as typed, such as a pattern you are passing to another command.
{% /callout %}

## Try it

This practice terminal knows a set of expansion examples. Run each and compare the output with your prediction.

{% shell-practice ref="practice" /%}

## Check your understanding

{% quiz id="quick" objectives=["ch03.expansion"] ref="quick" /%}
