// Shared header, nav, footer, and visible error reporting.
// Edit the nav, contact info, and footer HERE — every page uses this file.
import './styles.css';

// ---------------------------------------------------------------------------
// Site settings — edit these
// ---------------------------------------------------------------------------
const SITE = {
  name: 'Window Dude',
  tagline: 'Spotless windows, one window at a time.',
  phone: '(818) 584-1969',
  phoneHref: 'tel:+18185841969',
  smsHref: 'sms:+18185841969',
  email: 'info@windowdude.com',
  hours: 'Mon–Fri 7 AM–5 PM',
  // Customer Factor online quote form (used by every "Get a Quote" button)
  quoteHref: 'https://www.thecustomerfactor.com/new/bid.php?id=d2luZG93ZHVkZQ==',
};

// ---------------------------------------------------------------------------
// Cities — each has its own home page, menu, footer text and city bar.
// Pages under /las-vegas/ are Vegas; /, /trusted-pros/ are LA. Shared pages
// (About, Privacy, 404) use the city the visitor last browsed.
// ---------------------------------------------------------------------------
const CITIES = {
  la: {
    home: '/',
    // City only — never publish the street address (it's a home)
    serviceArea: 'Based in Woodland Hills / Calabasas, CA · Serving Los Angeles & Ventura Counties since 2010',
    bar: '📍 <strong>Los Angeles<span class="wide-only"> &amp; Ventura Counties</span></strong>',
    switchTo: 'vegas',
    switchLabel: __VEGAS_OPEN__ ? 'Las Vegas →' : 'Las Vegas<span class="wide-only">: booking now for January 2027</span> →',
    nav: [
      { label: 'Services', href: '/#services' },
      { label: 'How It Works', href: '/#how-it-works' },
      { label: 'Reviews', href: '/#reviews' },
      { label: 'About', href: '/about/' },
      { label: 'Trusted Pros', href: '/trusted-pros/' },
      { label: 'FAQ', href: '/#faq' },
    ],
    footer: [
      { label: 'Los Angeles', href: '/' },
      { label: 'Las Vegas', href: '/las-vegas/' },
      { label: 'About', href: '/about/' },
      { label: 'Trusted Pros', href: '/trusted-pros/' },
    ],
  },
  vegas: {
    home: '/las-vegas/',
    serviceArea: __VEGAS_OPEN__
      ? 'Serving Las Vegas, Henderson, Summerlin & the valley · Window Dude since 2010'
      : 'Las Vegas, Henderson, Summerlin & the valley · Booking now, service starts January 2027',
    bar: __VEGAS_OPEN__
      ? '📍 <strong>Las Vegas</strong>'
      : '📍 <strong>Las Vegas</strong><span class="wide-only"> · Booking now, service starts January 2027</span>',
    switchTo: 'la',
    switchLabel: 'Los Angeles →',
    nav: [
      { label: 'Services', href: '/las-vegas/#services' },
      { label: 'Why Us', href: '/las-vegas/#why' },
      { label: 'Reviews', href: '/las-vegas/#reviews' },
      { label: 'Areas', href: '/las-vegas/#areas' },
      { label: 'About', href: '/about/' },
      { label: 'FAQ', href: '/las-vegas/#faq' },
    ],
    footer: [
      { label: 'Las Vegas', href: '/las-vegas/' },
      { label: 'Los Angeles', href: '/' },
      { label: 'About', href: '/about/' },
    ],
  },
};

// Every page links the Privacy Policy (required for SMS approval)
const FOOTER_ALWAYS = [{ label: 'Privacy Policy & SMS Terms', href: '/privacy-policy/' }];

function currentCity() {
  const path = location.pathname;
  let city = null;
  if (path.startsWith('/las-vegas')) city = 'vegas';
  else if (path === '/' || path === '/index.html' || path.startsWith('/trusted-pros')) city = 'la';
  try {
    if (city) localStorage.setItem('wd-city', city);
    else city = localStorage.getItem('wd-city');
  } catch {
    // storage blocked (private browsing): fall back to LA below
  }
  return CITIES[city] ? city : 'la';
}
const CITY = currentCity();
const C = CITIES[CITY];

// Social links shown in the footer.
// An entry with an empty url is hidden, so there are never broken links.
const SOCIAL = [
  { label: 'Instagram', url: 'https://www.instagram.com/windowdude/' },
  { label: 'Facebook', url: 'https://www.facebook.com/profile.php?id=61556234381467' },
  { label: 'Yelp', url: 'https://www.yelp.com/biz/window-dude-calabasas' },
  { label: 'Nextdoor', url: 'https://nextdoor.com/page/window-dude-los-angeles-ca/' },
  { label: 'Google', url: 'https://maps.app.goo.gl/cA7P4vrbMtR3bqzT9' }, // Google Business Profile
];

// Logo files live in public/images/ (logo-mark.png = header, logo-white.png = footer)
const MUSTACHE = `<img class="brand-mark" src="/images/logo-mark.png" alt="" width="277" height="112" />`;

// ---------------------------------------------------------------------------
// Toast — visible messages (no console needed)
// ---------------------------------------------------------------------------
let toastHost;

export function showToast(message, type = 'info', ms = 6000) {
  if (!toastHost) {
    toastHost = document.createElement('div');
    toastHost.className = 'toast-host';
    toastHost.setAttribute('role', 'status');
    toastHost.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastHost);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  toast.addEventListener('click', () => toast.remove());
  toastHost.appendChild(toast);
  if (ms) setTimeout(() => toast.remove(), ms);
}

