import { Link, RootLink } from '@/lib/router';
import { course, site } from '@/lib/course';
import Logo from './Logo';
import { defineWidget } from '@/components/interactive/TeachingContent';

export default defineWidget('Footer', (copy) => {
  const year = new Date().getFullYear();

  function Footer({ platform = false }) {
    // On the site's own pages no program is open, so the site's identity stands in for the course's.
    const about = platform ? { title: site.site.name, tagline: site.site.tagline, repo: site.site.repo } : course;
    const repo = about.repo;
    return (
      <footer className="site-footer">
        <div className="site-footer-inner">
          <div className="site-footer-about">
            <p className="site-footer-brand">
              <Logo /> {about.title}
            </p>
            <p>
              {about.tagline}
              {copy.text.p}
            </p>
          </div>

          <nav className="site-footer-links" aria-label={copy.text.label}>
            <p className="site-footer-head">{copy.text.siteFooterHead}</p>
            <ul>
              {platform ? (
                site.programs.map((entry) => (
                  <li key={entry.id}>
                    <RootLink to={`/${entry.id}/`}>{entry.title}</RootLink>
                  </li>
                ))
              ) : (
                <>
                  <li>
                    <Link to="/">{copy.text.link}</Link>
                  </li>
                  <li>
                    <Link to="/ch01">{copy.text.link2}</Link>
                  </li>
                </>
              )}
              {repo && (
                <>
                  <li>
                    <a href={repo} target="_blank" rel="noopener noreferrer">
                      {copy.text.a}
                    </a>
                  </li>
                  <li>
                    <a href={`${repo}/blob/main/CONTRIBUTING.md`} target="_blank" rel="noopener noreferrer">
                      {copy.text.a2}
                    </a>
                  </li>
                  <li>
                    <a href={`${repo}/issues/new/choose`} target="_blank" rel="noopener noreferrer">
                      {copy.text.a3}
                    </a>
                  </li>
                </>
              )}
            </ul>
          </nav>

          <nav className="site-footer-links" aria-label={copy.text.label2}>
            <p className="site-footer-head">{copy.text.siteFooterHead2}</p>
            <ul>
              <li>
                <a href={copy.text.href} target="_blank" rel="noopener noreferrer">
                  {copy.text.a4}
                </a>
              </li>
              <li>
                <a href={copy.text.href2} target="_blank" rel="noopener noreferrer">
                  {copy.text.a5}
                </a>
              </li>
              <li>
                <a href={copy.text.href3} target="_blank" rel="noopener noreferrer">
                  {copy.text.a6}
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="site-footer-legal">
          <p className="site-footer-disclaimer">
            <strong>{copy.text.strong}</strong> {copy.text.siteFooterDisclaimer}
          </p>
          <p>{copy.text.p2}</p>
          <p>
            {copy.text.p3}
            {year} {about.title}
            {copy.text.p4}{' '}
            <a href={copy.text.href4} target="_blank" rel="noopener noreferrer">
              {copy.text.a7}
            </a>
            {copy.text.p5}{' '}
            {repo ? (
              <a href={`${repo}/blob/main/LICENSE`} target="_blank" rel="noopener noreferrer">
                {copy.text.a8}
              </a>
            ) : (
              copy.text.label3
            )}
            {copy.text.p6}
          </p>
        </div>
      </footer>
    );
  }
  return Footer;
});
