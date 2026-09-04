import { page, icon } from '../shell.js';
import { pageHead } from '../bits.js';

const AREAS = [
  ['Sales', 32, 'Revenue, payment split, top products, top customers, basket size, discount given, return rate, funnel, by hour and day, by channel, by region, live feed…'],
  ['Finance', 28, 'Profit trend, cash in vs out, receivables ageing, books balanced, cash runway, days sales outstanding, days payable outstanding, quick ratio, expense ratio, tax liability…'],
  ['Inventory', 26, 'Stock value, low stock, out of stock, turnover, days of cover, sell-through, dead stock, expiring in 30 days, batch tracking, serial lifecycle, stock by warehouse…'],
  ['Purchasing', 11, 'Spend trend, spend by supplier, supplier concentration, average lead time, on-time delivery, purchase orders pending and received, debit notes and open credits.'],
  ['Operations', 11, 'Staff present and absent, hours today, attendance rate, sales per staff member, new vs returning, customer retention, open tickets, plan usage.'],
];

const body = pageHead({
  eyebrow: 'The dashboard',
  h1: 'Your dashboard is <em class="vq-italic">assembled</em>, not chosen.',
  lede: '108 readings, five areas, twenty-one chart types and eighteen size fits. You pick what you want to know — never what shape it should be — and the card works out the smallest size it can be read at.',
  amb: 'aurora',
  cta: `<a class="vq-btn vq-btn--primary vq-btn--lg" href="register.html">Start building <span class="vq-btn__arrow">${icon('arrow', 16)}</span></a>
        <a class="vq-btn vq-btn--secondary vq-btn--lg" href="reckoner.html">Where the numbers come from</a>`,
}) + `

<section class="vq-section" style="padding-top:0">
  <div class="vq-container vq-container--wide">
    <div class="vq-demo vq-reveal" data-builder>
      <div class="vq-demo__bar">
        <div class="vq-demo__dots"><i></i><i></i><i></i></div>
        <div class="vq-demo__url">${icon('lock', 11)} app.venqore.com/dashboard</div>
        <span class="vq-demo__live">Live · try it</span>
      </div>
      <div class="vq-build">
        <div class="vq-build__board" data-builder-board></div>
        <div class="vq-build__lib">
          <div class="vq-row" style="justify-content:space-between;margin-bottom:var(--vq-space-3)">
            <span class="vq-eyebrow vq-eyebrow--accent">Add a reading</span>
            <span class="vq-caption vq-num" data-builder-count></span>
          </div>
          <div class="vq-build__search">${icon('search', 14)} Search 108 readings…</div>
          <div class="vq-build__list" data-builder-list></div>
        </div>
      </div>
    </div>
    <p class="vq-caption vq-center vq-mt-4" style="max-width:none">
      A sample of the registry. Tap a reading to put it on the board — the card picks its own size, and the headline metric takes the accent fill.
    </p>
  </div>
</section>

<section class="vq-section vq-section--alt">
  <div class="vq-container">
    <div class="vq-section-head vq-reveal">
      <span class="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">108 readings</span>
      <h2 class="vq-display">Everything a trading business is judged by.</h2>
      <p class="vq-lede">Grouped by the part of the business it belongs to, not by which screen it happens to live on.</p>
    </div>
    <div class="vq-grid vq-grid--2">
      ${AREAS.map(([name, n, list], i) => `
      <article class="vq-card vq-card--xl vq-reveal${i === 0 ? ' vq-card--accent' : ''}">
        <div class="vq-row" style="justify-content:space-between;align-items:baseline">
          <h3 class="vq-h3">${name}</h3>
          <span class="vq-stat__value vq-stat__value--sm" style="font-size:26px">${n}</span>
        </div>
        <p class="vq-tile__body vq-mt-3">${list}</p>
      </article>`).join('')}
      <article class="vq-card vq-card--xl vq-reveal">
        <h3 class="vq-h3">And the multiplier</h3>
        <p class="vq-tile__body vq-mt-3">Every reading resolves over eighteen period windows, most with a comparison window behind it.
          That is <b style="color:var(--vq-text)">1,944 distinct figures</b> before anyone picks a chart type or a size.</p>
        <a class="vq-link vq-mt-4" href="reckoner.html">How the periods work ${icon('arrow', 15)}</a>
      </article>
    </div>
  </div>
</section>

<section class="vq-section">
  <div class="vq-container">
    <div class="vq-section-head vq-reveal">
      <span class="vq-eyebrow">The rule that makes it work</span>
      <h2 class="vq-display">No card can clip its own content.</h2>
      <p class="vq-lede">Every card declares the smallest size it can still be read at. Sizes below that floor are not
        offered — they render disabled with the reason. A bar chart cannot be placed in a tile, and a tile is not
        allowed to pretend it is a chart.</p>
    </div>
    <div class="vq-table-wrap vq-reveal">
      <table class="vq-table">
        <thead><tr><th style="width:90px">Category</th><th style="width:120px">Name</th><th>Holds</th><th>Legal fits (columns × rows)</th></tr></thead>
        <tbody>
        ${[
          ['C1', 'Tile', 'A single glyph and a number. No chart host at all.', '2×1 · 1×1'],
          ['C2', 'Strip', 'One KPI on one line — label left, value right.', '4×1 · 3×2'],
          ['C3', 'Metric', 'A KPI with a delta, a sparkline or a comparison.', '4×3 · 3×2 · 2×2 · 2×3'],
          ['C4', 'Panel', 'A ranked list, a breakdown, a small chart, a table excerpt.', '4×4 · 3×4 · 3×5 · 2×6'],
          ['C5', 'Board', 'A full chart, multi-series, a wide table.', '6×6 · 5×7 · 4×8'],
          ['C6', 'Canvas', 'A hero chart, a P&amp;L, a cohort grid, a map.', '8×8 · 6×10 · 4×12'],
        ].map(r => `<tr><td class="vq-table__row-head vq-num">${r[0]}</td><td>${r[1]}</td>
          <td class="vq-text-2">${r[2]}</td><td class="vq-num vq-text-2">${r[3]}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div class="vq-grid vq-grid--4 vq-mt-10">
      ${[
        ['18 fits, all verified', '18 of 18 render at exact geometry, with zero ladder mismatches across 292 catalogue cards and all ten roles.'],
        ['A card widens before it degrades', 'It only drops to a leaner fit when widening is exhausted — and then it re-lays its inside rather than shrinking the type.'],
        ['Numbers step down, never clip', 'Currency drops first, then decimals, then magnitude. The exact value is always one hover away.'],
        ['Exactly one filled card', 'One card on the board carries the accent fill, and it is the headline metric. Two is a fail. Zero is a fail.'],
      ].map(([t, b]) => `
      <div class="vq-reveal"><h3 class="vq-small" style="font-weight:var(--vq-fw-semi)">${t}</h3>
      <p class="vq-caption vq-mt-2" style="max-width:none">${b}</p></div>`).join('')}
    </div>
  </div>
