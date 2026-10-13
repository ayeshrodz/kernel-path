import { useEffect } from 'react';
import { chapters, program, site } from '@/lib/course';
import { setHead } from '@/lib/head';
import { chapterProgress, useProgress } from '@/hooks/useProgress';

/** The learning dashboard of a program that has no authored dashboard copy: overall and per-chapter progress. */
export default function ProgramProgress() {
  const { done, percent, total } = useProgress();
  useEffect(() => {
    setHead({ title: `Your learning · ${site.site.name}`, route: `/${program.id}/progress`, index: false });
  }, []);
  return (
    <div className="page-grid platform-home">
      <article className="page-article">
        <header className="page-header">
          <p className="page-eyebrow">{program.title}</p>
          <h1 className="page-title">Your learning</h1>
          <p className="reference-intro">
            {done.length} of {total} sections complete ({percent}%). Progress is saved in this browser.
          </p>
        </header>
        <ul className="progress-chapters">
          {chapters
            .filter((c) => !c.comingSoon)
            .map((ch) => {
              const { count, total: t } = chapterProgress(ch, done);
              return (
                <li key={ch.id}>
                  <span className="progress-chapter-name">
                    {ch.number}. {ch.title}
                  </span>
                  <span className="progress-chapter-count">
                    {count} of {t}
                  </span>
                  <span className="progress-chapter-bar">
                    <span style={{ width: `${(count / t) * 100}%` }} />
                  </span>
                </li>
              );
            })}
        </ul>
      </article>
    </div>
  );
}
