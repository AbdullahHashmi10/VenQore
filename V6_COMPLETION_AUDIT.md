# V6 Completion — audit and pass 1

**2 Sep 2026.** Supersedes the status claims in `V6_ROLLOUT_AUDIT_AND_PLAN.md`
(21 Aug), which is now two-thirds executed and wrong on its headline sentence.

---

## 0. What was actually wrong

The theme engine was never the problem. `resources/js/theme/` is sound, the
Tailwind bridge works, and `ACTIVE_THEME = 'venqore-v6'` has been live since the
30 Aug regeneration. Three separate things were being read as "the design system
isn't applied".

**1. Teal→purple gradients.** `purple`, `violet`, `fuchsia` and `pink` are bound
to V6's **plum** playmate — deliberately, and `DESIGN-RULES.md` §16 note 2 says
so. But 127 call sites were written as `bg-gradient-to-br from-brand-500
to-purple-600`. The indigo→teal rebrand moved the *first* stop and left the
second, so the AI bubble, the user avatar, thirty buttons and forty icon tiles
rendered a mint→mauve fade. A further 835 single-colour classes painted plum
chrome. §4 already settles this: *"module colour does not ship … anyone reaching
for a module colour today is reaching for a hue that does not exist."*

**2. The auth screens had no shared shell.** Fifteen screens, five layouts:

| | Screens |
|---|---|
| dark 45/55 split, no card | Login, Register, StaffLogin |
| dark centred card + logo tile | ForgotPassword, ResetPassword, ConfirmPassword, VerifyEmail, AcceptInvite, Invite/Accept |
| dark centred card, no logo | TwoFactorSetup, TwoFactorVerify |
| dark app-shell with a header bar | Store/Create, Store/Join |
| 400 lines of inline CSS | PlatformOwner/Login |

The three that shared a layout still disagreed on every measurable: ground
`void-950`/`void-950`/`void-900`, input padding `py-3.5 sm:py-4`/`py-3
sm:py-4`/`py-4`, accent teal/teal/plum. All fifteen failed §13's login contract
— 448px not 400, `rounded-2xl` (36px, the §7 ceiling) not `--vq-r-xl`, no
`h-control-lg`, and eleven carried `blur-[140px]` ambient clouds §13 forbids.

**3. One CSS brace.** `public/v6/assets/venqore.css:258` closes the dark-theme
block opened at line 215 early. Lines 259–295 become orphaned declarations, the
parser reads them as a selector prelude and **swallows the next rule whole** —
line 296, `*, *::before, *::after { box-sizing: border-box; }`. Every V6 static
page renders content-box. That is why the sign-in inputs measured 368px inside a
334px content box and bled past the card's own right edge while every button
beside them sat at exactly 334px. It also orphans 29 dark-mode tokens.

---

## 1. Fixed in this pass

### Colour

