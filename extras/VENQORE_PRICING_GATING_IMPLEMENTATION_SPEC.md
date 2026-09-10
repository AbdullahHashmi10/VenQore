# VenQore — Pricing, Gating, Free Tier & Device Control — Implementation Spec

**Version 7 · 2026-09-08 · FINAL. Supersedes V4, V5 and V6 of this spec.**
**Hand this file to the coding agent. It is written to be executed, not discussed.**

Companion (reasoning, market data, sources): the Pricing Decision Brief artifact.

---

## 0. READ FIRST — the blocker

**`App\Services\PlanGate` is a no-op. Every tenant on every plan currently has every feature and no limits.**

```php
public static function check(string $feature, ?int $currentCount = null): bool { return true; }
public static function enforce(string $feature, ?int $currentCount = null): void { /* Unlocked */ }
public static function getLimit(string $feature): mixed { return null; }
```

`app/Http/Middleware/EnsurePlanFeature.php` also resolves the tenant and then calls `$next($request)`
without checking the `$feature` argument it was given.

**Everything else is already built. Do not re-architect.**

| Component | Path | State |
|---|---|---|
| Plan tables | `plans`, `plan_limits`, `plan_features`, `tenant_plan_overrides` | migrated |
| Feature matrix | `database/seeders/PlanFeatureMatrixSeeder.php` | 278 keys, 8 plan slugs |
| Repository | `app/Services/PlanRepository.php` | caching + LTD snapshot + `featuresFor($tenant)` |
| Tenant reader | `App\Models\Tenant::getLimit()` (~line 336) | reads plan_limits, honours overrides |
| Exception | `app/Exceptions/PlanLimitException.php` | exists |
| Downgrade | `app/Services/PlanDowngradeService.php` | exists |
| AI allowance | `app/Services/PlanAiAllowance.php`, `SmartCapture/AiEntitlementService.php` | exists |
| Call sites | 74 × `PlanGate::` across controllers | already placed |
| Inertia share | `HandleInertiaRequests` ~line 191 `'features' => PlanRepository::featuresFor($tenant)` | already shared |

Work required: fill three method bodies, make one middleware enforce, add observers for quantity caps,
build the lock UI, add the free plan, add the device/session layer, update prices.

Second finding: `config/pricing.php` still holds the retired ladder (18/36/63/129) and retired AI tiers
(Spark/Shop/Pro/Max, $5 staff seat). `PlanFeatureMatrixSeeder` reads prices from that config — prices
change **there**, not only on the pricing page.

---

## 1. Canonical plan values

**Nothing may contradict this table** — not the config, not the seeder, not the pricing page, not the copy.

### 1.1 Public plans (platform = website, `is_visible = true`)

| key | **solo (FREE)** | starter | growth | scale | custom |
|---|---|---|---|---|---|
| `price_monthly` | 0.00 | 69.00 | 179.00 | 399.00 | 800.00 (from) |
| `price_annual` | — | 690.00 | 1790.00 | 3990.00 | contract |
| `locations` | 1 | 1 | 3 | 10 | null |
| `staff_limit` (FULL seats) | **1** | **1** | 3 | 10 | null |
| `registers` (POS devices) | **1** | 2 | 6 | 20 | null |
| `devices_per_seat` | 2 | 3 | 3 | 5 | 5 |
| till logins (cashier PIN) | unlimited | unlimited | unlimited | unlimited | unlimited |
| `transactions_per_month` | null | null | null | null | null |
| `sku_limit` | **500** | 10000 | 50000 | 250000 | null |
| `history_retention_days` | **90** | null | null | null | null |
| `ai_credits_monthly` | **30** | 1500 | 4000 | 9000 | negotiated |
| `ai_scans_monthly` (sub-cap) | **10** | — | — | — | — |
| human support | **none** | email 2 days | 1 day + setup call | named, 4 business hours | SLA |

> `scale` replaces the `business` slug in all copy — keep the DB slug or rename in one migration, never both.
> `counter` is retired. `solo` is new.

### 1.2 The eight capability fences → existing feature keys

Everything NOT listed here is enabled on **every** plan including Solo. **Do not gate module count.**

