// Writes a real HTML file for every page of the site, so that each page has its own address on a static
// host and search engines can read it without running the app:
//   - dist/<program>/<chapter>/<slug>/index.html (and the program and chapter pages): the built index.html
//     with the page's title, description, canonical address, social-card tags, structured data (JSON-LD)
//     and the page's text in <div id="root">. The app replaces that text when it starts.
//   - dist/404.html: the app, for addresses that have no file (it shows its own "not found" page)
//   - dist/sitemap.xml and dist/robots.txt
// The site address comes from SITE_URL, or from the CNAME file of the build.
//   node scripts/prerender.mjs <dist-dir>
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { canonicalUrl, chapterMeta, examLabel, homeMeta, programMeta, sectionMeta } from '../packages/engine/src/lib/seo.js';

const dist = path.resolve(process.argv[2] ?? 'dist');
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const base = process.env.SITE_BASE ?? '/';
const cname = fs.existsSync(path.join(dist, 'CNAME')) ? fs.readFileSync(path.join(dist, 'CNAME'), 'utf8').trim() : '';
const origin = (process.env.SITE_URL ?? (cname ? `https://${cname}` : '')).replace(/\/$/, '');
if (!origin) throw new Error('Set SITE_URL (or add a CNAME file) so pages can name their canonical address.');

const read = (file) => JSON.parse(fs.readFileSync(path.join(dist, 'content', file), 'utf8'));
const site = read('site.json');
const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const siteName = site.site.name;

const escape = (text) =>
  String(text ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const clip = (text, length = 158) => {
  const flat = String(text ?? '').replace(/\s+/g, ' ').trim();
  return flat.length <= length ? flat : `${flat.slice(0, length - 1).replace(/\s+\S*$/, '')}…`;
};
/** "/rhel9-sysadmin/ch02" → the public address, always with a trailing slash (the form the static host serves). */
const address = (route) => canonicalUrl(origin, base, route);

// ---------- Page trees to HTML ----------

const TEXT_TAGS = new Set(['p', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'strong', 'em', 'code', 'blockquote', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'br', 'hr', 'del', 'kbd']);

/** Content links: "#/ch02/x" is a page of the same program, "#heading" a heading on this page. */
function link(href, programId) {
  if (typeof href !== 'string') return null;
  if (href.startsWith('#/')) return `${base}${programId ? `${programId}/` : ''}${href.slice(2)}`.replace(/\/\/+/g, '/');
  if (href.startsWith('#') || /^https:\/\//.test(href) || href.startsWith('mailto:')) return href;
  return null;
}

function text(nodes) {
  if (!Array.isArray(nodes)) return '';
  return nodes.map((n) => (n.t === 'text' ? n.v : n.c ? text(n.c) : '')).join('');
}

function render(nodes, ctx) {
  if (!Array.isArray(nodes)) return '';
  return nodes.map((node) => renderNode(node, ctx)).join('');
}

function renderNode(node, ctx) {
  if (!node || typeof node !== 'object') return '';
  if (node.t === 'text') return escape(node.v);
  if (node.t === 'code') return `<pre><code>${escape((node.lines ?? []).map((line) => line.map((token) => token.v).join('')).join('\n'))}</code></pre>`;
  if (node.t === 'el') {
    const tag = node.tag;
    if (tag === 'a') {
      const href = link(node.attrs?.href, ctx.programId);
      return href ? `<a href="${escape(href)}">${render(node.c, ctx)}</a>` : render(node.c, ctx);
    }
    if (tag === 'pre') return `<pre>${escape(text(node.c))}</pre>`;
    if (!TEXT_TAGS.has(tag)) return render(node.c, ctx);
    const id = /^h[2-4]$/.test(tag) && node.attrs?.id ? ` id="${escape(node.attrs.id)}"` : '';
    return tag === 'br' || tag === 'hr' ? `<${tag}>` : `<${tag}${id}>${render(node.c, ctx)}</${tag}>`;
  }
  if (node.t === 'tag') {
    const a = node.attrs ?? {};
    const data = a.ref ? ctx.data?.[a.ref] : undefined;
    switch (node.name) {
      case 'hero':
        return `<h1>${escape(a.title)}</h1>${render(node.c, ctx)}`;
      case 'lab':
        return `<section><h2>${escape(a.title ?? 'Exercise')}</h2>${
          Array.isArray(a.outcomes) && a.outcomes.length ? `<ul>${a.outcomes.map((o) => `<li>${escape(o)}</li>`).join('')}</ul>` : ''
        }${render(node.c, ctx)}</section>`;
      case 'task':
        return `<h3>${escape(a.title)}</h3>${render(node.c, ctx)}`;
      case 'tab':
        return `<h3>${escape(a.label)}</h3>${render(node.c, ctx)}`;
      case 'callout':
        return `<aside>${a.title ? `<p><strong>${escape(a.title)}</strong></p>` : ''}${render(node.c, ctx)}</aside>`;
      case 'quiz': {
        const questions = data?.questions ?? [];
        return questions.length ? `<ul>${questions.map((q) => `<li>${escape(q.q)}</li>`).join('')}</ul>` : '';
      }
      case 'flashcards': {
        const cards = data?.cards ?? [];
        return cards.length ? `<dl>${cards.map((c) => `<dt>${escape(c.front)}</dt><dd>${escape(c.back)}</dd>`).join('')}</dl>` : '';
      }
      case 'diagram':
        return data?.title ? `<p>${escape(data.title)}${data.caption ? `: ${escape(data.caption)}` : ''}</p>` : '';
      case 'lab-finish':
        return `<p>Check your work with <code>lab grade ${escape(a.exercise)}</code>, then put the exercise away with <code>lab finish ${escape(a.exercise)}</code>.</p>`;
      default:
        return render(node.c, ctx);
    }
  }
  return '';
}

// ---------- The HTML file of one address ----------

const breadcrumb = (items) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: item.url })),
});
const organization = { '@type': 'Organization', name: siteName, url: address('/'), logo: `${origin}${base}icon-512.png` };

