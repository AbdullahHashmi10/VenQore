import { page, icon } from '../shell.js';
import { pageHead } from '../bits.js';

const body = pageHead({
  eyebrow: 'About',
  h1: 'Built on a shop counter in <em class="vq-italic">Okara</em>.',
  lede: 'VenQore started because a retail business needed software that did not exist, and the quotes for the software that came close were larger than the business.',
  amb: 'aurora',
}) + `

<section class="vq-section" style="padding-top:0">
  <div class="vq-container">
    <div class="vq-grid" style="grid-template-columns:minmax(0,1fr) minmax(0,420px);gap:var(--vq-space-16);align-items:start">
      <div class="vq-reveal">
        <p class="vq-lede" style="color:var(--vq-text)">My father runs a shop. For years the numbers
          lived in three places: a till that only counted money, a notebook that tracked who owed what,
          and a spreadsheet that tried to hold the rest together. None of them agreed, and the month
          only closed when someone sat down for a weekend and made them agree.</p>
        <p class="vq-body vq-mt-6 vq-text-2">Every ERP that would have fixed it arrived the same way:
          a discovery call, a statement of work, a configuration phase, and a number with an extra
          digit on it. Somewhere in month four you decide the spreadsheet was fine.</p>
        <p class="vq-body vq-mt-6 vq-text-2">So I wrote the thing that should have existed. It started
          as a point of sale. It became a ledger, because a point of sale that cannot tell you your
          margin is a cash drawer with a screen. Then it became stock, purchasing, khata, payroll,
          reports — and at some point it stopped being a POS and started being an ERP that a shop
          could actually run on.</p>
        <p class="vq-body vq-mt-6 vq-text-2">The last piece is the one this site is named for. Every
          business that asked for it wanted a slightly different shape, and configuring each one by
          hand does not scale past about ten customers. So the configuration became the product:
          describe your business, and the system composes itself out of parts that already exist and
          already post through one ledger.</p>
        <div class="vq-quote vq-mt-10">
          <p>We are not building twenty products and waiting. We built one, we sell it today, and we
          are generalising it one capability at a time — in public, funded by customers.</p>
        </div>
      </div>

      <aside class="vq-stack vq-gap-4 vq-reveal" style="position:sticky;top:120px">
        ${[
          ['Founded', '2025', 'Okara, Pakistan'],
          ['Team', '1', 'Founder, engineer and support desk'],
          ['Funding', 'Self', 'No outside money to date'],
          ['Live businesses', '2', 'Including the shop it was built for'],
        ].map(([l, v, n], i) => `
        <div class="vq-card${i === 3 ? ' vq-card--accent' : ''} vq-stat">
          <span class="vq-stat__label">${l}</span>
          <span class="vq-stat__value vq-stat__value--sm">${v}</span>
          <span class="vq-stat__note">${n}</span>
        </div>`).join('')}
      </aside>
    </div>
  </div>
</section>

<section class="vq-section vq-band-dark">
  <div class="vq-amb"><span class="vq-amb__beams"><i></i><i></i><i></i></span><span class="vq-amb__grain"></span></div>
  <div class="vq-container" style="position:relative">
    <div class="vq-section-head vq-reveal">
      <span class="vq-eyebrow">What we believe</span>
      <h2 class="vq-display">Four opinions, held on purpose.</h2>
    </div>
    <div class="vq-grid vq-grid--2">
      ${[
        ['Software should fit the business, not the reverse.', 'Every system worth having was built for a business that is not yours. The industry\'s answer to that is a consultant. Ours is a builder.'],
        ['Money is not a place to be clever.', 'The AI composes the system. It never touches the engine that decides what your numbers say. Flexible where it should be, rigid where it must be.'],
        ['Publish the check, don\'t ask for trust.', 'Where a normal site puts a logo wall, we put the correctness tests. Buyers of financial software respond to rigour more than popularity.'],
        ['Price it so the businesses who need it can afford it.', 'The shops that most need one honest set of numbers are exactly the ones priced out of getting them. That is the whole reason this exists.'],
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
      <span class="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Where it goes</span>
      <h2 class="vq-display">One core. More businesses on it.</h2>
      <p class="vq-lede">Six verticals run on VenQore today with no engine missing. The next wave is
        blocked on one thing — scheduling — and building it once unlocks gyms, salons, clinics,
        rentals and repair shops at the same time. We announce a vertical when it is ready, not when
        it is planned.</p>
    </div>
    <div class="vq-table-wrap vq-reveal">
      <table class="vq-table">
        <thead><tr><th>Vertical</th><th class="num" style="width:130px">Coverage</th><th>What is missing</th></tr></thead>
        <tbody>
        ${[
          ['Retail, grocery, karyana', '98%', '—', 1],
          ['Restaurant &amp; café', '95%', 'Table reservations', 1],
          ['Wholesale &amp; distribution', '95%', 'Route / van sales', 1],
          ['Hardware, auto parts, electronics', '95%', '—', 1],
          ['Pharmacy', '90%', 'Prescription record', 1],
          ['Manufacturing &amp; workshop', '85%', 'Per-job costing', 1],
          ['Gym, salon, clinic, rental', '40–70%', 'Scheduling engine — in design', 0],
        ].map(r => `<tr>
          <td class="vq-table__row-head">${r[0]}</td>
          <td class="num ${r[3] ? 'vq-table__win' : 'vq-text-3'}">${r[1]}</td>
          <td class="vq-text-2">${r[2]}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>
    <p class="vq-caption vq-mt-4" style="max-width:none">Coverage is measured against the capability
      registry, not against a wish list. A vertical is announced when its gap is two entries or fewer.</p>
  </div>
</section>

<section class="vq-section vq-section--alt">
  <div class="vq-container vq-container--narrow">
    <div class="vq-reveal">
      <span class="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">The trade-off, said out loud</span>
      <h2 class="vq-display vq-mt-4">One person, currently.</h2>
      <p class="vq-lede vq-mt-6">You get someone who answers your email personally and ships weekly.
        You do not get a 40-person support organisation, a account manager, or a phone number that
        rings at three in the morning. Those are real things to want. If that trade does not work for
        you, it is better we both know now.</p>
      <p class="vq-body vq-mt-6 vq-text-2">What you also get is a product whose author has run the
        thing it is for. The batch-expiry rules exist because an expired box got sold once. The
        cashier inactivity timeout exists because a till was left open. None of it came out of a
        requirements document.</p>
      <div class="vq-row vq-gap-4 vq-mt-8">
        <div style="width:48px;height:48px;border-radius:var(--vq-r-full);background:var(--vq-accent-quiet);border:1px solid var(--vq-accent-quiet-line);display:grid;place-items:center;color:var(--vq-accent-text);font-family:var(--vq-font-numeric);font-weight:600">AH</div>
        <div>
          <div class="vq-small" style="font-weight:var(--vq-fw-semi)">Abdullah Hashmi</div>
          <div class="vq-caption">Founder · <a href="contact.html">Email him directly</a></div>
        </div>
      </div>
    </div>
  </div>
</section>`;

export default page({
  title: 'About — built on a shop counter in Okara | VenQore',
  description: 'VenQore is an AI ERP builder written by one founder for a retail business that could not afford the alternatives. Self-funded, running two live businesses, shipping weekly.',
  active: 'company',
  body,
});