| # | Fence | Feature keys | solo | starter | growth | scale |
|---|---|---|---|---|---|---|
| 1 | Multi-branch + inter-branch transfers | `multi_branch` | 0 | 0 | 1 | 1 |
| 2 | Manufacturing / BOM / production | `production`, `bill_of_materials` | 0 | 0 | 1 | 1 |
| 3 | AI rebuilds the system after onboarding | `ai_system_builder` *(new key)* | 0 | 0 | 1 | 1 |
| 4 | Growth signals / churn / owner's pulse | `growth_engine`, `owners_daily_pulse` | 0 | 0 | 1 | 1 |
| 5 | Loyalty, gift cards, campaigns | `loyalty_points`, `digital_gift_cards`, `marketing_campaigns` | 0 | 0 | 1 | 1 |
| 6 | Recurring invoices, bank rec, e-invoicing, funds | `recurring_invoices`, `bank_reconciliation`, `e_invoicing`, `fund_management`, `invoice_reminders`, `fiscal_year_closing`, `fixed_asset_depreciation` | 0 | 0 | 1 | 1 |
| 7 | API, webhooks, white-label | `api_access`, `white_label` | 0 | 0 | 0 | 1 |
| 8 | Audit trail, custom roles, serial/IMEI | `security_activity_log`, `custom_roles`, `imei_scanner`, `serial_tracking` | 0 | 0 | 0 | 1 |

**Enabled on Solo and Starter** (correct the seeder where it currently disables these):
POS + offline + barcode + receipts + returns · inventory · stock take · in-location transfers ·
parties + customer/supplier ledger · purchases + purchase orders + debit notes · expenses ·
double-entry accounting · **all 43 reports** · sales orders · proposals · invoicing · payments ·
restaurant + table service + cookbook · labels · batch tracking · staff + attendance · notifications ·
`report_profit_loss` · `live_chat_widget` · `bulk_upload` · AI onboarding build · SmartCapture · Vena ·
conversational dashboard.

Free is not a crippled edition. It is the full operational product with **structural** caps —
one person, one register, 500 products, 90 days of visible history, 10 scans. That is what the
category does (Square, Loyverse, Odoo One App Free, Katana 30-SKU free) and it is what converts.

### 1.3 Add-ons

**RULE: an add-on sells more of a capability the plan already has. It never unlocks a fenced capability.**

| Add-on | Price | Purchasable on | Enforcement |
|---|---|---|---|
| Extra location | $35/mo | growth, scale **only** | blocked below growth — CTA is "upgrade to Growth" |
| Extra full seat | $15/mo | starter+ (never solo) | increments `staff_limit` |
| Extra register | $25/mo | starter+ (never solo) | increments `registers`. Lightspeed charges ~$59 for this |
| Channel sync (each) | $19/mo | starter, growth | included on scale |
| AI credit top-up | $9 / 1,000 | starter+ | one-time, repeatable, never auto-billed |
| BYOK unlock | $19 once | starter+ (never solo/trial) | disables AI metering for that tenant |
| Setup & migration | $249 once | all | service, not an entitlement |
| Complex migration | from $599 | quoted | service |

**Solo can buy nothing.** Its only upgrade path is a paid plan. This keeps free simple and keeps the
first paid step meaningful.

---

## 2. Free vs trial — the decision

**Both. They are not competing front doors; the free plan is where an expired trial lands.**

Benchmarks (200 B2B products, Jan 2026, $1–10M ARR) on paying customers per 1,000 visitors:

| Model | Paying customers / 1,000 visitors | Trial→paid |
|---|---|---|
| **Trial + card required** | **10.5** | 25–35% good, 50–60% great |
| Ungated freemium | 5.6 | 7–9% |
| Freemium | 5.0 | 3–5% |
| Trial, no card | 3.6 | 4–6% |
| Reverse trial | — | 4–6%, and *declined* vs 2023; only 7% of products use it |

Corroborating: opt-out (card) trials 48.8% vs opt-in 18.2%; freemium free-to-paid 2.6% organic.

**Therefore:**

- **Primary CTA: "Start 14-day trial — card required, cancel anytime."** Trial entitlements = **Growth**.
- **Secondary, visually subordinate: "Solo — free forever"**, with its three caps printed on the card:
  *1 user · 90-day history · 10 AI scans a month · no human support.*
- **An expiring trial drops to Solo, never to nothing.** This is the whole reason Solo exists — it turns
  every failed trial into a retained account that can convert later, instead of a lost signup.
- A Solo user upgrading is asked for the card at that moment.
- 30-day money-back guarantee on all paid plans.
- Day-11 trial reminder email ("your trial ends in 3 days") — non-negotiable, this is what keeps
  refunds near zero and separates an honest opt-out trial from a dark pattern.

**The anti-cannibalisation fence is the seat, not the history.** Any business with two people must pay.
That boundary is hard, obvious on day one, and every $69-segment business crosses it while a genuine
solo trader never does.

