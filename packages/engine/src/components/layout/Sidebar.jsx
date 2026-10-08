import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Link, NavLink, useProgramLocation } from '@/lib/router';
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  CircleHelp,
  FlaskConical,
  ListChecks,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  X,
} from 'lucide-react';
import { chapters, interfaceContent, pages } from '@/lib/course';
import { chapterProgress, useProgress } from '@/hooks/useProgress';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useOverlay } from '@/hooks/useOverlay';
import { useStored } from '@/lib/storage';
import { defineWidget, formatCopy } from '@/components/interactive/TeachingContent';

export const kindIcon = { lesson: BookOpen, lab: FlaskConical, quiz: CircleHelp, summary: ListChecks };

/** Chapters grouped by the course stages shown on the home page; unstaged chapters (setup) come first. */
function stageGroups(setupTitle) {
  const stages = interfaceContent.HomePage?.data?.stages ?? [];
  const staged = new Set(stages.flatMap((s) => s.chapters));
  const groups = [];
  const setup = chapters.filter((c) => !staged.has(c.number));
  if (setup.length) groups.push({ title: setupTitle, chapters: setup });
  for (const stage of stages) {
    const list = chapters.filter((c) => stage.chapters.includes(c.number));
    if (list.length) groups.push({ title: stage.title, chapters: list });
  }
  return groups;
}

/** The next unfinished section after the one being read, wrapping to the first unfinished one. */
function upNext(done, pathname, lastVisited) {
  const here = pages.findIndex((p) => p.path === pathname || p.key === lastVisited);
  const after = pages.slice(here + 1).find((p) => !done.includes(p.key) && p.path !== pathname);
  return after ?? pages.find((p) => !done.includes(p.key) && p.path !== pathname) ?? null;
}

function Highlight({ text, query }) {
  if (!query) return text;
  const at = text.toLowerCase().indexOf(query.toLowerCase());
  if (at < 0) return text;
  return (
    <>
      {text.slice(0, at)}
      <mark>{text.slice(at, at + query.length)}</mark>
      {text.slice(at + query.length)}
    </>
  );
}

