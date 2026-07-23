import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { vitePrerenderPlugin } from 'vite-prerender-plugin';
import { resolve, join } from 'node:path';
import { readFileSync, writeFileSync, existsSync, unlinkSync, readdirSync } from 'node:fs';

// The prerender entry is a BUILD-TIME module: Vite emits it as a chunk and
// preloads it from index.html, so every visitor would download ~170 kB that
// is never executed. Strip the preload and delete the chunk after the build.
function dropPrerenderChunk(outDir = 'dist') {
  return {
    name: 'drop-prerender-chunk',
    closeBundle() {
      const assets = join(outDir, 'assets');
      if (!existsSync(assets)) return;
      const chunks = readdirSync(assets).filter(f => /^prerender-.*\.js$/.test(f));
      const html = join(outDir, 'index.html');
      if (existsSync(html)) {
        let doc = readFileSync(html, 'utf8');
        for (const c of chunks) {
          doc = doc.replace(
            new RegExp(`\\s*<link[^>]*(?:modulepreload|preload)[^>]*${c}[^>]*>`, 'g'), '');
        }
        writeFileSync(html, doc);
      }
      for (const c of chunks) unlinkSync(join(assets, c));
      if (chunks.length) console.log(`dropped build-only chunk(s): ${chunks.join(', ')}`);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Renders the app to static HTML at build time. Without this the shipped
    // document is an empty <div id="root">, which is what crawlers, link
    // unfurlers and ad-network reviewers see.
    vitePrerenderPlugin({
      renderTarget: '#root',
      prerenderScript: resolve(__dirname, 'src/prerender.jsx'),
    }),
    dropPrerenderChunk(),
  ],
  server: { port: 5173, open: true },
  build: { outDir: 'dist', sourcemap: false },
});
