import { page, icon } from '../shell.js';

const body = `
<section class="vq-section" style="padding-top:clamp(140px,15vw,200px)">
  <div class="vq-amb"><span class="vq-amb__aurora" style="opacity:.26"></span></div>
  <div class="vq-container" style="position:relative">
    <div class="vq-grid" style="grid-template-columns:minmax(0,1fr) minmax(0,520px);gap:var(--vq-space-16);align-items:start">

      <div class="vq-reveal">
        <span class="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Contact</span>
        <h1 class="vq-display vq-mt-4">A <em class="vq-italic">person</em> answers this one.</h1>
        <p class="vq-lede vq-mt-6">There is no ticket queue and no chatbot in front of it. Tell us
          what you are trying to do and you will get a reply from someone who can actually change
          the product.</p>

        <div class="vq-stack vq-gap-4 vq-mt-10">
          ${[
            ['spark', 'Trying VenQore', 'You do not need to talk to anyone to start. Describe your business, review the Blueprint, and go live the same day.', 'Start building', 'register.html'],
            ['building', 'More than 10 branches, or something specific', 'Multi-entity, an unusual tax regime, a migration off something large — say so in the form and we will scope it properly.', 'See pricing', 'pricing.html'],
            ['plug', 'Partnerships &amp; integrations', 'If you run a channel, a payment rail or an accounting practice, there is probably something worth building.', 'Read the feature list', 'features.html'],
          ].map(([ic, t, b, cta, href]) => `
          <div class="vq-card vq-reveal">
            <div class="vq-row vq-gap-4" style="align-items:flex-start">
              <span class="vq-tile__icon" style="margin-bottom:0">${icon(ic)}</span>
              <div>
                <h2 class="vq-h3">${t}</h2>
                <p class="vq-tile__body vq-mt-2">${b}</p>
                <a class="vq-link vq-mt-3" href="${href}">${cta} ${icon('arrow', 15)}</a>
              </div>
            </div>
          </div>`).join('')}
        </div>

        <div class="vq-hr"></div>
        <div class="vq-row vq-wrap vq-gap-8">
          <div>
            <span class="vq-eyebrow">Email</span>
            <p class="vq-small vq-mt-2"><a href="mailto:hello@venqore.com">hello@venqore.com</a></p>
          </div>
          <div>
            <span class="vq-eyebrow">Where we are</span>
            <p class="vq-small vq-mt-2">Okara, Punjab, Pakistan · UTC+5</p>
          </div>
          <div>
            <span class="vq-eyebrow">Typical reply</span>
            <p class="vq-small vq-mt-2">Within one working day</p>
          </div>
        </div>
      </div>

      <div class="vq-card vq-card--xl vq-reveal" style="position:sticky;top:120px">
        <h2 class="vq-h3">Tell us what you need</h2>
        <p class="vq-caption vq-mt-2" style="max-width:none">The more specific you are, the more useful the reply.</p>
        <form class="vq-stack vq-gap-5 vq-mt-6" data-demo>
          <div class="vq-grid vq-grid--2" style="gap:var(--vq-space-4)">
            <div class="vq-field">
              <label class="vq-label" for="c-name">Your name</label>
              <input class="vq-input" id="c-name" name="name" required autocomplete="name">
            </div>
            <div class="vq-field">
              <label class="vq-label" for="c-biz">Business name</label>
              <input class="vq-input" id="c-biz" name="business" autocomplete="organization">
            </div>
          </div>
          <div class="vq-field">
            <label class="vq-label" for="c-email">Work email</label>
            <input class="vq-input" id="c-email" name="email" type="email" required autocomplete="email" placeholder="you@company.com">
            <span class="vq-help">We reply here. No list, no sequence.</span>
          </div>
          <div class="vq-field">
            <label class="vq-label" for="c-topic">What is this about?</label>
            <select class="vq-select" id="c-topic" name="topic">
              <option>Getting started</option>
              <option>Something specific my business needs</option>
              <option>Migrating from another system</option>
              <option>Pricing for more than 10 branches</option>
              <option>Partnership or integration</option>
              <option>Something is broken</option>
            </select>
          </div>
          <div class="vq-field">
            <label class="vq-label" for="c-msg">How does your business work?</label>
            <textarea class="vq-textarea" id="c-msg" name="message" required
              placeholder="What you sell, how you buy, how many people, how many locations — and the thing that is currently painful."></textarea>
          </div>
          <label class="vq-check">
            <input type="checkbox" name="updates">
            <span class="vq-caption" style="max-width:none">Send me product updates, roughly monthly. No marketing.</span>
          </label>
          <button type="submit" class="vq-btn vq-btn--primary vq-btn--lg vq-btn--block">Send it</button>
          <p class="vq-caption vq-center" style="max-width:none">
            You do not need to do this to try VenQore. <a href="register.html">Start building →</a>
          </p>
        </form>
      </div>

    </div>
  </div>
</section>`;

export default page({
  title: 'Contact — a person answers this one | VenQore',
  description: 'Tell us what your business does and what is currently painful. No ticket queue, no chatbot — a reply from someone who can change the product.',
  active: 'company',
  body,
  cta: false,
});
