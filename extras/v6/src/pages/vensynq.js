import { page, icon } from '../shell.js';
import { pageHead, spark } from '../bits.js';

const body = pageHead({
  eyebrow: 'VenSynQ',
  h1: 'Sell in five places. Count your stock <em class="vq-italic">once</em>.',
  lede: 'One catalogue behind your counter, your website, WooCommerce, Amazon and eBay. Orders land as sales, stock moves once, and every channel\'s commission is isolated so the margin you see is the margin you got.',
  amb: 'aurora',
  cta: `<a class="vq-btn vq-btn--primary vq-btn--lg" href="register.html">Start building <span class="vq-btn__arrow">${icon('arrow', 16)}</span></a>
        <a class="vq-btn vq-btn--secondary vq-btn--lg" href="pricing.html">Channel pricing</a>`,
}) + `

<section class="vq-section" style="padding-top:0">
  <div class="vq-container">
    <div class="vq-card vq-card--xl vq-reveal">
      <div class="vq-grid vq-grid--2" style="gap:var(--vq-space-10);align-items:center">
        <div>
          <span class="vq-eyebrow vq-eyebrow--accent">The failure this prevents</span>
          <h2 class="vq-h2 vq-mt-3">Overselling is a refund, a bad review and a customer you do not get back.</h2>
          <p class="vq-tile__body vq-mt-4">The last unit sells at the counter and on your website in the same minute,
            because the two systems reconcile overnight. VenSynQ has one stock number and every channel reads it —
            so the second sale is refused, not apologised for.</p>
        </div>
        <div>${spark([22, 28, 25, 36, 33, 44, 41, 55, 52, 66, 63, 78], 340, 110)}</div>
      </div>
    </div>
  </div>
</section>

<section class="vq-section vq-section--alt">
  <div class="vq-container">
    <div class="vq-section-head vq-reveal">
      <span class="vq-eyebrow">What is connected</span>
      <h2 class="vq-display">Five channels, one catalogue.</h2>
    </div>
    <div class="vq-grid vq-grid--3">
      ${[
        ['store', 'Your counter', 'Live', 'The register is a channel like any other. A sale at the till moves the same stock number a website order does.'],
        ['globe', 'Your web store', 'Live', 'Catalogue controls, per-channel pricing, and a QR menu for anyone who wants to browse before they buy.'],
        ['plug', 'WooCommerce', 'Live', 'Three-click OAuth, real-time webhooks, two-way stock, and customers registered into your book automatically.'],
        ['box', 'Amazon', 'Live', 'SP-API approved. Orders in as sales, bulk tracking IDs out, commission isolated from your margin.'],
        ['cart', 'eBay', 'Coming', 'Listing and order sync, on the same catalogue and the same stock number.'],
        ['chat', 'TikTok Shop', 'Coming', 'Same model again — one catalogue, one stock number, isolated commission.'],
      ].map(([ic, t, s, b]) => `
      <article class="vq-card vq-card--xl vq-tile vq-reveal">
        <div class="vq-row" style="justify-content:space-between">
          <span class="vq-tile__icon">${icon(ic)}</span>
          <span class="vq-badge ${s === 'Live' ? 'vq-badge--success' : 'vq-badge--soon'}">${s === 'Live' ? icon('check', 11) + ' Live' : 'Coming'}</span>
        </div>
        <h3 class="vq-tile__title">${t}</h3>
        <p class="vq-tile__body">${b}</p>
      </article>`).join('')}
    </div>
  </div>
</section>

<section class="vq-section vq-band-dark">
  <div class="vq-amb"><span class="vq-amb__beams"><i></i><i></i><i></i></span><span class="vq-amb__grain"></span></div>
  <div class="vq-container" style="position:relative">
    <div class="vq-section-head vq-reveal" style="max-width:800px">
      <span class="vq-eyebrow">The number that actually matters</span>
      <h2 class="vq-display">Your marketplace margin is not your shop margin.</h2>
      <p class="vq-lede">A 15% commission, a referral fee, a fulfilment charge and a returned unit are the difference
        between a channel you should grow and a channel you should close. Most systems book the gross and let you
        find out at the end of the quarter.</p>
    </div>
    <div class="vq-grid vq-grid--2">
      ${[
        ['Commission is isolated, per channel', 'It posts to its own account, not into cost of goods. Your item margin stays the item margin, and your channel cost is a line you can look at on its own.'],
        ['Fees follow the order that caused them', 'Referral, fulfilment, storage and return handling attach to the sale they came from — so channel profitability is a real figure, not an allocation.'],
        ['Just-in-time purchase orders', 'A channel order for something you do not hold raises the purchase order against the supplier who stocks it, with the lead time already known.'],
        ['One place to look', 'Sales by channel, spend by channel and margin by channel, over any of the eighteen period windows, against the right comparison.'],
      ].map(([t, b]) => `
      <div class="vq-card vq-card--xl vq-reveal">
        <h3 class="vq-h3" style="color:#fff">${t}</h3>
        <p class="vq-tile__body vq-mt-3">${b}</p>
      </div>`).join('')}
    </div>
  </div>
</section>

<section class="vq-section">
  <div class="vq-container">
    <div class="vq-section-head vq-reveal">
      <span class="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Setup</span>
      <h2 class="vq-display">Three clicks, then it runs.</h2>
    </div>
    <div class="vq-steps-big">
      ${[
        ['Connect', 'OAuth into the channel. No API keys to copy, no plugin to install on your store, no developer to hire for an afternoon.'],
        ['Map once', 'Match your catalogue to the listings you already have. Anything unmatched is shown, never guessed — you decide whether it is a new product or the same one under another name.'],
        ['Sell', 'Stock, prices and orders move both ways from that moment. A webhook, not a nightly job, so the gap where overselling happens does not exist.'],
      ].map(([t, b]) => `
      <div class="vq-bigstep vq-reveal">
        <h3 class="vq-h3">${t}</h3>
        <p class="vq-tile__body vq-mt-3">${b}</p>
      </div>`).join('')}
    </div>
    <div class="vq-card vq-card--xl vq-mt-12 vq-reveal">
      <div class="vq-row vq-wrap vq-gap-6" style="justify-content:space-between;align-items:center">
        <div>
          <span class="vq-eyebrow vq-eyebrow--accent">Priced per channel</span>
          <p class="vq-h3 vq-mt-2">$10 a month per connected store. Nothing for the one you already have.</p>
          <p class="vq-caption vq-mt-2" style="max-width:none">Your counter and your own web store are included in every plan.
            You pay for a marketplace only while you are selling on it.</p>
        </div>
        <a class="vq-btn vq-btn--primary vq-btn--lg" href="pricing.html">See pricing <span class="vq-btn__arrow">${icon('arrow', 16)}</span></a>
      </div>
    </div>
  </div>
</section>`;

export default page({
  title: 'VenSynQ — sell in five places, count stock once | VenQore',
  description: 'One catalogue behind your counter, your web store, WooCommerce, Amazon and eBay. Real-time webhooks, isolated commission, and a channel margin that is the real one.',
  active: 'product',
  body,
});
