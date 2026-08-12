> ## ⚠️ SUPERSEDED ON PLANNING — 11 August 2026
> The programme now runs from **`v3/00_MASTER_INDEX.md`** and the numbered set beside it.
> **Still authoritative:** §00 findings (the entitlement layer, `tenant_plan_overrides`, the capability catalogue) and §07 risks. Everything about timeline, 90-day plan and scope is superseded.

# VenQore — Audit II
## "Build Your Own ERP" — Incremental Repositioning Strategy

**Audited:** 8 August 2026
**Scope:** A second forensic pass, targeted at one question — *can the existing ERP be repositioned now as a composable, per-customer ERP, and expanded one vertical at a time, without stopping sales and without a rewrite?*
**Companion:** `VENQORE_BUSINESS_OS_FORENSIC_AUDIT.md` (Audit I). Where the two disagree, **this document supersedes it**, because Audit I did not examine the entitlement layer closely enough and consequently over-estimated the cost of composition.

---

## 00 — What changed since Audit I

Audit I concluded you were at **~22%** of the Business OS vision and that a convincing prototype was 14–18 weeks away. That assessment stands **for the full vision**.

But this strategy asks a narrower question, and against that narrower question I found four things I had under-weighted. Two of them are decisive.

### Finding 1 — The capability catalogue already exists. 269 entries.

`database/seeders/PlanFeatureMatrixSeeder.php` defines **269 named capability keys in 12 groups**:

> Onboarding · POS & Checkout · Invoicing & Khata · Procurement · Inventory & Warehouses · E-commerce & VenSynQ · Accounting & Finance · Report Factory · Platform HQ · AI & Automation · Live Chat · Support

Audit I said "there is no capability catalogue." **That was wrong.** There is one — 269 entries, already grouped, already named, already reviewed. It is simply *indexed by plan* instead of *indexed by tenant*. That is a shape problem, not an existence problem, and shape problems are cheap.

### Finding 2 — Per-tenant capability configuration is already built and already wired. **This is the decisive finding.**

`tenant_plan_overrides` exists with exactly the columns a composition table needs:

```
tenant_id · override_key · override_value · original_value
reason · applied_by · expires_at · UNIQUE(tenant_id, override_key)
```

And `PlanRepository::getEffectiveLimit()` **checks the tenant override before it checks the plan** — with a 5-minute cache and a fail-closed default. Enforcement then flows through `PlanGate` → `EnsurePlanFeature` middleware at **134 route-level enforcement points** and **76 in-code `PlanGate::` calls**.

Read that again in the language of your strategy:

> *"If someone wants just POS and the Cookbook, they get that. If someone wants manufacturing and staff without POS, they get that."*

**The mechanism to do that already exists in production code.** It is currently presented as a SuperAdmin escape hatch ("Tenant Overrides" in the platform nav), but architecturally it *is* a per-tenant capability configuration table with audit trail, expiry and caching. You built the composition engine and labelled it a support tool.

### Finding 3 — The financial and inventory engines are far more decoupled than I assumed

I checked the imports directly:

| Service | Imports from `App\Models` / `App\Services` |
|---|---|
| `V3/ManufacturingService.php` (685 lines) | **one exception class. Nothing else.** |
| `V3/SaleService.php` (805 lines) | **one exception class.** |
| `V3/InventoryService.php` | `JournalEntry` only |
| `V3/PurchaseService.php` | `Product` only |

The V3 layer works against the database directly rather than through a web of model dependencies. **Manufacturing genuinely does not depend on Sales.** A manufacturing-only tenant is not a fantasy — the service layer already supports it. Only `AutoManufacturingService` (the legacy "make-on-sale" path) couples the two, and it is not in the V3 namespace.

The chart of accounts in `TenantDefaultSeeder` is likewise **standard accounting, not retail accounting** — Cash, Bank, Inventory Asset, AR, AP, Sales Revenue, COGS, Salaries, Rent, Utilities. A gym, a workshop or a clinic would use the same tree.

### Finding 4 — The gap is almost entirely in the UI, and it is precisely locatable

