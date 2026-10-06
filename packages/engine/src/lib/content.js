// Loads the compiled content bundle. Content is untrusted input: every file is fetched
// from the configured content base only, and validated against the contract before use.
import {
  validateDiagramData,
  validateFeatureGridData,
  validateTerminalDemoData,
  validateFlashcardsData,
  validateFlowMapData,
  validateInterface,
  validateLegacy,
  validateManifest,
  validatePage,
  validatePracticeData,
  validateQuizData,
  validateSearch,
  validateSite,
  TAGS,
} from '@kernel-path/schema/validators';

import { MAX_BYTES } from '@kernel-path/schema/limits';
import { tagProblem } from './tagCheck';
import { canCheckIntegrity, matchesName, validPublicKey, verifySite } from './integrity';

export const API_VERSION = 1;

const DATA_VALIDATORS = {
  quiz: validateQuizData,
  practice: validatePracticeData,
  flashcards: validateFlashcardsData,
  'flow-map': validateFlowMapData,
  diagram: validateDiagramData,
  'feature-grid': validateFeatureGridData,
  'terminal-demo': validateTerminalDemoData,
};

export class ContentError extends Error {}

let settings = null;
const cache = new Map();

/**
 * Read the deploy-time configuration: where the content bundle lives, and optionally the public
 * key its signature must verify against.
 */
async function configuration() {
  if (settings) return settings;
  // Relative to where the site is served from, not to the page's own address (pages have paths now).
  const siteRoot = new URL(import.meta.env?.BASE_URL ?? './', document.baseURI);
  let configured = './content/';
  let publicKey = null;
  try {
    const response = await fetch(new URL('kernel.config.json', siteRoot), { cache: 'no-cache' });
    if (response.ok) {
      const config = await response.json();
      if (typeof config.contentBase === 'string') configured = config.contentBase;
      if (config.publicKey !== undefined) {
        if (!validPublicKey(config.publicKey)) throw new ContentError('The configured public key is not a valid ECDSA P-256 key.');
        publicKey = config.publicKey;
      }
    }
  } catch (error) {
    if (error instanceof ContentError) throw error;
    /* no config: use the same-origin default */
  }
  const url = new URL(configured, siteRoot);
  if (!['https:', 'http:'].includes(url.protocol)) throw new ContentError('The content location must be an http(s) URL.');
  settings = { base: url.href.endsWith('/') ? url.href : `${url.href}/`, publicKey };
  return settings;
}

const contentBase = async () => (await configuration()).base;

/** Bundle paths are relative and may not leave the content base. */
function resolve(root, file) {
  if (typeof file !== 'string' || file.startsWith('/') || file.includes('..') || /^[a-z]+:/i.test(file)) {
    throw new ContentError(`Refusing to load ${JSON.stringify(file)} from outside the content bundle.`);
  }
  return new URL(file, root).href;
}

function describe(validate) {
  const first = validate.errors?.[0];
  return first ? `${first.instancePath || '(root)'} ${first.message}` : 'invalid';
}

/** Fetch a bundle file as text: refuse oversize responses and files that do not match the hash in their name. */
async function fetchText(url, file, what, limit, { fresh = false, requireHash = false } = {}) {
  const response = await fetch(url, fresh ? { cache: 'no-cache' } : undefined);
  if (!response.ok) throw new ContentError(`Could not load ${what} (${response.status}).`);
  if (Number(response.headers.get('content-length')) > limit) throw new ContentError(`The ${what} is larger than this site accepts.`);
  const text = await response.text();
  if (text.length > limit) throw new ContentError(`The ${what} is larger than this site accepts.`);
  if (canCheckIntegrity()) {
    if (!(await matchesName(file, text)))
      throw new ContentError(`The ${what} does not match its published fingerprint, so it was not used.`);
  } else if (requireHash) {
    throw new ContentError('This browser cannot verify signed content; open the site over https.');
  }
  return text;
}

