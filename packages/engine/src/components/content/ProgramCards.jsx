import { ArrowRight } from 'lucide-react';
import { RootLink } from '@/lib/router';
import { programPercent, site } from '@/lib/course';
import ProgramArt from '@/components/landing/ProgramArt';
import { useInView } from '@/components/landing/useInView';

/**
 * A showcase card for each program on the site: its illustration, platform, topics, size and the
 * reader's progress. The look of each card comes from the program's `showcase` settings.
 */
export default function ProgramCards() {
  const [ref, seen] = useInView(0.12);
  return (
    <ol ref={ref} className={`showcase ${seen ? 'is-in' : ''}`}>
      {site.programs.map((entry, i) => {
        const planned = entry.status === 'planned';
        const open = entry.sections > 0;
        const percent = programPercent(entry);
        const look = entry.showcase ?? { art: 'automation', tone: 'purple' };
        const action = planned
          ? open
            ? 'Build the practice lab'
            : 'See the outline'
          : percent > 0
            ? `Continue · ${percent}%`
            : 'Start learning';
        return (
          <li key={entry.id} style={{ '--i': i }}>
            <RootLink to={`/${entry.id}/`} className={`sc sc-${look.tone ?? 'purple'}`} data-planned={planned || undefined}>
              <span className="sc-art">
                <ProgramArt name={look.art} />
              </span>
              <span className="sc-body">
                <span className="sc-top">
                  <span className="sc-platform">{look.label ?? entry.platform.label}</span>
                  {planned ? (
                    <span className="pill">{open ? 'Growing' : 'Planned'}</span>
                  ) : (
                    <span className="pill pill-accent">{entry.sections} sections</span>
                  )}
                </span>
                <span className="sc-title">{look.title ?? entry.title}</span>
                <span className="sc-summary">{look.summary ?? entry.summary}</span>
                {look.highlights?.length > 0 && (
                  <span className="sc-chips">
                    {look.highlights.map((h) => (
                      <span key={h} className="sc-chip">
                        {h}
                      </span>
                    ))}
                  </span>
                )}
                {!planned && percent > 0 && (
                  <span className="sc-bar" aria-label={`${percent}% complete`}>
                    <span style={{ width: `${percent}%` }} />
                  </span>
                )}
                <span className="sc-go">
                  {action} <ArrowRight size={16} />
                </span>
              </span>
            </RootLink>
          </li>
        );
      })}
    </ol>
  );
}
