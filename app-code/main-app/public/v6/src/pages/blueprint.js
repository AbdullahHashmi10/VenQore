import { page, icon } from '../shell.js';
import { pageHead, blueprintConsole, mockDashboard } from '../bits.js';

const body = pageHead({
  eyebrow: 'Blueprint',
  h1: 'Describe your business. <em class="vq-italic">Approve</em> the plan. It exists.',
  lede: 'Blueprint is the part of VenQore that reads a paragraph about your business and returns a working system — the modules you need, your fields in your words, your roles, your tax rules, your reports. You see all of it before anything is real.',
  cta: `<a class="vq-btn vq-btn--primary vq-btn--lg" href="register.html">Start building <span class="vq-btn__arrow">${icon('arrow', 16)}</span></a>
        <a class="vq-btn vq-btn--secondary vq-btn--lg" href="onboarding.html">${icon('play', 15)} See a build</a>`,
}) + `

<section class="vq-section" style="padding-top:0">
  <div class="vq-container">
    <div class="vq-reveal">${blueprintConsole()}</div>
  </div>
</section>

<section class="vq-section vq-section--alt">
  <div class="vq-container">
    <div class="vq-section-head vq-reveal">
      <span class="vq-eyebrow">What's in a Blueprint</span>
      <h2 class="vq-display">Six things, and you can edit all six.</h2>
    </div>
    <div class="vq-grid vq-grid--3">
      ${[
        ['layers', 'Modules', 'Only the ones your business needs — and an explicit list of the ones it deliberately left off, with reasons. Not greyed out with an upsell badge. Absent.'],
        ['chat', 'Your vocabulary', 'If you call them jobs and not orders, the system says jobs. If your customers are patients, the menu says patients. It is one table, and it is yours to edit.'],
        ['users', 'Roles &amp; approvals', 'Who can discount, who can write off stock, what needs a second pair of eyes. Seven roles out of the box, and an approval chain shaped like your actual business.'],
        ['percent', 'Tax &amp; compliance', 'Set for how and where you actually sell. Inclusive or exclusive, per-item rates, the QR verification your receipts need.'],
        ['chart', 'Reports', 'The ones your business is judged by, on the dashboard, not buried five levels into a menu you never open.'],
        ['ledger', 'The ledger mapping', 'Which accounts each kind of transaction posts to. Editable, and never bypassable — that is the one line the AI is not allowed to cross.'],
      ].map(([ic, t, b]) => `
      <article class="vq-card vq-card--xl vq-tile vq-reveal vq-card--interactive">
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
    <div class="vq-grid vq-grid--2" style="align-items:center;gap:var(--vq-space-16)">
      <div class="vq-reveal">
        <span class="vq-eyebrow">Guardrails</span>
        <h2 class="vq-display vq-mt-4">What the AI cannot do.</h2>
        <p class="vq-lede vq-mt-6">The single biggest objection to AI touching business software is
          "I don't trust it with my money." That objection deserves an answer made of architecture,
          not reassurance.</p>
        <ul class="vq-stack vq-gap-4 vq-mt-8">
          ${[
            'Blueprint cannot post a transaction.',
            'It cannot alter the accounting engine.',
            'It cannot change historical data.',
            'It cannot bypass an approval chain it configured.',
          ].map(t => `<li class="vq-row vq-gap-3" style="align-items:flex-start">
            <span style="color:var(--vq-danger);flex:none;margin-top:2px">${icon('x', 18)}</span>
            <span class="vq-body">${t}</span></li>`).join('')}
        </ul>
        <p class="vq-h3 vq-mt-8" style="color:#fff">It builds the room; it doesn't touch the safe.</p>
      </div>
      <div class="vq-reveal">
        <div class="vq-card vq-card--xl">
          <span class="vq-eyebrow">The proposal it writes</span>
          <div class="vq-mt-4" style="font-family:var(--vq-font-numeric);font-size:var(--vq-fs-caption);line-height:1.9;color:rgb(237 242 239 / .82);word-spacing:normal">
            <div><span style="color:var(--vq-teal-300)">+</span> enable  <b>batch_expiry</b>          <span style="opacity:.5">// "batch and expiry"</span></div>
            <div><span style="color:var(--vq-teal-300)">+</span> enable  <b>multi_branch</b>          <span style="opacity:.5">// "two branches"</span></div>
            <div><span style="color:var(--vq-teal-300)">+</span> enable  <b>supplier_credit</b>       <span style="opacity:.5">// "30-day credit"</span></div>
            <div><span style="color:var(--vq-teal-300)">+</span> enable  <b>products</b>              <span style="opacity:.5">// required by batch_expiry</span></div>
            <div><span style="color:var(--vq-coral-400)">−</span> disable <b>recipes_bom</b>           <span style="opacity:.5">// not a kitchen</span></div>
            <div><span style="color:var(--vq-coral-400)">−</span> disable <b>table_service</b>         <span style="opacity:.5">// not a kitchen</span></div>
            <div class="vq-mt-3" style="opacity:.5">rename  customers → "Patients"</div>
            <div style="opacity:.5">rename  suppliers → "Distributors"</div>
            <div class="vq-mt-3" style="color:var(--vq-teal-300)">✓ dependencies satisfied · 0 conflicts · within plan</div>
          </div>
          <div class="vq-hr" style="margin-block:var(--vq-space-5)"></div>
          <p class="vq-caption" style="max-width:none;color:rgb(237 242 239 / .6)">
            Every proposal is validated before you see it, applied only on approval, and snapshotted
            so it can be rolled back. Enabling one thing enables what it requires — Cookbook requires
            Products, Khata requires Parties.
          </p>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="vq-section">
  <div class="vq-container">
    <div class="vq-grid vq-grid--2" style="align-items:center;gap:var(--vq-space-16)">
      <div class="vq-reveal">
        <span class="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Change it later</span>
        <h2 class="vq-display vq-mt-4">A change request is a sentence.</h2>
        <p class="vq-lede vq-mt-6">Businesses change faster than implementations. Describe what's
          different and Blueprint shows you a diff — what's added, what changes, what's affected.
          Approve it or don't.</p>
      </div>
      <div class="vq-table-wrap vq-reveal">
        <table class="vq-table">
          <thead><tr><th>The old way</th><th>With Blueprint</th></tr></thead>
          <tbody>
          ${[
            ['Discovery call', 'A text box'],
            ['Statement of work', 'A plan you can read in two minutes'],
            ['Configuration phase', 'Editing a line'],
            ['Change request', 'A sentence'],
            ['Go-live date', 'Today'],
          ].map(r => `<tr><td class="vq-text-3">${r[0]}</td><td class="vq-table__win">${r[1]}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</section>

<section class="vq-section vq-section--alt">
  <div class="vq-container vq-container--wide">
    <div class="vq-section-head vq-section-head--center vq-reveal">
      <span class="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">And then</span>
      <h2 class="vq-display">You approve, and the system exists.</h2>
      <p class="vq-lede">Not a demo. Your live system, with your data model, ready for your first transaction.</p>
    </div>
    <div class="vq-reveal">${mockDashboard()}</div>
  </div>
</section>`;

export default page({
  title: 'Blueprint — the AI that builds your ERP | VenQore',
  description: 'Describe your business in plain language. Blueprint drafts the system that runs it — modules, fields, roles, tax rules and reports. Review every line before anything is real.',
  active: 'product',
  body,
});
