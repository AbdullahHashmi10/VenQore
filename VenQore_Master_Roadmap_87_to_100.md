# VenQore — Master Roadmap: 87 → 100

**The single source of truth for the road to a world-class, enterprise-grade product.**
**Compiled:** 2026-06-29 · Consolidates every prior review (forensic audit, money-engine verification, pricing/consistency audit, design-system audit).
**Standard we are aiming for:** Stripe · Linear · Notion · Shopify · Framer · Raycast · Vercel · Apple · Atlassian.
**Reality check on timing:** Launch is tomorrow. **Phase 1 only** is the launch gate. Phases 2–4 are the week-plus that takes us to a true 100 across every dimension. You do not need 100 to launch — you need Phase 1 done and the rest scheduled.

> **The honest premise.** The money engine is already excellent and verified (it earned the jump from 41 → 87). What keeps VenQore at 87 and not 100 is **not** correctness — it is **consistency and polish**: a pricing page that contradicts the backend, a frontend with 186 ad-hoc colors and no design tokens, plan config that disagrees with itself, and the absence of the small premium details (motion, empty states, perceived performance) that make Linear/Stripe *feel* expensive. This document fixes exactly that.

---

## How to read this document
- **Parts 1–2** — the narrative roadmaps (87→100 overall, and 92→100 for the already-excellent areas), each item with the full field set you asked for.
- **Part 3** — the consolidated issue register (everything found, merged, no duplicates).
- **Parts 4–8** — thematic deep-dives (design consistency, brand, maturity, code, non-code).
- **Part 9** — the exhaustive, trackable checklist with VNQ-IDs (this is the one you work from).
- **Parts 10–11** — execution phases and score projection.
- **Final** — totals, ROI, quick wins, launch recommendation.

---

# PART 1 — Roadmap: 87 → 100

These are the items that move the *overall product* from 87 to 100. Grouped by theme; each carries: **Current issue · Why it matters · User impact · Solution · Priority · Effort · Score lift.**

## 1.1 Pricing & Plan Truth (the single biggest credibility risk)

### VNQ-010 — Pricing comparison table promises Starter features the backend locks
- **Current issue:** `Pricing.jsx` hard-codes Profit & Loss (L850) and Bank Reconciliation (L844) as included for Starter; the seeder has `report_profit_loss` and `bank_reconciliation` OFF for Starter.
- **Why it matters:** It's a written promise you don't keep — the fastest way to lose trust and trigger refunds/chargebacks on day one.
- **User impact:** Starter buyer clicks P&L, hits a lock screen, feels deceived.
- **Solution:** Correct the Starter column; better, generate the table from `plan_limits` (see VNQ-015).
- **Priority:** Critical · **Effort:** 1–2 h · **Score lift:** +1.5

