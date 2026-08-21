import { page, icon } from '../shell.js';
import { pageHead } from '../bits.js';

const CHECKS = [
  ['Balance integrity', 'Every journal entry nets to zero. Debits equal credits or the transaction does not post — there is no partial write and no override.'],
  ['Cost of goods', 'FIFO costing follows the batch, variant and location it actually came from. A margin that is right on the invoice is right in the P&amp;L.'],
  ['Tax handling', 'Inclusive and exclusive rates, per-item overrides, exemptions and the reverse case all resolve to the same figure the return expects.'],
  ['Multi-currency', 'The rate at the transaction, the rate at settlement and the difference between them all land somewhere explicit.'],
  ['Inter-branch movement', 'Stock leaving one location and arriving at another is one movement with two sides, not two adjustments that happen to agree.'],
  ['Period closing', 'A closed period is closed. Postings dated into it are refused, and the closing entries reconcile against the pre-close balances.'],
  ['Reversal integrity', 'Nothing is edited in place. A correction is a reversal plus a new entry, and both are visible.'],
];

const body = pageHead({
  eyebrow: 'Core Ledger',
  h1: 'The one part of VenQore the AI can\'t <em class="vq-italic">touch</em>.',
  lede: 'Every module — sales, purchases, stock, payroll, expenses — posts through one double-entry engine. The AI can add a module, rename a field, rewire a workflow. It cannot invent a balance.',
  amb: 'grid',
  cta: `<a class="vq-btn vq-btn--primary vq-btn--lg" href="register.html">Start building <span class="vq-btn__arrow">${icon('arrow', 16)}</span></a>
        <a class="vq-btn vq-btn--secondary vq-btn--lg" href="features.html#money">See the money modules</a>`,
}) + `

<section class="vq-section" style="padding-top:var(--vq-space-8)">
  <div class="vq-container">
    <div class="vq-grid vq-grid--3">
      <div class="vq-card vq-card--xl vq-card--accent vq-stat vq-reveal">
        <span class="vq-stat__label">Correctness checks</span>
        <span class="vq-stat__value">7<span class="vq-stat__unit">/ 7 passing</span></span>
        <span class="vq-stat__note">Run on every release, not once at launch</span>
      </div>
      <div class="vq-card vq-card--xl vq-tile vq-reveal">
        <span class="vq-tile__icon">${icon('ledger')}</span>
        <h3 class="vq-tile__title">One engine, every module</h3>
        <p class="vq-tile__body">There is no second version of the truth to reconcile, because there is no second version.</p>
      </div>
      <div class="vq-card vq-card--xl vq-tile vq-reveal">
        <span class="vq-tile__icon">${icon('file')}</span>
        <h3 class="vq-tile__title">Auditable by design</h3>
        <p class="vq-tile__body">Every posting traces to the document, the user and the timestamp. Your accountant can follow the trail without asking you a single question.</p>
      </div>
    </div>
  </div>
</section>

<section class="vq-section vq-section--alt">
  <div class="vq-container">
    <div class="vq-section-head vq-reveal">
      <span class="vq-eyebrow">The seven checks</span>
      <h2 class="vq-display">We'd rather publish the check than ask you to trust it.</h2>
      <p class="vq-lede">These are the seven independent correctness tests the ledger runs against
        itself. All seven currently pass. When one fails, the release does not ship.</p>
    </div>
    <div class="vq-table-wrap vq-reveal">
      <table class="vq-table">
        <thead><tr><th style="width:220px">Check</th><th>What it proves</th><th style="width:120px">Status</th></tr></thead>
        <tbody>
        ${CHECKS.map(([t, b]) => `<tr>
          <td class="vq-table__row-head">${t}</td>
          <td class="vq-text-2">${b}</td>
          <td><span class="vq-status vq-status--ok">${icon('check', 11)} Passing</span></td>
        </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>
</section>

<section class="vq-section vq-band-dark">
  <div class="vq-amb"><span class="vq-amb__beams"><i></i><i></i><i></i></span><span class="vq-amb__grain"></span></div>
  <div class="vq-container" style="position:relative">
    <div class="vq-section-head vq-reveal">
      <span class="vq-eyebrow">In practice</span>
      <h2 class="vq-display">What that actually means on a Tuesday.</h2>
    </div>
    <div class="vq-grid vq-grid--2">
      ${[
        ['Your P&amp;L is not a report someone generated.', 'It is the same data your till produced, read from the other end. Nobody assembles it and nobody can quietly adjust it.'],
        ['A stock adjustment moves inventory <em>and</em> posts the cost.', 'You cannot do half of it. There is no state where the shelf is right and the books are not.'],
        ['Month-end isn\'t a reconstruction. It\'s a date range.', 'Because everything posted when it happened, closing a month is selecting two dates, not rebuilding six weeks of history.'],
        ['Your accountant gets a trial balance that ties, first time.', 'And a day book, an account ledger and a party statement that agree with it, because they are all the same rows read differently.'],
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
    <div class="vq-grid vq-grid--2" style="align-items:center;gap:var(--vq-space-16)">
      <div class="vq-reveal">
        <span class="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">The line</span>
        <h2 class="vq-display vq-mt-4">Flexible where it should be.<br>Rigid where it must be.</h2>
        <p class="vq-lede vq-mt-6">A system that will bend anywhere is a system you cannot trust with
          money. A system that bends nowhere is one you spend six months forcing your business into.
          The whole design of VenQore is the placement of that line.</p>
        <a class="vq-btn vq-btn--primary vq-btn--lg vq-mt-8" href="blueprint.html">See what does bend <span class="vq-btn__arrow">${icon('arrow', 16)}</span></a>
      </div>
      <div class="vq-reveal">
        <div class="vq-card vq-card--xl">
          <span class="vq-eyebrow">A single sale, both sides</span>
          <div class="vq-table-wrap vq-mt-4" style="border:0">
            <table class="vq-table" style="min-width:0">
              <thead><tr><th>Account</th><th class="num">Debit</th><th class="num">Credit</th></tr></thead>
              <tbody>
                <tr><td>Cash</td><td class="num">4,850</td><td class="num vq-text-3">—</td></tr>
                <tr><td>Sales revenue</td><td class="num vq-text-3">—</td><td class="num">4,220</td></tr>
                <tr><td>Tax payable</td><td class="num vq-text-3">—</td><td class="num">630</td></tr>
                <tr><td>Cost of goods sold</td><td class="num">2,905</td><td class="num vq-text-3">—</td></tr>
                <tr><td>Inventory</td><td class="num vq-text-3">—</td><td class="num">2,905</td></tr>
                <tr style="border-top:1px solid var(--vq-line)">
                  <td style="font-weight:var(--vq-fw-semi)">Total</td>
                  <td class="num" style="font-weight:var(--vq-fw-semi)">7,755</td>
                  <td class="num" style="font-weight:var(--vq-fw-semi)">7,755</td></tr>
              </tbody>
            </table>
          </div>
          <p class="vq-caption vq-mt-4" style="max-width:none">One barcode scan at the counter. Five
            postings, balanced, with the cost taken from the batch that actually left the shelf.</p>
        </div>
      </div>
    </div>
  </div>
</section>`;

export default page({
  title: 'Core Ledger — double-entry under every module | VenQore',
  description: 'One double-entry engine under sales, purchases, stock, payroll and expenses. Seven independent correctness checks, run on every release. The AI configures the system; it never decides what your numbers say.',
  active: 'product',
  body,
});
