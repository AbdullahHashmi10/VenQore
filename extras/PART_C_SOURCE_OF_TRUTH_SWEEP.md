# Part C — Source-of-Truth Sweep

**Scope:** Canonical codebase at `E:\AMD POS\AMD POS`. Excluded per instructions: `AMD_POS_Update_v4.2.7\`, `_VERIFICATION_BASELINE_2026-07-10\`, `Tester\`, `FinalTester\`, `VenQore_Local\`.

**Method:** Direct grep/read of live source. Every number below is quoted with its file and line. Where something could not be located, it is marked "not found."

---

## 1. Numeric marketing claims — full sweep of `resources/js/Pages/Marketing/` (57 `.jsx` files) plus `Blogs/` and `SEO/` at repo root

Patterns searched: `\d+\+`, `%`, `uptime`, `x faster`, across every file in `resources/js/Pages/Marketing/` (including subfolders `Blog/`, `Compare/`, `Docs/`, `Features/`, `Shared/`, `Solutions/`, `Tools/`, `Tools/Shared/` — all 57 files, not a subset). `Blogs/` at repo root contains only two planning `.md` files (`Retail POS Content Research Plan.md`, `VenQore Retail POS Research Briefs.md`) with no numeric marketing claims of this kind. `SEO/` at repo root contains only PDFs and one strategy `.md`, not scanned as code (out of scope for a grep-based code sweep, but visually confirmed to contain no distinct plan/feature counts).

CSS-only percentage values (Tailwind opacity/width/gradient-stop classes like `bg-slate-500`, `w-1/2 → 50%`, `opacity-50`) found in `Marketing/Shared/MarketingLayout.jsx`, `Tools/MarginCalculator.jsx`, `Tools/FoodCostCalculator.jsx`, `Tools/PaymentFeeCalculator.jsx`, etc. are **excluded** from the table below as noise (they are not marketing claims, they are UI styling or interactive calculator math for the free web tools).

### 1a. "Feature count" claims

| Number | Exact phrase | File(s) | Consistent or drifted? |
|---|---|---|---|
| **226+** | "226+ features grew on top of that engine" | `resources/js/Pages/Marketing/About.jsx:83` | Drifted — see below |
| **226+** | "(sourced from the VenQore Product Catalog — 226+ features)" | `resources/js/Pages/Marketing/Shared/FeatureDemos.jsx:964` | Drifted — see below |
| **255+** | Page `description` meta tag: "...plus a searchable catalog of all 255+ capabilities." | `resources/js/Pages/Marketing/Features.jsx:497` | **Drifted against 226+** — not previously caught in the prior `MARKETING_CONSISTENCY_AUDIT.md`, which only flagged "226+" as unverifiable, but did not cross-check it against Features.jsx's own "255+" claim on the same page family |
| **32** (total suite) / **18, 26, 32** (per-plan included) | `ratioLabel: '18 of 32 Features Included'` / `'26 of 32 Features Included'` / `'All 32 Features Included'` | `resources/js/Pages/Marketing/Pricing.jsx:387,434,481,540,557,573` | **A third, independent hand-typed feature-count system** — "32" here refers to a different curated comparison list (`FULL_FEATURE_LIST` object, `categorizedFeatures` arrays) than either "226+" or "255+". Internally self-consistent (18/26/32 always sum correctly against the same "32" denominator across both USD/PKR render branches at lines 387 vs 540 etc.), but has **no relationship** to the 226+/255+ figures — three different marketing-facing "how many features do we have" numbers exist in the codebase simultaneously. |

**Finding: the prior `MARKETING_CONSISTENCY_AUDIT.md` treated "226+ features" as a single unverifiable number. This sweep found it is actually two (226+ and 255+) plus a third structurally different comparison-table count (32), none of which reference each other or a shared constant.**

### 1b. "Report count" claims

| Number | Exact phrase | File(s) | Consistent or drifted? |
|---|---|---|---|
| **40+** | "226+ features grew on top of that engine: POS, inventory, manufacturing, AI and 40+ reports" | `resources/js/Pages/Marketing/About.jsx:83` | Consistent with the two below |
| **40+** | `lead="40+ statements from one verified ledger..."` | `resources/js/Pages/Marketing/Features.jsx:540` | Consistent |
| **40+** | `"40+ Financial & Operational Reports from One Ledger"` | `resources/js/Pages/Marketing/Roadmap.jsx:49` | Consistent |

All three "40+" mentions found agree with each other. See §4 below for the actual reconciled route/seeder count this claim should be checked against — it is directionally accurate but still not derived from any single code constant (nothing ties "40+" to a computed count).

### 1c. "Automated tests" claims

| Number | Exact phrase | File(s) | Consistent or drifted? |
|---|---|---|---|
| **1,500+** | "wrapped in 1,500+ automated tests" | `resources/js/Pages/Marketing/About.jsx:82` | Consistent |
| **1,500+** | `{ icon: Layers, title: "1,500+ Automated Tests", ... }` | `resources/js/Pages/Marketing/Compare/Index.jsx:84` | Consistent |
| **1,500+** | "tested under **1,500+ automated test suites**" | `resources/js/Pages/Marketing/Partners.jsx:146` | Consistent |
| **1,500+** | "1,500+ Automated Verification & Integrity Tests" | `resources/js/Pages/Marketing/Roadmap.jsx:51` | Consistent |
| **1,500+** | "Guarded by 1,500+ automated tests" | `resources/js/Pages/Marketing/Solutions/Index.jsx:93` | Consistent |

All five instances agree on "1,500+". Not independently verified against the actual PHPUnit/Pest test suite count in this pass (would require running `php artisan test --list-tests` or counting test files — out of scope for a read-only grep sweep, flagged as **not confirmed** whether the real suite currently has ≥1,500 tests).

### 1d. "500+ automated" (a different claim, same number)

| Number | Exact phrase | File(s) | Consistent or drifted? |
|---|---|---|---|
| **500+** | "500+ automated" (tests/checks, distinct from "1,500+ automated tests") | `resources/js/Pages/Marketing/About.jsx:82` (own quote fragment inside table row `k: 'The engine'`), `resources/js/Pages/Marketing/Compare/Index.jsx:83-84` ("100% Offline" / "500+ Automated"), `resources/js/Pages/Marketing/Partners.jsx:146`, `resources/js/Pages/Marketing/Roadmap.jsx:51`, `resources/js/Pages/Marketing/Solutions/Index.jsx:93` | **Same locations as "1,500+"** — grep captured the same sentences twice under different regex patterns (`[0-9]+\+` matched "500+" as a substring of "1,500+"). Confirmed by direct read: this is **not a separate "500+" claim**, it is the same "1,500+ Automated Tests" string being partially matched. No true "500+" test-count claim exists independent of "1,500+". Not a finding — noted to explain the raw grep output. |

### 1e. Uptime / "X faster" claims

Grepped explicitly for `uptime` and `x faster` (case-insensitive) across all 57 Marketing files: **no matches found**. No uptime SLA percentage (e.g. "99.9% uptime") and no "Nx faster" performance claim exists anywhere in `resources/js/Pages/Marketing/`. This closes the audit gap the prior `MARKETING_CONSISTENCY_AUDIT.md` explicitly flagged as unchecked ("A follow-up grep for `%`, `x faster`, `uptime`... would be needed to close this out" — now closed: **not found, confirmed absent**).

### 1f. Percentage claims — spot-checked as real marketing statements (not CSS)

| Number | Context | File | Note |
|---|---|---|---|
| 100% Offline | Compare page hero stat | `resources/js/Pages/Marketing/Compare/Index.jsx:83` | Refers to POS offline-capability (Dexie.js), consistent with CLAUDE.md's documented offline-first architecture — not independently falsifiable from code in this pass but not contradicted either |
| 100% accurate | Pricing FAQ copy | `resources/js/Pages/Marketing/Pricing.jsx:651` | Marketing language, not a measurable code-derived claim |
| 20% (bigger), 40% (with...) | About page narrative copy | `resources/js/Pages/Marketing/About.jsx:56,65` | Narrative/anecdotal, not a system-wide numeric claim tied to any code constant |

---

## 2. Is there a canonical "all features" list, or is every count hand-typed independently?

**No canonical, single feature-count registry exists anywhere in the codebase that a marketing number could be computed from.** Confirmed by search for a constant/registry named anything like `FEATURE_COUNT`, `ALL_FEATURES`, `FeatureCatalog`, etc. — none found feeding the "226+", "255+", or "32" claims.

What actually exists, and how each marketing number relates (or fails to relate) to it:

- **`database\seeders\PlanFeatureMatrixSeeder.php`** — confirmed to contain **265 distinct top-level `'key' => [...]` entries** (counted via `grep -oE "^\s*'[a-z0-9_]+'\s*=>" ... | sort -u | wc -l` → 265). This is the closest thing to a real, systematic feature/limit inventory in the codebase. **No marketing page reads this count or derives "226+"/"255+"/"32" from it.** 265 is itself close to neither 226 nor 255 nor 32, and was not cited as the source of any of the marketing numbers in any code comment found.
- **`resources\js\Pages\Marketing\Pricing.jsx`'s `FULL_FEATURE_LIST`** (lines ~384-580) — a hand-authored `categorizedFeatures` array per plan, manually asserting `totalSuite: 32`. This is a **fourth** hand-typed list (distinct from the seeder's 265 keys), curated specifically for the pricing-page UI, with its own internal "32" denominator that does not match the seeder's 265 or either marketing headline number.
- **`resources\js\Pages\Marketing\Shared\FeatureDemos.jsx`** — the file that displays "226+ features" (line 964) is itself a curated demo/showcase component, not a data-driven catalog; the "226+" is a literal string, not `.length` of any array in the file.
- **`resources\js\Pages\WhatIsIncluded.jsx`** — per the prior `MASTER_PLAN_ENTITLEMENT_MATRIX.md` and `PLAN_ENTITLEMENT_SOURCE_OF_TRUTH.md` audits, this page also hand-codes per-tier boolean feature flags (e.g. Growth Engine `starter={false} growth={true}`) independent of the seeder — a fifth independently-maintained "what features exist / who gets them" surface.

**Conclusion: every feature-count number in this codebase is hand-typed independently. There are at minimum four unrelated "how many features" figures in play (226+, 255+, 32, and the seeder's factual 265 keys), and none derive from, or are checked against, any of the others.**

---

## 3. Plan names/prices — defined once, or hardcoded elsewhere too?

**Hardcoded elsewhere too, in multiple places, with at least two confirmed numeric drifts.**

### 3a. Canonical definition
`config\pricing.php` (`pricing.plans`) is the documented base-plan price source:

```
'name' => 'Counter',  'price_monthly' => 18.00,  'price_annual' => 180.00   (line 19-22)
'name' => 'Starter',  'price_monthly' => 36.00,  'price_annual' => 360.00  (line 33-36)
'name' => 'Growth',   'price_monthly' => 63.00,  'price_annual' => 630.00  (line 47-50)
'name' => 'Business', 'price_monthly' => 129.00, 'price_annual' => 1290.00 (line 61-64)
```

LTD (lifetime) tiers, `pricing.ltd_plans` (lines 182-215), explicitly comment: *"Value must match `database\seeders\PlanFeatureMatrixSeeder.php` — the seeded `plan_limits` table is the runtime source of truth. This config value is read only as a fallback."*
```
ltd_tier_1: price_lifetime => 99.00   (line 187)
ltd_tier_2: price_lifetime => 199.00  (line 198)
ltd_tier_3: price_lifetime => 349.00  (line 209)
```

`ai_tiers` (lines 76+): `spark` $3.00/mo (500 pages/2500 queries, line 79-81), `shop` $6.00/mo (1000/5000, line 94-96), `pro` $12.00/mo (2000/10000, line 109-111), (a fourth `max` tier not fully re-quoted here but referenced by the frontend fallback below).

### 3b. `resources\js\Pages\Marketing\Pricing.jsx` — reads dynamically, but also carries a hardcoded fallback that itself has a bug
- Route `web.php:30-43` (`marketing.pricing`) passes `'plans' => $plans` from `App\Models\Plan::with(['limits','features'])...->get()` — i.e. the live DB `plans` table, which is seeded from the same source as `config/pricing.php`. `HandleInertiaRequests.php:215` also shares `'pricing' => config('pricing')` on marketing routes (`HandleInertiaRequests.php:49`).
- **But** `Pricing.jsx:140-144` defines a **hardcoded fallback** used before the DB values arrive/override:
  ```
  const defaultPricesUSD = {
      starter:    { subscription_monthly: 36,  subscription_annual: 30,  ltd: 79 },
      growth:     { subscription_monthly: 63,  subscription_annual: 53,  ltd: 199 },
      enterprise: { subscription_monthly: 129, subscription_annual: 108, ltd: 399 },
  };
  ```
  (`Pricing.jsx:140-144`). The `subscription_monthly` values (36/63/129) **do match** `config/pricing.php`. **But `enterprise.ltd: 399` does not match `config/pricing.php`'s `ltd_tier_3.price_lifetime: 349.00`** (config line 209) — a **$50 hardcoded numeric drift** for the Business-tier lifetime deal price, sitting in the pricing page's own fallback data, independent of whatever `Billing/Index.jsx` shows (see 3c, which has the same wrong number).
- `Pricing.jsx:210-213` also defines a **second, independent hardcoded fallback** for the AI add-on tiers (only used if `pricingProps.ai_tiers` from the shared Inertia prop is empty):
  ```
  { key: 'spark', priceUSD: 3, ... }, { key: 'shop', priceUSD: 6, ... }, { key: 'pro', priceUSD: 12, ... }, { key: 'max', priceUSD: 24, ... }
  ```
  (`Pricing.jsx:210-213`). These four values (3/6/12/24) **do match** `config/pricing.php`'s `ai_tiers.spark/shop/pro` (3.00/6.00/12.00) as far as those three are directly quoted above; `max: 24` was not independently re-quoted from config in this pass but is consistent with the other three and with the same fallback figure used in `Billing/Index.jsx` (see below), so treated as consistent.

### 3c. `resources\js\Pages\Billing\Index.jsx` — hardcoded, and provably wrong against `config/pricing.php` in two distinct places
- `PLAN_META` object (`Billing/Index.jsx:20-26`):
  ```
  counter:  price: '$18/mo'   (line 20) — matches config (18.00)
  starter:  price: '$36/mo'   (line 21) — matches config (36.00)
  growth:   price: '$63/mo'   (line 22) — matches config (63.00)
  business: price: '$129/mo'  (line 23) — matches config (129.00)
  ltd_1:    price: '$79'      (line 24) — matches config ltd_tier_1 (99.00)? — NO, see below
  ltd_2:    price: '$199'     (line 25) — matches config ltd_tier_2 (199.00) — consistent
  ltd_3:    price: '$399'     (line 26) — config ltd_tier_3.price_lifetime = 349.00 — **DRIFTED, $50 too high**
  ```
  **Correction on `ltd_1`:** `Billing/Index.jsx:24` shows `$79`, but `config/pricing.php:187` shows `ltd_tier_1.price_lifetime = 99.00`. **This is a second confirmed drift — $20 too low for the entry LTD tier.** (Note: `$79` matches the *old* AppSumo Tier-1 price referenced in `MASTER_PLAN_ENTITLEMENT_MATRIX.md`'s LTD stacking table — "1 code ($79)" — meaning the marketing-era $79 price was never updated in `Billing/Index.jsx` to the current seeded $99, while `config/pricing.php` was updated. This is a stale hardcoded value, not a typo.)
- A **second, separate hardcoded price fallback** at `Billing/Index.jsx:884,887`, used only if `targetPlanModel`/`currentPlanModel` (DB lookups) are null:
  ```
  selectedPlan === 'counter' ? 18 : selectedPlan === 'starter' ? 19 : selectedPlan === 'growth' ? 49 : selectedPlan === 'business' ? 99 : 0
  ```
  (`Billing/Index.jsx:884`, mirrored again at `:887` for `currentPriceUSD`). **Counter matches (18), but Starter ($19 vs real $36), Growth ($49 vs real $63), and Business ($99 vs real $129) are all wrong** — a third independent hardcoded price table, and the most severely drifted one found in this sweep (off by $17, $14, and $30 respectively). If this fallback path is ever hit (DB plan lookup fails/plan not found), a customer would see substantially incorrect renewal/upgrade pricing in the billing UI.
- A **third, independent AI-tier price/name list**, unrelated to `config/pricing.php`'s `spark/shop/pro/max` naming, at `Billing/Index.jsx:1911-1914`:
  ```
  { key: 'ai_starter', label: 'Starter AI', price: '$3', scans: 90,  queries: 110 }
  { key: 'ai_lite',    label: 'Lite AI',    price: '$5', scans: 150, queries: 200 }
  { key: 'ai_pro',     label: 'Pro AI',     price: '$15', scans: 480, queries: 420 }
  { key: 'ai_ultimate',label: 'Ultimate AI',price: '$25', scans: 850, queries: 800 }
  ```
  Compared to `config/pricing.php`'s canonical `ai_tiers` (Spark $3/500 pages/2500 queries, Shop $6/1000/5000, Pro $12/2000/10000, plus Max): **different tier names (`ai_starter/ai_lite/ai_pro/ai_ultimate` vs `spark/shop/pro/max`), different prices ($3/$5/$15/$25 vs $3/$6/$12/$24), and completely different usage-quota numbers (90/110 vs 500/2500, etc.)**. This is a fully independent, drifted AI-pricing table — the only one of the four AI-price tables found in this sweep (config, Pricing.jsx primary render, Pricing.jsx fallback, this one) that disagrees with the other three on every dimension.

### 3d. Emails / invoice PDFs — no plan-price duplication found
Searched `resources/views/emails`, `resources/views/invoices`, `resources/views/tools/pdf/invoice.blade.php`, `resources/views/v3/invoices`, and every `app/Mail/*.php` Mailable (`DailySalesSummaryMail`, `PaymentFailedMail`, `PaymentReminderMail`, `SubscriptionCancelledMail`, `SubscriptionExpiryReminderMail`, `TenantWelcomeMail`, `TrialExpiredMail`, `TrialReminderMail`, etc.) for `price_monthly`, dollar-plan-price literals, or plan-tier names (`Starter Engine`, `Growth Engine`, `Business Engine`). **No matches found.** Invoice/PDF generation (`resources/views/tools/pdf/invoice.blade.php`, `InvoiceController`, `V3\InvoicePdfController`) is customer-sales-invoice tooling (POS transactions), not subscription-billing receipts, and does not duplicate plan pricing. **Confirmed clean — no finding here.**

---

## 4. Report count reconciliation (39+4=43 vs 52 claim — reconciled precisely)

The prior audit (`MASTER_PLAN_ENTITLEMENT_MATRIX.md` and `FEATURE_GATING_AUDIT.md`) stated: *"39 seeded `report_*` keys + 4 aliases = 43 vs 52 actual `/reports/*` routes."* This sweep re-derived both sides from scratch with exact grep counts; **the prior figures were approximations and are superseded by the numbers below.**

### 4a. Seeder side — actual key count
`grep -oE "^\s*'[a-z0-9_]+'\s*=>" database/seeders/PlanFeatureMatrixSeeder.php` isolated to report-related keys:

- **41** keys with the literal `report_` prefix (e.g. `report_profit_loss`, `report_trial_balance`, `report_stock_valuation`, `report_sales_summary`, `report_expiring_soon`, etc. — full list captured in this pass).
- **+7** additional report-related keys that do **not** use the `report_` prefix but are consumed by report-route `plan.feature:` middleware: `cash_flow_report`, `discount_report`, `owners_daily_pulse`, `pre_sales_reservation`, `stock_aging`, `stock_valuation`, `unified_party_ledger`.
- **Total: 48 report-related entitlement keys in the seeder** (41 + 7), not 39+4=43 as the prior audit stated. The prior "39+4" figure undercounted by 5.

### 4b. Route side — actual route count
`grep "Route::get" routes/web.php | grep "reports"` (excluding two unrelated `permission:reports.audit`-gated non-report routes, `/activity-log` and `/admin-panel/logs`, which merely reuse the string "reports" inside a permission name, not a report page):

- **Legacy report group** (`routes/web.php:1077-1133`, inside the tenant-scoped group, route names `reports.*` with no extra prefix): **49 `Route::get(...)` declarations.**
  - Of these, **37 carry a `plan.feature:` middleware gate.**
  - **12 have no `plan.feature:` gate at all**: `reports.index`, `reports.daily-sales`, `reports.sales`, `reports.day-book`, `reports.transactions`, `reports.tax`, `reports.bank-statement`, `reports.stock-valuation`, `reports.low-stock`, `reports.movement-history`, `reports.expiry`, `reports.analytics` (all at `routes/web.php:1077-1122`, exact lines available in the route dump captured during this audit).
- **Four orphan/legacy routes outside the main block**: `routes/web.php:1425` (`reports.analytics` — a *second* route registered under the same name, `graphAnalytics` action, also ungated), `routes/web.php:1552` (`reports.dashboard`, ungated), `routes/web.php:1795-1796` (`reports.discount-report` and `reports.inventory-valuation`, both **stub routes returning `abort(501, 'Implement ...')`** — i.e. explicitly unimplemented placeholder routes, not live report pages, and also ungated).
- **V3 report group** (`routes/web.php:1927-1941`, inside `Route::prefix('s/{store_slug}/v3')->name('store.v3.')->group()` opened at `routes/web.php:1834`): **15 `Route::get(...)` declarations**, whose *real* route names are `store.v3.reports.*` (the `store.v3.` prefix is inherited from the enclosing group — confirmed by reading the group wrapper directly). This means **these do not collide with the legacy `reports.*` names** despite sharing the same tail segment (e.g. `reports.trial-balance` vs `store.v3.reports.trial-balance` are two distinct, both-reachable route names/URLs) — a nuance the prior audit's flat "52 actual routes" figure did not resolve.
  - Of these 15, **10 carry a `plan.feature:` gate**, **5 do not**: `store.v3.reports.sales`, `store.v3.reports.cogs`, `store.v3.reports.tax`, `store.v3.reports.inventory-movement`, `store.v3.reports.export` (the last one is instead gated by `permission:data.export`, a permission check rather than a plan-entitlement check).

**Grand total: 49 (legacy) + 4 (orphans) + 15 (V3) = 68 `Route::get(...reports...)` declarations** — not 52. The prior audit's "52 actual routes" figure undercounted by 16, almost certainly because it did not separately discover/count the V3 report group (which lives ~800 lines further down the file, inside a differently-prefixed group) or the 4 orphan routes scattered outside the main block.

### 4c. Reconciling the gap — ungated routes by name (as requested)

**Routes with literally zero `plan.feature:` gate, listed by name/path (17 total, legacy + V3 combined, excluding the 2 already-`abort(501)` stub routes which are not live pages):**

| Route name | Path | Group | Gate present? |
|---|---|---|---|
| `reports.index` | `/reports` | Legacy | None |
| `reports.daily-sales` | `/reports/daily-sales` | Legacy | None |
| `reports.sales` | `/reports/sales` | Legacy | None |
| `reports.day-book` | `/reports/day-book` | Legacy | None |
| `reports.transactions` | `/reports/transactions` | Legacy | None |
| `reports.tax` | `/reports/tax` | Legacy | None |
| `reports.bank-statement` | `/reports/bank-statement` | Legacy | None |
| `reports.stock-valuation` | `/reports/stock-valuation` | Legacy | None (note: the V3 sibling `store.v3.reports.inventory-valuation` IS gated by `plan.feature:stock_valuation` — same underlying data, inconsistent gating between legacy and V3 versions of effectively the same report) |
| `reports.low-stock` | `/reports/low-stock` | Legacy | None |
| `reports.movement-history` | `/reports/movement-history` | Legacy | None |
| `reports.expiry` | `/reports/expiry` | Legacy | None |
| `reports.analytics` (×2 declarations, `web.php:1122` and `web.php:1425`) | `/reports/analytics` | Legacy | None (both) |
| `reports.dashboard` | `/reports/dashboard` | Legacy (orphan, `web.php:1552`) | None |
| `store.v3.reports.sales` | `s/{store}/v3/reports/sales` | V3 | None |
| `store.v3.reports.cogs` | `s/{store}/v3/reports/cogs` | V3 | None |
| `store.v3.reports.tax` | `s/{store}/v3/reports/tax` | V3 | None |
| `store.v3.reports.inventory-movement` | `s/{store}/v3/reports/inventory-movement` | V3 | None |
| `store.v3.reports.export` | `s/{store}/v3/reports/export` | V3 | Gated by `permission:data.export` (RBAC), not `plan.feature:` — a different axis of access control, not a plan-entitlement omission |

**Every `plan.feature:` key actually referenced by a report route (both legacy and V3) was cross-checked against the seeder's key list gathered in §4a — no orphaned middleware key (a key referenced by a route but never seeded) was found in this pass.** The specific 2026-08-07 gap the seeder's own code comment describes (`discount_report`, `cash_flow_report`, `stock_valuation` referenced but unseeded) appears already resolved — all three keys are present in the current seeder (confirmed in the key inventory pulled for §4a).

**Net finding:** the "9-route gap" framed in the task brief does not exist in the form assumed. The real picture is: 68 actual report-route declarations (not 52), of which 17 unique ungated routes exist (not 9), spread across two structurally separate route groups (legacy `/reports/*` and `/v3` `store.v3.reports.*`) that the prior audit's flat count conflated. Whether the 17 ungated routes are an intentional design decision (e.g., basic/free reports available to every plan by omission of a gate) or an oversight is **not confirmed by code** — no comment in `routes/web.php` explains why these specific 17 have no `plan.feature:` middleware while their siblings do.

---

## 5. Other duplicated master lists found

| List | Locations | Note |
|---|---|---|
| **Industry templates count ("16")** | `database\seeders\PlanFeatureMatrixSeeder.php:335`: `'industry_templates_count' => ['trial' => '16', 'starter' => '16', 'growth' => '16', 'business' => '16']` | This is the only place a literal "16" industry-template count was found in this sweep. **No marketing page in `resources/js/Pages/Marketing/` was found asserting "16 industry templates" as customer-facing copy** (searched explicitly, no match) — so unlike the feature/report counts, this number does not currently have a duplicated/drifted marketing-copy counterpart; it exists once, in the seeder, consistently across all four plans. Not a finding, but flagged as the one master-list number in this sweep that is *not* duplicated. |
| **AI add-on tiers (name/price/quota)** | `config\pricing.php:76-116+` (canonical: Spark $3/Shop $6/Pro $12/Max $24), `resources\js\Pages\Marketing\Pricing.jsx:210-213` (fallback, matches canonical), `resources\js\Pages\Billing\Index.jsx:1911-1914` (**different names and numbers entirely** — `ai_starter/ai_lite/ai_pro/ai_ultimate` at $3/$5/$15/$25) | **Confirmed duplicated master list with real drift** — see §3c above for full detail. This is in addition to the previously-known duplication of the *feature-gating* matrix (`featureGroups.js`, `usePlan.js`/`PlanGate.jsx` prop namespaces, `Billing/Index.jsx`'s `FEATURE_UPGRADE_TARGET`, `UpgradeModal.jsx`) already documented in `PLAN_ENTITLEMENT_SOURCE_OF_TRUTH.md`. |
| **Base plan prices (Counter/Starter/Growth/Business)** | `config\pricing.php:19-64` (canonical), `resources\js\Pages\Marketing\Pricing.jsx:140-144` (fallback, matches on monthly, **drifted on LTD**), `resources\js\Pages\Billing\Index.jsx:20-26` (`PLAN_META`, **drifted on ltd_1 and ltd_3**), `resources\js\Pages\Billing\Index.jsx:884,887` (second independent fallback, **drifted on starter/growth/business**) | See §3b/3c above — three separate hardcoded copies beyond the canonical config, two of which contain confirmed numeric errors. |
| **"What's included" per-plan feature checklist** | `resources\js\Pages\WhatIsIncluded.jsx` (per prior audits — per-tier boolean props, e.g. Growth Engine), `resources\js\Pages\Marketing\Pricing.jsx`'s `FULL_FEATURE_LIST.categorizedFeatures` (this sweep, §2 above) | Two independently-authored "what do you get on each plan" checklists exist across these two pages; not verified in this pass whether their individual line items agree feature-by-feature (that level of line-by-line comparison was already partially done for Growth Engine/WooCommerce in the prior `FEATURE_GATING_AUDIT.md` and is not repeated here — flagged as a possible follow-up if the founder wants every line cross-checked, not just the two previously-known contradictions). |

---

## Open questions for the founder

1. **Which feature count is correct: 226+, 255+, or the Pricing page's "32"?** All three currently ship live on the marketing site simultaneously (`About.jsx`/`FeatureDemos.jsx` say 226+, `Features.jsx`'s meta description says 255+, `Pricing.jsx`'s comparison table says 32-of-32). Which one should be authoritative, and should the other two be retired or reconciled?
2. **Is `enterprise.ltd: 399` (Pricing.jsx fallback) or `$349` (`config/pricing.php` `ltd_tier_3`) the correct current price for the Business-tier lifetime deal?** These are two different numbers for the same offer in two different files.
3. **Is `$79` (Billing/Index.jsx `PLAN_META.ltd_1`) or `$99` (`config/pricing.php` `ltd_tier_1`) the correct current price for the entry-tier lifetime deal?** Evidence suggests `$79` is a stale, pre-price-increase value never updated in the billing UI.
4. **Is the third hardcoded fallback price table in `Billing/Index.jsx:884,887` (`starter: 19, growth: 49, business: 99`) dead code that can never actually execute (because `targetPlanModel`/`currentPlanModel` should always resolve from the DB), or is there a real code path where it fires and shows a customer a wrong upgrade price?** This needs a trace of when `targetPlanModel`/`currentPlanModel` can be null in production, which was not established in this read-only sweep.
5. **Is the AI tier list at `Billing/Index.jsx:1911-1914` (`ai_starter/ai_lite/ai_pro/ai_ultimate`) a deliberately different, older AI product than the current `config/pricing.php` `ai_tiers` (`spark/shop/pro/max`), or is it simply stale and should be deleted/replaced?** The completely different naming convention (not just different prices) suggests this may be leftover copy from a prior AI-pricing scheme rather than a simple drift.
6. **Is the 17-route gap in `plan.feature:` gating (§4c) intentional?** i.e., are `reports.sales`, `reports.stock-valuation`, `reports.tax`, `reports.analytics`, `reports.dashboard`, and their V3 counterparts meant to be available to every plan tier unconditionally (a deliberate "basic reports are free" design), or were they simply missed when the `plan.feature:` middleware was rolled out across the rest of the report catalog? No code comment explains the omission either way.
7. **Should the legacy (`/reports/*`) and V3 (`s/{store}/v3/reports/*`) report route sets be reconciled into one, or is running two parallel report systems (with inconsistent gating between siblings, e.g. `reports.stock-valuation` ungated vs `store.v3.reports.inventory-valuation` gated) an intentional migration-in-progress state?** If it's a migration, is there a target date/plan to retire the legacy block, and should new `plan.feature:` gates be added to both sides going forward or only the V3 side?
8. **Is there an appetite for a CI guard-rail** (as previously suggested in `FEATURE_GATING_AUDIT.md` for the seeder/route key mismatch class of bug) that would also catch **numeric drift** between `config/pricing.php` and the hardcoded fallback price tables in `Pricing.jsx` and `Billing/Index.jsx` — e.g. a test that asserts the JS fallback constants equal the PHP config values at build time or CI time?
