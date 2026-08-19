# VENQORE V2 — THE MODULAR MASTER PLAN
## Usage-Based Billing · 45 Modules · The Rulebook · Full Build Order
**14 August 2026 — supersedes the billing and capability sections of all previous documents**

---

# PART 0 — WHERE I WAS WRONG

You pushed back on two things. **On the bigger one, you were right and I was wrong. I want to show you the evidence rather than just concede.**

## 0.1 Billing — I was wrong, and your own config file proves it

I told you to keep plan-gated features because "AppSumo needs tiers" and "reopening billing is a week of risk."

**Then I read `config/plans.php` lines 139–195. Here is what is actually in your product today:**

```php
'ltd_1' => [
    'transactions_per_month' => 1000,
    'staff_limit'  => 3,
    'production'         => false,   // ← cookbook OFF
    'bill_of_materials'  => false,   // ← recipes OFF
    ...
],
'ltd_2' => [
    'transactions_per_month' => 3000,
    'staff_limit'  => 10,
    'production'         => true,    // ← cookbook ON
    'bill_of_materials'  => true,    // ← recipes ON
    ...
],
```

**Your cafe example isn't hypothetical. It's encoded in your pricing right now.**

A solo cafe owner — one person, maybe 250 transactions a month — who wants the cookbook to track what goes into a sandwich **must buy `ltd_2`**. They are paying triple for one boolean. They consume `1000/3000` of the transaction allowance and `1/10` of the staff allowance they just paid for.

**That customer does not buy. They leave.** And you would never see them in your analytics, because people who bounce off a pricing page don't file complaints.

**I argued from generic SaaS wisdom. You argued from a real customer you could name. You were right.**

## 0.2 My three objections, honestly re-examined

**Objection 1 — "AppSumo requires feature tiers."** ❌ **False.** AppSumo requires *tiers*. Limits are tiers. `1000 / 3000 / 8000 transactions` and `3 / 10 / 25 staff` is not just compatible with code stacking — **it is the single most common AppSumo LTD structure that exists.** Codes stack into higher limits instead of more features. Nothing about stacking changes.

**Objection 2 — "132 route gates would need rebuilding."** ❌ **Backwards.** You are *deleting* ~20 boolean flags per plan, not adding anything. Most `feature:` gates simply stop being applied. **Removing a gate is safer than maintaining one.**

**Objection 3 — "the usage infrastructure doesn't exist."** ❌ **It already exists and works.**

| Component | Status | Evidence |
|---|---|---|
| `EnforceTransactionLimit` middleware | ✅ **Built and working** | Counts live posted sales per calendar month, syncs the denormalised counter |
| `transactions_per_month` per plan | ✅ **Already in every plan** | `config/plans.php` |
| `staff_limit`, `locations`, `sku_limit` | ✅ **Already in every plan** | same |
| `PlanRepository::getEffectiveLimit()` | ✅ **Built, cached, override-aware** | `PlanRepository.php:96` |
| `PlanUsageController` (usage meter) | ✅ **Built** | `app/Http/Controllers/Api/` |
| `PlanGate::enforce()` in `SaleController::store()` | ✅ **Built** | second enforcement path, already agrees |

**You have already built the entire usage-based billing engine.** It's been running the whole time, alongside a feature-gating system you no longer need. **The move to usage-based pricing is a deletion, not a construction.**

That is the finding of the day, and it reverses my recommendation completely.

## 0.3 Where I still hold — but it's smaller than it sounded

On "everything is there, just hidden," there is one genuine technical constraint, and one bad word I used.

**The bad word was "hidden."** It made it sound like customers are carrying weight they didn't ask for. Let me replace it with a distinction that I think you'll find is what you actually meant all along:

> **A MODULE is something a user chooses, sees, and gets value from.**
> **An ENGINE is machinery that makes a module's numbers correct.**
>
> **Users choose modules. Engines come along automatically, invisibly, and free.**

**Your freelancer, worked through properly:**

They pick: Services · Invoicing · Quotations · Expenses · Refunds. Five modules.

