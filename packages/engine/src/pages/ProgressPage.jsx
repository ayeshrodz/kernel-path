import { useEffect, useRef, useState } from 'react';
import { Link } from '@/lib/router';
import { challenges, course, chapters, objectives, pages, program } from '@/lib/course';
import { setHead } from '@/lib/head';
import { useProgressData, useStored } from '@/lib/storage';
import { validateLabReport } from '@/lib/labReports';
import { defineWidget, formatCopy } from '@/components/interactive/TeachingContent';

export default defineWidget('ProgressPage', (copy) => {
  const EMPTY = [];
  const practiceLinks = copy.data?.integratedPractice ?? [
    { path: '/ch11/assessment-release', label: copy.text.link, detail: copy.text.small9 },
    { path: '/ch11/assessment-operations', label: copy.text.link2, detail: copy.text.small10 },
  ];
  const confidenceHref = copy.data?.confidenceHref ?? '/ch11/how-to-review#where-do-you-stand';

  function ProgressPage() {
    const { data, storageAvailable } = useProgressData();
    const [reports, setReports] = useStored('labReports', EMPTY);
    const [message, setMessage] = useState('');
    const input = useRef(null);
    const done = data.completed ?? [];
    const next = pages.find((p) => !done.includes(p.key) && !p.chapter.setup && p.section.kind === 'lesson');
    const missed = pages.flatMap((p) =>
      (p.section.activities?.quizzes ?? []).flatMap((question) => {
        const item = data[`quiz:${p.key}:${question.quizId}`]?.items?.[question.id];
        const last = item?.attempts.at(-1);
        return last && (last.correct !== true || last.revision !== question.revision)
          ? [
              {
                ...question,
                path: `${p.path}#${question.id}`,
                reason: last.revision !== question.revision ? copy.text.label : copy.text.label2,
              },
            ]
          : [];
      }),
    );
    const unfinished = challenges.filter((c) => data[`challenge:${c.id}`]?.at(-1)?.passed !== true);
    const retry = unfinished.filter((c) => data[`challenge:${c.id}`]?.length);
    const weak = objectives.filter((o) => [0, 1].includes(data.readiness?.[o.id]));
    const label = (o) => {
      const chapter = chapters.find((c) => c.id === o.chapter);
      return chapter.objectives[chapter.objectiveIds.indexOf(o.id)] ?? o.id;
    };
    const upload = async (event) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;
      try {
        if (file.size > 500_000) throw new Error(copy.text.label3);
        const report = validateLabReport(JSON.parse(await file.text()));
        setReports((old) => [
          ...old
            .filter(
              (r) => !(r.exerciseId === report.exerciseId && r.checkpointId === report.checkpointId && r.checkedAt === report.checkedAt),
            )
            .slice(-99),
          report,
        ]);
        setMessage(formatCopy(copy.text.template, [report.exerciseId, report.checkpointId]));
      } catch (error) {
        setMessage(error instanceof SyntaxError ? copy.text.label4 : error.message);
      }
    };
    useEffect(() => {
      setHead({ title: formatCopy(copy.text.template2, [course.title]), route: `/${program.id}/progress`, index: false });
    }, []);
    return (
      <article className="learning-dashboard">
        <header className="page-header">
          <p className="page-eyebrow">{copy.text.pageEyebrow}</p>
          <h1 className="page-title">{copy.text.pageTitle}</h1>
          <p className="dashboard-intro">{copy.text.dashboardIntro}</p>
        </header>
        {!storageAvailable && (
          <p role="status" className="dashboard-warning">
            {copy.text.dashboardWarning}
          </p>
        )}
        <dl className="dashboard-stats">
          <div>
            <dt>{copy.text.dt}</dt>
            <dd>
              {done.length}
              <small>
                {copy.text.small}
                {pages.length}
                {copy.text.small2}
              </small>
            </dd>
          </div>
          <div>
            <dt>{copy.text.dt2}</dt>
            <dd>
              {challenges.length - unfinished.length}
              <small>
                {copy.text.small3}
                {challenges.length}
                {copy.text.small4}
              </small>
            </dd>
          </div>
          <div>
            <dt>{copy.text.dt3}</dt>
            <dd>
              {reports.length}
              <small>{copy.text.small5}</small>
            </dd>
          </div>
        </dl>
        <section className="dashboard-card dashboard-next" aria-labelledby="dashboard-next-title">
          <p className="page-eyebrow">{copy.text.pageEyebrow2}</p>
          <h2 id="dashboard-next-title">{next ? next.section.title : copy.text.label5}</h2>
          <p>{next ? formatCopy(copy.text.template3, [next.number, next.section.minutes]) : copy.text.label6}</p>
          {next && (
            <Link className="btn" to={next.path}>
              {copy.text.btn}
            </Link>
          )}
        </section>
        <div className="dashboard-grid">
          <section className="dashboard-card" aria-labelledby="dashboard-review-title">
            <h2 id="dashboard-review-title">{copy.text.h2}</h2>
            {missed.length + retry.length + weak.length === 0 ? (
              <p>{copy.text.p}</p>
            ) : (
              <ul className="dashboard-list">
                {missed.map((q) => (
                  <li key={q.id}>
                    <Link to={q.path}>{q.prompt}</Link>
                    <small>{q.reason}</small>
                  </li>
                ))}
                {retry.map((c) => (
                  <li key={c.id}>
                    <Link to={`/${c.chapter}/quiz#challenge-${c.id}`}>{c.title}</Link>
                    <small>{copy.text.small6}</small>
                  </li>
                ))}
                {weak.map((o) => (
                  <li key={o.id}>
                    <Link to={`/${o.lessons[0]}`}>{label(o)}</Link>
                    <small>{copy.text.small7}</small>
                  </li>
                ))}
              </ul>
            )}
            {unfinished.length > 0 && (
              <details>
                <summary>
                  {copy.text.summary}
                  {unfinished.length}
                  {copy.text.summary2}
                </summary>
                <ul className="dashboard-list">
                  {unfinished.map((c) => (
                    <li key={c.id}>
                      <Link to={`/${c.chapter}/quiz#challenge-${c.id}`}>{c.title}</Link>
                      <small>
                        {copy.text.small8}
                        {Number(c.chapter.slice(2))}
                      </small>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </section>
          <section className="dashboard-card" aria-labelledby="dashboard-assessment-title">
            <h2 id="dashboard-assessment-title">{copy.text.h22}</h2>
            <p>{copy.text.p2}</p>
            <ul className="dashboard-list">
              {practiceLinks
                .filter((link) => pages.some((page) => page.path === link.path))
                .map((link) => (
                  <li key={link.path}>
                    <Link to={link.path}>{link.label}</Link>
                    <small>{link.detail}</small>
                  </li>
                ))}
            </ul>
            <p className="dashboard-note">{copy.text.dashboardNote}</p>
          </section>
        </div>
        <section className="dashboard-card" aria-labelledby="dashboard-evidence-title">
          <h2 id="dashboard-evidence-title">{copy.text.h23}</h2>
          <p>
            {copy.text.p3}
            <code>{copy.text.code}</code>
            {copy.text.p4}
          </p>
          <div className="dashboard-actions">
            <button className="btn" onClick={() => input.current?.click()}>
              {copy.text.btn2}
            </button>
            <span>{copy.text.span}</span>
          </div>
          <input ref={input} type="file" accept="application/json,.json" hidden onChange={upload} />
          <div role="status" className="dashboard-status">
            {message}
          </div>
          {reports.length === 0 ? (
            <p className="dashboard-note">{copy.text.dashboardNote2}</p>
          ) : (
            <ul className="dashboard-list">
              {reports
                .slice()
                .reverse()
                .map((r, i) => (
                  <li key={`${r.exerciseId}:${r.checkpointId}:${r.checkedAt}:${i}`}>
                    <Link to={r.checks[0].lesson.slice(1)}>
                      {r.exerciseId}
                      {copy.text.link3}
                      {r.checkpointId}
                    </Link>
                    <small>
                      {r.checks.filter((c) => c.status === 'pass').length}
                      {copy.text.small11}
                      {r.checks.length}
                      {copy.text.small12} {new Date(r.checkedAt).toLocaleDateString()}
                    </small>
                    <details>
                      <summary>{copy.text.summary3}</summary>
                      <ul>
                        {r.checks.map((c) => (
                          <li key={c.id}>
                            {c.status.toUpperCase()}
                            {copy.text.li}
                            {c.message}
                          </li>
                        ))}
                      </ul>
                    </details>
                  </li>
                ))}
            </ul>
          )}
        </section>
        <section className="dashboard-card" aria-labelledby="dashboard-skills-title">
          <h2 id="dashboard-skills-title">{copy.text.h24}</h2>
          <p>
            {copy.text.p5} <Link to={confidenceHref}>{copy.text.link4}</Link>
            {copy.text.p6}
          </p>
          <details>
            <summary>
              {copy.text.summary4}
              {objectives.length}
              {copy.text.summary5}
            </summary>
            <ul className="dashboard-list">
              {objectives.map((o) => (
                <li key={o.id}>
                  <strong>{label(o)}</strong>
                  <div className="dashboard-skill-links">
                    {o.lessons.map((path, i) => (
                      <Link key={path} to={`/${path}`}>
                        {copy.text.link5}
                        {i + 1}
                      </Link>
                    ))}
                    {o.labs.map((path, i) => (
                      <Link key={path} to={`/${path}`}>
                        {copy.text.link6}
                        {i + 1}
                      </Link>
                    ))}
                    {o.challenges.map((id) => (
                      <Link key={id} to={`/${o.chapter}/quiz#challenge-${id}`}>
                        {copy.text.link7}
                        {challenges.find((c) => c.id === id)?.title}
                      </Link>
                    ))}
                  </div>
                  <small>
                    {copy.text.small13}
                    {[copy.text.label7, 'shaky', 'confident'][data.readiness?.[o.id]] ?? 'unrated'}
                  </small>
                </li>
              ))}
            </ul>
          </details>
        </section>
      </article>
    );
  }
  return ProgressPage;
});