| Layer | Composition-ready? | Evidence |
|---|---|---|
| Capability catalogue | ✅ 269 keys | `PlanFeatureMatrixSeeder` |
| Per-tenant configuration store | ✅ built + cached + audited | `tenant_plan_overrides`, `getEffectiveLimit` |
| Backend enforcement | 🟡 **~50 of 269 keys** | 39 distinct keys at routes, 28 in `PlanGate::` calls |
| API enforcement | ❌ **zero** | `grep -c 'plan.feature:' routes/api.php` → **0** |
| Frontend entitlement map | 🟡 leaky | `featuresFor()` iterates the **plan's** key set, so a capability enabled by tenant override but absent from that plan's limit rows **never reaches the frontend** — backend allows it, UI never shows it. A real, small, findable bug that blocks composition. |
| Navigation | ❌ hard-coded | 10 top-level items in a JSX array; **Sell, Purchase, Stock, Contacts, Money are unconditional** — no flag can remove them |
| Sub-navigation | 🟡 wrong behaviour | Unavailable items render **locked with a badge**, not hidden. A manufacturing-only customer would see a greyed-out POS menu — the exact "ERP full of things I don't need" feeling you are trying to escape |
| Frontend usage of flags | ❌ 12 keys across 4 files | Out of 269 |
| Terminology | ❌ none | "Customer" is a string literal across 297 pages |

**So the honest position is:** the *engine* for "build your own ERP" is roughly **70% built**. The *experience* is roughly **15% built**. Audit I measured the wrong one.

---

## 01 — Verdict on the strategy

**This is the right strategy, and it is better than both alternatives you have been weighing.**

It beats "go all in on the Business OS" because it produces revenue at every step instead of eighteen months of invisible work.

It also beats my own Audit I recommendation ("build the semantic layer first, then demo two industries"), because it front-loads the thing that is *already almost built* (composition) rather than the thing that is genuinely from scratch (terminology across 297 pages). **Composition is a smaller build than vocabulary, and it is a stronger commercial claim.** I had that order wrong.

Three specific things you have got right that I want to name explicitly, because they are the reasons this works:

1. **You are selling a promise the code can already keep.** "Tell us what you need and we'll configure your ERP" is deliverable *this quarter*, because `tenant_plan_overrides` exists. "Tell us any business and AI will build it" is not deliverable this year.

2. **"Other businesses are on the way" is honest sequencing, not a hedge.** A roadmap that says *retail today, restaurants today, wholesale today, manufacturing today, gyms next quarter* is credible in a way that "every business, eventually" never is — and it lets you sell each arrival as a launch.

3. **Every customer becomes architecture research.** Each "can I have X without Y?" is a free specification for the composition layer, and each "can you add Z?" is a free vote on which capability to build next. You cannot buy that information; you can only earn it by shipping.

**And one thing that will decide whether this succeeds or destroys you**, which I will return to in §07: *"If you need something, just ask us and we'll give it to you"* is either the best or the worst sentence in this plan, depending entirely on one rule you have not yet written.

---

## 02 — What "Build Your Own ERP" actually requires

Precisely scoped, in dependency order. Effort is engineering days for one developer fluent in this codebase.

### Tier 1 — Make composition real (this is the product)