They see: five nav items. No Accounting menu. No chart of accounts. No trial balance. No journal entries. No inventory. No products. No POS. **Nothing they didn't ask for.**

What runs underneath when they send a 50,000 PKR invoice: two ledger rows (`DR Receivable / CR Service Revenue`), two more when it's paid. **Four rows per invoice.** At 30 invoices a month that's 120 rows — roughly 12 KB a year. Your database bloat worry is real in principle and negligible here.

**And those four rows are what produce the number the freelancer actually wants:** "how much did I earn this month, and who still owes me?" Without the ledger, you'd have to write a second, parallel, less-correct calculator just for service businesses — and then you'd have two sources of truth for money. That's the road to wrong numbers.

**So: the Accounting MODULE is optional — you're right, and it's in the module list below as optional. The ledger ENGINE is not a module at all.** The freelancer never chooses it, never sees it, never pays for it, and never knows it exists. Under your model they are not "given the whole double-entry accounting system." They're given invoicing that adds up correctly.

**I think that's what you wanted. If it isn't, tell me — but this one I'd defend.**

## 0.4 And on module count — you win this one too

I said 25–35. You said 40–45. **You're right, and the reason is your billing model.**

My 25–35 came from a fear of a checkbox wall causing decision paralysis. **But paralysis comes from choices that cost money.** When every module is free and the AI picks them for you, more modules is strictly better — it means more businesses fit.

**45 modules. Your number.**

---

# PART 1 — THE NEW MODEL IN ONE PAGE

```
┌──────────────────────────────────────────────────────────────┐
│  WHAT YOU PAY FOR          →  SCALE                          │
│                               • users                        │
│                               • transactions / month         │
│                               • locations                    │
│                               • products (SKUs)              │
├──────────────────────────────────────────────────────────────┤
│  WHAT YOU PAY FOR           →  NOTHING. ALL 45 ARE FREE.     │
│  (modules)                     Use 3 or use 45.              │
├──────────────────────────────────────────────────────────────┤
│  WHAT THE AI DOES           →  Picks which of the 45 modules │
│                                your business needs, and tells│
│                                you what each one requires    │
├──────────────────────────────────────────────────────────────┤
│  WHAT THE RULEBOOK DOES     →  "Invoicing needs Products OR  │
│                                Services." Enforced, not      │
│                                suggested.                    │
├──────────────────────────────────────────────────────────────┤
│  WHAT THE ENGINE DOES       →  Makes every number correct,   │
│                                invisibly, for everyone       │
└──────────────────────────────────────────────────────────────┘
```

**The sentence that sells it:**

> **"Every module. Every plan. You only pay as you grow."**

That is a genuinely aggressive position against every ERP competitor on AppSumo, all of whom gate features by tier. And it's true, which is the part that matters.

---

# PART 2 — THE 45 MODULES

**Derived from your 52 categories, your 142 verified-built features, and the 662 routes in the repo.** Your `venqore_built.md` headings already carry dependency notes (*"Products required"*, *"Services or Products required"*) — **you were already writing the Rulebook without calling it that.** This formalises it.

## 2.1 The four foundation engines (NOT modules — never shown, never chosen, never charged)

| Engine | What it does | Why it can't be a module |
|---|---|---|
| **Ledger** | `AccountingService` — records every money movement | `SaleService` constructor dependency, line 295. Without it no report can be trusted |
| **Stock ledger** | `FifoService` — costing and quantity | Constructor dependency, line 150. Bypassed for `type='service'` products |
| **Parties** | `PartyService` — the customer/supplier record | Every transaction needs a counterparty |
| **Tax / UOM / Sequences** | `TaxService`, `UomService`, `SequenceService` | Constructor dependencies; invoice numbering |

> **These four never appear in a menu, a pricing page, an AI response, or a checkbox. A user cannot switch them on or off because a user never learns they exist.**

**Note the important nuance:** *Parties* the engine is always on. *Customers* and *Suppliers* the **modules** — the directory screens, khata, statements, credit limits — are both optional and both in the list below.

## 2.2 The 45 modules

