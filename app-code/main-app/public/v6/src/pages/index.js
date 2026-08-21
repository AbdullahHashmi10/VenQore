import { page, icon } from '../shell.js';
import { mockDashboard, blueprintConsole, spark } from '../bits.js';

/* ── PRESERVED — the hero, authored by Rehan (extras/Hero Section).
     Same gradient, same layout, same camouflaged headline, same prompt row,
     same sub-text and down arrow. Only the copy inside it now says what the
     product actually is. ──────────────────────────────────────────────── */
const hero = `
<section class="vq-hero-section" style="min-height:100svh;width:100%;display:flex;flex-direction:column;padding-top:clamp(120px,13vw,176px)">
  <div class="hero-gradient-overlay" aria-hidden="true"></div>

  <div class="vq-hero-inner" style="margin-block:auto;margin-inline:auto;max-width:58rem;width:100%;display:flex;flex-direction:column;align-items:center;gap:var(--vq-space-5);padding-inline:var(--vq-space-6);text-align:center">

    <span class="vq-eyebrow vq-hero-eyebrow">The AI ERP builder</span>

    <h1 class="vq-hero vq-hero-h1" style="font-weight:var(--vq-fw-medium);max-width:16ch">
      The ERP that builds <em class="vq-italic">itself</em> around your business.
    </h1>

    <!-- The single most important element on the site. -->
    <form class="vq-mt-5" data-hero-prompt style="width:100%;display:flex;flex-direction:column;align-items:center;max-width:42rem">
      <div class="vq-hero-rule" style="width:100%;display:flex;align-items:flex-end;gap:var(--vq-space-4);padding-bottom:10px;position:relative">
        <div data-hero-placeholder class="shiny-text" aria-hidden="true"
             style="position:absolute;left:8px;bottom:20px;pointer-events:none;font-size:var(--vq-fs-lede);text-align:left;max-width:calc(100% - 108px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Tell us how your business works…</div>
        <textarea id="hero-prompt" rows="1" aria-label="Describe your business" class="vq-hero-input"
          style="flex:1;resize:none;background:transparent;border:0;outline:none;font-size:var(--vq-fs-lede);line-height:1.5;padding:8px;max-height:160px;font-family:inherit"></textarea>
        <div style="display:flex;align-items:center;gap:8px;padding-bottom:4px">
          <button type="button" class="vq-hero-icon" aria-label="Voice input">${icon('mic', 18)}</button>
          <button type="button" class="vq-hero-go" data-hero-go aria-label="Build it">${icon('arrow', 18)}</button>
        </div>
      </div>

      <div class="vq-row vq-wrap vq-gap-2 vq-mt-6" style="justify-content:center">
        <button type="button" class="vq-chip vq-chip--onHero" data-hero-chip="pharmacy">Pharmacy</button>
        <button type="button" class="vq-chip vq-chip--onHero" data-hero-chip="wholesale">Wholesale distributor</button>
        <button type="button" class="vq-chip vq-chip--onHero" data-hero-chip="cafe">Restaurant</button>
        <button type="button" class="vq-chip vq-chip--onHero" data-hero-chip="hardware">Hardware store</button>
        <button type="button" class="vq-chip vq-chip--onHero" data-hero-chip="multi">Multi-branch</button>
      </div>

      <p class="vq-caption vq-mt-5 vq-hero-caret" style="max-width:none">
        Free to try. No card. You'll see your system before you sign up for anything.
      </p>
    </form>
  </div>

  <div class="vq-hero-foot" style="margin-inline:auto;width:100%;max-width:58rem;display:flex;align-items:flex-end;justify-content:space-between;gap:var(--vq-space-6);padding:var(--vq-space-12) var(--vq-space-6) var(--vq-space-12)">
    <p class="vq-small" style="max-width:26rem">
      Describe how you actually work. VenQore assembles the system that runs it — and every
      number it produces is backed by double-entry accounting.
    </p>
    <a href="#how" aria-label="How it works">
      <span class="animate-bounce-slow" style="display:block">${icon('arrowDown', 40)}</span>
    </a>
  </div>
</section>`;

