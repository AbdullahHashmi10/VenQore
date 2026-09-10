# VenQore — Pricing, Gating & Entitlement Build Spec

**V11 · 8 Sep 2026 · THE ONLY FILE TO BUILD FROM.**

This supersedes and replaces, in full: `VENQORE_PRICING_GATING_MASTER_SPEC_V9.md`,
`VENQORE_PRICING_GATING_MASTER_SPEC_V10.md`, `VENQORE_PRICING_FINAL_DECISION_V10.1.md`, and
`extras/VENQORE_PRICING_*.md` (V4, V5, V6/V7 and its addenda). **Do not read those. They contain
superseded prices, a retired "capability packs" model, and a contradictory trial design.**

Everything needed to implement is in this file.

---

# PART 0 — BLOCKERS. Fix these before anything else.

## 0.1 The gate is open

`app/Services/PlanGate.php` currently returns `true` for everything:

```php
public static function check(...): bool { return true; }
public static function enforce(...): void { /* Unlocked */ }
public static function getLimit(...): mixed { return null; }
```

Every tenant on every plan has every feature and no limits. **No pricing means anything until Part 3
is done.** 74 `PlanGate::` call sites already exist across controllers — do not move or rewrite them.

## 0.2 The till is one bad row away from stopping

Live plan gates sit on the sale write path:

- `app/Http/Controllers/SaleController.php:52` — `PlanGate::enforce('transactions_per_month', $monthlyCount)`
- `app/Http/Controllers/V3/SaleController.php:34` — the same call
- `app/Http/Middleware/EnforceTransactionLimit::class` — registered on `POST /sales` (`routes/web.php:1747`)
  and `POST /sales/park` (`:1760`)

These pass today only because the seeded value is `null`. `PlanRepository::getEffectiveLimit()` **fails
closed and returns `false`** for any key missing from `plan_limits` — so one unseeded key, one partial
re-seed or one stale cache and `enforce()` throws mid-sale.

**Fix:**
1. Delete the `PlanGate::enforce('transactions_per_month', ...)` call from **both** sale controllers.
2. Remove `EnforceTransactionLimit` from the `/sales` and `/sales/park` routes, or strip its blocking
   branch and keep only the counter sync that feeds the usage meter.
3. Add a guard test that fails if `PlanGate::` appears anywhere in the sale write path.

## 0.3 Two fail-open holes in `EnsurePlanFeature`

```php
if (!$tenant) { return $next($request); }                        // fails OPEN
if ($tenant && $tenant->slug === 'test-store') { $tenant = null; } // then also fails open
```

Deny (402 / redirect) when no tenant resolves on a fenced route. Move the `test-store` exemption behind
`app()->environment('testing')`.

## 0.4 Services module is broken at the data layer

- `job_assignments.employee_id` is `bigInteger` while `employees.id` is a **UUID** — no real employee id fits.
- `App\Models\Employee`, which `JobAssignment::employee()` targets, **does not exist**.
  `ServiceJobController::show()` eager-loads it, so the first job with an assignment throws.

Services is priced as a first-class capability on every plan in this spec. Fix before launch.

## 0.5 Config still holds retired prices

`config/pricing.php` carries 18/36/63/129 and the retired Spark/Shop/Pro/Max AI tiers.
`PlanFeatureMatrixSeeder` reads prices from that config — change them there, not only on the page.

---

# PART 1 — CANONICAL PLAN VALUES

**Nothing may contradict this table.** Not config, not the seeder, not the pricing page, not the copy.

| key | **solo** | **starter** | **core** | **scale** | **custom** |
|---|---|---|---|---|---|
| `price_monthly` | 0.00 | **49.00** | **99.00** | **299.00** | 800.00 (from) |
| `price_annual` | — | 490.00 | 990.00 | 2990.00 | contract |
| `staff_limit` (full seats) | 1 | **1** | **5** | **25** | null |
| `till_logins` | 2 | null | null | null | null |
| `locations` (included) | 1 | 1 | 1 | 1 | null |
| `registers` (per location) | 1 | 2 | 6 | 20 | null |
| `transactions_per_month` | **100** | **null** | **null** | **null** | null |
| `service_jobs_per_month` | **20** | null | null | null | null |
| `sku_limit` (catalogue) | 500 | 5000 | 25000 | 250000 | null |
| `history_retention_days` | **30** | null | null | null | null |
| `ai_credits_monthly` | 100 | 500 | 2000 | 10000 | negotiated |
| `ai_scans_monthly` | 10 | — | — | — | — |
| `ai_rebuilds` | 0 | 1 / 90 days | 1 / 90 days | 1 / month | negotiated |

