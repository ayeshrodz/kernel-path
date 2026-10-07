// Compiles a content source tree into the contract's static bundle:
//   site.json                                 entry point (unhashed)
//   p/<program>/manifest.<hash>.json          navigation, activities, objectives, page index
//   p/<program>/pages/<page>.<hash>.json      render tree + page data
//   p/<program>/search.<hash>.json            search index
// Every file is validated against the bundle schemas before it is written.
import crypto from 'node:crypto';
import { MAX_BYTES } from '@kernel-path/schema/limits';
import fs from 'node:fs';
import path from 'node:path';
import { questionRevision } from '@kernel-path/schema/revision';
import { CompileError, Diagnostics } from './diagnostics.js';
import { createValidator } from './validator.js';
import { initHighlighter } from './highlight.js';
import { readPage, convertPage } from './tree.js';
import { readContent } from './source.js';
import { compileLabs, indexText } from './lab.js';
import { reportCatalog } from './report.js';
import { toolFiles } from '@kernel-path/lab';

const hash = (text) => crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);

/** Plain text of a render-tree subtree, for search. */
function textOf(nodes) {
  let out = '';
  for (const node of nodes ?? []) {
    if (node.t === 'text') out += node.v;
    else if (node.t === 'code') out += ' ' + node.lines.map((line) => line.map((token) => token.v).join('')).join('\n') + ' ';
    else {
      if (node.t === 'el' && ['p', 'li', 'h2', 'h3', 'h4', 'td', 'th', 'br'].includes(node.tag)) out += ' ';
      if (node.t === 'tag' && node.attrs?.title) out += ` ${node.attrs.title} `;
      out += textOf(node.c);
    }
  }
  return out;
}

/** Split a page into heading-sized search chunks, like the current site's search. */
function searchEntries(key, tree) {
  const entries = [];
  let current = { page: key, text: '' };
  for (const node of tree) {
    if (node.t === 'el' && (node.tag === 'h2' || node.tag === 'h3')) {
      if (current.text.trim() || current.heading) entries.push(current);
      current = { page: key, heading: textOf(node.c).trim(), anchor: node.attrs.id, text: '' };
    } else current.text += textOf([node]);
  }
  if (current.text.trim() || current.heading) entries.push(current);
  return entries.map((e) => ({ ...e, text: e.text.replace(/\s+/g, ' ').trim() }));
}

/** Quiz, task and practice indexes for the manifest, read from the compiled tree. */
function activitiesOf(tree, data) {
  const quizzes = [];
  const tasks = [];
  const practice = [];
  (function visit(nodes, labId) {
    for (const node of nodes ?? []) {
      if (node.t !== 'tag') continue;
      const a = node.attrs ?? {};
      if (node.name === 'quiz')
        for (const q of data[a.ref]?.questions ?? [])
          quizzes.push({ id: q.id, quizId: a.id ?? 'quiz', prompt: q.q, revision: questionRevision(q) });
      if (node.name === 'practice')
        for (const q of data[a.ref]?.questions ?? []) practice.push({ id: q.id, objective: q.objective, title: q.title });
      if (node.name === 'task') tasks.push({ id: a.id, labId, title: a.title });
      visit(node.c, node.name === 'lab' ? (a.id ?? 'lab') : labId);
    }
  })(tree, 'lab');
  return { quizzes, tasks, ...(practice.length ? { practice } : {}) };
}

/** Content is data: Markdoc pages, YAML and JSON. Images and other assets arrive with the asset pipeline. */
const DATA_FILE = /\.(md|ya?ml|json)$/;

/** Starter files and file trees of lab exercises are the learner's own project files, in any text format. */
const LAB_FILES = /[\\/]programs[\\/][^\\/]+[\\/]lab[\\/][^\\/]+[\\/](starter|trees)[\\/]/;

function checkFileTypes(dir, diagnostics) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    // A link could pull in a file from outside content (for example the build machine's environment)
    // and publish it, so content is plain files only.
    if (entry.isSymbolicLink()) diagnostics.error(file, null, 'symbolic links are not allowed in content');
    else if (entry.isDirectory()) checkFileTypes(file, diagnostics);
    else if (!DATA_FILE.test(entry.name) && !LAB_FILES.test(file))
      diagnostics.error(file, null, 'only Markdoc, YAML, JSON files are allowed in content');
  }
}

/**
 * Compile `contentDir`. Returns { files, diagnostics, stats } where files maps bundle
 * paths to file contents. Throws CompileError when the content has errors.
 */
