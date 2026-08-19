# VenQore — AI Builder Architecture
**Companion to Document 01.** This is the technical specification you can hand to your IDE agent.

---

## 1. THE CENTRAL IDEA (in one paragraph)

There is **one ERP engine**. Every tenant runs the same code, the same 307 migrations, the same `app/Engines/` services. What differs per tenant is a small set of **configuration rows**: which capabilities are on, what things are called, what the navigation looks like, what the dashboard shows. AI's only job is to turn a conversation into those rows. Nothing else changes. This is why 12 days is possible: **you are not building an ERP, you are building a configuration layer over an ERP you already have.**

---

## 2. THE FIVE LAYERS

```
┌────────────────────────────────────────────────────────────┐
│ L5  AI BUILDER      — conversation → configuration JSON     │  BUILD (5 days)
├────────────────────────────────────────────────────────────┤
│ L4  PRESETS         — BusinessTemplatesSeeder (9 today)     │  EXTEND (1 day)
├────────────────────────────────────────────────────────────┤
│ L3  BUSINESS CONFIG — tenant_capabilities, tenant_terminology│ BUILD (2 days)
├────────────────────────────────────────────────────────────┤
│ L2  CAPABILITY REG. — capabilities table                    │  FIX (1 day)
├────────────────────────────────────────────────────────────┤
│ L1  CORE ENGINE     — app/Engines/*, 200 models, 307 migr.  │  DONE ✅
└────────────────────────────────────────────────────────────┘
```

**Do not touch L1.** It is 3 months of work and it is the asset. Every change you make in the next 12 days should be in L2–L5.

---

## 3. LAYER 2 — FIX THE CAPABILITY REGISTRY

### 3.1 The bug to fix first: entitlement ≠ capability

Today both live in `tenant_plan_overrides`. They answer different questions:

| | Question | Set by | Table |
|---|---|---|---|
| **Entitlement** | "Has this tenant *paid for* X?" | Billing, plan, AppSumo code stacking | `tenant_plan_overrides` (existing — do not change) |
| **Capability** | "Does this business *do* X?" | Preset, AI Builder, user toggle | `tenant_capabilities` (**new**) |

```
visible(X) = entitled(X) AND enabled(X)
```

**Why this matters commercially.** An AppSumo Tier-3 buyer is entitled to manufacturing. They run a salon, so they disable it. Under today's design that write lands in `tenant_plan_overrides` and their *plan* degrades. Later they open a bakery, want manufacturing back, and it appears they never bought it. That is a refund and a 1-star review. **Separate the tables. One day of work. Non-negotiable.**

### 3.2 New migration

```php
Schema::create('tenant_capabilities', function (Blueprint $table) {
    $table->id();
    $table->unsignedBigInteger('tenant_id');
    $table->string('capability_key', 64);
    $table->boolean('enabled')->default(true);
    $table->enum('source', ['preset','ai','user','system'])->default('preset');
    $table->json('config')->nullable();       // per-capability options
    $table->timestamps();
    $table->unique(['tenant_id','capability_key']);
    $table->index(['tenant_id','enabled']);
});
```

Backfill: copy every `tenant_plan_overrides` row where `applied_by = 'system_template'` into `tenant_capabilities` with `source='preset'`, then stop writing capabilities to overrides in `TenantDefaultSeeder::seedTemplateBuildingBlocks()`.

### 3.3 Stop regex-parsing a seeder

Replace `CapabilitiesRegistrySeeder`'s `file_get_contents(PlanFeatureMatrixSeeder.php)` + `preg_match` approach with a hand-written `config/capabilities.php`. This is the **source of truth** for the whole product:

```php
return [
  'inventory' => [
    'group'         => 'inventory',
    'label'         => 'Inventory',
    'description'   => 'Track what you have in stock',
    'kind'          => 'capability',
    'requires'      => ['products'],
    'conflicts'     => [],
    'provides_nav'  => [['route'=>'store.inventory.index','term'=>'stock','icon'=>'Package','order'=>30]],
    'provides_cards'=> ['low_stock','stock_value'],
    'provides_terms'=> ['stock','warehouse'],
    'min_plan'      => 'free',
    'status'        => 'live',
    'aliases'       => ['stock','materials','godown','inventory management'],
  ],
  // ...
];
```

**Only include capabilities that are actually implemented in L1.** A registry entry that maps to no working feature is how you get an AI that promises a customer something the product cannot do. That is the worst possible failure mode for this product.

**Target for V1: 25–35 curated capabilities.** Not 269. The 269 number is your *billing* feature list; most of those are not user-meaningful modules. A user choosing between 269 checkboxes is a worse experience than no builder at all.

