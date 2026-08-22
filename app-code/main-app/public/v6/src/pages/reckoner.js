import { page, icon } from '../shell.js';
import { pageHead } from '../bits.js';

const PERIODS = [
  ['today', 'yesterday'], ['yesterday', 'the day before'], ['this week', 'the same span last week'],
  ['last week', 'the week before'], ['this month', 'the same span last month'], ['last month', 'the month before'],
  ['this quarter', 'the same quarter last year'], ['last quarter', 'the quarter before'],
  ['this year', 'the same span last year'], ['last year', 'the year before'],
  ['last 7 days', 'the preceding 7'], ['last 30 days', 'the preceding 30'],
  ['last 90 days', 'the preceding 90'], ['last 12 months', 'the preceding 12'],
  ['all time', '—'], ['a custom range', 'an equal-length preceding window'],
  ['as of a date', '—'], ['live', '—'],
];

const body = pageHead({
  eyebrow: 'The Reckoner',
  h1: 'One place a number can be <em class="vq-italic">defined</em>.',
  lede: 'A ready reckoner is a book of worked-out figures you look up instead of calculating yourself. That is exactly what this is. Nothing in VenQore calculates a number for display — everything asks the Reckoner.',
  amb: 'grid',
  cta: `<a class="vq-btn vq-btn--primary vq-btn--lg" href="register.html">Start building <span class="vq-btn__arrow">${icon('arrow', 16)}</span></a>
        <a class="vq-btn vq-btn--secondary vq-btn--lg" href="dashboard.html">See it on a dashboard</a>`,
}) + `

<section class="vq-section" style="padding-top:0">
  <div class="vq-container">
    <div class="vq-grid vq-grid--4">
      <div class="vq-card vq-card--xl vq-card--accent vq-stat vq-reveal">
        <span class="vq-stat__label">Readings</span>
        <span class="vq-stat__value"><span data-count="108">108</span></span>
        <span class="vq-stat__note">Every figure the product can show you, defined once</span>
      </div>
      ${[
        ['Period windows', '18', '', 'Each with a comparison window behind it'],
        ['Distinct figures', '1,944', '', 'Before anyone picks a chart or a size'],
        ['Places a number is defined', '1', '', 'And a build that fails if a second one appears'],
      ].map(([l, v, u, n]) => `
      <div class="vq-card vq-card--xl vq-stat vq-reveal">
        <span class="vq-stat__label">${l}</span>
        <span class="vq-stat__value">${v}${u}</span>
        <span class="vq-stat__note">${n}</span>
      </div>`).join('')}
    </div>
  </div>
</section>

<section class="vq-section vq-section--alt">
  <div class="vq-container">
    <div class="vq-grid vq-grid--2" style="gap:var(--vq-space-16);align-items:center">
      <div class="vq-reveal">
        <span class="vq-eyebrow">The problem it exists to kill</span>
        <h2 class="vq-display vq-mt-4">Six places computed "revenue". They disagreed.</h2>
        <p class="vq-lede vq-mt-6">That is the state most business software is in, and nobody tells you. A sale reversed by a
          journal entry vanishes from one figure and not the other. The dashboard says one number and the P&amp;L says
          another, and you cannot tell which is real.</p>
        <p class="vq-body vq-mt-6 vq-text-2">Once you cannot tell, you stop trusting all of them — and an ERP whose numbers
          you do not trust is a very expensive filing cabinet. So we made it structurally impossible: one registry, one
          definition per figure, and a check in the build that fails if a second definition appears anywhere in the codebase.</p>
      </div>
      <div class="vq-reveal">
        <div class="vq-card vq-card--xl">
          <span class="vq-eyebrow">One request, one answer</span>
          <div class="vq-mt-4" style="font-family:var(--vq-font-numeric);font-size:var(--vq-fs-caption);line-height:1.9;color:var(--vq-text-2);word-spacing:normal">
            <div><span style="color:var(--vq-accent-text)">reckoner</span>.read(<b style="color:var(--vq-text)">'finance.gross_profit'</b>,</div>
            <div style="padding-left:22px">period: <b style="color:var(--vq-text)">'this_quarter'</b>)</div>
            <div class="vq-mt-3" style="opacity:.55">→ value        842,610</div>
            <div style="opacity:.55">→ previous     731,400</div>
            <div style="opacity:.55">→ change_pct   +15.2</div>
            <div style="opacity:.55">→ compare      vs Q3 last year</div>
            <div style="opacity:.55">→ meta         cached · 4 min ago</div>
            <div style="opacity:.55">→ drill        /reports/profit-loss</div>
          </div>
          <div class="vq-hr" style="margin-block:var(--vq-space-5)"></div>
          <p class="vq-caption" style="max-width:none">The dashboard card, the P&amp;L report, the mobile app and the Windows
            app all ask this. They cannot disagree, because there is nothing for them to disagree about.</p>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="vq-section">
  <div class="vq-container">
    <div class="vq-section-head vq-reveal">
      <span class="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Eighteen windows</span>
      <h2 class="vq-display">Every figure, over any period, against the right comparison.</h2>
      <p class="vq-lede">The comparison is the hard part. "Up 15%" means nothing unless you know what it is up against —
        so every window carries its own, and the answer says which one it used.</p>
    </div>
    <div class="vq-table-wrap vq-reveal">
      <table class="vq-table">
        <thead><tr><th style="width:200px">Window</th><th>Compared against</th></tr></thead>
        <tbody>
          ${PERIODS.map(([a, b]) => `<tr><td class="vq-table__row-head">${a}</td><td class="vq-text-2">${b}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>
    <p class="vq-caption vq-mt-4" style="max-width:74ch">
      Quarters are calendar quarters and the year starts on 1 January — and every figure with a yearly window states that
      rule in its own help text, so nobody is guessing what they are looking at.
    </p>
  </div>