**Activation is the real lever:** activated trials convert 35–65%, unactivated 2–8%, and most decisions
happen within 72 hours. Activation = (a) products imported, (b) one real sale rung, (c) one document
scanned. Instrument all three and report weekly.

### 2.1 History: gate the view, never delete the rows

`history_retention_days = 90` on Solo means **the last 90 days are visible**. Everything older stays in
the database, locked behind an upgrade banner, and restores instantly on upgrade.

Never delete a POS or tax record. Slack's free-plan deletion caused a documented exodus, and a POS
carries records a business is legally required to keep. Loyverse proves the paywalled version monetises:
it sells "Unlimited Sales History" as a $5/store/month add-on.

### 2.2 Free tier abuse controls

- **One free tenant per verified business identity** — OTP-verified mobile + business name at signup.
  This is what stops one shop splitting itself across several free accounts.
- Block disposable-email domains (maintained list); verify the email.
- Caps are **tenant-level**, not user-level, so splitting hits friction regardless.
- **Dormancy: auto-pause after 60 days with no login**, cold-archive the tenant, restore on next login
  or on upgrade. Email before pausing.
- Rate-limit signups per IP and per device token.
- Cost to serve one Solo tenant: 30 credits × $0.005 = **$0.15/month of AI**, plus storage. Negligible —
  Solo is a marketing line item, not an infrastructure risk.

---

## 3. Device & session control — stopping password sharing

The worry splits into two cases with different economics:

- **(a) Six people taking turns at the one back-office PC.** Same device, same IP — undetectable by any
  control, and economically harmless: it is genuinely one seat of work. **Ignore it.**
- **(b) Six people on six devices working in parallel.** This is what costs money, and this is what
  device and session limits actually catch. **Build for this.**

Benchmarks: 10–25% of seats on per-seat SaaS are shared where nothing detects it; a shared seat
typically shows 3–5 distinct device fingerprints.

### 3.1 Build in this order

1. **Named users + individual logins + licence terms.** Non-technical and highest-leverage. The reason
   people share is usually that the alternative costs money — so make the free lane genuinely good:
   **till logins are unlimited and free on every plan.** A cashier who can do their whole job on the PIN
   lane gives nobody a reason to share a full seat. (QuickBooks does exactly this: billable users capped
   at 1/3/5/25, with unlimited free time-tracking-only and reports-only users.)
2. **One active session per full seat, with eviction.** A newer login signs out the older one, showing a
   named banner: *"You were signed out — alex@shop.com signed in on another device."* Cheap, no
   fingerprinting, no privacy exposure, and it makes sharing visibly annoying rather than punished.
3. **Soft device cap per full seat** (`devices_per_seat`, 2–5 by plan). Adobe's model: block the
   additional activation, and offer **self-service deactivation** in the same dialog plus an
   Account → Devices list. **Warn before blocking, never block silently.**
4. **Registered registers for the till lane** (`registers`). A cashier PIN works only on a register
   the store has registered. This is how the whole category licenses POS — Lightspeed ~$59/extra
   register, Square $30–50/device for KDS and kiosk, Toast ~$50/month per handheld — and it is the one
   place per-device genuinely beats per-user, because registers are physical and countable.
5. **Seat-pressure telemetry as a sales signal, not a lock.** Count distinct devices per seat over a
   rolling 14 days. Escalate: owner nudge → in-product prompt → offer to add a seat. Never auto-lock.

### 3.2 Do not build

- **Impossible-travel / IP-based detection.** False-positive-prone even at Microsoft's scale, and
  useless inside one shop where everyone shares an IP.
- **Canvas / GPU / audio / font fingerprinting.** Requires consent under ePrivacy (EDPB Guidelines
  2/2023 put fingerprinting squarely inside Art. 5(3)), and it will not survive an EU customer's DPA.
- **Any location collection.** Spotify's GPS-based family-plan verification was killed after backlash
  within weeks.

### 3.3 Privacy rules for the device layer

- Use a **first-party, HTTP-only, signed device token issued at authentication**. Authentication and
  user-centric security tokens are the "strictly necessary" exemption — no consent banner required.
- Store only: device label (user-editable), token hash, first seen, last seen, IP **country**. Nothing else.
- A device ID tied to a named user is personal data: lawful basis is contract performance, needs an
  Art. 13 notice, a retention limit, and DSAR/erasure support.
- **Show the device list in the customer's own admin UI**, with a "sign out this device" button. This is
  what turns the feature from surveillance into a security feature the customer values.

### 3.4 The rule that overrides all of the above

