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

// Addresses from before pages had paths ("/#/rhel9-ansible/ch03/inventory#heading") move to the path form,
// on arrival and when an old link changes the hash later.
function moveHashAddress() {
  if (!window.location.hash.startsWith('#/')) return false;
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  window.history.replaceState(null, '', `${base}${window.location.hash.slice(1)}`);
  return true;
}
moveHashAddress();
window.addEventListener('hashchange', () => {
  // The router listens for popstate, so it follows the moved address.
  if (moveHashAddress()) window.dispatchEvent(new PopStateEvent('popstate'));
});

const root = createRoot(document.getElementById('root'));

bootContent().then(
  () =>
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    ),
  (error) => {
    console.error(error);
    root.render(
      <main>
        <BootError error={error} />
      </main>,
    );
  },
);
