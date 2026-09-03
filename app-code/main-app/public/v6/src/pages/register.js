import { page, icon } from '../shell.js';

const body = `
<div class="vq-auth vq-auth--single">
  <div class="vq-auth__pane">
    <div class="vq-auth__form">
      <a class="vq-brand" href="index.html">
        <img src="assets/logo.png" alt="" width="32" height="32">
        <span class="vq-brand__word">VenQore</span>
      </a>

      <div class="vq-card vq-card--xl vq-auth__card">
        <h1 class="vq-h2">Create your system</h1>
        <p class="vq-caption vq-wide vq-mt-2">
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
            <span class="vq-caption">
              I agree to the <a href="/terms">Terms</a> and the <a href="/privacy">Privacy Policy</a>.
            </span>
          </label>
          <button type="submit" class="vq-btn vq-btn--primary vq-btn--lg vq-btn--block">
            Create my system <span class="vq-btn__arrow">${icon('arrow', 17)}</span>
          </button>
          <p class="vq-caption vq-wide vq-center">
            No card required. We'll remind you before the trial ends.
          </p>
        </form>
      </div>

      <section class="vq-mt-10">
        <span class="vq-eyebrow">What happens next</span>
        <h2 class="vq-h3 vq-mt-3">Four minutes, then it exists.</h2>

        <ol class="vq-stack vq-gap-5 vq-mt-6">
          <li class="vq-auth__step">
            <span class="vq-auth__stepno">1</span>
            <div>
              <b class="vq-auth__stepname vq-small">Describe your business</b>
              <p class="vq-caption vq-wide vq-mt-2">In sentences, not a form. What you sell, how you buy, who works there.</p>
            </div>
          </li>
          <li class="vq-auth__step">
            <span class="vq-auth__stepno">2</span>
            <div>
              <b class="vq-auth__stepname vq-small">Review your Blueprint</b>
              <p class="vq-caption vq-wide vq-mt-2">Modules in, modules out, your fields in your words. Every line editable.</p>
            </div>
          </li>
          <li class="vq-auth__step">
            <span class="vq-auth__stepno">3</span>
            <div>
              <b class="vq-auth__stepname vq-small">Pick a plan</b>
              <p class="vq-caption vq-wide vq-mt-2">Or don't — the trial runs for 14 days either way, on the full product.</p>
            </div>
          </li>
          <li class="vq-auth__step">
            <span class="vq-auth__stepno">4</span>
            <div>
              <b class="vq-auth__stepname vq-small">Go live</b>
              <p class="vq-caption vq-wide vq-mt-2">Your system, your data model, ready for the first transaction.</p>
            </div>
          </li>
        </ol>

        <p class="vq-caption vq-wide vq-mt-8">
          Nothing posts to your books until you approve the Blueprint. The AI decides what your system
          looks like — it never decides what your numbers say.
        </p>
      </section>

      <p class="vq-caption vq-wide vq-center vq-mt-8">
        Already have a system? <a href="signin.html">Sign in →</a>
      </p>
    </div>
  </div>
</div>`;

export default page({
  title: 'Start building — 14 days free, no card | VenQore',
  description: 'Create your VenQore system. Describe your business, review the Blueprint, go live the same day. 14 days free, no card required.',
  bare: true,
  body,
});
