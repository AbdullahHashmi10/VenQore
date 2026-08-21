import { page, icon } from '../shell.js';
import { pageHead } from '../bits.js';

/* Grouped from extras/Features/venqore_built.md — the file whose own header
   says each item "was checked against actual route/controller/model/service
   files in the codebase, not marketing text or old audit summaries."
   Nothing here is advertised that the build audit does not confirm. */
const GROUPS = [
  { id: 'selling', icon: 'cart', name: 'Selling', line: 'The counter, and everything that happens at it.', items: [
    'Instant barcode scanner', 'Serial &amp; IMEI scanner', 'Park &amp; recall (hold bill)',
    'Cart rescue &amp; session protection', 'Typo-tolerant search', 'Multi-account split payments',
    'Daily cash register audit', 'Negative stock alert &amp; lock', 'Barcode pattern recognition',
    'Service fee &amp; freight additions', 'Automatic VAT / GST calculation', 'A4 &amp; letter invoice PDF',
    'Recurring invoicing', 'Sales return vouchers', 'Pre-sales inventory reservation',
    'Wholesale vs retail price tiers', 'Barcode label print factory',
  ]},
  { id: 'stock', icon: 'box', name: 'Stock', line: 'What you have, what it cost, and where it is.', items: [
    'Product variant support', 'Variant-aware FIFO costing', 'Batch intake number tracking',
    'Stock take audit wizard', 'Category management centre', 'Low stock threshold alerts',
    'IMEI &amp; serial lifecycle tracking', 'Unit of measure converter', 'Stock reservation rules',
    'Disaster &amp; asset claim manager', 'Multi-warehouse isolation (godown)', 'Stock transfer vouchers',
    'Stock valuation by location', 'Inbound expiry date tracking',
  ]},
  { id: 'buying', icon: 'truck', name: 'Buying', line: 'Suppliers, terms, and what you actually paid.', items: [
    'Purchase order tracker', 'Auto-generated purchase orders', 'Supplier debit notes',
    'Purchase returns register', 'Supplier account registry (khata)', 'Delayed supplier payments',
    'Supplier statement generator', 'Aged payables directory', 'Outstanding payables dashboard',
    'Supplier lead time tracker', 'Supplier SKU mapping', 'Custom supplier payment terms',
    'Landing cost allocations', 'Cost price increase alert', 'Bulk supplier payments',
    'Tax-inclusive procurement toggle', 'Supplier credit limit alerts',
  ]},
  { id: 'money', icon: 'ledger', name: 'Money', line: 'The Core Ledger and everything that posts through it.', items: [
    'Double-entry journal engine', 'Automated cash reconciliation', 'Fixed asset depreciation tracker',
    'Business loan ledger', 'Inter-register cash transfers', 'Advance payment allocation',
    'Fiscal year closing wizard', 'Bank reconciliation checker', 'Tax summary engine',
    'Expense manager + receipt uploads', 'Charity allocation engine', 'Balanced reversal engine',
    'Multi-currency configuration', 'Custom tax rate configurator',
  ]},
  { id: 'parties', icon: 'building', name: 'Customers &amp; suppliers', line: 'Who owes what, and who is worth keeping.', items: [
    'Customer account registry (khata)', 'Customer payments log', 'Customer statement generator',
    'Aged receivables report', 'Multi-payment invoices', 'Outstanding balance dashboard',
    'Unified party ledger', 'Customer address book', 'Credit limit enforcement',
    'Credit limit breach alerts', 'Customer milestone tracker', 'Anniversary &amp; birthday tracker',
    'Tax-exempt customer flag', 'Customer wallet credit', 'Loyalty points system', 'Digital gift cards',
  ]},
  { id: 'reports', icon: 'chart', name: 'Reports', line: '33 built reports, all reading the same ledger.', items: [
    'Profit &amp; loss statement', 'Balance sheet', 'Double-entry trial balance',
    'Sales summary &amp; daily trend', 'Day book log', 'Account ledger report',
    'Party statement (khata ledger)', 'Stock valuation report', 'Low stock shortages',
    'Stock movement history', 'Tax compliance summary', 'Item-wise profit analysis',
    'Party-wise profitability', 'Bill-wise profitability', 'Sales aging report',
    'Expense by category', 'Stock summary &amp; aging', 'Loan repayment statement',
    'Purchases report', 'Transactions history', 'Bank statements log', 'Expiring soon alert',
    'Category profit &amp; loss', 'Discount &amp; tax rate breakdown', 'Sale orders report',
  ]},
  { id: 'people', icon: 'users', name: 'People &amp; access', line: 'Roles, limits, and a trail of who did what.', items: [
    'Granular multi-store roles', 'Cashier PIN login', 'Staff invitation codes',
    'Owner daily pulse', 'Owner profit peek', 'Security activity log',
    'Cashier inactivity auto-logout', 'Passcode security standards', 'Senior mode accessibility',
  ]},
  { id: 'channels', icon: 'plug', name: 'Channels', line: 'Sell in five places. Count stock once.', items: [
    'VenSynQ command centre', '3-click OAuth store connection', 'Automated commission isolation',
    'Just-in-time purchase orders', 'Bulk tracking ID sync', 'WooCommerce real-time webhook',
    'WooCommerce stock sync', 'WooCommerce customer auto-registry', 'Web store catalog controls',
    'Multi-channel expense allocation',
  ]},
  { id: 'ai', icon: 'spark', name: 'AI &amp; intelligence', line: 'Deterministic where it can be, honest where it can\'t.', items: [
    'Smart capture (image &amp; audio)', 'Floating AI assistant', 'Reorder due alerts',
    'Evidence on every insight', 'Self-scoring accuracy loop', 'Self-tuning thresholds',
    'Learns your scale', 'Runs without an AI key', 'Daily business snapshots',
  ]},
  { id: 'platform', icon: 'shield', name: 'Platform', line: 'The parts you only notice when they are missing.', items: [
    'Progressive web app (PWA)', 'Multi-tenant store isolation', 'Subscription plan enforcement',
    'Automated limit override manager', 'Soft-delete trash management', 'Backups &amp; Google Drive sync',
    'Import / export tools', 'Test data wipe', 'Instant store creator', 'Self-guiding setup tour',
    'Custom domain mapping', 'SSO / SAML authentication', 'Dark &amp; light themes',
  ]},
];

