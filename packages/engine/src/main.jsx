import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/sidebar.css';
import './styles/prose.css';
import './styles/components.css';
import './styles/diagrams.css';
import './styles/widgets.css';
import './styles/pages.css';
import './styles/landing.css';
import './styles/mobile.css';
import './styles/motion.css';
// After the global styles, so chapter widget styles (loaded via App) can override them.
import App from './App';
import BootError from './pages/BootError';
import { bootContent } from './lib/course';
import { withSlash } from './lib/router';

// Addresses from before pages had paths ("/#/rhel9-ansible/ch03/inventory#heading") move to the path form,
// on arrival and when an old link changes the hash later.
function moveHashAddress() {
  if (!window.location.hash.startsWith('#/')) return false;
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  window.history.replaceState(null, '', `${base}${withSlash(window.location.hash.slice(1))}`);
  return true;
}
moveHashAddress();
window.addEventListener('hashchange', () => {
  // The router listens for popstate, so it follows the moved address.
  if (moveHashAddress()) window.dispatchEvent(new PopStateEvent('popstate'));
});

const root = createRoot(document.getElementById('root'));

/** Once the browser is idle, fetch the code the app may need later, so nothing waits on the network afterwards. */
function fetchTheRestWhenIdle() {
  const later = document.querySelector('meta[name="kernel-path-later"]')?.content.split(' ').filter(Boolean) ?? [];
  const idle = window.requestIdleCallback ?? ((callback) => setTimeout(callback, 1500));
  idle(() => {
    for (const href of later) {
      const link = document.createElement('link');
      if (href.endsWith('.css')) {
        link.rel = 'preload';
        link.as = 'style';
      } else link.rel = 'modulepreload';
      link.href = href;
      document.head.appendChild(link);
    }
  });
}

bootContent().then(
  () => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    fetchTheRestWhenIdle();
  },
  (error) => {
    console.error(error);
    root.render(
      <main>
        <BootError error={error} />
      </main>,
    );
  },
);