| | Before | After |
|---|---:|---:|
| brand×plum gradients | 127 | 0 |
| plum chrome classes | 835 | 0 (WooCommerce's own mark excepted) |
| chart palettes rendering duplicate slices | 6 | 0 |
| invisible primary CTAs (white on `--vq-bg-sunken`, ~1.15:1) | 22 | 0 |
| off-brand ink primaries on public pages | 23 | 0 |
| dangling variant stubs (`hover:` with nothing after) | 80 | 0 |

Gradients collapse to **one token**: `bg-gradient-brand`, defined at
`themes/venqore-v6.js:309`. Washes flatten to a single tint. Hairlines become
`bg-gradient-hairline`. Nothing in a page file names a gradient's stops any more,
so the brand gradient changes in one line.

**The chart palettes were the sharpest bug.** `CustomerInsights` drew a five-slice
pie as `[vq.indigo[500], vq.violet[500], vq.purple[500], vq.fuchsia[500],
vq.pink[500]]` — teal plus **the same plum four times**. `Expenses` did the same
with rose/pink/fuchsia/purple/violet. Four more were partly collapsed. There is
now a single source: `series`, `sequential` and `diverging` in
`theme/runtime.js`, implementing §5's eight slots off the active theme's ramps.
Do not hand-pick chart colours at a call site again.

### Enforcement

`tailwind.config.js` now **closes** `borderRadius`, `fontWeight` and
`transitionDuration` — they replace Tailwind's scales rather than extending them,
so `rounded-3xl`, `font-extrabold`, `font-black`, `duration-300` and
`duration-500` no longer compile at all. `contract.js` drops `radius.3xl`,
`weights.extrabold`, `weights.black`.

`scripts/design-check.sh` gained four things:

- it scans `.ts`/`.tsx` (198 files were invisible — which is why the `yAxisId`
  check reported a green zero while 72 shipped in the vendored chart library),
- the coloured-shadow family list gained orange, cyan and green; **every live
  violation was in one of the three the list omitted**,
- a **plum-as-chrome** rule, so the defect that started this cannot come back,
- a **dangling-variant** rule.

The gate went from **5 blocking failures to 0.** `Pages/Pos.legacy.jsx` (4,322
lines, zero references, zero routes) moved to `_to_delete/`; it was inflating
every count.

### Auth

One shell (`Layouts/AuthLayout.jsx`), one set of primitives
(`Components/Auth/index.jsx`), fifteen screens on both. §13 to the letter:
single centred card, 400px, `--vq-r-xl`, elevation 2, on `--vq-bg`, 32px logo
above, no hero art. Measured after the fact — every element in the sign-in
column now spans exactly 283→617px; card 28px radius, input 14px, button 20px.

`Components/ds/core/Button.jsx` hardcoded `border-radius: var(--vq-r-full)`, so
**no 20px button could be produced anywhere in the product**. §13 says lg (20px)
for standard, full only for pills; the component now takes a `pill` prop.

### Public

`MarketingLayout` — which ~50 pages and all 24 free tools inherit — lost a
render-blocking Google Fonts request for **Inter, a face nothing references**
(and which slipped past the repo's font-CDN check, since that only reads
`resources/css` and `resources/views`). Its page ground moved from `bg-white` to
`bg-app`; V6's light page is `--vq-bg`, "never pure white", so every card had
been sinking into its background instead of floating on it. Its ambient canvas
and particle field ran on indigo-400/violet-400/cyan-400 — `indigo` being the one
family §16 makes blocking — now on categorical slots 1, 3 and 5.

`SectionLabel` was declared `({ children, icon })` and called with `text=` at
seven sites, so the eyebrow rendered as an empty pill on six live pages. Error
pages 404/500/503, `Help/Index`, `Help/Show` and `KnownIssues` were entirely
pre-V6 — the Help pages had no nav, no footer and no route back to the site.

---

## 2. Verified, not assumed

- `npx vite build` — 4,465 modules, clean, `public/build` regenerated. SSR too.
- `design-check.sh` — every blocking rule at 0.
- Every class used in the auth screens confirmed present in the generated CSS.
- The sign-in card measured in a real browser, not read off a diff.
- `public/v6/index.html` and `public/index.html` md5-identical before and after.

**One check cannot run here.** `adherence self-test` reports HARNESS BROKEN:
oxlint 1.79's JS-plugin path panics in `oxc_allocator/src/pool/fixed_size.rs`
because it cannot reserve its address space in a 3.9 GB VM. Plain `oxlint` works;
only the `jsPlugins` config crashes. It failed identically before any change was
made. **Run `npm run design:check` on your own machine to confirm it passes
there.**

---

## 3. Three things that need your decision

**The brace.** Deleting one character at `venqore.css:258` restores the global
`box-sizing` reset and 29 dark tokens across every V6 page. It also moves the
landing hero and footer, which are signed off — a previous author found this,
wrote it up at `venqore-landing.css:409-425`, and scoped around it section by
section for exactly that reason. This pass did the same: the reset is restored
for `.vq-auth` only. Fixing it properly is two characters plus a visual pass on
the landing.

**`public/v6/src/` has diverged from `public/v6/assets/`.** The built CSS has
been hand-edited since; the source still says `--vq-bg: #F1F5F2` where the built
file says `#ECF9FB`, and the dark palettes differ entirely. **`node build.mjs`
would revert months of work.** Either reconcile them or delete `src/`.

**`public/v6/` is publicly crawlable** — `.htaccess` serves any real file before
Laravel and `robots.txt` does not exclude it. That currently exposes
`index_original.html`, two dated landing backups, `card-rules-workbench.html`,
the build scripts and `README.md` (which carries internal audit notes and pricing
rationale). Move them out of the docroot.

---

## 4. Pass 2 — the sweep, worst-adopted first

Semantic-token adoption by directory, `(semantic + role) / (semantic + role +
raw pigment)`:

| Directory | Files | Adopted | Note |
|---|--:|--:|---|
| `Pages/Billing` | 1 | **27%** | 462 pigment classes in one 2,711-line file |
| `Pages/VenSynQ` | 6 | **33%** | plus 120 raw hex |
| `Pages/Staff` | 1 | **35%** | 4 section cards invisible in light mode |
| `Pages/Auth` | 10 | 41% | **done this pass** |
| `Pages/Store` | 5 | 46% | Create/Join done; 3 left |
| `Pages/WooCommerce` | 4 | 50% | purple here is WooCommerce's mark — keep |
| `Pages/(root)` | 14 | 59% | 1,126 classes, mostly `Dashboard.jsx` — **done** |
| `Components/(root)` | 102 | 61% | 2,078 classes, the largest single job |
| `Pages/Reports` | 50 | 64% | a sweep, not a rewrite — 49/50 part-migrated |
| `Pages/Admin` | 13 | 67% | |

Also outstanding, in leverage order:

1. **`Platform/ui.jsx` + `PlatformLayout` + `Pages/Platform/Views.jsx`** — 330
   inline styles across 15 screens. Tokens physically cannot reach them. The
   rollout plan called this "the only migration that is *required*"; it is still
   not done.
2. **501 stock z-index stops** (`z-10` ×331, `z-50` ×111) → the named ladder.
   `zIndex` stays open until they move; `Components/Modal.jsx:14` defaults
   `zIndex = 'z-50'` and pushes one into every modal that does not override it.
3. **`OneGlanceLayout.jsx`** — the shell for 158 pages — uses `w-[280px]`,
   `lg:w-[88px]` and `h-14` where the Layout Law says 264 / 72 / 64. Since
   `header_h == row` is the identity the vertical grid rests on, the shell and
   the card grid are on different pitches. Also still 1,950 lines in one file;
   the plan asked for four.
4. **`Shell/QoreShell.jsx`** — 673 lines, correctly token-native, imported by
   nothing. Either harvest it or delete it.
5. **146 files hand-roll a `<table>`; 5 use `DataTable`.** 140 of the 146 have no
   tabular figures, so currency columns do not align — §13 calls that
   non-negotiable.
6. **Two token folders.** `resources/css/venqore-v6/tokens/` is what the
   generator reads; `extras/Design System/…/tokens/` is what `DESIGN-RULES.md` §2
   and `CLAUDE.md` tell readers is the law. They differ in 6 of 9 files. Fix the
   docs.
7. **`DESIGN-RULES.md` §6 is stale.** `typography.css` was rescaled on 22 Aug
   ("one notch louder", for a standing cashier): h1 is 42px not 40, metric 40 not
   38, body 17 not 16. §17 makes the token file the source, so the code is right
   and the document is wrong — but §6 is what a reviewer greps.
8. **The appearance layer is unaudited.** `data-vq-density`, `data-vq-radius` and
   `data-vq-font` can override the gutter, the whole radius scale and all three
   type faces at runtime. `radius="sharp"` gives `lg: 7px`, `full: 349.65px`.
   **Five of the six `font` presets collapse `--vq-font-numeric` to a
   proportional face**, so money stops aligning on a POS. Only `grotesk` is safe.