**No device rule, session rule, seat limit, exhausted meter or failed payment may ever prevent a
cashier ringing a sale.** Register limits apply at *registration* time, never at sale time. A lockout
during trading hours is a refund, a one-star review, and a story other shopkeepers repeat.

---

## 4. PlanGate — implementation contract

Replace the three method bodies. **Do not change any of the 74 call sites.**

```php
public static function check(string $feature, ?int $currentCount = null): bool
{
    $tenant = self::tenant();
    if (!$tenant) return false;                 // fail CLOSED for boolean features
    if (self::isPlatformContext()) return true; // God Admin / platform routes bypass

    $limit = $tenant->getLimit($feature);       // reads plan_limits via PlanRepository

    if ($limit === null)  return true;                                   // unlimited / granted
    if ($limit === false || $limit === '0' || $limit === 0) return false;
    if ($limit === true  || $limit === '1' || $limit === 1) return true;

    if ($currentCount !== null) return $currentCount < (int) $limit;
    return true;
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

Rules:
- **Fail closed.** No tenant, unknown key, or unseeded plan = denied for boolean features.
  An unknown key must also **log a warning** — a typo silently granting access is how the current
  situation arose.
- `PlanLimitException` carries `feature`, `current`, `limit`, and the **upgrade target plan slug**, so
  the UI renders the right CTA without a second lookup.
- Respect `tenant_plan_overrides` — `Tenant::getLimit()` already does. Do not bypass it.
- **Bust the `plan_limits:*` cache on plan change, add-on purchase, trial expiry and LTD redemption**,
  or a customer pays and stays locked.

### 4.1 Middleware

```php
if (!PlanGate::check($feature)) {
    return $request->expectsJson()
        ? response()->json(['message' => 'upgrade_required', 'feature' => $feature], 402)
        : redirect()->route('billing.upgrade', ['store' => $tenant->slug, 'feature' => $feature]);
}
```

Attach to every fenced route group. Routes are the boundary for **pages**; observers are the boundary
for **records**. Both are required.

### 4.2 Model observers — quantity caps

Controllers are not enough: the API, importers, seeders and queue jobs bypass them.

| Model | Check on `creating` |
|---|---|
| `Location` / `Store` | `PlanGate::enforce('locations', Location::count())` |
| `User` (full seat only) | `PlanGate::enforce('staff_limit', User::fullSeats()->count())` |
| `Register` / `Device` | `PlanGate::enforce('registers', Register::count())` |
| `Product` | `PlanGate::enforce('sku_limit', Product::count())` |

Bulk import checks **once for the whole batch** (existing count + incoming rows) and fails before
writing anything, naming how many rows exceed the cap.

---

## 5. The five lock states (UI contract)

`PlanRepository::featuresFor($tenant)` is already shared into Inertia. Add a `useEntitlement()` hook.
**Frontend is presentation only; it never decides access.**

| State | When | UI |
|---|---|---|
| **1 Open** | plan includes it | normal. **Never** badge an included feature with a plan name |
| **2 Preview-locked** | fenced capability | menu item stays visible; page renders real structure with clearly-labelled sample data; one button: "Included in Growth — $110 more a month" |
| **3 Limit-blocked** | has capability, hit quantity | creation blocked, existing data untouched, message names the exact number and both exits: "You have 3 of 3 locations. Add one for $35/mo, or move to Scale for 10." |
| **4 Metered-stopped** | AI credits exhausted | AI stops, nothing else does. Two exits: top up, or attach your own key. **Never** auto-bill. Warn in-app + email at 80% |
| **5 Archived read-only** | after downgrade, or Solo history older than 90 days | data never deleted; read-only behind a banner stating exactly what is archived and what reopens it. Block downgrade while receivables/payables are open. 30-day grace |

Sample data on preview-locked screens must be visibly marked as an example and must never be mistaken
for the tenant's own figures.

### 5.1 The AI builder sells the fence

When onboarding (or the conversational dashboard) concludes the business needs a fenced capability, it
**builds everything it can, then renders the fenced parts as preview cards**:

> "Your business does production — here is the Manufacturing module we would add. It is part of Growth."

Never silently omit a recommended module. Never show a bare paywall. This is the highest-converting
upgrade moment in the product.

---

## 6. AI credits

One unit, one meter. Internal cost ceiling **$0.005 per credit** (survives the October model migration).

| Action | Credits |
|---|---|
| Scan printed page | 1 |
| Scan handwritten page | 2 |
| Vena question | 1 |
| Product description | 2 |
| AI changes the system (`ai_system_builder`) | 10 |
| Growth signal run | 20 |

Allowances: **solo 30/mo (max 10 scans)** · starter 1,500 · growth 4,000 · scale 9,000.
Worst-case cost $0.15 / $7.50 / $20 / $45 — 10–11% of price on paid plans.
LTD tiers: 12,000 / 30,000 / 60,000 **refreshed annually**.

Rules — do not soften: hard stop at cap · never auto-bill an overage · warn at 80% in-app **and** by
email with both exits · no rollover · top-ups never expire · BYOK ($19 once, paid plans only) disables
metering entirely · **the word "unlimited" never appears near AI**, in product or marketing.

---

## 7. LTD plans (marketplace only) — RE-CHECKED, decision unchanged

**`is_visible = false`, `platform_id = appsumo`. No lifetime pricing on any public page, ever.**

| key | ltd_1 | ltd_2 | ltd_3 |
|---|---|---|---|
| one-time price | $149 | $299 | $449 |
| `locations` | 1 | 2 | 3 |
| `staff_limit` | 1 | 2 | 3 |
| `registers` | 2 | 4 | 6 |
| **`transactions_per_month`** | **null (unlimited)** | **null** | **null** |
| `sku_limit` | 5000 | 25000 | 50000 |
| `ai_credits_annual` | 12000 | 30000 | 60000 |
| fences 1–6 | off | **on** | **on** |
| fences 7–8 (API, white-label, audit) | off | off | off |
| channel sync | 0 | 0 | 1 included |
| support | help centre + Vena | email 3 days | email 2 days |

### 7.1 Transaction caps — remove them. Set all three to `null`.

`config/plans.php` currently sets `ltd_1.transactions_per_month = 1000` (header documents 500/2000/6000).
Re-checked against the evidence, the answer is the same:

1. **A sales cap on a POS stops the shop at the counter.** Hard usage stops are explicitly
   counter-indicated for tools where hitting the cap interrupts trading. A capped invoice waits an
   hour; a capped sale is a customer walking out.
2. **It detonates after the refund window.** A seat or location cap is visible on day one. A monthly
   volume cap is discovered in month 2–3, *after* AppSumo's 60-day refund window closes — so the buyer
   cannot refund and the only outlet left is a public review on a deal that is still selling.
3. **Under AppSumo's listing policy limits may be raised at any time but never lowered.** A cap set too
   tight is permanent for every buyer who already redeemed. Set caps conservatively; raising them later
   is free goodwill.

**Cap the stock, not the flow.** Limit what holds value and is visible on day one — locations, seats,
registers, products, AI credits, storage. Leave sales, invoices and receipts unlimited. Best-reviewed
precedent: Encharge caps subscribers 5,000–20,000 with unlimited emails, at 4.71★ across 348 reviews.

Cannibalisation is prevented by four stronger things: channel separation (LTD never on the website),
a genuinely smaller LTD edition, a different buyer population (45–50% of LTD buyers are still active at
90 days vs 78–82% of subscribers), and closing the deal window — keeping LTD under ~10% of the user base.

**If a volume fence is still wanted:** soft only. Alert at 75% and 90%. At 100% **the till keeps
working**; what pauses is bulk export, API, analytics refresh and AI. Ceiling at ~the 95th percentile of
real usage. Never a hard stop.

### 7.2 Hosting fee — remove it

`config/plans.php` documents "hosting included 2 years, then $9/month to stay hosted". Infrastructure is
≈$0.60/tenant/month, so even ltd_1 covers ~5 years. The real costs are AI and support, already handled
by the annual credit refresh and tiered support. If it is kept it **must be in the launch deal terms** —
adding it afterwards is a limit reduction, which the listing policy forbids.

### 7.3 Redemption

Stacking 1/2/3 codes → ltd_1/ltd_2/ltd_3 (existing `AppSumoController::redeem` + `PlanRepository`
snapshot). Test all three, plus re-redemption, plus downgrade, plus cache busting. Licence redemption is
the largest single source of LTD launch-week tickets.

---

## 8. Lemon Squeezy catalogue

Single cart per checkout so the $0.50 fixed fee is charged once (existing task P0-6).

**Subscriptions (monthly + annual):** Starter $69/$690 · Growth $179/$1,790 · Scale $399/$3,990
**Quantity add-ons:** extra location $35/mo · extra full seat $15/mo · extra register $25/mo · channel sync $19/mo
**One-time:** BYOK unlock $19 · AI credits 1,000 for $9 · setup & migration $249
**No product for Solo** — it is free and buys nothing.

**Retire/hide:** every 18/36/63/129 variant · AI Spark/Shop/Pro/Max · $10 location · $5 seat ·
any 19/39/79 legacy variant · anything containing "lifetime" on the website store.

---

## 9. Public site copy

**Approved comparison line** (the footnote must actually render):

> **"AI-native ERP starts around $20,000 a year. VenQore starts at $690 — or free."**
> *Published third-party estimates put mid-market AI-native ERP platforms in the $20,000–$35,000 per
> year range. VenQore serves small and independent businesses; the comparison is to the price of
> AI-native ERP, not to an identical feature set.*

**Must not publish:** any percentage saving claim · named competitor prices without a link to their
published page · a struck-through price never charged (illegal under UK CMA and EU Omnibus) ·
"unlimited" near AI · any PKR price · any lifetime/LTD pricing.

**Pakistan:** no "Pakistan? get a custom price" section. One footer link, `noindex`, labelled
"Regional pricing enquiry" → short form (business name, city, WhatsApp number, **no prices**).
Verify with OTP to a +92 number, require a Pakistani payment method at redemption.
**Do not collect CNIC images.** The discount lives in `tenant_plan_overrides`, never on a page.

---

## 10. Migration & grandfathering

1. Grandfather the 3 existing tenants for 12 months via `tenant_plan_overrides`, and email them
   **before** any new price is visible anywhere.
2. Update `config/pricing.php`, add the `solo` plan, then re-run `PlanFeatureMatrixSeeder`.
3. Correct the pricing page **from the code**, not the other way round.
4. Bust `plan_limits:*` cache on deploy.
5. Founding cohort: first 25 paying customers, 40% off for 12 months, **annual only**, locked, real
   closing date. Implement as coupon + override, not a separate plan.
6. Scheduled increase: revisit at 100 paying customers or 20 public reviews. Grandfather 12 months.

---

## 11. Tests (required before launch)

- 8 fences × 5 plan slugs (solo, starter, growth, scale, trial) — allow/deny each.
- Quantity caps — locations, full seats, registers, SKUs — via controller, via API, via bulk import.
- **Till never blocked**: every plan, and every billing state (`trial`, `active`, `past_due`,
  `expired`, `cancelled`), and with the device cap exceeded.
- Session eviction: second login evicts the first, banner names the evicting user.
- Device cap: third device blocked with self-service deactivation offered, never silently.
- Solo history: rows older than 90 days are hidden, **not deleted**, and reappear on upgrade.
- Trial expiry: tenant drops to `solo` with data intact, never to a locked or deleted state.
- AI meter: hard stop at cap, no auto-bill, 80% warning fires once; Solo scan sub-cap at 10.
- Downgrade: data preserved, read-only, blocked while receivables/payables open, 30-day grace.
- LTD: redeem 1/2/3 codes, re-redeem, cache busted, limits snapshotted, transactions unlimited.
- Add-on rule: extra location rejected on starter, accepted on growth; nothing purchasable on solo.
- Unknown feature key: denied **and** logged.

---

## 12. Acceptance checklist

- [ ] `PlanGate` enforces; a solo tenant is denied all 8 fences in UI, API and jobs
- [ ] `EnsurePlanFeature` returns 402/redirect for fenced routes
- [ ] Observers block over-cap creation from every path including import
- [ ] All five lock states render with correct copy and working CTAs
- [ ] AI builder shows preview cards for fenced recommendations, never a bare paywall
- [ ] Till works in every plan, billing state and device state
- [ ] Solo plan seeded; trial expiry lands on Solo; history gated not deleted
- [ ] Session eviction + device list + self-service sign-out shipped; no fingerprinting, no GPS
- [ ] `config/pricing.php` + seeder + pricing page agree on every number in §1
- [ ] No PKR, no lifetime pricing, no unsupported claim on any public page
- [ ] LTD `transactions_per_month` = null on all three tiers; LTD invisible on website platform
- [ ] Card captured at signup for the trial; day-11 email sends; activation instrumented
- [ ] Full test suite in §11 green

---

# ADDENDUM — V7.1 post-implementation audit (2026-09-08)

The implementation is largely correct. `PlanGate` is genuinely implemented and fail-closed,
`EnsurePlanFeature` enforces, prices and LTD tiers match §1 and §7, Solo is seeded correctly,
`UserDevice` / `DeviceSessionService` exist, `Sale::visibleHistory` hides rather than deletes, and the
approved landing line is live in both `Pricing.jsx` and `public/v6/pricing.html`.

**Four defects remain. They were reported as done and are not.**

## A1 — CRITICAL: the till invariant (§3.4 / §5) is asserted but not implemented

Two live plan gates sit on the sale write path:

- `app/Http/Controllers/SaleController.php:52` — `PlanGate::enforce('transactions_per_month', $monthlyCount)`
- `app/Http/Controllers/V3/SaleController.php:34` — the same call
- `app/Http/Middleware/EnforceTransactionLimit::class` — registered on `POST /sales` and `POST /sales/park`
  in `routes/web.php:1747` and `:1760`

These pass today **only because the seeded value happens to be null**. But
`PlanRepository::getEffectiveLimit()` deliberately **fails closed and returns `false`** for any key not
present in `plan_limits` (step 4 of that method). Any of these makes the till refuse a sale mid-trade:

- a new plan slug added later without that key seeded
- a partial or interrupted re-seed
- a plan-limit cache warmed before the seeder ran
- an operator setting the key by hand in SuperAdmin

`false` → `PlanGate::check()` returns false → `enforce()` throws `PlanLimitException` → **the sale fails
at the counter.** The invariant in §3.4 is not "the limit is null", it is "the sale path never asks".

**Fix:**
1. Delete the `PlanGate::enforce('transactions_per_month', ...)` call from both `SaleController::store()`
   and `V3\SaleController`.
2. Remove `EnforceTransactionLimit` from the `/sales` and `/sales/park` routes, or strip its blocking
   branch and keep only the counter-sync that feeds the usage meter.
3. Add a guard test that fails if `PlanGate::` ever reappears anywhere in the sale write path.

## A2 — the till invariant is untested

The suite asserts `getLimit('transactions_per_month')` is null. That tests the seeded data, not the
behaviour, so it cannot catch A1. Required tests, per §11:

- POST a sale successfully for each billing status: `trial`, `active`, `past_due`, `expired`, `cancelled`.
- POST a sale successfully with `devices_per_seat` exceeded.
- POST a sale successfully with the `transactions_per_month` row **deleted** from `plan_limits`
  (this is the test that fails today).
- Cashier PIN login succeeds in all of the above.

## A3 — two fail-open holes in `EnsurePlanFeature`

```php
if (!$tenant) { return $next($request); }                       // fails OPEN
if ($tenant && ($tenant->slug === 'test-store')) $tenant = null; // then also fails open
```

Spec §4 says fail closed. Any fenced route reached without a resolvable tenant is currently ungated,
and any tenant whose slug is literally `test-store` bypasses every fence. Fix: deny (402 / redirect)
when no tenant resolves on a fenced route, and move the `test-store` exemption behind
`app()->environment('testing')`.

## A4 — plan named "Custom / Enterprise"

`config/pricing.php:90`. The top tier is never to be called Enterprise. Rename to `Custom`.

## Verification note

The above was established by reading the code. The reported test run (52, then 64 passing) and the
`npm run build` result were **not independently reproduced** — the PHP binary is outside the shared
folder. Those numbers are unverified here; A1 and A2 explain why a green suite does not settle the
question.

---

# ADDENDUM — V7.2 capability packs (2026-09-08)

**This revises §1.2 and §1.3. The eight fences were wrong in a specific way and are replaced by
five fences plus four capability packs.**

## The error being corrected

The V7 fence list conflated two different kinds of capability:

- **Scale capabilities** — only usable once the business is structurally bigger. Multi-branch is
  meaningless with one location; an API needs someone to call it; an audit trail needs staff layers.
  Tier-gating these costs nothing, because a small business cannot use them anyway.
- **Vertical capabilities** — needed by *tiny* businesses in specific trades. A one-person café needs
  recipes/BOM. A phone repair shop needs IMEI tracking. A pharmacy needs batch and expiry. A salon
  needs loyalty.

**Vertical need does not correlate with business size.** Putting serial/IMEI on a $399 plan priced out
the one-person repair shop that needs it most, and putting BOM on $179 priced out the café. Those
customers do not upgrade — they leave, and we book $0 instead of $88.

The published rule of thumb for this decision is adoption-based: 80%+ adoption → base tier;
50–79% → mid tier; **30–49% → add-on**; 10–29% → top tier; under 10% → skip. Every vertical
capability above sits in the 10–40% band, which is add-on territory, not tier territory.

## Revised rule for add-ons (replaces the V7 rule)

> **An add-on may unlock a capability, but never one whose value is defined by a tier's scale meter.**

So: multi-branch can never be an add-on (multi-branch *is* the locations meter). Production can be an
add-on (recipes have nothing to do with how many locations you have). This still forbids the incoherent
case the original rule was written for — buying an extra location on a plan without multi-branch.

## Revised §1.2 — five fences

| # | Fence | Feature keys | solo | starter | growth | scale |
|---|---|---|---|---|---|---|
| 1 | Multi-branch + inter-branch transfers | `multi_branch` | 0 | 0 | 1 | 1 |
| 2 | AI rebuilds the system after onboarding | `ai_system_builder` | 0 | 0 | 1 | 1 |
| 3 | API, webhooks, white-label | `api_access`, `white_label` | 0 | 0 | 0 | 1 |
| 4 | Audit trail + custom granular roles | `security_activity_log`, `custom_roles` | 0 | 0 | 0 | 1 |
| 5 | Consolidated multi-entity reporting | `consolidated_reporting` | 0 | 0 | 0 | 1 |

**Moved to "included on every paid plan"** (Starter and above; still off on Solo):
`growth_engine`, `owners_daily_pulse`, `recurring_invoices`, `invoice_reminders`,
`bank_reconciliation`, `e_invoicing`, `fund_management`, `fiscal_year_closing`,
`fixed_asset_depreciation`. Growth signals are metered by AI credits, so including them costs nothing
extra and they are a retention feature, not a scale feature.

## Revised §1.3 — four capability packs

Available on **Starter** à la carte. **Included in full on Growth and above.** Not purchasable on Solo —
Solo's only upgrade path stays the Starter plan.

| Pack | Price | Feature keys | Who buys it |
|---|---|---|---|
| **Production** | $19/mo | `production`, `bill_of_materials`, `work_orders` | cafés, bakeries, kitchens, small manufacturers |
| **Traceability** | $15/mo | `serial_tracking`, `imei_scanner`, `batch_tracking`, `expiry_tracking` | phone/electronics repair, pharmacy, food |
| **Customer marketing** | $19/mo | `loyalty_points`, `digital_gift_cards`, `marketing_campaigns` | salons, cafés, retail with repeat trade |
| **Channel sync** | $19/mo each | `woocommerce`, `amazon_sync`, `ebay_sync`, `tiktok_sync` | anyone selling online |

Four packs sits inside the healthy 4–6 range (choice paralysis begins above 8). Prices are 22–28% of
the $69 base, inside the 20–50% guidance.

### Upgrade math — the packs create the ladder rather than blocking it

| What the business needs | On Starter | Growth |
|---|---|---|
| 1 pack (café with recipes) | $88 | — stays on Starter |
| 2 packs | $103 | — stays on Starter |
| 3 packs | $122 | **$179 and also gets multi-branch, AI rebuild, 3 locations, 3 seats, 4,000 credits** |

At three packs Growth is obviously the better buy, so the packs sell the upgrade instead of gating it.
No pack is priced such that it delivers what the next tier includes for less — the cannibalisation trap.

## Why NOT a module quota ("pick any N of 46")

Considered and rejected:

- It is Odoo's per-app pricing with extra steps. Odoo ran that model and **killed it in 2022**, citing
  lost customers in the 1–5 user segment and a structure that "was not the easiest to understand".
- It fights the positioning directly: the AI proposes the system a business needs, then has to take
  modules away to fit a quota. That is the worst possible moment to introduce rationing.
- "What counts as a module" becomes a permanent support argument — is Reports one module or 43?
- Every configuration change becomes a re-budgeting decision for the customer.

Packs deliver the same outcome — pay for what your trade actually needs — with none of the rationing.

## Implementation deltas

1. Seed the five fences as above; move the nine listed keys to `1` for starter/growth/business.
2. Add `pack_production`, `pack_traceability`, `pack_marketing` as purchasable subscription add-ons;
   granting a pack sets its member feature keys for that tenant via `tenant_plan_overrides`.
3. Growth and Scale seed all pack member keys to `1` directly — no add-on purchase required.
4. Solo: all pack keys `0`, packs not purchasable. Enforce in the add-on purchase controller.
5. Pricing page: packs render under Starter as "Add what your business does", and under Growth as
   "All packs included".
6. The AI builder's preview cards (§5.1) now say **"Add Production — $19/mo"** for a pack, and
   **"Included in Growth"** only for the five real fences.
7. Lemon Squeezy: three new monthly subscription products at $19 / $15 / $19.
8. Tests: a Starter tenant with `pack_production` passes `PlanGate::check('bill_of_materials')` and
   still fails `multi_branch`; a Solo tenant cannot purchase any pack.
