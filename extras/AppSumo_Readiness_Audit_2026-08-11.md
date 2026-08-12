# VenQore — AppSumo Readiness Audit

**Prepared:** 2026-08-11
**Supersedes the readiness assessment in:** `AppSumo_Decision_Document.md` (April 2026)
**Source of criteria:** AppSumo's published 2026 partner quality standards, listing policy, and partner terms (links at the end)

---

## ⚠️ Correction — this audit's original verdict was wrong

**The first version of this document said "do not apply, you need 15–30 paying customers first." That was based on conflating two different AppSumo paths. Corrected below.**

AppSumo has **two separate routes**, with very different bars:

| | **Self-listed marketplace** ← *this is the one* | **Curated launch** |
|---|---|---|
| Where | `partners.appsumo.com/self-submission` | Same form, but routed to the curated funnel |
| Vetting | Listing quality, working product, legitimate ownership | 25-point checklist, Beta-ling stress test, founder vetting on **paid customer count**, runway, marketing strategy |
| Acceptance | Lenient. AppSumo's own policy says *"Not sure if your product falls into any of these categories? No sweat, feel free to submit it anyway"* | ~10% at application, **under 3%** after product testing |
| Revenue share | **~70% to you** (verified: a vendor reports $55 from a $79 sale) | Negotiated, typically far less to the partner |
| Marketing | Minimal, evergreen listing | Email to 1.5M, paid ads, affiliates, 60-day campaign |
| Traction required | **Not a stated requirement.** Trust signals (Stripe ARR, G2, Capterra) are an explicitly *optional* section | Yes, heavily |

**The <3% figure and the "paying customers" language come from the curated-launch quality standards page. They do not govern self-listing.** Applying that bar to the self-list path was the error.

## Corrected verdict

**Apply to the self-listed marketplace. Your odds are good.** Not the 80–90% you were quoted, but far above 10%. The self-list bar is essentially: real working product, honestly described, legitimately yours, with a well-built listing. VenQore clears all of that comfortably, and clears it better than most submissions — a genuine double-entry ledger with FIFO costing and offline sync is not an AI wrapper.

What actually determines the outcome on this path is **listing quality**, not traction. The gating items are:

1. **Entry tier at $49 or less.** AppSumo's own listing brief: deals with a first tier at or under $49 *"convert far better and have a much stronger chance of acceptance."* Aim for 70%+ off your regular price. Your current `$79` first code is above this line — change it.
2. **Four product screenshots plus a 16:9 hero image.** AppSumo names missing image assets as *"the #1 stall"* for partners.
3. **Stacking handled internally** — AppSumo does not support it for self-listed products. You already do.
4. **A named, public founder** with a LinkedIn URL in the Product story section.

The engineering debt (R1–R4) and production verification still matter — buyers will hit refund buttons if redemption breaks — but they are **not** application blockers. They are launch-day blockers.

---

## Part 1 — Where VenQore genuinely passes

These are verified against the codebase and the live site, not assumed.

| AppSumo criterion | VenQore status | Evidence |
|---|---|---|
| **Working product, not a beta** | ✅ Pass | venqore.com live, server-rendered, public demo with no signup required |
| **Not an AI wrapper** | ✅ Strong pass | Full double-entry ledger, FIFO inventory, offline-first POS. AI is one feature among many, not the product |
| **Not a vibe-coded MVP** | ✅ Strong pass | Phases 0–7 complete with documented acceptance criteria; guardrail test suite; mass-assignment scanner; tenant isolation sweeps |
| **Fleshed-out features** | ✅ Pass | POS, inventory (batch/serial/composite/multi-unit), purchasing, accounting, WooCommerce sync, multi-store, RBAC |
| **Active development** | ✅ Pass | Phase 7 shipped 2026-08-05, six days before this audit. Changelogs exist |
| **Built for entrepreneurs** | ✅ Perfect fit | Small retail and food businesses is exactly AppSumo's audience |
| **Trending category** | ✅ Pass | POS/ERP for SMBs is durable; the offline-first + real-accounting angle is a genuine differentiator |
| **Deal infrastructure** | ✅ Pass | `AppSumoController` redemption, race-safe (`lockForUpdate`), 3-code cap, tier stacking, SuperAdmin code generation/import/purge, `APPSUMO_PUBLIC` flag |
| **Stacking handled internally** | ✅ Critical pass | AppSumo explicitly does **not** support stacking for self-listed products — partners must handle it themselves. VenQore already does. Most applicants fail here |
| **Limit enforcement** | ✅ Pass — this was April's blocker | `PlanGate::check()`, `PlanRepository::getLtdSnapshot()`, `plan_limits` written at redemption, `PlanTruthFailClosedTest` |