`null` = unlimited. Solo's caps are the only transaction/job caps anywhere in the product.

## 1.1 Universal — ON for every plan including Solo

All 45 registered modules in `config/modules.php`. Explicitly including, and correcting the seeder
wherever it currently disables these:

POS · offline mode · barcode · receipts · returns · inventory · stock take · in-location transfers ·
parties · customer & supplier ledger · purchases · purchase orders · debit notes · expenses ·
**double-entry accounting** · **all 43 reports** · sales orders · proposals · invoicing · payments ·
restaurant · table service · cookbook · labels · **production, BOM, recipes, work orders** ·
**services, service jobs, calendar, contracts, packages, rates** · **serial, IMEI, batch, expiry** ·
**loyalty, gift cards, marketing campaigns** · staff · attendance · notifications ·
AI onboarding build · SmartCapture · Vena · conversational dashboard.

**There is no vertical gating anywhere in this product. This decision is locked.** A café, a repair
shop, a pharmacy, a salon and a wholesaler all get the same system.

## 1.2 ON for every PAID plan (off on Solo only)

`growth_engine` · `owners_daily_pulse` · `recurring_invoices` · `invoice_reminders` ·
`bank_reconciliation` · `e_invoicing` · `fund_management` · `fiscal_year_closing` ·
`fixed_asset_depreciation` · **Google Drive backup** (`GoogleDriveService`) · **adviser seat** ·
**B2B network — basic** (merchant discovery, stock requests, limited active connections).

**Google Drive backup is never gated between paid tiers.** It is a data-safety feature and it goes on
the pricing page.

## 1.3 The scale fences — the ONLY things gated between paid tiers

| Capability | Feature keys | solo | starter | core | scale |
|---|---|---|---|---|---|
| Multi-branch + inter-branch transfers | `multi_branch` | 0 | activates with 2nd location | activates with 2nd location | 1 |
| API + webhooks | `api_access`, `webhooks` | 0 | **$29 add-on** | 1 | 1 |
| Audit trail + custom granular roles | `security_activity_log`, `custom_roles` | 0 | **$39 add-on** | 1 | 1 |
| White-label | `white_label` | 0 | 0 | **$49 add-on** | 1 |
| B2B network — unlimited connections | `network_unlimited` | 0 | 0 | 1 | 1 |
| Consolidated multi-entity reporting | `consolidated_reporting` | 0 | 0 | 0 | 1 |
| Channel sync | `woocommerce`, `amazon_sync`, `ebay_sync`, `tiktok_sync` | 0 | $19 each | $19 each | 2 included |

## 1.4 Add-ons

**Rule: an add-on sells more of a capability, or unlocks one from the immediately adjacent tier. It
never unlocks a capability two tiers up, and it is never purchasable on Solo.**

| Add-on | Price | Available on |
|---|---|---|
| Extra location | **$45/mo** | starter, core, scale |
| Extra full seat | $15/mo | starter, core, scale |
| Extra register | $20/mo | starter, core, scale |
| +50,000 catalogue items | $25/mo | starter, core, scale |
| Channel sync (each) | $19/mo | starter, core |
| API + webhooks | $29/mo | starter |
| Audit trail + custom roles | $39/mo | starter |
| White-label | $49/mo | core |
| 1,000 AI credits | $10 one-time | all paid |
| 5 AI rebuilds | $10 one-time | all paid |
| Setup & migration | $249 one-time | all |

**Multi-branch is never an add-on.** Buying a 2nd location activates `multi_branch` automatically —
that is what buying a location means.

## 1.5 Support

Solo: Vena + help centre only, no human. Starter: email, 2 business days. Core: 1 business day.
Scale: named contact, 4 business hours. Custom: contracted SLA.

---

# PART 2 — CAPACITY BEHAVIOUR

## 2.1 The catalogue rule (exact)

