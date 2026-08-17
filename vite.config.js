import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { vitePrerenderPlugin } from 'vite-prerender-plugin';
import { resolve, join } from 'node:path';
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';

// The prerender entry is a BUILD-TIME module: Vite emits it as a chunk and
// preloads it from index.html, so every visitor would download ~170 kB that
// is never executed. Strip the preload and delete the chunk after the build.
function dropPrerenderChunk(outDir = 'dist') {
  return {
    name: 'drop-prerender-chunk',
    closeBundle() {
      const htmlPath = join(outDir, 'index.html');
      if (!existsSync(htmlPath)) return;

      let doc = readFileSync(htmlPath, 'utf8');

      // Extract the paths of all prerender chunk references BEFORE stripping,
      // so we know exactly which files to delete regardless of where Vite put them.
      const refPaths = [];
      const refRe = /(?:src|href)=["']([^"']*prerender-[^"']+\.js)["']/g;
      let m;
      while ((m = refRe.exec(doc)) !== null) refPaths.push(m[1]);

      if (!refPaths.length) {
        console.log('drop-prerender-chunk: no prerender references found — nothing to do');
        return;
      }

      // Strip every <link> and <script> that references a prerender chunk.
      // The broad class selector (not the filename) avoids regex-escaping issues
      // and catches any tag format Vite might generate.
      doc = doc.replace(/<link\b[^>]*\bprerender-[^>]*>/g, '');
      doc = doc.replace(/<script\b[^>]*\bprerender-[^>]*>[\s\S]*?<\/script>/g, '');
      writeFileSync(htmlPath, doc);

      // Delete each referenced file from disk.
      const deleted = [];
      for (const ref of refPaths) {
        // ref is an absolute-ish URL path like "/assets/prerender-xxx.js"
        const filePath = join(outDir, ref.replace(/^\//, ''));
        if (existsSync(filePath)) { unlinkSync(filePath); deleted.push(ref); }
        else console.warn(`drop-prerender-chunk: expected file not found at ${filePath}`);
      }
      console.log(`dropped build-only chunk(s): ${deleted.join(', ')}`);
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