/** A chapter number inside a ring that fills as its sections are completed. */
function ChapterRing({ number, count, total, size = 28 }) {
  const stroke = 2;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const value = total ? count / total : 0;
  return (
    <span className={`map-ring ${value === 1 ? 'is-done' : ''}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="map-ring-track" />
        {value > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            strokeWidth={stroke}
            className="map-ring-fill"
            strokeDasharray={c}
            strokeDashoffset={c - value * c}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </svg>
      <span className="map-ring-num">{value === 1 ? <Check size={size * 0.46} strokeWidth={3} /> : number}</span>
    </span>
  );
}

/** One chapter's sections on a journey line, with a highlight that slides to the open page. */
function SectionList({ chapter, text, query, matches, pathname, isDone, onNavigate }) {
  const listRef = useRef(null);
  const [marker, setMarker] = useState(null);
  const sections = chapter.sections
    .map((section, index) => ({ section, index, key: `${chapter.id}/${section.slug}` }))
    .filter(({ key }) => !matches || matches.has(key));

  useLayoutEffect(() => {
    // Measure the row, not the link: each row is positioned for its journey line.
    const row = listRef.current?.querySelector('a[aria-current="page"]')?.closest('li');
    setMarker(row ? { top: row.offsetTop, height: row.offsetHeight } : null);
  }, [pathname, query, sections.length]);

  return (
    <ol
      className="map-sections"
      ref={listRef}
      style={marker ? { '--marker-top': `${marker.top}px`, '--marker-height': `${marker.height}px` } : undefined}
    >
      {marker && <li className="map-marker" aria-hidden="true" />}
      {sections.map(({ section, index, key }, i) => {
        const complete = isDone(key);
        const nextDone = sections[i + 1] && isDone(sections[i + 1].key);
        const Kind = section.kind !== 'lesson' ? kindIcon[section.kind] : null;
        const kindText = { lab: text.kindLab, quiz: text.kindQuiz, summary: text.kindSummary }[section.kind];
        return (
          <li key={key} className={`map-section ${complete ? 'is-done' : ''} ${complete && nextDone ? 'is-linked' : ''}`}>
            <NavLink to={`/${chapter.id}/${section.slug}`} className="map-section-link" onClick={onNavigate}>
              <span className="map-node" aria-hidden="true">
                {complete && <Check size={9} strokeWidth={3.5} />}
              </span>
              <span className="map-section-num">
                {chapter.number}.{index + 1}
              </span>
              <span className="map-section-title">
                <Highlight text={section.title} query={query} />
                {complete && <span className="visually-hidden">, {text.done}</span>}
              </span>
              {Kind && (
                <span className={`map-kind kind-${section.kind}`} title={kindText}>
                  <Kind size={12} aria-hidden="true" />
                  <span className="visually-hidden">{kindText}</span>
                </span>
              )}
            </NavLink>
          </li>
        );
      })}
    </ol>
  );
}

function ChapterItem({ chapter, text, open, onToggle, current, query, matches, pathname, done, isDone, onNavigate }) {
  const { count, total } = chapterProgress(chapter, done);
  const expanded = open && !chapter.comingSoon;
  const regionId = `map-${chapter.id}`;
  return (
    <li className={`map-chapter ${current ? 'is-current' : ''} ${expanded ? 'is-open' : ''} ${chapter.comingSoon ? 'is-soon' : ''}`}>
      <div className="map-chapter-row">
        <NavLink to={`/${chapter.id}`} end className="map-chapter-link" onClick={onNavigate}>
          <ChapterRing number={chapter.number} count={count} total={total} />
          <span className="map-chapter-title">
            <Highlight text={chapter.title} query={query} />
          </span>
        </NavLink>
        {chapter.comingSoon ? (
          <span className="map-soon">{text.soon}</span>
        ) : (
          <button
            className="map-expand"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-controls={regionId}
            aria-label={formatCopy(expanded ? text.collapse : text.expand, [chapter.number])}
            title={formatCopy(text.chapterProgress, [count, total])}
          >
            <span className="map-count">
              {count}/{total}
            </span>
            <ChevronDown size={15} />
          </button>
        )}
      </div>
      {!chapter.comingSoon && (
        <div className="map-drawer" id={regionId} inert={expanded ? undefined : true}>
          <div className="map-drawer-inner">
            <SectionList
              chapter={chapter}
              text={text}
              query={query}
              matches={matches}
              pathname={pathname}
              isDone={isDone}
              onNavigate={onNavigate}
            />
          </div>
        </div>
      )}
    </li>
  );
}

function ProgressCard({ text, pathname, onNavigate }) {
  const { done, percent, total } = useProgress();
  const [lastVisited] = useStored('lastVisited', null);
  const next = upNext(done, pathname, lastVisited);
  const size = 38;
  const r = (size - 4) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="map-card">
      <Link
        to="/progress"
        className="map-card-ring"
        aria-label={`${formatCopy(text.progress, [done.length, total])}. ${text.progressLink}`}
        title={formatCopy(text.progress, [done.length, total])}
        onClick={onNavigate}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
          <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={3.5} className="map-ring-track" />
          {percent > 0 && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              strokeWidth={3.5}
              className="map-ring-fill"
              strokeDasharray={c}
              strokeDashoffset={c - (percent / 100) * c}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          )}
        </svg>
        <span>{percent}%</span>
      </Link>
      {next ? (
        <Link to={next.path} className="map-next" onClick={onNavigate}>
          <span className="map-next-label">
            {text.upNext}
            <span className="map-next-stat"> · {formatCopy(text.progressShort, [done.length, total])}</span>
          </span>
          <span className="map-next-title">
            {next.number} {next.section.title}
          </span>
          <ArrowRight size={14} className="map-next-arrow" aria-hidden="true" />
        </Link>
      ) : (
        <p className="map-next is-finished">{text.allDone}</p>
      )}
    </div>
  );
}

function CourseMap({ text, groups, pathname, chapterId, onNavigate, closeRef, onClose, onCollapse }) {
  const { done, isDone } = useProgress();
  const [openId, setOpenId] = useState(chapterId ?? chapters.find((c) => !c.setup)?.id);
  const [query, setQuery] = useState('');
  const scrollRef = useRef(null);
  const q = query.trim();

  useEffect(() => {
    if (chapterId) setOpenId(chapterId);
  }, [chapterId]);

  // Sections whose number, title or chapter title contains the filter text.
  const matches = useMemo(() => {
    if (!q) return null;
    const needle = q.toLowerCase();
    return new Set(
      pages.filter((p) => `${p.number} ${p.section.title} ${p.chapter.title}`.toLowerCase().includes(needle)).map((p) => p.key),
    );
  }, [q]);

  // Keep the open page in view when the route changes or the map opens.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const active = scrollRef.current?.querySelector('.map-section-link[aria-current="page"]');
      active?.scrollIntoView({ block: 'nearest' });
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  const first = matches && pages.find((p) => matches.has(p.key));

  return (
    <div className="map">
      <div className="map-head">
        <div className="map-search-row">
          <div className={`map-filter ${q ? 'has-query' : ''}`} role="search">
            <Search size={14} aria-hidden="true" />
            <input
              type="search"
              value={query}
              placeholder={text.filter}
              aria-label={text.filterLabel}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape' && query) {
                  e.stopPropagation();
                  setQuery('');
                }
                if (e.key === 'Enter' && first)
                  scrollRef.current?.querySelector(`a[href$="${first.path}/"], a[href$="${first.path}"]`)?.click();
              }}
            />
            {q && (
              <button className="map-filter-clear" onClick={() => setQuery('')} aria-label={text.clear}>
                <X size={13} />
              </button>
            )}
          </div>
          {onClose && (
            <button ref={closeRef} className="icon-btn map-close" onClick={onClose} aria-label={text.close}>
              <X size={18} />
            </button>
          )}
          {onCollapse && (
            <button className="icon-btn map-collapse" onClick={onCollapse} aria-label={text.collapseSidebar} title={text.shortcut}>
              <PanelLeftClose size={17} />
            </button>
          )}
        </div>
        <ProgressCard text={text} pathname={pathname} onNavigate={onNavigate} />
      </div>

      <div className="map-scroll" ref={scrollRef}>
        <p className="visually-hidden" aria-live="polite">
          {q ? formatCopy(text.matches, [matches.size]) : ''}
        </p>

        {q && matches.size === 0 && <p className="map-empty">{formatCopy(text.noMatches, [q])}</p>}

        {groups.map((group) => {
          const visible = group.chapters.filter((ch) => !matches || ch.sections.some((s) => matches.has(`${ch.id}/${s.slug}`)));
          if (!visible.length) return null;
          return (
            <section className="map-stage" key={group.title} aria-label={group.title}>
              <h2 className="map-stage-title">{group.title}</h2>
              <ol className="map-chapters">
                {visible.map((ch) => (
                  <ChapterItem
                    key={ch.id}
                    chapter={ch}
                    text={text}
                    open={matches ? true : openId === ch.id}
                    onToggle={() => setOpenId((id) => (id === ch.id ? null : ch.id))}
                    current={chapterId === ch.id}
                    query={q}
                    matches={matches}
                    pathname={pathname}
                    done={done}
                    isDone={isDone}
                    onNavigate={onNavigate}
                  />
                ))}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}

/** Collapsed desktop rail: chapter rings by stage, each with a flyout of its sections. */
function Rail({ text, groups, chapterId, onExpand }) {
  const { done, isDone } = useProgress();
  const place = (event) => {
    const item = event.currentTarget;
    const rect = item.getBoundingClientRect();
    const top = Math.max(8, Math.min(rect.top - 8, window.innerHeight - 380));
    item.style.setProperty('--flyout-top', `${top}px`);
    item.style.setProperty('--flyout-left', `${rect.right + 6}px`);
  };
  return (
    <div className="rail">
      <button className="icon-btn" onClick={onExpand} aria-label={text.expandSidebar} title={text.shortcut}>
        <PanelLeftOpen size={17} />
      </button>
      {groups.map((group) => (
        <ol className="rail-stage" key={group.title} aria-label={group.title}>
          {group.chapters.map((ch) => {
            const { count, total } = chapterProgress(ch, done);
            return (
              <li key={ch.id} className="rail-entry" onMouseEnter={place} onFocus={place}>
                <NavLink
                  to={`/${ch.id}`}
                  className={`rail-item rail-chapter ${chapterId === ch.id ? 'is-current' : ''} ${ch.comingSoon ? 'is-soon' : ''}`}
                  aria-label={`${ch.number}. ${ch.title}, ${formatCopy(text.chapterProgress, [count, total])}`}
                >
                  <ChapterRing number={ch.number} count={count} total={total} size={32} />
                </NavLink>
                {!ch.comingSoon && (
                  <div className="rail-flyout">
                    <p className="rail-flyout-stage">{group.title}</p>
                    <p className="rail-flyout-title">
                      {ch.number}. {ch.title}
                    </p>
                    <div className="rail-flyout-bar" aria-hidden="true">
                      <span style={{ width: `${total ? (count / total) * 100 : 0}%` }} />
                    </div>
                    <ol>
                      {ch.sections.map((s, i) => {
                        const key = `${ch.id}/${s.slug}`;
                        return (
                          <li key={key}>
                            <NavLink to={`/${key}`} className={isDone(key) ? 'is-done' : ''}>
                              <span className="map-section-num">
                                {ch.number}.{i + 1}
                              </span>
                              <span>{s.title}</span>
                              {isDone(key) && <Check size={12} strokeWidth={3} aria-hidden="true" />}
                            </NavLink>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      ))}
    </div>
  );
}

/** Swipe the open drawer towards its edge to close it. */
function useSwipeToClose(ref, active, onClose) {
  useEffect(() => {
    const panel = ref.current;
    if (!active || !panel) return;
    let start = null;
    let dx = 0;
    const down = (e) => {
      if (e.pointerType !== 'touch') return;
      start = { x: e.clientX, y: e.clientY, t: performance.now(), axis: null };
      dx = 0;
    };
    const move = (e) => {
      if (!start) return;
      const x = e.clientX - start.x;
      const y = e.clientY - start.y;
      if (!start.axis && Math.hypot(x, y) > 10) start.axis = Math.abs(x) > Math.abs(y) ? 'x' : 'y';
      if (start.axis !== 'x') return;
      dx = Math.min(0, x);
      panel.style.transition = 'none';
      panel.style.transform = `translateX(${dx}px)`;
    };
    const up = () => {
      if (!start) return;
      const fast = start.axis === 'x' && dx < -40 && performance.now() - start.t < 250;
      panel.style.transition = '';
      panel.style.transform = '';
      if (start.axis === 'x' && (dx < -panel.offsetWidth / 3 || fast)) onClose();
      start = null;
    };
    panel.addEventListener('pointerdown', down);
    panel.addEventListener('pointermove', move);
    panel.addEventListener('pointerup', up);
    panel.addEventListener('pointercancel', up);
    return () => {
      panel.removeEventListener('pointerdown', down);
      panel.removeEventListener('pointermove', move);
      panel.removeEventListener('pointerup', up);
      panel.removeEventListener('pointercancel', up);
    };
  }, [ref, active, onClose]);
}

/**
 * Course navigation. On desktop a course map that can shrink to a rail of chapter rings;
 * on small screens the same map in a slide-in drawer.
 */
export default defineWidget('Sidebar', (copy) => {
  const text = copy.text;
  const groups = stageGroups(text.setupStage);

  function Sidebar({ open, onClose, collapsed, onToggleCollapsed }) {
    const { chapterId } = useParams();
    const { pathname } = useProgramLocation();
    const isMobile = useMediaQuery('(max-width: 960px)');
    const rail = collapsed && !isMobile;
    const navRef = useRef(null);
    const closeRef = useRef(null);
    useOverlay(navRef, isMobile && open, onClose, closeRef);
    useSwipeToClose(navRef, isMobile && open, onClose);

    return (
      <>
        <div className={`scrim ${open ? 'is-open' : ''}`} onClick={onClose} aria-hidden="true" />
        <nav
          ref={navRef}
          id="course-navigation"
          tabIndex={-1}
          inert={isMobile && !open ? true : undefined}
          aria-hidden={isMobile && !open ? true : undefined}
          className={`sidebar ${open ? 'is-open' : ''} ${rail ? 'is-rail' : ''}`}
          role={isMobile && open ? 'dialog' : undefined}
          aria-modal={isMobile && open ? true : undefined}
          aria-label={text.label}
        >
          {rail ? (
            <Rail text={text} groups={groups} chapterId={chapterId} onExpand={onToggleCollapsed} />
          ) : (
            <CourseMap
              text={text}
              groups={groups}
              pathname={pathname}
              chapterId={chapterId}
              closeRef={closeRef}
              onClose={isMobile ? onClose : null}
              onCollapse={isMobile ? null : onToggleCollapsed}
            />
          )}
        </nav>
      </>
    );
  }
  return Sidebar;
});