| # | Work | Detail | Days |
|---|---|---|---:|
| T1 | **Capability registry table** | Promote the 269 seeder keys into a real `capabilities` table: `key`, `group`, `label`, `description`, `icon`, `requires[]`, `conflicts[]`, `is_composable`, `min_plan`. The `requires[]` column is the important one — Cookbook requires Products; Khata requires Parties; Production requires Inventory. | 5–7 |
| T2 | **Tenant capability resolution** | Reuse `tenant_plan_overrides` as the store. Fix `featuresFor()` to iterate the **capability registry**, not the plan's key set (the leak in Finding 4). Add dependency resolution so enabling Cookbook auto-enables Products. | 4–6 |
| T3 | **Close the enforcement gap** | Only ~50 of 269 keys are enforced. Wire the ~40 that gate *composable* capabilities (the rest are descriptive marketing keys and need nothing). Add a CI check cross-referencing every `plan.feature:` key against the registry — this class of bug already caused a production lockout on 2026-08-07. | 8–10 |
| T4 | **API enforcement** | `routes/api.php` has **zero** `plan.feature:` guards. Must close before selling composition. | 2–3 |
| T5 | **Navigation from the registry** | Replace the hard-coded JSX array. Every top-level item becomes conditional, including the five currently unconditional ones. Nav renders from capabilities the tenant actually has. | 8–12 |
| T6 | **Hide, don't lock** | Change the default from "render greyed-out with an upsell badge" to "not present." Locks remain **only** for capacity limits (SKUs, seats, locations) — never for capabilities the customer chose not to have. This single change is what makes a composed ERP *feel* purpose-built. | 3–5 |
| T7 | **Composition picker (self-serve)** | The "what do you need to manage?" screen. Grouped capability chooser with dependency hints and live preview of the resulting nav. Reachable at signup *and* later from Settings. | 6–9 |
| T8 | **Composed onboarding & seeding** | Extend `TenantDefaultSeeder` + `config/industries.php` so a chosen composition seeds only what it needs. Today it always seeds a warehouse, a full COA and expense categories. | 4–6 |
| T9 | **Home/Dashboard tolerance** | `DashboardController` imports `Sale`, `SaleItem`, `Product`, `Party`, `Account`, `JournalEntry`, `BankAccount`. A manufacturing-only tenant must not see an empty sales chart. Dashboard cards must be capability-aware. | 6–8 |
| T10 | **Guard the seams** | Isolation tests per composition (POS-only, manufacturing-only, ledger-only). Fix the `RefreshDatabaseState` race first — you cannot ship composition without a suite that runs in one process. | 10–14 |
| | **Tier 1 subtotal** | | **56–80 days ≈ 11–16 weeks** |

### Tier 2 — Make it feel like *their* ERP (this is the differentiation)

| # | Work | Days |
|---|---|---:|
| T11 | **Terminology layer** — `tenant_terminology` map + a `t()` helper applied at render. Do **not** do all 297 pages: do the nav, page titles, table headers, buttons and empty states. That is ~80% of perceived effect for ~20% of the work. | 15–20 |
| T12 | **Dashboard/widget engine** — `dashboard_layouts`, widget registry, edit mode, capability-aware picker. The spec is already written in `VenQore_Widget_Dashboard_Prompt.md`. | 20–25 |
| T13 | **Composition change management** — enabling/disabling a capability on a *live* tenant with data. Reuse the existing downgrade policy: hide, never delete; block if open balances exist. | 8–10 |
| | **Tier 2 subtotal** | **43–55 days ≈ 9–11 weeks** |

### Tier 3 — Make AI do the composing (this is the story)

| # | Work | Days |
|---|---|---:|
| T14 | **AI capability recommender** — one new tool in `AiController` over the 269-key registry: free-text business description → recommended composition + reasoning. **This is genuinely small** because the function-calling harness, permission checks, cost metering and spend guards already exist. | 8–12 |
| T15 | **AI applies the composition** — a *write* tool that proposes rows for `tenant_plan_overrides`, runs a validator (dependencies satisfied, no conflicts, within plan), shows a preview, and applies on approval with full rollback. The table already has `original_value` and `applied_by`. | 10–14 |
| T16 | **Conversational onboarding** — the mockup's step 1–3 flow wired to T14/T15. | 8–12 |
| | **Tier 3 subtotal** | **26–38 days ≈ 5–8 weeks** |

**At the end of Tier 3, "AI builds your ERP" is a true statement** — for composition of existing capabilities. That is a far narrower claim than "AI builds any business software," and it is one you can demonstrate live, on real data, with a real ledger behind it.

---

## 03 — Vertical distance table

This is the most decision-useful thing in this document: **which businesses you can sell to, ranked by how much code is missing.** Percentages are capability coverage against a realistic requirement list for each vertical, assessed against what is actually in the repository.

