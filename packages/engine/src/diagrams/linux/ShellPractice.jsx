import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { defineWidget, formatCopy } from '@/components/interactive/TeachingContent';
import { expandHistory, splitCommands, squash } from '@/lib/shell';

/**
 * A practice terminal in the browser. Nothing runs: each command the exercise knows has its
 * recorded output in the page data, and the terminal behaves like Bash for everything around
 * it (history, history expansion, Tab completion, line editing), so the keystrokes learnt here
 * work the same on the lab. Tasks tick off as the learner completes them.
 *
 * props: { prompt, title, commands: [{ cmd, out }], tasks: [{ text, commands?, typed?, via? }], words? }
 * A task's via is 'search' (the line came from Ctrl+R) or 'last-argument' (Alt+. was used on it).
 */
const lastWord = (s) => squash(s).split(' ').pop() ?? '';

/** Commands a RHEL system has: outside this exercise's list they are real, just not recorded here. */
const COMMON = new Set(
  `alias at awk basename bash bg bzip2 cal cat cd chage chcon chgrp chmod chown chronyc chroot clear cp crontab curl cut date dd df diff dig
  dmesg dnf du echo env exit export false fdisk fg file find firewall-cmd free fsck getenforce getent getfacl gpasswd grep groupadd groupdel
  groupmod groups gunzip gzip head history host hostname hostnamectl id ip jobs journalctl kill killall last less ln locate logger login
  logout ls lsblk lsof lvcreate lvdisplay lvextend lvs man mkdir mkfs mkswap more mount mv nano nice nmcli nproc passwd pgrep ping pkill
  podman printenv ps pvcreate pvs pwd reboot renice restorecon rm rmdir rpm rsync scp sed semanage setfacl setsebool sftp sh shutdown
  sleep sort source ss ssh ssh-copy-id ssh-keygen stat su sudo swapon systemctl tail tar tee timedatectl top touch tr tree type tuned-adm
  umask umount uname uniq unzip uptime useradd userdel usermod vgcreate vgs vi vim w wc whatis whereis which who whoami xargs xfs_growfs
  yum zcat zip`.split(/\s+/),
);

