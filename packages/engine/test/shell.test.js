import { test } from 'node:test';
import assert from 'node:assert/strict';
import { expandHistory, splitCommands } from '../src/lib/shell.js';

const history = ['date +%R', 'file /usr/bin/zcat', 'wc -l /etc/passwd', 'tail -n 3 /etc/passwd'];

test('history expansion follows Bash for !!, !N, !-N and !prefix', () => {
  assert.deepEqual(expandHistory('!!', history), { line: 'tail -n 3 /etc/passwd', expanded: true });
  assert.equal(expandHistory('!1', history).line, 'date +%R');
  assert.equal(expandHistory('!-2', history).line, 'wc -l /etc/passwd');
  assert.equal(expandHistory('!wc', history).line, 'wc -l /etc/passwd');
  assert.equal(expandHistory('sudo !!', history).line, 'sudo tail -n 3 /etc/passwd');
  assert.deepEqual(expandHistory('date', history), { line: 'date', expanded: false });
});

test('an expansion with no match is an error, as in Bash', () => {
  assert.deepEqual(expandHistory('!nothing', history), { error: '!nothing' });
  assert.deepEqual(expandHistory('!9', history), { error: '!9' });
  assert.deepEqual(expandHistory('!!', []), { error: '!!' });
});

test('semicolons split commands, except inside quotes', () => {
  assert.deepEqual(splitCommands('date +%R ;  whoami'), ['date +%R', 'whoami']);
  assert.deepEqual(splitCommands(`echo 'a;b' ; date`), [`echo 'a;b'`, 'date']);
});