</section>

<section class="vq-section vq-band-dark">
  <div class="vq-amb"><span class="vq-amb__beams"><i></i><i></i><i></i></span><span class="vq-amb__grain"></span></div>
  <div class="vq-container" style="position:relative">
    <div class="vq-grid vq-grid--2" style="gap:var(--vq-space-16)">
      <div class="vq-reveal">
        <span class="vq-eyebrow">Who sees what</span>
        <h2 class="vq-display vq-mt-4">A cashier is never offered the P&amp;L.</h2>
        <p class="vq-lede vq-mt-6">Three independent gates decide whether a card is even in the picker, and all three are
          enforced on the server. A card you are not entitled to does not render blank — it is not there.</p>
        <ul class="vq-stack vq-gap-5 vq-mt-8">
          ${[
            ['Permission', 'Your role. A cashier sees eight cards; a store owner sees eighty-five.'],
            ['Plan feature', 'Production, stock valuation and channel cards appear when your plan includes them.'],
            ['Capability', 'A cached probe of what your business actually records. No products yet means no stock cards — not empty ones.'],
          ].map(([t, b]) => `<li class="vq-row vq-gap-3" style="align-items:flex-start">
            <span style="color:var(--vq-teal-300);flex:none;margin-top:2px">${icon('check', 17)}</span>
            <div><b class="vq-body" style="color:#fff;font-weight:var(--vq-fw-semi)">${t}</b>
            <p class="vq-small vq-mt-1" style="max-width:none">${b}</p></div></li>`).join('')}
        </ul>
        <p class="vq-small vq-mt-8" style="max-width:52ch">
          A metric that fails any gate executes zero database queries. And a card the platform knows cannot work is never
          offered at all — an option that always renders "not available" is worse than an option that does not exist.
        </p>
      </div>
      <div class="vq-reveal">
        <div class="vq-card vq-card--xl">
          <span class="vq-eyebrow">Cards visible, by role</span>
          <div class="vq-rank vq-mt-5">
            ${[['Store owner', '85', 100], ['General manager', '78', 92], ['Internal accountant', '36', 42],
               ['Inventory manager', '26', 31], ['External auditor', '25', 29], ['Shift manager', '19', 22],
               ['Cashier', '8', 9], ['Purchasing agent', '7', 8]]
              .map(([n, v, w]) => `<div class="vq-rank__row"><span class="vq-rank__name">${n}</span>
                <span class="vq-rank__val">${v}</span>
                <span class="vq-rank__track"><span class="vq-rank__fill" style="--w:${w}%;width:${w}%"></span></span></div>`).join('')}
          </div>
          <p class="vq-caption vq-mt-6" style="max-width:none">Ten roles ship out of the box. 292 card placements across
            all of them, and every one of those placements is checked before it renders.</p>
        </div>
      </div>
    </div>
  </div>
</section>`;

export default page({
  title: 'The dashboard — 108 readings that assemble themselves | VenQore',
  description: 'Pick what you want to know and the card decides its own size. 108 readings across five areas, 21 chart types, 18 verified size fits, and three server-side gates on every card.',
  active: 'product',
  demos: true,
  body,
});