export async function compile(contentDir, { now = new Date(), signingKey = null } = {}) {
  const root = path.resolve(contentDir);
  const diagnostics = new Diagnostics(path.dirname(root));
  const validator = createValidator();
  checkFileTypes(root, diagnostics);
  await initHighlighter();
  const source = readContent(root, diagnostics);
  const files = new Map();
  // Which size limit applies to a bundle file, by the folder and name it is written under.
  const limitFor = (dir, name) => (dir.endsWith('/pages') || name === 'home' ? MAX_BYTES.page : (MAX_BYTES[name] ?? MAX_BYTES.page));
  const emit = (dir, name, value, ext = 'json') => {
    const json = JSON.stringify(value);
    const file = `${dir}/${name}.${hash(json)}.${ext}`;
    if (json.length > limitFor(dir, name))
      diagnostics.error(null, null, `${file} is ${json.length} bytes, over the ${limitFor(dir, name)} byte limit for this kind of file`);
    files.set(file, json);
    return file;
  };
  const expect = (id, value, file, what) => {
    for (const problem of validator.check(id, value)) diagnostics.error(file, null, `${what}: ${problem}`);
  };

  /** Parse, convert and check one page; returns the page object ready to emit. */
  const buildPage = (key, { file, source: src, dataFile, dataSource }, frontDefaults, forced = {}) => {
    const parsed = readPage(src, dataSource, file, dataFile, diagnostics);
    const { tree, data, toc } = convertPage(parsed, { file, dataFile, diagnostics, validator });
    const front = { ...frontDefaults, ...parsed.front, ...forced };
    const page = {
      apiVersion: 1,
      key,
      title: front.title,
      kind: front.kind,
      ...(front.minutes ? { minutes: front.minutes } : {}),
      ...(front.eyebrow ? { eyebrow: front.eyebrow } : {}),
      ...(front.description ? { description: front.description } : {}),
      ...(front.seoTitle ? { seoTitle: front.seoTitle } : {}),
      toc,
      data,
      tree,
    };
    expect(validator.ids.bundle.page, page, file, 'compiled page');
    return { page, tree, data };
  };

  const programs = [];
  const labNames = new Set();
  const allExercises = {};
  const labIndex = [];
  let hasLabs = false;
  expect(validator.ids.site, source.site, source.siteFile, 'site');
  for (const { id, dir, program, chapters, objectives, details, legacy, labs } of source.programs) {
    const base = `p/${program.id}`;
    expect(validator.ids.program, program, path.join(dir, 'program.yml'), 'program');
    if (program.id !== id) diagnostics.error(path.join(dir, 'program.yml'), null, `id '${program.id}' must match the folder name '${id}'`);
    expect(validator.ids.objectives, objectives, path.join(dir, 'objectives.yml'), 'objectives');
    const pages = {};
    const search = [];

    const compilePage = (key, sourcePage, frontDefaults) => {
      const { page, tree, data } = buildPage(key, sourcePage, frontDefaults);
      pages[key] = emit(`${base}/pages`, key.replace('/', '-'), page);
      search.push(...searchEntries(key, tree));
      return { tree, data };
    };

    let programExercises = {};
    const sectionPages = new Map();
    const labReferences = new Map();
    const manifestChapters = chapters.map((chapter) => {
      expect(validator.ids.chapter, chapter.meta, path.join(chapter.dir, '_chapter.yml'), 'chapter');
      const sections = chapter.sections.map((section) => {
        expect(validator.ids.section, section.front, section.file, 'frontmatter');
        const key = `${chapter.id}/${section.slug}`;
        const { tree, data } = compilePage(key, section, { kind: section.kind, minutes: section.minutes });
        sectionPages.set(key, { number: `${chapter.number}.${chapter.sections.indexOf(section) + 1}` });
        (function visit(nodes) {
          for (const node of nodes ?? []) {
            if (node.t === 'tag' && node.name === 'lab' && node.attrs?.exercise) labReferences.set(node.attrs.exercise, key);
            visit(node.c);
          }
        })(tree);
        return {
          slug: section.slug,
          title: section.front.title,
          kind: section.kind,
          minutes: section.minutes,
          ...(section.front.seoTitle ? { seoTitle: section.front.seoTitle } : {}),
          ...(section.front.description ? { description: section.front.description } : {}),
          activities: activitiesOf(tree, data),
        };
      });
      const { meta } = chapter;
      return {
        id: chapter.id,
        number: chapter.number,
        title: meta.title,
        ...(meta.goal ? { goal: meta.goal } : {}),
        ...(meta.seoTitle ? { seoTitle: meta.seoTitle } : {}),
        ...(meta.seoDescription ? { seoDescription: meta.seoDescription } : {}),
        objectives: meta.objectives ?? [],
        objectiveIds: meta.objectiveIds ?? [],
        ...(meta.topics ? { topics: meta.topics } : {}),
        ...(meta.setup ? { setup: true } : {}),
        status: meta.status === 'planned' || sections.length === 0 ? 'planned' : 'active',
        sections,
      };
    });

    if (details) compilePage('details', details, { kind: 'reference' });

    if (labs.length) {
      const compiled = compileLabs({ labs, pages: sectionPages, references: labReferences, seen: labNames, validator, diagnostics });
      for (const [file, content] of compiled.files) files.set(file, content);
      Object.assign(allExercises, compiled.exercises);
      programExercises = compiled.exercises;
      labIndex.push(...compiled.index);
      hasLabs = true;
    }
    // Exercises a lesson names must exist.
    for (const name of labReferences.keys())
      if (!labs.some((l) => l.file_name === name))
        diagnostics.error(null, null, `a lab tag uses the exercise '${name}', which has no definition in ${id}/lab`);

    const searchFile = emit(base, 'search', { apiVersion: 1, entries: search });
    expect(validator.ids.bundle.search, JSON.parse(files.get(searchFile)), null, 'search index');
    let legacyFile;
    if (legacy) {
      expect(validator.ids.bundle.legacy, legacy, path.join(dir, 'legacy.yml'), 'interface bundle');
      legacyFile = emit(base, 'legacy', legacy);
    }
    const manifest = {
      apiVersion: 1,
      program,
      chapters: manifestChapters,
      objectives,
      pages,
      search: searchFile,
      labReports: reportCatalog(programExercises),
      ...(legacyFile ? { legacy: legacyFile } : {}),
    };
    expect(validator.ids.bundle.manifest, manifest, null, 'manifest');
    const sectionCount = manifestChapters.reduce((n, c) => n + c.sections.length, 0);
    programs.push({
      id: program.id,
      title: program.title,
      label: program.label,
      ...(program.tagline ? { tagline: program.tagline } : {}),
      summary: program.summary,
      platform: program.platform,
      status: program.status,
      ...(program.theme ? { theme: program.theme } : {}),
      ...(program.showcase ? { showcase: program.showcase } : {}),
      sections: sectionCount,
      manifest: emit(base, 'manifest', manifest),
    });
  }

  const { programs: order, apiVersion, ...siteMeta } = source.site;
  let home;
  if (source.home) {
    const front = readPage(source.home.source, null, source.home.file, null, diagnostics).front;
    expect(validator.ids.section, front, source.home.file, 'frontmatter');
    home = emit(
      'site',
      'home',
      buildPage('site-home', source.home, { kind: front.kind }, front.layout === 'landing' ? { kind: 'landing' } : {}).page,
    );
  }
  let shared;
  if (source.interface) {
    expect(validator.ids.bundle.interface, source.interface, path.join(root, 'interface.json'), 'interface copy');
    shared = emit('site', 'interface', source.interface);
  }
  if (hasLabs) {
    files.set(
      'lab/graders.json',
      JSON.stringify(
        { version: 2, exercises: Object.fromEntries(Object.entries(allExercises).sort(([a], [b]) => a.localeCompare(b))) },
        null,
        2,
      ) + '\n',
    );
    files.set('lab/INDEX', indexText(labIndex.sort((a, b) => a.name.localeCompare(b.name))));
    for (const [name, content] of toolFiles()) files.set(`lab/${name}`, content);
  }
  const site = {
    apiVersion,
    generatedAt: now.toISOString(),
    site: { ...siteMeta, ...(home ? { home } : {}) },
    ...(shared ? { interface: shared } : {}),
    ...(hasLabs ? { lab: 'lab/' } : {}),
    programs,
    ...(source.programs.find((entry) => entry.legacyRoutes)
      ? { legacyProgram: source.programs.find((entry) => entry.legacyRoutes).id }
      : {}),
  };
  // The signature covers the site index as written without the signature field. Every other file
  // is named for a hash of its content, so signing the index vouches for the whole bundle.
  if (signingKey) {
    const signature = crypto
      .sign('sha256', Buffer.from(JSON.stringify(site)), { key: signingKey, dsaEncoding: 'ieee-p1363' })
      .toString('base64url');
    site.signature = emit('site', 'signature', { apiVersion: 1, alg: 'ES256', signature }, 'sig');
  }
  expect(validator.ids.bundle.site, site, null, 'site index');
  const siteJson = JSON.stringify(site);
  if (siteJson.length > MAX_BYTES.site)
    diagnostics.error(null, null, `site.json is ${siteJson.length} bytes, over the ${MAX_BYTES.site} byte limit`);
  files.set('site.json', siteJson);

  if (!diagnostics.ok) throw new CompileError(diagnostics);
  const stats = { programs: programs.length, pages: [...files.keys()].filter((f) => f.includes('/pages/')).length, files: files.size };
  return { files, diagnostics, stats };
}

/** Write a compiled bundle to `outDir`, replacing its previous contents. */
export function writeBundle(files, outDir) {
  fs.rmSync(outDir, { recursive: true, force: true });
  for (const [file, content] of files) {
    const target = path.join(outDir, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  }
}
