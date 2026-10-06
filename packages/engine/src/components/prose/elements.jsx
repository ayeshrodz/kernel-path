// Element overrides used when rendering compiled pages: inline code (fills the reader's
// lab values) and links (router-aware, including links to a heading on another page).
import { programPath, useNavigate } from '@/lib/router';
import { fillInline, usePlaceholderValues } from '@/lib/placeholders';

// Inline code (and the <code> inside highlighted blocks, which CodeBlock handles).
export function Code({ children, ...props }) {
  const [labValues] = usePlaceholderValues();
  return <code {...props}>{fillInline(children, labValues)}</code>;
}

// Content writes links to its own pages as "#/ch01/page" (and "#/ch01/page#heading"); they open the
// page's real address. "#heading" scrolls this one. Page renderers share heading navigation.
export function Anchor({ href = '', onClick, ...props }) {
  const navigate = useNavigate();
  if (href.startsWith('#/')) {
    // Content addresses pages relative to its program; the link gains the program id.
    const go = (e) => {
      // Let the browser handle "open in a new tab or window"; the href is already the full address.
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      navigate(href.slice(1));
    };
    return <a href={`${import.meta.env.BASE_URL.replace(/\/$/, '')}${programPath(href.slice(1))}`} onClick={go} {...props} />;
  }
  if (href.startsWith('#') && !href.startsWith('#/')) {
    const go = (e) => {
      e.preventDefault();
      navigate({ hash: href }, { replace: true, state: { scrollSmooth: true } });
    };
    return <a href={href} onClick={go} {...props} />;
  }
  return <a href={href} onClick={onClick} {...props} />;
}
