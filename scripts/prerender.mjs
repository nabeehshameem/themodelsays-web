/**
 * Post-build prerender step. Runs after `vite build` to inject a static
 * server-rendered shell into dist/index.html so crawlers see real content
 * instead of an empty <div id="root">.
 *
 * Uses a separate `vite build --ssr` pass so the SSR bundle never shares
 * chunks with the browser bundle — the chunk-sharing was what broke the
 * previous vitePrerenderPlugin approach (React got extracted into a shared
 * prerender chunk; stubbing it wiped React exports).
 *
 * The rendered output is the static shell only: API-driven panels render
 * in their initial skeleton/placeholder state (useEffect doesn't run during
 * renderToString). That's fine — crawlers get the hero, mini league section,
 * methodology, and WC stats; React hydrates the rest on the client.
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, rmSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

console.log('[prerender] building SSR bundle…');
execSync('npx vite build --ssr src/entry-server.jsx --outDir dist-ssr --emptyOutDir', {
  stdio: 'inherit',
  cwd: root,
});

console.log('[prerender] rendering…');
const { render } = await import(pathToFileURL(path.join(root, 'dist-ssr', 'entry-server.js')).href);
const appHtml = render();

const template = readFileSync(path.join(root, 'dist', 'index.html'), 'utf-8');
const out = template.replace(
  '<div id="root"></div>',
  `<div id="root">${appHtml}</div>`,
);
writeFileSync(path.join(root, 'dist', 'index.html'), out, 'utf-8');

rmSync(path.join(root, 'dist-ssr'), { recursive: true, force: true });
console.log('[prerender] done — dist/index.html now has pre-rendered shell');
