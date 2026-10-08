// Titles, descriptions and addresses for search engines. Shared by the running app (which keeps the
// document's head in step with the page) and the build (scripts/prerender.mjs, which writes them into
// each page's HTML), so a crawler sees the same values with or without JavaScript.
// Pure functions only: no imports, no browser globals, no React.

const SEPARATOR = ' | ';

/** The flat text of a compiled page tree (or of part of one). */
export function treeText(nodes) {
  if (!Array.isArray(nodes)) return '';
  return nodes.map((n) => (n?.t === 'text' ? n.v : n?.c ? treeText(n.c) : '')).join('');
}

/** Shorten to a search-result length at a word boundary. */
export function clip(text, length = 158) {
  const flat = String(text ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  return flat.length <= length ? flat : `${flat.slice(0, length - 1).replace(/\s+\S*$/, '')}…`;
}

/** The lead paragraph of a page: the {% lead %} tag, else the first paragraph. */
export function leadText(tree) {
  if (!Array.isArray(tree)) return '';
  const lead = tree.find((n) => n?.t === 'tag' && n.name === 'lead');
  if (lead) return treeText(lead.c);
  const paragraph = tree.find((n) => n?.t === 'el' && n.tag === 'p');
  return paragraph ? treeText(paragraph.c) : '';
}

/** "RHCSA (EX200)" for a program that names its certification, else the program title. */
export function examLabel(program) {
  const exam = program?.certifications?.[0];
  return exam ? `${exam.name.match(/\(([A-Z]+)\)/)?.[1] ?? exam.name} ${exam.code}` : null;
}

export function homeMeta(site, homePage) {
  return {
    title: homePage?.seoTitle ?? `${site.site.name}${SEPARATOR}${site.site.tagline}`,
    description: clip(homePage?.description ?? site.site.description),
  };
}

export function programMeta(program, siteName) {
  return {
    title: program.seoTitle ?? `${program.title}${SEPARATOR}${siteName}`,
    description: clip(program.seoDescription ?? program.summary),
  };
}

export function chapterMeta(chapter, program) {
  const exam = examLabel(program);
  return {
    title: chapter.seoTitle ?? `${chapter.title}${exam ? ` (${exam})` : ''}${SEPARATOR}Chapter ${chapter.number}`,
    description: clip(chapter.seoDescription ?? chapter.goal ?? program.summary),
  };
}

/** A section's title and description; `page` (the compiled page) adds its lead text when it is loaded. */
export function sectionMeta(section, chapter, program, page) {
  return {
    title: section.seoTitle ?? page?.seoTitle ?? `${section.title}${SEPARATOR}${chapter.title}`,
    description: clip(section.description ?? page?.description ?? (leadText(page?.tree) || chapter.goal || program.summary)),
  };
}

/** The public address of a route: always with a trailing slash, the form the static host serves. */
export function canonicalUrl(origin, base, route) {
  const path = String(route ?? '/')
    .split(/[?#]/)[0]
    .replace(/^\/+|\/+$/g, '');
  const prefix = String(base ?? '/').replace(/\/?$/, '/');
  return `${String(origin).replace(/\/$/, '')}${prefix}${path}${path ? '/' : ''}`;
}
