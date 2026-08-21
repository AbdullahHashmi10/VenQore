// ═══════════════════════════════════════════════════════════════════════════
// VenQore V6 — page shell. Every public page is assembled from this file so
// the header and footer are literally the same markup everywhere.
// ═══════════════════════════════════════════════════════════════════════════

export const SITE = {
  name: 'VenQore',
  // The category line. Say it the same way every time. — Copy Bible §1.2
  category: 'The AI ERP builder.',
  year: 2026,
};

export const icon = (name, size = 18) => {
  const p = {
    arrow:      '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    arrowDown:  '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
    chev:       '<path d="m6 9 6 6 6-6"/>',
    chevR:      '<path d="m9 18 6-6-6-6"/>',
    check:      '<path d="M20 6 9 17l-5-5"/>',
    x:          '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    minus:      '<path d="M5 12h14"/>',
    spark:      '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>',
    ledger:     '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/><path d="M9 7h6"/><path d="M9 11h4"/>',
    scan:       '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/>',
    sync:       '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
    chat:       '<path d="M12 6V2H8"/><rect width="16" height="12" x="4" y="6" rx="2"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M15 11v2"/><path d="M9 11v2"/>',
    signal:     '<path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/><path d="M22 4v16"/>',
    cart:       '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
    box:        '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
    truck:      '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
    users:      '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    building:   '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>',
    chart:      '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
    plug:       '<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/>',
    shield:     '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    lock:       '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    pill:       '<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/>',
    coffee:     '<path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1z"/><path d="M6 2v2"/><path d="M17 9h1a3 3 0 0 1 0 6h-1"/>',
    wrench:     '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    store:      '<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2 2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"/>',
    layers:     '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/>',
    clock:      '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    globe:      '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    mail:       '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    mic:        '<path d="M12 19v3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><rect x="9" y="2" width="6" height="13" rx="3"/>',
    search:     '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    grid:       '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
    settings:   '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2"/><circle cx="12" cy="12" r="3"/>',
    sun:        '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
    moon:       '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    menu:       '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>',
    play:       '<polygon points="6 3 20 12 6 21 6 3"/>',
    file:       '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
    percent:    '<line x1="19" x2="5" y1="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
    branch:     '<line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
    factory:    '<path d="M12 16h.01"/><path d="M16 16h.01"/><path d="M3 19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7.5a.5.5 0 0 0-.769-.422l-4.462 2.844A.5.5 0 0 1 15 9.5v-2a.5.5 0 0 0-.769-.422L9.77 9.922A.5.5 0 0 1 9 9.5V3.5a.5.5 0 0 0-.5-.5h-3a2 2 0 0 0-2 2Z"/><path d="M8 16h.01"/>',
  }[name] || '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
};

// ── Nav — five links + two buttons. Seven links in a row reads as an
//    agency site, not a product. — Copy Bible §10
const nav = (active) => {
  const on = (k) => (active === k ? ' aria-current="page"' : '');
  return `
      <nav class="vq-nav" aria-label="Main">
        <ul class="vq-nav__list">
          <li class="vq-nav__item">
            <a href="blueprint.html" class="vq-nav__link"${on('product')}>Product ${icon('chev', 12)}</a>
            <div class="vq-mega">
              <div class="vq-mega__grid">
                <div class="vq-mega__col">
                  <span class="vq-eyebrow vq-eyebrow--accent">Build</span>
                  <a class="vq-mega__link" href="blueprint.html"><b>Blueprint</b><span>Describe your business. Approve the plan.</span></a>
                  <a class="vq-mega__link" href="index.html#presets"><b>Industry presets</b><span>Start from a system that already fits.</span></a>
                  <a class="vq-mega__link" href="onboarding.html"><b>See a build</b><span>Watch the four-minute version.</span></a>
                </div>
                <div class="vq-mega__col">
                  <span class="vq-eyebrow vq-eyebrow--accent">Run</span>
                  <a class="vq-mega__link" href="ledger.html"><b>Core Ledger</b><span>One engine. Every number. No exceptions.</span></a>
                  <a class="vq-mega__link" href="features.html#selling"><b>Point of sale &amp; stock</b><span>The counter, and what is behind it.</span></a>
                  <a class="vq-mega__link" href="features.html#channels"><b>VenSynQ</b><span>Sell in five places. Count stock once.</span></a>
                </div>
              </div>
              <div class="vq-mega__foot">
                <a class="vq-link" href="features.html">See everything inside ${icon('arrow', 15)}</a>
              </div>
            </div>
          </li>
          <li class="vq-nav__item">
            <a href="index.html#presets" class="vq-nav__link">Solutions ${icon('chev', 12)}</a>
            <div class="vq-mega" style="min-width:420px">
              <div class="vq-mega__grid">
                <div class="vq-mega__col">
                  <a class="vq-mega__link" href="index.html#presets"><b>Retail shop</b><span>Fast checkout, real margins.</span></a>
                  <a class="vq-mega__link" href="index.html#presets"><b>Wholesale &amp; distribution</b><span>Credit terms and price tiers.</span></a>
                  <a class="vq-mega__link" href="index.html#presets"><b>Pharmacy</b><span>Batch and expiry that hold the line.</span></a>
                </div>
                <div class="vq-mega__col">
                  <a class="vq-mega__link" href="index.html#presets"><b>Restaurant &amp; café</b><span>Recipes that draw down ingredients.</span></a>
                  <a class="vq-mega__link" href="index.html#presets"><b>Hardware &amp; auto parts</b><span>Deep catalogues, real costing.</span></a>
                  <a class="vq-mega__link" href="index.html#presets"><b>Multi-branch</b><span>One truth across every location.</span></a>
                </div>
              </div>
            </div>
          </li>
          <li class="vq-nav__item"><a href="pricing.html" class="vq-nav__link"${on('pricing')}>Pricing</a></li>
          <li class="vq-nav__item"><a href="features.html" class="vq-nav__link"${on('features')}>Features</a></li>
          <li class="vq-nav__item">
            <a href="about.html" class="vq-nav__link"${on('company')}>Company ${icon('chev', 12)}</a>
            <div class="vq-mega" style="min-width:320px">
              <div class="vq-mega__grid" style="grid-template-columns:1fr">
                <div class="vq-mega__col">
                  <a class="vq-mega__link" href="about.html"><b>About</b><span>Built on a shop counter in Okara.</span></a>
                  <a class="vq-mega__link" href="ledger.html"><b>How we prove it</b><span>The checks we publish.</span></a>
                  <a class="vq-mega__link" href="contact.html"><b>Contact</b><span>A person answers this one.</span></a>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </nav>`;
};

