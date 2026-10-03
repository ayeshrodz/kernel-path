import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { grepLines, grepSource } from '../src/lib/grep.js';

const fixture = (name) => fs.readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');
const lines = fixture('grep-app.log').replace(/\n$/, '').split('\n');

test('every recorded grep run on the lab is reproduced exactly', () => {
  const cases = fixture('grep-recorded.txt').split(/^=== /m).filter(Boolean);
  assert.ok(cases.length >= 20);
  for (const block of cases) {
    const [head, ...out] = block.replace(/\n$/, '').split('\n');
    const [flags, ...rest] = head.split('|');
    const pattern = rest.join('|');
    const options = {
      extended: flags.includes('E'),
      ignoreCase: flags.includes('i'),
      invert: flags.includes('v'),
      numbers: flags.includes('n'),
    };
    assert.deepEqual(
      grepLines(lines, pattern, options).output,
      out.filter((l) => l !== ''),
      `grep ${flags} '${pattern}'`,
    );
  }
});

test('basic syntax treats + ? | ( ) { } literally unless escaped; extended does the opposite', () => {
  assert.equal(new RegExp(grepSource('a+b')).test('a+b'), true);
  assert.equal(new RegExp(grepSource('a\\+b')).test('aaab'), true);
  assert.equal(new RegExp(grepSource('a+b', true)).test('aaab'), true);
  assert.equal(new RegExp(grepSource('\\(ab\\)\\1')).test('abab'), true);
  assert.equal(new RegExp(grepSource('[[:digit:]]\\{3\\}')).test('x123'), true);
});
