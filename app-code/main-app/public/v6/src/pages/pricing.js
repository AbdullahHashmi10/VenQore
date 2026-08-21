import { page, icon } from '../shell.js';
import { pageHead } from '../bits.js';

const PLANS = [
  { name: 'Starter', m: '$36', y: '$360', for: 'For a single shop getting everything into one place.',
    items: ['<b>1 branch</b>, up to <b>3 users</b>', 'Point of sale, inventory, purchasing',
            'Core Ledger + every financial report', 'Blueprint builder &amp; presets',
            'SmartCapture: 20 pages/month', 'Email support'] },
  { name: 'Growth', m: '$63', y: '$630', hot: true, for: 'For a business with more than one of something.',
    items: ['Up to <b>3 branches</b>, <b>10 users</b>', '<b>Everything in Starter, plus:</b>',
            'Multi-branch stock, pricing &amp; consolidated reporting', 'Approval chains &amp; custom roles',
            'Production / BOM', 'Signals (retention &amp; risk) and Vena',
            'SmartCapture: 60 pages/month', 'Priority support'] },
  { name: 'Scale', m: '$129', y: '$1,290', for: 'For multi-location businesses selling on more than one channel.',
    items: ['<b>10 branches</b>, <b>50 users</b>', '<b>Everything in Growth, plus:</b>',
            'VenSynQ multi-channel sync', 'Loyalty, gift cards, campaigns',
            'Full API access &amp; white-label', 'SmartCapture: 150 pages/month',
            'Onboarding session with the founder'] },
];

const MATRIX = [
  ['Product SKUs',                 '5,000', '20,000', '50,000'],
  ['Transactions per month',       'Unlimited', 'Unlimited', 'Unlimited'],
  ['Locations',                    '1', '3', '10'],
  ['Staff accounts',               '3', '10', '50'],
  ['AI pages included / month',    '20', '60', '150'],
  ['AI assistant queries / month', '100', '400', '1,000'],
  ['SEP', '', '', ''],
  ['Point of sale, offline mode, barcode, receipts', '✓', '✓', '✓'],
  ['Core Ledger, P&amp;L, trial balance, balance sheet', '✓', '✓', '✓'],
  ['Customer &amp; supplier khata, receivables, payables', '✓', '✓', '✓'],
  ['Purchase orders &amp; supplier management', '✓', '✓', '✓'],
  ['Expense manager', '✓', '✓', '✓'],
  ['Reports', 'All 33', 'All 33', 'All 33'],
  ['Multi-branch &amp; stock transfer', '✗', '✓', '✓'],
  ['Production / BOM', '✗', '✓', '✓'],
  ['Loyalty, gift cards, campaigns', '✗', '✗', '✓'],
  ['API access &amp; white-label', '✗', '✗', '✓'],
  ['WooCommerce / Amazon sync', '$10/mo each', '$10/mo each', '$10/mo each'],
];

const cell = (v) => v === '✓' ? `<span class="vq-tick">${icon('check', 17)}</span>`
                  : v === '✗' ? `<span class="vq-cross">${icon('minus', 17)}</span>`
                  : `<span class="vq-num vq-small">${v}</span>`;

