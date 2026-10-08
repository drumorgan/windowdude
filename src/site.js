// Shared header, nav, footer, and visible error reporting.
// Edit the nav, contact info, and footer HERE — every page uses this file.
import './styles.css';

// ---------------------------------------------------------------------------
// Site settings — edit these
// ---------------------------------------------------------------------------
const SITE = {
  name: 'Window Dude',
  tagline: 'Rebuilding the economy… one window at a time.',
  phone: '(818) 584-1969',
  phoneHref: 'tel:+18185841969',
  smsHref: 'sms:+18185841969',
  email: 'info@windowdude.com',
  serviceArea: 'Woodland Hills & Southern California, since 2010',
  // Customer Factor online quote form (used by every "Get a Quote" button)
  quoteHref: 'https://www.thecustomerfactor.com/new/bid.php?id=d2luZG93ZHVkZQ==',
};

const NAV = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about/' },
  { label: 'News', href: '/news/' },
  { label: 'Instagram', href: '/instagram/' },
  { label: 'Privacy Policy', href: '/privacy-policy/' },
];

// Social links from the old site's footer. TODO: paste the real URLs.
// An entry with an empty url is hidden, so there are never broken links.
const SOCIAL = [
  { label: 'Facebook', url: '' },
  { label: 'Instagram', url: '' },
  { label: 'Yelp', url: '' },
];

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
        <!-- TODO: swap for real logo: <img src="/images/logo.png" alt="Window Dude"> -->
        <span class="brand-mark" aria-hidden="true">〰</span>
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
        ${NAV.map(({ label, href }) => `<li><a href="${href}">${label}</a></li>`).join('')}
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

  // Fill any [data-phone] / [data-email] links on the page from SITE
  document.querySelectorAll('[data-phone]').forEach((a) => {
    a.href = a.dataset.phone === 'sms' ? SITE.smsHref : SITE.phoneHref;
    a.textContent = SITE.phone;
  });
  document.querySelectorAll('[data-email]').forEach((a) => {
    a.href = `mailto:${SITE.email}`;
    a.textContent = SITE.email;
  });

  // Mobile menu toggle
  const toggle = header.querySelector('.nav-toggle');
  const nav = header.querySelector('.site-nav');
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    nav.classList.toggle('is-open', !open);
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
