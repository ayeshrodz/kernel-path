import { useEffect, useRef, useState } from 'react';
import { course, program, referenceLoaderFor } from '@/lib/course';
import { setHead } from '@/lib/head';
import { useHeadingNavigation } from '@/hooks/useHeadingNavigation';
import LearningPageLayout from '@/components/layout/LearningPageLayout';
import PageTree from '@/components/content/PageTree';

/** Informational content page: metadata supplies the header; content supplies the body. */
export default function ReferencePage({ page }) {
  const [Content, setContent] = useState(null);
  const [error, setError] = useState(null);
  const articleRef = useRef(null);
  useHeadingNavigation(!!Content);
  useEffect(() => {
    let alive = true;
    setHead({ title: `${page.title} · ${course.title}`, route: `/${program.id}/platform`, index: false });
    setContent(null);
    setError(null);
    const load = referenceLoaderFor(page);
    if (!load) setError('This reference page is unavailable.');
    else
      load()
        .then((m) => alive && setContent(m))
        .catch(() => alive && setError('This reference page could not load. Reload to try again.'));
    return () => {
      alive = false;
    };
  }, [page]);
  return (
    <LearningPageLayout
      className="reference-page"
      articleRef={articleRef}
      contentKey={Content ? 'details' : null}
      header={
        <header className="page-header">
          <p className="page-eyebrow">{page.eyebrow}</p>
          <h1 className="page-title">{page.title}</h1>
          <p className="reference-intro">{page.description}</p>
        </header>
      }
    >
      <div className="prose">
        {error ? (
          <p className="load-error" role="alert">
            {error}
          </p>
        ) : Content ? (
          <PageTree page={Content} />
        ) : (
          <p role="status">Loading reference…</p>
        )}
      </div>
    </LearningPageLayout>
  );
}