const trust = `
<section class="vq-section vq-section--tight" style="padding-block:var(--vq-space-10)">
  <div class="vq-container">
    <div class="vq-row vq-wrap vq-gap-8" style="justify-content:center;text-align:center">
      <span class="vq-logo-item">${icon('store')} Running two live retail businesses today</span>
      <span class="vq-logo-item">${icon('layers')} 144 shipped features, no module fees</span>
      <span class="vq-logo-item">${icon('ledger')} Double-entry accounting under every module</span>
    </div>
  </div>
</section>`;

const problem = `
<section class="vq-section vq-section--alt">
  <div class="vq-amb"><span class="vq-amb__grid"></span></div>
  <div class="vq-container" style="position:relative">
    <div class="vq-section-head vq-reveal">
      <span class="vq-eyebrow">The real cost</span>
      <h2 class="vq-display">You didn't buy five systems.<br>You ended up with five systems.</h2>
      <p class="vq-lede">POS here, accounting there, stock in Excel, orders in WhatsApp, purchases in
        a notebook. Nothing agrees with anything. Month-end is archaeology.</p>
    </div>

    <div class="vq-grid vq-grid--3">
      ${[
        ['clock', 'The implementation never ends', 'Legacy ERP is sold as software and delivered as a project. Discovery, statement of work, configuration phase, change request. Somewhere in month four the business decides it is easier to keep using the spreadsheet.'],
        ['layers', 'The template never fits', 'Every system worth having was built for a business that isn\'t yours. So you bend your business to fit the software, and you keep a second set of numbers on the side for the parts that never fit.'],
        ['percent', 'The numbers never agree', 'Your till says one thing, your stock sheet says another, your accountant reconstructs a third. By the time you know your real margin, the month it belonged to is over.'],
      ].map(([ic, t, b]) => `
      <article class="vq-card vq-card--xl vq-tile vq-reveal">
        <span class="vq-tile__icon">${icon(ic)}</span>
        <h3 class="vq-tile__title">${t}</h3>
        <p class="vq-tile__body">${b}</p>
      </article>`).join('')}
    </div>

    <p class="vq-lede vq-mt-12 vq-reveal" style="max-width:62ch;color:var(--vq-text)">
      The problem was never that you needed better software. It's that every system worth
      having was built for a business that isn't yours.
    </p>
  </div>
</section>`;

const how = `
<section class="vq-section" id="how">
  <div class="vq-container">
    <div class="vq-section-head vq-reveal">
      <span class="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">How it works</span>
      <h2 class="vq-display">Three steps. One afternoon.</h2>
    </div>
    <div class="vq-steps-big">
      ${[
        ['Describe', 'Tell VenQore what your business does, in sentences. What you sell, how you buy, who works there, what your accountant asks for. No forms, no 40-field wizard, no discovery call.'],
        ['Review your Blueprint', 'You get a plan: the modules you need, the ones you don\'t, your fields in your words, your tax rules, your roles, your approval chain, your reports. Every line is editable. Nothing is a black box.'],
        ['Go live', 'You approve, and the system exists. Not a demo — your live system, with your data model, ready for your first transaction. Change it later by describing the change and approving the diff.'],
      ].map(([t, b], i) => `
      <div class="vq-bigstep vq-reveal${i === 0 ? ' is-active' : ''}">
        <h3 class="vq-h3">${t}</h3>
        <p class="vq-tile__body vq-mt-3">${b}</p>
      </div>`).join('')}
    </div>
  </div>
</section>`;

