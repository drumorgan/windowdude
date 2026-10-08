import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const root = import.meta.dirname;

// Vite only builds /index.html by default — every page must be listed here.
// When you add a page: create /<folder>/index.html, then add a line below.
export default defineConfig({
  base: '/',
  define: {
    // Shown on the home page so you can confirm a deploy actually went live
    __BUILD_TIME__: JSON.stringify(
      new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
    ),
  },
  build: {
    rollupOptions: {
      input: {
        home: resolve(root, 'index.html'),
        about: resolve(root, 'about/index.html'),
        news: resolve(root, 'news/index.html'),
        privacyPolicy: resolve(root, 'privacy-policy/index.html'),
        notFound: resolve(root, '404.html'),
      },
    },
  },
});
