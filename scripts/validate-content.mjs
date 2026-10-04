// Course-level checks on the compiled content: routes, links and anchors, stable activity
// IDs, objectives, practice questions, and the lab exercises that lessons publish.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import YAML from 'yaml';
import { readBundle, walk, textOf } from './read-bundle.mjs';

const initial = await readBundle();
const allLabs = new Set();
let totalRoutes = 0;
for (const program of initial.site.programs) {
  const { manifest, pages, legacy, lab, files, practice: challenges } = await readBundle('content', program.id);
  const objectives = manifest.objectives;
  const objectiveIds = new Set(objectives.map((o) => o.id));
  assert.equal(objectiveIds.size, objectives.length, 'Duplicate objective IDs');
  const routes = new Map([
    ['/', new Set()],
    ['/progress', new Set()],
  ]);
  const detailsRoute = legacy?.track?.platform?.path ?? '/platform';
  routes.set(detailsRoute, new Set());
  const links = [],
    activityIds = new Set(),
    labs = new Set();
  let questions = 0,
    tasks = 0;
  function stable(id, context) {
    assert.match(id ?? '', /^[a-z][a-z0-9-]+$/, `Missing or invalid stable ID: ${context}`);
    assert(!activityIds.has(id), `Duplicate activity ID ${id}`);
    activityIds.add(id);
  }
  const tags = (nodes, name) => (nodes ?? []).filter((n) => n.t === 'tag' && n.name === name);
  function validateFlowMap(data, route) {
    assert(data.steps.length >= 2 && data.steps.length <= 4, `${route}: flow map needs two to four steps`);
    const ids = new Set();
    for (const step of data.steps) {
      for (const field of ['id', 'title', 'text'])
        assert(typeof step[field] === 'string' && step[field].trim(), `${route}: missing diagram ${field}`);
      assert(!ids.has(step.id), `${route}: duplicate diagram step ${step.id}`);
      ids.add(step.id);
    }
  }
  /** Checks shared by lessons and the reference page: headings, links, disclosures, diagrams. */
  function visitShared(node, route, page) {
    const headings = routes.get(route);
    if (node.t === 'el' && /^h[2-4]$/.test(node.tag)) headings.add(node.attrs.id);
    if (node.t === 'el' && node.tag === 'a' && node.attrs.href.startsWith('#')) links.push([route, node.attrs.href]);
    if (node.t !== 'tag') return;
    if (typeof node.attrs?.href === 'string' && node.attrs.href.startsWith('#')) links.push([route, node.attrs.href]);
    if (node.name === 'flow-map') validateFlowMap(page.data[node.attrs.ref], route);
    if (node.name === 'reveal')
      assert(textOf(node.c).trim() || (node.c ?? []).some((c) => c.t === 'tag'), `${route}: empty disclosure ${node.attrs?.title}`);
  }

  for (const chapter of manifest.chapters) {
    assert.equal(chapter.objectives.length, chapter.objectiveIds.length, `${chapter.id} objective count`);
    for (const id of chapter.objectiveIds) assert(objectiveIds.has(id), `Unknown objective ${id}`);
    routes.set(`/${chapter.id}`, new Set());
    for (const section of chapter.sections) {
      const route = `/${chapter.id}/${section.slug}`;
      assert(['lesson', 'quiz', 'lab', 'summary'].includes(section.kind), `${route}: invalid kind`);
      assert(Number.isInteger(section.minutes) && section.minutes > 0 && section.minutes <= 180, `${route}: invalid duration`);
      if (section.kind === 'lab' && chapter.id !== 'ch01') {
        assert.match(section.title, /^(Exercise|Assessment): [A-Z]/, `${route}: use Exercise: or Assessment: with sentence case`);
      }
      assert(!routes.has(route), `Duplicate route ${route}`);
      const headings = new Set();
      routes.set(route, headings);
      const page = pages[`${chapter.id}/${section.slug}`];
      const localIds = new Set();
      walk(page.tree, (node) => {
        visitShared(node, route, page);
        if (node.t !== 'tag') return;
        const a = node.attrs ?? {};
        if (['quiz', 'lab'].includes(node.name)) {
          assert(a.id, `${route}: ${node.name} needs an ID`);
          assert(!localIds.has(`${node.name}:${a.id}`), `${route}: duplicate ${node.name} ID ${a.id}`);
          localIds.add(`${node.name}:${a.id}`);
          assert(Array.isArray(a.objectives) && a.objectives.length, `${route}: ${node.name} needs objective references`);
          for (const ref of a.objectives) assert(objectiveIds.has(ref), `${route}: unknown objective ${ref}`);
        }
        if (node.name === 'lab-challenge') {
          const list = (node.c ?? []).some((c) => c.t === 'el' && ['ul', 'ol'].includes(c.tag) && c.c.length >= 2);
          assert(textOf(node.c).trim().length >= 80 && list, `${route}: challenge needs a purpose and explicit requirements`);
          walk(node.c, (c) => assert(c.t !== 'code', `${route}: keep solution code in the walkthrough, outside the lab challenge`));
        }
        if (node.name === 'task') {
          stable(a.id, route);
          headings.add(a.id);
          tasks++;
        }
        if (node.name === 'quiz') {
          for (const q of page.data[a.ref].questions) {
            stable(q.id, route);
            headings.add(q.id);
            questions++;
            assert(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length, `${q.id}: answer out of range`);
          }
        }
        if (node.name === 'practice') for (const q of page.data[a.ref].questions) headings.add(`challenge-${q.id}`);
        if (node.name === 'lab' && a.exercise) {
          const expected = a.guided ? 0 : 1;
          assert.equal(tags(node.c, 'lab-challenge').length, expected, `${route}: graded lab needs one authored challenge brief (a guided exercise has none)`);
          assert.equal(tags(node.c, 'lab-notes').length, expected, `${route}: graded lab needs authored prerequisites and verification (a guided exercise has none)`);
          labs.add(a.exercise);
          assert(lab.exercises[a.exercise], `${a.exercise}: no exercise definition`);
        }
      });
    }
  }
  // The reference page shares headings, links and disclosures, without reading progress.
  if (pages.details) walk(pages.details.tree, (node) => visitShared(node, detailsRoute, pages.details));
  for (const [source, link] of links) {
    const [route, fragment] = link.startsWith('#/') ? link.slice(1).split('#') : [source, link.slice(1)];
    assert(routes.has(route), `${source}: broken link ${link}`);
    if (fragment) assert(routes.get(route).has(decodeURIComponent(fragment)), `${source}: missing heading in ${link}`);
  }
  for (const objective of objectives) {
    for (const route of [...objective.lessons, ...objective.labs])
      assert(routes.has('/' + route), `${objective.id}: missing page ${route}`);
    for (const id of objective.challenges)
      assert(
        challenges.some((c) => c.id === id && c.objective === objective.id),
        `${objective.id}: mismatched challenge ${id}`,
      );
  }
  for (const challenge of challenges) {
    for (const field of ['id', 'objective', 'title', 'prompt', 'explain'])
      assert(typeof challenge[field] === 'string' && challenge[field].trim(), `Missing challenge ${field}`);
    // Practice questions share the quiz format: one click, instant feedback, no typed answers.
    assert(
      Array.isArray(challenge.options) &&
        challenge.options.length >= 3 &&
        challenge.options.every((o) => typeof o === 'string' && o.trim()),
      `${challenge.id}: needs at least three options`,
    );
    assert(
      challenge.options.filter((o) => o === challenge.expected).length === 1,
      `${challenge.id}: expected must match exactly one option`,
    );
    assert(objectiveIds.has(challenge.objective), `Unknown objective ${challenge.objective}`);
    stable(challenge.id, 'challenge');
  }
  // Exercise definitions are checked by the compiler (files, trees, check shapes, the lesson that teaches each).
  // Here: every lab tag names an exercise, every exercise is taught on a page that exists, and the published list agrees.
  const names = [...labs].sort();
  for (const name of names) {
    assert(!allLabs.has(name), `${name}: exercise is taught in more than one program`);
    allLabs.add(name);
  }

  for (const name of names) assert(routes.has(lab.exercises[name].lesson.slice(1)), `${name}: invalid lesson`);
  const manifests = names;
  fs.mkdirSync('node_modules/.cache/kernel-path', { recursive: true });
  // Preserve the legacy route artifact used by the existing browser suites.
  if (manifest.program.id === initial.manifest.program.id)
    fs.writeFileSync('node_modules/.cache/kernel-path/routes.json', JSON.stringify([...routes.keys()]));
  totalRoutes += routes.size;
  console.log(
    `${program.id}: validated ${routes.size} routes, ${questions} questions, ${tasks} tasks, ${challenges.length} challenges, ${objectives.length} objectives and ${manifests.length} starter manifests.`,
  );
}
const names = Object.keys(initial.lab.exercises).sort();
assert.deepEqual([...allLabs].sort(), names, 'Lesson lab tags and exercise definitions differ across programs');
const listed = initial.files
  .get('lab/INDEX')
  .split('\n')
  .filter((line) => line.trim() && !line.startsWith('#'))
  .map((line) => line.trim().split(/\s+/)[0]);