const body = pageHead({
  eyebrow: 'Pricing',
  h1: 'Priced like software. Not like a <em class="vq-italic">project</em>.',
  lede: 'Every plan is the whole system. Plans differ by how much of it you use — branches, users, channels — not by locking a feature you need behind a tier.',
  amb: 'aurora',
}) + `

<section class="vq-section" style="padding-top:0">
  <div class="vq-container">
    <div class="vq-center vq-reveal" style="margin-bottom:var(--vq-space-10)">
      <div class="vq-seg" data-period role="tablist" aria-label="Billing period">
        <button class="vq-seg__btn" role="tab" data-per="month" aria-selected="true">Monthly</button>
        <button class="vq-seg__btn" role="tab" data-per="year"  aria-selected="false">Annual — 2 months free</button>
      </div>
    </div>

    <div class="vq-grid vq-grid--3">
      ${PLANS.map(p => `
      <div class="vq-plan${p.hot ? ' vq-plan--featured' : ''} vq-reveal">
        ${p.hot ? '<span class="vq-plan__flag">Most businesses start here</span>' : ''}
        <h2 class="vq-plan__name">${p.name}</h2>
        <p class="vq-plan__for">${p.for}</p>
        <div class="vq-plan__price">
          <span class="vq-plan__amt" data-price="${p.m}" data-price-year="${p.y}">${p.m}</span>
          <span class="vq-plan__per" data-per-label>/month</span>
        </div>
        <ul class="vq-plan__list">${p.items.map(i => `<li>${icon('check', 16)}<span>${i}</span></li>`).join('')}</ul>
        <a href="register.html" class="vq-btn ${p.hot ? 'vq-btn--primary' : 'vq-btn--secondary'} vq-btn--lg vq-btn--block">Choose ${p.name}</a>
      </div>`).join('')}
    </div>

    <p class="vq-center vq-small vq-text-2 vq-mt-8 vq-reveal" style="max-width:none">
      Need more users, more branches, or something specific? <a href="contact.html">Tell us what you need →</a>
    </p>
  </div>
</section>

<section class="vq-section vq-section--alt">
  <div class="vq-container">
    <div class="vq-card vq-card--xl vq-reveal">
      <span class="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">In every plan</span>
      <h2 class="vq-h2 vq-mt-4">Nothing important is withheld.</h2>
      <div class="vq-grid vq-grid--3 vq-mt-8">
        ${[
          'The complete double-entry ledger', 'Every financial report',
          'Unlimited transactions', 'Your data exportable at any time',
          'Every new feature we ship, at no extra cost', 'Offline mode at the counter',
        ].map(t => `<div class="vq-row vq-gap-3" style="align-items:flex-start">
          <span style="color:var(--vq-accent);flex:none;margin-top:3px">${icon('check', 16)}</span>
          <span class="vq-small">${t}</span></div>`).join('')}
      </div>
      <div class="vq-hr" style="margin-block:var(--vq-space-8)"></div>
      <p class="vq-h3">No implementation fee. No setup fee. No module fees. No consultant.</p>
    </div>
  </div>
</section>

<section class="vq-section">
  <div class="vq-container">
    <div class="vq-section-head vq-reveal">
      <span class="vq-eyebrow">Line by line</span>
      <h2 class="vq-display">Compare the plans.</h2>
    </div>
    <div class="vq-table-wrap vq-reveal">
      <table class="vq-table vq-table--compare">
        <colgroup><col style="width:38%"><col><col class="is-us"><col></colgroup>
        <thead><tr>
          <th></th><th>Starter</th><th style="color:var(--vq-accent-text)">Growth</th><th>Scale</th>
        </tr></thead>
        <tbody>
        ${MATRIX.map(r => r[0] === 'SEP'
          ? `<tr><td colspan="4" style="height:14px;background:var(--vq-surface-2);border-bottom:1px solid var(--vq-line)"></td></tr>`
          : `<tr><td class="vq-table__row-head">${r[0]}</td><td>${cell(r[1])}</td><td>${cell(r[2])}</td><td>${cell(r[3])}</td></tr>`
        ).join('')}
        </tbody>
      </table>
    </div>
  </div>
</section>

<section class="vq-section vq-band-dark">
  <div class="vq-amb"><span class="vq-amb__beams"><i></i><i></i><i></i></span><span class="vq-amb__grain"></span></div>
  <div class="vq-container" style="position:relative">
    <div class="vq-section-head vq-reveal" style="max-width:760px">
      <span class="vq-eyebrow">AI usage</span>
      <h2 class="vq-display">Models cost money to run. We'd rather show you the meter.</h2>
      <p class="vq-lede">Blueprint, SmartCapture, Vena and Signals use AI models. Rather than hide
        that inside the plan price and quietly raise it later, we make it visible. One page of a
        document is one credit. Three photos of an invoice is three.</p>
    </div>
    <div class="vq-grid vq-grid--3">
      ${[
        ['Included', 'Every plan includes a monthly AI allowance that covers normal use: building your system, changing it, and everyday captures. You see the count before you spend it.'],
        ['Top up', '200 extra pages for $2, any time. It is a one-off purchase, not a change to your subscription — and we stop at your cap rather than billing you past it.'],
        ['Bring your own key', 'Connect your own model provider key and pay them directly. We do not mark up a key you supply. One-time unlock, then free for as long as you use VenQore.'],
      ].map(([t, b]) => `
      <div class="vq-card vq-card--xl vq-reveal">
        <h3 class="vq-h3" style="color:#fff">${t}</h3>
        <p class="vq-tile__body vq-mt-3">${b}</p>
      </div>`).join('')}
    </div>
    <p class="vq-small vq-mt-8 vq-reveal" style="color:rgb(237 242 239 / .62);max-width:70ch">
      We never silently truncate and never silently charge. When a 14-page PDF will use 14 of your
      pages, the screen says so and asks once.
    </p>
  </div>
</section>

<section class="vq-section">
  <div class="vq-container">
    <div class="vq-section-head vq-reveal">
      <span class="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Add-ons</span>
      <h2 class="vq-display">Buy only the shape you need.</h2>
    </div>
    <div class="vq-table-wrap vq-reveal">
      <table class="vq-table">
        <thead><tr><th>Add-on</th><th>What it is</th><th class="num" style="width:150px">Price</th></tr></thead>
        <tbody>
        ${[
          ['Extra staff seat', 'One more person with their own login and permissions', '$5 / month'],
          ['Extra location', 'One more branch with its own stock, pricing and reporting', '$10 / month'],
          ['WooCommerce sync', 'Two-way catalogue, stock and order sync per store', '$10 / month'],
          ['Amazon sync', 'SP-API approved integration, per seller account', '$10 / month'],
          ['AI page top-up', '200 additional capture pages, one-off and repeatable', '$2'],
          ['Bring your own key', 'One-time unlock, then managed AI is never charged again', '$19'],
          ['AI product descriptions', '200 / 500 / 2,000 packs. Credits never expire', 'from $6'],
        ].map(r => `<tr><td class="vq-table__row-head">${r[0]}</td><td class="vq-text-2">${r[1]}</td><td class="num">${r[2]}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>