function page({ route, title, description, body, graph = [], index = true, type = 'website' }) {
  const url = address(route);
  const image = `${origin}${base}og-image.png`;
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
  const head = [
    `<link rel="canonical" href="${escape(url)}" />`,
    index ? '<meta name="robots" content="index, follow, max-image-preview:large" />' : '<meta name="robots" content="noindex, follow" />',
    `<meta property="og:site_name" content="${escape(siteName)}" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:title" content="${escape(title)}" />`,
    `<meta property="og:description" content="${escape(description)}" />`,
    `<meta property="og:url" content="${escape(url)}" />`,
    `<meta property="og:image" content="${escape(image)}" />`,
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escape(title)}" />`,
    `<meta name="twitter:description" content="${escape(description)}" />`,
    `<meta name="twitter:image" content="${escape(image)}" />`,
    ...(graph.length ? [`<script type="application/ld+json">${json}</script>`] : []),
  ].join('\n    ');
  return template
    .replace(/<title>[^<]*<\/title>/, `<title>${escape(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${escape(description)}" />\n    ${head}`)
    .replace(/<div id="root">[\s\S]*?<\/div>\s*(?=<script|<\/body>)/, `<div id="root"><main class="prerendered prose">${body}</main></div>\n    `);
}

function write(route, html) {
  const file = route === '/' ? path.join(dist, 'index.html') : path.join(dist, route.replace(/^\//, ''), 'index.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

/** When a content file last changed, from Git; the build time when Git cannot tell. */
const fallbackDate = (site.generatedAt ?? new Date().toISOString()).slice(0, 10);
function lastChanged(files) {
  if (!files.length) return fallbackDate;
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', ...files], { cwd: root, encoding: 'utf8' }).trim();
    return out || fallbackDate;
  } catch {
    return fallbackDate;
  }
}
const sourceOf = (programId, key) => {
  const [chapter, slug] = key.split('/');
  const dir = path.join(root, 'content/programs', programId, 'chapters');
  const chapterDir = fs.existsSync(dir) ? fs.readdirSync(dir).find((d) => d.startsWith(`${chapter}-`)) : null;
  if (!chapterDir) return [];
  const found = fs.readdirSync(path.join(dir, chapterDir)).filter((f) => f.endsWith(`-${slug}.md`) || f.endsWith(`-${slug}.data.yml`));
  return found.map((f) => path.join(dir, chapterDir, f));
};

// ---------- Every address ----------

const sitemap = [];
const add = (route, lastmod, priority) => sitemap.push({ url: address(route), lastmod, priority });
let count = 0;

// The site home
const home = site.site.home ? read(site.site.home) : null;
const homeHead = homeMeta(site, home);
const programList = `<h2>Programs</h2><ul>${site.programs
  .map((p) => `<li><a href="${escape(`${base}${p.id}/`)}">${escape(p.title)}</a>: ${escape(p.summary)}</li>`)
  .join('')}</ul>`;
write(
  '/',
  page({
    route: '/',
    title: homeHead.title,
    description: homeHead.description,
    body: `${home ? render(home.tree, { data: home.data }) : `<h1>${escape(site.site.tagline)}</h1>`}${programList}`,
    graph: [
      { '@type': 'WebSite', name: siteName, url: address('/'), description: site.site.description, inLanguage: 'en' },
      { ...organization, sameAs: site.site.repo ? [site.site.repo] : undefined },
    ],
  }),
);
add('/', lastChanged([path.join(root, 'content/site')]), '1.0');
count++;

for (const entry of site.programs) {
  if (!entry.manifest) continue;
  const manifest = read(entry.manifest);
  const program = manifest.program;
  const programRoute = `/${program.id}`;
  const programHead = programMeta(program, siteName);
  const exams = program.certifications ?? [];
  const course = {
    '@type': 'Course',
    '@id': `${address(programRoute)}#course`,
    name: program.seoTitle ?? program.title,
    description: program.summary,
    ...(program.keywords?.length ? { keywords: program.keywords.join(', ') } : {}),
    ...(exams.length ? { about: exams.map((e) => ({ '@type': 'Thing', name: `${e.name} (${e.code})` })) } : {}),
    teaches: manifest.chapters.filter((c) => c.status !== 'planned' && !c.setup).map((c) => c.title),
    coursePrerequisites: 'None: the path starts from the first login.',
    url: address(programRoute),
    provider: organization,
    isAccessibleForFree: true,
    inLanguage: 'en',
    educationalLevel: 'Beginner to intermediate',
    hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'online', courseWorkload: `PT${Math.max(1, Math.round(manifest.chapters.reduce((s, c) => s + c.sections.reduce((m, x) => m + (x.minutes ?? 0), 0), 0) / 60))}H` },
    offers: { '@type': 'Offer', price: 0, priceCurrency: 'USD', category: 'Free' },
  };
  const programCrumb = [
    { name: siteName, url: address('/') },
    { name: program.title, url: address(programRoute) },
  ];
  const chapters = manifest.chapters.filter((c) => c.status !== 'planned');

  // Program landing
  write(
    programRoute,
    page({
      route: programRoute,
      title: programHead.title,
      description: programHead.description,
      body: `<h1>${escape(program.title)}</h1><p>${escape(program.summary)}</p>${
        exams.length ? `<p>Prepares you for ${exams.map((e) => `${escape(e.name)} (${escape(e.code)})`).join(' and ')}.</p>` : ''
      }<h2>Chapters</h2><ol>${chapters
        .map((c) => `<li><a href="${escape(`${base}${program.id}/${c.id}/`)}">${escape(c.title)}</a>${c.goal ? `: ${escape(c.goal)}` : ''}</li>`)
        .join('')}</ol>`,
      graph: [course, breadcrumb(programCrumb)],
    }),
  );
  add(programRoute, lastChanged([path.join(root, 'content/programs', program.id)]), '0.9');
  count++;

  // Pages that only make sense with the learner's own data: reachable, but not indexed.
  for (const extra of ['progress', 'platform']) {
    write(
      `${programRoute}/${extra}`,
      page({
        route: `${programRoute}/${extra}`,
        title: `${extra === 'progress' ? 'Your learning' : 'Reference'} · ${program.title}`,
        description: clip(program.summary),
        body: `<h1>${escape(program.title)}</h1>`,
        index: false,
      }),
    );
    count++;
  }

  for (const chapter of chapters) {
    const chapterRoute = `${programRoute}/${chapter.id}`;
    const chapterTitle = `Chapter ${chapter.number}: ${chapter.title}`;
    const chapterHead = chapterMeta(chapter, program);
    const chapterCrumb = [...programCrumb, { name: chapterTitle, url: address(chapterRoute) }];
    write(
      chapterRoute,
      page({
        route: chapterRoute,
        title: chapterHead.title,
        description: chapterHead.description,
        body: `<h1>${escape(chapterTitle)}</h1>${chapter.goal ? `<p>${escape(chapter.goal)}</p>` : ''}${
          chapter.objectives?.length ? `<h2>What you will learn</h2><ul>${chapter.objectives.map((o) => `<li>${escape(o)}</li>`).join('')}</ul>` : ''
        }<h2>Sections</h2><ol>${chapter.sections
          .map((s) => `<li><a href="${escape(`${base}${program.id}/${chapter.id}/${s.slug}/`)}">${escape(s.title)}</a></li>`)
          .join('')}</ol>`,
        graph: [breadcrumb(chapterCrumb)],
      }),
    );
    add(chapterRoute, lastChanged(chapter.sections.flatMap((s) => sourceOf(program.id, `${chapter.id}/${s.slug}`))), '0.7');
    count++;

    for (const section of chapter.sections) {
      const key = `${chapter.id}/${section.slug}`;
      const file = manifest.pages[key];
      if (!file) continue;
      const content = read(file);
      const route = `${programRoute}/${key}`;
      const head = sectionMeta(section, chapter, program, content);
      const { description } = head;
      const title = head.title;
      const index = chapter.sections.indexOf(section);
      const near = [chapter.sections[index - 1], chapter.sections[index + 1]].filter(Boolean);
      const modified = lastChanged(sourceOf(program.id, key));
      const kind = content.kind === 'lab' ? 'Exercise' : content.kind === 'quiz' ? 'Quiz' : content.kind === 'summary' ? 'Summary' : 'Lesson';
      write(
        route,
        page({
          route,
          title,
          description,
          type: 'article',
          body: `<p><a href="${escape(`${base}${program.id}/${chapter.id}/`)}">${escape(chapterTitle)}</a></p><h1>${escape(content.title)}</h1>${render(content.tree, {
            data: content.data,
            programId: program.id,
          })}<nav aria-label="More in this chapter"><ul>${near
            .map((s) => `<li><a href="${escape(`${base}${program.id}/${chapter.id}/${s.slug}/`)}">${escape(s.title)}</a></li>`)
            .join('')}<li><a href="${escape(`${base}${program.id}/`)}">${escape(program.title)}${examLabel(program) ? ` (${escape(examLabel(program))})` : ''}</a></li></ul></nav>`,
          graph: [
            {
              '@type': 'LearningResource',
              name: content.title,
              headline: title,
              description,
              url: address(route),
              learningResourceType: kind,
              timeRequired: content.minutes ? `PT${content.minutes}M` : undefined,
              isAccessibleForFree: true,
              inLanguage: 'en',
              isPartOf: { '@id': `${address(programRoute)}#course` },
              dateModified: modified,
              ...(program.keywords?.length ? { keywords: program.keywords.slice(0, 8).join(', ') } : {}),
              publisher: organization,
            },
            breadcrumb([...chapterCrumb, { name: content.title, url: address(route) }]),
          ],
        }),
      );
      add(route, modified, content.kind === 'lesson' ? '0.8' : '0.6');
      count++;
    }
  }
}

// Addresses without a file: GitHub Pages serves 404.html, and the app shows its own "not found" page there.
fs.writeFileSync(
  path.join(dist, '404.html'),
  page({ route: '/', title: `Page not found · ${siteName}`, description: clip(site.site.description), body: '<h1>Page not found</h1>', index: false }).replace(
    /<link rel="canonical"[^>]*>\n\s*/,
    '',
  ),
);

fs.writeFileSync(
  path.join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap
    .map((u) => `  <url><loc>${escape(u.url)}</loc><lastmod>${u.lastmod}</lastmod><priority>${u.priority}</priority></url>`)
    .join('\n')}\n</urlset>\n`,
);
fs.writeFileSync(
  path.join(dist, 'robots.txt'),
  [
    'User-agent: *',
    'Allow: /',
    // Starter files and schemas are for the lab tools, not for readers.
    `Disallow: ${base}lab/`,
    `Disallow: ${base}schema/`,
    '',
    `Sitemap: ${origin}${base}sitemap.xml`,
    '',
  ].join('\n'),
);
console.log(`prerendered ${count} pages; sitemap.xml lists ${sitemap.length} addresses (${origin}${base})`);
