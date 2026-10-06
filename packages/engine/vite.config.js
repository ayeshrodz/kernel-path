import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import chapterWidgets from './plugins/chapter-widgets.js';
import contentBundle from './plugins/content-bundle.js';

const require = createRequire(import.meta.url);
/** The folder of an installed font package, so font files are bundled from wherever npm placed them. */
const fontPackage = (name) => path.dirname(require.resolve(`${name}/package.json`));

export default defineConfig({
  // Pages have real addresses ("/rhel9-sysadmin/ch02/linux-and-the-shell"), so search engines can index
  // each one. SITE_BASE is the path the site is served from: "/" for a custom domain, "/repo/" for a
  // project page on github.io.
  base: process.env.SITE_BASE ?? '/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@ubuntu-sans': fontPackage('@fontsource-variable/ubuntu-sans'),
      '@jetbrains-mono': fontPackage('@fontsource-variable/jetbrains-mono'),
    },
  },
  plugins: [contentBundle({ dir: '../../content' }), chapterWidgets(), react({ include: /\.(jsx|js)$/ })],
  server: { host: 'localhost', port: 3000 },
  // The site is built to the repository root's dist/, with the content bundle beside it.
  build: { outDir: '../../dist', emptyOutDir: true, chunkSizeWarningLimit: 900 },
});