**Never disable existing operations.** At 100% of included catalogue capacity: everything already in
the system keeps selling, syncing, reporting and being purchased. **Only the creation of item N+1 is
blocked**, with the capacity add-on offered inline.

Warn in-app at 80%. Warn again at 100%. A wall in front of *new* capacity is a sale; a wall in front of
*existing* trade is an outage.

## 2.2 The till rule (absolute)

**No plan state, limit, exhausted meter, device rule or failed payment may prevent:** opening the POS,
ringing a sale, taking payment, printing a receipt, or processing a return. Register limits apply when a
device is **registered**, never at the till. Test this for every plan × every billing state
(`trial`, `active`, `past_due`, `expired`, `cancelled`).

Solo's 100-transaction cap is the single exception, and it is a free plan.

## 2.3 History (Solo only)

`history_retention_days = 30` means the last 30 days are **browsable**. Older rows stay in the database.

**The accounting engine must always calculate over the complete ledger.** Current balance, AR/AP totals,
inventory valuation, retained earnings, trial balance and depreciation stay mathematically correct at
all times. Only detailed browsing of old transactions, old detailed reports and historical export are
locked. **Never delete a row.** Restores instantly on upgrade.

---

# PART 3 — ENTITLEMENT ENFORCEMENT

## 3.1 PlanGate

Replace the three method bodies. Do not touch the 74 call sites.

```php
public static function check(string $feature, ?int $currentCount = null): bool
{
    $tenant = self::tenant();
    if (!$tenant) return false;                 // fail CLOSED
    if (self::isPlatformContext()) return true; // God Admin / platform staff bypass

    $limit = $tenant->getLimit($feature);       // reads plan_limits via PlanRepository

    if ($limit === null)  return true;
    if ($limit === false || $limit === '0' || $limit === 0) return false;
    if ($limit === true  || $limit === '1' || $limit === 1) return true;
    if ($currentCount !== null) return $currentCount < (int) $limit;
    return (int) $limit > 0;
}

public static function enforce(string $feature, ?int $currentCount = null): void
{
    if (!self::check($feature, $currentCount)) {
        throw new PlanLimitException($feature, $currentCount, self::getLimit($feature));
    }
}

public static function getLimit(string $feature): mixed
{
    $tenant = self::tenant();
    return $tenant ? $tenant->getLimit($feature) : false;
}
```

- **Fail closed.** Unknown key = denied **and logged as a warning**. A typo silently granting access is
  how the current situation arose.
- `PlanLimitException` carries `feature`, `current`, `limit` and the **upgrade target plan slug**.
- Respect `tenant_plan_overrides` — `Tenant::getLimit()` already does.
- **Bust `plan_limits:*` cache** on plan change, add-on purchase, trial expiry and LTD redemption.

## 3.2 Middleware

```php
if (!PlanGate::check($feature)) {
    return $request->expectsJson() || $request->is('api/*')
        ? response()->json(['message' => 'upgrade_required', 'feature' => $feature,
                            'limit' => PlanGate::getLimit($feature)], 402)
        : redirect()->route('store.billing.upgrade', ['store_slug' => $slug, 'feature' => $feature]);
}
```

Attach to every fenced route group.

## 3.3 Observers — quantity caps

Controllers are not enough; the API, importers, seeders and queue jobs bypass them.

| Model | `creating` check |
|---|---|
| `Location` / `Store` | `PlanGate::enforce('locations', Location::count())` |
| `User` (full seats only) | `PlanGate::enforce('staff_limit', User::fullSeats()->count())` |
| `Register` / `Device` | `PlanGate::enforce('registers', Register::count())` |
| `Product` | `PlanGate::enforce('sku_limit', Product::count())` |

Bulk import checks **once for the batch** (existing + incoming) and fails before writing anything,
naming how many rows exceed the cap.

## 3.4 Seats vs till logins

- **Full seat** = back office. Accounting, purchases, cost prices, reports, settings. Counts to `staff_limit`.
- **Till login** = cashier PIN on the POS screen only. Ring sales, take payment, print, return.
  **No** cost prices, margins, reports, ledger, purchases or settings.
  **Free and unlimited on every paid plan. Never counts to `staff_limit`.**