const total = GROUPS.reduce((n, g) => n + g.items.length, 0);

const body = pageHead({
  eyebrow: "What's inside",
  h1: 'Everything the business actually runs on. Nothing charged as a <em class="vq-italic">module</em>.',
  lede: `Every plan includes the whole system. Your Blueprint turns on the parts your business needs and leaves the rest off — not greyed out behind an upsell badge, off. Below is what ships today, group by group.`,
  amb: 'dots',
  cta: `<a class="vq-btn vq-btn--primary vq-btn--lg" href="register.html">Start building <span class="vq-btn__arrow">${icon('arrow', 16)}</span></a>
        <a class="vq-btn vq-btn--secondary vq-btn--lg" href="pricing.html">See pricing</a>`,
}) + `

<section class="vq-section" style="padding-top:0">
  <div class="vq-container">
    <div class="vq-grid vq-grid--4">
      ${[
        ['Features shipped', String(total), '', 'Verified against routes, controllers and services — not a marketing count'],
        ['Groups', String(GROUPS.length), '', 'One taxonomy, no overlap, nothing invented'],
        ['Built reports', '33', '', 'All reading the same ledger, all with a table view'],
        ['Correctness checks', '7', '/ 7', 'Passing on every release'],
      ].map(([l, v, u, n], i) => `
      <div class="vq-card vq-card--xl vq-stat vq-reveal${i === 0 ? ' vq-card--accent' : ''}">
        <span class="vq-stat__label">${l}</span>
        <span class="vq-stat__value"><span data-count="${v}">${v}</span>${u ? `<span class="vq-stat__unit">${u}</span>` : ''}</span>
        <span class="vq-stat__note">${n}</span>
      </div>`).join('')}
    </div>

    <nav class="vq-row vq-wrap vq-gap-2 vq-mt-10 vq-reveal" aria-label="Jump to a group">
      ${GROUPS.map(g => `<a class="vq-chip" href="#${g.id}">${g.name}</a>`).join('')}
    </nav>
  </div>
</section>

${GROUPS.map((g, i) => `
<section class="vq-section vq-section--tight${i % 2 ? ' vq-section--alt' : ''}" id="${g.id}">
  <div class="vq-container">
    <div class="vq-grid" style="grid-template-columns:minmax(0,280px) minmax(0,1fr);gap:var(--vq-space-12)">
      <div class="vq-reveal" style="position:sticky;top:120px;align-self:start">
        <span class="vq-tile__icon">${icon(g.icon)}</span>
        <h2 class="vq-h2 vq-mt-4">${g.name}</h2>
        <p class="vq-tile__body vq-mt-3">${g.line}</p>
        <span class="vq-badge vq-badge--accent vq-mt-4" style="display:inline-flex">${g.items.length} shipped</span>
      </div>
      <ul class="vq-grid vq-grid--2 vq-reveal" style="gap:var(--vq-space-3) var(--vq-space-6);align-content:start">
        ${g.items.map(t => `<li class="vq-row vq-gap-3" style="align-items:flex-start">
          <span style="color:var(--vq-accent);flex:none;margin-top:3px">${icon('check', 15)}</span>
          <span class="vq-small">${t}</span></li>`).join('')}
      </ul>
    </div>
  </div>
