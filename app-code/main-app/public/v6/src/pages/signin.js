import { page, icon } from '../shell.js';

/* DESIGN-RULES §13 — "Login / auth: single centred card, max-width 400,
   radius xl, elevation 2, on --vq-bg. Logo 32px above. No hero art, no
   gradient, no canvas. The login page's job is to be fast and boring; it is
   the page users see most often and least want to look at." */
const body = `
<div class="vq-auth" style="grid-template-columns:1fr;place-items:center;min-height:100vh">
  <div class="vq-auth__pane">
    <div class="vq-auth__form">
      <a class="vq-brand" href="index.html" style="justify-content:center;margin-bottom:var(--vq-space-8)">
        <img src="assets/logo.png" alt="" width="32" height="32" style="height:32px">
        <span class="vq-brand__word">VenQore</span>
      </a>

      <div class="vq-card vq-card--xl" style="box-shadow:var(--vq-elev-2)">
        <h1 class="vq-h2">Sign in</h1>
        <p class="vq-caption vq-mt-2" style="max-width:none">Welcome back.</p>

        <form class="vq-stack vq-gap-5 vq-mt-8" data-demo>
          <div class="vq-field">
            <label class="vq-label" for="email">Work email</label>
            <input class="vq-input" id="email" name="email" type="email" required autocomplete="email"
                   autofocus placeholder="you@company.com">
          </div>
          <div class="vq-field">
            <div class="vq-row" style="justify-content:space-between">
              <label class="vq-label" for="password">Password</label>
              <a class="vq-caption" href="#" style="color:var(--vq-accent-text)">Forgot?</a>
            </div>
            <input class="vq-input" id="password" name="password" type="password" required autocomplete="current-password">
          </div>
          <label class="vq-check">
            <input type="checkbox" name="remember" checked>
            <span class="vq-caption" style="max-width:none">Keep me signed in on this device</span>
          </label>
          <button type="submit" class="vq-btn vq-btn--primary vq-btn--lg vq-btn--block">Sign in</button>
        </form>

        <div class="vq-row vq-gap-4 vq-mt-8" style="align-items:center">
          <span style="flex:1;height:1px;background:var(--vq-line)"></span>
          <span class="vq-caption">or</span>
          <span style="flex:1;height:1px;background:var(--vq-line)"></span>
        </div>

        <button type="button" class="vq-btn vq-btn--secondary vq-btn--lg vq-btn--block vq-mt-6">
          ${icon('mail', 16)} Email me a sign-in link
        </button>
        <button type="button" class="vq-btn vq-btn--ghost vq-btn--lg vq-btn--block vq-mt-2">
          ${icon('lock', 16)} Sign in with a cashier PIN
        </button>
      </div>

      <p class="vq-caption vq-center vq-mt-6" style="max-width:none">
        Don't have a system yet? <a href="register.html">Start building →</a>
      </p>
      <p class="vq-caption vq-center vq-mt-8" style="max-width:none;color:var(--vq-text-3)">
        <a href="index.html" style="color:inherit">← Back to venqore.com</a>
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
