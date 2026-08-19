# READ ME FIRST

### What is in this folder, what order to use it in, and what I found in your repository

**Version 2 · 15 August 2026**
*Revised after a full route audit. Two claims in version 1 were wrong; both are corrected below and marked.*

---

## 1. The files

| File | What it is | Edit it? |
|---|---|---|
| **`config/modules.php`** | **The brain.** 46 modules. The only place the seven questions are answered. | Yes — carefully, with the Rulebook open |
| `config/qore.php` | The deny-list, the always-on platform routes, the frozen surfaces | Rarely. Adding is safe; removing almost never is |
| `config/ai_builder.php` | Pipeline, prompt rules, limits, 15 presets, fixtures, adversarial cases | Yes |
| `tests/…/ModuleRegistryIntegrityTest.php` | The test that makes the Rulebook enforceable | Only to add assertions |
| **`docs/PATCHES.md`** | **Nine edits to your repo, with line numbers.** Two are live bugs. | Apply, don't edit |
| `docs/THE_RULEBOOK.md` | The law. Governs you, your IDE agent and the AI | Rarely |
| `docs/AI_LAYER_SPEC.md` | How to build the AI layer, in order | Yes |
| `docs/MODULE_MAP.md` | The human map — **generated** | No — regenerate |
| `docs/ROUTE_OWNERSHIP.md` | All 931 route names → owning module — **generated** | No — regenerate |
| `tools/extract_routes.py` | Resolves route names properly (groups, nesting, `Route::resource`) | Yes |
| `tools/route_ownership.php` | Builds the ownership audit | Yes |
| `tools/generate_module_map.php` | Rebuilds the map from the registry | Yes |
| `tools/validate.php` | Offline structural check, no Laravel needed | Yes |

**Reading order, first time:** this file → `PATCHES.md` (two live bugs) → `THE_RULEBOOK.md` → `config/qore.php` → `config/modules.php` → `ROUTE_OWNERSHIP.md` → `AI_LAYER_SPEC.md`.

**Where they go:**

```
app-code/main-app/config/{modules,qore,ai_builder}.php
app-code/main-app/tests/Feature/Module/ModuleRegistryIntegrityTest.php
app-code/main-app/tools/{extract_routes.py,route_ownership.php,generate_module_map.php,validate.php}
extras/BRAIN/docs/*.md
```

---

## 2. Where the registry stands

| | |
|---|---|
| Modules | **46**, exactly the final build plan's numbering |
| Free on every plan | **44** (`ai_insights` metered, `marketplace_sync` add-on) |
| `live` | 42 |
| `building` | 2 — `services`, `quotations` |
| `beta` | 2 — `landed_cost`, `composite_items` |
| Max dependency depth | **3** (plan allows 4), no cycles |
| Route names in the app | **931** |
| **Unclaimed routes** | **0** |
| Catalog features mapped | **227 of 265**; the other 38 each have a documented home |
| Presets | 15 (three blocked on Services) |
| Open `verify` items | **98** |

**Zero unclaimed routes is the number that matters.** Every route name in your application now resolves to exactly one of: an owning module, a deliberate shared pair, an always-on platform surface, or a documented frozen surface. Nothing is ungated by accident — which means `EnsureModule` can be written against the registry and be *complete* on the first attempt.

---

## 3. Two corrections to version 1 of this document

I got two things wrong, both for the same reason: my first route audit grepped for `->name(...)`, which misses `Route::resource()` (registers seven names with no `->name()` call at all) and mis-resolves `Route::name('store.')` (a **static** `::` call, not a chained `->` one). Corrected with a proper stack-based parser.

