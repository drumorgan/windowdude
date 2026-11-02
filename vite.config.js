import { writeFileSync } from 'node:fs';
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

// ---------------------------------------------------------------------------
// Las Vegas launch switch — the ONE place to change the launch date.
// Before this date pages say "Coming January 2027"; from this date on, every
// build says "Now serving". The deploy workflow also rebuilds on its own on the
// 1st and 15th of each month, so the switch flips without anyone touching it.
// In HTML, wrap text in <!--vegas-soon-->…<!--/vegas-soon--> or
// <!--vegas-open-->…<!--/vegas-open-->; only the matching one is kept.
// ---------------------------------------------------------------------------
const VEGAS_LAUNCH = '2027-01-01';
const VEGAS_OPEN = new Date() >= new Date(`${VEGAS_LAUNCH}T00:00:00-08:00`);
const vegasSwitch = {
  name: 'vegas-switch',
  transformIndexHtml: {
    order: 'pre',
    handler: (html) =>
      html
        .replace(/<!--vegas-(soon|open)-->([\s\S]*?)<!--\/vegas-\1-->/g, (_, phase, inner) =>
          (phase === 'open') === VEGAS_OPEN ? inner : '',
        ),
  },
};

// ---------------------------------------------------------------------------
// Sitemap is generated from the pages below on every build (never goes stale).
// 404 is left out; everything else is listed with today's date.
// ---------------------------------------------------------------------------
const SITE_URL = 'https://windowdude.com';
const sitemap = {
  name: 'sitemap',
  apply: 'build',
  closeBundle() {
    const today = new Date().toISOString().slice(0, 10);
    const urls = Object.keys(PAGES)
      .filter((p) => p !== '404.html')
      .map((p) => `${SITE_URL}/${p.replace(/index\.html$/, '')}`)
      .map((loc) => `  <url><loc>${loc}</loc><lastmod>${today}</lastmod></url>`)
      .join('\n');
    writeFileSync(
      resolve(root, 'dist/sitemap.xml'),
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    );
  },
};

// Vite only builds /index.html by default — every page must be listed here.
// When you add a page: create /<folder>/index.html, then add a line below.
// (The sitemap and the SEO check pick it up automatically.)
const PAGES = {
  'index.html': 'home',
  'about/index.html': 'about',
  'las-vegas/index.html': 'lasVegas',
  'trusted-pros/index.html': 'trustedPros',
  'privacy-policy/index.html': 'privacyPolicy',
  '404.html': 'notFound',
};

export default defineConfig({
  base: '/',
  plugins: [vegasSwitch, versionAssets, sitemap],
  define: {
    // Shown on the home page so you can confirm a deploy actually went live
    __BUILD_TIME__: JSON.stringify(
      new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
    ),
    __VEGAS_OPEN__: JSON.stringify(VEGAS_OPEN),
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
      input: Object.fromEntries(Object.entries(PAGES).map(([file, name]) => [name, resolve(root, file)])),
    },
  },
});