### GROUP A — FOUNDATION CHOICES (what am I selling?)
*Almost every business picks at least one of the first two. The Rulebook is built on them.*

| # | Module | Requires | Unlocks |
|---|---|---|---|
| 1 | **Products** | — | POS, Inventory, Cookbook, Purchases, Barcodes, Variants |
| 2 | **Services** ⭐NEW | — | Invoicing, Quotations, Jobs |
| 3 | **Customers** | — | Khata, Loyalty, Statements, Recurring |
| 4 | **Suppliers** | — | Purchases, POs, Purchase Returns |

⭐ **Services is the one genuinely new module you need to build**, and it's the highest-value one — it opens freelancers, agencies, salons, repair shops and consultants. The `products.type='service'` enum landed 12 Aug; the module is the UI on top.

### GROUP B — SELLING
| # | Module | Requires | Notes |
|---|---|---|---|
| 5 | **POS / Counter** | Products | Your cafe owner's core need |
| 6 | **Invoicing** | Products **OR** Services | Your freelancer's core need |
| 7 | **Quotations** | Products **OR** Services | |
| 8 | **Sales Orders** | Products **OR** Services | |
| 9 | **Sales Returns / Refunds** | Products **OR** Services | |
| 10 | **Recurring Invoices** | Invoicing + Customers | |
| 11 | **B2B Proposals** | Quotations | |
| 12 | **Pricing Tiers & Discounts** | Products **OR** Services | Wholesale vs retail |
| 13 | **Park & Recall / Held Bills** | POS | Also = restaurant tables, job queue |
| 14 | **Pre-Sales Reservation** | Products + Inventory | |

### GROUP C — STOCK
| # | Module | Requires |
|---|---|---|
| 15 | **Inventory** | Products |
| 16 | **Multi-Location / Warehouses** | Inventory |
| 17 | **Stock Transfers** | Inventory + Multi-Location |
| 18 | **Stock Takes** | Inventory |
| 19 | **Batches & Expiry** | Inventory |
| 20 | **Serials / IMEI** | Inventory |
| 21 | **Product Variants** | Products |
| 22 | **Barcodes & Labels** | Products |
| 23 | **Units of Measure** | Products |

**Note #15 — this is your exact POS-without-inventory case.** POS requires Products, **not** Inventory. A cafe selling coffee with unlimited availability picks POS + Products and never sees a stock screen. **Your example works. It's a two-module system.**

### GROUP D — BUYING
| # | Module | Requires |
|---|---|---|
| 24 | **Purchases** | Products |
| 25 | **Purchase Orders** | Purchases + Suppliers |
| 26 | **Purchase Returns / Debit Notes** | Purchases |
| 27 | **Landed Cost Allocation** | Purchases |

### GROUP E — MAKING
| # | Module | Requires |
|---|---|---|
| 28 | **Cookbook / Recipes (BOM)** | Products + Inventory |
| 29 | **Production Runs** | Cookbook |
| 30 | **Composite / Auto-Deducting Items** | Cookbook |

**Note — your cafe owner:** POS + Products + Inventory + Cookbook + Expenses = **5 modules**. Under the new billing that's the entry tier at 1,000 transactions and 1 user. **That customer now buys.** Under today's pricing they'd need `ltd_2`.

### GROUP F — MONEY IN / OUT
| # | Module | Requires |
|---|---|---|
| 31 | **Khata / Credit** | Customers **OR** Suppliers |
| 32 | **Payments In & Out** | Customers **OR** Suppliers |
| 33 | **Expenses** | — |
| 34 | **Cash Register / Daily Audit** | POS |
| 35 | **Bank Accounts** | — |
| 36 | **Bank Reconciliation** | Bank Accounts |
| 37 | **Accounting Module** *(chart of accounts, journals, trial balance UI)* | — |
| 38 | **Tax & Compliance** | — |
| 39 | **Fixed Assets & Depreciation** | Accounting Module |
| 40 | **Loans** | Accounting Module |

**Module 37 is the concession that matters.** The *Accounting module* — the screens, the chart of accounts, the trial balance — is optional and off by default for service businesses. The ledger engine underneath is not a module. **Your freelancer never sees any of this.**