const blueprint = `
<section class="vq-section vq-section--alt" id="blueprint">
  <div class="vq-amb"><span class="vq-amb__aurora" style="opacity:.28"></span></div>
  <div class="vq-container" style="position:relative">
    <div class="vq-section-head vq-reveal">
      <span class="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Blueprint</span>
      <h2 class="vq-display">Watch a business become a system.</h2>
      <p class="vq-lede">These are real sentences from real businesses, and a real composition of
        the modules VenQore ships. Pick one, or write your own at the top of the page.</p>
    </div>
    <div class="vq-reveal">${blueprintConsole()}</div>
    <div class="vq-row vq-wrap vq-gap-6 vq-mt-8 vq-reveal" style="justify-content:space-between">
      <p class="vq-small vq-text-2" style="max-width:56ch">
        Businesses change faster than implementations. Describe what's different — a second
        branch, a wholesale price tier, a new channel — and Blueprint shows you a diff: what's
        added, what changes, what's affected. Approve it or don't.
      </p>
      <a class="vq-link" href="blueprint.html">How Blueprint works ${icon('arrow', 15)}</a>
    </div>
  </div>
</section>`;

const ledger = `
<section class="vq-section vq-band-dark" id="ledger">
  <div class="vq-amb"><span class="vq-amb__beams"><i></i><i></i><i></i></span><span class="vq-amb__grain"></span></div>
  <div class="vq-container" style="position:relative">
    <div class="vq-section-head vq-reveal" style="max-width:820px">
      <span class="vq-eyebrow">Core Ledger</span>
      <h2 class="vq-display">AI decides what your system looks like.<br>It never decides what your numbers say.</h2>
      <p class="vq-lede">Every module — sales, purchases, stock, payroll, expenses — posts through one
        double-entry engine. The AI can add a module, rename a field, rewire a workflow. It cannot
        invent a balance. Debits equal credits, or the transaction does not post.</p>
    </div>

    <div class="vq-grid vq-grid--3">
      ${[
        ['ledger', 'One engine, every module', 'There is no second version of the truth to reconcile, because there is no second version. Your P&amp;L is not a report someone generated — it is the same data your till produced, read from the other end.'],
        ['shield', 'Verified, not asserted', 'Balance integrity, cost of goods, tax handling, multi-currency, inter-branch movement, period closing, reversal integrity. Seven independent correctness checks, run on every release.'],
        ['file', 'Auditable by design', 'Every posting traces back to the document, the user and the timestamp. Nothing is edited in place — corrections are reversals, the way accounting is supposed to work.'],
      ].map(([ic, t, b]) => `
      <article class="vq-card vq-card--xl vq-tile vq-reveal">
        <span class="vq-tile__icon">${icon(ic)}</span>
        <h3 class="vq-tile__title">${t}</h3>
        <p class="vq-tile__body">${b}</p>
      </article>`).join('')}
    </div>

    <div class="vq-row vq-wrap vq-gap-6 vq-mt-12 vq-reveal" style="justify-content:space-between;align-items:center">
      <p class="vq-h3" style="color:#fff;max-width:42ch">Most vendors ask you to trust that their accounting is right. We'd rather publish the check.</p>
      <a class="vq-btn vq-btn--lg vq-btn--onDark" href="ledger.html">Read how it works <span class="vq-btn__arrow">${icon('arrow', 16)}</span></a>
    </div>
  </div>
</section>`;