### VNQ-011 — Three disagreeing sources of truth for plan limits
- **Current issue:** `config/plans.php` (claims to be "the single source of truth" — it isn't), the `PlanFeatureMatrixSeeder`→`plan_limits` table (the real runtime source), and the hardcoded pricing table disagree on SKU/staff/location caps (config says "unlimited", seeder caps them).
- **Why it matters:** Any code path reading `config()` instead of `plan_limits` grants unlimited where you intend a cap; devs reading the file are misled.
- **User impact:** Inconsistent enforcement; potential revenue leakage.
- **Solution:** Make `config/plans.php` mirror the seeder exactly, or delete it and read `plan_limits` everywhere; fix the header comment.
- **Priority:** Critical · **Effort:** 2–4 h · **Score lift:** +1

### VNQ-012 — The monthly transaction cap (F17) is effectively disabled for paid plans
- **Current issue:** Seeder sets `transactions_per_month = null` (unlimited) for starter/growth/business; config says 2,000/10,000. The F17 enforcement never fires for subscribers.
- **Why it matters:** A core plan-differentiator and capacity control is silently off; contradicts verified work.
- **User impact:** None negative for the customer — but you can't upsell on a limit you don't enforce, and capacity planning is blind.
- **Solution:** Decide the real caps, set them in the seeder, re-seed; add a test asserting the cap fires.
- **Priority:** High · **Effort:** 2 h · **Score lift:** +0.5

### VNQ-018 / VNQ-019 — Features sold on the pricing page but disabled for everyone
- **Current issue:** WooCommerce/Amazon/eBay/TikTok sync ($10/mo each) and the entire AI line-up are sold on the pricing page, but every related flag defaults to `0` in the seeder. Add-on purchase writes a per-tenant override (`BillingController:447`), but it's unconfirmed that each add-on flips the exact gate key.
- **Why it matters:** Charging for a feature that stays locked is a refund magnet and a trust killer — and this codebase has a documented history of key-name mismatches.
- **User impact:** Customer pays, feature is still locked, support ticket.
- **Solution:** End-to-end test: buy each add-on as a test tenant → confirm the gated route returns 200. Fold into the Lemon Squeezy launch test.
- **Priority:** Critical · **Effort:** 3–4 h · **Score lift:** +1

### VNQ-021 — Report count stated four ways (38 / 40 / 43 / 57)
- **Current issue:** Features page "38", Pricing page "40", docs "43", routes "57".
- **Why it matters:** Two customer-facing pages contradicting each other reads as careless.
- **User impact:** Erodes the "we're precise about numbers" brand promise (ironic for an accounting product).
- **Solution:** Count the real shipped reports, pick one number, use it everywhere.
- **Priority:** High · **Effort:** 1 h · **Score lift:** +0.5

*(Full pricing set — VNQ-013/014/015/016/017/020/022 — in Part 3 and the Part 9 checklist.)*

## 1.2 Design System Foundation (the biggest *polish* lever)

### VNQ-030 — There is no design system in the Tailwind config
- **Current issue:** `tailwind.config.js` only adds the Figtree font. No semantic colors, no spacing scale, no radius scale, no shadow scale, no type scale. Consequence: **186 unique hardcoded hex colors** across the app and radius values ranging from `rounded-lg` to `rounded-[2rem]` on a single page.
- **Why it matters:** This is *the* reason the product can look "almost premium but not quite." World-class apps (Linear, Stripe) are built on ~10–20 tokens applied everywhere. 186 colors = visual noise the eye reads as "unfinished."
- **User impact:** Subconscious "this is a startup, not enterprise" feeling; reduced trust and perceived value.
- **Solution:** Define a token layer in `tailwind.config.js` — brand/semantic colors (`primary`, `surface`, `border`, `success`, `danger`, `muted`…), a radius scale (`sm/md/lg/xl`), a shadow scale, and a type scale. Then refactor pages to the tokens (incremental).
- **Priority:** High · **Effort:** Tokens 0.5 day; refactor 2–3 days (incremental) · **Score lift:** +2 (this is the highest-impact polish item)

### VNQ-034 — No notification/toast system
- **Current issue:** No `react-hot-toast`/`sonner`/`toastify` present; notifications are ad-hoc per page.
- **Why it matters:** Inconsistent feedback is one of the most-felt "cheap" signals. Stripe/Linear have one beautiful, consistent toast.
- **User impact:** Success/error feedback looks different on every screen; some actions give no feedback.
- **Solution:** Adopt one library (recommend `sonner`), wrap in a `useNotify()` helper, replace all inline banners/alerts.
- **Priority:** High · **Effort:** 1 day · **Score lift:** +1

### VNQ-042 / VNQ-043 — Empty states and skeleton loaders
- **Current issue:** Loading patterns exist (155 hits) but are mostly spinners; empty states are inconsistent or missing on list pages.
- **Why it matters:** Skeletons make the app *feel* 2× faster (perceived performance); thoughtful empty states are a hallmark of mature products and a conversion/onboarding lever.
- **User impact:** Blank flashes and spinners feel slow; empty tables feel broken to new users.
- **Solution:** A `<Skeleton>` primitive + `<EmptyState illustration title cta>` component, applied to every list/report/dashboard.
- **Priority:** High · **Effort:** 1.5 days · **Score lift:** +1.5

### VNQ-035 — Overlapping layouts
- **Current issue:** 6 layouts including both `AuthenticatedLayout` (Breeze default) and `OneGlanceLayout` (the real app shell) plus `ReportsLayout`.
- **Why it matters:** Different shells = different paddings, headers, nav behavior between sections — the app feels stitched together.
- **User impact:** Subtle "I left the app" feeling moving between sections.
- **Solution:** Pick `OneGlanceLayout` as canonical, fold Reports into it, delete the dead Breeze `AuthenticatedLayout` if unused.
- **Priority:** Medium · **Effort:** 0.5–1 day · **Score lift:** +0.5

## 1.3 UX, Motion & Perceived Quality

### VNQ-050 — No motion system
- **Current issue:** Animations are one-off (`duration-300`, `duration-500`, custom cubic-beziers scattered). No shared timing/easing tokens.
- **Why it matters:** Consistent, restrained motion is the single biggest "feels premium" differentiator (Framer, Linear). Inconsistent timing feels amateur.
- **Why it matters / user impact:** Motion that's too fast/slow/janky reads as low quality even when users can't articulate it.
- **Solution:** Define motion tokens (e.g., `fast 150ms`, `base 220ms`, `slow 400ms`, one signature easing), apply to all transitions/hovers/modals; respect `prefers-reduced-motion`.
- **Priority:** Medium · **Effort:** 1 day · **Score lift:** +1

### VNQ-053 — Optimistic UI on the POS/cart
- **Current issue:** POS actions likely wait on round-trips.
- **Why it matters:** A POS must feel instant; Shopify/Square set this bar.
- **User impact:** Cashier hesitation under load = slower checkout = the #1 thing a shopkeeper notices.
- **Solution:** Optimistic add-to-cart/qty with reconciliation; the offline Dexie layer already supports this pattern.
- **Priority:** High · **Effort:** 1–2 days · **Score lift:** +1

### VNQ-060 — Command palette / keyboard-first navigation
- **Current issue:** None (no command palette found).
- **Why it matters:** ⌘K is the signature of Linear/Raycast/Notion — it signals "power tool" and massively speeds expert users.
- **User impact:** Power users (the ones who renew) feel slowed; it's a memorable "wow."
- **Solution:** Add a `⌘K` command palette (navigate, create invoice, find product/customer, jump to report).
- **Priority:** Medium · **Effort:** 2 days · **Score lift:** +1

### VNQ-056 — Trust indicators
- **Current issue:** Sparse trust signals on marketing + in-app.
- **Why it matters:** Enterprise buyers need proof — security, uptime, "your data is yours," testimonials.
- **User impact:** Higher conversion; lower "is this safe for my money?" friction.
- **Solution:** Security/backup badges, "double-entry verified" trust marks, testimonials, a status page link.
- **Priority:** Medium (CRO) · **Effort:** 0.5 day code + content · **Score lift:** +0.5

## 1.4 Accessibility & Performance (enterprise table-stakes)

### VNQ-070 — Color contrast on the glassmorphic UI
- **Current issue:** Heavy use of `text-slate-500`/`white/[0.04]` on dark glass — much of it fails WCAG AA contrast.
- **Why it matters:** Accessibility is an enterprise procurement checkbox and a legal exposure; low contrast also just hurts readability.
- **User impact:** Hard-to-read labels, especially on mobile/outdoors (a POS is used in bright shops).
- **Solution:** Audit with a contrast tool, lift muted text to ≥4.5:1, add focus rings.
- **Priority:** High · **Effort:** 1 day · **Score lift:** +1

### VNQ-080 — No load test at scale
- **Current issue:** Indexes exist and N+1s were fixed, but nothing's been run at 100k–1M rows.
- **Why it matters:** It's the one dimension tests can't prove; the customers who grow are the ones you can't afford to lose.
- **User impact:** Reports/dashboards could crawl for your best customers.
- **Solution:** Seed 100k–1M rows in a test tenant; measure P&L/dashboard/item-wise; fix any non-indexed query.
- **Priority:** High · **Effort:** 0.5–1 day · **Score lift:** +1

*(Accessibility set VNQ-071–074 and performance set VNQ-081–085 in Part 9.)*

## 1.5 Finish the money/architecture residuals

### VNQ-001 — Route the last non-core aggregates through the engine (Criterion-3)
- **Current issue:** `AdminController` has ~15 raw `sum()/count()/DB::table` aggregates; parts of the AI assistant compute their own numbers.
- **Why it matters:** Your brand promise is "every number from one verified core." Until these read the engine, a screen *can* show an off-core figure.
- **User impact:** Rare but brand-damaging number mismatches on admin/AI surfaces.
- **Solution:** Repoint each aggregate to `FinancialReportingService`; extend `NoSecondCalculatorTest` to cover them.
- **Priority:** High · **Effort:** 1 day · **Score lift:** +1

### VNQ-002 — SEC-1: hash the reset/admin passcode
- **Current issue:** The factory-reset passcode path historically compared plaintext; status now ambiguous.
- **Why it matters:** A plaintext master-reset code in a DB backup is a catastrophic key.
- **User impact:** Security exposure (insider/backup leak).
- **Solution:** Use the hashed `security_pin` system everywhere; verify no plaintext compare remains.
- **Priority:** High · **Effort:** 2–3 h · **Score lift:** +0.5

### VNQ-003 — `featuresArray()` fail-open → fail-closed
- **Current issue:** `!== false` means a new, unseeded feature key defaults to **unlocked**.
- **Why it matters:** One forgotten seed entry silently gives away a paid feature to everyone.
- **Solution:** Default unknown keys to locked; add a test.
- **Priority:** Medium · **Effort:** 1 h · **Score lift:** +0.5

---

# PART 2 — Roadmap: 92 → 100 (refinement of the already-excellent)

These move the parts that already scored ~92 (the money/data experience, the marketing visual language) from excellent to exceptional — the things users *feel* but can't name.

| Theme | Refinement | Why it elevates | Effort | Lift |
|---|---|---|---|---|
| **Premium motion** | One signature easing + timing scale across every transition; modal/drawer spring; list stagger on load | Coherent motion is the #1 "expensive" signal | 1 d | +1 |
| **Perceived performance** | Skeletons everywhere; optimistic POS; prefetch on hover (Inertia partial reloads) | App feels instant even on slow networks | 1.5 d | +1 |
| **Visual rhythm** | Enforce an 8pt spacing grid; consistent section padding; align the app shell to the marketing polish | Removes the subliminal "off" feeling | 1–2 d | +1 |
| **Delightful moments** | Success animations on first sale / first invoice / milestone; tasteful confetti on onboarding completion | Emotional peaks drive retention & word-of-mouth | 0.5 d | +0.5 |
| **Design-system maturity** | Token layer + Storybook-style component gallery; document variants/states | Lets you stay consistent as you scale | 2 d | +1 |
| **Conversion polish** | Pricing page: anchor pricing, "most popular" proof, social proof, sticky CTA, exit-intent; consistent number everywhere | Directly lifts trial signups | 1 d | +1 |
| **Storytelling** | Landing → product narrative continuity; one through-line ("your maths is 100% correct — bet on it") | Brand memorability | content | +0.5 |
| **Empty/zero states** | Every empty table teaches the next action with an illustration + CTA | Turns dead ends into onboarding | 1 d | +0.5 |
| **Micro-interactions** | Hover/press/focus feedback on every interactive element; copy-to-clipboard ticks; inline validation | The "it responds to me" feeling | 1 d | +0.5 |
| **Dark/light parity** | Ensure both themes are equally polished (tokens make this free) | Enterprise expectation | 0.5 d | +0.5 |

---

# PART 3 — Consolidated Issue Register

Every issue found across all reviews, merged, deduplicated. Severity: 🔴 High · 🟠 Medium · 🟡 Low · ✅ resolved/verified.

## Pricing / Plans / Billing
| ID | Issue | Affected | Sev | Fix |
|---|---|---|---|---|
| ISS-01 | Pricing table promises Starter P&L + Bank Reconciliation; backend locks both | `Pricing.jsx:844,850` vs seeder | 🔴 | VNQ-010 |
| ISS-02 | 3 disagreeing limit sources (config vs seeder vs table) | `config/plans.php`, seeder, `Pricing.jsx` | 🔴 | VNQ-011 |
| ISS-03 | `transactions_per_month` unlimited in seeder, capped in config; F17 inert for subs | seeder:259 | 🔴 | VNQ-012 |
| ISS-04 | Cash Flow under-promised to Starter (table says no; seeder says yes) | `Pricing.jsx:852` | 🟠 | VNQ-013 |
| ISS-05 | SKU cap: config "unlimited" vs seeder 10k/50k | config vs seeder | 🟠 | VNQ-014 |
| ISS-06 | Same-page contradiction: dynamic cards vs hardcoded table | `Pricing.jsx` | 🟠 | VNQ-015 |
| ISS-07 | PKR/USD FX inconsistent (LTD 280× vs monthly ~30×); USD LTD likely underpriced | `Pricing.jsx:123-131` | 🟠 | VNQ-016 |
| ISS-08 | Plan naming "Enterprise" (UI) vs "business" (backend) | global | 🟡 | VNQ-017 |
| ISS-09 | WooCommerce/sync add-ons sold but disabled for all; enablement unverified | `Pricing.jsx:364`, seeder:173 | 🔴 | VNQ-018 |
| ISS-10 | AI add-ons are the headline but all AI flags default off; enablement unverified | seeder:239,266,268 | 🔴 | VNQ-019 |
| ISS-11 | Loyalty/Gift cards: advertised Enterprise, but live under `growth_engine` (off all plans) — gate-key mismatch | `web.php:1306-1313`, seeder:93,268 | 🟠 | VNQ-020 |
| ISS-12 | Report count stated 38/40/43/57 | Features/Pricing/docs | 🟠 | VNQ-021 |
| ISS-13 | "Multi-currency w/ real-time FX" claim unbacked by functionality | `Features.jsx:125` | 🟠 | VNQ-022 |

## Design System / UI Consistency
| ID | Issue | Affected | Sev | Fix |
|---|---|---|---|---|
| ISS-20 | No design tokens in Tailwind config (only a font) | `tailwind.config.js` | 🔴 | VNQ-030 |
| ISS-21 | 186 unique hardcoded hex colors | all `.jsx` | 🔴 | VNQ-031 |
| ISS-22 | No radius scale (rounded-lg…rounded-[2rem] mixed) | global | 🟠 | VNQ-032 |
| ISS-23 | No shadow scale | global | 🟠 | VNQ-033 |
| ISS-24 | No toast/notification system | global | 🟠 | VNQ-034 |
| ISS-25 | 6 layouts, overlapping authenticated shells | `Layouts/` | 🟠 | VNQ-035 |
| ISS-26 | `font-display` referenced but not defined in config | marketing pages | 🟡 | VNQ-036 |
| ISS-27 | Buttons/cards/forms/modals/tables not standardized as components | global | 🟠 | VNQ-037–041 |
| ISS-28 | Inconsistent/missing empty & loading states | list pages | 🟠 | VNQ-042/043 |

## Architecture / Money / Security (mostly resolved — residuals listed)
| ID | Issue | Affected | Sev | Fix |
|---|---|---|---|---|
| ISS-30 | Criterion-3: admin/AI raw aggregates not via core | `AdminController` | 🟠 | VNQ-001 |
| ISS-31 | SEC-1 plaintext reset passcode (verify) | `SystemResetController` | 🟠 | VNQ-002 |
| ISS-32 | `featuresArray()` fail-open | `Tenant.php` | 🟠 | VNQ-003 |
| ISS-33 | Engine duality (two SaleController/Fifo/Inventory) | `app/` | 🟡 | VNQ-004 |
| ISS-34 | No CI lint banning unscoped `DB::table` on tenant tables | repo | 🟠 | VNQ-091 |
| ISS-35 | Exception-swallow sweep (M1-EX3) incomplete | ~17 controllers | 🟠 | VNQ-103 |
| ISS-36 | Duplicate test dirs (`tests/` vs `Tester/tests/`) drift | repo | 🟡 | VNQ-101 |
| ISS-37 | Dead file `LandingPage.backup-20260628` shipped | `resources/js/Pages` | 🟡 | VNQ-100 |
| ✅ | Returns/ghost-revenue/tenant-leak/pre-sale COGS/tax/fractional/supplier-sign/indexes | — | ✅ | verified |

## Performance / Concurrency
| ID | Issue | Affected | Sev | Fix |
|---|---|---|---|---|
| ISS-40 | No 100k–1M load test | reports/dashboard | 🟠 | VNQ-080 |
| ISS-41 | Single sequence hot-row per store (all terminals = "R1") | `SequenceService:40` | 🟠 | VNQ-082 |
| ISS-42 | Pagination not confirmed on all list reports | list reports | 🟠 | VNQ-081 |
| ISS-43 | 225 pages — bundle/code-split not verified | build | 🟡 | VNQ-083 |

---

# PART 4 — Design Consistency Audit

**Verdict:** The marketing pages are genuinely premium (the Pricing/Landing dark-glass aesthetic is strong). The *gap* is (a) no token system underneath it, and (b) the authenticated app does not provably share that polish. Unify everything under one design language:

- **Colors** — 🔴 186 ad-hoc hex values. Define a semantic palette (brand indigo/violet, surfaces, borders, success/warn/danger, muted text) as Tailwind tokens; ban raw hex in `.jsx` via lint. → VNQ-031
- **Spacing** — adopt an 8pt grid; standardize section/page padding. → VNQ-054
- **Typography** — define a type scale (display/h1/h2/body/caption) + the `font-display` family; one line-height system. → VNQ-036/055
- **Icons** — standardize on Lucide everywhere (verify no mixed icon sets). → VNQ-112
- **Radius** — one scale (sm/md/lg/xl/2xl); retire arbitrary `rounded-[2rem]`. → VNQ-032
- **Shadows** — one elevation scale (sm/md/lg + glow). → VNQ-033
- **Cards / Buttons / Forms / Modals / Drawers / Tables** — extract a single component per primitive with documented variants/states; the app already has `DataTable`, `FormModal` — extend that discipline to all. → VNQ-037–041
- **Empty / Loading / Notifications** — one `<EmptyState>`, one `<Skeleton>`, one toast system. → VNQ-034/042/043
- **Themes** — guarantee dark/light parity (tokens make this automatic). → VNQ-074
- **Dashboards** — one card grid, one chart style (Recharts theming), consistent KPIs. → VNQ-058

**How to unify:** build the token layer first (VNQ-030), then a small component gallery page documenting every primitive, then refactor screen-by-screen against it. The gallery becomes the guardrail.

---

# PART 5 — Brand Consistency

**Does it feel like one company?** Almost — the marketing voice is strong and the "your maths is 100% correct" promise is a genuinely good through-line. The cracks are terminology and naming:

- **Naming** — "Enterprise Engine" (UI) vs `business` (backend) vs LTD `ltd_3`; "V3" internal vs proposed "V12 Turbo" branding. Pick customer-facing names and a glossary; keep internal slugs separate but mapped. → VNQ-017/110
- **Terminology** — Khata, Party, Pre-sale, Proposal, Cookbook/BOM — standardize a glossary so the same concept has one name across UI, docs, and marketing. → VNQ-110
- **Numbers in copy** — the 38/40/43 report discrepancy undermines a precision brand. Fix once, centrally. → VNQ-021
- **Tone of voice** — you have a Copy Bible; apply it to in-app microcopy (buttons, empty states, errors), not just marketing. → VNQ-111
- **Iconography & identity** — consistent Lucide set, a defined logo/wordmark system, consistent app icon/favicons/PWA assets. → VNQ-112/113
- **Premium perception** — the app shell should visibly match the marketing aesthetic so the post-signup experience doesn't feel like a different product. → VNQ-114

**Outcome:** a memorable, mature brand where marketing, app, docs, and support all sound and look like one company.

---

# PART 6 — Product Maturity

**Where it sits today:** **strong scale-up**, not yet enterprise-perceived.
- **Prototype?** No — far past it.
- **Startup?** Past it — the breadth (225 pages, full double-entry, multi-tenant, offline POS) is serious.
- **Scale-up?** Yes — this is an accurate label today.
- **Enterprise / Fortune-500-ready?** Not yet.

**What's blocking the next level (and the fix):**
1. **Design-system immaturity** (186 colors, no tokens) — the #1 thing that makes it *read* as scale-up. → Part 4.
2. **Consistency leaks** (pricing vs backend, naming, report counts) — enterprises equate inconsistency with risk. → Parts 3/5.
3. **No external validation** — pen-test, accountant sign-off, SOC-2-style trust page, status page. → VNQ-090/126/056.
4. **Accessibility gaps** — AA contrast/keyboard are procurement checkboxes. → VNQ-070–074.
5. **Unproven scale** — load test + visible performance budgets. → VNQ-080.
6. **Single-engine certainty** — collapsing the V3/legacy duality lets you *certify* one money path. → VNQ-004.

Close those and the perception moves from "impressive scale-up" to "enterprise-grade."

---

# PART 7 — Code Quality Roadmap

| Area | Item | ID |
|---|---|---|
| Architecture | Collapse legacy→single engine (V3 everywhere) | VNQ-004 |
| Architecture | One source-of-truth for plan limits (kill config/seeder drift) | VNQ-011 |
| Design system | Token layer in Tailwind; refactor off raw hex | VNQ-030/031 |
| Component reuse | Standardize button/card/form/modal/table primitives | VNQ-037–041 |
| State mgmt | Consistent data-fetching/caching pattern (Inertia partial reloads, prefetch) | VNQ-104 |
| Performance | Pagination on all list reports; bundle code-split; image opt | VNQ-081/083/084 |
| Performance | Per-terminal sequence id (remove hot-row) | VNQ-082 |
| Animations | Motion tokens; reduced-motion | VNQ-050/074 |
| Accessibility | Contrast, focus, ARIA, touch targets | VNQ-070–073 |
| Testing | Wire OneCoreReconciliationGate + guard tests into CI; concurrency isolation test | VNQ-006/085 |
| Testing | Dedupe `tests/` vs `Tester/tests/` | VNQ-101 |
| Security | CI lint banning unscoped `DB::table`; pen-test; secret rotation | VNQ-091/090/093 |
| Maintainability | Exception-swallow sweep; remove dead/backup files | VNQ-103/100 |
| Correctness | Criterion-3 admin/AI aggregates via core; fail-closed features | VNQ-001/003 |

---

# PART 8 — Non-Code Improvements

| Area | Item | ID |
|---|---|---|
| Launch ops | Lemon Squeezy live test purchase → plan activation chain | VNQ-120 |
| Launch ops | Google Drive backup + restore on test store | VNQ-121 |
| Launch ops | A4 invoice print test (alignment, tax/discount lines) | VNQ-122 |
| Launch ops | Rotate marketplace secrets; confirm VenSynQ off | VNQ-093 |
| Validation | Role walkthroughs (Owner/Manager/Cashier/Starter/Growth) | VNQ-123 |
| Validation | "Dad's-shop" real-day regression | VNQ-124 |
| Validation | Mobile device pass (POS/dashboard/P&L at 375px) | VNQ-125 |
| Validation | Accountant sign-off (simulated month, all tx types) | VNQ-126 |
| Marketplace | AppSumo listing assets (copy, limits table, FAQ) | VNQ-127 |
| Marketplace | Etsy/other marketplace assets | VNQ-128 |
| Content | Screenshots, demo video, demo-store seed polish | VNQ-129/132 |
| Docs | Help center, FAQs, getting-started docs | VNQ-130 |
| Sales | Product descriptions, comparison/sales collateral | VNQ-131 |
| Comms | Launch announcement + customer onboarding emails | VNQ-133 |
| Pricing | Finalize price/FX strategy (ties to VNQ-016) | VNQ-016 |

---

# PART 9 — Final Master Checklist

> Work from this. Status starts **Pending** for all. Effort in hours (h) or days (d). Deps reference other VNQ IDs.

### Pricing & Plans
| ID | Category | Description | Priority | Effort | Deps | User Impact | Status |
|---|---|---|---|---|---|---|---|
| VNQ-010 | Pricing | Fix Starter rows (P&L, Bank Rec) on pricing table | Critical | 2h | — | Stops false promise | Pending |
| VNQ-011 | Pricing | Reconcile config/plans.php ↔ seeder (one source) | Critical | 4h | — | Correct enforcement | Pending |
| VNQ-012 | Pricing | Set real `transactions_per_month` caps + test | High | 2h | VNQ-011 | Capacity control | Pending |
| VNQ-013 | Pricing | Fix Cash Flow Starter mismatch | Medium | 1h | VNQ-015 | Accuracy | Pending |
| VNQ-014 | Pricing | Fix SKU cap config/seeder disagreement | Medium | 1h | VNQ-011 | Correct caps | Pending |
| VNQ-015 | Pricing | Generate comparison table from `plan_limits` | High | 1d | VNQ-011 | Self-consistent page | Pending |
| VNQ-016 | Pricing/Non-code | Fix PKR/USD FX + review LTD pricing | High | 0.5d | — | Margin protection | Pending |
| VNQ-017 | Brand | Unify "Enterprise"↔"business" naming | Low | 2h | VNQ-110 | Clarity | Pending |
| VNQ-018 | Pricing | Test WooCommerce/sync add-on actually unlocks | Critical | 3h | VNQ-120 | No paid-but-locked | Pending |
| VNQ-019 | Pricing | Test AI add-on actually unlocks (e2e) | Critical | 3h | VNQ-120 | No paid-but-locked | Pending |
| VNQ-020 | Pricing | Fix loyalty/gift-card gate-key mismatch | Medium | 3h | — | Feature works as sold | Pending |
| VNQ-021 | Brand | Unify report count (one number everywhere) | High | 1h | — | Precision/trust | Pending |
| VNQ-022 | Marketing | Fix/remove "multi-currency real-time FX" claim | Medium | 1h | — | No false claim | Pending |

### Design System & UI
| ID | Category | Description | Priority | Effort | Deps | User Impact | Status |
|---|---|---|---|---|---|---|---|
| VNQ-030 | Design | Define Tailwind token layer (color/space/radius/shadow/type) | High | 0.5d | — | Premium feel | Pending |
| VNQ-031 | Design | Migrate 186 hex colors → semantic tokens | High | 2-3d | VNQ-030 | Visual consistency | Pending |
| VNQ-032 | Design | Unify border-radius scale | Medium | 0.5d | VNQ-030 | Consistency | Pending |
| VNQ-033 | Design | Unify shadow/elevation scale | Medium | 0.5d | VNQ-030 | Consistency | Pending |
| VNQ-034 | Design | Adopt one toast system (sonner) + useNotify | High | 1d | — | Consistent feedback | Pending |
| VNQ-035 | Design | Consolidate layouts to OneGlanceLayout | Medium | 1d | — | Unified shell | Pending |
| VNQ-036 | Design | Define + verify `font-display` family | Low | 2h | VNQ-030 | Typography | Pending |
| VNQ-037 | Design | Standardize Button component (variants/states) | High | 0.5d | VNQ-030 | Consistency | Pending |
| VNQ-038 | Design | Standardize Card component | Medium | 0.5d | VNQ-030 | Consistency | Pending |
| VNQ-039 | Design | Standardize Form/Input components | High | 1d | VNQ-030 | Consistency | Pending |
| VNQ-040 | Design | Standardize Modal/Drawer | Medium | 0.5d | VNQ-030 | Consistency | Pending |
| VNQ-041 | Design | Route all tables through DataTable | Medium | 1d | — | Consistency | Pending |
| VNQ-042 | UX | `<EmptyState>` on every list/report | High | 1d | VNQ-030 | Onboarding/clarity | Pending |
| VNQ-043 | UX | `<Skeleton>` loaders replace spinners | High | 1d | VNQ-030 | Perceived speed | Pending |
| VNQ-044 | UX | Standardize notification UX patterns | Medium | 0.5d | VNQ-034 | Consistency | Pending |

### UX / Motion / Conversion
| ID | Category | Description | Priority | Effort | Deps | User Impact | Status |
|---|---|---|---|---|---|---|---|
| VNQ-050 | Motion | Motion tokens (timing/easing) + apply | Medium | 1d | VNQ-030 | Premium feel | Pending |
| VNQ-051 | Motion | Micro-interactions (hover/press/focus) | Medium | 1d | VNQ-050 | Responsiveness | Pending |
| VNQ-052 | Motion | Page/route transitions | Low | 0.5d | VNQ-050 | Polish | Pending |
| VNQ-053 | UX | Optimistic UI for POS/cart | High | 1.5d | — | Instant POS | Pending |
| VNQ-054 | Design | 8pt spacing grid / rhythm pass | Medium | 1d | VNQ-030 | Polish | Pending |
| VNQ-055 | Design | Typography scale + line-height | Medium | 0.5d | VNQ-030 | Readability | Pending |
| VNQ-056 | CRO | Trust indicators (security/uptime/social proof) | Medium | 0.5d | — | Conversion | Pending |
| VNQ-057 | UX | Onboarding/first-run polish | Medium | 1d | VNQ-042 | Activation | Pending |
| VNQ-058 | UX | Dashboard refinement (KPIs, one card grid) | Medium | 1d | VNQ-030 | Daily delight | Pending |
| VNQ-059 | UX | Delightful success moments/milestones | Low | 0.5d | VNQ-050 | Retention | Pending |
| VNQ-060 | UX | ⌘K command palette | Medium | 2d | — | Power-user wow | Pending |
| VNQ-061 | CRO | Pricing page conversion polish (anchor, proof, sticky CTA) | Medium | 1d | VNQ-015 | Signups | Pending |

### Accessibility
| ID | Category | Description | Priority | Effort | Deps | User Impact | Status |
|---|---|---|---|---|---|---|---|
| VNQ-070 | A11y | Contrast to WCAG AA | High | 1d | VNQ-030 | Readability/legal | Pending |
| VNQ-071 | A11y | Keyboard nav + focus rings | Medium | 1d | — | Accessibility | Pending |
| VNQ-072 | A11y | ARIA labels / screen-reader pass | Medium | 1d | — | Accessibility | Pending |
| VNQ-073 | A11y | Touch-target sizes (mobile) | Medium | 0.5d | — | Mobile usability | Pending |
| VNQ-074 | A11y | `prefers-reduced-motion` + theme parity | Low | 0.5d | VNQ-050 | Inclusivity | Pending |

### Performance / Concurrency
| ID | Category | Description | Priority | Effort | Deps | User Impact | Status |
|---|---|---|---|---|---|---|---|
| VNQ-080 | Perf | Load test 100k–1M rows; fix slow queries | High | 1d | — | Scale safety | Pending |
| VNQ-081 | Perf | Pagination on all list reports | High | 1d | — | Memory/speed | Pending |
| VNQ-082 | Perf | Per-terminal sequence id (kill hot-row) | Medium | 0.5d | — | Checkout throughput | Pending |
| VNQ-083 | Perf | Bundle code-split audit (225 pages) | Medium | 1d | — | Load time | Pending |
| VNQ-084 | Perf | Image/asset optimization | Low | 0.5d | — | Load time | Pending |
| VNQ-085 | Perf/Test | Concurrency isolation test (multi-tenant) | High | 0.5d | — | Data integrity | Pending |

### Security
| ID | Category | Description | Priority | Effort | Deps | User Impact | Status |
|---|---|---|---|---|---|---|---|
| VNQ-090 | Security | External pen-test (auth/IDOR/upload/webhook/AI) | High | ext | — | Trust/safety | Pending |
| VNQ-091 | Security | CI lint banning unscoped `DB::table` on tenant tables | Medium | 0.5d | — | Leak prevention | Pending |
| VNQ-093 | Security/Non-code | Rotate marketplace secrets; confirm VenSynQ off | High | 1h | — | Secret hygiene | Pending |
| VNQ-094 | Security | Verify granular admin perms in live roles | Medium | 0.5d | VNQ-123 | Least-privilege | Pending |

### Architecture / Correctness / Code Health
| ID | Category | Description | Priority | Effort | Deps | User Impact | Status |
|---|---|---|---|---|---|---|---|
| VNQ-001 | Correctness | Admin/AI aggregates via core (Criterion-3) | High | 1d | — | One-source numbers | Pending |
| VNQ-002 | Security | SEC-1 hash reset/admin passcode | High | 3h | — | Security | Pending |
| VNQ-003 | Correctness | `featuresArray()` fail-closed | Medium | 1h | — | No accidental unlock | Pending |
| VNQ-004 | Architecture | Collapse legacy→single engine (C5) | High | 3-5d | VNQ-006 | Certifiable money path | Pending |
| VNQ-005 | Correctness | Full 43-report reconciliation sweep | Medium | 1.5d | — | Every report = core | Pending |
| VNQ-006 | Testing | Wire reconciliation + guard tests into CI | High | 0.5d | — | Regression safety | Pending |
| VNQ-100 | Code health | Remove dead/backup files | Low | 0.5h | — | Hygiene | Pending |
| VNQ-101 | Code health | Dedupe test dirs (tests/ vs Tester/tests/) | Low | 0.5d | — | No drift | Pending |
| VNQ-102 | Code health | Kill one-off components → shared primitives | Medium | 2d | VNQ-037 | Maintainability | Pending |
| VNQ-103 | Code health | Exception-swallow sweep (M1-EX3) | Medium | 1d | — | Correct error codes | Pending |
| VNQ-104 | Architecture | Consistent data-fetch/caching pattern | Medium | 1d | — | Perf/maintainability | Pending |

### Brand / Content / Non-code
| ID | Category | Description | Priority | Effort | Deps | User Impact | Status |
|---|---|---|---|---|---|---|---|
| VNQ-110 | Brand | Terminology glossary + naming unify | Medium | 0.5d | — | Coherence | Pending |
| VNQ-111 | Brand | Apply Copy Bible to in-app microcopy | Medium | 1d | — | Voice consistency | Pending |
| VNQ-112 | Brand | Iconography consistency (Lucide only) | Low | 0.5d | — | Visual unity | Pending |
| VNQ-113 | Brand | Logo/wordmark/app-icon/PWA asset system | Medium | 0.5d | — | Identity | Pending |
| VNQ-114 | Brand | App shell matches marketing premium look | High | 2d | VNQ-030 | Unified product | Pending |
| VNQ-120 | Non-code | Lemon Squeezy live purchase chain test | Critical | 0.5d | — | Billing works | Pending |
| VNQ-121 | Non-code | Google Drive backup/restore test | High | 0.5d | — | Data safety | Pending |
| VNQ-122 | Non-code | A4 invoice print test | High | 2h | — | Print correctness | Pending |
| VNQ-123 | Non-code | Role walkthroughs (5 roles) | High | 0.5d | — | Access correctness | Pending |
| VNQ-124 | Non-code | "Dad's-shop" real-day regression | High | 0.5d | — | Real-world proof | Pending |
| VNQ-125 | Non-code | Mobile device pass (375px) | High | 0.5d | — | Mobile usability | Pending |
| VNQ-126 | Non-code | Accountant sign-off (simulated month) | Medium | ext | — | Financial trust | Pending |
| VNQ-127 | Non-code | AppSumo listing assets | High | 1d | VNQ-016 | Launch | Pending |
| VNQ-128 | Non-code | Etsy/marketplace assets | Medium | 0.5d | — | Launch | Pending |
| VNQ-129 | Non-code | Screenshots + demo video | High | 1d | VNQ-114 | Conversion | Pending |
| VNQ-130 | Non-code | Help center / FAQs / getting-started | Medium | 1.5d | — | Support deflection | Pending |
| VNQ-131 | Non-code | Product descriptions / sales collateral | Medium | 1d | — | Conversion | Pending |
| VNQ-132 | Non-code | Demo-store seed content polish | Medium | 0.5d | — | First impression | Pending |
| VNQ-133 | Non-code | Launch comms + onboarding emails | Medium | 0.5d | — | Activation | Pending |

---

# PART 10 — Implementation Roadmap (phased)

### Phase 1 — Launch Critical (tomorrow)
*Only what must be true to sell honestly. Mostly pricing truth + manual launch validation. No big refactors.*
- VNQ-010 (Starter pricing rows), VNQ-011 (reconcile plan sources), VNQ-012 (tx caps), VNQ-021 (report number), VNQ-022 (multi-currency claim)
- VNQ-018 + VNQ-019 + VNQ-120 (add-on enablement proven via the Lemon Squeezy test)
- VNQ-121 (backup/restore), VNQ-122 (A4 print), VNQ-123 (role walkthroughs), VNQ-093 (secrets), VNQ-100 (remove dead files)
- VNQ-002 (SEC-1) if not already closed
- **Goal:** nothing on the pricing page is a lie; billing + backup + print + roles proven by hand.

### Phase 2 — Week One (high-impact quality)
- Design foundation: VNQ-030, VNQ-031 (start), VNQ-034 (toasts), VNQ-042/043 (empty/skeleton)
- Correctness/perf: VNQ-001 (criterion-3), VNQ-080 (load test), VNQ-081 (pagination), VNQ-085 (concurrency test)
- A11y baseline: VNQ-070 (contrast)
- VNQ-015 (table from data), VNQ-006 (CI gate), VNQ-003 (fail-closed)
- **Goal:** consistent, fast, accessible-enough, self-consistent pricing.

### Phase 3 — Polish Sprint
- VNQ-032/033/036/037–041 (component + scale standardization), VNQ-054/055 (rhythm/type)
- VNQ-050/051/052/059 (motion + micro-interactions + delight), VNQ-053 (optimistic POS)
- VNQ-058 (dashboard), VNQ-061 (pricing CRO), VNQ-114 (app matches marketing), VNQ-035 (layouts)
- VNQ-129/132 (screenshots/demo polish)
- **Goal:** it *feels* premium end-to-end.

### Phase 4 — Enterprise Excellence
- VNQ-004 (engine consolidation), VNQ-005 (full report sweep), VNQ-101/102/103/104 (code health)
- VNQ-060 (command palette), VNQ-071–074 (full a11y), VNQ-083/084 (bundle/assets), VNQ-091 (CI lint)
- VNQ-090 (pen-test), VNQ-126 (accountant sign-off), VNQ-130/131 (help center/collateral), VNQ-113 (identity system)
- **Goal:** externally validated, certifiable, Fortune-500-presentable.

---

# PART 11 — Final Score Projection

| Milestone | Score | Why |
|---|---|---|
| **Current** | **87** | Money engine excellent & verified; consistency/polish gaps hold it back |
| **After Phase 1** | **91** | Pricing tells the truth; billing/backup/print/roles proven; launch-safe |
| **After Phase 2** | **95** | Design tokens + consistent feedback + perceived speed + accessible + scale-tested; numbers all one-source |
| **After Phase 3** | **98** | Coherent premium feel: motion, micro-interactions, unified app↔marketing, optimistic POS |
| **After Phase 4** | **100** | Single certifiable engine, full a11y, externally validated (pen-test/accountant), mature docs/brand — reads as enterprise |

Each phase raises the score because it closes a *category* of gap: Phase 1 = honesty/trust, Phase 2 = consistency/speed/access, Phase 3 = emotional/premium polish, Phase 4 = validation/maturity.

---

# FINAL SUMMARY

### Totals
- **Total improvements:** **96** (VNQ-001 → VNQ-133, accounting for the numbering gaps used for grouping).
- **Code-related:** **~64** (design system, components, motion, a11y, perf, architecture, correctness, security-code).
- **Non-code:** **~32** (launch ops, validation, marketplace assets, content, docs, brand/content, pricing strategy).

### Effort estimate
- **Code work:** ≈ **34–42 developer-days** (the big rocks: VNQ-031 hex→token refactor 2–3d, VNQ-004 engine consolidation 3–5d, component standardization ~5d, the rest in 0.5–1.5d units).
- **Non-code work:** ≈ **8–11 days** (much parallelizable; external items like pen-test/accountant run async).
- **Combined, realistically:** **~6–8 working weeks** for a true 100 by one person; **~1 focused week gets you to ~95** (Phases 1–2) if you sequence ruthlessly and defer Phase 4.
- **Launch tomorrow needs only Phase 1:** ≈ **1.5–2 days** of work, most of it the manual validation you can do yourself.

### Highest-ROI improvements (do these first)
1. **VNQ-010/011/012** — pricing truth (hours of work, removes the biggest trust risk).
2. **VNQ-018/019** — prove paid add-ons actually unlock (prevents refunds).
3. **VNQ-030/031** — design tokens (the single biggest "feels premium" lever).
4. **VNQ-043/034** — skeletons + toasts (huge perceived-quality gain for ~2 days).
5. **VNQ-080** — load test (de-risks your best future customers).

### Quick wins (≤ 2 hours each, big perception payoff)
VNQ-010, VNQ-021, VNQ-022, VNQ-100, VNQ-093, VNQ-013, VNQ-014, VNQ-003.

### Long-term investments (real but not launch-blocking)
VNQ-004 (engine consolidation), VNQ-031 (full color refactor), VNQ-060 (command palette), VNQ-090 (pen-test), VNQ-130 (help center), full a11y (VNQ-070–074).

### Final recommendation before launch
**You can launch tomorrow — but do Phase 1 first.** Nothing in Phase 1 is a big refactor; it is overwhelmingly about making the pricing page tell the truth and proving (by hand) that paying actually unlocks what was sold, plus backup/print/roles. Ship with that done and you are launching an honest, working product. Then run Phases 2–4 over the following weeks to convert "excellent and honest" into "premium and enterprise-grade." The money engine — the hard part — is already there. What remains is consistency, polish, and proof, and this document is the exact list to close it.

---

*Status legend for tracking: Pending → In Progress → Done → Verified. Treat "Verified" the way the build log does: re-read the change, re-derive any number by hand, confirm a test guards it. Never weaken a test to close an item.*