</section>

<section class="vq-section vq-band-dark">
  <div class="vq-amb"><span class="vq-amb__beams"><i></i><i></i><i></i></span><span class="vq-amb__grain"></span></div>
  <div class="vq-container" style="position:relative">
    <div class="vq-section-head vq-reveal" style="max-width:820px">
      <span class="vq-eyebrow">You never start from zero</span>
      <h2 class="vq-display">Your history outlives every change you make.</h2>
      <p class="vq-lede">Most systems lose your past the moment you tidy something up. Rename a category and its history
        splits in two. Change your business type and the labels move but the comparisons break. Neither happens here,
        and both are design decisions rather than luck.</p>
    </div>
    <div class="vq-grid vq-grid--2" style="gap:var(--vq-space-16)">
      <div class="vq-reveal">
        <div class="vq-timeline">
          ${[
            ['Day one', 'Your ledger opens. Every transaction from here is recorded against a permanent key, not a display name.'],
            ['Month three', 'You rename "Utilities" to "Electricity &amp; gas". The label changes everywhere. The three months behind it stay attached — because the history is keyed to the account, not the word.'],
            ['Month nine', 'You switch business type from Retail to Wholesale. Every figure relabels itself. Not one stored number moves.'],
            ['Year two', 'You add a second branch, and eight new cards. "This quarter versus the same quarter last year" answers immediately, because last year was never thrown away.'],
            ['Year four', 'You are still comparing against year one. Same keys, same definitions, same ledger.'],
          ].map(([w, b]) => `
          <div class="vq-timeline__item">
            <span class="vq-timeline__when">${w}</span>
            <p class="vq-body vq-mt-2" style="color:rgb(237 242 239 / .78);max-width:46ch">${b}</p>
          </div>`).join('')}
        </div>
      </div>
      <div class="vq-stack vq-gap-4 vq-reveal">
        ${[
          ['A key is permanent', 'The identifier behind every figure is a public, immutable name. To change what you see, we change the label. To retire a figure, we point it at its replacement. We never rename a key — because your saved dashboards and your history are hanging off it.'],
          ['History groups by identity, not by text', 'Expenses group by the account, displayed by the account name. Rename it and the past comes with it. This is a real bug we found and fixed in our own reports.'],
          ['Business type is a label layer', 'It changes display names per industry and never touches the maths. Switching it relabels everything and moves no data.'],
          ['Closed periods are sealed, not frozen', 'Historical months are precomputed and served instantly — and a snapshot is dropped the moment anyone back-dates an entry into its window. Turning the whole optimisation off changes no number, only the speed.'],
        ].map(([t, b]) => `
        <div class="vq-card vq-card--xl">
          <h3 class="vq-h3" style="color:#fff">${t}</h3>
          <p class="vq-tile__body vq-mt-3">${b}</p>
        </div>`).join('')}
      </div>
    </div>
  </div>
</section>

<section class="vq-section">
  <div class="vq-container">
    <div class="vq-section-head vq-reveal">
      <span class="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Questions a report cannot answer</span>
      <h2 class="vq-display">Six things we do differently, on purpose.</h2>
    </div>
    <div class="vq-grid vq-grid--3">
      ${[
        ['We do not show zero when we mean "we do not know"', 'A confident 0 where the truth is unknown is the most damaging thing a dashboard can display. Ours says not applicable, and explains why.'],
        ['A loss is called a loss', 'Gross Profit becomes Gross Loss. Net Cash Inflow becomes Net Cash Outflow. Tax Payable becomes Tax Refundable. Seven figures flip their word rather than just going red.'],
        ['Growth against nothing is not +100%', 'If last month was zero, this month\'s growth is null, not infinity dressed up as a triumph.'],
        ['What you bought and what you paid are two numbers', 'Purchases and Paid to Suppliers are kept apart and neither is ever labelled just "Purchases". A top spender with no receipts is not a data error — it is your biggest credit risk.'],
        ['"Do my books balance" is a status, not a trend', 'A discrepancy needs action, not a chart to watch it drift. It answers balanced or out of balance, with the amount as detail.'],
        ['Thresholds are yours, and they say so', 'Heavy discount, dormant customer, overstock, expiry warning — eight thresholds you set, and every figure that uses one names it in its own help text.'],
      ].map(([t, b]) => `
      <article class="vq-card vq-card--xl vq-tile vq-reveal">
        <h3 class="vq-tile__title">${t}</h3>
        <p class="vq-tile__body">${b}</p>
      </article>`).join('')}
    </div>
  </div>