export default defineWidget('ShellPractice', (copy) => {
  function ShellPractice({ prompt = '[student@workstation ~]$', title, commands = [], tasks = [], words = [] }) {
    const outputs = useMemo(() => new Map(commands.map((c) => [squash(c.cmd), c.out ?? ''])), [commands]);
    const known = useMemo(() => new Set(commands.map((c) => squash(c.cmd).split(' ')[0])), [commands]);
    const vocabulary = useMemo(() => {
      const all = new Set([...known, 'history', 'clear', 'exit']);
      for (const c of commands) for (const w of squash(c.cmd).split(' ').slice(1)) if (!w.startsWith('-') || w.startsWith('--')) all.add(w);
      for (const w of words) all.add(w);
      return [...all].sort();
    }, [commands, known, words]);

    const [lines, setLines] = useState([]);
    const [history, setHistory] = useState([]);
    const [input, setInput] = useState('');
    const [cursor, setCursor] = useState(null);
    const [browse, setBrowse] = useState(null);
    const [done, setDone] = useState(() => tasks.map(() => false));
    const [search, setSearch] = useState(null);
    const [skip, setSkip] = useState(0);
    const yank = useRef({ at: 0, base: null });
    const yanked = useRef(false);
    const tabs = useRef(0);
    const field = useRef(null);
    const screen = useRef(null);

    useEffect(() => {
      if (cursor === null || !field.current) return;
      field.current.setSelectionRange(cursor, cursor);
      setCursor(null);
    }, [cursor]);
    useEffect(() => {
      if (screen.current) screen.current.scrollTop = screen.current.scrollHeight;
    }, [lines]);

    const searchMatch = search ? ([...history].reverse().filter((h) => h.includes(search))[skip] ?? null) : null;

    function run(raw, via = new Set()) {
      const typed = raw;
      const entry = { prompt, input: typed, out: [] };
      let line = typed;
      if (/!/.test(typed)) {
        const result = expandHistory(typed, history);
        if (result.error) {
          entry.out.push(formatCopy(copy.text.eventNotFound, [result.error]));
          setLines((l) => [...l, entry]);
          return;
        }
        if (result.expanded) entry.out.push(result.line);
        line = result.line;
      }
      const next = squash(line) ? [...history, squash(line)] : history;
      if (squash(line)) setHistory(next);
      let cleared = false;
      for (const cmd of splitCommands(line)) {
        const name = cmd.split(' ')[0];
        if (cmd === 'clear') cleared = true;
        else if (cmd === 'history') next.forEach((h, i) => entry.out.push(`${String(i + 1).padStart(5)}  ${h}`));
        else if (outputs.has(cmd)) entry.out.push(...(outputs.get(cmd) ? outputs.get(cmd).replace(/\n$/, '').split('\n') : []));
        else if (known.has(name) || COMMON.has(name)) entry.out.push(copy.text.notHere);
        else entry.out.push(formatCopy(copy.text.notFound, [name]));
      }
      const ran = splitCommands(line);
      setDone((d) =>
        d.map(
          (was, i) =>
            was ||
            ((!tasks[i].commands?.length || tasks[i].commands.some((c) => ran.includes(squash(c)))) &&
              (!tasks[i].typed?.length || tasks[i].typed.some((t) => typed.trim().startsWith(t))) &&
              (!tasks[i].via || via.has(tasks[i].via)) &&
              (tasks[i].commands?.length > 0 || tasks[i].typed?.length > 0 || Boolean(tasks[i].via))),
        ),
      );
      setLines((l) => (cleared ? [] : [...l, entry]));
    }

    function complete(value, at) {
      const before = value.slice(0, at);
      const start = before.search(/\S*$/);
      const partial = before.slice(start);
      const first = !before.slice(0, start).trim() || /[;|]\s*$/.test(before.slice(0, start));
      const pool = first ? vocabulary.filter((w) => known.has(w) || ['history', 'clear', 'exit'].includes(w)) : vocabulary;
      const matches = pool.filter((w) => w.startsWith(partial));
      if (!matches.length) return null;
      let common = matches[0];
      for (const m of matches) while (!m.startsWith(common)) common = common.slice(0, -1);
      if (matches.length === 1) common += ' ';
      if (common.length > partial.length) return { value: before.slice(0, start) + common + value.slice(at), at: start + common.length };
      return { list: matches };
    }

    function onKey(e) {
      const el = e.currentTarget;
      const at = el.selectionStart ?? input.length;
      const key = e.key;
      if (['Alt', 'Control', 'Shift', 'Meta', 'AltGraph'].includes(key)) return;
      if (key !== 'Tab') tabs.current = 0;
      if (!(e.altKey && key === '.')) yank.current = { at: 0, base: null };
      if (search !== null) {
        if (key === 'Enter') {
          e.preventDefault();
          const pick = searchMatch ?? '';
          setSearch(null);
          setInput('');
          if (pick) run(pick, new Set(['search']));
        } else if (e.ctrlKey && key.toLowerCase() === 'r') {
          e.preventDefault();
          setSkip((s) => s + 1);
        } else if (key === 'Escape' || (e.ctrlKey && key === 'g')) {
          e.preventDefault();
          setSearch(null);
        } else if (key === 'ArrowRight' || key === 'ArrowLeft') {
          e.preventDefault();
          setInput(searchMatch ?? '');
          setSearch(null);
        }
        return;
      }
      if (key === 'Enter') {
        e.preventDefault();
        run(input, yanked.current ? new Set(['last-argument']) : new Set());
        yanked.current = false;
        setInput('');
        setBrowse(null);
      } else if (key === 'ArrowUp' || key === 'ArrowDown') {
        e.preventDefault();
        if (!history.length) return;
        const from = browse ?? history.length;
        const to = Math.min(history.length, Math.max(0, from + (key === 'ArrowUp' ? -1 : 1)));
        setBrowse(to);
        setInput(to === history.length ? '' : history[to]);
      } else if (key === 'Tab') {
        e.preventDefault();
        tabs.current += 1;
        const result = complete(input, at);
        if (result?.value !== undefined) {
          setInput(result.value);
          setCursor(result.at);
        } else if (result?.list && tabs.current > 1) {
          setLines((l) => [...l, { prompt, input, out: [result.list.join('  ')] }]);
        }
      } else if (e.altKey && key === '.') {
        e.preventDefault();
        const n = yank.current.at + 1;
        const word = history.length >= n ? lastWord(history[history.length - n]) : '';
        if (!word) return;
        const base = yank.current.base ?? { value: input, at };
        const value = base.value.slice(0, base.at) + word + base.value.slice(base.at);
        yank.current = { at: n, base };
        yanked.current = true;
        setInput(value);
        setCursor(base.at + word.length);
      } else if (e.ctrlKey && !e.shiftKey && !e.altKey) {
        const k = key.toLowerCase();
        const edits = {
          a: () => setCursor(0),
          e: () => setCursor(input.length),
          u: () => {
            setInput(input.slice(at));
            setCursor(0);
          },
          k: () => setInput(input.slice(0, at)),
          l: () => setLines([]),
          r: () => {
            setSearch('');
            setSkip(0);
          },
          c: () => {
            setLines((l) => [...l, { prompt, input: input + '^C', out: [] }]);
            setInput('');
          },
        };
        if (edits[k]) {
          e.preventDefault();
          edits[k]();
        }
      }
    }

    const finished = tasks.length > 0 && done.every(Boolean);
    return (
      <div className="widget shp">
        {title && <p className="widget-label">{title}</p>}
        <div className={`shp-grid ${tasks.length ? '' : 'is-solo'}`}>
          <div className="shp-term" onClick={() => field.current?.focus()}>
            <div className="shp-screen" ref={screen} aria-live="polite">
              {lines.length === 0 && <p className="shp-hint">{copy.text.hint}</p>}
              {lines.map((l, i) => (
                <div key={i}>
                  <div className="shp-line">
                    <span className="shp-prompt">{l.prompt}</span> {l.input}
                  </div>
                  {l.out.map((o, j) => (
                    <div key={j} className="shp-out">
                      {o || ' '}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <label className="shp-input">
              <span className="shp-prompt">{search !== null ? formatCopy(copy.text.searchPrompt, [search]) : prompt}</span>
              <input
                ref={field}
                value={search !== null ? search : input}
                onChange={(e) => {
                  if (search === null) return setInput(e.target.value);
                  setSearch(e.target.value);
                  setSkip(0);
                }}
                onKeyDown={onKey}
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                aria-label={copy.text.inputLabel}
              />
            </label>
            {search !== null && <div className="shp-search">{searchMatch ?? copy.text.noMatch}</div>}
          </div>
          {tasks.length > 0 && (
            <div className="shp-tasks">
              <p className="shp-tasks-title">{finished ? copy.text.allDone : copy.text.tasksTitle}</p>
              <ol>
                {tasks.map((t, i) => (
                  <li key={i} className={done[i] ? 'is-done' : ''}>
                    <span className="shp-tick" aria-hidden="true">
                      {done[i] ? <Check size={14} strokeWidth={3} /> : i + 1}
                    </span>
                    <span>
                      {t.text}
                      <span className="shp-sr">{done[i] ? copy.text.doneLabel : ''}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => {
                  setLines([]);
                  setHistory([]);
                  setInput('');
                  setDone(tasks.map(() => false));
                }}
              >
                <RotateCcw size={14} /> {copy.text.reset}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
  return ShellPractice;
});
