// Bash pathname expansion and brace expansion, for the pattern-matching kit. Follows Bash's
// defaults: * and ? never match a leading dot, a pattern that matches nothing is passed on as
// written, and braces expand before globbing whether or not the files exist.

const CLASSES = {
  alpha: /[A-Za-z]/,
  digit: /[0-9]/,
  alnum: /[A-Za-z0-9]/,
  upper: /[A-Z]/,
  lower: /[a-z]/,
  space: /\s/,
  punct: /[!-/:-@[-`{-~]/,
};

/** Turn one glob pattern into a regular expression, or null if it has no glob characters. */
export function globToRegExp(pattern) {
  let out = '';
  let special = false;
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === '\\' && i + 1 < pattern.length) {
      out += escape(pattern[++i]);
    } else if (ch === '*') {
      out += '[^/]*';
      special = true;
    } else if (ch === '?') {
      out += '[^/]';
      special = true;
    } else if (ch === '[') {
      const end = closing(pattern, i);
      if (end < 0) {
        out += '\\[';
        continue;
      }
      out += bracket(pattern.slice(i + 1, end));
      special = true;
      i = end;
    } else out += escape(ch);
  }
  return special ? new RegExp(`^${out}$`) : null;
}

function escape(ch) {
  return ch.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
}

/** Index of the ] that closes the bracket expression opening at i, or -1. */
function closing(pattern, i) {
  let j = i + 1;
  if (pattern[j] === '!' || pattern[j] === '^') j++;
  if (pattern[j] === ']') j++;
  for (; j < pattern.length; j++) {
    if (pattern[j] === '[' && pattern[j + 1] === ':') {
      const end = pattern.indexOf(':]', j + 2);
      if (end > 0) {
        j = end + 1;
        continue;
      }
    }
    if (pattern[j] === ']') return j;
  }
  return -1;
}

function bracket(body) {
  let negate = false;
  if (body[0] === '!' || body[0] === '^') {
    negate = true;
    body = body.slice(1);
  }
  const parts = [];
  for (let i = 0; i < body.length; i++) {
    if (body[i] === '[' && body[i + 1] === ':') {
      const end = body.indexOf(':]', i + 2);
      const name = body.slice(i + 2, end);
      if (end > 0 && CLASSES[name]) {
        parts.push(CLASSES[name].source.slice(1, -1));
        i = end + 1;
        continue;
      }
    }
    if (body[i + 1] === '-' && i + 2 < body.length) {
      parts.push(`${escape(body[i])}-${escape(body[i + 2])}`);
      i += 2;
    } else parts.push(escape(body[i]));
  }
  return `[${negate ? '^' : ''}${parts.join('')}]`;
}

/**
 * Names a pattern matches, sorted as Bash sorts them in an en_US.UTF-8 locale. A pattern that
 * starts with a dot may also match the directory's own . and .. entries, as in Bash 5.1.
 */
export function globMatch(pattern, names) {
  const re = globToRegExp(pattern);
  if (!re) return null;
  const dotOk = pattern.startsWith('.');
  const pool = dotOk ? ['.', '..', ...names] : names;
  return [...new Set(pool)].filter((n) => (dotOk || !n.startsWith('.')) && re.test(n)).sort(byName);
}

// glibc's en_US collation ignores punctuation at first (photo10.jpg sorts before photo1.jpg),
// then compares case; the dot entries come first.
const collator = new Intl.Collator('en', { ignorePunctuation: true, caseFirst: 'upper' });
const byName = (a, b) => {
  const dots = (n) => (n === '.' ? 0 : n === '..' ? 1 : 2);
  return dots(a) - dots(b) || collator.compare(a, b) || (a < b ? -1 : a > b ? 1 : 0);
};

/** Brace expansion of one word: a{b,c}d, x{1..3}, x{a..c}, nested braces. */
export function braceExpand(word) {
  const start = findBrace(word);
  if (!start) return [word];
  const { open, close, inner } = start;
  const prefix = word.slice(0, open);
  const suffix = word.slice(close + 1);
  const range = inner.match(/^(-?\d+)\.\.(-?\d+)$/) ?? inner.match(/^([a-zA-Z])\.\.([a-zA-Z])$/);
  let items;
  if (range) {
    const numeric = /\d/.test(range[1]);
    const a = numeric ? Number(range[1]) : range[1].charCodeAt(0);
    const b = numeric ? Number(range[2]) : range[2].charCodeAt(0);
    const width = numeric && /^-?0\d/.test(range[1] + '') ? range[1].replace('-', '').length : 0;
    items = [];
    for (let v = a; a <= b ? v <= b : v >= b; v += a <= b ? 1 : -1)
      items.push(numeric ? String(v).padStart(width, '0') : String.fromCharCode(v));
  } else items = splitTop(inner);
  return items.flatMap((item) => braceExpand(prefix + item + suffix));
}

/** The first brace group that is a real expansion (contains a top-level comma or a range). */
function findBrace(word) {
  for (let open = 0; open < word.length; open++) {
    if (word[open] !== '{' || word[open - 1] === '\\' || word[open - 1] === '$') continue;
    let depth = 0;
    for (let close = open; close < word.length; close++) {
      if (word[close] === '{') depth++;
      else if (word[close] === '}' && --depth === 0) {
        const inner = word.slice(open + 1, close);
        if (splitTop(inner).length > 1 || /^(-?\d+\.\.-?\d+|[a-zA-Z]\.\.[a-zA-Z])$/.test(inner)) return { open, close, inner };
        break;
      }
    }
  }
  return null;
}

function splitTop(inner) {
  const parts = [];
  let depth = 0;
  let current = '';
  for (const ch of inner) {
    if (ch === '{') depth++;
    if (ch === '}') depth--;
    if (ch === ',' && depth === 0) {
      parts.push(current);
      current = '';
    } else current += ch;
  }
  parts.push(current);
  return parts;
}

/**
 * Expand one argument as Bash would: braces first, then each resulting word against the names.
 * Returns the final words and, per word, whether it was a pattern that matched nothing.
 */
export function expandArgument(arg, names) {
  return braceExpand(arg).flatMap((word) => {
    const matched = globMatch(word, names);
    if (matched === null) return [{ word, kind: 'plain' }];
    if (matched.length === 0) return [{ word, kind: 'nomatch' }];
    return matched.map((name) => ({ word: name, kind: 'match' }));
  });
}
