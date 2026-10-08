import { useEffect } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { Link } from '@/lib/router';
import { chapters, pages, program, site } from '@/lib/course';
import { setHead } from '@/lib/head';
import { programMeta } from '@/lib/seo';
import { chapterProgress, useProgress } from '@/hooks/useProgress';
import { useStored } from '@/lib/storage';

/**
 * The landing page of a program that has no authored landing copy: it is built from the
 * program definition alone (title, summary, stages, chapters), with the engine's English wording.
 */
export default function ProgramLanding() {
  const { done, percent } = useProgress();
  const [lastVisited] = useStored('lastVisited', null);
  const planned = program.status === 'planned' || pages.length === 0;
  const start = pages.find((p) => !p.chapter.setup) ?? pages[0];
  const resume = pages.find((p) => p.key === lastVisited) ?? pages.find((p) => !done.includes(p.key)) ?? start;
  const started = done.length > 0 || !!lastVisited;
  const stages = program.stages ?? [];

  useEffect(() => {
    setHead({ ...programMeta(program, site.site.name), route: `/${program.id}` });
  }, []);

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-text">
          <p className="page-eyebrow">
            {program.platform.label} · {program.label}
          </p>
          <h1>{program.title}</h1>
          <p className="hero-sub">{program.summary}</p>
          <div className="hero-actions">
            {planned ? (
              <>
                {pages.length > 0 && (
                  <Link className="btn btn-primary btn-lg" to={start.path}>
                    Build the practice lab <ArrowRight size={16} />
                  </Link>
                )}
                <span className="pill">Planned: the chapters below are the outline</span>
              </>
            ) : (
              <>
                <Link className="btn btn-primary btn-lg" to={(started ? resume : start).path}>
                  {started ? `Continue with ${resume.number}` : 'Start learning'} <ArrowRight size={16} />
                </Link>
                {started && <span className="hero-progress">{percent}% complete</span>}
              </>
            )}
          </div>
        </div>
      </section>

      {stages.length > 0 && (
        <section className="home-section">
          <h2>The path</h2>
          <ol className="path" style={{ '--path-stages': stages.length }}>
            {stages.map((stage, i) => {
              const inStage = chapters.filter((c) => stage.chapters.includes(c.number));
              const total = inStage.reduce((n, c) => n + chapterProgress(c, done).total, 0);
              const count = inStage.reduce((n, c) => n + chapterProgress(c, done).count, 0);
              const state = total && count === total ? 'is-done' : count > 0 ? 'is-started' : '';
              return (
                <li key={stage.title} className={`path-stage ${state}`}>
                  <Link to={`/ch${String(stage.chapters[0]).padStart(2, '0')}`} className="path-link">
                    <span className="path-dot">{state === 'is-done' ? <Check size={14} strokeWidth={3} /> : i + 1}</span>
                    <span className="path-body">
                      <span className="path-title">{stage.title}</span>
                      <span className="path-chapters">
                        Chapter{stage.chapters.length > 1 ? 's' : ''} {stage.chapters.join('–')}
                      </span>
                      <span className="path-text">{stage.text}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <section className="home-section">
        <h2>Chapters</h2>
        <ol className="chapter-grid">
          {chapters.map((ch) => {
            const { count, total } = chapterProgress(ch, done);
            return (
              <li key={ch.id}>
                <Link to={`/${ch.id}`} className={`chapter-card ${ch.comingSoon ? 'is-soon' : ''}`}>
                  <span className="chapter-card-top">
                    <span className="chapter-card-num">{String(ch.number).padStart(2, '0')}</span>
                    {ch.comingSoon ? <span className="pill">Coming soon</span> : <span className="pill pill-accent">{total} sections</span>}
                  </span>
                  <span className="chapter-card-title">{ch.title}</span>
                  <span className="chapter-card-goal">{ch.goal}</span>
                  {!ch.comingSoon && (
                    <span className="chapter-card-bar" aria-label={`${count} of ${total} complete`}>
                      <span style={{ width: `${(count / total) * 100}%` }} />
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
