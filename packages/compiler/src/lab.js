// Compiles the lab exercises of a program into the published lab/ tree:
//   lab/graders.json            the exercise catalog the lab tools read (typed setup actions and checks)
//   lab/INDEX                   the list `lab list` prints
//   lab/<name>/MANIFEST         the starter file list (read by the lab command and the exercise page)
//   lab/<name>/<file>.lab       starter files, and lab/<name>/_trees/<tree>/<file>.lab for setup actions
// Starter and tree files are published with a .lab suffix so a browser can never render them
// as a page, and a name part that starts with a dot gets a "_" in front, because static hosts
// (GitHub Pages among them) leave dotfiles out. The lab tools save files under their real names.
//
// An exercise with setup actions also lists "@lab-update-required" in its MANIFEST. Version 5 of the
// lab command ignores that line; version 4 runs it as a hook, and the published file only tells the
// learner to run `lab update`, so an old lab command can never prepare an exercise half-way.
import fs from 'node:fs';
import path from 'node:path';
import { parseYaml } from './yaml.js';

const MAX_FILE_BYTES = 200_000;

/** Where a project file is published: "files/.htaccess" → "files/_.htaccess.lab". Mirrored in prepare.py. */
export const publishedPath = (relative) =>
  `${relative
    .split('/')
    .map((part) => (part.startsWith('.') ? `_${part}` : part))
    .join('/')}.lab`;

const UPDATE_REQUIRED = `# Published by Kernel Path for lab commands older than version 5.
echo "  This exercise is prepared by a newer lab command."
echo "  Run:  lab update   then start the exercise again with --force."
exit 1
`;
const CONTROL_ONLY = new Set(['git', 'lint']);
// Setup and cleanup actions that run as root on the lab servers; the rest work on the workstation.
const HOST_ACTIONS = new Set([
  'package',
  'service',
  'group',
  'user',
  'directory',
  'file',
  'remove-lines',
  'firewall',
  'selinux',
  'wipe-disk',
  'systemd',
  'linger',
  'container-reset',
  'run-as',
  'restore-skel',
  'boot',
  'timezone',
  'nm-connection',
  'hostname',
  'http-server',
  'dnf-module',
  'crontab',
  'partition-disk',
  'format',
  'append-line',
  'mount-all',
  'lvm-build',
  'unmount',
  'acl',
]);

/** Every file under `dir` as paths relative to it, sorted. */
function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)).map((f) => `${e.name}/${f}`) : [e.name]))
    .sort();
}

/**
 * Compile one program's exercises. `references` maps exercise name → { page, ... } from the
 * lab tags found in the program's pages. Returns { exercises, files } and reports problems.
 */
