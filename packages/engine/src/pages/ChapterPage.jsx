import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Link } from '@/lib/router';
import { ArrowRight, Check, Clock } from 'lucide-react';
import { course, findChapter, kindLabel, program } from '@/lib/course';
import { setHead } from '@/lib/head';
import { chapterMeta } from '@/lib/seo';
import { chapterProgress, useProgress } from '@/hooks/useProgress';
import { kindIcon } from '@/components/layout/Sidebar';
import NotFound from './NotFound';

export default function ChapterPage() {
  const { chapterId } = useParams();
  const chapter = findChapter(chapterId);
  const { done, isDone } = useProgress();

  useEffect(() => {
    if (chapter) setHead({ ...chapterMeta(chapter, program), route: `/${program.id}/${chapter.id}` });
  }, [chapter]);

  if (!chapter) return <NotFound />;

  const { count, total } = chapterProgress(chapter, done);
  const firstOpen = chapter.sections.find((s) => !isDone(`${chapter.id}/${s.slug}`)) ?? chapter.sections[0];
  const minutes = chapter.sections.reduce((sum, s) => sum + s.minutes, 0);

  return (
    <div className="chapter-page">
      <header className="chapter-hero">
        <p className="page-eyebrow">Chapter {chapter.number}</p>
        <h1 className="chapter-title">{chapter.title}</h1>
        <p className="chapter-goal">{chapter.goal}</p>
        {!chapter.comingSoon && (
          <div className="chapter-actions">
            <Link className="btn btn-primary" to={`/${chapter.id}/${firstOpen.slug}`}>
              {count === 0 ? 'Start chapter' : count === total ? 'Review chapter' : 'Continue'} <ArrowRight size={15} />
            </Link>
            <span className="chapter-stat">
              {total} sections · about {Math.round(minutes / 5) * 5} min · {count}/{total} complete
            </span>
          </div>
        )}
      </header>

      {chapter.comingSoon ? (
        <section className="soon-card">
          <h2>Being written</h2>
          <p>This chapter is next on the list. It will cover:</p>
          <ul>
            {chapter.topics.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      ) : (
        <>
          <section className="chapter-objectives">
            <h2>By the end of this chapter you can</h2>
            <ul>
              {chapter.objectives.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </section>

          <ol className="section-list">
            {chapter.sections.map((s, i) => {
              const Icon = kindIcon[s.kind];
              const complete = isDone(`${chapter.id}/${s.slug}`);
              return (
                <li key={s.slug}>
                  <Link to={`/${chapter.id}/${s.slug}`} className={`section-card kind-${s.kind} ${complete ? 'is-done' : ''}`}>
                    <span className="section-card-icon">{complete ? <Check size={16} strokeWidth={2.5} /> : <Icon size={16} />}</span>
                    <span className="section-card-body">
                      <span className="section-card-num">
                        {chapter.number}.{i + 1} · {kindLabel[s.kind]}
                      </span>
                      <span className="section-card-title">{s.title}</span>
                    </span>
                    <span className="section-card-time">
                      <Clock size={12} /> {s.minutes} min
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </div>
  );
}