| Vertical | Coverage | Already have | Missing | New engines needed |
|---|---:|---|---|---|
| **Retail / grocery / karyana** | **98%** | Everything | — | None |
| **Restaurant / café** | **95%** | `restaurant_tables`, `kitchen_orders`, `recipes`, `RestaurantDashboardController`, `QrMenu`, BOM auto-deduct | Shift/table reservations | None |
| **Wholesale / distribution** | **95%** | Proposals, quotations, sales orders, POs, khata, ageing, multi-warehouse, landing cost | Route/van sales | None |
| **Hardware / auto parts / electronics** | **95%** | Serials/IMEI, variants, batches | — | None |
| **Pharmacy** | **90%** | Batch + expiry tracking, serials, FBR | Prescription record, drug-schedule compliance | Document type only |
| **Manufacturing / workshop** | **85%** | BOM, production runs, ingredients, landing cost, multi-warehouse | Job/work orders, machine time, per-job costing | Work engine (light) |
| **Gym / fitness studio** | **70%** | Members as parties, **recurring invoices**, staff attendance, expenses, loyalty, reports, full ledger | Class scheduling, member check-in, membership lifecycle states | **Scheduling** + State |
| **Salon / barber / spa** | **60%** | Parties, payments, staff, products, commissions (partial) | Appointments, practitioner rosters, **services as non-stock resources** | **Scheduling** + Resource |
| **Clinic / dental** | **50%** | Parties, invoicing, ledger, batch-tracked supplies | Appointments, patient records, practitioner scheduling, insurance | **Scheduling** + Resource + Document |
| **School / academy** | **45%** | Parties, fees as invoices, recurring billing, staff, ledger | Enrolment (relationship), terms (period), class attendance, grades | **Relationship** + **Period** + Scheduling |
| **Equipment rental** | **40%** | Parties, invoicing, ledger, serials | Time-based resource availability, checkout/return, damage, rate calendars | **Scheduling** + Resource + **Period** |
| **Construction / projects** | **35%** | Parties, quotations, POs, expenses, staff | Projects, job costing, progress billing, equipment, subcontractors | **Relationship** + Work + Period |
| **Hotel / booking** | **30%** | Parties, invoicing, ledger, expenses | Rooms as time-sliced resources, reservations, rate calendars, folio, channel manager | **Scheduling** + Resource + **Period** + Integration |

### The single most important pattern in this table

**Five verticals are ≥85% ready and need no new engine at all.** They need only composition and terminology — Tier 1 and part of Tier 2. That is your first two quarters of sales, at zero architectural risk.

**Then look at the "missing" column for everything below 85%. The same three names keep appearing: Scheduling, non-stock Resource, Period.**

> **Building Scheduling once unlocks gyms, salons, clinics, rentals, hotels and repair shops simultaneously.**

That is not a coincidence — it is the structural fact that should drive your roadmap. Do not pick your second vertical by which market looks biggest. **Pick the engine that unlocks the most verticals, then sell into whichever of them responds first.**

**Estimated cost of the unlock:** Scheduling engine 30–40 days · non-stock Resource type 12–18 days · Period 10–15 days → **52–73 days ≈ 11–15 weeks** to move six verticals from "not possible" to "≥80%."

**Hotel is the worst possible second vertical** at 30% coverage and four missing engines. It is emotionally appealing and architecturally the most expensive thing on the list. If you want a booking product, get there via gym → salon → clinic → rental, by which point the engines exist and hotel becomes a configuration rather than a project.

---

## 04 — Timeline

Engineering days for one experienced developer already fluent in this codebase, then calendar with ERP maintenance and sales continuing. Assumes the test-suite fix (10–14 days, `WHY_359_FAILURES.md`) happens inside Tier 1 as T10 — it is not optional.

### The four milestones that matter

| Milestone | What you can honestly say | Eng. weeks | Solo calendar | 2 devs |
|---|---|---:|---|---|
| **M1 — Composable ERP** (Tier 1) | *"Tell us what you need. We configure your ERP. You don't get modules you didn't ask for."* | 11–16 | **4–6 months** | 2.5–3.5 mo |
| **M2 — It's your ERP** (+Tier 2) | *"Your words, your dashboard, your workspace."* | 20–27 | 7–10 months | 4–5.5 mo |
| **M3 — AI builds it** (+Tier 3) | *"Describe your business. VenQore assembles your ERP."* **This is the investor demo.** | 25–35 | 9–13 months | **5–7 months** |
| **M4 — Second engine family** (+Scheduling/Resource/Period) | *"Retail, food, wholesale, manufacturing, gyms, salons, clinics, rentals — one core."* | 36–50 | 13–18 months | **7–10 months** |

