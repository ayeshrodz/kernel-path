import { useEffect } from 'react';
import { Link } from '@/lib/router';
import { ArrowRight, BookOpen, Check, CircleHelp, FlaskConical, ListChecks } from 'lucide-react';
import { chapters, course, track, pages, program, site } from '@/lib/course';
import { setHead } from '@/lib/head';
import { programMeta } from '@/lib/seo';
import { chapterProgress, useProgress } from '@/hooks/useProgress';
import { useStored } from '@/lib/storage';
import { Arrow, Diagram, Group, Node } from '@/diagrams/kit';
import { defineWidget, formatCopy } from '@/components/interactive/TeachingContent';

export default defineWidget('HomePage', (copy) => {
  const features = [
    {
      icon: BookOpen,
      title: copy.text.title,
      text: copy.text.text,
      tone: 'purple',
    },
    {
      icon: FlaskConical,
      title: copy.text.title2,
      text: copy.text.text2,
      tone: 'teal',
    },
    {
      icon: CircleHelp,
      title: copy.text.title3,
      text: copy.text.text3,
      tone: 'coral',
    },
    {
      icon: ListChecks,
      title: copy.text.title4,
      text: copy.text.text4,
      tone: 'amber',
    },
  ];

  const stages = copy.data.stages;

  const labHosts = copy.data.labhosts;

  function HomePage() {
    const { done, percent } = useProgress();

    useEffect(() => {
      setHead({ ...programMeta(program, site.site.name), route: `/${program.id}` });
    }, []);

    const [lastVisited] = useStored('lastVisited', null);
    // Resume where the reader last was; otherwise the first unfinished section.
    const firstLesson = pages.find((p) => !p.chapter.setup) ?? pages[0];
    const resume = pages.find((p) => p.key === lastVisited) ?? pages.find((p) => !done.includes(p.key)) ?? firstLesson;
    const started = done.length > 0 || !!lastVisited;

    return (
      <div className="home">
        <section className="hero">
          <div className="hero-text">
            <p className="page-eyebrow">
              {copy.text.pageEyebrow}
              {track.rhel}
              {copy.text.pageEyebrow2}
              {track.exam}
              {copy.text.pageEyebrow3}
            </p>
            <h1>
              {course.tagline}
              {copy.text.h1}
            </h1>
            <p className="hero-sub">{copy.text.heroSub}</p>
            <p className="hero-focus">
              {copy.text.heroFocus}
              {track.exam}
              {copy.text.heroFocus2}
            </p>
            <div className="hero-actions">
              <Link className="btn btn-lg" to="/progress">
                {copy.text.btn}
              </Link>
              <Link className="btn btn-primary btn-lg" to={started ? resume.path : firstLesson.path}>
                {started ? formatCopy(copy.text.template2, [resume.number]) : copy.text.label} <ArrowRight size={16} />
              </Link>
              {!started && (
                <Link className="btn btn-lg" to="/ch01">
                  <FlaskConical size={16} />
                  {copy.text.btn2}
                </Link>
              )}
              {started && (
                <span className="hero-progress">
                  {percent}
                  {copy.text.heroProgress}
                </span>
              )}
            </div>
          </div>
          <div className="hero-art">
            <HeroDiagram />
          </div>
        </section>

        <section className="features">
          {features.map(({ icon: Icon, title, text, tone }) => (
            <div key={title} className={`feature t-${tone}`}>
              <span className="feature-icon">
                <Icon size={17} />
              </span>
              <p className="feature-title">{title}</p>
              <p className="feature-text">{text}</p>
            </div>
          ))}
        </section>

        <section className="home-section">
          <h2>{copy.text.h2}</h2>
          <p className="home-section-sub">{copy.text.homeSectionSub}</p>
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
                        {copy.text.pathChapters}
                        {stage.chapters.length > 1 ? 's' : ''} {stage.chapters.join('–')}
                      </span>
                      <span className="path-text">{stage.text}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="home-section">
          <h2>{copy.text.h22}</h2>
          <ol className="chapter-grid">
            {chapters.map((ch) => {
              const { count, total } = chapterProgress(ch, done);
              return (
                <li key={ch.id}>
                  <Link to={`/${ch.id}`} className={`chapter-card ${ch.comingSoon ? 'is-soon' : ''}`}>
                    <span className="chapter-card-top">
                      <span className="chapter-card-num">{String(ch.number).padStart(2, '0')}</span>
                      {ch.comingSoon ? (
                        <span className="pill">{copy.text.pill}</span>
                      ) : (
                        <span className="pill pill-accent">
                          {total}
                          {copy.text.pill2}
                        </span>
                      )}
                    </span>
                    <span className="chapter-card-title">{ch.title}</span>
                    <span className="chapter-card-goal">{ch.goal}</span>
                    {!ch.comingSoon && (
                      <span className="chapter-card-bar" aria-label={formatCopy(copy.text.template3, [count, total])}>
                        <span style={{ width: `${(count / total) * 100}%` }} />
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="home-section home-lab">
          <div>
            <h2>{copy.text.h23}</h2>
            <p>
              {copy.text.p} <code>{copy.text.code}</code>
              {copy.text.p2}
            </p>
            <Link className="btn home-lab-cta" to="/ch01">
              <FlaskConical size={15} />
              {copy.text.btn3}
              <ArrowRight size={15} />
            </Link>
          </div>
          <dl className="host-list">
            {labHosts.map(([h, d]) => (
              <div key={h}>
                <dt>
                  <code>{h}</code>
                </dt>
                <dd>{d}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    );
  }

  function HeroDiagram() {
    const hosts = [
      { x: 22, title: copy.text.title5, sub: copy.text.sub },
      { x: 132, title: copy.text.title6, sub: copy.text.sub2 },
      { x: 242, title: copy.text.title7, sub: copy.text.sub3 },
    ];
    return (
      <Diagram width={360} height={300} title={copy.text.title8} expandable={false}>
        <Group x={6} y={6} w={348} h={288} tone="gray" label={copy.text.label2} />
        <Node x={22} y={42} w={150} h={56} tone="purple" title={copy.text.title9} sub={copy.text.sub4} />
        <Node x={188} y={42} w={150} h={56} tone="amber" title={copy.text.title10} sub={copy.text.sub5} />
        <Arrow
          points={[
            [97, 98],
            [97, 126],
          ]}
        />
        <Arrow
          points={[
            [263, 98],
            [263, 126],
          ]}
        />
        <Node x={22} y={128} w={316} h={56} tone="teal" title={copy.text.title11} sub={copy.text.sub6} />
        {hosts.map((h) => (
          <g key={h.title}>
            <Arrow
              points={[
                [180, 184],
                [180, 202],
                [h.x + 48, 202],
                [h.x + 48, 224],
              ]}
              label={h.x === 22 ? copy.text.label3 : undefined}
              labelAt={0.2}
              labelDx={-14}
            />
            <Node x={h.x} y={226} w={96} h={54} tone="green" title={h.title} sub={h.sub} />
          </g>
        ))}
      </Diagram>
    );
  }
  return HomePage;
});