**On the engineering axis, VenQore is above the median AppSumo applicant.** That is not the axis it will be judged on first.

---

## Part 2 — Where VenQore fails today

### ~~🔴 F1. Zero paying customers~~ — **not a blocker on the self-list path**

Struck. Paid customer count is a **curated-launch** vetting input, not a self-listing requirement. The self-submission listing builder treats Trust signals (Stripe ARR, G2, Capterra) as an **optional** section, and never asks for a customer count as a gate.

Zero customers is still a mild weakness — an empty Trust signals section is a missed credibility slot, and you will have no reviews to point to. It is not a reason to delay. **AppSumo is the customer acquisition channel; requiring customers before using it is circular.**

---

### 🟠 F2. No public founder presence

> *"If a founder won't put their name on it publicly, that's a red flag. We ID verify... We love seeing founders actively talking about their tools on LinkedIn and being part of the conversation."*

Check honestly whether there is a public, name-attached founder identity behind VenQore — LinkedIn, an about page naming you, a public changelog or build-in-public thread. If not, this is a direct hit against a named criterion and it costs nothing but time to fix.

---

### 🔴 F3. Production verification blitz never run

`PRODUCTION_SERVER_ACTIONS_REQUIRED.md` §C is entirely unticked. This matters concretely because **AppSumo's Beta-lings stress test the product as part of the 25-point checklist** — they will redeem a code and use the app. Specifically unverified:

- A live Lemon Squeezy payment with a real card, end to end
- A real AppSumo code redeemed on production
- The Code-1 tenant hitting sale #501 and being blocked with the correct message
- Duplicate-webhook safety (fire the same webhook twice → no duplicate tenant or credit)
- Same code redeemed from two browsers simultaneously → one must lose

The code for all of this exists and looks correct. It has never been proven against production.

---

### 🔴 F4. Four unresolved engineering blockers

From `REMAINING_WORK_PLAN.md`, still open:

- **R4 — schema reconciliation.** Migrations do not reproduce `venqore_pos`. A fresh install or DR rebuild is broken, and the test suite runs on a different schema than production. Green tests here ≠ safe there. This is the most serious item on the list.
- **R3 — activity logging silently dead on fresh installs.** `HasActivityLog` writes columns `activity_logs` does not have, inside a swallowed `catch`. Your audit trail does not exist after a fresh install — exactly when you would need it. This was baselined, not fixed.
- **R1 — seven verification tests sit in `tests/Feature/` while the suite runs `Tester/tests/Feature/`.** They do not execute. False confidence.
- **R2 — guard baselines are stale**, quietly weakening the mass-assignment guard as an allow-list.

---

### 🟠 F5. Secrets never rotated

`PRODUCTION_SERVER_ACTIONS_REQUIRED.md` §B.8: fifteen secret-bearing `.env` entries (Lemon Squeezy, AppSumo, AWS, Gemini, mail) have sat in a dev environment across many AI sessions. Rotate before anyone else touches the system. Not an AppSumo criterion — just necessary.

---

### 🟠 F6. Pricing inconsistency in the codebase

`AppSumoController`'s docblock documents **$79 / $158 / $237** per stacked tier. `AppSumo_Decision_Document.md` recommends **$49 / $99 / $179**. `2026_07_08_000000_update_plan_prices.php` changed prices again and `REMAINING_WORK_PLAN.md` R13 flags those changes as never reviewed.

Pick the numbers deliberately before you write a listing. AppSumo enforces a **"lower than anywhere" rule** — your AppSumo price must be below your lowest price on any other channel, permanently. Your public pricing page constrains what you can offer.

---

### 🟠 F7. No PKR payment path

Lemon Squeezy does not settle in PKR. Not an AppSumo blocker — AppSumo pays you in USD — but it blocks the entire LTD→subscription upsell for your home market, which is the business model that makes the LTD safe.

---

### 🟠 F8. No monitoring, no support system

AppSumo names *"no customer support plan"* as a "not the right fit" bullet. Currently: no Sentry, no uptime monitoring, no ticketing system, no documented support SLA. A thousand LTD buyers arriving at once with no helpdesk is the classic AppSumo failure mode.

---

### 🟠 F9. ToS and Privacy never reviewed by a lawyer

Flagged in §D. Routes and pages exist; content is unreviewed. AppSumo requires legal compliance representations from partners.

---

## Part 3 — Understanding what you are actually applying to

The April document's model of AppSumo tiers is out of date. As of 2026:

| Path | What it is |
|---|---|
| **Self-listed / Marketplace** | Evergreen listing, you set price, minimum 120-day commitment. Lower bar, minimal marketing support, **no stacking support from AppSumo** |
| **Standard launch** | Curated ~60-day campaign with email, ads, affiliates. ~10% accepted at application. Typical performer: $40K–$80K over 60 days |
| **Select** | A **badge earned by top-performing existing partners** — not something you apply to directly |