### Answering your question directly

> *How long until we can present ourselves as "AI will make whatever ERP requirements you have," with something presentable for investors?*

**Solo: 9–13 months. With one more senior developer: 5–7 months.** That is M3.

And it is worth being precise about *why* M3 is so much closer than Audit I's 15-month figure: because at M3 the AI is not generating capabilities — it is **selecting from 269 that already exist and writing rows into a table that already exists.** The claim is narrower, the build is smaller, and the demo is completely real. Nothing is faked.

**The demo at M3:** you type *"I run a small bakery with two branches, we make our own bread, we sell over the counter, and I have six staff"* — and the system proposes a composition (POS, recipes/BOM, inventory, purchasing, expenses, staff, khata, ledger, two locations), explains why, shows the resulting workspace, and on approval it exists, in that customer's own vocabulary, with a real double-entry ledger behind it. Then you delete POS and add manufacturing and it becomes a different business. **Every part of that is buildable from what is in the repository today.**

### If you can only afford one hire

Make it a senior React engineer, not a backend engineer. **The gap in this strategy is 85% frontend** — 297 pages, hard-coded nav, no terminology layer, no widget engine. The backend composition layer is largely done and you can maintain it yourself.

---

## 05 — The 90-day plan

Concrete, ordered, each block independently shippable.

### Days 1–15 — Make the ground safe
- Fix the `RefreshDatabaseState` migration race so the full suite runs in one process. **Nothing else starts until this is green.**
- Delete the dead service generation (legacy `InventoryService`, `PurchaseService`, `FifoService` alongside their `V3/` replacements). You cannot compose services that exist twice.
- Add the CI check: every `plan.feature:` key in routes must exist in the seeder. This class of bug caused a real production lockout on 2026-08-07.
- Close the `routes/api.php` enforcement hole (zero guards today).
- *Ship nothing customer-visible. This fortnight buys you the right to move fast for the next year.*

### Days 16–40 — Composition engine
- `capabilities` registry table, promoted from the 269 seeder keys, with `requires[]` / `conflicts[]`.
- Fix `featuresFor()` to iterate the registry rather than the plan's key set.
- Wire the ~40 composable keys that are not yet enforced.
- Dependency resolution on enable/disable.
- *Internal milestone: you can hand-compose a manufacturing-only tenant via SuperAdmin and it works end to end.*

### Days 41–65 — Composition experience
- Navigation renders from the registry; all ten top-level items become conditional.
- Hide-don't-lock for capabilities; keep locks for capacity only.
- Capability-aware dashboard cards.
- Composition picker at signup and in Settings.
- Composed seeding.
- *Public milestone: launch **"Build your own VenQore."** Reposition the pricing page. This is sellable.*

### Days 66–90 — Terminology, first pass
- `tenant_terminology` + `t()` helper.
- Apply to nav, page titles, table headers, primary buttons, empty states only.
- Ship three vocabulary packs you can already fully serve: **Restaurant**, **Workshop/Manufacturing**, **Wholesale**.
- *Public milestone: **"VenQore now speaks your language."*** Same engine, three visibly different products. **This is your first investor-grade screenshot set, and it is 100% real.**

### Then, in order
- **Days 91–150:** widget/dashboard engine (spec already written) + composition change management on live tenants.
- **Days 151–210:** AI capability recommender → AI applies composition → conversational onboarding. **This is M3.**
- **Days 211–300:** Scheduling + non-stock Resource + Period. Six new verticals become reachable. Launch gym or salon as vertical #6.

---

## 06 — Pricing under this model

The composition strategy breaks plan-as-feature-bundle, and that is a feature, not a problem — it forces the fix Part II of Audit I already recommended.

**Plans stop meaning "which modules you get" and start meaning "how big your business is."**

