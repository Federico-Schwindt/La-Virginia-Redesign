import { defineConfig } from 'astro/config';

// GitHub Pages: https://<usuario>.github.io/<repo>/ — SITE/BASE los define el workflow.
const site = process.env.SITE || 'https://federico-schwindt.github.io';
const base = process.env.BASE ?? '/La-Virginia-Redesign';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  output: 'static',
  build: { inlineStylesheets: 'always', assets: '_assets' },
  compressHTML: true,
});