const modules = `
<section class="vq-section" id="modules">
  <div class="vq-container">
    <div class="vq-section-head vq-reveal">
      <span class="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">What's inside</span>
      <h2 class="vq-display">Everything the business actually runs on.<br>Nothing charged as a module.</h2>
      <p class="vq-lede">Ten groups, 144 shipped features. Your Blueprint turns on the ones your
        business needs and leaves the rest off — not greyed out with an upsell badge. Off.</p>
    </div>

    <div class="vq-grid vq-grid--3">
      ${[
        ['cart', 'Selling', 'Point of sale · Quotes &amp; invoices · Returns &amp; exchanges · Layaway &amp; credit sales · Multi-currency'],
        ['box', 'Stock', 'Multi-location inventory · Batch, serial &amp; expiry · Stock transfers · Adjustments &amp; counts · Reorder points'],
        ['truck', 'Buying', 'Purchase orders · Supplier bills · Goods received notes · Landed cost · Supplier credit terms'],
        ['ledger', 'Money', 'Double-entry ledger · Chart of accounts · Bank &amp; cash · Tax handling · Trial balance, P&amp;L, balance sheet'],
        ['users', 'People', '7 roles out of the box · Custom permissions · Approval chains · Shift &amp; attendance · Commission'],
        ['building', 'Customers', 'Customer accounts · Credit limits · Loyalty · Statements · Payment history'],
        ['branch', 'Branches', 'Unlimited locations · Per-branch stock, pricing and reporting · Inter-branch transfers · Consolidated view'],
        ['chart', 'Intelligence', 'Dashboards · Custom reports · Signals (retention &amp; risk) · Export to anything'],
        ['plug', 'Channels', 'VenSynQ multi-channel sync · WooCommerce · Amazon · eBay · TikTok Shop'],
      ].map(([ic, t, b]) => `
      <article class="vq-card vq-tile vq-reveal vq-card--interactive">
        <span class="vq-tile__icon">${icon(ic)}</span>
        <h3 class="vq-tile__title">${t}</h3>
        <p class="vq-tile__body">${b}</p>
      </article>`).join('')}
    </div>

    <div class="vq-center vq-mt-10 vq-reveal">
      <a class="vq-btn vq-btn--lg vq-btn--secondary" href="features.html">See everything inside <span class="vq-btn__arrow">${icon('arrow', 16)}</span></a>
    </div>
  </div>
</section>`;

const dashboard = `
<section class="vq-section vq-section--alt">
  <div class="vq-container vq-container--wide">
    <div class="vq-section-head vq-section-head--center vq-reveal">
      <span class="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Day one</span>
      <h2 class="vq-display">This is what a pharmacy gets.</h2>
      <p class="vq-lede">Not a template with the logo swapped. The batch and expiry card is there because
        the owner said "expiry"; a hardware store's Blueprint puts unit conversion in that slot instead.</p>
    </div>
    <div class="vq-reveal">${mockDashboard()}</div>
    <div class="vq-grid vq-grid--4 vq-mt-10">
      ${[
        ['Cards are chosen, not shipped', 'A cashier is never offered the P&amp;L card. No products recorded yet means no stock cards.'],
        ['Numbers step down, never clip', 'Currency drops first, then decimals, then magnitude. Full precision belongs in the ledger.'],
        ['Growth against zero is null', 'Not +100%. A number that means nothing is not displayed as a number that means something.'],
        ['Every chart has a table', 'It is the accessibility answer and the "let me check that" answer at the same time.'],
      ].map(([t, b]) => `
      <div class="vq-reveal">
        <h3 class="vq-small" style="font-weight:var(--vq-fw-semi)">${t}</h3>
        <p class="vq-caption vq-mt-2" style="max-width:none">${b}</p>
      </div>`).join('')}
    </div>
  </div>
</section>`;

const presets = `
<section class="vq-section" id="presets">
  <div class="vq-container">
    <div class="vq-section-head vq-reveal">
      <span class="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Presets</span>
      <h2 class="vq-display">Or start from a system that already fits.</h2>
      <p class="vq-lede">Six starting points, each one a real Blueprint. Pick the closest — you can
        change everything after.</p>
    </div>
    <div class="vq-grid vq-grid--3">
      ${[
        ['store', 'Retail shop', 'Fast checkout, real margins, stock that\'s right at closing time.'],
        ['truck', 'Wholesale &amp; distribution', 'Credit terms, price tiers, and knowing which customer stopped ordering.'],
        ['pill', 'Pharmacy', 'Batch and expiry tracking that won\'t let an expired item ring up.'],
        ['coffee', 'Restaurant &amp; café', 'Recipes that draw down ingredients, not just plates sold.'],
        ['wrench', 'Hardware &amp; auto parts', 'Deep catalogues, units that convert, and a margin you can actually see.'],
        ['branch', 'Multi-branch', 'One truth across every location, without a nightly sync.'],
      ].map(([ic, t, b]) => `
      <a class="vq-card vq-tile vq-reveal" href="onboarding.html">
        <span class="vq-tile__icon">${icon(ic)}</span>
        <h3 class="vq-tile__title">${t}</h3>
        <p class="vq-tile__body">${b}</p>
        <span class="vq-link vq-mt-3">Start here ${icon('arrow', 15)}</span>
      </a>`).join('')}
    </div>
  </div>
</section>`;