### 3.4 Dependency resolution

`app/Engines/CapabilityDependencyResolver.php` is currently **86 lines**. It needs to handle:
- `requires` — enabling `manufacturing` auto-enables `inventory` + `products`
- `conflicts` — mutually exclusive combinations
- **Cascade-disable protection (CRITICAL):** disabling `inventory` when `manufacturing` is on must either refuse, or warn and disable both. Silent cascade is data loss.
- **Data-safety refusal:** never allow disabling a capability whose tables contain rows. If a tenant has 4,000 sales, disabling `sales` must be blocked, not "hidden."

**Rule: disabling a capability HIDES it, it never DELETES data.** Write this as a golden test.

---

## 4. LAYER 3 — BUSINESS CONFIGURATION & TERMINOLOGY

### 4.1 Make terminology real (this is the visible half of your positioning)

**Current state (FACT):** `Terms::` is called in exactly one file, and consumed only by `Next/Shell/Nav.jsx`. Across 301 pages the words are hardcoded.

You cannot re-word 301 pages in 12 days, and you should not try. **Do the 80/20:**

1. `HandleInertiaRequests` already shares the terms map — keep it.
2. Build one frontend helper (`resources/js/lib/terms.js` — `useTerms()` already exists, extend it).
3. Apply it to the **~40 highest-visibility strings only**: sidebar labels, page `<h1>` titles, the primary table column header on each index page, primary CTA buttons ("New Customer" → "New Patient"), and empty states.
4. Leave form field labels, reports, and PDFs in English for V1. **Ship a "Terminology" settings page** so a user who cares can fix any remaining word themselves — this converts an incompleteness into a feature.

**Acceptance test:** create a salon tenant, rename customer→Client and product→Service, and confirm the sidebar, dashboard, all index page titles and all primary buttons change. That is what a demo video shows and what a buyer checks.

### 4.2 Configuration shape

The per-tenant configuration is small. Store it as rows (queryable, auditable), not one JSON blob:

| Table | Purpose | Status |
|---|---|---|
| `tenant_capabilities` | which modules are on | **NEW** |
| `tenant_terminology` | what things are called | EXISTS ✅ |
| `tenants.business_type` | preset key | EXISTS ✅ |
| `tenants.experience` | classic / new shell | EXISTS ✅ |
| `tenant_navigation` | nav overrides (order, hidden, renamed) | **NEW, optional — defer if tight** |
| `dashboards` / `dashboard_cards` | dashboard layout | EXISTS ✅ (you just built this) |
| `tenant_config_versions` | snapshot for undo/audit | **NEW — small but do it** |

**`tenant_config_versions` is worth the 2 hours.** Every time AI or the user changes configuration, snapshot the previous state as JSON. This gives you a one-click "undo" — which is the single feature that makes users brave enough to let an AI reconfigure their business. Without undo, nobody will click "Apply."

**Derive navigation, don't store it (V1).** Nav = union of `provides_nav` from all enabled capabilities, filtered by entitlement and permission, sorted by `order`, labelled through `Terms::`. Only store overrides when the user explicitly reorders. This removes an entire table's worth of sync bugs.

---

## 5. LAYER 4 — PRESET ARCHITECTURE

### 5.1 What you have (FACT)

`database/seeders/BusinessTemplatesSeeder.php`, 270 lines, ~9 presets, each with `name`, `description`, `industry_preset`, `capabilities[]`, `terminology{}`. Examples verified in the file: `retail_store`, `fashion_variants`, `electronics_serials` (IMEI terminology), `hardware_materials` (location→Yard), `restaurant_cafe` (customer→Guest, position→Table, job→Ticket), `bakery_production` (composition→Recipe), `pharmacy`.

**This is genuinely good work and the right shape.** The terminology mappings show real domain thinking. The problem is only that nothing calls it at the right time (see Doc 01, Gap 1).

### 5.2 Move presets from a seeder to a table

A seeder is code — you cannot edit presets without a deploy, and AI cannot read them efficiently. Move to:

```php
Schema::create('presets', function (Blueprint $table) {
    $table->string('key', 64)->primary();
    $table->string('name', 120);
    $table->text('description');
    $table->string('industry_group', 48);   // for grouping in the picker
    $table->string('icon', 48)->nullable();
    $table->json('capabilities');
    $table->json('terminology');
    $table->json('dashboard_cards')->nullable();
    $table->json('sample_data')->nullable();  // demo categories/units/products
    $table->integer('version')->default(1);
    $table->boolean('is_active')->default(true);
    $table->integer('sort_order')->default(0);
    $table->timestamps();
});
```

