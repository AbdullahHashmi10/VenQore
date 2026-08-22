import { page, icon } from '../shell.js';
import { pageHead } from '../bits.js';

const GROUPS = [
  ['Sell', ['Sales invoice · INV', 'Quotation · QT', 'Sales order · SO', 'Sale return · SRET', 'Recurring invoice · REC']],
  ['Buy', ['Purchase invoice · BILL', 'Purchase order · PO', 'Goods receipt · GRN', 'Purchase return · PRET', 'Debit note · DN', 'Expense · EXP']],
  ['Stock', ['Stock transfer · TRF', 'Stock audit · AUD']],
];

const body = pageHead({
  eyebrow: 'Documents',
  h1: 'Thirteen documents. <em class="vq-italic">One</em> editor.',
  lede: 'An invoice, a purchase return, a goods receipt and a stock audit are not four screens. They are one screen with different switches on — which is why a field that renders is always a field that posts.',
  amb: 'dots',
  cta: `<a class="vq-btn vq-btn--primary vq-btn--lg" href="register.html">Start building <span class="vq-btn__arrow">${icon('arrow', 16)}</span></a>
        <a class="vq-btn vq-btn--secondary vq-btn--lg" href="ledger.html">How they post</a>`,
}) + `

<section class="vq-section" style="padding-top:0">
  <div class="vq-container vq-container--wide">
    <div class="vq-demo vq-reveal" data-doc>
      <div class="vq-demo__bar">
        <div class="vq-demo__dots"><i></i><i></i><i></i></div>
        <div class="vq-demo__url">${icon('lock', 11)} app.venqore.com/documents</div>
        <span class="vq-demo__live">Live · try it</span>
      </div>
      <div class="vq-demo__controls">
        <span class="vq-eyebrow" style="flex:none">Document type</span>
        <div class="vq-demo__scroller" data-doc-tabs role="tablist"></div>
      </div>
      <div class="vq-grid" style="grid-template-columns:minmax(0,1fr) 300px;gap:1px;background:var(--vq-line)">
        <div data-doc-stage style="background:var(--vq-surface)"></div>
        <div data-doc-meta style="background:var(--vq-surface-2);padding:var(--vq-space-5)"></div>
      </div>
    </div>
    <p class="vq-caption vq-center vq-mt-4" style="max-width:none">
      Same editor every time. The type changes the labels, the columns, the totals block and which capabilities are switched on.
    </p>
  </div>
</section>

<section class="vq-section vq-section--alt">
  <div class="vq-container">
    <div class="vq-section-head vq-reveal">
      <span class="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">All thirteen</span>
      <h2 class="vq-display">Everything a trading business actually issues.</h2>
    </div>
    <div class="vq-grid vq-grid--3">
      ${GROUPS.map(([g, items]) => `
      <div class="vq-card vq-card--xl vq-reveal">
        <span class="vq-eyebrow vq-eyebrow--accent">${g} side · ${items.length}</span>
        <ul class="vq-stack vq-gap-3 vq-mt-5">
          ${items.map(i => {
            const [name, px] = i.split(' · ');
            return `<li class="vq-row vq-gap-3" style="justify-content:space-between">
              <span class="vq-small">${name}</span>
              <span class="vq-badge">${px}</span></li>`;
          }).join('')}
        </ul>
      </div>`).join('')}
    </div>
    <p class="vq-caption vq-mt-6 vq-reveal" style="max-width:70ch">
      Sale return plays the credit-note role on the sell side; Debit note is its counterpart on the buy side. Which side a
      document is on is not cosmetic — it decides whether the party picker offers customers or suppliers, whether the rate
      column says Price or Unit cost, and whether shipping appears in the totals at all.
    </p>
  </div>
</section>

<section class="vq-section vq-band-dark">
  <div class="vq-amb"><span class="vq-amb__grain"></span></div>
  <div class="vq-container" style="position:relative">
    <div class="vq-section-head vq-reveal" style="max-width:820px">
      <span class="vq-eyebrow">Why one editor matters</span>
      <h2 class="vq-display">Copy-pasted screens are where the money leaks.</h2>
      <p class="vq-lede">In most systems these are separate files, copied and edited. When they drift, they drift silently
        — and the drift is always in the direction of a number being wrong. Here are four real ones we found and closed
        when we collapsed thirteen screens into one.</p>
    </div>
    <div class="vq-grid vq-grid--2">
      ${[
        ['A debit note that never restored stock', 'It did not send a warehouse ID. The credit hit the supplier account, the goods never came back into inventory, and stock and ledger disagreed from that moment on.'],
        ['A sale return that zeroed tax and discount', 'The screen collected both. The server threw both away and picked the first warehouse it found. The refund was wrong, quietly, every time.'],
        ['One tax source, then five', 'Only the sales invoice read the tax settings. Every other document carried its own copy, and the copies aged apart.'],
        ['The same cart, totalled differently', 'Round-off was implemented per screen. The same basket produced two different totals depending on which document you raised it as.'],
      ].map(([t, b]) => `
      <div class="vq-card vq-card--xl vq-reveal">
        <div class="vq-row vq-gap-3" style="align-items:flex-start">
          <span style="color:var(--vq-danger);flex:none;margin-top:3px">${icon('x', 18)}</span>
          <div><h3 class="vq-h3" style="color:#fff">${t}</h3>
          <p class="vq-tile__body vq-mt-2">${b}</p></div>
        </div>
      </div>`).join('')}
    </div>
    <div class="vq-row vq-wrap vq-gap-6 vq-mt-12 vq-reveal" style="justify-content:space-between;align-items:center">
      <p class="vq-h3" style="color:#fff;max-width:48ch">One payload builder for all thirteen. A field that renders is a field that posts.</p>
      <a class="vq-btn vq-btn--lg vq-btn--onDark" href="ledger.html">See where they post <span class="vq-btn__arrow">${icon('arrow', 16)}</span></a>
    </div>
  </div>
</section>

<section class="vq-section">
  <div class="vq-container">
    <div class="vq-grid vq-grid--2" style="gap:var(--vq-space-16);align-items:center">
      <div class="vq-reveal">
        <span class="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Density</span>
        <h2 class="vq-display vq-mt-4">Three densities, because a receipt is not a bill.</h2>
        <p class="vq-lede vq-mt-6">A stock transfer needs two fields and four columns. A purchase invoice with landed cost,
          per-line tax and foreign currency needs twelve and nine. The editor carries all three and each document type
          declares which it wants — and you can override it.</p>
      </div>
      <div class="vq-table-wrap vq-reveal">
        <table class="vq-table">
          <thead><tr><th>Density</th><th class="num">Header fields</th><th class="num">Line columns</th><th class="num">Total rows</th></tr></thead>
          <tbody>
            <tr><td class="vq-table__row-head">Simple</td><td class="num">2</td><td class="num">5</td><td class="num">3</td></tr>
            <tr><td class="vq-table__row-head">Standard</td><td class="num">7</td><td class="num">7</td><td class="num">7</td></tr>
            <tr><td class="vq-table__row-head">Pro</td><td class="num">12</td><td class="num">10</td><td class="num">10</td></tr>
          </tbody>
        </table>
        <div style="padding:var(--vq-space-4);border-top:1px solid var(--vq-line)">
          <p class="vq-caption" style="max-width:none">Below the width a line needs, the table wraps to cards rather than clipping a column.
            Collapsing the customer block is worth five to ten more visible item rows on a laptop.</p>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="vq-section vq-section--alt">
  <div class="vq-container">
    <div class="vq-section-head vq-section-head--center vq-reveal">
      <h2 class="vq-display">Shared by all thirteen.</h2>
    </div>
    <div class="vq-grid vq-grid--4">
      ${[
        ['One numbering scheme', 'INV-000148, PO-000148, AUD-000148. Same shape, one sequence per type, never reused.'],
        ['One tax source', 'Change a rate in settings and every document type follows it in the same instant.'],
        ['One round-off rule', 'A document property applied once, not thirteen implementations that drift.'],
        ['One ledger path', 'Every type posts through the Core Ledger. There is no document that skips the books.'],
        ['One keymap', '24 shortcuts, identical at the register and in the editor.'],
        ['One layout law', 'Header, lines, summary. Three zones, measured floors, nothing pushed off the edge.'],
        ['One set of actions', 'Save, print, email, WhatsApp, PDF, duplicate, record payment — wherever they make sense.'],
        ['One audit trail', 'Who raised it, when, what changed, and the reversal if it was corrected.'],
      ].map(([t, b]) => `
      <div class="vq-reveal">
        <h3 class="vq-small" style="font-weight:var(--vq-fw-semi)">${t}</h3>
        <p class="vq-caption vq-mt-2" style="max-width:none">${b}</p>
      </div>`).join('')}
    </div>
  </div>
</section>`;

export default page({
  title: 'Documents — thirteen types, one editor | VenQore',
  description: 'Sales invoice to stock audit: thirteen document types built on one editor, one payload builder, one tax source and one ledger path. A field that renders is a field that posts.',
  active: 'product',
  demos: true,
  body,
});