export function compileLabs({ labs, pages, references, seen, validator, diagnostics }) {
  const exercises = {};
  const files = new Map();
  const index = [];
  for (const { file, file_name: name, dir, def } of labs) {
    const fail = (message) => diagnostics.error(file, null, message);
    for (const problem of validator.check(validator.ids.lab, def)) fail(`exercise: ${problem}`);
    if (def.name !== name) fail(`name '${def.name}' must match the file name '${name}.yml'`);
    if (seen.has(name)) fail(`the exercise name '${name}' is already used by another program`);
    seen.add(name);
    const page = pages.get(def.page);
    if (!page) {
      fail(`page '${def.page}' does not exist`);
      continue;
    }
    const tagged = references.get(name);
    if (!tagged) fail(`no lab tag on any page uses exercise '${name}'`);
    else if (tagged !== def.page) fail(`the exercise is taught on ${tagged} but its definition says ${def.page}`);

    const publish = (relative, source, subject) => {
      if (relative.split('/').some((part) => part.startsWith('_.')))
        return fail(`${subject} '${relative}': a name part may not start with "_." (that form is reserved for published dotfiles)`);
      const target = path.join(dir, source, relative);
      if (!fs.existsSync(target) || !fs.statSync(target).isFile())
        return fail(`${subject} '${relative}' is missing from ${path.relative(path.dirname(path.dirname(file)), path.join(dir, source))}`);
      const bytes = fs.readFileSync(target);
      if (bytes.length > MAX_FILE_BYTES) return fail(`${subject} '${relative}' is larger than ${MAX_FILE_BYTES / 1000} KB`);
      if (bytes.includes(0)) return fail(`${subject} '${relative}' is not a text file`);
      if (!def.intentionalFaults && /\.ya?ml$/.test(relative)) {
        try {
          parseYaml(bytes.toString('utf8'));
        } catch (e) {
          fail(`${subject} '${relative}' is not valid YAML: ${e.message.split('\n')[0]}`);
        }
      }
      return bytes;
    };

    // Starter files
    for (const relative of def.starter ?? []) {
      const bytes = publish(relative, 'starter', 'starter file');
      if (bytes) files.set(`lab/${name}/${publishedPath(relative)}`, bytes);
    }
    const listing = [`# ${def.title}${def.note ? ` (${def.note})` : ''}`];
    if ((def.setup ?? []).length || (def.finish ?? []).length) {
      if ((def.setup ?? []).some((action) => !HOST_ACTIONS.has(action.action)))
        listing.push('# generated: some files are created on your workstation');
      listing.push('@lab-update-required');
      files.set(`lab/${name}/lab-update-required`, UPDATE_REQUIRED);
    }
    for (const relative of def.starter ?? []) listing.push(`${relative}=${publishedPath(relative)}`);
    files.set(`lab/${name}/MANIFEST`, `${listing.join('\n')}\n`);

    // Setup actions: file trees are listed and published so the setup program can fetch them.
    const trees = new Map();
    const tree = (relative) => {
      if (!trees.has(relative)) {
        const list = walk(path.join(dir, 'trees', relative));
        if (!list.length) fail(`tree '${relative}' is empty or missing in ${name}/trees`);
        for (const f of list) {
          const bytes = publish(`${relative}/${f}`, 'trees', 'tree file');
          if (bytes) files.set(`lab/${name}/_trees/${publishedPath(`${relative}/${f}`)}`, bytes);
        }
        trees.set(relative, list);
      }
      return trees.get(relative);
    };
    const setup = (def.setup ?? []).map((action) => {
      if (action.action === 'build-collection') return { ...action, files: tree(action.source) };
      if (action.action === 'git-seed-remote')
        return {
          ...action,
          branches: action.branches.map((b) => ({ ...b, commits: b.commits.map((c) => ({ ...c, files: tree(c.tree) })) })),
        };
      return action;
    });

    // Checkpoints
    for (const [cpId, cp] of Object.entries(def.checkpoints ?? {})) {
      const ids = new Set();
      for (const check of cp.checks ?? []) {
        if (ids.has(check.id)) fail(`checkpoint '${cpId}' has two checks named '${check.id}'`);
        ids.add(check.id);
        if (check.on !== 'control' && !check.targets?.length) fail(`check '${check.id}' needs targets: the hosts it must be run on`);
        if (check.on === 'control' && check.targets?.length) fail(`check '${check.id}' runs on the control node and cannot have targets`);
        if (def.transport === 'ssh' && check.on !== 'control' && (check.targets?.length !== 1 || check.targets[0] !== check.on))
          fail(`check '${check.id}': with the ssh transport, 'on' names one host and 'targets' lists exactly that host`);
        if (CONTROL_ONLY.has(check.kind) && check.on !== 'control') fail(`a '${check.kind}' check can only run on the control node`);
        if (!CONTROL_ONLY.has(check.kind) && !['file', 'commands'].includes(check.kind) && check.on === 'control')
          fail(`a '${check.kind}' check cannot run on the control node`);
      }
    }

    exercises[name] = {
      version: def.version ?? 1,
      lesson: `#/${def.page}`,
      ...(def.transport === 'ssh' ? { transport: 'ssh' } : {}),
      ...(setup.length ? { setup } : {}),
      ...(def.finish?.length ? { finish: def.finish } : {}),
      checkpoints: def.checkpoints,
    };
    index.push({ name, page: `${page.number}`, title: def.title, note: def.note });
  }
  return { exercises, files, index };
}

/** The INDEX text: one line per exercise with the section that teaches it. */
export function indexText(entries) {
  const width = Math.max(...entries.map((e) => e.name.length), 8);
  const lines = ['# exercise'.padEnd(width + 3) + 'page   title'];
  for (const e of entries) lines.push(`${e.name.padEnd(width + 2)}${e.page.padEnd(6)} ${e.title}${e.note ? ` (${e.note})` : ''}`);
  return `${lines.join('\n')}\n`;
}