assert.deepEqual(listed.sort(), names, 'INDEX and exercises differ');
// Lab chapters that print a setup script inline must print exactly the file the site publishes.
for (const [page, title, file] of [
  [
    'content/programs/rhel9-ansible/chapters/ch01-lab-setup/07-snapshots-and-rht-vmctl.md',
    '/usr/local/bin/rht-vmctl',
    'packages/lab-tools/setup/rht-vmctl',
  ],
  [
    'content/programs/rhel9-ansible/chapters/ch01-lab-setup/09-troubleshooting.md',
    'Ubuntu host: build-rhce-lab.sh',
    'packages/lab-tools/setup/build-rhce-lab.sh',
  ],
  [
    'content/programs/rhel9-sysadmin/chapters/ch01-practice-lab/09-troubleshooting.md',
    'Ubuntu host: build-sysadmin-lab.sh',
    'packages/lab-tools/setup/build-sysadmin-lab.sh',
  ],
]) {
  const text = fs.readFileSync(page, 'utf8');
  const opening = '```bash {% title="' + title + '" %}\n';
  const at = text.indexOf(opening);
  assert(at >= 0, `${page}: no inline copy of ${title}`);
  const body = text.slice(at + opening.length, text.indexOf('```', at + opening.length));
  assert.equal(body, fs.readFileSync(file, 'utf8'), `${page}: the inline ${title} differs from ${file}`);
}
console.log(`Validated ${initial.site.programs.length} programs and ${totalRoutes} routes.`);
