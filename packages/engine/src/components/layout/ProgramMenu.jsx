import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, X } from 'lucide-react';
import { Link, RootLink } from '@/lib/router';
import { hasDetails, program, programPercent, site, track } from '@/lib/course';
import { useDialogFocus } from '@/hooks/useDialogFocus';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useOverlay } from '@/hooks/useOverlay';

/** Groups programs by the platform they teach, in site order. */
function byPlatform(programs) {
  const groups = new Map();
  for (const entry of programs) {
    const key = entry.platform.label;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(entry);
  }
  return [...groups];
}

/**
 * The header's program selector: shows the open program and lists every program with its status and
 * progress. Its open state belongs to the shell's overlay controller, so it never stacks with the
 * navigation drawer, search or the progress panel.
 */
export default function ProgramMenu({ open, onToggle, onClose }) {
  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const mobile = useMediaQuery('(max-width: 960px)');
  const close = onClose;
  useDialogFocus(panelRef, open && !mobile, close);
  useOverlay(panelRef, open && mobile, close);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => !rootRef.current?.contains(e.target) && !panelRef.current?.contains(e.target) && close();
    const onKey = (e) => e.key === 'Escape' && close();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  const panel = open ? (
    <div
      ref={panelRef}
      tabIndex={-1}
      className="progress-panel program-panel"
      role="dialog"
      aria-modal={mobile ? true : undefined}
      aria-label="Programs"
    >
      {mobile && (
        <button className="icon-btn progress-close" aria-label="Close" onClick={close}>
          <X size={18} />
        </button>
      )}
      <p className="progress-panel-title">Programs</p>
      {byPlatform(site.programs).map(([platform, entries]) => (
        <section key={platform} className="program-group">
          <h2 className="program-group-title">{platform}</h2>
          <ul className="program-list">
            {entries.map((entry) => {
              const current = entry.id === program.id;
              const percent = programPercent(entry);
              return (
                <li key={entry.id}>
                  <RootLink
                    to={`/${entry.id}/`}
                    className={`program-item ${current ? 'is-current' : ''}`}
                    onClick={close}
                    aria-current={current ? 'true' : undefined}
                  >
                    <span className="program-item-name">
                      {entry.title}
                      {current && <Check size={14} aria-label="Open now" />}
                    </span>
                    <span className="program-item-meta">
                      {entry.status === 'planned' ? <span className="pill">Planned</span> : <span>{percent}% complete</span>}
                    </span>
                    {entry.status !== 'planned' && (
                      <span className="progress-chapter-bar">
                        <span style={{ width: `${percent}%` }} />
                      </span>
                    )}
                  </RootLink>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      <div className="program-links">
        {hasDetails() ? (
          <Link to={track.platform.path} onClick={close}>
            {track.platform.title}
          </Link>
        ) : (
          <span />
        )}
        <RootLink to="/" onClick={close}>
          All programs
        </RootLink>
      </div>
    </div>
  ) : null;

  return (
    <div className="program-menu" ref={rootRef}>
      <button
        className="brand-pill"
        onClick={onToggle}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Program: ${program.title}. Switch program`}
        title="Switch program"
      >
        <span>{program.label}</span>
        <span>{program.platform.label}</span>
        <ChevronDown size={13} aria-hidden="true" />
      </button>
      {mobile && open
        ? createPortal(
            <div
              className="progress-backdrop"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) close();
              }}
            >
              {panel}
            </div>,
            document.body,
          )
        : panel}
    </div>
  );
}