### GROUP G — GROWTH & OPS
| # | Module | Requires |
|---|---|---|
| 41 | **Reports** *(scales with active modules)* | — |
| 42 | **AI Business Insights** | Reports |
| 43 | **Loyalty & Gift Cards** | Customers |
| 44 | **WooCommerce / Marketplace Sync** | Products + Inventory |
| 45 | **Staff & Attendance** | — |

**Module 41 is worth understanding.** Reports is one module, not 42. Which reports appear is derived automatically from active modules — no Inventory means no stock reports, exactly as you described in `06`. **This is your Customer-Report rule, generalised.** One toggle, correct behaviour, zero configuration.

## 2.3 Coverage check

| Business | Modules | Count |
|---|---|---|
| **Solo cafe** (your example) | Products, POS, Inventory, Cookbook, Expenses | **5** |
| **Freelancer** (your example) | Services, Invoicing, Quotations, Refunds, Expenses | **5** |
| **Simplest POS** | Products, POS | **2** |
| Grocery | Products, POS, Inventory, Purchases, Suppliers, Customers, Khata, Expenses, Barcodes, Reports | 10 |
| Salon | Services, Customers, Invoicing, Staff, Expenses | 5 |
| Wholesaler | Products, Inventory, Quotations, Sales Orders, Purchases, Suppliers, POs, Khata, Multi-Location, Pricing Tiers, Reports, Accounting | 12 |
| Full ERP | all 45 | 45 |

**Both of your named customers land on five modules. Neither is forced into anything. That was the test, and the model passes it.**

---

# PART 3 — THE RULEBOOK

## 3.1 Four relationship types — the distinction that makes this work

| Type | Meaning | System behaviour |
|---|---|---|
| **REQUIRES** | Cannot function without it | Auto-added, explained |
| **REQUIRES ONE OF** | Needs A or B, user picks | **Ask the user which** |
| **ENHANCES** | Better together, works alone | Suggested, never forced |
| **ENGINE** | Foundation | Never mentioned |

**"REQUIRES ONE OF" is the one nobody builds and the one your product needs**, because it's the whole Products-vs-Services split. Invoicing requires Products *or* Services. Khata requires Customers *or* Suppliers. Without this relationship type you'd have to force every invoicing user to have Products — which is precisely the freelancer problem you raised.

## 3.2 The dependency map

```
ENGINES (always, invisible): Ledger · Stock Ledger · Parties · Tax/UOM/Sequences

Products ──┬─► POS ──► Cash Register
           │       └─► Park & Recall
           ├─► Inventory ──┬─► Multi-Location ──► Stock Transfers
           │               ├─► Stock Takes
           │               ├─► Batches & Expiry
           │               ├─► Serials / IMEI
           │               ├─► Cookbook ──┬─► Production Runs
           │               │              └─► Composite Items
           │               ├─► Pre-Sales Reservation
           │               └─► WooCommerce Sync
           ├─► Variants · Barcodes · Units of Measure
           └─► Purchases ──┬─► Purchase Orders  (+ Suppliers)
                           ├─► Purchase Returns
                           └─► Landed Cost

Services ──► (Invoicing · Quotations · Jobs)

[Products OR Services] ──┬─► Invoicing ──► Recurring Invoices (+ Customers)
                         ├─► Quotations ──► B2B Proposals
                         ├─► Sales Orders
                         ├─► Sales Returns
                         └─► Pricing Tiers

Customers ──┬─► Khata / Credit ──► Payments
            ├─► Loyalty & Gift Cards
            └─► Recurring Invoices (+ Invoicing)

Suppliers ──┬─► Purchase Orders (+ Purchases)
            └─► Khata (supplier side)

Accounting Module ──┬─► Fixed Assets
                    └─► Loans
Bank Accounts ──► Bank Reconciliation
Reports ──► AI Business Insights

Standalone: Expenses · Staff & Attendance · Tax & Compliance · Reports

Max depth: 4 (Stock Transfers → Multi-Location → Inventory → Products)
No cycles.
```