| Axis | What it prices | Already built? |
|---|---|---|
| **Capabilities** | **Free — you pick them.** This *is* the product promise | `tenant_plan_overrides` ✅ |
| **Capacity** | Locations · records (SKUs/parties/documents) · operator seats | `plan_limits` ✅ |
| **Consumption** | AI actions · SmartCapture · sync volume | Metering ✅ |
| **Connections** | Marketplace channels, API | ✅ |

Keep exactly **one** capability wall, the one your own strategy document already identified as the best line in it:

> *"Counter = sell things. Starter = run a business."* — the ledger.

Everything else composes freely. This kills the four **Critical** false-promise findings in `FEATURE_GATING_AUDIT.md` in a single move (all four concern module gating), collapses ~50 gated keys to one, and makes the pricing page say something true and distinctive:

> **Every capability. You choose which ones you want. You pay for the size of your business, not its complexity.**

**One thing to model before announcing:** AppSumo LTD tiers were sold on the current gating structure. Grandfather LTD holders *upward* — never sideways — and check the numbers before the page changes.

---

## 07 — Risks specific to this strategy

### 🔴 CRITICAL — "Just ask us and we'll give it to you" becomes bespoke consulting

This is the sentence that decides whether the strategy works. Said without a rule, it turns you into an agency with a codebase: twenty customers, twenty special cases, and a platform that gets *harder* to generalise with every sale. That is the exact failure mode that kills vertical-ERP companies, and it is slow and comfortable enough that you would not notice for a year.

**The rule, written down before you say the sentence publicly:**

> We say **yes** only if the request is (a) satisfiable by composing existing capabilities, or (b) a capability that at least three plausible customers would use, built generically and added to the registry for everyone.
> We say **not yet, here's when** to everything else.
> **We never write tenant-specific code.** Not once. The first exception is the end of the strategy.

Track it: **count the capabilities in the registry every month.** If that number grows while the number of tenant-specific code paths stays at zero, the strategy is working. If tenant-specific paths appear, stop and fix it that week.

### 🔴 CRITICAL — Selling composition you cannot yet deliver
Today, five of ten nav items cannot be turned off. If you launch "manufacturing without POS" before T5/T6 ship, the first customer sees a POS menu they were told they would not get. **Do not announce composition before the navigation is registry-driven.** The three-month plan in §05 sequences this correctly; do not reorder it.

### 🟠 HIGH — Vertical drift
Each new vertical will tempt one small special case. Restaurant already has `restaurant_tables`, `kitchen_orders` and `RestaurantDashboardController` — vertical-specific tables and a vertical-specific controller. That was fine as a one-off; it must not become the pattern. **Study it as a warning, not a template.** Every future vertical must be capability + configuration + vocabulary.

### 🟠 HIGH — The composition matrix explodes the test surface
269 capabilities is combinatorially infinite. You cannot test compositions; you can only test **capability boundaries**. Test that each capability works with its declared `requires[]` satisfied and degrades cleanly without its optional neighbours. Define 5–8 *named* reference compositions (Retail, Restaurant, Wholesale, Workshop, Books-only) and run the full suite against each. Anything outside those is unsupported until it is named.

### 🟠 HIGH — Dashboard and reports assume retail data
`DashboardController` imports `Sale`, `SaleItem`, `Product`, `Party`, `Account`, `JournalEntry`, `BankAccount`. A ledger-only or manufacturing-only tenant hits empty charts everywhere. T9 addresses this, but the same problem recurs across 48 report pages — budget for it.

### 🟡 MEDIUM — Frontend entitlement leak
`featuresFor()` builds the frontend map from the *plan's* key set, so a capability enabled by tenant override but absent from that plan's rows is allowed by the backend and invisible in the UI. Small fix, but it silently breaks composition and would be maddening to debug in production. Fix in T2.

### 🟡 MEDIUM — Offline layer is retail-shaped
`LocalDB.js` hard-codes twelve Dexie stores (products, customers, suppliers, orders, invoices, inventory, sales_queue…). Non-retail compositions will not sync. **Acceptable for now** — say plainly that offline covers POS and stock, and do not promise it elsewhere.