**❌ v1 said: "`store.v3.warehouses.*` doesn't exist at all."**
**✅ It does.** `Route::resource('warehouses', V3\WarehouseController::class)->except(['show'])` at line 1936, inside the `store.v3.` group — six real names. The original Appendix A pattern was right and my correction was wrong. Multi-Location (#17) is `live` with a working nav item.

**❌ v1 said: "Restaurant routes sit outside the store group, so they're `restaurant.dashboard`, not `store.restaurant.dashboard`."**
**✅ They are `store.restaurant.*`.** `routes/web.php` has **two** separate `Route::name('store.')` groups — an outer one spanning lines 363–548 and a second at 1013–1866. The restaurant routes are in the first. Same for `store.api.occupancies.*`.

Both are now correct in the registry. The lesson is in the header comment of `tools/extract_routes.py`, because it will bite whoever audits this next.

---

## 4. What the audit found

**A paid feature is free right now.** The `proposals` resource is registered twice — line 1130 with `plan.feature:b2b_proposal_builder`, line 1518 without. Laravel keeps the last registration, so every tenant on every plan can use the B2B Proposal Builder. → **PATCHES.md P1**

**The POS route is unprotected.** `/pos` is declared at line 377 (no middleware) and line 1073 (`permission:pos.checkout`). Both resolve to `store.pos`; Laravel dispatches the first, so the unprotected one serves your point of sale. → **P2**

**`store.pos` is an exact name, not a prefix.** `store.pos.*` does not match it. Any gate written from the old draft would have left POS reachable with the module off. Both forms are listed.

**`store.v3.products.*` was swallowing two other modules.** Pricing Tiers and Units of Measure live at `store.v3.products.tiers.*` and `store.v3.products.uom.*`, nested inside a `{productId}` group. A wildcard on the parent claimed them for Products, leaving both modules owning nothing. This is the shared-prefix trap, and the ownership audit is what caught it.

**Products and Inventory share a controller — resolved.** The product catalogue is `store.inventory.index` (`/inventory/list` → `InventoryController@index`). Products #1 now owns the catalogue CRUD by explicit name; Inventory #16 owns the stock screens. Neither may ever use a `store.inventory.*` wildcard again. This was the most likely gate bug in the registry and it is closed by construction.

**Quotations is unbuilt, not thin.** Its entire surface is two POST routes: `quotations.store` and `quotations.convert-to-order`. No index, no create, no show, no page anywhere. A customer cannot open a quotation, so `beta` would have been a lie — **demoted to `building`**. Knock-on: B2B Proposals (#11) no longer requires it (Proposals has its own complete 11-route surface and stands alone), and the freelancer preset stays blocked.

**Services is worse than "no UI".** `ServiceEngine`, `ServiceJob`, `ServiceContract`, `SendServiceReminders` and `ServiceReminderMail` all exist. There is **no controller, no route containing "service", and no page directory.** Status `building`; the freelancer, salon and repair presets are `blocked_by` it.

**Six duplicate route registrations.** Park/recall ×4 (unprefixed at 1008–1011 *and* store-prefixed at 1525–1528), inventory search, customer search — plus `store.inventory.stock` and `.stock-levels` calling the same method. All eight forms are currently listed in the registry so no gate can be bypassed, but that is a workaround. → **P4, P5**

**Restaurant routes have no permission checks.** `restaurant.dashboard`, `.kitchen` and `.table.status` check nothing; any authenticated tenant user can open the kitchen display and change table status. Possibly deliberate for a tablet in a kitchen — but undocumented. → **P9**

**`Terms.php` has 25 keys and `composition` is not one.** Cookbook needs it, defaulted to *Recipe*. → **P3**

**Your feature catalog has duplicate numbers.** `#72` is both "A4 & Letter Invoice PDF Export" and "Supplier Performance Score". `#93` appears twice. `#257/#258/#259/#179/#182/#183/#92` are deliberate duplicates. Together they inflate "265 features" by about six. **Say 46 modules, never a feature count.**

---

## 5. The seven shared routes

Sharing is legal — but the gate must allow a shared route when **any** owning module is on, never "the first that matches". These seven are deliberate:

| Route | Shared by | Why |
|---|---|---|
| `store.parties.ledger` | Customers #3 · Khata #32 | the ledger view of the customer record |
| `store.reports.party-statement` | Khata #32 · Reports #42 | a khata report |
| `store.reports.tax`, `.tax-rate` | Tax #39 · Reports #42 | tax reports |
| `store.reports.loan-statement` | Loans #41 · Reports #42 | a loan report |
| `store.purchases.receive.store` | Purchases #25 · POs #26 | receiving against a PO |
| `store.manufacturing.rules` | Production #30 · Composite #31 | auto-deduction rules |

Four of the seven are reports, which is the clue: **Reports #42 auto-scales**, so a report is visible when its owning module is on. Build the report → module map next to `ReportController` and unit-test it — `store.reports.*` has 59 names and `store.v3.reports.*` has 15, and each one needs an owner or it 500s against a disabled module's tables.

---

## 6. What to do tomorrow

```
 1. Apply PATCHES.md P1 and P2 — two live bugs, ten minutes
 2. php artisan route:list --json > route_list_current.json
 3. Re-run: python3 tools/extract_routes.py routes/web.php > routes.txt
            php tools/route_ownership.php routes.txt      # expect unclaimed=0
 4. Fix the 11 failing tests → exit code 0
 5. Triage the 46 incomplete tests — finish or delete, in writing
 6. Fix the overlapping Manager dashboard (seeded layout or grid renderer)
 7. Apply P7 — growth_engine off on ltd_2 — BEFORE any AI work
 8. Drop config/qore.php + config/modules.php into config/
 9. Drop ModuleRegistryIntegrityTest.php into tests/Feature/Module/
10. Run it. DO NOT PROCEED UNTIL GREEN.
11. Delete the legacy_gate booleans the registry lists, from config/plans.php
12. Build tenant_modules + backfill; prove existing tenants are byte-identical
```

**Step 10 is the day that matters.** Expect the test to fail first time — that is its job. Every failure is a real thing that would otherwise have reached a customer.

---

## 7. One thing worth saying plainly

The registry describes **42 modules that work today** and is honest about the four that do not. It maps 227 of your 265 catalogued features into a place a customer can understand, accounts for the other 38, and — after the audit — leaves **not one route in your application ungated by accident**.

That is eight months of work becoming legible for the first time. Right now that value is spread across 716 backend files and roughly 300 pages, where nobody — not an investor, not a customer, not an AI — can see it. In `config/modules.php` it becomes a menu of things your software genuinely does.

**That is not documentation. That is the product.**

The 98 `verify` items are the remaining distance between "describes your software" and "provably describes your software". They are a day of clicking, not a rewrite.