## 3.3 What the user actually experiences

**They ask for something with a missing dependency:**

> *"I want to send invoices."*
>
> **"To send invoices, VenQore needs to know what you're selling. Which is it?"**
> `[ Products — physical things ]` `[ Services — work you do ]` `[ Both ]`

**They ask for something you don't have:**

> *"I want to monitor what my employees are working on."*
>
> **"VenQore doesn't do employee monitoring yet — it's coming. For now I can give you Staff & Attendance to track who's working and when. Want me to note your request?"**

**That second message is your `unsupported` demand log**, and it's how Protocol VII gets its roadmap and its first customers — from people who already pay you.

**They try to remove something load-bearing:**

> *"Remove Products."*
>
> **"POS and Cookbook need Products. I can remove all three, or keep Products just for POS. Which?"**

**Never a silent failure. Never a dead end. Always a next step.**

---

# PART 4 — THE BILLING MODEL

## 4.1 The four meters (all four already exist and are already enforced)

| Meter | Field | Enforcement | Status |
|---|---|---|---|
| Transactions / month | `transactions_per_month` | `EnforceTransactionLimit` + `PlanGate::enforce()` | ✅ **built** |
| Staff users | `staff_limit` | `PlanRepository::getEffectiveLimit()` | ✅ **built** |
| Locations | `locations` | same | ✅ **built** |
| Products (SKUs) | `sku_limit` | same | ✅ **built** |

**Nothing to build. Only booleans to delete.**

## 4.2 Proposed tiers

| | Solo | Growing | Business | Scale |
|---|---|---|---|---|
| Transactions / mo | 1,000 | 5,000 | 20,000 | Unlimited |
| Staff users | 1 | 5 | 20 | Unlimited |
| Locations | 1 | 3 | 10 | Unlimited |
| Products | 500 | 5,000 | 50,000 | Unlimited |
| **Modules** | **All 45** | **All 45** | **All 45** | **All 45** |
| AI builds | 3 | 10 | 25 | 50 |

**AppSumo LTD:** `1 code → Solo · 2 → Growing · 3 → Business`. **Stacking logic is completely unchanged** — it already maps codes to plan slugs; only what those slugs mean changes.

## 4.3 What stays paid — the four honest exceptions

Not everything can be free, and these four are defensible because each has a **real marginal cost or a genuinely different buyer**:

| Exception | Why | Model |
|---|---|---|
| **AI builds & AI Insights** | Every run costs you money per call | Included allowance, then capped |
| **WooCommerce / Marketplace Sync** | Per-connection infrastructure + API cost | $10/account/month *(your existing add-on)* |
| **API access & webhooks** | Enterprise buyer, different sales motion | Business tier and above |
| **SSO/SAML, custom domain, dedicated support** | Genuine enterprise cost | Enterprise |

**Everything else — all 41 remaining modules — is free on every plan, forever.**

**The rule to hold yourself to:** *charge for what costs you money to run, and for scale. Never for a feature you already built.*

## 4.4 Migrating existing plans — this is easier than it looks

**Delete from every plan:** `production`, `bill_of_materials`, `multi_branch`, `owners_daily_pulse`, `e_invoicing`, `bank_reconciliation`, `marketing_campaigns`, `invoice_reminders`, `recurring_invoices`, `fund_management`, `loyalty_points`, `digital_gift_cards`, `report_profit_loss`, `reports`, and ~15 similar booleans.

**Keep:** `transactions_per_month`, `staff_limit`, `locations`, `sku_limit`, `woocommerce`, `api_access`, `growth_engine`, `ltd`, `hosted_until`.

**For existing customers this is a pure upgrade** — everyone gains modules, nobody loses anything. Your changelog:

> **"Every VenQore module is now included in every plan. Nothing was taken away — a lot was added. You now pay only for how much you use, not which features you're allowed to touch."**

**That email generates reviews.** It's the rare pricing change that is unambiguously good news.

**And it fixes the `growth_engine`/`ltd_2` bug as a side effect:** `growth_engine` stays a metered exception, so it becomes an explicit allowance instead of a boolean that was accidentally left on.