- **Adviser seat** = non-billable, read-only on P&L, balance sheet, trial balance, general ledger,
  journals, reports and export. No POS, no settings, no user management. One per paid tenant.

## 3.5 Device & session control

1. Named users, individual logins, licence terms forbid sharing.
2. **One active session per full seat, with eviction.** Newer login signs out the older, with a named
   banner: *"You were signed out — alex@shop.com signed in on another device."*
3. **Soft device cap per seat** (`devices_per_seat`: solo 2, starter 3, core 3, scale 5). Block the extra
   activation, offer **self-service deactivation** in the same dialog plus a device list in Settings.
   Warn before blocking, never silently.
4. **Do not build:** impossible-travel / IP checks, canvas / GPU / font fingerprinting, any location
   collection.
5. **Privacy:** first-party signed HTTP-only device token issued at authentication (the "strictly
   necessary" exemption). Store device label, token hash, first seen, last seen, IP **country**. Nothing
   else. Show the customer their own device list with a "sign out this device" button.
6. **None of this may ever touch the till.** See 2.2.

---

# PART 4 — LOCK STATES (UI CONTRACT)

`PlanRepository::featuresFor($tenant)` is already shared into Inertia. Add a `useEntitlement()` hook.
**Frontend is presentation only; it never decides access.**

| State | When | UI |
|---|---|---|
| **1 Open** | plan includes it | normal. **Never** badge an included feature with a plan name |
| **2 Preview-locked** | fenced capability | menu item stays visible; page renders real structure with clearly-labelled sample data; one button naming the exact price difference |
| **3 Limit-blocked** | has capability, hit quantity | creation blocked, existing data untouched, message names the exact number and both exits: *"You have 5 of 5 seats. Add one for $15/mo, or move to Scale for 25."* |
| **4 Metered-stopped** | AI credits exhausted | AI stops, nothing else does. Two exits: top up, or attach your own key. **Never** auto-bill. Warn in-app + email at 80% |
| **5 Archived read-only** | after downgrade, or Solo history past 30 days | data never deleted; read-only behind a banner naming exactly what is archived and what reopens it. Block downgrade while receivables/payables are open. 30-day grace |

## 4.1 The AI builder sells the fence

When onboarding or the conversational dashboard concludes the business needs a fenced capability, it
**builds everything it can, then renders the fenced parts as preview cards**:

> "Your business does production — here is the Manufacturing module. It is included on your plan."
> (production is universal — this example applies only to the five scale fences)

Never silently omit a recommended module. Never show a bare paywall.

---

# PART 5 — AI CREDITS

Internal cost ceiling **$0.005 per credit**.

| Action | Credits |
|---|---|
| Scan printed page | 1 |
| Scan handwritten page | 2 |
| Vena question | 1 |
| Product description | 2 |
| Growth signal run | 20 |
| **AI structural rebuild** | separate allowance, not credits |

**Rules — do not soften:** hard stop at cap · never auto-bill an overage · warn at 80% in-app **and** by
email with both exits · no rollover · top-ups never expire · BYOK ($19 one-time, paid plans only)
disables metering entirely · **the word "unlimited" never appears near AI**, in product or marketing.

**Rebuilds:** a structural rebuild alters modules, workflows, fields, dashboard or business structure.
Allowance is periodic (see Part 1), not a lifetime counter. **A failed or rolled-back rebuild does not
consume the allowance.** Extra: 5 for $10.

**Customer-facing:** never show a bare credit number. Show *"1,000 AI credits — about 1,000 document
scans, or 500 handwritten pages"* with real examples.

---

# PART 6 — SIGNUP, TRIAL, FREE

**Primary CTA: "Start 14-day free trial — card required, cancel anytime."** Trial entitlements = **Core**.

- Card captured at signup. Charge date stated on the form **and** in the welcome email.
- **Day-11 email: "your trial ends in 3 days."** Non-negotiable.
- One-click cancel. 30-day money-back guarantee.
- **An expiring trial drops to Solo, never to nothing.** All data intact.

**Secondary CTA, visually subordinate: "Solo — free forever."** Card printed with its three limits:
*1 user · 100 sales and 20 service jobs a month · 30-day history · no human support.*

**There is exactly one trial design. Any reverse-trial / no-card flow in an older spec file is void.**
Solo is the no-card path.

**Activation instrumentation** — activated trials convert 35–65%, unactivated 2–8%, and most decisions
happen within 72 hours. Activation = (a) products or services imported, (b) one real sale rung,
(c) one document scanned. Report activation rate weekly.

**Solo abuse controls:** one free tenant per OTP-verified business mobile · block disposable-email
domains · caps are tenant-level not user-level · auto-pause after 60 days with no login (cold-archive,
restore on login or upgrade, email before pausing) · rate-limit signups per IP and device token.

---

# PART 7 — LIFETIME DEALS (MARKETPLACES ONLY)

**`is_visible = false`, `platform_id = appsumo`. No lifetime pricing on any public page, ever.**

| key | ltd_1 | ltd_2 | ltd_3 |
|---|---|---|---|
| one-time price | **$199** | **$399** | **$699** |
| locations | 1 | 2 | 5 |
| full seats | 1 | 2 | 5 |
| registers | 2 | 4 | 10 |
| **transactions_per_month** | **null** | **null** | **null** |
| service jobs | null | null | null |
| catalogue | 5,000 | 25,000 | 50,000 |
| `ai_credits_annual` | 12,000 | 30,000 | 60,000 |
| all universal modules | ✓ | ✓ | ✓ |
| multi-branch | — | ✓ | ✓ |
| API, white-label, audit, consolidated | — | — | — |
| channel sync | — | — | 1 included |
| support | help centre + Vena | email 3 days | email 2 days |

**No transaction caps on any LTD tier.** A sales cap on a POS stops the shop at the counter, is
discovered in month 2–3 after the 60-day refund window closes, and under AppSumo's listing policy
**limits may be raised at any time but never lowered** — a cap set too tight is permanent for everyone
who already redeemed.

**No mandatory hosting fee.** Any such fee must be in the launch deal terms or it is a limit reduction,
which the policy forbids. Recurring revenue from LTD buyers comes from credit top-ups, channel sync and
capacity add-ons, which is the structure AppSumo itself recommends for AI products.

Stacking 1/2/3 codes → ltd_1/ltd_2/ltd_3 via existing `AppSumoController::redeem` + `PlanRepository`
snapshot. Test all three, plus re-redemption, downgrade and cache busting.

---

# PART 8 — LEMON SQUEEZY CATALOGUE

Single cart per checkout so the $0.50 fixed fee is charged once (existing task P0-6).

**Subscriptions (monthly + annual):** Starter $49/$490 · Core $99/$990 · Scale $299/$2,990
**Quantity add-ons:** location $45/mo · full seat $15/mo · register $20/mo · +50k catalogue $25/mo ·
channel sync $19/mo · API+webhooks $29/mo · audit+roles $39/mo · white-label $49/mo
**One-time:** BYOK unlock $19 · 1,000 AI credits $10 · 5 AI rebuilds $10 · setup & migration $249
**No product for Solo.**

**Retire/hide:** every 18/36/63/129 and 69/179/399 variant · AI Spark/Shop/Pro/Max · $5 seat ·
$10 location · any 19/39/79 legacy variant · anything containing "lifetime" on the website store.

---

# PART 9 — PUBLIC SITE COPY

**Do not print "45 modules."** Group by what the business does:
**Sell** (POS, orders, payments, customers) · **Operate** (inventory, purchasing, expenses, accounting) ·
**Build** (recipes, BOM, production) · **Serve** (jobs, scheduling, contracts) ·
**Grow** (marketing, loyalty, recurring invoices) · **Automate** (AI, SmartCapture, Vena).

**Approved anchor line, footnote must render:**
> "Traditional ERP implementations can cost tens of thousands of dollars a year. VenQore starts at $49 a month."

**Must not publish:** any percentage saving claim · "VenQore does everything <competitor> does plus X" ·
"replaces $400 of software" (not until customer data proves it) · named competitor prices without a link
to their published page · a struck-through price never charged (illegal under UK CMA and EU Omnibus) ·
"unlimited" near AI · any PKR price · any lifetime/LTD pricing.

**Pakistan:** no "Pakistan? get a custom price" section. One footer link, `noindex`, labelled
"Regional pricing enquiry" → short form (business name, city, WhatsApp number, **no prices**). Verify by
OTP to a +92 number, require a Pakistani payment method at redemption. **Do not collect CNIC images.**
The discount lives in `tenant_plan_overrides`, never on a page.

---

# PART 10 — MIGRATION

1. Grandfather the 3 existing tenants for 12 months via `tenant_plan_overrides`, and email them
   **before** any new price is visible anywhere.
2. Update `config/pricing.php`, add `solo` / `starter` / `core` / `scale`, then re-run
   `PlanFeatureMatrixSeeder`. Retire the `counter` and `business` slugs (alias `business` → `scale` in
   one migration; never run both).
3. Correct the pricing page **from the code**, not the other way round.
4. Bust `plan_limits:*` cache on deploy.
5. Founding cohort: first 25 paying customers, 40% off for 12 months, **annual only**, locked, real
   closing date. Implement as coupon + override, not a separate plan.
6. Scheduled increase: revisit at 100 paying customers or 20 public reviews, 60–90 days' notice,
   12-month grandfathering, justified by naming the modules shipped that year.

---

# PART 11 — TESTS (REQUIRED BEFORE LAUNCH)

- Five scale fences × five plan slugs (solo, starter, core, scale, trial) — allow/deny each.
- Every universal module is ON for **solo** — assert explicitly, this is the whole positioning.
- Quantity caps — locations, full seats, registers, catalogue — via controller, via API, via bulk import.
- **Catalogue at 100%:** existing products still sell, sync and report; only creation of N+1 is blocked.
- **Till never blocked:** every plan × every billing state (`trial`, `active`, `past_due`, `expired`,
  `cancelled`) × device cap exceeded × AI credits exhausted.
- **Till still works with the `transactions_per_month` row deleted from `plan_limits`** — this is the
  test that fails today and proves 0.2 is fixed.
- Solo: 101st transaction blocked, 21st service job blocked, 30-day history hidden **not deleted**,
  balances and trial balance still correct over the full ledger, all restore on upgrade.
- Trial expiry: drops to `solo` with data intact, never to a locked or deleted state.
- Session eviction: second login evicts the first, banner names the evicting user.
- Device cap: extra device blocked with self-service deactivation offered, never silently.
- AI: hard stop at cap, no auto-bill, 80% warning fires once, failed rebuild does not consume allowance.
- Downgrade: data preserved, read-only, blocked while receivables/payables open, 30-day grace.
- LTD: redeem 1/2/3 codes, re-redeem, cache busted, limits snapshotted, transactions unlimited.
- Add-on rules: extra location rejected on solo; white-label rejected on starter; nothing purchasable on solo.
- Unknown feature key: denied **and** logged.

---

# PART 12 — ACCEPTANCE CHECKLIST

- [ ] `PlanGate` enforces; a solo tenant is denied all five fences in UI, API and jobs
- [ ] Every universal module is ON for solo
- [ ] `EnsurePlanFeature` returns 402/redirect and fails closed with no tenant; `test-store` bypass is testing-only
- [ ] No `PlanGate::` call remains in the sale write path; `EnforceTransactionLimit` no longer blocks
- [ ] Observers block over-cap creation from every path including import
- [ ] Catalogue at 100% blocks only new creation
- [ ] All five lock states render with correct copy and working CTAs
- [ ] Till works in every plan, billing state and device state
- [ ] Solo seeded; trial expiry lands on Solo; history gated not deleted; balances always correct
- [ ] Session eviction, device list and self-service sign-out shipped; no fingerprinting, no GPS
- [ ] Services `Employee` model and `job_assignments.employee_id` UUID mismatch fixed
- [ ] `config/pricing.php` + seeder + pricing page agree on every number in Part 1
- [ ] Google Drive backup ON for every paid plan and stated on the pricing page
- [ ] No PKR, no lifetime pricing, no unsupported claim, no "45 modules" on any public page
- [ ] LTD `transactions_per_month` = null on all three tiers; LTD invisible on the website platform
- [ ] Card captured at signup; day-11 email sends; activation instrumented; no reverse-trial flow exists
- [ ] Full test suite in Part 11 green

---

# THE PHILOSOPHY

> **Everyone gets the same business operating system. You pay more when you have more people in the
> back office, or more shops, or you consume more variable-cost resources — never because of what trade
> you are in.**
