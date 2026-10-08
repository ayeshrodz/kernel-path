import { ArrowDown, ArrowRight } from 'lucide-react';
import { RootLink } from '@/lib/router';
import { site } from '@/lib/course';
import LabScene from './LabScene';

/** The last two words of the heading get the accent underline. */
function Heading({ text }) {
  const words = text.split(' ');
  if (words.length < 4) return text;
  return (
    <>
      {words.slice(0, -2).join(' ')} <span className="hl">{words.slice(-2).join(' ')}</span>
    </>
  );
}

/** The opening block of the site home page: heading, introduction, two buttons and the lab illustration. */
export default function Hero({ eyebrow, title, primary, primaryLabel, secondaryLabel, children }) {
  const target = site.programs.find((p) => p.id === primary);
  return (
    <section className="lh">
      <div className="lh-text">
        {eyebrow && <p className="lh-eyebrow">{eyebrow}</p>}
        <h1 className="lh-title">
          <Heading text={title} />
        </h1>
        <div className="lh-lead">{children}</div>
        <div className="lh-actions">
          {target && (
            <RootLink className="btn btn-primary btn-lg lh-cta" to={`/${target.id}/`}>
              {primaryLabel ?? 'Start learning'} <ArrowRight size={16} />
            </RootLink>
          )}
          {secondaryLabel && (
            <button
              type="button"
              className="btn btn-lg lh-secondary"
              onClick={() => document.querySelector('.showcase')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              {secondaryLabel} <ArrowDown size={16} />
            </button>
          )}
        </div>
      </div>
      <div className="lh-art">
        <LabScene />
      </div>
    </section>
  );
}
