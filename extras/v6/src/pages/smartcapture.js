import { page, icon } from '../shell.js';
import { pageHead } from '../bits.js';

const body = pageHead({
  eyebrow: 'SmartCapture',
  h1: 'The order came in as a voice note. It <em class="vq-italic">leaves</em> as a sale.',
  lede: 'Photograph a supplier bill. Forward a WhatsApp screenshot. Say what you sold on the walk back from the counter. SmartCapture reads it, matches every line to your catalogue, and hands you a transaction to approve.',
  amb: 'aurora',
  cta: `<a class="vq-btn vq-btn--primary vq-btn--lg" href="register.html">Try it free <span class="vq-btn__arrow">${icon('arrow', 16)}</span></a>
        <a class="vq-btn vq-btn--secondary vq-btn--lg" href="pricing.html#ai">What it costs</a>`,
}) + `

<section class="vq-section" style="padding-top:0">
  <div class="vq-container">
    <div class="vq-demo vq-reveal" data-capture>
      <div class="vq-demo__bar">
        <div class="vq-demo__dots"><i></i><i></i><i></i></div>
        <div class="vq-demo__url">${icon('lock', 11)} app.venqore.com/capture</div>
        <span class="vq-demo__live">Live · try it</span>
      </div>
      <div class="vq-demo__controls">
        <span class="vq-eyebrow" style="flex:none">Point it at</span>
        <div class="vq-demo__scroller" data-capture-tabs role="tablist"></div>
      </div>
      <div class="vq-cap">
        <div class="vq-cap__in">
          <div class="vq-cap__stage" data-capture-stage></div>
          <button type="button" class="vq-btn vq-btn--primary vq-btn--lg vq-btn--block vq-mt-4" data-capture-run>Read it</button>
        </div>
        <div class="vq-cap__out" data-capture-out></div>
      </div>
    </div>
  </div>
</section>

<section class="vq-section vq-section--alt">
  <div class="vq-container">
    <div class="vq-section-head vq-reveal">
      <span class="vq-eyebrow">The arithmetic</span>
      <h2 class="vq-display">Where the day actually goes.</h2>
      <p class="vq-lede">Nobody opens a business to type. A forty-line supplier bill is twenty minutes of entry and one
        transposed digit away from a stock count that will not tie for a month.</p>
    </div>
    <div class="vq-grid vq-grid--4">
      <div class="vq-card vq-card--xl vq-card--accent vq-stat vq-reveal">
        <span class="vq-stat__label">A 40-line bill</span>
        <span class="vq-stat__value">11<span class="vq-stat__unit">seconds</span></span>
        <span class="vq-stat__note">Photograph, read, match, review, post</span>
      </div>
      ${[
        ['By hand', '20', 'minutes', 'Item, quantity, rate, tax, line by line'],
        ['Bills a week', '30', '+', 'For a shop with four regular distributors'],
        ['Hours a month', '38', '', 'Spent typing what a camera can read'],
      ].map(([l, v, u, n]) => `
      <div class="vq-card vq-card--xl vq-stat vq-reveal">
        <span class="vq-stat__label">${l}</span>
        <span class="vq-stat__value">${v}${u ? `<span class="vq-stat__unit">${u}</span>` : ''}</span>
        <span class="vq-stat__note">${n}</span>
      </div>`).join('')}
    </div>
    <p class="vq-caption vq-mt-5 vq-reveal" style="max-width:74ch">
      Those are our own timings on our own bills, on a shop with four distributors — not an industry study. Yours will differ.
      The point is not the number; it is that the work is a photograph rather than an afternoon.
    </p>
  </div>
</section>

<section class="vq-section">
  <div class="vq-container">
    <div class="vq-section-head vq-reveal">
      <span class="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">What it will read</span>
      <h2 class="vq-display">Whatever the day hands you.</h2>
    </div>
    <div class="vq-grid vq-grid--3">
      ${[
        ['scan', 'A photograph of a bill', 'Crumpled, angled, thermal, handwritten totals. It reads the lines, not the layout — so a distributor changing their template does not break anything.'],
        ['file', 'A PDF or a screenshot', 'The order that arrived as a WhatsApp picture of a list. The statement your supplier emailed. Forward it in and it comes back structured.'],
        ['mic', 'A voice note', 'In Urdu, in English, or in the mix people actually speak. Say what you sold and to whom; it comes back as a sale with the customer attached.'],
        ['box', 'A packing list', 'Against the purchase order you already raised, so the goods receipt shows ordered, received and remaining side by side.'],
        ['percent', 'A price list', 'Bulk-update cost prices from the sheet your distributor sent, with every change shown before anything is applied.'],
        ['users', 'A stack of business cards', 'Straight into your customer book, deduplicated against the numbers you already have.'],
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
    <div class="vq-section-head vq-reveal" style="max-width:820px">
      <span class="vq-eyebrow">The part that matters</span>
      <h2 class="vq-display">It matches. It does not guess.</h2>
      <p class="vq-lede">Reading a bill is the easy half. The half that decides whether this saves you time or costs you a
        weekend is what happens to a line the system has never seen before.</p>
    </div>
    <div class="vq-grid vq-grid--2">
      ${[
        ['Matched against your catalogue, not a dictionary', 'Every line resolves to an item you actually stock — by SKU, by barcode, by the name your distributor uses, or by the name you use. The mapping is remembered, so the second bill from that supplier is cleaner than the first.'],
        ['A line it cannot match is flagged, never invented', 'It says "new item" and stops. You decide whether to create it. There is no threshold at which the system quietly makes something up, because a plausible wrong line is far more expensive than an obvious blank one.'],
        ['It checks the rate against what you last paid', 'A cost that jumped 40% since the last delivery is surfaced before you post, not discovered at month end when the margin looks wrong.'],
        ['Nothing posts until you approve it', 'The extraction is a proposal. You see every line, every match, every quantity and every rate, and the ledger is untouched until you press post.'],
      ].map(([t, b]) => `
      <div class="vq-card vq-card--xl vq-reveal">
        <h3 class="vq-h3" style="color:#fff">${t}</h3>
        <p class="vq-tile__body vq-mt-3">${b}</p>
      </div>`).join('')}
    </div>
    <div class="vq-card vq-card--xl vq-mt-8 vq-reveal">
      <div class="vq-row vq-wrap vq-gap-6" style="justify-content:space-between;align-items:center">
        <p class="vq-h3" style="color:#fff;max-width:52ch">The rule the whole system is built on: a source may only return a
          value it read from the data. Never a sample, never a placeholder, never a realistic-looking default.</p>
        <a class="vq-btn vq-btn--lg vq-btn--onDark" href="reckoner.html">Why we are strict about this <span class="vq-btn__arrow">${icon('arrow', 16)}</span></a>
      </div>
    </div>
  </div>
</section>

<section class="vq-section">
  <div class="vq-container">
    <div class="vq-grid vq-grid--2" style="gap:var(--vq-space-16);align-items:center">
      <div class="vq-reveal">
        <span class="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">What it costs</span>
        <h2 class="vq-display vq-mt-4">One page in, one credit out. Visible before you spend it.</h2>
        <p class="vq-lede vq-mt-6">Models cost money to run. Rather than bury that in the plan price and quietly raise it
          later, we show you the meter. A fourteen-page PDF will use fourteen pages, and the screen says so and asks once.</p>
        <a class="vq-btn vq-btn--primary vq-btn--lg vq-mt-8" href="pricing.html#ai">See the AI pricing <span class="vq-btn__arrow">${icon('arrow', 16)}</span></a>
      </div>
      <div class="vq-stack vq-gap-4 vq-reveal">
        ${[
          ['Included every month', 'Starter 20 pages · Growth 60 · Scale 150. Enough for a normal week of bills without thinking about it.'],
          ['Top up when you need to', '200 more pages for $2. A one-off purchase, not a change to your subscription — and we stop at your cap rather than billing past it.'],
          ['Or bring your own key', 'Connect your own model provider and pay them directly. We do not mark up a key you supply. One unlock, then free for as long as you use VenQore.'],
          ['We never silently truncate', 'And we never silently charge. If a document is too long for your remaining allowance, you are told before it runs, not after.'],
        ].map(([t, b]) => `
        <div class="vq-card"><b class="vq-small" style="font-weight:var(--vq-fw-semi)">${t}</b>
        <p class="vq-caption vq-mt-2" style="max-width:none">${b}</p></div>`).join('')}
      </div>
    </div>
  </div>
</section>

<section class="vq-section vq-section--alt">
  <div class="vq-container vq-container--narrow">
    <div class="vq-section-head vq-reveal"><h2 class="vq-display">The questions people ask.</h2></div>
    <div class="vq-faq vq-reveal">
      ${[
        ['What happens to my photographs?', 'They go to the model provider to be read, and then they are yours. We do not train anything on your bills, we do not sell them, and you can delete a capture and its source image together.'],
        ['How accurate is it, honestly?', 'On clean printed bills from a distributor you buy from regularly, near enough that reviewing is faster than typing. On a crumpled handwritten note it will get most of it and flag the rest. It is designed to be reviewed, which is why every line shows its match.'],
        ['Does it work in Urdu?', 'Voice notes, yes — including the English-Urdu mix people actually speak. Handwritten Urdu on a bill is harder and you should expect to correct lines.'],
        ['What if my distributor changes their invoice layout?', 'Nothing breaks. It reads the lines, not the template — there is no per-supplier setup to maintain and nothing to re-map when a format changes.'],
        ['Can it post straight through without me looking?', 'No, and that is deliberate. The extraction is a proposal. Anything that writes to your ledger without a human approving it is one bad read away from a month of reconciliation.'],
        ['Do I need an AI key?', 'No. Every plan includes a monthly allowance on our infrastructure. Bringing your own key is an option for heavy use, not a requirement.'],
      ].map(([q, a]) => `
      <div class="vq-faq__item">
        <button class="vq-faq__q" type="button" aria-expanded="false">${q}<span class="vq-faq__sign"></span></button>
        <div class="vq-faq__a"><div><p>${a}</p></div></div>
      </div>`).join('')}
    </div>
  </div>
</section>`;

export default page({
  title: 'SmartCapture — a photo in, a posted transaction out | VenQore',
  description: 'Photograph a supplier bill, forward a WhatsApp screenshot, or send a voice note. SmartCapture reads it, matches every line to your catalogue, flags what it cannot match, and hands you a transaction to approve.',
  active: 'product',
  demos: true,
  body,
});
