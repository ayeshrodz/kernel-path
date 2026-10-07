// Finishes the built index.html. The engine stays generic, so what belongs to the deployment is
// written here from the content bundle and the deploy-time configuration:
//   - the site's name and description
//   - the public key that signed content must verify against (KERNEL_PUBLIC_KEY, a public JWK), pinned in
//     kernel.config.json; the build checks the content really is signed by the matching key
//   - a content security policy (a meta tag: GitHub Pages cannot send headers) that allows scripts,
//     styles and fonts from this site only, and connections to this site and the content location
//   - subresource integrity hashes on the engine's scripts and styles
//   node scripts/inject-meta.mjs <dist-dir>
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve(process.argv[2] ?? 'dist');
const site = JSON.parse(fs.readFileSync(path.join(dist, 'content/site.json'), 'utf8'));
const config = JSON.parse(fs.readFileSync(path.join(dist, 'kernel.config.json'), 'utf8'));

// Pin the signing key, if the deployment uses one. A pinned key with unsigned (or wrongly signed) content
// would make the live site refuse to load, so that is a build failure, not a surprise in production.
const configFile = path.join(dist, 'kernel.config.json');
const configured = process.env.KERNEL_PUBLIC_KEY?.trim();
if (configured) {
  const jwk = JSON.parse(configured);
  if (jwk.kty !== 'EC' || jwk.crv !== 'P-256' || typeof jwk.x !== 'string' || typeof jwk.y !== 'string' || 'd' in jwk)
    throw new Error('KERNEL_PUBLIC_KEY must be a public ECDSA P-256 key (kty, crv, x, y), without a private part');
  if (!site.signature) throw new Error('KERNEL_PUBLIC_KEY is set but the content is not signed: set KERNEL_SIGNING_KEY for the build');
  const { signature, ...unsigned } = site;
  const proof = JSON.parse(fs.readFileSync(path.join(dist, 'content', signature), 'utf8'));
  const key = crypto.createPublicKey({ key: { kty: 'EC', crv: 'P-256', x: jwk.x, y: jwk.y }, format: 'jwk' });
  if (!crypto.verify('sha256', Buffer.from(JSON.stringify(unsigned)), { key, dsaEncoding: 'ieee-p1363' }, Buffer.from(proof.signature, 'base64url')))
    throw new Error('The content signature does not verify against KERNEL_PUBLIC_KEY: the signing key and the public key do not match');
  config.publicKey = { kty: 'EC', crv: 'P-256', x: jwk.x, y: jwk.y };
  fs.writeFileSync(configFile, JSON.stringify(config, null, 2) + '\n');
  console.log('kernel.config.json: signed content required');
} else if (site.signature) {
  console.warn('The content is signed but no public key is pinned (KERNEL_PUBLIC_KEY), so the site accepts unsigned content too.');
}

const escape = (text) => text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const program = site.programs.find((p) => p.status === 'active') ?? site.programs[0];
const title = `${site.site.name} · ${site.site.tagline}`;
const description = site.site.description ?? program.summary;

// Where the content lives decides what the page may connect to.
const contentOrigin = new URL(config.contentBase ?? './content/', 'https://this-site.invalid/').origin;
const connect = ["'self'", ...(contentOrigin === 'https://this-site.invalid' ? [] : [contentOrigin])];
export const policy = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "font-src 'self'",
  "img-src 'self' data:",
  `connect-src ${connect.join(' ')}`,
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "require-trusted-types-for 'script'",
].join('; ');

// "/assets/x.js" or "./assets/x.js" → the file in dist, whatever base the site is served from.
const base = process.env.SITE_BASE ?? '/';
const local = (href) => (href.startsWith(base) ? href.slice(base.length) : href.replace(/^\.?\//, ''));
const integrity = (href) => `sha384-${crypto.createHash('sha384').update(fs.readFileSync(path.join(dist, href))).digest('base64')}`;

const file = path.join(dist, 'index.html');
let html = fs
  .readFileSync(file, 'utf8')
  // Running this again (after changing kernel.config.json, say) replaces the policy instead of adding a second.
  .replace(/\s*<meta http-equiv="Content-Security-Policy"[^>]*>/, '')
  .replace(/\s*<meta name="referrer"[^>]*>/, '')
  .replace(/<title>[^<]*<\/title>/, `<title>${escape(title)}</title>`)
  .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${escape(description)}" />`)
  // The policy goes first so it applies to everything after it.
  .replace(/<meta charset="UTF-8" \/>/, `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${escape(policy)}" />\n    <meta name="referrer" content="same-origin" />`)
  // Scripts and stylesheets from this site get an integrity hash; the browser refuses a changed file.
  .replace(/<(script|link)\b([^>]*?)\b(src|href)="((?:\.\/|\/)[^"]+\.(?:js|css))"([^>]*)>/g, (tag, name, before, attribute, href, after) => {
    if (/\bintegrity=/.test(tag)) return tag;
    return `<${name}${before}${attribute}="${href}" integrity="${integrity(local(href))}"${after}>`;
  });
// Everything else the app may need later (widgets, chapter kits, the dashboard): fetched while the browser
// is idle after the first page has drawn, so later pages and activities open without waiting.
const referenced = new Set([...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => local(m[1])));
const later = fs
  .readdirSync(path.join(dist, 'assets'))
  .filter((f) => /\.(?:js|css)$/.test(f) && !referenced.has(`assets/${f}`))
  .map((f) => `${base}assets/${f}`);
html = html.replace(/\s*<meta name="kernel-path-later"[^>]*>/, '').replace('</head>', `  <meta name="kernel-path-later" content="${escape(later.join(' '))}" />\n  </head>`);
fs.writeFileSync(file, html);
console.log(`index.html: ${title}`);
