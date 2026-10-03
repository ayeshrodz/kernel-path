import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { catalog as tagCatalog } from '@kernel-path/schema';
import { readBundle, walk } from './read-bundle.mjs';

function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? files(file) : [file];
  });
}
const contracts = new Map();
for (const file of files('packages/engine/src').filter((file) => file.endsWith('.jsx'))) {
  const source = fs.readFileSync(file, 'utf8');
  const name = source.match(/defineWidget\('([^']+)'/)?.[1];
  if (!name) continue;
  const required = [...source.matchAll(/copy\.(data|text)\.(\w+)/g)].map((match) => [match[1], match[2]]);
  const dependencies = [...source.matchAll(/import (\w+) from ['"](?:\.\.\/|\.\/)[^'"]+['"]/g)].map((match) => match[1]);
  contracts.set(name, { required, dependencies });
}
function validate(catalog, file) {
  assert(catalog && typeof catalog === 'object' && !Array.isArray(catalog), `${file}: expected a widget content object`);
  for (const [name, copy] of Object.entries(catalog)) {
    const contract = contracts.get(name);
    // Shared UI data can also serve components without a factory.
    if (!contract) {
      assert(['Diagram', 'Outline', 'CodeBlock', 'ProgressMenu'].includes(name), `${file}: unknown authored component ${name}`);
      continue;
    }
    for (const [group, key] of contract.required) {
      assert(copy[group] && Object.hasOwn(copy[group], key), `${file}: ${name} missing ${group}.${key}`);
      if (group === 'text') assert(typeof copy[group][key] === 'string' && copy[group][key].trim(), `${file}: ${name}.${key} needs text`);
    }
    for (const child of contract.dependencies.filter((name) => contracts.has(name))) assert(catalog[child], `${file}: ${name} needs ${child} content`);
  }
}
// A kit's tag is its component name in kebab case (LoopUnroller is loop-unroller).
const kitNames = new Map();
for (const [tag, c] of Object.entries(tagCatalog.components))
  if (c.kit) kitNames.set(tag, tag.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(''));
const kitName = (tag) => kitNames.get(tag);
const { site } = await readBundle();
let count = 0;
let sharedCount = 0;
for (const program of site.programs) {
  const { pages, interface: shared } = await readBundle('content', program.id);
  validate(shared, `${program.id} interface copy`);
  sharedCount = Math.max(sharedCount, Object.keys(shared).length);
  for (const [key, page] of Object.entries(pages)) {
    // Each kit's copy lives in the page data under its ref, plus copy for kits it renders inside itself.
    const catalog = {};
    walk(page.tree, (node) => {
      if (node.t !== 'tag' || !kitName(node.name)) return;
      const { text, data, dependencies } = page.data[node.attrs.ref];
      if (text || data) catalog[kitName(node.name)] = { ...(text ? { text } : {}), ...(data ? { data } : {}) };
      Object.assign(catalog, dependencies);
    });
    validate(catalog, `${program.id} ${key}`);
    walk(page.tree, (node) => {
      if (node.t === 'tag' && kitName(node.name) && contracts.has(kitName(node.name)))
        assert(catalog[kitName(node.name)] || shared[kitName(node.name)], `${program.id} ${key}: missing ${kitName(node.name)} content`);
    });
    count += Object.keys(catalog).length;
  }
}
console.log(`Validated ${count} page-owned widget catalogs and ${sharedCount} shared catalogs.`);