export const header = ({ active = '', onHero = false } = {}) => `
  <a class="vq-skip" href="#main">Skip to content</a>
  <header class="vq-header${onHero ? ' vq-header--onHero' : ''}" data-header>
    <div class="vq-header__inner">
      <a class="vq-brand" href="index.html" aria-label="VenQore home">
        <img src="assets/logo.png" alt="" width="30" height="30">
        <span class="vq-brand__word">VenQore</span>
      </a>
${nav(active)}
      <div class="vq-header__actions">
        <button class="vq-theme-btn" data-theme-toggle type="button" aria-label="Switch theme">
          <span class="vq-icon-sun">${icon('sun', 17)}</span><span class="vq-icon-moon">${icon('moon', 17)}</span>
        </button>
        <a href="signin.html" class="vq-nav__link">Sign in</a>
        <a href="register.html" class="vq-btn vq-btn--primary">Start building <span class="vq-btn__arrow">${icon('arrow', 15)}</span></a>
      </div>
      <button class="vq-burger" type="button" data-menu-open aria-label="Open menu" aria-expanded="false">${icon('menu', 24)}</button>
    </div>
  </header>
  <div class="vq-mobile" data-menu hidden>
    <button class="vq-burger" type="button" data-menu-close aria-label="Close menu"
            style="position:absolute;top:24px;right:20px">${icon('x', 24)}</button>
    <a href="blueprint.html">Blueprint</a>
    <a href="ledger.html">Core Ledger</a>
    <a href="features.html">Features</a>
    <a href="pricing.html">Pricing</a>
    <a href="about.html">About</a>
    <a href="contact.html">Contact</a>
    <div class="vq-mobile__actions">
      <a href="signin.html" class="vq-btn vq-btn--secondary vq-btn--lg vq-btn--block">Sign in</a>
      <a href="register.html" class="vq-btn vq-btn--primary vq-btn--lg vq-btn--block">Start building <span class="vq-btn__arrow">${icon('arrow', 16)}</span></a>
    </div>
  </div>`;