const ai = `
<section class="vq-section vq-section--alt">
  <div class="vq-amb"><span class="vq-amb__aurora" style="opacity:.22"></span></div>
  <div class="vq-container" style="position:relative">
    <div class="vq-section-head vq-reveal">
      <span class="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">AI that does the work</span>
      <h2 class="vq-display">The AI isn't a chat box in the corner.<br>It's how the work gets done.</h2>
    </div>

    <div class="vq-grid vq-grid--2">
      ${[
        ['spark', 'Blueprint', 'Describe your business. Approve the plan. The system exists.', 'Live'],
        ['scan', 'SmartCapture', 'The order came in as a voice note. It leaves as a sale. Photo, screenshot or audio in — a structured, posted transaction out.', 'Live'],
        ['chat', 'Vena', 'Ask your business a question in plain language. "Which customers owe me more than 60 days?" is a sentence, not a report builder.', 'Live'],
        ['signal', 'Signals', 'Know a customer is leaving while you can still keep them. Retention and risk intelligence that runs on statistics, with or without an AI key.', 'Live'],
      ].map(([ic, t, b, s]) => `
      <article class="vq-card vq-card--xl vq-tile vq-reveal vq-card--interactive">
        <div class="vq-row" style="justify-content:space-between">
          <span class="vq-tile__icon">${icon(ic)}</span>
          <span class="vq-badge vq-badge--success">${icon('check', 11)} ${s}</span>
        </div>
        <h3 class="vq-tile__title">${t}</h3>
        <p class="vq-tile__body">${b}</p>
      </article>`).join('')}
    </div>

    <div class="vq-card vq-card--xl vq-mt-8 vq-reveal">
      <div class="vq-row vq-wrap vq-gap-8" style="justify-content:space-between">
        <div style="max-width:46ch">
          <span class="vq-eyebrow vq-eyebrow--accent">VenSynQ</span>
          <h3 class="vq-h2 vq-mt-3">Sell in five places. Count your stock once.</h3>
          <p class="vq-tile__body vq-mt-4">One catalogue behind WooCommerce, Amazon, eBay and TikTok Shop.
            Orders land as sales, stock moves once, commission is isolated so your margin is the real one.
            Amazon SP-API approved.</p>
          <a class="vq-link vq-mt-5" href="features.html#channels">See the channel work ${icon('arrow', 15)}</a>
        </div>
        <div style="flex:1;min-width:260px;max-width:380px;align-self:center">${spark([18, 24, 21, 33, 29, 41, 38, 52, 47, 61, 58, 74], 340, 96)}</div>
      </div>
    </div>
  </div>
</section>`;

const proof = `
<section class="vq-section">
  <div class="vq-container">
    <div class="vq-section-head vq-reveal">
      <span class="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Proof</span>
      <h2 class="vq-display">We'd rather show you the tests than a wall of logos.</h2>
      <p class="vq-lede">We are early. Where a normal site puts "trusted by 10,000 businesses", we put
        the checks. Buyers of financial software respond to rigour more than popularity.</p>
    </div>
    <div class="vq-grid vq-grid--4">
      <div class="vq-card vq-card--xl vq-card--accent vq-stat vq-reveal">
        <span class="vq-stat__label">Correctness checks</span>
        <span class="vq-stat__value"><span data-count="7">7</span><span class="vq-stat__unit">/ 7 passing</span></span>
        <span class="vq-stat__note">Balance, COGS, tax, currency, inter-branch, close, reversal</span>
      </div>
      ${[
        ['Live businesses', '2', '', 'Running on it daily — including the shop it was built for'],
        ['Automated tests', '220', '', 'Across the suite, run on every release'],
        ['Features shipped', '144', '', 'Verified against routes, controllers and services'],
      ].map(([l, v, u, n]) => `
      <div class="vq-card vq-card--xl vq-stat vq-reveal">
        <span class="vq-stat__label">${l}</span>
        <span class="vq-stat__value"><span data-count="${v}" data-suffix="${u}">${v}${u}</span></span>
        <span class="vq-stat__note">${n}</span>
      </div>`).join('')}
    </div>
  </div>
</section>`;