</section>

<section class="vq-section vq-section--alt">
  <div class="vq-container">
    <div class="vq-grid vq-grid--2" style="gap:var(--vq-space-16);align-items:center">
      <div class="vq-reveal">
        <span class="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Speed</span>
        <h2 class="vq-display vq-mt-4">Nobody waits at the till so a dashboard can stay warm.</h2>
        <p class="vq-lede vq-mt-6">The obvious way to make a dashboard fast is to recompute everything whenever anything
          changes. Post a sale, recalculate every figure over every window — thousands of numbers, inside the checkout
          request, with a customer standing at the counter. Adding a chart would make the till slower. That is backwards.</p>
        <p class="vq-body vq-mt-6 vq-text-2">So we compute when asked, remember the answer, and forget it the moment the
          underlying data changes. The number is always there and always right. The only difference is <b style="color:var(--vq-text)">when</b>
          the work happens: while someone is looking, not while someone is selling.</p>
      </div>
      <div class="vq-reveal">
        <div class="vq-card vq-card--xl">
          <span class="vq-eyebrow">What invalidates what</span>
          <div class="vq-mt-5 vq-stack vq-gap-3">
            ${[['Sale posted, voided or returned', 'sales · finance · inventory'],
               ['Purchase or goods receipt', 'purchasing · inventory · finance'],
               ['Journal entry', 'finance'],
               ['Stock movement or adjustment', 'inventory'],
               ['Expense recorded', 'finance'],
               ['Production run completed', 'inventory · finance'],
               ['Payment received or made', 'finance · party'],
               ['Staff clock in or out', 'operations']]
              .map(([e, d]) => `<div class="vq-row vq-gap-3" style="justify-content:space-between;align-items:baseline">
                <span class="vq-small">${e}</span>
                <span class="vq-caption vq-num" style="color:var(--vq-accent-text);white-space:nowrap">${d}</span></div>`).join('')}
          </div>
          <p class="vq-caption vq-mt-5" style="max-width:none">Eight write events, invalidating by domain. Everything else
            stays warm — so a stock adjustment never makes your P&amp;L recompute for no reason.</p>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="vq-section vq-band-dark">
  <div class="vq-amb"><span class="vq-amb__grain"></span></div>
  <div class="vq-container vq-container--narrow" style="position:relative">
    <div class="vq-reveal">
      <span class="vq-eyebrow">Being straight about it</span>
      <h2 class="vq-display vq-mt-4">We audited ourselves and found twelve cards lying.</h2>
      <p class="vq-lede vq-mt-6">In August we ran a line-by-line audit of our own metrics against the code on disk. Twelve
        of them were returning invented data — a customer called Ali Raza who did not exist in anyone's database, a payment
        split of 60/40 cash to card pulled from nothing and applied to a real total.</p>
      <p class="vq-body vq-mt-6" style="color:rgb(237 242 239 / .74)">We withdrew all twelve the same week, told the users
        who had them on their dashboards exactly which figures were affected, and wrote the rule that stops it happening
        again: a source may only return a value it read from the data. Not a sample, not a placeholder, not a
        realistic-looking default. There is no flag that makes it acceptable.</p>
      <div class="vq-quote vq-mt-8">
        <p style="color:#fff">The deeper failure was not the twelve. It was that 112 green tests and a clean build
        reported success while the product returned invented data. Every check we had was structural.</p>
      </div>
      <p class="vq-body vq-mt-8" style="color:rgb(237 242 239 / .74)">What replaced them: a test that seeds two different
        datasets, asks the same figure of each, and fails if the answers match. A grep that fails the build if a sample
        value appears in a data source. And a rule that an implemented figure executing zero queries is fabricated by
        definition.</p>
      <a class="vq-btn vq-btn--lg vq-btn--onDark vq-mt-8" href="ledger.html">The seven correctness checks <span class="vq-btn__arrow">${icon('arrow', 16)}</span></a>
    </div>
  </div>
</section>`;

export default page({
  title: 'The Reckoner — one place a number can be defined | VenQore',
  description: '108 readings, 18 period windows, one definition each. The dashboard and the P&L cannot disagree, growth against zero is null not +100%, and your history survives every rename.',
  active: 'product',
  body,
});
