import { useEffect, useState } from 'react';
import { loadSiteHome, site } from '@/lib/course';
import { setHead } from '@/lib/head';
import { homeMeta } from '@/lib/seo';
import PageTree from '@/components/content/PageTree';

/** The site's home page: its text comes from content/site/home.md. */
export default function PlatformHome() {
  const [page, setPage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    setHead({ ...homeMeta(site, null), route: '/' });
    const load = loadSiteHome();
    if (!load) setError('This site has no home page yet.');
    else
      load.then(
        (loaded) => {
          if (!alive) return;
          setPage(loaded);
          setHead({ ...homeMeta(site, loaded), route: '/' });
        },
        () => alive && setError('The home page could not load. Reload to try again.'),
      );
    return () => {
      alive = false;
    };
  }, []);

  if (page?.kind === 'landing')
    return (
      <div className="landing">
        <PageTree page={page} />
      </div>
    );

  return (
    <div className="page-grid platform-home">
      <article className="page-article">
        <header className="page-header">
          {page?.eyebrow && <p className="page-eyebrow">{page.eyebrow}</p>}
          <h1 className="page-title">{page?.title ?? site.site.tagline}</h1>
          {page?.description && <p className="reference-intro">{page.description}</p>}
        </header>
        <div className="prose">
          {error ? (
            <p className="load-error" role="alert">
              {error}
            </p>
          ) : page ? (
            <PageTree page={page} />
          ) : (
            <p role="status">Loading…</p>
          )}
        </div>
      </article>
    </div>
  );
}