</section>

<section class="vq-section vq-section--alt">
  <div class="vq-container vq-container--narrow">
    <div class="vq-section-head vq-reveal"><h2 class="vq-display">Pricing questions.</h2></div>
    <div class="vq-faq vq-reveal">
      ${[
        ['Is there a free trial?', '14 days, the full product, no card. You will see your system before you decide anything, and we remind you before the trial ends rather than after.'],
        ['What happens after the trial?', 'Your system stays exactly as you built it. Pick a plan and carry on — nothing is rebuilt, reset or re-configured.'],
        ['Can I change plans?', 'Any time, both directions, prorated. Downgrading never deletes anything: data above the new limit becomes read-only and hidden, and comes back the moment you upgrade.'],
        ['Do you charge to import my data?', 'No. Import is included, and so is the help getting it in.'],
        ['Do you charge to leave?', 'No. Export everything, any time, in a format your next system can read.'],
        ['Is there a contract?', 'Monthly is month-to-month. Annual is twelve months at two months off. There is no minimum term and no notice period.'],
        ['Why is there no per-user pricing on the features?', 'Because a feature you need should not be a negotiation. You pay for the size of your business, not its complexity. The one line we do draw is the ledger — a business that needs to know who owes it money is on Starter or above.'],
      ].map(([q, a]) => `
      <div class="vq-faq__item">
        <button class="vq-faq__q" type="button" aria-expanded="false">${q}<span class="vq-faq__sign"></span></button>
        <div class="vq-faq__a"><div><p>${a}</p></div></div>
      </div>`).join('')}
    </div>
  </div>
</section>`;

export default page({
  title: 'Pricing — from $36/month, no implementation fee | VenQore',
  description: 'Every VenQore plan includes the full system. No module fees, no implementation cost, no consultant. Monthly or annual, from $36/month.',
  active: 'pricing',
  body,
});
