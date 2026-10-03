// Bash behaviour the practice terminal reproduces: history expansion and command splitting.

export const squash = (s) => s.trim().replace(/\s+/g, ' ');

/** Bash-style history expansion for !!, !N, !-N and !prefix. Returns { line } or { error }. */
export function expandHistory(input, history) {
  let error = null;
  const line = input.replace(/!(!|-?\d+|[^\s!;|&<>'"=]+)/g, (whole, ref) => {
    if (error) return whole;
    let found;
    if (ref === '!') found = history[history.length - 1];
    else if (/^-\d+$/.test(ref)) found = history[history.length + Number(ref)];
    else if (/^\d+$/.test(ref)) found = history[Number(ref) - 1];
    else found = [...history].reverse().find((h) => h.startsWith(ref));
    if (found === undefined) error = whole;
    return found ?? whole;
  });
  return error ? { error } : { line, expanded: line !== input };
}

/** Split a line into commands at unquoted semicolons. */
export function splitCommands(line) {
  const parts = [];
  let current = '';
  let quote = null;
  for (const ch of line) {
    if (quote) {
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === ';') {
      parts.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  parts.push(current);
  return parts.map(squash).filter(Boolean);
}
