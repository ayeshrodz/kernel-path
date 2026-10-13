// Tells search engines that use IndexNow (Bing, Yandex, Seznam, Naver; Bing also feeds DuckDuckGo and
// others) which pages are new or changed, right after a deploy. Runs in GitHub Actions; the site itself
// does no work. The key is a public file at the site root, as the protocol requires.
//   node scripts/indexnow.mjs <previous-sitemap.xml> <new-sitemap.xml>
import fs from 'node:fs';
import path from 'node:path';

const [previousFile, currentFile = 'dist/sitemap.xml'] = process.argv.slice(2);
const entries = (xml) =>
  new Map([...xml.matchAll(/<url><loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod>/g)].map((m) => [m[1], m[2]]));
const current = entries(fs.readFileSync(currentFile, 'utf8'));
const previous = previousFile && fs.existsSync(previousFile) ? entries(fs.readFileSync(previousFile, 'utf8')) : new Map();
const changed = [...current].filter(([url, lastmod]) => previous.get(url) !== lastmod).map(([url]) => url);
if (!changed.length) {
  console.log('IndexNow: nothing new or changed');
  process.exit(0);
}
const dist = path.dirname(currentFile);
const keyFile = fs.readdirSync(dist).find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (!keyFile) throw new Error('No IndexNow key file at the site root');
const key = keyFile.slice(0, -4);
const { origin, host } = new URL(changed[0]);
const body = { host, key, keyLocation: `${origin}/${keyFile}`, urlList: changed.slice(0, 10000) };
const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(body),
});
console.log(`IndexNow: submitted ${body.urlList.length} addresses, status ${response.status}`);
if (!response.ok && response.status !== 202) process.exitCode = 1;
