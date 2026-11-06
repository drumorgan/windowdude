// SEO check of the built site (dist/). Runs after every build; any ❌ stops the
// deploy BEFORE anything is uploaded. Results also go to the GitHub run summary.
import { existsSync, readFileSync, readdirSync, statSync, appendFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = 'dist';
const SITE = 'https://windowdude.com';
const summary = process.env.GITHUB_STEP_SUMMARY;
const errors = [];
const lines = [];
const ok = (m) => lines.push(`✅ ${m}`);
const bad = (m) => { lines.push(`❌ ${m}`); errors.push(m); };

const htmlFiles = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? (f === 'assets' ? [] : htmlFiles(p)) : p.endsWith('.html') ? [p] : [];
});
const attr = (html, re) => (html.match(re) || [])[1];
const meta = (html, key) => attr(html, new RegExp(`<meta[^>]+(?:name|property)="${key}"[^>]+content="([^"]*)"`));
const urlPath = (file) => '/' + relative(DIST, file).replace(/\\/g, '/').replace(/index\.html$/, '');

const pages = htmlFiles(DIST);
const indexable = [];
const seen = { title: new Map(), description: new Map() };

for (const file of pages) {
  const html = readFileSync(file, 'utf8');
  const path = urlPath(file);
  const is404 = path === '/404.html';
  const where = is404 ? '404 page' : path;
  const before = errors.length;

  if (html.includes('<!--vegas-')) bad(`${where}: leftover Las Vegas switch marker`);
  const robots = meta(html, 'robots') || '';
  if (is404) {
    if (!robots.includes('noindex')) bad(`${where}: should be noindex`);
  } else {
    indexable.push(path);
    if (robots.includes('noindex')) bad(`${where}: is set to noindex (Google will hide it)`);
    const title = attr(html, /<title>([^<]*)<\/title>/);
    for (const [kind, value] of [['title', title], ['description', meta(html, 'description')]]) {
      if (!value) continue;
      if (seen[kind].has(value)) bad(`${where}: same ${kind} as ${seen[kind].get(value)} (each page needs its own)`);
      else seen[kind].set(value, where);
    }
    // City pages must keep their core search terms in title, main headline and description
    const KEYWORDS = { '/': /los angeles/i, '/las-vegas/': /las vegas/i };
    if (KEYWORDS[path]) {
      const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1]?.replace(/<[^>]+>/g, '') || '';
      for (const [kind, text] of [['title', title || ''], ['main headline (H1)', h1], ['description', meta(html, 'description') || '']]) {
        if (!/window cleaning/i.test(text) || !KEYWORDS[path].test(text)) bad(`${where}: ${kind} should say "window cleaning" and the city`);
      }
    }
    // Keep the cities separate: Vegas pages don't send people to LA-only pages,
    // and the LA business listing doesn't claim Vegas (it has its own listing).
    if (path.startsWith('/las-vegas/') && /href="\/trusted-pros\//.test(html)) bad(`${where}: links to the LA Trusted Pros page`);
    if (path === '/' && /"name": "(Las Vegas|Henderson|Clark County)/.test(html)) bad(`${where}: LA business listing names a Vegas area`);
    if (!title) bad(`${where}: missing <title>`);
    else if (title.length > 75) bad(`${where}: title is ${title.length} characters (keep it under 75)`);
    const desc = meta(html, 'description');
    if (!desc) bad(`${where}: missing meta description`);
    else if (desc.length < 40 || desc.length > 170) bad(`${where}: description is ${desc.length} characters (aim for 40–170)`);
    const canonical = attr(html, /<link rel="canonical" href="([^"]*)"/);
    if (canonical !== SITE + path) bad(`${where}: canonical is "${canonical}", expected "${SITE + path}"`);
    for (const k of ['og:title', 'og:description', 'og:url', 'og:image']) if (!meta(html, k)) bad(`${where}: missing ${k}`);
    const ogImg = meta(html, 'og:image');
    if (ogImg && !existsSync(join(DIST, ogImg.replace(SITE, '')))) bad(`${where}: og:image ${ogImg} doesn't exist`);
    const h1s = (html.match(/<h1[\s>]/g) || []).length;
    if (h1s !== 1) bad(`${where}: has ${h1s} <h1> headings (should be exactly 1)`);
  }
  for (const [, json] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(json); } catch (e) { bad(`${where}: structured data (JSON-LD) is invalid: ${e.message}`); }
  }
  for (const [img] of html.matchAll(/<img\b[^>]*>/g)) if (!/\balt="/.test(img)) bad(`${where}: image without alt text: ${img.slice(0, 80)}`);
  for (const [, href] of html.matchAll(/href="(\/[^"#?]*)/g)) {
    if (href.startsWith('/assets/')) continue;
    const target = join(DIST, href.endsWith('/') ? href + 'index.html' : href);
    if (!existsSync(target)) bad(`${where}: broken link to ${href}`);
  }
  if (errors.length === before) ok(`${where}`);
}

// Sitemap must list exactly the indexable pages; robots.txt must point to it
const sm = existsSync(join(DIST, 'sitemap.xml')) ? readFileSync(join(DIST, 'sitemap.xml'), 'utf8') : '';
const listed = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(SITE, '')).sort();
const want = [...indexable].sort();
if (JSON.stringify(listed) === JSON.stringify(want)) ok(`sitemap.xml lists all ${want.length} pages`);
else bad(`sitemap.xml lists [${listed}] but pages are [${want}]`);
const robotsTxt = existsSync(join(DIST, 'robots.txt')) ? readFileSync(join(DIST, 'robots.txt'), 'utf8') : '';
if (robotsTxt.includes(`Sitemap: ${SITE}/sitemap.xml`) && !/Disallow:\s*\/\s*$/m.test(robotsTxt)) ok('robots.txt allows crawling and points to the sitemap');
else bad('robots.txt blocks crawling or is missing the sitemap line');

console.log(lines.join('\n'));
if (summary) appendFileSync(summary, `## SEO check\n${lines.map((l) => `- ${l}`).join('\n')}\n`);
if (errors.length) {
  console.error(`\n${errors.length} SEO problem(s). Nothing was uploaded.`);
  process.exit(1);
}