### 🟡 MEDIUM — Marketing outrunning the registry
"All these other businesses are coming" is credible exactly once. If gyms are announced and arrive two quarters late, the claim converts from momentum into a credibility problem. **Announce a vertical only when its capability gap is ≤2 registry entries.**

### 🟢 LOW — Support load from composition
Every composition is a slightly different product to support. Mitigated by the named-reference-composition rule above.

---

## 08 — What NOT to do under this strategy

1. **Do not write per-customer code.** §07. The single rule that matters.
2. **Do not announce composition before navigation is registry-driven.** You will be caught inside a week.
3. **Do not pick hotel as vertical #6.** 30% coverage, four missing engines. Gym is 70% and needs one.
4. **Do not build vertical-specific tables again.** `restaurant_tables` was a reasonable one-off; a second one establishes a pattern that ends the strategy.
5. **Do not let capabilities become priceable individually.** The whole positioning is "capabilities are free, capacity is priced." A single "unlock Manufacturing for $15" undoes it.
6. **Do not build the AI recommender before the registry.** It has nothing to recommend from.
7. **Do not attempt terminology across all 297 pages.** Nav, titles, headers, buttons, empty states. Stop there. The rest is diminishing returns you can do lazily, page by page, forever.
8. **Do not remove `Pos.jsx` from its special case.** 3,612 lines of keyboard-first offline checkout. It is a composed capability, not a composed screen.
9. **Do not promise offline for non-retail compositions.**
10. **Do not skip the 15-day safety block.** Composition without a reliable test suite is how you ship a tenant that cannot invoice.

---

## 09 — The investor story, and when it becomes true

| Stage | Claim | True from |
|---|---|---|
| **Today** | *"A production multi-tenant ERP with a verified double-entry ledger, FIFO costing, AI document capture and real customers."* | ✅ now |
| **Day 65** | *"Customers compose their own ERP. No modules they didn't ask for."* | M1 |
| **Day 90** | *"Same engine, three visibly different products — retail, restaurant, workshop."* | M1+ |
| **Day 150** | *"Every workspace is theirs: their words, their dashboard."* | M2 |
| **Day 210** | *"Describe your business. VenQore assembles your ERP."* | **M3 — the raise** |
| **Day 300** | *"Eight verticals. One core. One ledger."* | M4 |

The reason **Day 210** is the moment: at M3 you can put an investor in front of a browser, let them type their own sentence, and watch a working ERP assemble itself over a real ledger. Not a mockup, not a video. Audit I put that moment at 15+ months because it measured the wrong thing. **With one more engineer it is five to seven months.**

And the sentence that makes the story land is the one your strategy already contains:

> *"We are not building twenty products and waiting. We built one, we sell it today, and we are generalising it one capability at a time — in public, funded by customers."*

That is a materially stronger position than "we have a vision," and it is *provably* true rather than aspirational.

---

## 10 — Final verdict

**Do this. It is the strongest version of the strategy you have proposed, and it is better than the recommendation I gave in Audit I.**

The correction I owe you: I told you the semantic layer was the cheapest first extraction. **It isn't. Composition is** — because `tenant_plan_overrides`, 269 catalogued capabilities, `PlanGate`, `EnsurePlanFeature` and 134 enforcement points already exist. You built the composition engine and mislabelled it a support tool. Turning it into the product is the highest-leverage work available to you, and it is roughly a quarter of what I estimated.

**The three numbers to hold on to:**

- **90 days** to *"Build your own VenQore"* being live and sellable.
- **5–7 months with one more engineer** (9–13 solo) to *"Describe your business and VenQore assembles your ERP"* — the investor demo, entirely real.
- **Five verticals sellable today** with no new engines; **six more** behind one build (Scheduling + Resource + Period, 11–15 weeks).

**The one rule that decides everything:** never write tenant-specific code. Every "yes" becomes a registry entry that every customer gets, or it becomes a "not yet." Hold that line and this strategy compounds — each customer makes the platform more general instead of less. Break it once and you become a consultancy with an impressive codebase, which is a fine business and not the one you are trying to build.

