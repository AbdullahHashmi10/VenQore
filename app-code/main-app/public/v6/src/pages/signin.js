import { page, icon } from '../shell.js';

/* DESIGN-RULES §13 — "Login / auth: single centred card, max-width 400,
   radius xl, elevation 2, on --vq-bg. Logo 32px above. No hero art, no
   gradient, no canvas. The login page's job is to be fast and boring; it is
   the page users see most often and least want to look at." */
const body = `
<div class="vq-auth vq-auth--single">
  <div class="vq-auth__pane">
    <div class="vq-auth__form">
      <a class="vq-brand" href="index.html">
        <img src="assets/logo.png" alt="" width="32" height="32">
        <span class="vq-brand__word">VenQore</span>
      </a>

      <div class="vq-card vq-card--xl vq-auth__card">
        <h1 class="vq-h2">Sign in</h1>
        <p class="vq-caption vq-wide vq-mt-2">Welcome back.</p>

        <form class="vq-stack vq-gap-5 vq-mt-8" data-demo>
          <div class="vq-field">
            <label class="vq-label" for="email">Work email</label>
            <input class="vq-input" id="email" name="email" type="email" required autocomplete="email"
                   placeholder="you@company.com">
          </div>
          <div class="vq-field">
            <div class="vq-row vq-auth__labelrow">
              <label class="vq-label" for="password">Password</label>
              <a class="vq-auth__hint" href="#">Forgot?</a>
            </div>
            <input class="vq-input" id="password" name="password" type="password" required autocomplete="current-password">
          </div>
          <label class="vq-check">
            <input type="checkbox" name="remember" checked>
            <span class="vq-caption">Keep me signed in on this device</span>
          </label>
          <button type="submit" class="vq-btn vq-btn--primary vq-btn--lg vq-btn--block">Sign in</button>
        </form>

        <div class="vq-stack vq-gap-6 vq-mt-8">
          <div class="vq-auth__or"><span class="vq-caption">or</span></div>
          <div class="vq-stack vq-gap-2">
            <button type="button" class="vq-btn vq-btn--secondary vq-btn--lg vq-btn--block">
              ${icon('mail', 16)} Email me a sign-in link
            </button>
            <button type="button" class="vq-btn vq-btn--ghost vq-btn--lg vq-btn--block">
              ${icon('lock', 16)} Sign in with a cashier PIN
            </button>
          </div>
        </div>
      </div>

      <p class="vq-caption vq-wide vq-center vq-mt-6">
        Don't have a system yet? <a href="register.html">Start building →</a>
      </p>
      <p class="vq-caption vq-wide vq-center vq-auth__quiet vq-mt-8">
        <a href="index.html">← Back to venqore.com</a>
      </p>
    </div>
  </div>
</div>`;

export default page({
  title: 'Sign in | VenQore',
  description: 'Sign in to VenQore.',
  bare: true,
  body,
});