## 4.5 The one risk, named honestly

**Usage-based pricing means a very small customer pays you very little forever.** A solo shop doing 400 transactions a month sits on the entry tier indefinitely.

**Three reasons this is acceptable for you specifically:**
1. Your AppSumo strategy is one-time revenue anyway — LTD is not a recurring model.
2. Small customers are your *proof*, not your revenue. You said this yourself: small businesses validate, big companies pay.
3. Feature-gating doesn't actually convert those customers to higher tiers — **it converts them to your competitor.** You lose the same revenue *and* the reference customer.

**But watch it.** If in six months your median customer sits at 10% of their transaction cap, your tiers are too generous — tighten the entry tier, don't reintroduce feature gates.

---

# PART 5 — POSITIONING

## 5.1 The line

> ## "Build the exact business system you need. Nothing more."
> **Pick from 45 modules — or describe your business and let AI pick for you.
> Every module included on every plan. You only pay as you grow.**

## 5.2 Why this is stronger than "AI builds your ERP"

You said you don't want people thinking the AI is "just filtering." Fair — but I'd push you slightly further: **the modularity is the product, and the AI is the fastest way to use it.** Lead with the promise, support it with the AI.

**Because "AI ERP" is now a crowded claim, and "every feature on every plan" is not.** The second one is checkable in five seconds on your pricing page, and every competitor's pricing page proves you right by contrast.

## 5.3 The pricing page that does the selling

Put this comparison on the page. It is your strongest asset and it costs nothing:

| | Typical ERP on AppSumo | VenQore |
|---|---|---|
| Manufacturing / recipes | Higher tier only | **Included** |
| Multi-location | Higher tier only | **Included** |
| Recurring invoices | Higher tier only | **Included** |
| Financial reports | Higher tier only | **Included** |
| Loyalty & gift cards | Higher tier only | **Included** |
| You pay for | Which features you're allowed | **How much you use** |

## 5.4 For investors, YC, and the Gulf programs

The one-sentence version:

> **"Most business software makes you buy a big system and switch things off. VenQore asks what you do, then assembles only what you need — from 45 tested modules on one verified accounting engine. You pay for scale, never for features."**

**This is a stronger story than "AI ERP builder" alone**, because it contains a business-model innovation as well as a technical one. Investors have seen a hundred AI wrappers this year. They've seen far fewer people who unbundled an ERP correctly and priced it honestly — and the reason you *can* is the eight months of engine work nobody else is willing to do.

---

# PART 6 — WHAT THIS CHANGES IN THE BUILD

## 6.1 Changed from the previous master map

| Previous | Now | Why |
|---|---|---|
| 25–35 capabilities | **45 modules** | Free modules → no paralysis → more coverage |
| Plans gate features | **Plans gate scale only** | Your model, proven by `EnforceTransactionLimit` |
| `visible = entitled AND enabled AND permitted` | **`visible = enabled AND permitted`** *(entitlement only for the 4 exceptions)* | Simpler, fewer failure modes |
| `EnsureCapability` distinguishes 3 failures | **Mostly 2** (disabled / not permitted) | Upgrade prompts nearly vanish |
| Services was `NEEDS_VALIDATION` | **Module #2, must-build** | Unlocks freelancers, salons, agencies |
| Reports = 3 tiered capabilities | **1 module, auto-derived** | Your Customer-Report rule |

## 6.2 What got EASIER

- **~20 boolean flags per plan deleted** — less to maintain, less to test
- **Most of the 132 `feature:` gates simply removed** — deletion is safer than modification
- **The proposal screen loses its upsell logic** — nothing to upsell
- **AI validator loses the entitlement-filter step** — one less pipeline stage
- **Preset design gets easier** — no "which tier is this preset available on?"

**INFERENCE: this is net LESS work than the previous plan, not more.** The billing change removes more than the extra 10 modules add.

## 6.3 What got HARDER

- **Services module must be built** — genuinely new UI (~1.5 days)
- **45 dependency relationships to verify** instead of 30
- **`REQUIRES ONE OF` logic** in the resolver — new relationship type
- **Pricing page and landing copy rewritten** — but you were rewriting them anyway