// Errors also collect in a <details> block at the bottom of the page so you
// can read the full text after the toast disappears.
function reportError(label, err) {
  const text = err && err.stack ? err.stack : String(err);
  showToast(`${label}: ${err && err.message ? err.message : text}`, 'error', 10000);

  let box = document.getElementById('error-log');
  if (!box) {
    box = document.createElement('details');
    box.id = 'error-log';
    box.className = 'error-log';
    box.innerHTML = '<summary>Page errors (tap to view)</summary><pre></pre>';
    document.body.appendChild(box);
  }
  box.querySelector('pre').textContent += `[${new Date().toLocaleTimeString()}] ${label}\n${text}\n\n`;
}

window.addEventListener('error', (e) => reportError('Error', e.error || e.message));
window.addEventListener('unhandledrejection', (e) => reportError('Promise error', e.reason));

// ---------------------------------------------------------------------------
// Header / footer
// ---------------------------------------------------------------------------
function normalize(path) {
  return path.replace(/index\.html$/, '').replace(/\/?$/, '/');
}

function headerHTML() {
  const here = normalize(location.pathname);
  const links = C.nav.map(({ label, href }) => {
    const current = normalize(href) === here ? ' aria-current="page"' : '';
    return `<li><a href="${href}"${current}>${label}</a></li>`;
  }).join('');

  return `
    <div class="container header-inner">
      <a class="brand" href="${C.home}" aria-label="${SITE.name} home">
        ${MUSTACHE}
        <span class="brand-name">${SITE.name}</span>
      </a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">
        <span class="nav-toggle-bars" aria-hidden="true"></span>
        <span class="visually-hidden">Menu</span>
      </button>
      <nav id="site-nav" class="site-nav" aria-label="Main">
        <ul>${links}</ul>
        <a class="btn btn--cta" href="${SITE.quoteHref}" data-quote>Get a Quote</a>
      </nav>
    </div>`;
}

function footerHTML() {
  const year = new Date().getFullYear();
  const social = SOCIAL.filter((s) => s.url)
    .map(({ label, url }) => `<li><a href="${url}" target="_blank" rel="noopener">${label}</a></li>`)
    .join('');
  return `
    <div class="container footer-inner">
      <div>
        <img class="footer-logo" src="/images/logo-white.png" alt="${SITE.name}" width="277" height="188" loading="lazy" />
        <p>${SITE.tagline}</p>
        <p>${C.serviceArea}</p>
      </div>
      <div>
        <p><a href="${SITE.phoneHref}">${SITE.phone}</a></p>
        <p><a href="mailto:${SITE.email}">${SITE.email}</a></p>
        <p>${SITE.hours}</p>
      </div>
      <ul class="footer-links">
        ${[...C.footer, ...FOOTER_ALWAYS].map(({ label, href }) => `<li><a href="${href}">${label}</a></li>`).join('')}
        ${social}
      </ul>
      <p class="footer-copy">&copy; ${year} ${SITE.name}. All rights reserved.
        <span class="build-stamp">Build ${__BUILD_TIME__}</span></p>
    </div>`;
}

function mount() {
  const header = document.getElementById('site-header');
  const footer = document.getElementById('site-footer');
  if (!header || !footer) {
    reportError('Layout', new Error('Page is missing #site-header or #site-footer'));
    return;
  }
  header.innerHTML = headerHTML();
  footer.innerHTML = footerHTML();

  // City bar above the header: shows the current city and switches to the other.
  // Wording flips on launch day via the switch in vite.config.js.
  const cityBar = document.createElement('div');
  cityBar.className = 'citybar';
  cityBar.innerHTML = `
    <div class="container citybar-inner">
      <span>${C.bar}</span>
      <a href="${CITIES[C.switchTo].home}">${C.switchLabel}</a>
    </div>`;
  header.before(cityBar);

  // Point any [data-phone] / [data-email] links at SITE (link text is left as written)
  document.querySelectorAll('[data-phone]').forEach((a) => {
    a.href = a.dataset.phone === 'sms' ? SITE.smsHref : SITE.phoneHref;
  });
  document.querySelectorAll('[data-email]').forEach((a) => {
    a.href = `mailto:${SITE.email}`;
  });

  // Sticky "Text Us / Free Quote" bar on phones
  const bar = document.createElement('div');
  bar.className = 'action-bar';
  bar.innerHTML = `
    <a class="btn btn--ghost" href="${SITE.smsHref}">Text Us</a>
    <a class="btn btn--cta" href="${SITE.quoteHref}" data-quote>Free Quote</a>`;
  document.body.appendChild(bar);
  document.body.classList.add('has-action-bar');

  // Mobile menu toggle
  const toggle = header.querySelector('.nav-toggle');
  const nav = header.querySelector('.site-nav');
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    nav.classList.toggle('is-open', !open);
  });
  // Close the mobile menu after tapping a link (e.g. /#services on the home page)
  nav.addEventListener('click', (e) => {
    if (!e.target.closest('a')) return;
    toggle.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
  });

  // Point every quote button at SITE.quoteHref, so it's edited in one place
  document.querySelectorAll('[data-quote]').forEach((a) => {
    a.href = SITE.quoteHref;
  });
}

try {
  mount();
} catch (err) {
  reportError('Header/footer failed', err);
}
