// grep's regular expressions, for the grep tester kit: basic (the default) and extended (-E)
// syntax translated to JavaScript, plus the -i, -v and -n options. Covers what administrators
// use day to day: anchors, ., *, bracket expressions with POSIX classes, \< \> word edges,
// intervals, alternation and groups.

const CLASSES = {
  alpha: 'A-Za-z',
  digit: '0-9',
  alnum: 'A-Za-z0-9',
  upper: 'A-Z',
  lower: 'a-z',
  space: ' \\t\\n\\r\\f\\v',
  blank: ' \\t',
  punct: '!-/:-@\\[-`{-~',
  xdigit: '0-9A-Fa-f',
};

/** Copy a bracket expression starting at i (the '['), returning [jsText, nextIndex]. */
function bracket(p, i) {
  let j = i + 1;
  let out = '[';
  if (p[j] === '^') {
    out += '^';
    j++;
  }
  if (p[j] === ']') {
    out += '\\]';
    j++;
  }
  for (; j < p.length; j++) {
    if (p[j] === ']') return [out + ']', j + 1];
    if (p[j] === '[' && p[j + 1] === ':') {
      const end = p.indexOf(':]', j + 2);
      const name = p.slice(j + 2, end);
      if (end > 0 && CLASSES[name]) {
        out += CLASSES[name];
        j = end + 1;
        continue;
      }
    }
    out += p[j] === '\\' || p[j] === '[' ? '\\' + p[j] : p[j];
  }
  throw new SyntaxError('Unmatched [');
}

/** Translate a grep pattern (basic or extended) into a JavaScript RegExp source. */
export function grepSource(pattern, extended = false) {
  const OPS = '+?|(){}';
  let out = '';
  for (let i = 0; i < pattern.length;) {
    const ch = pattern[i];
    if (ch === '[') {
      const [text, next] = bracket(pattern, i);
      out += text;
      i = next;
    } else if (ch === '\\' && i + 1 < pattern.length) {
      const nx = pattern[i + 1];
      if (nx === '<') out += '\\b(?=\\w)';
      else if (nx === '>') out += '\\b(?<=\\w)';
      else if (!extended && OPS.includes(nx)) out += nx === '(' ? '(?:' : nx;
      else if (/[1-9]/.test(nx)) out += '\\' + nx;
      else if (nx === 'w' || nx === 'W' || nx === 'b' || nx === 'B' || nx === 's' || nx === 'S') out += '\\' + nx;
      else out += '\\' + (/[a-zA-Z0-9]/.test(nx) ? nx : nx);
      i += 2;
    } else if (OPS.includes(ch)) {
      out += extended ? (ch === '(' ? '(' : ch) : '\\' + ch;
      i++;
    } else {
      out += ch;
      i++;
    }
  }
  // Back-references need capturing groups; keep basic groups capturing so \1 works.
  if (/\\[1-9]/.test(out)) out = out.replace(/\(\?:/g, '(');
  return out;
}

/** grep a list of lines. Returns the lines grep prints and, for highlighting, every line's match spans. */
export function grepLines(lines, pattern, { extended = false, ignoreCase = false, invert = false, numbers = false } = {}) {
  const re = new RegExp(grepSource(pattern, extended), ignoreCase ? 'gi' : 'g');
  const results = lines.map((text, index) => {
    const spans = [];
    if (pattern !== '') {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(text))) {
        if (m[0] === '') {
          re.lastIndex++;
          if (re.lastIndex > text.length) break;
          spans.push([m.index, m.index]);
          continue;
        }
        spans.push([m.index, m.index + m[0].length]);
      }
    }
    const hit = pattern === '' || spans.length > 0;
    return { text, n: index + 1, spans, selected: invert ? !hit : hit };
  });
  const output = results.filter((r) => r.selected).map((r) => (numbers ? `${r.n}:${r.text}` : r.text));
  return { results, output };
}
