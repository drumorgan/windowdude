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
  serviceArea: 'Serving Los Angeles & Ventura Counties since 2010',
  // Customer Factor online quote form (used by every "Get a Quote" button)
  quoteHref: 'https://www.thecustomerfactor.com/new/bid.php?id=d2luZG93ZHVkZQ==',
};

const NAV = [
  { label: 'Services', href: '/#services' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Reviews', href: '/#reviews' },
  { label: 'About', href: '/about/' },
  { label: 'FAQ', href: '/#faq' },
];

// Footer-only links (Privacy Policy must stay linked: required for SMS approval)
const FOOTER_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about/' },
  { label: 'Privacy Policy & SMS Terms', href: '/privacy-policy/' },
];

// Social links from the old site's footer. TODO: paste the real URLs.
// An entry with an empty url is hidden, so there are never broken links.
const SOCIAL = [
  { label: 'Instagram', url: 'https://www.instagram.com/windowdude/' }, // TODO: confirm handle
  { label: 'Facebook', url: '' },
  { label: 'Yelp', url: '' },
  { label: 'Google', url: '' },
];

// Mustache logo mark (inline SVG). TODO: swap for the real logo file when uploaded:
// <img src="/images/logo.png" alt="">
const MUSTACHE = `<svg class="brand-mark" viewBox="0 0 64 24" aria-hidden="true"><path fill="currentColor" d="M32 8.5C28.5 3 21 2 15.5 7.2 11.6 11 7.6 13.4 3 10.4 2.6 16.4 8.4 21.4 16.2 20.4 22.4 19.6 28 16.6 32 12.6 36 16.6 41.6 19.6 47.8 20.4 55.6 21.4 61.4 16.4 61 10.4 56.4 13.4 52.4 11 48.5 7.2 43 2 35.5 3 32 8.5Z"/></svg>`;

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
  const links = NAV.map(({ label, href }) => {
    const current = normalize(href) === here ? ' aria-current="page"' : '';
    return `<li><a href="${href}"${current}>${label}</a></li>`;
  }).join('');

  return `
    <div class="container header-inner">
      <a class="brand" href="/" aria-label="${SITE.name} home">
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
        <p class="footer-brand">${SITE.name}</p>
        <p>${SITE.tagline}</p>
        <p>${SITE.serviceArea}</p>
      </div>
      <div>
        <p><a href="${SITE.phoneHref}">${SITE.phone}</a></p>
        <p><a href="mailto:${SITE.email}">${SITE.email}</a></p>
      </div>
      <ul class="footer-links">
        ${FOOTER_LINKS.map(({ label, href }) => `<li><a href="${href}">${label}</a></li>`).join('')}
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