Two things follow. First, Select is not a first-application option, so plan for a standard launch. Second, revenue share is **negotiated per product**, not a fixed 70/30 — the April document's flat "30% to you" assumption should be treated as a floor for modelling, not a fact.

### Terms that constrain your deal design

- **60-day no-questions refund window.** You must honour it. Budget for refunds.
- **Lifetime updates and support** obligation for LTD buyers, permanently.
- **120-day minimum listing.** No quiet exit.
- **Grandfathering is mandatory.** If you later improve the deal, every prior buyer gets it free. If you want to *downgrade*, you must kill the listing and start over. **Set your limits correctly the first time** — you cannot tighten them later.
- **"Lower than anywhere" pricing**, monitored and enforced.

---

## Part 4 — The ordered plan

### Phase A — Close the engineering debt (2 weeks)

1. **R4** — schema reconciliation. `mysqldump --no-data` both sides, diff, write migrations until clean. Biggest item; do it first.
2. **R3** — fix `activity_logs` schema, remove the silent catch.
3. **R1** — move the seven tests into `Tester/tests/Feature/`, fix namespaces, confirm they run.
4. **R2** — delete and regenerate the guard baselines, read what remains.
5. **R5** — full suite green, `audit:mass-assignment` exits 0.
6. **F5** — rotate all fifteen secrets.

### Phase B — Prove production (3–4 days)

7. Full §C blitz: live payment, real code redemption, sale #501 block, duplicate webhook, concurrent redemption, reset isolation.
8. **Keep a written, dated log with screenshots.** This becomes evidence in the application.
9. Sentry + UptimeRobot + webhook failure alerting.

### Phase C — Build the listing (1 week, can run parallel with A)

10. **Fix the entry price to $49 or less.** Scope it by volume limits (stores, staff, transactions), never by removing core value. This is the single highest-leverage acceptance factor.
11. **Capture the images.** One 512×512 icon, one 16:9 hero at 1920×1080+, four product screenshots. Clean UI, plain background, no device frames, no text overlays. This is the #1 stall — start it first.
12. Write the listing against the field spec at `partners.appsumo.com/listing-brief.md`. Note the house style: sentence case, **no em dashes**, no marketing filler ("seamless", "robust", "leverage", "empower"), and **never mention monthly pricing or free tiers anywhere in the copy**.
13. Name yourself publicly, with a LinkedIn URL, in the Product story section.

### Phase D — Apply

14. Submit at `partners.appsumo.com/self-submission`.
15. Keep `APPSUMO_PUBLIC=false` until approval day.

### Phase E — Post-approval, before launch day

16. Support system live with a documented response time. A thousand buyers with no helpdesk is the classic failure mode.
17. ToS and Privacy reviewed by a lawyer.
18. Backups automated and a restore actually tested.
19. Solve the PKR path — this blocks the LTD→subscription upsell, which is where the real money is.

---

## Part 5 — The honest summary

**You should apply, and reasonably soon.** The self-listed marketplace does not gate on traction, and the objection that killed the first draft of this audit does not apply to it.

What matters instead is unglamorous: get the entry tier to $49, produce five clean screenshots, and write the listing to spec. Those three things move your odds more than another month of engineering would.

Two cautions that are real regardless of path:

- **Grandfathering is permanent and one-directional.** You can always make the deal more generous; tightening limits later means killing the listing and starting over. Set tier limits for the world where 2,000 people redeem, not the world where 50 do.
- **Redemption must not break.** AppSumo's 60-day no-questions refund window plus a broken `/redeem` page is how a launch becomes a refund event. The §C production drill is not optional before launch day, even though it is not needed before applying.

---

## Sources

- [AppSumo — Sell on AppSumo (partner overview, acceptance rate, earnings)](https://sell.appsumo.com/)
- [AppSumo — Quality Standards (25-point checklist, founder vetting, traction criteria)](https://sell.appsumo.com/p/quality-standards)
- [AppSumo — Partner Listing & Updates Policy (stacking, grandfathering, pricing, 120-day rule)](https://appsumo.com/partner-terms/listing-policy/)
- [AppSumo Help Center — How do I submit my product?](https://help.appsumo.com/article/92-how-do-i-submit-my-product)
- [AppSumo — Partner application](https://partners.appsumo.com/self-submission)

**Internal:** `AppSumo_Decision_Document.md`, `PRODUCTION_SERVER_ACTIONS_REQUIRED.md`, `REMAINING_WORK_PLAN.md`, `MANUAL_LAUNCH_CHECKLIST.md`, `PHASE_0_STATUS.md`, `PHASE_7_STATUS.md`, `app/Http/Controllers/AppSumoController.php`
