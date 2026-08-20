import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { vitePrerenderPlugin } from 'vite-prerender-plugin';
import { resolve, join } from 'node:path';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';

// The prerender entry is a BUILD-TIME module. Vite compiles it into
// prerender-xxx.js and the main bundle may reference it via a dynamic import.
// We cannot delete the file (the import would resolve to Vercel's catch-all,
// which returns text/html → MIME error → React never mounts). Instead we
// replace the chunk with a tiny no-op stub so the import resolves harmlessly
// and strip any unnecessary preload tags from index.html.
function dropPrerenderChunk(outDir = 'dist') {
  return {
    name: 'drop-prerender-chunk',
    closeBundle() {
      // 1. Strip <link modulepreload> and <script> tags that point at the
      //    prerender chunk — they cause unnecessary downloads.
      const htmlPath = join(outDir, 'index.html');
      if (existsSync(htmlPath)) {
        let doc = readFileSync(htmlPath, 'utf8');
        doc = doc.replace(/<link\b[^>]*\bprerender-[^>]*>/g, '');
        doc = doc.replace(/<script\b[^>]*\bprerender-[^>]*>[\s\S]*?<\/script>/g, '');
        writeFileSync(htmlPath, doc);
      }

      // 2. Stub out every prerender-xxx.js file so any dynamic import in the
      //    main bundle resolves to a no-op instead of triggering the
      //    text/html MIME error from Vercel's SPA catch-all.
      const STUB = 'export const prerender=()=>{};';
      const stubbed = [];
      for (const dir of [outDir, join(outDir, 'assets')]) {
        if (!existsSync(dir)) continue;
        for (const f of readdirSync(dir)) {
          if (/^prerender-.*\.js$/.test(f)) {
            writeFileSync(join(dir, f), STUB);
            stubbed.push(f);
          }
        }
      }
      if (stubbed.length) console.log(`stubbed prerender chunk(s): ${stubbed.join(', ')}`);
      else console.log('drop-prerender-chunk: no prerender chunks found');
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
