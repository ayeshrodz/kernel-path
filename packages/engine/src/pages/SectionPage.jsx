import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Link } from '@/lib/router';
import { ArrowLeft, ArrowRight, Check, Clock } from 'lucide-react';
import { course, findPage, kindLabel, loaderFor, neighbours, program } from '@/lib/course';
import { setHead } from '@/lib/head';
import { sectionMeta } from '@/lib/seo';
import { useProgress } from '@/hooks/useProgress';
import { useHeadingNavigation } from '@/hooks/useHeadingNavigation';
import { useStored } from '@/lib/storage';
import { PageContext } from '@/lib/pageContext';
import { kindIcon } from '@/components/layout/Sidebar';
import LearningPageLayout from '@/components/layout/LearningPageLayout';
import NotFound from './NotFound';
import PageTree from '@/components/content/PageTree';

export default function SectionPage() {
  const { chapterId, slug } = useParams();
  const page = findPage(chapterId, slug);
  if (!page) return <NotFound />;
  return <Section key={page.key} page={page} />;
}

function Section({ page }) {
  const [Content, setContent] = useState(null);
  const [error, setError] = useState(null);
  const articleRef = useRef(null);
  const { isDone, toggle } = useProgress();
  const [, setLastVisited] = useStored('lastVisited', null);
  const { prev, next } = neighbours(page);
  const done = isDone(page.key);
  const Icon = kindIcon[page.section.kind];
  useHeadingNavigation(!!Content);

  useEffect(() => {
    let alive = true;
    const load = loaderFor(page);
    if (!load) {
      setError('This section has not been written yet.');
      return;
    }
    load()
      .then((mod) => alive && setContent(mod))
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [page]);

  useEffect(() => {
    setLastVisited(page.key);
  }, [page, setLastVisited]);

  useEffect(() => {
    setHead({ ...sectionMeta(page.section, page.chapter, program, Content), route: `/${program.id}/${page.key}` });
  }, [page, Content]);

  return (
    <PageContext.Provider value={page}>
      <LearningPageLayout
        articleRef={articleRef}
        contentKey={Content ? page.key : null}
        header={
          <header className="page-header">
            <Link to={`/${page.chapter.id}`} className="page-eyebrow">
              Chapter {page.chapter.number} · {page.chapter.title}
            </Link>
            <h1 className="page-title">
              <span className="page-num">{page.number}</span> {page.section.title}
            </h1>
            <div className="page-meta">
              <span className={`pill kind-${page.section.kind}`}>
                <Icon size={12} /> {kindLabel[page.section.kind]}
              </span>
              <span className="pill">
                <Clock size={12} /> {page.section.minutes} min
              </span>
              {done && (
                <span className="pill pill-done">
                  <Check size={12} /> Completed
                </span>
              )}
            </div>
          </header>
        }
      >
        <div className="prose">
          {error ? (
            <p className="load-error">{error}</p>
          ) : Content ? (
            <PageTree page={Content} chapterId={page.chapter.id} />
          ) : (
            <PageSkeleton />
          )}
        </div>

        <footer className="page-footer">
          <button className={`complete-btn ${done ? 'is-done' : ''}`} onClick={() => toggle(page.key)}>
            <span className="complete-check">
              <Check size={14} strokeWidth={3} />
            </span>
            {done ? 'Completed. Nice work!' : 'Mark this section complete'}
          </button>

          <nav className="pager" aria-label="Section navigation">
            {prev ? (
              <Link className="pager-link" to={prev.path}>
                <span className="pager-dir">
                  <ArrowLeft size={14} /> Previous
                </span>
                <span className="pager-title">
                  {prev.number} {prev.section.title}
                </span>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link className="pager-link is-next" to={next.path}>
                <span className="pager-dir">
                  Next <ArrowRight size={14} />
                </span>
                <span className="pager-title">
                  {next.number} {next.section.title}
                </span>
              </Link>
            ) : (
              <Link className="pager-link is-next" to="/">
                <span className="pager-dir">
                  Back to overview <ArrowRight size={14} />
                </span>
                <span className="pager-title">More chapters are on the way</span>
              </Link>
            )}
          </nav>
        </footer>
      </LearningPageLayout>
    </PageContext.Provider>
  );
}

function PageSkeleton() {
  return (
    <div className="skeleton" aria-label="Loading">
      <span style={{ width: '92%' }} />
      <span style={{ width: '86%' }} />
      <span style={{ width: '60%' }} />
      <span className="skeleton-block" />
      <span style={{ width: '80%' }} />
    </div>
  );
}
