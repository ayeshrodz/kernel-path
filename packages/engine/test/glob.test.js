import { test } from 'node:test';
import assert from 'node:assert/strict';
import { braceExpand, expandArgument, globMatch } from '../src/lib/glob.js';

const files = ['able', 'alfa', 'baker', 'bravo', 'cast', 'charlie', 'delta', 'dog', 'easy', 'echo', '.hidden'];

test('* ? and bracket expressions match as in Bash, never a leading dot', () => {
  assert.deepEqual(globMatch('a*', files), ['able', 'alfa']);
  assert.deepEqual(globMatch('*a*', files), ['able', 'alfa', 'baker', 'bravo', 'cast', 'charlie', 'delta', 'easy']);
  assert.deepEqual(globMatch('[ac]*', files), ['able', 'alfa', 'cast', 'charlie']);
  assert.deepEqual(globMatch('????', files), ['able', 'alfa', 'cast', 'easy', 'echo']);
  assert.deepEqual(globMatch('?????', files), ['baker', 'bravo', 'delta']);
  assert.deepEqual(globMatch('[!a-c]*', files), ['delta', 'dog', 'easy', 'echo']);
  assert.deepEqual(globMatch('*[[:digit:]]*', ['file1', 'file', 'a2b']), ['a2b', 'file1']);
  assert.deepEqual(globMatch('*', files).includes('.hidden'), false);
  assert.deepEqual(globMatch('.*', files), ['.', '..', '.hidden']);
  assert.equal(globMatch('alfa', files), null);
});

test('brace expansion lists, ranges and nesting', () => {
  assert.deepEqual(braceExpand('{Sunday,Monday,Tuesday}.log'), ['Sunday.log', 'Monday.log', 'Tuesday.log']);
  assert.deepEqual(braceExpand('file{1..3}.txt'), ['file1.txt', 'file2.txt', 'file3.txt']);
  assert.deepEqual(braceExpand('file{a..c}{1,2}.txt'), [
    'filea1.txt',
    'filea2.txt',
    'fileb1.txt',
    'fileb2.txt',
    'filec1.txt',
    'filec2.txt',
  ]);
  assert.deepEqual(braceExpand('file{a{1,2},b,c}.txt'), ['filea1.txt', 'filea2.txt', 'fileb.txt', 'filec.txt']);
  assert.deepEqual(braceExpand('ep{01..03}'), ['ep01', 'ep02', 'ep03']);
  assert.deepEqual(braceExpand('{3..1}'), ['3', '2', '1']);
  assert.deepEqual(braceExpand('plain{x}'), ['plain{x}']);
});

test('an argument expands braces first, then globs; no match is passed on as written', () => {
  assert.deepEqual(
    expandArgument('{a,d}*', files).map((x) => x.word),
    ['able', 'alfa', 'delta', 'dog'],
  );
  assert.deepEqual(expandArgument('z*', files), [{ word: 'z*', kind: 'nomatch' }]);
  assert.deepEqual(expandArgument('new{1,2}', files), [
    { word: 'new1', kind: 'plain' },
    { word: 'new2', kind: 'plain' },
  ]);
});

test('results are ordered as Bash orders them in en_US.UTF-8 (recorded on the lab)', () => {
  const site = [
    'index.html',
    'about.html',
    'style.css',
    'app.js',
    'logo.png',
    'photo1.jpg',
    'photo2.jpg',
    'photo10.jpg',
    'notes.txt',
    'Notes.md',
    'report-2025.pdf',
    'report-2026.pdf',
    '.htaccess',
  ];
  const recorded = {
    '*': 'about.html app.js index.html logo.png Notes.md notes.txt photo10.jpg photo1.jpg photo2.jpg report-2025.pdf report-2026.pdf style.css',
    '*.html': 'about.html index.html',
    'photo?.jpg': 'photo1.jpg photo2.jpg',
    'photo*.jpg': 'photo10.jpg photo1.jpg photo2.jpg',
    '[a-m]*': 'about.html app.js index.html logo.png',
    '*[0-9]*': 'photo10.jpg photo1.jpg photo2.jpg report-2025.pdf report-2026.pdf',
    'report-202[56].pdf': 'report-2025.pdf report-2026.pdf',
    '[[:upper:]]*': 'Notes.md',
    '.*': '. .. .htaccess',
    '*.{html,css}': 'about.html index.html style.css',
    'photo{1,2}.jpg': 'photo1.jpg photo2.jpg',
    'photo{1..3}.jpg': 'photo1.jpg photo2.jpg photo3.jpg',
    '*.zip': '*.zip',
    '[!a-n]*': 'Notes.md photo10.jpg photo1.jpg photo2.jpg report-2025.pdf report-2026.pdf style.css',
  };
  for (const [pattern, words] of Object.entries(recorded))
    assert.equal(
      expandArgument(pattern, site)
        .map((x) => x.word)
        .join(' '),
      words,
      pattern,
    );
});
