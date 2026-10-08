// Keeps the document head in step with the page the reader (or a crawler) is on: title, description,
// canonical address and social-card tags. The build writes the same values into each page's HTML
// (scripts/prerender.mjs); this updates them as the app moves between pages.
import { canonicalUrl } from './seo';

function meta(attribute, key, value) {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', value);
}

/** Set the head for the current page. `route` is the site-relative path ("/rhel9-sysadmin/ch07/acls"). */
export function setHead({ title, description, route, index = true }) {
  if (title) {
    document.title = title;
    meta('property', 'og:title', title);
    meta('name', 'twitter:title', title);
  }
  if (description) {
    meta('name', 'description', description);
    meta('property', 'og:description', description);
    meta('name', 'twitter:description', description);
  }
  if (route !== undefined) {
    const url = canonicalUrl(window.location.origin, import.meta.env.BASE_URL, route);
    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', url);
    meta('property', 'og:url', url);
  }
  meta('name', 'robots', index ? 'index, follow, max-image-preview:large' : 'noindex, follow');
}
