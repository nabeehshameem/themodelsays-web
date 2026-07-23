// Build-time prerender entry. Renders the app to static HTML so crawlers,
// link unfurlers and AdSense's reviewer see real content instead of an
// empty <div id="root">. The client still takes over on load — this only
// changes what is in the HTML document before JS runs.
import React from 'react';
import { renderToString } from 'react-dom/server';
import App from './App.jsx';

export async function prerender() {
  return { html: renderToString(<App />) };
}