// ── Footer — preserved from extras/Hero Section, structure unchanged ─────
export const footer = ({ cta = true } = {}) => `
  <footer class="vq-footer">
    <div class="footer-bg"></div>
    ${cta ? `
    <div class="vq-container" style="position:relative;z-index:10;padding-bottom:var(--vq-space-16)">
      <div class="mesh-gradient-card" style="border-radius:var(--vq-r-2xl);padding:clamp(32px,5vw,56px);border:1px solid rgb(255 255 255 / .10);box-shadow:var(--vq-elev-3)">
        <div style="max-width:36rem">
          <h2 class="vq-h2" style="color:#fff">Describe your business. See what it becomes.</h2>
          <p class="vq-lede vq-mt-3" style="color:rgb(255 255 255 / .74)">Free to try. No card. You'll see your whole system before you decide anything.</p>
          <form class="vq-row vq-wrap vq-gap-3 vq-mt-8" data-waitlist style="max-width:520px">
            <input type="email" class="vq-input" required placeholder="you@company.com" aria-label="Work email"
                   style="flex:1 1 240px;background:rgb(0 0 0 / .35);border-color:rgb(255 255 255 / .16);color:#fff">
            <button type="submit" class="vq-btn vq-btn--lg vq-btn--light">Start building</button>
          </form>
          <p class="vq-caption vq-mt-4" style="color:rgb(255 255 255 / .55)">Takes about four minutes. Nothing goes live until you approve it.</p>
        </div>
      </div>
    </div>` : ''}

    <div class="vq-container" style="position:relative;z-index:10;padding-bottom:var(--vq-space-20)">
      <div style="display:flex;flex-direction:column;gap:var(--vq-space-12)" class="vq-foot-cols">
        <div style="display:grid;gap:var(--vq-space-8);grid-template-columns:repeat(auto-fit,minmax(150px,1fr));flex:1">
          <div>
            <h3 class="vq-footer__head">Product</h3>
            <ul style="margin-top:var(--vq-space-4);display:flex;flex-direction:column;gap:var(--vq-space-3)">
              <li><a href="blueprint.html">Blueprint</a></li>
              <li><a href="ledger.html">Core Ledger</a></li>
              <li><a href="features.html">Features</a></li>
              <li><a href="pricing.html">Pricing</a></li>
            </ul>
          </div>
          <div>
            <h3 class="vq-footer__head">Company</h3>
            <ul style="margin-top:var(--vq-space-4);display:flex;flex-direction:column;gap:var(--vq-space-3)">
              <li><a href="about.html">About</a></li>
              <li><a href="contact.html">Contact</a></li>
              <li><a href="/blog">Blog</a></li>
              <li><a href="/roadmap">Roadmap</a></li>
            </ul>
          </div>
          <div>
            <h3 class="vq-footer__head">Resources</h3>
            <ul style="margin-top:var(--vq-space-4);display:flex;flex-direction:column;gap:var(--vq-space-3)">
              <li><a href="/docs">Documentation</a></li>
              <li><a href="/help">Help centre</a></li>
              <li><a href="onboarding.html">See a build</a></li>
              <li><a href="signin.html">Sign in</a></li>
            </ul>
          </div>
          <div>
            <h3 class="vq-footer__head">Social</h3>
            <div style="margin-top:var(--vq-space-4);display:flex;gap:var(--vq-space-3)">
              <a class="vq-footer__social" href="#" aria-label="Facebook"><svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>
              <a class="vq-footer__social" href="#" aria-label="X"><svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg></a>
              <a class="vq-footer__social" href="#" aria-label="LinkedIn"><svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg></a>
            </div>
          </div>
        </div>
      </div>

      <div style="margin-top:var(--vq-space-12);padding-top:var(--vq-space-8);border-top:1px solid rgb(255 255 255 / .08);display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:var(--vq-space-4);padding-bottom:14vw">
        <p class="vq-small" style="color:var(--vq-ink-500);max-width:none">© ${SITE.year} VenQore, Inc. ${SITE.category}</p>
        <div style="display:flex;gap:var(--vq-space-6)">
          <a class="vq-small" href="/terms">Terms</a>
          <a class="vq-small" href="/privacy">Privacy</a>
          <a class="vq-small" href="/cookies">Cookies</a>
        </div>
      </div>

      <div class="watermark-wrapper"><span>VenQore</span></div>
    </div>
  </footer>`;

export const page = ({
  title, description, active = '', body, onHero = false,
  bare = false, canvas = false, cta = true, extraHead = '', extraBody = '',
}) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5">
<title>${title}</title>
<meta name="description" content="${description}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="VenQore">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0BAA8F">
<link rel="icon" href="assets/logo.png">
<link rel="stylesheet" href="assets/venqore.css">
<script>
/* Theme before paint — no flash. */
(function(){try{var r=document.documentElement,t=r.getAttribute('data-theme')||localStorage.getItem('vq-theme');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';r.setAttribute('data-theme',t);r.classList.toggle('dark',t==='dark');}catch(e){}})();
</script>
${extraHead}
</head>
<body${bare ? ' class="vq-bare"' : ''}>
${canvas ? '<canvas id="fluid-canvas" aria-hidden="true"></canvas>' : ''}
${bare ? '' : header({ active, onHero })}
<main id="main">
${body}
</main>
${bare ? '' : footer({ cta })}
<script src="assets/venqore.js" defer></script>
${extraBody}
</body>
</html>
`;
