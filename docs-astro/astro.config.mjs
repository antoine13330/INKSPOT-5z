import { defineConfig } from 'astro/config';

export default defineConfig({
  srcDir: './src',
  outDir: './dist',
  server: {
    host: true,
    port: 4321,
  },
  markdown: {
    syntaxHighlight: 'shiki',
  },
  integrations: [],
});