const compare = `
<section class="vq-section vq-section--alt">
  <div class="vq-container">
    <div class="vq-section-head vq-reveal">
      <span class="vq-eyebrow">The alternatives</span>
      <h2 class="vq-display">What you're choosing between.</h2>
    </div>
    <div class="vq-table-wrap vq-reveal">
      <table class="vq-table vq-table--compare">
        <colgroup><col><col><col><col><col class="is-us"></colgroup>
        <thead><tr>
          <th></th><th>Spreadsheets + POS</th><th>Odoo / Zoho</th><th>NetSuite / SAP</th>
          <th style="color:var(--vq-accent-text)">VenQore</th>
        </tr></thead>
        <tbody>
        ${[
          ['Time to running', 'Already there', '4–12 weeks', '3–9 months', 'An afternoon'],
          ['Who configures it', 'You, forever', 'A partner firm', 'A partner firm', 'AI, then you'],
          ['Implementation cost', '—', 'Consultant fees', 'Substantial project cost', 'None'],
          ['Fits your business', 'You fit it', 'Configured to fit', 'Configured to fit', 'Built to fit'],
          ['One source of truth', 'No', 'Yes', 'Yes', 'Yes'],
          ['Double-entry everywhere', 'No', 'Yes', 'Yes', 'Yes'],
          ['Changing it later', 'Rebuild the sheet', 'Change request', 'Change request', 'Describe the change'],
          ['Starting price', 'Free-ish', 'Per-user, per-module', 'Enterprise', '$36/month'],
        ].map(r => `<tr>
          <td class="vq-table__row-head">${r[0]}</td>
          <td class="vq-text-3">${r[1]}</td><td class="vq-text-3">${r[2]}</td><td class="vq-text-3">${r[3]}</td>
          <td class="vq-table__win">${r[4]}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>
    <p class="vq-lede vq-mt-8 vq-reveal" style="max-width:64ch;color:var(--vq-text)">
      If you already have a working ERP and a team who knows it, don't switch. This is for the
      business that never got past the quote.
    </p>
  </div>
</section>`;

const pricing = `
<section class="vq-section">
  <div class="vq-container">
    <div class="vq-section-head vq-section-head--center vq-reveal">
      <h2 class="vq-display">Priced like software. Not like a project.</h2>
      <p class="vq-lede">Every plan includes the full system. Plans differ by scale, not by unlocking
        the parts you need.</p>
    </div>
    <div class="vq-grid vq-grid--3">
      ${[
        ['Starter', '$36', 'For a single shop getting everything into one place.', ['1 branch, up to 3 users', 'Point of sale, inventory, purchasing', 'Core Ledger + full financial reports'], false],
        ['Growth', '$63', 'For a business with more than one of something.', ['Up to 3 branches, 10 users', 'Multi-branch stock &amp; consolidated reporting', 'Signals, Vena, approval chains'], true],
        ['Scale', '$129', 'For multi-location businesses on more than one channel.', ['Unlimited branches, 25 users', 'VenSynQ multi-channel sync', 'Full API, custom reports'], false],
      ].map(([n, p, f, items, hot]) => `
      <div class="vq-plan${hot ? ' vq-plan--featured' : ''} vq-reveal">
        ${hot ? '<span class="vq-plan__flag">Most businesses start here</span>' : ''}
        <h3 class="vq-plan__name">${n}</h3>
        <p class="vq-plan__for">${f}</p>
        <div class="vq-plan__price"><span class="vq-plan__amt">${p}</span><span class="vq-plan__per">/month</span></div>
        <ul class="vq-plan__list">${items.map(i => `<li>${icon('check', 16)}<span>${i}</span></li>`).join('')}</ul>
        <a href="pricing.html" class="vq-btn ${hot ? 'vq-btn--primary' : 'vq-btn--secondary'} vq-btn--lg vq-btn--block">Choose ${n}</a>
      </div>`).join('')}
    </div>
    <div class="vq-center vq-mt-8 vq-reveal">
      <a class="vq-link" href="pricing.html">See full pricing ${icon('arrow', 15)}</a>
    </div>
  </div>