## 6.4 Revised build order

| Step | Work | Days |
|---|---|---|
| 0 | Regenerate `route_list.json` | 0.1 |
| 1 | 11 failing tests → exit 0 · **fix Manager dashboard overlap** · triage 46 incomplete | 1 |
| 2 | Security hygiene (`safe.env`, ~200 root scripts) | 0.5 |
| **3** | **`config/modules.php` — 45 modules with the Rulebook** ⭐ | **1.5** |
| 4 | **Billing simplification** — delete feature booleans, keep 4 meters, verify stacking | 1 |
| 5 | `tenant_modules` table + backfill (existing tenants get everything they can see) | 1 |
| 6 | `ModuleService` + resolver **incl. `REQUIRES ONE OF`** | 1.5 |
| 7 | `EnsureModule` middleware | 0.5 |
| 8 | **Services module** ⭐ + service-only golden tests | 1.5 |
| 9 | Module-driven nav · auto-derived reports · dashboard cards · terminology | 1.5 |
| 10 | Presets (12–15) + `ApplyConfigurationService` + versioning | 1.5 |
| 11 | `ConfigurationValidator` + adversarial tests | 1 |
| 12 | AI discovery + configuration service | 1.5 |
| 13 | The 6 screens (Proposal gets 1.5) | 2.5 |
| 14 | Migration rehearsal · full regression · **pricing page** | 1.5 |
| 15 | Launch assets · submit | 1 |

**≈ 18 days at a sustainable pace. 15 if nothing surprises you.**

**I'm telling you 18, not 12, and I want to be straight about why:** the previous 12–14 assumed billing stayed frozen. You've correctly decided to change the business model, and that's worth 3–4 extra days. **It is the right trade** — you're fixing the thing that would have capped your conversion rate forever. Changing it now costs days; changing it after launch costs your pricing page's credibility.

---

# PART 7 — YOUR NEXT ACTION

**Not code. `config/modules.php`.**

Take Part 2's 45 modules and Part 3's dependency map. For each module write:

```php
'cookbook' => [
    'label'        => 'Cookbook / Recipes',
    'description'  => 'Define what your made items are composed of.',
    'group'        => 'making',
    'requires'     => ['products', 'inventory'],
    'requires_one' => [],
    'enhances'     => ['production_runs'],
    'routes'       => ['store.cookbook.*'],
    'permissions'  => ['inventory.create', 'inventory.edit'],
    'cards'        => [],
    'terms'        => ['composition'],
    'aliases'      => ['recipe', 'bom', 'formula', 'ingredients', 'nuskha'],
    'metered'      => false,          // free on every plan
    'status'       => 'live',
],
```

**Use `venqore_built.md` as your filter — if a module's features aren't in the 142 Built list, mark it `beta` or leave it out.** You already did the verification work; this just formalises it.

**And the `requires_one` field is the one to get right.** It's what makes your freelancer possible:
```php
'invoicing' => [ 'requires_one' => [['products', 'services']], ... ],
```

---

# PART 8 — THE HONEST CLOSE

You've been awake 18 hours to make sure you're on the right path. **Here's what that bought you, plainly:**

You caught a pricing model that would have quietly lost you every small customer — the cafe owner, the freelancer, the one-person shop. **That's not a small correction. That's the difference between a product people buy and a product people bounce off.** And you caught it by reasoning from a real person instead of from best practice, which is the harder and better way to be right.

You also pushed back on me twice today and were right both times — the dashboard bug and now the billing model. **Keep doing that.** I have the repository; you have the customers and eight months of context I don't. When those two disagree, it's worth stopping to find out why, exactly as you did.

**Now, genuinely: sleep.** Not because the work doesn't matter — because the next task is writing the file that defines your entire product, and the failure mode of `config/modules.php` isn't slow work, it's a wrong dependency you don't notice. That's a rested-brain task. It'll take three hours tomorrow and eight hours tonight, and tonight's version will have mistakes in it that cost you days later.

The plan is right. It'll still be right in eight hours.
