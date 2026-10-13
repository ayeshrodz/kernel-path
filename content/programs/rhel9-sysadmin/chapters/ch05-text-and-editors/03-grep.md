---
title: Search text with grep
seoTitle: "grep Command in Linux With Regex Examples"
description: "Search text with grep and regular expressions: -i, -v, -r, -E, anchors and character classes. Free RHCSA (EX200) lesson with diagrams and practice."
kind: lesson
minutes: 25
---

{% lead %}
`grep` prints the lines that match a pattern. It is the tool you will use most often after `ls`: to find a setting in a configuration file, an account in `/etc/passwd`, an error in a log, or one line in a command's long output. Its patterns are *regular expressions*, a small language worth learning properly once.
{% /lead %}

{% objectives %}
- Search files and command output with grep, and use `-i`, `-v`, `-n`, `-c`, `-w`, `-r` and `-l`.
- Write regular expressions with anchors, `.`, `*`, bracket expressions and repetition.
- Use extended regular expressions (`grep -E`) for `+`, `?`, `{n,m}`, alternation and groups.
{% /objectives %}

## Find lines

`grep PATTERN FILE…` prints every line of the files that contains the pattern. Without a file, it reads stdin, which makes it the natural end of a pipe:

```console
[student@servera ~]$ grep student /etc/passwd
student:x:1000:1000:Student User:/home/student:/bin/bash
[student@servera ~]$ ip -4 addr | grep inet
    inet 127.0.0.1/8 scope host lo
    inet 172.25.250.10/24 brd 172.25.250.255 scope global dynamic noprefixroute enp5s0
```

Put the pattern in single quotes whenever it contains anything other than letters and digits, so the shell passes it to grep untouched.

| Option | Does |
| --- | --- |
| `-i` | Ignore case |
| `-v` | Invert: print lines that do **not** match |
| `-n` | Number each printed line |
| `-c` | Print only how many lines matched |
| `-w` | Match whole words only |
| `-r` | Search every file below a directory |
| `-l` | Print only the names of files that match |
| `-E` | Extended regular expressions (below) |

```console
[student@servera ~]$ grep -c nologin /etc/passwd
15
[student@servera ~]$ grep -n bash /etc/passwd
1:root:x:0:0:root:/root:/bin/bash
19:student:x:1000:1000:Student User:/home/student:/bin/bash
[student@servera ~]$ sudo grep -r PermitRootLogin /etc/ssh/
/etc/ssh/sshd_config:#PermitRootLogin prohibit-password
/etc/ssh/sshd_config:# the setting of "PermitRootLogin prohibit-password".
```

That last search needs `sudo` because the SSH server's configuration is readable only by root.

## Regular expressions

A regular expression describes text. Most characters match themselves; a few are special:

| Expression | Matches |
| --- | --- |
| `^` | The start of the line: `^#` finds lines that begin with `#` |
| `$` | The end of the line: `200$`; `^$` is an empty line |
| `.` | Any single character |
| `*` | The item before it, repeated zero or more times: `.*` is "anything" |
| `[abc]`, `[0-9]` | One character from the set or range |
| `[^abc]` | One character *not* in the set |
| `[[:digit:]]`, `[[:space:]]`, `[[:alpha:]]` … | One character of a class |
| `\<`, `\>` | The start or end of a word |
| `\.` | A literal dot (any special character, escaped) |

{% callout type="warning" title="Patterns are not globs" %}
In the shell, `*` means "anything" on its own. In a regular expression, `*` repeats the item before it, and "anything" is `.*`. `grep 'a*'` matches every line, because every line contains zero or more `a`s.
{% /callout %}

### Extended expressions: grep -E

With `-E`, four more operators work directly:

| Expression | Matches |
| --- | --- |
| `+` | The item before it, one or more times |
| `?` | The item before it, zero or one time |
| `{n}`, `{n,}`, `{n,m}` | Exactly *n*, at least *n*, or *n* to *m* times |
| <code>a&#124;b</code> | Either *a* or *b* |
| `( )` | Groups items: <code>(INFO&#124;WARN) +web01</code> |

Without `-E` (basic syntax), the same operators need a backslash: `\+`, `\?`, `\{n\}`, `\|`, `\( \)`. Most people simply use `-E` whenever a pattern needs them.

## Try it

This tester reproduces grep exactly, including the basic and extended syntaxes. Choose a preset, change the pattern or the options, and watch which lines are selected and what grep prints:

{% grep-tester ref="tester" /%}

## Recipes you will use constantly

Show only the active lines of a configuration file, without comments or blank lines:

```console
[student@servera ~]$ wc -l /etc/chrony.conf
50 /etc/chrony.conf
[student@servera ~]$ grep -Ev '^(#|$)' /etc/chrony.conf
pool 2.rocky.pool.ntp.org iburst
sourcedir /run/chrony-dhcp
driftfile /var/lib/chrony/drift
makestep 1.0 3
rtcsync
keyfile /etc/chrony.keys
ntsdumpdir /var/lib/chrony
leapsectz right/UTC
logdir /var/log/chrony
```

Fifty lines shrink to the nine that matter. Some other everyday searches:

| Question | Command |
| --- | --- |
| Which accounts have UID 0? | `grep '^[^:]*:x:0:' /etc/passwd` |
| Which files under /etc/ssh mention PasswordAuthentication? | `sudo grep -rl PasswordAuthentication /etc/ssh/` |
| How many SSH key logins succeeded? | `sudo grep -c 'Accepted publickey' /var/log/secure` |
| Is the httpd service mentioned in the log? | `sudo grep -i httpd /var/log/messages` |
| Which lines of a big output mention eth? | `COMMAND | grep -i eth` |

## Check your understanding

{% quiz id="quick" objectives=["ch05.grep"] ref="quick" /%}