</section>`;

const founder = `
<section class="vq-section vq-section--alt">
  <div class="vq-container vq-container--narrow">
    <div class="vq-reveal">
      <span class="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Why this exists</span>
      <div class="vq-quote vq-mt-6">
        <p>I built this for my father's shop first. Everything since has been the same
        question, asked louder: why does software this important still arrive as a six-month project?</p>
      </div>
      <p class="vq-lede vq-mt-8">I'm not going to tell you thousands of businesses use VenQore. I'll tell you
        it's tested harder than most software that says they do — and that the person who wrote it answers
        the support email. That's a real trade-off. If it doesn't work for you, it's better we both know now.</p>
      <div class="vq-row vq-gap-4 vq-mt-8">
        <div style="width:44px;height:44px;border-radius:var(--vq-r-full);background:var(--vq-accent-quiet);border:1px solid var(--vq-accent-quiet-line);display:grid;place-items:center;color:var(--vq-accent-text);font-family:var(--vq-font-numeric);font-weight:600">AH</div>
        <div>
          <div class="vq-small" style="font-weight:var(--vq-fw-semi)">Abdullah Hashmi</div>
          <div class="vq-caption">Founder · Okara, Pakistan</div>
        </div>
      </div>
    </div>
  </div>
</section>`;

const faq = `
<section class="vq-section">
  <div class="vq-container vq-container--narrow">
    <div class="vq-section-head vq-reveal"><h2 class="vq-display">Questions people actually ask.</h2></div>
    <div class="vq-faq vq-reveal">
      ${[
        ['Is my accounting safe if an AI configured it?', 'The AI composes your system — which modules run, what your fields are called, who approves what. It never touches the accounting engine. Debits equal credits or the transaction does not post, and that rule is in the engine, not in a prompt.'],
        ['What if the Blueprint gets it wrong?', 'You see it before anything is real. Every line is editable, nothing posts to your books until you approve it, and every applied configuration keeps a version snapshot you can roll back.'],
        ['Can I change my system later?', 'Describe the change. Blueprint shows you a diff — what is added, what changes, what is affected — and you approve it or you don\'t. Adding a branch is a sentence, not a change request.'],
        ['Do you charge to import my data, or to leave?', 'No, and no. Import is included. Export everything, any time, in a format your next system can read.'],
        ['How big is the team?', 'One founder, currently. That is a real trade-off: you get someone who answers your email personally and ships weekly, and you don\'t get a 40-person support org. If that trade doesn\'t work for you, it\'s better we both know now.'],
        ['What does it cost to get started?', 'Starter is $36 a month. There is no implementation fee, no setup fee, no module fee and no consultant — which is the actual comparison, not the subscription line.'],
      ].map(([q, a]) => `
      <div class="vq-faq__item">
        <button class="vq-faq__q" type="button" aria-expanded="false">${q}<span class="vq-faq__sign"></span></button>
        <div class="vq-faq__a"><div><p>${a}</p></div></div>
      </div>`).join('')}
    </div>
  </div>
</section>`;

export default page({
  title: 'VenQore — The ERP that builds itself around your business',
  description: 'Describe your business in plain language. VenQore assembles the ERP that runs it — with double-entry accounting under every module. From $36/mo.',
  active: '',
  onHero: true,
  canvas: true,
  body: hero + `<div class="vq-page">` + trust + problem + how + blueprint + ledger + modules + dashboard + presets + ai + proof + compare + pricing + founder + faq + `</div>`,
  extraBody: `<script src="assets/fluid.js" defer></script>`,
});
