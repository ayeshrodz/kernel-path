import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { defineWidget, formatCopy } from '@/components/interactive/TeachingContent';
import './ch04.css';

export default defineWidget('DataExplorer', (copy) => {
  const METHOD_NAMES = new Set(['add', 'append', 'clear', 'copy', 'discard', 'get', 'items', 'keys', 'pop', 'update', 'values']);

  function DataExplorer({ name, data, initial = [], legacyPrefix, title }) {
    const [path, setPath] = useState(initial);
    const [open, setOpen] = useState(() => new Set(['', ...initial.map((_, i) => initial.slice(0, i + 1).join('\u0000'))]));
    const value = path.reduce((v, k) => v?.[k], data);

    const dot = [name, ...path].join('.');
    const bracket = name + path.map((k) => (typeof k === 'number' ? `[${k}]` : `['${k}']`)).join('');
    const clash = path.find((k) => METHOD_NAMES.has(k));
    const legacy =
      legacyPrefix && path.length
        ? legacyPrefix +
          path[0] +
          path
            .slice(1)
            .map((k) => (typeof k === 'number' ? `[${k}]` : `['${k}']`))
            .join('')
        : null;

    const toggle = (key) =>
      setOpen((s) => {
        const n = new Set(s);
        n.has(key) ? n.delete(key) : n.add(key);
        return n;
      });

    const render = (node, trail) => {
      const entries = Array.isArray(node) ? node.map((v, i) => [i, v]) : Object.entries(node);
      return (
        <ul>
          {entries.map(([k, v]) => {
            const p = [...trail, k];
            const key = p.join('\u0000');
            const branch = v !== null && typeof v === 'object';
            const isOpen = open.has(key);
            const selected = p.length === path.length && p.every((x, i) => x === path[i]);
            return (
              <li key={key}>
                <button
                  className={`dx-node ${selected ? 'is-selected' : ''}`}
                  onClick={() => {
                    setPath(p);
                    if (branch) toggle(key);
                  }}
                >
                  {branch ? (
                    <ChevronRight size={12} className={`dx-caret ${isOpen ? 'is-open' : ''}`} />
                  ) : (
                    <span className="dx-caret-space" />
                  )}
                  <span className="dx-key">{typeof k === 'number' ? `[${k}]` : k}</span>
                  {!branch && <span className="dx-val">{JSON.stringify(v)}</span>}
                  {branch && !isOpen && (
                    <span className="dx-summary">{Array.isArray(v) ? `[${v.length}]` : `{${Object.keys(v).length}}`}</span>
                  )}
                </button>
                {branch && isOpen && render(v, p)}
              </li>
            );
          })}
        </ul>
      );
    };

    return (
      <div className="widget dx">
        {title && <p className="widget-title">{title}</p>}
        <div className="dx-grid">
          <div className="dx-tree">
            <p className="widget-label">
              {name}
              {copy.text.widgetLabel}
            </p>
            {render(data, [])}
          </div>
          <div className="dx-detail" aria-live="polite">
            <p className="widget-label">{copy.text.widgetLabel2}</p>
            <code className="dx-expr">{formatCopy(copy.text.template, [bracket])}</code>
            <code className={`dx-expr ${clash ? 'is-risky' : ''}`}>{formatCopy(copy.text.template2, [dot])}</code>
            {clash && (
              <p className="dx-warn">
                <code>{clash}</code>
                {copy.text.dxWarn}
              </p>
            )}
            {legacy && (
              <>
                <p className="widget-label dx-gap">{copy.text.widgetLabel3}</p>
                <code className="dx-expr is-legacy">{formatCopy(copy.text.template3, [legacy])}</code>
              </>
            )}
            <p className="widget-label dx-gap">{copy.text.widgetLabel4}</p>
            <pre className="dx-value">{value === undefined ? 'undefined' : JSON.stringify(value, null, 2)}</pre>
          </div>
        </div>
      </div>
    );
  }
  return DataExplorer;
});