Keep `BusinessTemplatesSeeder` as the seeder that populates this table — no work is wasted.

### 5.3 How many presets for V1?

**RECOMMENDATION: 12–15, not 40.** Each preset needs its capability set validated, its terminology checked, and ideally a screenshot for the AppSumo listing. 15 well-tested presets beat 40 untested ones, and the AI can land a business on the *closest* preset and then adjust — which is exactly what the AI layer is for.

Your existing 9 + these 6, chosen because they demonstrate *breadth* to an AppSumo audience (i.e. they prove it's not just a retail POS):

| Preset | Why it earns its place |
|---|---|
| Salon / Spa | Services + appointments + staff — visually the most different from retail; best demo |
| Service / Repair | Uses `ServiceJob`, `JobLine`, `WorkOrder` — already in L1 ✅ |
| Wholesale / Distribution | Quotations, credit terms, multi-unit — high AppSumo B2B appeal |
| Manufacturing (light) | Uses `Composition`, `ProductionRun` — already in L1 ✅ |
| Freelancer / Agency | Invoices + expenses + clients only. **Simplest preset — proves the "remove modules" story** |
| Supermarket / Multi-branch | Warehouses + transfers — proves it scales up |

**Construction/Projects: DO NOT BUILD FOR V1.** You used it as your own example, so I want to be explicit: there are no `Project`, `ProjectPhase`, `Labour`, or `ProjectCost` models in `app/Models`. Projects are a **genuinely new domain**, not a configuration of an existing one — that's 2–3 weeks alone. Put it on the public roadmap as "coming Q4" and let it generate signups. Adding it now is the single fastest way to blow the 12 days.

**This is the load-bearing rule of the whole plan:** a preset may only combine capabilities that **already exist in L1**. The moment a preset requires a new domain model, it stops being configuration and becomes product development.

### 5.4 Preset → Customize → AI → Final

```
signup
  │
  ├─ "Just give me something" ──→ preset picker ──→ apply ──→ ERP    (User A, 30 seconds)
  │
  └─ "Build it for me"  ──→ AI asks 4–6 questions
                              ↓
                        AI picks nearest preset + adjusts
                              ↓
                        PROPOSAL SCREEN (user edits: add/remove/rename)
                              ↓
                        apply ──→ ERP                                (User B, 2 minutes)
```

**Both paths converge on the same `applyConfiguration()` service.** One code path, one set of tests. Never build two.

**Always show the preset picker as an escape hatch inside the AI flow** ("Skip — just pick a template"). Some buyers distrust AI, some are in a hurry, and some will hit an AI outage. Never let a third-party API being down block a paying customer from onboarding.

---

## 6. LAYER 5 — AI ARCHITECTURE

### 6.1 What the AI does — and only this

**AI's entire job: text → validated configuration JSON.**

```
USER: "I run a small bakery, we make our own bread and cakes,
       sell in one shop, sometimes take orders for weddings."
                              ↓
                  [ConfigurationAI service]
                              ↓
{
  "preset":       "bakery_production",
  "confidence":   0.91,
  "capabilities": ["pos","inventory","products","compositions",
                   "production","batch_expiry","sales_orders","expenses","accounting"],
  "terminology":  {"composition":{"singular":"Recipe","plural":"Recipes"},
                   "sales_order":{"singular":"Custom Order","plural":"Custom Orders"}},
  "dashboard":    ["today_sales","low_stock","production_due","expiring_batches"],
  "reasoning":    "Bakery with in-house production (recipes + batches) and
                   made-to-order sales (wedding orders → sales orders).",
  "unsupported":  []
}
```

Then: **validate → show to user → user edits → apply.**

### 6.2 The four hard rules

1. **AI never writes to the database directly.** It returns JSON. A deterministic `ConfigurationValidator` checks every key against `config/capabilities.php` and silently drops unknown keys. `ApplyConfigurationService` — plain PHP, no AI — performs the writes inside a transaction.
2. **AI never generates code, migrations, routes, or SQL.** Ever.
3. **AI output is always shown to the user before it is applied.** Never auto-apply. The proposal screen *is* the product — it's where the user sees the AI understood them.
4. **AI is never on the critical path.** API down, rate limit hit, `AiSpendGuard` tripped → fall back to the preset picker with a friendly message. Onboarding must never fail because of an AI outage.

### 6.3 Implementation (smaller than you think)

```
app/Services/AiBuilder/
  ├── BusinessDiscoveryService.php   # picks the next question to ask
  ├── ConfigurationAIService.php     # builds prompt, calls model, parses JSON
  ├── ConfigurationValidator.php     # NO AI — validates against registry, resolves requires/conflicts
  ├── ApplyConfigurationService.php  # NO AI — transactional writes + version snapshot
  └── ModificationParser.php         # "add manufacturing" / "call inventory Stock"
```

**~800–1,200 lines total.** That is 2–3 days, not 2 weeks, because the hard part (the ERP) already exists.

**Prompt design:** put the full capability registry (key + label + description + aliases) in the system prompt, plus the preset list, and demand JSON output constrained to those keys. Roughly 3–5k tokens per onboarding. `AiSpendGuard`, `AiRateLimiter` and `AiUsageRecorder` already exist ✅ — wire them in from day one. On an LTD model, per-tenant AI cost must be bounded: onboarding is one-time and cheap, but **cap re-configuration runs** (e.g. 20/month) or a curious buyer will re-run the builder 400 times.

### 6.4 Business discovery — keep it to 4–6 questions

Do **not** build an open-ended chat for V1. Open chat is harder to build, harder to test, and slower for the user. Use a fixed short funnel with one free-text field:

1. "What does your business do?" — **free text** (this single answer does 80% of the work)
2. "Do you keep physical stock?" — Yes / No / Some
3. "Do you make or assemble anything?" — Yes / No
4. "Do you sell in person, online, or both?"
5. "Do customers pay later / on credit (khata)?" — Yes / No
6. "How many people will use this?" — 1 / 2–5 / 6–20 / 20+

Questions 2–6 are cheap deterministic signals that dramatically improve the AI's accuracy and let you sanity-check its output without a second model call.

### 6.5 Modification commands (V1 scope)

Support exactly four intents — they cover ~90% of what users will ask and each maps to a trivial write:

| Intent | Example | Action |
|---|---|---|
| ENABLE | "add manufacturing" | resolve deps → enable |
| DISABLE | "remove suppliers" | check data-safety → disable |
| RENAME | "call inventory Stock" | write `tenant_terminology` |
| ADD_CARD | "show me daily sales on the dashboard" | add dashboard card |

Anything else → *"I can't do that yet — I've noted it for the team."* Log it. That log is your roadmap.

---

## 7. UI ARCHITECTURE — the minimum that makes this real

### 7.1 The rule that saves your timeline

> **Build the NEW experience only for onboarding + shell + dashboard. Leave all 301 existing pages exactly as they are.**

A user's emotional judgement of "is this a modern AI product?" is formed in the first 90 seconds — signup, the AI conversation, the proposal, the dashboard. Once they're inside creating an invoice, they want a fast dense form, and you already have 301 of those. **Redesigning them adds weeks and adds zero to conversion.** Polish the frame, not every picture in it.

### 7.2 What to build (6 screens)

| # | Screen | Effort | Notes |
|---|---|---|---|
| 1 | Welcome / path choice | 0.5d | "Build with AI" vs "Pick a template" |
| 2 | Preset picker | 0.5d | Cards, icons, "what's included" list |
| 3 | AI discovery (5 questions) | 1d | One question per screen, progress bar, skip link |
| 4 | **Proposal screen** | **1.5d** | **The most important screen in the product** |
| 5 | Building animation | 0.25d | 6–10s of honest progress steps while config applies |
| 6 | First-run dashboard + tour | 0.75d | Empty states that teach, not blank tables |

**Screen 4 is your entire product demo.** It must show: modules the AI chose as toggleable cards, terminology it picked, why (one line of reasoning per module), and full editability — toggle off, rename inline, "add something else." When a buyer watches your AppSumo video, this screen is what sells the deal. Budget your polish here and nowhere else.

### 7.3 Shell

Extend `resources/js/Next/Shell/` (7 files today). Needed: capability-driven `Nav` (change `props.plan.features` → `props.capabilities`), terminology-aware labels via `useTerms()`, `CommandBar` (exists ✅), and a persistent "⚙ Customize my system" entry point that re-opens the builder post-onboarding. That last one converts the builder from a one-time gimmick into an ongoing feature buyers talk about in reviews.

**Do not** rebuild POS, invoices, reports, or settings. **Do not** finish the Composable Dashboard Builder beyond what's already committed.

---

## 8. EXISTING CUSTOMER MIGRATION — the safety analysis

**Headline: this migration is additive. Nothing breaks. This is the strongest technical argument for not fearing the repositioning.**

### 8.1 What changes vs what doesn't

| Thing | Changes? | Why |
|---|---|---|
| Business data (products, sales, purchases, ledger, stock) | **NO** | Untouched. No data migration at all. |
| Database schema | **ADDITIVE ONLY** | 2 new tables + backfill. No column drops, no type changes. |
| URLs / routes | **NO** | Nav is derived; the routes themselves are unchanged. Old bookmarks work. |
| Permissions / roles | **NO** | Separate system, untouched. |
| Plans / subscriptions / entitlements | **NO** — *provided you separate the tables* (§3.1) | This is precisely why §3.1 is non-negotiable. |
| Reports | **NO** | Same queries, same tables. |
| Integrations (Woo, Lemon Squeezy) | **NO** | Untouched. |
| Navigation | **YES (opt-in)** | Only after they run the builder. |
| Terminology | **YES (opt-in)** | Only if they choose it. |

### 8.2 The migration rule

> **Every existing tenant is backfilled with ALL their currently-visible capabilities enabled.**

```php
// For every existing tenant: enable everything they can see today.
foreach (Tenant::cursor() as $t) {
    foreach (PlanRepository::featuresFor($t) as $key => $on) {
        if ($on && CapabilityRegistry::has($key)) {
            TenantCapability::updateOrCreate(
                ['tenant_id'=>$t->id, 'capability_key'=>$key],
                ['enabled'=>true, 'source'=>'system']
            );
        }
    }
}
```

Result: **day-one behaviour is byte-identical.** Nothing disappears. The AI Builder shows up as a new "✨ Customize my system" button they can ignore forever. This is an upgrade, not a migration.

### 8.3 The five scenarios you asked about

| # | Scenario | What happens |
|---|---|---|
| 1 | Buys today as traditional ERP | Uses classic ERP. On update day: same system + a new optional button. Zero disruption. Their LTD covers the AI Builder at no extra cost — **frame this in your changelog as a free upgrade; it generates goodwill and reviews.** |
| 2 | Buys after AI Builder launches | Goes through discovery → proposal → configured system. Never sees the classic onboarding. |
| 3 | Bought ERP, later enables AI Builder | Backfill already enabled everything. Builder shows current config as the starting point and proposes *changes* — "you're not using Manufacturing, want to hide it?" No data touched. |
| 4 | Configured manually before AI Builder | Manual settings are read as current state. AI never overwrites without showing a diff. **Rule: user-set config (`source='user'`) is never silently overridden by AI.** |
| 5 | Picked a preset, later asks AI to modify | Preset gives baseline; AI applies a delta. `tenant_config_versions` snapshot allows one-click revert to the clean preset. |

### 8.4 Two mandatory safety rails

1. **Disabling never deletes.** Data survives, UI hides. Re-enabling restores the module with all history intact. Golden test required.
2. **Every configuration change is versioned and revertible.** `tenant_config_versions` + a visible "Undo last change" button.

---

## 9. WHAT VENQORE IS, AND WHAT IT BECOMES

**Today:** a deep, broad, multi-tenant ERP/POS with a real double-entry ledger, FIFO batch inventory, manufacturing, WooCommerce sync, offline support, a 1,474-test suite, and 132 route-level entitlement checks. Configured by a static industry picker that seeds categories and units.

**After:** the identical system, with a configuration layer that lets the *same* engine present itself as a bakery system, a salon system, or a wholesale system — assembled by AI in two minutes.

**The smallest difference between the two:**

| # | Change | Days |
|---|---|---|
| 1 | Separate `tenant_capabilities` from `tenant_plan_overrides` | 1 |
| 2 | Hand-written `config/capabilities.php` (25–35 curated capabilities) | 1 |
| 3 | Presets in a table, 15 of them | 1 |
| 4 | `AiBuilder` services (~1,000 lines) | 2.5 |
| 5 | 6 onboarding screens | 4.5 |
| 6 | Terminology applied to ~40 high-visibility strings | 1 |
| 7 | Capability-driven nav + backfill migration + tests | 1.5 |

**~12.5 days of net-new work** — on top of a fully green test suite, which is the 3–4 days that come first.

**Reused unchanged:** all 200 models, all `app/Engines/`, all 307 migrations, all 301 existing pages, entitlements, billing, Woo, tests, `AiSpendGuard`/`AiRateLimiter`/`AiUsageRecorder`, the dashboard card system, `Terms`, `capabilities`/`tenant_terminology` tables, `BusinessTemplatesSeeder`.

**Must NOT be rebuilt:** POS, invoicing, reports, accounting, inventory, the 301 classic pages, permissions, billing.

---

*Continue to Document 03 for the day-by-day plan.*