async function load(file, validate, what, { fresh = false, limit = MAX_BYTES.page } = {}) {
  const root = await contentBase();
  const url = resolve(root, file);
  if (cache.has(url)) return cache.get(url);
  const promise = (async () => {
    const { publicKey } = await configuration();
    const text = await fetchText(url, file, what, limit, { fresh, requireHash: !!publicKey });
    let value;
    try {
      value = JSON.parse(text);
    } catch {
      throw new ContentError(`The ${what} is not valid content.`);
    }
    if (value?.apiVersion !== API_VERSION)
      throw new ContentError(`The ${what} uses content version ${value?.apiVersion}, which this site does not support.`);
    if (!validate(value)) throw new ContentError(`The ${what} is not valid content: ${describe(validate)}.`);
    return value;
  })();
  cache.set(url, promise);
  promise.catch(() => cache.delete(url));
  return promise;
}

let kitValidators = null;
/** Kit data validators are large and few pages need them, so they load only when a page contains a kit. */
const loadKitValidators = () => (kitValidators ??= import('@kernel-path/schema/kits').then((m) => m.KIT_VALIDATORS));

/** Tags whose page data must be checked against their data schema before rendering. */
async function validatePageData(page) {
  let usesKits = false;
  (function find(nodes) {
    for (const node of nodes ?? []) {
      if (node.t === 'tag' && Object.hasOwn(TAGS, node.name) && TAGS[node.name].kit) usesKits = true;
      find(node.c);
    }
  })(page.tree);
  const kits = usesKits ? await loadKitValidators() : {};
  (function visit(nodes) {
    for (const node of nodes ?? []) {
      if (node.t === 'tag') {
        const problem = tagProblem(node);
        if (problem) throw new ContentError(`The page is not valid content: ${problem}.`);
      }
      if (node.t === 'tag' && node.attrs?.ref !== undefined) {
        const validate = Object.hasOwn(DATA_VALIDATORS, node.name)
          ? DATA_VALIDATORS[node.name]
          : Object.hasOwn(kits, node.name)
            ? kits[node.name]
            : null;
        const entry = page.data[node.attrs.ref];
        if (!validate || entry === undefined || !validate(entry))
          throw new ContentError(
            `The page data for ${node.name} '${node.attrs.ref}' is not valid${validate ? `: ${describe(validate)}` : ''}.`,
          );
      }
      visit(node.c);
    }
  })(page.tree);
  return page;
}

/** The site index. When a public key is configured, the index must carry a signature that verifies. */
export async function loadSite() {
  const site = await load('site.json', validateSite, 'site index', { fresh: true, limit: MAX_BYTES.site });
  const { publicKey, base } = await configuration();
  if (!publicKey) return site;
  if (!site.signature) throw new ContentError('This site requires signed content, and the content is not signed.');
  const url = resolve(base, site.signature);
  const text = await fetchText(url, site.signature, 'signature', MAX_BYTES.signature, { requireHash: true });
  let signatureFile;
  try {
    signatureFile = JSON.parse(text);
  } catch {
    throw new ContentError('The content signature is not valid.');
  }
  if (!(await verifySite(site, signatureFile, publicKey)))
    throw new ContentError('The content signature does not match this site, so the content was not used.');
  return site;
}
export const loadManifest = (file) => load(file, validateManifest, 'program manifest', { limit: MAX_BYTES.manifest });
export const loadInterface = (file) => load(file, validateInterface, 'shared interface copy', { limit: MAX_BYTES.interface });
export const loadLegacy = (file) => load(file, validateLegacy, 'interface copy', { limit: MAX_BYTES.legacy });
export const loadSearch = (file) => load(file, validateSearch, 'search index', { limit: MAX_BYTES.search });
export const loadPage = async (file) => validatePageData(await load(file, validatePage, 'page', { limit: MAX_BYTES.page }));