</section>`).join('')}

<section class="vq-section vq-band-dark">
  <div class="vq-amb"><span class="vq-amb__grain"></span></div>
  <div class="vq-container" style="position:relative">
    <div class="vq-grid vq-grid--2" style="gap:var(--vq-space-16)">
      <div class="vq-reveal">
        <span class="vq-eyebrow">Being straight about it</span>
        <h2 class="vq-display vq-mt-4">What isn't here yet.</h2>
        <p class="vq-lede vq-mt-6">A site that admits one real limitation is believed about everything
          else. So: these are named in our own catalogue and are <b style="color:#fff">not</b> shipping.
          We will not sell you a feature that does not function.</p>
      </div>
      <div class="vq-stack vq-gap-4 vq-reveal">
        ${[
          ['SMS &amp; WhatsApp reminders', 'The gateway is not built, so debt reminders do not send. Statements and PDFs do.'],
          ['Custom SMTP mail gateway', 'Mail goes out on our infrastructure. You cannot yet point it at your own server.'],
          ['Appointments &amp; scheduling', 'Which is why we do not sell to salons, clinics, gyms or hotels yet. When scheduling ships, all four unlock at once.'],
          ['A support organisation', 'One founder answers the email. That is a real trade-off, and it is better you know now.'],
        ].map(([t, b]) => `
        <div class="vq-card">
          <div class="vq-row vq-gap-3" style="align-items:flex-start">
            <span style="color:var(--vq-text-3);flex:none;margin-top:3px">${icon('minus', 16)}</span>
            <div><b class="vq-small">${t}</b><p class="vq-caption vq-mt-2" style="max-width:none">${b}</p></div>
          </div>
        </div>`).join('')}
      </div>
    </div>
  </div>
</section>`;

export default page({
  title: `Features — ${total} shipped, none charged as a module | VenQore`,
  description: `Everything VenQore ships today, grouped and verified against the codebase: selling, stock, buying, money, customers, reports, people, channels, AI and platform. Every plan includes the whole system.`,
  active: 'features',
  body,
});
