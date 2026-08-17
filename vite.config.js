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
      // vitePrerenderPlugin may place the chunk in dist/ root OR dist/assets/
      // depending on version — scan both so we never miss it.
      const dirsToScan = [outDir, join(outDir, 'assets')];
      const found = [];   // [{name, dir}]
      for (const dir of dirsToScan) {
        if (!existsSync(dir)) continue;
        for (const f of readdirSync(dir)) {
          if (/^prerender-.*\.js$/.test(f)) found.push({ name: f, dir });
        }
      }
      if (!found.length) return;

      const html = join(outDir, 'index.html');
      if (existsSync(html)) {
        let doc = readFileSync(html, 'utf8');
        for (const { name: c } of found) {
          // Escape dots so the regex matches the literal filename.
          const escaped = c.replace(/\./g, '\\.');
          doc = doc.replace(
            new RegExp(`\\s*<link[^>]*(?:modulepreload|preload)[^>]*${escaped}[^>]*>`, 'g'), '');
          doc = doc.replace(
            new RegExp(`\\s*<script[^>]*${escaped}[^>]*>\\s*</script>`, 'g'), '');
        }
        writeFileSync(html, doc);
      }
      for (const { name: f, dir } of found) unlinkSync(join(dir, f));
      console.log(`dropped build-only chunk(s): ${found.map(x => x.name).join(', ')}`);
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
