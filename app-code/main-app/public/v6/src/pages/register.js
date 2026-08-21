import { page, icon } from '../shell.js';

const body = `
<div class="vq-auth">

  <div class="vq-auth__pane">
    <div class="vq-auth__form">
      <a class="vq-brand" href="index.html" style="margin-bottom:var(--vq-space-8)">
        <img src="assets/logo.png" alt="" width="32" height="32" style="height:32px">
        <span class="vq-brand__word">VenQore</span>
      </a>

      <h1 class="vq-h1">Create your system</h1>
      <p class="vq-lede vq-mt-3" style="font-size:var(--vq-fs-body)">
        14 days, the full product, no card. You will see what it becomes before you decide anything.
      </p>

      <form class="vq-stack vq-gap-5 vq-mt-8" data-demo>
        <div class="vq-field">
          <label class="vq-label" for="r-name">Your name</label>
          <input class="vq-input" id="r-name" name="name" required autocomplete="name">
        </div>
        <div class="vq-field">
          <label class="vq-label" for="r-email">Work email</label>
          <input class="vq-input" id="r-email" name="email" type="email" required autocomplete="email" placeholder="you@company.com">
          <span class="vq-help">We'll send the login link here.</span>
        </div>
        <div class="vq-field">
          <label class="vq-label" for="r-pass">Password</label>
          <input class="vq-input" id="r-pass" name="password" type="password" required autocomplete="new-password" minlength="10">
          <span class="vq-help">At least 10 characters. This is the account that owns your ledger — make it a real one.</span>
        </div>
        <div class="vq-field">
          <label class="vq-label" for="r-country">Where do you operate?</label>
          <select class="vq-select" id="r-country" name="country">
            <option>Pakistan</option><option>United Arab Emirates</option><option>Saudi Arabia</option>
            <option>United Kingdom</option><option>United States</option><option>Somewhere else</option>
          </select>
          <span class="vq-help">Sets your currency, tax defaults and date format. Changeable later.</span>
        </div>
        <label class="vq-check">
          <input type="checkbox" name="terms" required>
          <span class="vq-caption" style="max-width:none">
            I agree to the <a href="/terms">Terms</a> and the <a href="/privacy">Privacy Policy</a>.
          </span>
        </label>
        <button type="submit" class="vq-btn vq-btn--primary vq-btn--xl vq-btn--block">
          Create my system <span class="vq-btn__arrow">${icon('arrow', 17)}</span>
        </button>
        <p class="vq-caption vq-center" style="max-width:none">
          No card required. We'll remind you before the trial ends.
        </p>
      </form>

      <p class="vq-caption vq-center vq-mt-8" style="max-width:none">
        Already have a system? <a href="signin.html">Sign in →</a>
      </p>
    </div>
  </div>

  <aside class="vq-auth__aside vq-band-dark">
    <div class="vq-amb"><span class="vq-amb__beams"><i></i><i></i><i></i></span><span class="vq-amb__grain"></span></div>
    <div style="position:relative;padding:clamp(48px,6vw,80px);align-self:center;max-width:560px">
      <span class="vq-eyebrow">What happens next</span>
      <h2 class="vq-h1 vq-mt-4" style="color:#fff">Four minutes, then it exists.</h2>

      <ol class="vq-stack vq-gap-6 vq-mt-10">
        ${[
          ['Describe your business', 'In sentences, not a form. What you sell, how you buy, who works there.'],
          ['Review your Blueprint', 'Modules in, modules out, your fields in your words. Every line editable.'],
          ['Pick a plan', 'Or don\'t — the trial runs for 14 days either way, on the full product.'],
          ['Go live', 'Your system, your data model, ready for the first transaction.'],
        ].map(([t, b], i) => `
        <li class="vq-row vq-gap-4" style="align-items:flex-start">
          <span style="flex:none;width:28px;height:28px;border-radius:var(--vq-r-full);display:grid;place-items:center;background:rgb(35 196 166 / .16);border:1px solid rgb(35 196 166 / .30);color:var(--vq-teal-300);font-family:var(--vq-font-numeric);font-size:12px;font-weight:600">${i + 1}</span>
          <div>
            <b class="vq-body" style="color:#fff;font-weight:var(--vq-fw-semi)">${t}</b>
            <p class="vq-small vq-mt-1" style="color:rgb(237 242 239 / .66);max-width:none">${b}</p>
          </div>
        </li>`).join('')}
      </ol>

      <div class="vq-hr" style="background:rgb(255 255 255 / .10);margin-block:var(--vq-space-10)"></div>

      <div class="vq-row vq-wrap vq-gap-6">
        ${[['7 / 7', 'correctness checks'], ['144', 'features shipped'], ['$0', 'implementation fee']]
          .map(([v, l]) => `<div>
            <div class="vq-num" style="font-size:var(--vq-fs-metric-sm);font-weight:600;color:#fff;letter-spacing:-.03em">${v}</div>
            <div class="vq-caption" style="color:rgb(237 242 239 / .55)">${l}</div>
          </div>`).join('')}
      </div>

      <p class="vq-small vq-mt-10" style="color:rgb(237 242 239 / .62);max-width:46ch">
        Nothing posts to your books until you approve the Blueprint. The AI decides what your system
        looks like — it never decides what your numbers say.
      </p>
    </div>
  </aside>

</div>`;

export default page({
  title: 'Start building — 14 days free, no card | VenQore',
  description: 'Create your VenQore system. Describe your business, review the Blueprint, go live the same day. 14 days free, no card required.',
  bare: true,
  body,
});
