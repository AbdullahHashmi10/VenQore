# V6 public-page redesign brief (10 Sep 2026)

## What is already done (do not redo)
- One shared chrome: `resources/js/Components/Site/` — `siteMap.js` (every public link), `SiteHeader.jsx` (transparent glass header, progressive blur, luminance-adaptive ink via `useHeaderTone.js`), `SiteFooter.jsx`, `SiteChrome.jsx` (`<SiteChrome underHeader>` wrapper + `useMarketingShell()`), CSS in `resources/css/venqore-v6/site-chrome.css`.
- `Pages/Marketing/Shared/MarketingLayout.jsx` now renders SiteHeader + `<main className="vq-page vq-mkt-main">` + SiteFooter + CookieConsent. The 15 V6 showcase pages render SiteHeader/SiteFooter directly.
- `Components/CookieConsent.jsx` rewritten (V6 classes `.vq-cookie*`).
- DO NOT edit anything in `Components/Site/`, `site-chrome.css`, `CookieConsent.jsx`, `MarketingLayout.jsx` default export, `tokens/`.

## The header is fixed, 72px tall, transparent
Every page's first section must clear it: first section `padding-top: clamp(120px, 12vw, 168px)` for a hero, or at least `calc(72px + var(--vq-space-12))` for a plain page top. A section whose background is not readable from the DOM (canvas, `pointer-events:none` gradient layer, image) must declare `data-tone="dark"|"light"` (or `data-tone-light` / `data-tone-dark`) so the header picks the right ink.

## V6 rules for page content
Values only from tokens (`resources/css/venqore-v6/tokens/*.css`): colours `var(--vq-text|--vq-text-2|--vq-text-3|--vq-accent-text|--vq-surface|--vq-bg|--vq-bg-alt|--vq-sunken|--vq-line…)`, type `--vq-fs-*`, space `--vq-space-*`, radius `--vq-r-*` (card 20, modal/big tile 28, input 14, pill full), elevation `--vq-elev-*`. Prefer the existing V6 site classes (`resources/css/venqore-v6/components.css`, `site-base.css`): `vq-container`, `vq-section`, `vq-section--alt`, `vq-section-head`, `vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot`, `vq-display / vq-h1 / vq-h2 / vq-h3`, `vq-lede`, `vq-body`, `vq-small`, `vq-caption`, `vq-text-2`, `vq-card`, `vq-card--interactive`, `vq-grid vq-grid--2/3`, `vq-btn vq-btn--primary|secondary|ghost|quiet --lg`, `vq-chip`, `vq-input`, `vq-mt-N`, `vq-row vq-gap-N vq-wrap`.
- Type floor: body 17px (`--vq-fs-body`), secondary 15px, captions 14px. Nothing a visitor must read below 14px. No `text-3xs/2xs` for content.
- Rhythm: section padding `var(--vq-section-y)` (112px) desktop, ~72px mobile; heading→lede gap 16–24px; lede→CTA 32px; card padding 24–32px; grid gaps 24px (`--vq-gutter`). Text measure ≤ 68ch.
- Light AND dark must both work: never hard-code `text-white`, `#fff`, `bg-black`, `text-zinc-*`, `bg-void-*`, `text-neutral-*` on surfaces that change with theme. Tailwind semantic utilities that map to tokens (`text-ink`, `text-ink-secondary`, `bg-surface`, `border-line`, `bg-sunken`, `text-accent-text`, `bg-accent-fill`) are fine.
- Buttons: `vq-btn` family only; one primary per view.
- Links in body copy inherit the V6 accent link style automatically.
- Keep all data/props/forms/routes/behaviour exactly; this is a presentation pass. Never invent numbers (see V6_PUBLIC_PAGE_REGISTER.md §5: 46 modules, 58 readings, 40 reports, 13 document types).

## How to see a page (no PHP needed)
Vite dev runs on the user's machine at http://127.0.0.1:5173 (HMR live). The browser pane cannot load it through Laravel (:8000), so use the harness:
`http://127.0.0.1:5173/scratch/vq-harness.html?c=<Inertia component>&u=<url>&theme=light|dark&p=<url-encoded JSON of extra props>`
e.g. `?c=Marketing/Blog/Index&u=/blog&theme=light&p={"posts":{"data":[]}}`. It fakes `auth.user=null`, Ziggy routes, and maps `/v6/...` assets to `/public/v6/...`. Server endpoints are NOT available (fetch/POST will 404) — pass representative props via `p`. Open your OWN tab with `Claude_Browser__preview_start` (don't reuse other agents' tabs), `resize_window` 1366x800 and `preset: mobile` to check both, and check both themes.
Syntax check any file: `$HOME/jsxcheck.sh <paths relative to main-app>` (esbuild parse).

---

## Status at end of 10 Sep 2026 pass

Done:
- Shared header/footer/cookie on every public page (15 V6 ports, all MarketingLayout pages, 23 tools, blog/docs/help/legal, /demo, /onboarding, /build-workspace).
- Root-cause CSS fixes: `site-base.css` now scoped with `:where(.vq-site)` and zero-specificity resets. Before, `.vq-site .vq-section{background}` repainted every `.vq-band-dark` with the light page colour (white-on-white in light mode), and `.vq-site button{padding:0;font:inherit}` stripped padding/size from every `<button class="vq-btn">` and the nav menu buttons.
- Landing hero: one dark mesh in both themes + `HeroPrompt` (auto-grow textarea, no inner scrollbar, clears on back-nav, voice input, business picker).
- 85+ business types: `Components/Site/sectorCatalog.js` (single source, count computed) → landing section + ticker + hero stats + subhead, Solutions directory, header mega-menu, footer.
- Refund policy: no third-party marketplace named; lifetime licences in fine print only.
- AI builder chat redesigned (question-as-heading); Turnstile token now sent by builder start, provision, contact and newsletter (all four were guaranteed 422s once a Turnstile secret is set).
- AI gates: `AiScopeGuard` in `AiGateway`, per-feature caps in `config/ai_limits.php`, builder/Vena/scanner hardening.
- Known issues → status-page layout.
- Contrast sweep: `scratch/vq-sweep.html` (41 pages × light/dark) — remaining items are ≥3.7:1 micro glyphs/badges inside product mockups.

Open / needs a human:
- Trusted proxies not configured (`bootstrap/app.php`): behind Cloudflare/LB every visitor shares one IP, so every per-IP AI cap would trip for everyone.
- "140+ modules/features" (landing) vs 46 modules (register §5) — pick one wording.
- `/api/{store_slug}/vena/assist` has no in-app caller; consider removing or requiring login.
- Docs markdown parser doesn't render numbered lists (app/Services/SimpleMarkdownParser.php).
- Real `/workspace/converse/*` endpoints were verified by `php -l` + stubs only, not a live run.
- Scratch files safe to delete: `main-app/scratch/vq-src.tgz`, `extras/21st-components/.harvest.tgz`.
