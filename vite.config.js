import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const root = import.meta.dirname;

// Each build gets an ID that's added to the CSS/JS links (site.css?v=ID). Caches
// (InMotion's NGINX ignores our no-cache headers) then always pair a page with
// the CSS/JS from the same build, so a page can never mix new HTML with old CSS.
const BUILD_ID = Date.now().toString(36);
const versionAssets = {
  name: 'version-assets',
  transformIndexHtml: {
    order: 'post',
    handler: (html) => html.replace(/(\/assets\/site\.(?:css|js))(?=")/g, `$1?v=${BUILD_ID}`),
  },
};

// Vite only builds /index.html by default — every page must be listed here.
// When you add a page: create /<folder>/index.html, then add a line below.
export default defineConfig({
  base: '/',
  plugins: [versionAssets],
  define: {
    // Shown on the home page so you can confirm a deploy actually went live
    __BUILD_TIME__: JSON.stringify(
      new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
    ),
  },
  build: {
    rollupOptions: {
      // Stable file names (no content hash). A stale cached HTML page then still
      // finds the current CSS/JS instead of a deleted hashed file (blank-page bug).
      // .htaccess makes browsers revalidate /assets/ so updates show immediately.
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
      input: {
        home: resolve(root, 'index.html'),
        about: resolve(root, 'about/index.html'),
        trustedPros: resolve(root, 'trusted-pros/index.html'),
        privacyPolicy: resolve(root, 'privacy-policy/index.html'),
        notFound: resolve(root, '404.html'),
      },
    },
  },
});
