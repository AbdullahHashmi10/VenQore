import { page, icon } from '../shell.js';
import { pageHead } from '../bits.js';

const body = pageHead({
  eyebrow: 'The register',
  h1: 'A till is composed by the person <em class="vq-italic">standing</em> at it.',
  lede: 'Most point-of-sale software ships a fixed layout and hopes it suits you. VenQore ships seven starting points and eight controls, and the layout engine\'s only job is to stop your arrangement from breaking.',
  amb: 'grid',
  cta: `<a class="vq-btn vq-btn--primary vq-btn--lg" href="register.html">Start building <span class="vq-btn__arrow">${icon('arrow', 16)}</span></a>
        <a class="vq-btn vq-btn--secondary vq-btn--lg" href="features.html#selling">Everything in Selling</a>`,
}) + `

<section class="vq-section" style="padding-top:0">
  <div class="vq-container vq-container--wide">
    <div class="vq-demo vq-reveal" data-pos>
      <div class="vq-demo__bar">
        <div class="vq-demo__dots"><i></i><i></i><i></i></div>
        <div class="vq-demo__url">${icon('lock', 11)} app.venqore.com/pos</div>
        <span class="vq-demo__live">Live · try it</span>
      </div>
      <div class="vq-demo__controls">
        <span class="vq-eyebrow" style="flex:none">Starting point</span>
        <div class="vq-demo__scroller" data-pos-tabs role="tablist"></div>
      </div>
      <div class="vq-demo__body vq-demo__body--flush" data-pos-stage></div>
      <div style="padding:var(--vq-space-5);border-top:1px solid var(--vq-line);background:var(--vq-surface-2)" data-pos-why></div>
    </div>
    <p class="vq-caption vq-center vq-mt-4" style="max-width:none">
      Seven presets, and the composition behind each one — from the product's own layout law. Tap a name to recompose the register.
    </p>
  </div>
</section>

<section class="vq-section vq-section--alt">
  <div class="vq-container">
    <div class="vq-section-head vq-reveal">
      <span class="vq-eyebrow">The point</span>
      <h2 class="vq-display">Nobody else in this category ships resizable panes.</h2>
      <p class="vq-lede">We checked. Toast lets you set rows and columns. Lightspeed sizes tiles. Loyverse toggles grid or list.
        Shopify and Square let you edit what is on a tile. The one product with free pane geometry authors it in an admin
        tool as XML — not at the register, and not by the person using it.</p>
    </div>
    <div class="vq-grid vq-grid--3">
      ${[
        ['layers', 'A preset is a starting point, not a cage', 'Pick the one closest to how you work, then drag a divider. The catalogue can take 20% or 40% of the screen, sit on top, sit on the left, or not exist at all.'],
        ['shield', 'The engine measures, it does not guess', 'Every pane declares the width its text actually needs. Drag past that floor and the catalogue becomes a full-screen button rather than a broken column. Nothing is ever deleted to save space.'],
        ['check', 'Proven, not eyeballed', '35,255 automated checks with zero disagreements. Every arrangement swept every 8 pixels from a 320px phone to a 3440px ultrawide. Zero controls covered, zero content stranded off screen.'],
      ].map(([ic, t, b]) => `
      <article class="vq-card vq-card--xl vq-tile vq-reveal">
        <span class="vq-tile__icon">${icon(ic)}</span>
        <h3 class="vq-tile__title">${t}</h3>
        <p class="vq-tile__body">${b}</p>
      </article>`).join('')}
    </div>
  </div>
</section>

<section class="vq-section vq-band-dark">
  <div class="vq-amb"><span class="vq-amb__beams"><i></i><i></i><i></i></span><span class="vq-amb__grain"></span></div>
  <div class="vq-container" style="position:relative">
    <div class="vq-grid vq-grid--2" style="gap:var(--vq-space-16)">
      <div class="vq-reveal">
        <span class="vq-eyebrow">The rule that keeps it usable</span>
        <h2 class="vq-display vq-mt-4">Seven controls on the surface. No more.</h2>
        <p class="vq-lede vq-mt-6">Seven is the working-memory span. Past it a cashier scans the screen instead of acting on it.
          So the register carries at most seven rank-one controls on a desktop and five on a phone; everything else is one
          gesture away, and monthly settings are not on the till at all.</p>
        <div class="vq-grid vq-grid--3 vq-mt-10" style="gap:var(--vq-space-6)">
          ${[['60', 'capabilities'], ['15', 'on the surface'], ['0', 'settings docked']].map(([v, l]) => `
          <div><div class="vq-num" style="font-size:var(--vq-fs-metric);font-weight:600;color:#fff;letter-spacing:-.03em;line-height:1">${v}</div>
          <div class="vq-caption vq-mt-1" style="color:rgb(237 242 239 / .55)">${l}</div></div>`).join('')}
        </div>
      </div>
      <div class="vq-reveal vq-stack vq-gap-4">
        ${[
          ['Same controls, three shapes', 'The payment panel is built once and used in three places — a resident column, a full-screen sheet, a 56px docked bar. Nothing a cashier learned in one arrangement is missing from another.'],
          ['The keypad lives in the sheet', 'Never in the resident column. A keypad in a narrow column only pushes the things that matter into a scroll.'],
          ['The dock is a layout row', 'Not a floating button. Its height is subtracted before anything else is measured, so Complete can never end up below the fold.'],
          ['A table is a held sale', 'On the Table preset, hold becomes automatic and back means back to the floor — because the unit of work is the table, not the sale.'],
        ].map(([t, b]) => `
        <div class="vq-card"><b class="vq-small" style="font-weight:var(--vq-fw-semi)">${t}</b>
        <p class="vq-caption vq-mt-2" style="max-width:none">${b}</p></div>`).join('')}
      </div>
    </div>
  </div>
</section>

<section class="vq-section">
  <div class="vq-container">
    <div class="vq-section-head vq-reveal">
      <span class="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">At the counter</span>
      <h2 class="vq-display">Seventeen things that matter at 5pm on a Saturday.</h2>
    </div>
    <div class="vq-grid vq-grid--3">
      ${[
        ['Instant barcode scanner', 'Wedge or camera. Unknown codes offer to create the item rather than beeping at you.'],
        ['Serial &amp; IMEI scanner', 'The serial follows the unit through sale, return and warranty.'],
        ['Park &amp; recall', 'Hold a bill, serve the next customer, bring it back. Also how table service works.'],
        ['Cart rescue', 'Power cut, browser crash, accidental refresh — the cart is still there.'],
        ['Typo-tolerant search', 'Finds "panadol" from "pandol", and the SKU from half of it.'],
        ['Multi-account split payment', 'Part cash, part card, part on account, in one sale.'],
        ['Automatic cash rounding', 'To your smallest coin, posted to a rounding account so the ledger still ties.'],
        ['Daily cash register audit', 'Counted versus expected, per register, per shift, with the variance explained.'],
        ['Negative stock alert &amp; lock', 'Choose whether selling what you do not have is a warning or a wall.'],
        ['In-flight product creation', 'Create the item mid-sale without leaving the cart.'],
        ['Auto-applying customer discounts', 'The tier follows the customer; nobody has to remember it.'],
        ['Change calculator', 'Tendered in, change out, printed on the receipt.'],
        ['Keyboard-first checkout', '24 shortcuts. A trained cashier never touches the screen.'],
        ['Silent thermal printing', 'WebUSB, no print dialog, custom roll widths and cut-line padding.'],
        ['Tax verification QR', 'On the receipt, where the regulator expects it.'],
        ['Offline mode', 'The till keeps selling when the internet does not. It reconciles when it returns.'],
        ['Cashier PIN login', 'Fast switching between staff, with an inactivity auto-logout behind it.'],
      ].map(([t, b]) => `
      <div class="vq-reveal vq-row vq-gap-3" style="align-items:flex-start">
        <span style="color:var(--vq-accent);flex:none;margin-top:3px">${icon('check', 16)}</span>
        <div><b class="vq-small" style="font-weight:var(--vq-fw-semi)">${t}</b>
        <p class="vq-caption vq-mt-1" style="max-width:none">${b}</p></div>
      </div>`).join('')}
    </div>
  </div>
</section>

<section class="vq-section vq-section--alt">
  <div class="vq-container vq-container--narrow vq-center vq-reveal">
    <h2 class="vq-display">Every sale posts to the ledger. All of it.</h2>
    <p class="vq-lede vq-mt-5" style="margin-inline:auto">Cash in, revenue, tax payable, cost of goods, inventory out —
      five postings from one barcode scan, with the cost taken from the batch that actually left the shelf.</p>
    <a class="vq-btn vq-btn--secondary vq-btn--lg vq-mt-8" href="ledger.html">See the Core Ledger <span class="vq-btn__arrow">${icon('arrow', 16)}</span></a>
  </div>
</section>`;

export default page({
  title: 'The register — a POS that composes itself | VenQore',
  description: 'Seven starting points, eight controls, and a layout engine whose job is to stop your arrangement from breaking. 35,255 checks, zero disagreements.',
  active: 'product',
  demos: true,
  body,
});
