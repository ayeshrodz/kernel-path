import { useMemo, useState } from 'react';
import { defineWidget, formatCopy } from '@/components/interactive/TeachingContent';
import { expandArgument } from '@/lib/glob';

/**
 * Try a file name pattern against a directory of files and see what Bash would pass to the
 * command: braces expand first, then each word matches against the names, and a pattern that
 * matches nothing is passed on unchanged.
 *
 * props: { title, command, files: [name], presets: [{ pattern, note }], initial }
 */
export default defineWidget('GlobTester', (copy) => {
  function GlobTester({ title, command = 'ls', files = [], presets = [], initial = '' }) {
    const [pattern, setPattern] = useState(initial || presets[0]?.pattern || '*');
    const args = useMemo(
      () =>
        pattern
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .flatMap((arg) => expandArgument(arg, files)),
      [pattern, files],
    );
    const matched = new Set(args.filter((a) => a.kind === 'match').map((a) => a.word));
    const created = args.filter((a) => a.kind === 'plain').map((a) => a.word);
    const missed = args.filter((a) => a.kind === 'nomatch').map((a) => a.word);
    const note = presets.find((p) => p.pattern === pattern.trim())?.note;

    return (
      <div className="widget glob">
        {title && <p className="widget-label">{title}</p>}
        <label className="glob-field">
          <span className="glob-cmd">{command}</span>
          <input
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            aria-label={copy.text.inputLabel}
          />
        </label>
        {presets.length > 0 && (
          <div className="chip-row glob-presets">
            {presets.map((p) => (
              <button
                key={p.pattern}
                type="button"
                className={`chip ${p.pattern === pattern.trim() ? 'is-active' : ''}`}
                onClick={() => setPattern(p.pattern)}
              >
                {p.pattern}
              </button>
            ))}
          </div>
        )}
        <p className="glob-label">{copy.text.directoryLabel}</p>
        <ul className="glob-files" aria-label={copy.text.directoryLabel}>
          {files.map((f) => (
            <li key={f} className={matched.has(f) ? 'is-on' : ''}>
              {f}
              {matched.has(f) && <span className="glob-sr">{copy.text.matchedLabel}</span>}
            </li>
          ))}
        </ul>
        <p className="glob-label">{copy.text.runsLabel}</p>
        <pre className="terminal glob-line" aria-live="polite">
          {command} {args.map((a) => a.word).join(' ')}
        </pre>
        <p className="glob-summary">
          {matched.size > 0 && formatCopy(copy.text.matchedTemplate, [matched.size])}
          {created.length > 0 && ` ${formatCopy(copy.text.plainTemplate, [created.length])}`}
          {missed.length > 0 && ` ${formatCopy(copy.text.noMatchTemplate, [missed.join(' ')])}`}
        </p>
        {note && <p className="glob-note">{note}</p>}
      </div>
    );
  }
  return GlobTester;
});
