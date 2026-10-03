import { useMemo, useState } from 'react';
import { defineWidget, formatCopy } from '@/components/interactive/TeachingContent';
import { grepLines } from '@/lib/grep';

const FLAGS = [
  ['i', 'ignoreCase'],
  ['v', 'invert'],
  ['E', 'extended'],
  ['n', 'numbers'],
];

/** Highlight the match spans in one line of text. */
function Marked({ text, spans }) {
  if (!spans.length) return text;
  const parts = [];
  let at = 0;
  spans.forEach(([a, b], i) => {
    if (a > at) parts.push(text.slice(at, a));
    if (b > a) parts.push(<mark key={i}>{text.slice(a, b)}</mark>);
    at = Math.max(at, b);
  });
  if (at < text.length) parts.push(text.slice(at));
  return parts;
}

/**
 * Try a grep pattern and options against a file: matching lines and the matched text are
 * highlighted, and the output shows exactly what grep prints.
 *
 * props: { title, file, lines: [text], presets: [{ flags, pattern, note }] }
 */
export default defineWidget('GrepTester', (copy) => {
  function GrepTester({ title, file = 'file', lines = [], presets = [] }) {
    const first = presets[0] ?? { flags: '', pattern: '' };
    const [pattern, setPattern] = useState(first.pattern);
    const [flags, setFlags] = useState(new Set(first.flags ?? ''));
    const options = Object.fromEntries(FLAGS.map(([f, key]) => [key, flags.has(f)]));
    const result = useMemo(() => {
      try {
        return grepLines(lines, pattern, options);
      } catch {
        return null;
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lines, pattern, flags]);
    const flagNames = { i: copy.text.flagIgnoreCase, v: copy.text.flagInvert, E: copy.text.flagExtended, n: copy.text.flagNumbers };
    const flagText = [...flags].sort((a, b) => 'ivEn'.indexOf(a) - 'ivEn'.indexOf(b)).join('');
    const command = `grep ${flagText ? `-${flagText} ` : ''}'${pattern}' ${file}`;
    const preset = presets.find((p) => p.pattern === pattern && (p.flags ?? '') === flagText);
    const toggle = (f) =>
      setFlags((s) => {
        const next = new Set(s);
        if (next.has(f)) next.delete(f);
        else next.add(f);
        return next;
      });

    return (
      <div className="widget grept">
        {title && <p className="widget-label">{title}</p>}
        <label className="glob-field">
          <span className="glob-cmd">grep</span>
          <input
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            aria-label={copy.text.inputLabel}
          />
        </label>
        <div className="grept-flags" role="group" aria-label={copy.text.flagsLabel}>
          {FLAGS.map(([f]) => (
            <label key={f} className={`chip ${flags.has(f) ? 'is-active' : ''}`}>
              <input type="checkbox" checked={flags.has(f)} onChange={() => toggle(f)} />-{f}
              <span className="grept-flag-name">{flagNames[f]}</span>
            </label>
          ))}
        </div>
        {presets.length > 0 && (
          <div className="chip-row glob-presets">
            {presets.map((p) => (
              <button
                key={`${p.flags}|${p.pattern}`}
                type="button"
                className={`chip ${p === preset ? 'is-active' : ''}`}
                onClick={() => {
                  setPattern(p.pattern);
                  setFlags(new Set(p.flags ?? ''));
                }}
              >
                {p.flags ? `-${p.flags} ` : ''}
                {p.pattern}
              </button>
            ))}
          </div>
        )}
        <p className="glob-label">{formatCopy(copy.text.fileLabel, [file])}</p>
        <ol className="grept-file">
          {(result?.results ?? lines.map((text, i) => ({ text, n: i + 1, spans: [], selected: false }))).map((r) => (
            <li key={r.n} className={r.selected ? 'is-on' : ''}>
              <span className="grept-n">{r.n}</span>
              <span className="grept-text">
                <Marked text={r.text} spans={options.invert ? [] : r.spans} />
              </span>
            </li>
          ))}
        </ol>
        <p className="glob-label">{copy.text.outputLabel}</p>
        <pre className="terminal glob-line" aria-live="polite">
          {`$ ${command}\n`}
          {result ? result.output.join('\n') || copy.text.noOutput : copy.text.badPattern}
        </pre>
        <p className="glob-summary">{result && formatCopy(copy.text.countTemplate, [result.output.length])}</p>
        {preset?.note && <p className="glob-note">{preset.note}</p>}
      </div>
    );
  }
  return GrepTester;
});
