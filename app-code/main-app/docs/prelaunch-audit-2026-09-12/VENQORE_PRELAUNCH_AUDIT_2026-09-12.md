# VenQore — independent pre-launch audit

**Date:** 12 September 2026
**Commit audited:** `4980a8cb` on branch `v6-design-system-completion` ("feat(builder): integrate AI BusinessUnderstanding, lean preset resolution, conversational questionnaire, roadmap lead capture, and wide layout", 2026-09-12 04:53 +0500)
**Working tree:** clean for tracked files under `app-code/main-app` at capture time. Untracked working files present (`after.json`, `before.json`, `race1.err`, `route_list.json`, `statstrips.json`, `step4_*.txt`, `tests_hidden`, `temp_extract/`, `scratch/`) — none are loaded by the application.
**Client audited:** `app-code/main-app` only. `app-code/mobile-app` and `app-code/windows-app` were **not** audited; their server-side entry points (`routes/api.php` sync, heartbeat, terminal, DRM) were.
**Nothing in the repository was modified.** All work was done on an extracted copy in an isolated Linux container. One audit-only test file was written *in the copy* and is delivered separately, not committed.

## How claims in this document are supported

| Tag | Meaning |
|---|---|
| **[RUNTIME]** | Reproduced by executing the real application (Laravel 12.69.2, PHP 8.4.21, MariaDB 10.11 on a throwaway `amd_pos_test` database, `vendor/bin/pest -c tests/phpunit.xml`). Output quoted verbatim. |
| **[ROUTE]** | Produced from `php artisan route:list --json` + `Router::gatherRouteMiddleware()` on the booted app. |
| **[STATIC]** | Read from source with `file:line` citation. Not executed. |
| **[UNVERIFIED]** | Named explicitly. Never presented as passing. |

Environment commands: `composer install --no-scripts`; `mysqld_safe`; `php artisan migrate:fresh --force`; `php artisan db:seed --class=PlanFeatureMatrixSeeder`; `vendor/bin/pest -c tests/phpunit.xml`.

One environment fact you should know, because it affects how you read the existing suite:

`phpunit.xml.dist` and `tests/phpunit.xml` both pin `DB_CONNECTION=mariadb`. **The schema cannot be built on MariaDB.** `2026_02_04_171548_add_landed_cost_to_expenses.php:20` adds a FK from `expenses.purchase_id` (`char(36)`) to `invoices.id` (`uuid`); MariaDB's `uuid` type is not `char(36)`, so `migrate:fresh` dies with errno 150. It works under `DB_CONNECTION=mysql` because Laravel's MySQL grammar emits `char(36)` for `uuid()`. **Production is documented as MariaDB 10.5** (`CLAUDE.md`). Either production has never been built from migrations, or the documented engine is wrong. This is finding **P-02**.

**Correcting one of my own findings.** My working copy excluded `public/`, `storage/`, `node_modules/` and `tests/VerificationCenter/` to keep the transfer small. Six of the 18 suite failures I first recorded were caused by that exclusion, not by your code: three `Feature/Module` tests needing `public/build/manifest.json`, `PermissionBypassGuardTest` and two `RegistryDriftTest` failures needing `tests/VerificationCenter/registry/*.yaml`, `LaunchGateSelfTest` needing `quarantine.yaml`, and `FrontendSyntaxIntegrityTest` npx-fetching eslint 10 because `node_modules` was absent (your `package.json` correctly pins `eslint ^8.57.1`). **All of those files exist on your machine and I verified each one there.** They are not defects and are not counted as findings. §8.1 gives the corrected breakdown.

---

# 1. Verdict

**Do not launch on this commit.** Eight blockers: one is a cross-tenant data breach, one is a money-path silence, and six break the central promise in ways a customer meets in the first hour. Encouragingly, seven of the eight are one-line or one-command fixes — the damage is concentrated in wiring, not design.

The good news is specific and worth stating: **the server-side decision pipeline is correct.** Given "I run a plumbing service on my own, no stock", the system resolves `plumber` → `field_service`, enables exactly `services, customers, invoicing, payments, expenses, reports`, writes terminology `customer→Client, job→Job, product→Material, technician→Plumber`, and builds a derived nav reading `Invoices · Clients · Payments · Jobs · Expenses · Reports`. [RUNTIME]

```
[TERMS] tenant_terminology rows: {"customer":"Client","job":"Job","product":"Material","technician":"Plumber"}
[NAV]   ["invoicing=Invoices","customers=Clients","payments=Payments","services=Jobs","expenses=Expenses","reports=Reports"]
[MODULES visible] ["services","customers","invoicing","payments","expenses","reports"]
```

That is the promise working. The failures are all downstream of it: the React shell ignores the nav it was handed, the route registry mis-assigns ownership of the one route invoicing needs, and 41 store routes are claimed by nobody. The architecture is sound; the wiring at the edges is not.

### Where the promise holds

| Promise | Status |
|---|---|
| Customer describes business → correct business type and module set | **Holds** for single-trade businesses [RUNTIME] |
| Small number of useful questions, skippable, resumable | **Holds** — skip is a real server call recording the capability; state survives refresh via `sessionStorage` [STATIC, `ConversationalDiscovery.jsx:477-510`] |
| Optional deeper discovery | **Broken in the browser** — the route is missing from Ziggy (**BL-08**); server-side it works but is replayable without cost limit (**M-16**) |
| Reviewable proposal before anything is real | **Holds visually**; not bound to what is applied — **A-03** |
| Terminology follows the business | **Holds server-side**; ~37% applied in the UI — **C-06** |
| Only the chosen modules appear | **Broken** — **C-01 … C-05** |
| Only the chosen modules are reachable | **Broken** — **B-04**, **B-06** |
| Chosen workflows remain usable | **Broken** — **BL-02**, **BL-03** |

### Launch gates

| Gate | Blocking findings |
|---|---|
| **G1 — no cross-tenant data exposure** | BL-01 |
| **G2 — a chosen module works end to end** | BL-02, BL-03 |
| **G3 — an unchosen module is not reachable** | BL-04, BL-05 |
| **G4 — the AI does not promise what it cannot deliver** | BL-06, BL-07 |
| **G5 — the discovery flow completes in a browser** | BL-08 |
| **G6 — customer-facing claims are true** | H-02 |

---

# 2. The product contract: intended vs implemented

Before judging behaviour, here is the contract the code actually expresses, in the seven layers you asked for.

### 2.1 Always-on platform / internal foundations

`config/qore.php` defines `engines`, `denylist`, `always_on_routes`, `frozen_surfaces`, `history_sources`. 188 of 726 store routes are always-on [ROUTE]. The double-entry ledger, stock ledger and audit trail run for every tenant regardless of module state — correct, and the right design: a café with Inventory off still accumulates stock movements, ready for the day it switches on.

**Two defects in this layer.** `always_on_routes` contains three over-broad wildcards: `store.api.*` (neutralises 11 module-claimed routes including `store.api.sync.orders.batch`, which *creates sales*), `store.admin.*` (49 routes including bulk product/party import-export), and `store.legacy.*` (20 routes including whole-store data migration and **the backup download — BL-01**). `isAlwaysOn()` is checked *after* ownership at `EnsureModule.php:132`, so an always-on wildcard silently wins over an explicit module claim. [ROUTE]

### 2.2 Explicitly requested and confirmed modules

46 modules in `config/modules.php`; **43 live**, 3 not: `quotations` (`building`), `landed_cost` (`beta`), `composite_items` (`beta`). Written to `tenant_modules` by exactly one production writer, `ApplyConfigurationService::apply()`.

### 2.3 Hard dependencies explained and accepted

`requires` (all-of) and `requires_one` (at-least-one-of each set) are modelled properly, and `requires_one` is the load-bearing idea in this product — it is what lets a freelancer have Invoicing without carrying Products. `ModuleDependencyResolver::resolve()` returns `added[dep] = ['because', 'why']` so the UI can explain a cascade.

**Defect:** the path most visitors take (`POST /workspace/analyze`) does not use it. It calls `ModuleManifest::withDependencies()` (`WorkspaceBuilderController.php:313,340`), which returns a flat list with no explanation. [RUNTIME] confirms: `reasons=[]` for the plumber trace. The "cascade" message at `config/ai_builder.php:1195` has no caller.

### 2.4 Optional recommendations, off until accepted

`config/ai_builder.recommended` with a `default_on` flag. Honoured on one path (`analyze()` adds only `default_on`), ignored on the other (`OnboardingExperienceController::aiDiscovery()` passes `withRecommended: true` and `DiscoveryResolver::merge()` never reads `default_on`). **A-06.**

### 2.5 Rejections, skips, unanswered questions, uncertain inferences

`DiscoverySession` keeps `confirmed` / `rejected` / `skipped` as three separate arrays with correct mutual-exclusion semantics (`recordAnswer()` removes from the opposite list). This is modelled well.

**Defect:** all three live only in a cache entry with a 1800 s TTL. Nothing is persisted to the tenant. `finalizeProposal()` reads `confirmed` only. The client posts `modules[]` and nothing else. **A rejection is indistinguishable from a question never asked, ten minutes after signup.** **A-04.**

### 2.6 Module-level vs sub-feature vs presentation preference

`config/modules.php:150` states field-level settings are deferred to V1.2. Confirmed: no module carries a `settings` key. But a parallel per-tenant settings world exists outside the registry (`settings` table, `tenant_plan_overrides`, `ai_settings`), and several UI affordances are gated by *those* rather than by the module — e.g. Batch/Expiry fields key on `settings.batch_tracking_enabled` (`ProductModal.jsx:633`), POS return mode on a register toggle (`Pos.jsx:4813`). **This is the architecture gap, not a bug:** the registry cannot currently express "Inventory on, but no batch fields on the product form". Report it as a gap (**P-01**); do not invent a setting that isn't there.

### 2.7 Enablement vs entitlement vs permission vs release status vs relevance

`ModuleService` documents the three states correctly (`entitled` / `enabled` / `permitted`, `visible = all three`). Release status is enforced in `visible()` but **not** in `enabled()` — so a non-live module is hidden from nav while its routes stay open. That asymmetry is the mechanism behind **BL-06**.

### 2.8 What "off" means — the four dimensions, measured

| Dimension | Enforced? | Evidence |
|---|---|---|
| **Visibility** (nav) | Server yes, client **no** | `ModuleNavBuilder` correct; `OneGlanceLayout.jsx:603-714` ignores it |
| **API / URL execution** | **Partial** — 41 store routes unclaimed, 10 effectively unnamed, 11 overridden by `store.api.*`, all of `routes/api.php` ungated | [ROUTE] + [RUNTIME] |
| **Background work** | **No** — zero scheduled commands or jobs check module state | `grep ModuleService app/Jobs app/Console` → 0 |
| **Retained history** | **Yes** — disable writes `enabled=false`, never deletes | `ModuleService::write()` |
| **Re-enablement** | Yes, immediate | [RUNTIME] `EnsureModuleTest` passes |

---

# 3. Blockers

## BL-01 — Any store admin can download, e-mail or delete the platform-wide database dump

**Severity: Blocker. Cross-tenant data breach.**

`vq:backup` runs nightly at 01:30 (`routes/console.php:257`) and writes a full `SHOW TABLES` + every-row dump of the **entire platform database** to `storage/app/private/backups/backup-YYYY-mm-dd-HH-ii-ss.sql` (`BackupService.php:15-60`). The legacy store-scoped routes at `routes/web.php:1954-1956` expose it:

- `GET  /s/{slug}/admin-panel/backups/{filename}` → `BackupController@download` (`:88-95`) — `Storage::disk('local')->download('backups/'.$filename)`, **no ownership check**
- `POST /s/{slug}/admin-panel/backups/{filename}/email` (`:131-158`) — mails the file to an **attacker-supplied address**
- `DELETE /s/{slug}/admin-panel/backups/{filename}`

Guarded only by `permission:admin.settings_manage` — which every store owner holds. The route names are on the always-on list (`config/qore.php:242`), so the module gate never fires. Filenames are enumerable: the schedule is fixed daily, ≤ 60 guesses per day.

**[RUNTIME] — reproduced:**
```
[B-01] GET backups/{file} status=200 class=StreamedResponse
       content-disposition=attachment; filename=audit-probe-2026.sql
```
Performed as a freshly created store owner of an unrelated tenant.

**Blast radius:** every tenant's sales, parties, users, bcrypt hashes, and anything in the `settings` table (which includes `chatbot_api_key`, `smartcapture_api_key`).

**Fix — do this first, it is four lines.**
1. Delete the three routes at `routes/web.php:1954-1956` and the whole legacy `backups.*` group. The comment at `web.php:568-574` already believed this had been done.
2. Remove `'store.backups.*'` from `config/qore.php:242`.
3. If a platform-side backup UI is wanted, mount it under `SuperAdminMiddleware` only, and add a per-tenant ownership column to backups before any tenant-scoped route can reach one.
4. Give dumps random suffixes (`backup-{date}-{Str::random(16)}.sql`) so enumeration fails even if a route regresses.
5. Rotate `APP_KEY` and any API keys sitting in `settings` if this has ever been deployed with real tenants.

---

## BL-02 — An Invoicing tenant without POS cannot save an invoice

**Severity: Blocker. The chosen workflow does not work.**

`config/modules.php` assigns `store.sales.store` — the single POST that persists a sale or invoice — to **`pos`** (module 5, `:363`), not to `invoicing` (module 6). Invoicing owns `store.sales.index`, `.create`, `.invoice.create`, `.show`, `.edit`, `.update`, `.print` … but **not `.store`**.

So a tenant who chose Invoicing and not POS — the exact freelancer/B2B case the `requires_one [products, services]` design exists to serve — can open the invoice screen, fill it in, and gets a 403 on save.

**[RUNTIME] — reproduced:**
```
[INV-1] invoicing ON, pos OFF → POST /s/{slug}/sales status=403
        {"code":"module_disabled","module":"pos","label":"POS / Counter",
         "message":"This isn't part of your system yet — add it?"}
[INV-1] GET /sales/invoice/create status=200  (the screen opens; saving fails)
```

The `verify[]` array on module 5 already flagged this and it was never closed: *"Confirm whether `store.sales.store` is POS-only or shared with Invoicing (#6). If shared it must be listed in BOTH."* (`config/modules.php:382`).

**Fix.**
1. Add `store.sales.store` and `store.sales.lookup` to `invoicing.routes` in `config/modules.php`. `ModuleRouteMap` already implements OR semantics across owners (`EnsureModule.php:138-142`), so either module being on opens the route. No middleware change needed.
2. Do the same audit for every other shared write path. The shared-prefix trap is documented in the registry header but only applied to some modules. The ones to check: `store.sales.store` (pos/invoicing), `store.v3.sales.store` (currently under `store.v3.sales.*` → invoicing only; POS-only tenants using V3 have the mirror-image bug), `store.purchases.receive.store` (already correctly shared).
3. Add a test: for every module, provision a tenant with **only** that module plus its `requires`, and assert every route the module claims returns non-403. `PresetSmokeTest` does this per preset; it needs a per-module variant.

---

## BL-03 — A service-only business cannot reach its own service catalogue, and cannot bill a service

**Severity: Blocker. The highest-value segment is unusable.**

Two independent faults compound.

**(a) The Services catalogue lives behind the Products route.** `Services/ServiceNavTabs.jsx:33-38` links "Services Catalog" to `route('store.inventory.index') + '?type=service'`. `store.inventory.index` is owned by `products` (`config/modules.php:184`). A tenant with `services` on and `products` off is redirected away by its own gate.

**[RUNTIME]:**
```
[C-4.2] services-only → GET /inventory/list?type=service status=403
        code="module_disabled" module="products"
```

**(b) An invoice line requires a saved product row.** `MoneyDocument.jsx:259` keeps only lines with `i.product`; server-side `SaleController.php:46` and `StoreSaleRequest.php:27` require `items.*.product_id` with `exists:products,id`. There is no free-text or service line. To invoice two hours of labour, a plumber must first create a catalogue row through a module he was told he doesn't need.

**Fix.**
1. Give `services` its own catalogue route — `GET /s/{slug}/services/catalogue` → `InventoryController@index` with `type=service` forced — and claim it under `services` in the registry. Point `ServiceNavTabs` at it. One route, one registry line, one JSX line.
2. Make `items.*.product_id` `nullable` and accept `description` + `price` + `quantity` for an ad-hoc line. The table already exists: `ad_hoc_lines` is listed under `invoicing.owns_data` (`config/modules.php`) and has a migration — the storage is built, the validation forbids it. Wire `SaleController::store` to write an ad-hoc line when `product_id` is absent and `description` is present, and relax `DocumentLines.jsx`'s `validLines` filter to match.
3. `ServiceOnlySaleTest` (9 tests, all passing) proves the *ledger* handles a service sale correctly — `a_service_sale_records_no_cogs`, `a_service_sale_moves_no_stock`. The engine is right; only the intake path is wrong.

---

## BL-04 — 41 store routes are claimed by no module and pass the gate; the whole Table Service screen is among them

**Severity: Blocker. "Off" does not mean off.**

[ROUTE] inventory of the booted router:

| Metric | Count |
|---|---|
| Total routes | 1143 |
| Store-group routes (`s/{store_slug}/…`) | 726 |
| Claimed by ≥ 1 module | 487 |
| Always-on / frozen | 188 |
| **Unclaimed and not always-on → pass straight through** | **41** |
| …of which read or write module-owned data | **33** |
| Named only `store.` (unnamed inside the group → `ownersOf()` returns `[]`) | **10** |
| Module-claimed but neutralised by the `store.api.*` wildcard | **11** |

The largest leak: **all 26 `store.tables.*` routes** — floor plan, open/close, merge, split, transfer, send-to-kitchen (KOT), service charge — plus `store.restaurant.kitchen.state`, `order.bump`, `order.recall`. `table_service` claims only `store.restaurant.dashboard|kitchen|table.status|order.status` and `store.api.occupancies*` (the last three inert, being `store.api.*`). The `tables.*` group at `routes/web.php:1219` was added after the registry was written and never claimed.

Also unclaimed: the five `store.api.manufacturing-rules` routes (auto-manufacturing rules = Cookbook/Production data) — these are *unnamed*, so Laravel names them `store.`, and `ownersOf('store.')` is empty; `store.new-pos`; `store.new-invoice`.

**[RUNTIME] — a retail tenant with `table_service`, `cookbook` and `production_runs` all OFF:**
```
[B-04] tables=200  tables/state=200  manufacturing-rules=200
       kitchen/state=200  cookbook(control)=403
```
The control proves the gate works when a route is claimed. These four are simply invisible to it.

`ModuleRouteMap.php:24` asserts *"ROUTE_OWNERSHIP.md already proves zero routes are unclaimed"*. That is false at runtime.

**Fix.**
1. Add to `table_service.routes`: `store.tables.*`, `store.restaurant.*`. Add `store.new-pos` to `pos`, `store.new-invoice` to `invoicing`.
2. Name the manufacturing-rules routes (`->name('manufacturing.rules-api.index')` etc.) and claim them under `production_runs`.
3. Triage the remaining unclaimed 41 explicitly: each is either claimed by a module or added to `qore.always_on_routes` with a one-line reason. No silent third category.
4. Split `store.api.*` into explicit always-on names. As a wildcard it currently un-gates `store.api.sync.orders.batch`, which posts sales.
5. **Add the integrity test that would have caught all of this:** iterate `Route::getRoutes()`, and for every route whose URI starts with `s/{store_slug}`, assert `ModuleRouteMap::ownersOf($name) !== [] || ModuleRouteMap::isAlwaysOn($name)`, and assert `$name !== 'store.'`. Fail with the route list. This is ~15 lines and it is the single highest-value test in the remediation.

---

## BL-05 — Three tenant-creation paths write zero `tenant_modules` rows, so every module is on

**Severity: Blocker.**

`ModuleService` fails open by design, and documents why (mid-backfill deploys). Three of its four fail-open branches are permanent, not transitional:

```php
// app/Services/ModuleService.php
77  if (!array_key_exists($moduleKey, config('modules', []))) return true;  // unknown key
83  if ($map === []) return true;                                           // unconfigured tenant
87  return $map[$moduleKey] ?? true;                                        // key absent from a configured tenant
```

Only the public builder path calls `apply()`, which writes all 46 rows (true/false). These do not:

| Path | Rows written |
|---|---|
| `StoreController::store` (`POST /my-stores`, the classic form) | **0** |
| `ProvisionTenantJob` (Lemon Squeezy purchase) | **0** |
| `TenantCloner::cloneFrom` (demo/clone) | **0** |

**[RUNTIME]:**
```
[B-03] tenant_modules rows for StoreProvisioner::create without 'modules': 0
       → allEnabled() returns 46/46, cookbook ON, quotations (building) ON
[B-03b] key deleted from a configured tenant → enabled() still returns true
```

Line 87 has a second consequence: **any module added to the registry after today is silently enabled for every existing tenant**, nav and routes included. There is no `default_enabled` flag anywhere.

**Fix.**
1. `StoreProvisioner::create()` must always call `apply()`. When `modules` is absent, use `BusinessTypes::coreModulesFor($businessType)`, else the 5-module default already at `StoreProvisioner.php:288`. One `if` removed.
2. Route `ProvisionTenantJob` through `StoreProvisioner`.
3. Add `tenant_modules` and `tenant_terminology` to `TenantCloner`'s table list.
4. Add `'default_enabled' => bool` to the registry schema; change line 87 to `?? config("modules.{$moduleKey}.default_enabled", false)`. Set `true` on everything shipping today so existing tenants are unaffected, `false` for anything added later.
5. Keep the `$map === []` rail (line 83) behind a dated flag, add `php artisan modules:backfill` to write explicit rows for any tenant with zero, run it, then delete the rail.
6. Production query to size the exposure before fixing: `SELECT COUNT(*) FROM tenants t LEFT JOIN tenant_modules m ON m.tenant_id = t.id WHERE m.id IS NULL;` **[UNVERIFIED]** — no production access.

---

## BL-06 — A forged signup enables `building` and `beta` modules; the route gate honours them

**Severity: Blocker (security + honesty).**

`ModuleDependencyResolver::validate()` (`:309-334`) — described in `ApplyConfigurationService` as the last line of defence — checks unknown keys, `requires` and `requires_one`. It **never reads `status`**. `StoreProvisioner.php:284` intersects with *all* registry keys, live or not. `ConfigurationValidator`, which *does* filter non-live (`:123-127`), is only on the conversational finalize path.

**[RUNTIME] — unauthenticated POST to the public signup endpoint:**
```
[A-1.1] POST /workspace/provision status=200 → tenant created
[A-1.1] tenant_modules rows: {"composite_items":1,"landed_cost":1,"quotations":1}
        ModuleService::enabled(quotations) = true    ← route gate open
        ModuleService::visible(quotations) = false   ← hidden from nav
[A-1.1b] resolver->validate([... quotations, landed_cost, composite_items]) → [] (valid)
```

Same hole in `OnboardingExperienceController::applyPreset()` (`:152`), the OTP `completeSignup` path, and the Google OAuth callback — all four replay the client's `modules[]`.

The customer-visible failure: unfinished screens reachable by URL, in a product whose registry header says *"An aspirational entry here becomes a lie the AI tells a paying customer."*

**Fix.**
1. In `ModuleDependencyResolver::validate()`, reject any key whose `status !== 'live'`: `$problems[] = "{$label} is not available yet.";`
2. In `StoreProvisioner.php:284` and `OnboardingExperienceController.php:152`, filter on status as well as existence.
3. Make `ApplyConfigurationService::apply()` call `resolve()` itself rather than trusting callers, and refuse when `questions !== []`.
4. Add to `ModuleRegistryIntegrityTest`: `validate()` must reject every non-live key.

---

## BL-07 — Eight of seventeen discovery capabilities map to module keys that do not exist

**Severity: Blocker. The AI confirms a need and delivers nothing.**

`CapabilityRegistry`'s `implies_modules` reference keys absent from `config/modules.php`. `resolveModules()` intersects against live keys (`:950`), so they vanish silently, and the proposal still reports ≥ 0.90 confidence.

| Capability | Declares | Real key | Result of confirming it |
|---|---|---|---|
| `customer_khata_credit` | `credit_sales` | `khata_credit` | **no khata** |
| `table_and_kot_management` | `tables`, `kitchen_display` | `table_service`, `park_recall` | **no tables, no KOT** |
| `serial_imei_tracking` | `serial_numbers` | `serials` | **no serial tracking** |
| `multi_branch_warehouses` | `branches` | `multi_location` | no branches (transfers only) |
| `repair_job_tracking` | `repairs` | `services` | **no job tracking** |
| `spare_parts_and_labour` | `repairs` | `services` | no jobs |
| `food_delivery_dispatch` | `delivery_orders` | — (closest `sales_orders`) | nothing |
| `appointment_scheduling` | `appointments`, `staff_roster` | — | nothing |

**[RUNTIME]:**
```
[A-4.1] customer_khata_credit    → ["products","pos","expenses","reports","customers","sales_orders"]   (no khata_credit)
        table_and_kot_management → ["products","pos","expenses","reports"]                              (no table_service)
        serial_imei_tracking     → ["products","pos","expenses","reports","inventory"]                  (no serials)
        repair_job_tracking      → ["products","pos","expenses","reports","customers"]                  (no services)
[A-4.1] implies_modules keys absent from config/modules.php:
        {"repair_job_tracking":["repairs"],"spare_parts_and_labour":["repairs"],
         "multi_branch_warehouses":["branches"],"serial_imei_tracking":["serial_numbers"],
         "table_and_kot_management":["tables","kitchen_display"],
         "food_delivery_dispatch":["delivery_orders"],"customer_khata_credit":["credit_sales"],
         "appointment_scheduling":["appointments","staff_roster"]}
```

`customer_khata_credit` is the **highest-priority question for pharmacy, grocery and wholesale** (`tradeMatrix()`). Every one of those conversations ends with a confident proposal that omits the thing the customer just said yes to.

**Fix.**
1. Correct the eight maps: `repairs→services`, `branches→multi_location`, `serial_numbers→serials`, `tables→table_service`, `kitchen_display→park_recall`, `credit_sales→khata_credit`, `delivery_orders→sales_orders`, `appointments→services`+`sales_orders` (or delete the capability until an Appointments module exists — do not approximate it). Same for `contradictedModules()`, which removes a non-existent `staff_roster` (`:758`).
2. **Add the test that makes this impossible again:** every key in every `implies_modules`, `contradictedModules`, preset `core`/`modules`, `recommended`, and `business_types` extras must exist in `config/modules.php` and be `live`. One test, five assertions, catches a whole class.

---

## BL-08 — "Ask me a few more" throws in the browser: the deepen route is missing from Ziggy

**Severity: Blocker. The optional-deepening step of the promised flow cannot run.**

`resources/js/ziggy.js` contains `workspace.converse.start`, `.step` and `.reset` — but **not `.deepen`**. Verified directly on your machine:

```
$ grep -o "workspace\.converse\.[a-z]*" resources/js/ziggy.js | sort -u
workspace.converse.reset
workspace.converse.start
workspace.converse.step
```

`BuildWorkspace.jsx:830` calls `route('workspace.converse.deepen')` from `deepenQuestions()`, bound to the "Ask me a few more" button at `:1419-1424`. Ziggy throws *"route is not in the route list"* for any name it does not hold, so the button fails at the click — no network request, no fallback path.

Your own suite catches this and is currently red on it — `Tests\Routes\FullRouteSweepTest > every laravel route is present in ziggy` [RUNTIME]:

```
Routes exist in Laravel but are missing from resources/js/ziggy.js.
Missing entries:
  - workspace.converse.deepen  [POST workspace/converse/deepen]
Fix: php artisan ziggy:generate  (then rebuild the frontend)
```

The route was added in the current HEAD commit (`4980a8cb`, the builder integration) and Ziggy was not regenerated with it. The refine-further step is the one you specifically named as part of the desired discovery experience — "an invitation to refine it through optional relevant questions" — and it is the only part of that flow that is dead on arrival.

**Fix.**
1. `php artisan ziggy:generate && npm run build`, commit both.
2. Add `ziggy:generate` to the build script in `package.json` so the file cannot go stale again — `FullRouteSweepTest` already guards it, so this is a one-command fix plus a pre-build hook.
3. While you are there: `deepenQuestions()` has no try/catch around the `route()` call, so any future Ziggy gap is a silent dead button rather than a handled error. Wrap it and surface a retry, as `askQuestion()` already does.

---

# 4. High-severity findings

## H-01 — The frontend ignores the module truth it is given

The middleware shares `modules` (from `ModuleService::allVisible`) and a fully-derived, terminology-aware `nav` (`HandleInertiaRequests.php:184-192`). **Four of 320 page files and four of 178 components read `modules`.** The nav prop is never rendered.

`OneGlanceLayout.jsx:603-714` hardcodes 9 groups and ~70 sub-labels, then filters them through a hand-maintained **English-label → module** map (`:726-812`) plus a second label → route map in `SidebarItem.jsx:207-322` (106 entries). `props.nav` is read once, at `:855`, only to build a Set of routes. Three maps, three drift surfaces.

Wrong owners in that map, each mis-hiding or mis-showing a real thing:

| Label | Mapped to | Should be | Consequence |
|---|---|---|---|
| E-Invoicing | `invoicing` | `tax_compliance` | FBR e-invoicing shown to every invoicing tenant |
| Growth Engine | `reports` | `ai_insights` | shown with AI Insights off |
| Fund Management | `bank_accounts` | `cash_register` | hidden from cash-register-only tenants |
| Orders | `sales_orders` (routes to the **invoice list**) | `invoicing` | an invoicing tenant with Sales Orders off has **no sidebar link to its invoices** |
| Parties | `khata_credit` | `customers`/`suppliers` | contacts hidden unless khata is on |

A POS-only owner loses the entire Sell group (`:617-621, 909-910`) — the only POS entry left is the standalone button.

**Fix.** Render the sidebar from `props.nav` — it already carries `key`, `route`, `label` (termed), `icon`, `order`, `group`. Delete `SUBITEM_MODULE`, `SUBITEM_ROUTES` and `SidebarItem.routeMap`. Keep only Dashboard / Settings / Administration static. Add the missing `nav` entries to `config/modules.php` for anything that should appear but has none (`ModuleNavBuilder` already skips modules with an empty `nav` by design, so a few sub-surfaces need registry entries rather than hardcoded labels). This one change also fixes half of C-02 and all of the terminology gap on nav.

## H-02 — "Every plan includes the whole system" is not true

Marketing states it flatly and repeatedly: *"140+ modules, nothing charged extra"*, *"Every plan includes the whole system"* (`Features.jsx:67,68,95`), *"Every plan carries universal business modules … and all reports"* (`Pricing.jsx:68`), plus an "In every plan, at every price" table row (`Pricing.jsx:250`).

The registry agrees — 42 of 46 modules are `billing: included`. The **database does not**. `PlanFeatureMatrixSeeder` still sets these to `'0'`, verified against the seeded `plan_limits` table [RUNTIME]:

| Feature key | Off on | Module (registry says `included`) | Routes still 402 |
|---|---|---|---|
| `recurring_invoices` | solo | recurring_invoices | 7 |
| `invoice_reminders` | solo | recurring_invoices | 4 |
| `multi_branch` | solo, starter, core, ltd_1 | multi_location, stock_transfers | 4 |
| `bank_reconciliation` | solo | bank_reconciliation | 2 |
| `e_invoicing` | solo | tax_compliance | 3 |
| `fund_management` | solo | cash_register | 5 |
| `owners_daily_pulse` | solo, ltd_1/2/3 | staff_attendance | 1 |

Migration `2026_08_16_000300_include_every_module_on_every_plan.php` claims (`:42`) to set every module key to `'1'` on every plan. Its `up()` only re-runs the seeder (`:122`). The `NOW_FREE` list at `:88-108` exists and is **never used**.

**[RUNTIME] — Solo tenant, `recurring_invoices` enabled in the builder:**
```
[B-05] status=403 {"type":"plan_limit","feature":"recurring_invoices",
       "message":"Recurring Invoices are available on paid plans.",
       "upgrade_target":"starter","upgrade_url":"..."}
```

So the customer is told "add it?", adds it, and is then told to upgrade — the exact outcome `EnsureModule`'s docblock (`:58-63`) says must never happen, and a refund trigger.

**Fix.**
1. In the migration, actually run the `UPDATE plan_limits SET value='1' WHERE key IN (NOW_FREE)` the file already prepared, and fix the seeder rows so a fresh install matches.
2. Delete the `plan.feature:` middleware for those seven keys from `routes/web.php` (140 `plan.feature:` usages remain overall; `growth_engine` and `woocommerce` are intentionally metered/addon and should stay).
3. Add a test asserting: for every module with `billing === 'included'`, its `legacy_gate` key is `'1'` on every plan slug. This is the only way the two lists stay honest.
4. If any of these are meant to stay paid, that is a **pricing decision** — then the marketing copy and the registry's `billing` field must change, not the middleware.

## H-03 — No binding between the proposal reviewed and the configuration applied

`provision()` validates `'modules' => 'required|array'` and forwards `$request->input('modules')` verbatim. The conversational proposal is validated and cached, but the `session_id` is never sent to `/workspace/provision`; the client posts `activeModules` only (`BuildWorkspace.jsx:867-878`). Safety rule 8 (*"A proposal is ALWAYS shown before apply"*, `config/ai_builder.php:72`) is a UI convention, not a property. Combined with BL-06, a modified client or a stale tab can apply any set.

**Fix.** Return a signed token from `analyze()` / `finalizeProposal()`: `hash_hmac('sha256', json_encode([$sortedModules, $terms, $preset]), config('app.key'))`. Require it on `/workspace/provision`. Recompute the set server-side from the token plus explicit user deltas, each delta re-validated through `ModuleDependencyResolver`. This also gives you the audit trail for "what did the customer actually agree to".

## H-04 — Rejections are forgotten, and the in-app re-proposal puts them back

`DiscoverySession.rejected` / `.skipped` never leave the cache (§2.5). `OnboardingExperienceController::aiDiscovery()` rebuilds from `$chosenPreset['modules']` (the full list, not `core`) with `withRecommended: true` (`:116-123`). A pharmacy that said no to khata and suppliers in the conversation gets `khata_credit, suppliers, purchases, payments, barcodes_labels` proposed again. `BuilderController::show()` lists all 43 live modules with no "you said no to this" marker.

**Fix.** Persist exclusions — either a `tenant_module_exclusions` table or a JSON column on `tenant_config_versions` — written from the signed proposal token (H-03). Have `BuilderController::show()` and `aiDiscovery()` read it and render rejected modules greyed with "you turned this down on {date} — add anyway?". Absence of a request is not consent; an explicit refusal must outlive the cache.

## H-05 — Readiness confidence measures answered-questions and is floored at 90%

`calculateReadinessConfidence()` scores `0.55 + 0.40 × (impact of priority capabilities that are confirmed **or rejected**) / total`. Rejecting everything scores as highly as confirming everything. `finalizeProposal()` then applies `max(0.90, …)`.

**[RUNTIME]:**
```
[A-4.3] readiness=0.3, every priority capability REJECTED
        → confidence=0.9
        → modules=["products","pos","inventory","expenses","reports"]
        → "Great! I have all the details needed to build your tailored VenQore workspace."
```

A number presented as confidence, which cannot go below 90%, next to a claim of completeness, is a customer-facing falsehood — and you asked specifically that a confidence number must not be presented as operational readiness.

**Fix.** Rename the field `coverage` and label it "questions answered: 4 of 6". If you want a real confidence figure, derive it from something measurable: fraction of proposed modules carrying a `why`, count of unresolved priority capabilities, and `guessPresetDetailed()['matched']`. Remove the `max(0.90, …)` floor and the "I have all the details" copy when coverage is low — say "here's a starting point; you can refine it any time" instead.

## H-06 — Only `yes`/`no` resolve a capability; roughly 40% of the offered options are inert

`step()` (`:187-196`) confirms on `selectedOptionKey === 'yes'` or a yes-regex, rejects on `'no'` or a no-regex, and does nothing otherwise. The seed options carry keys like `solo`, `counter`, `invoice`, `both`, `none`, `handful`, `lots`, `planning`, `cash_only`, `walkin`, `parts_only` — and each option carries an `implies` value that **is never read anywhere** (`grep implies ConversationalBuilderService.php` → 0).

Consequence: `stock_volume` can never be resolved (it has no yes/no option), so it is re-offered until the 4-turn budget runs out. "Just me", "They pay on the spot", "None really", "Hundreds or more" all resolve nothing. "No, one price for all" works — by accident, via the `\bno\b` regex.

**Fix.** Read the option's own `implies`: if `implies === $targetCapability` confirm, if the option is a declared negative reject, if `custom` treat as skip. Failing that, map the ~16 known keys explicitly in `step()`. Add a test asserting every seed option on every capability resolves to confirm, reject or skip — none to "nothing".

## H-07 — Substring matching on 2–5 letter keywords produces wrong trades, and negation is not understood at all

`detectStructuredFacts()` uses `str_contains` on a keyword list including `spa`, `mart`, `shoes`, `bread`, `solo`.

**[RUNTIME]:**
```
[A-6.1] "we sell spare parts for cars"   → trade:salon      ("spa" ⊂ "spare")
        "smart phone accessories"        → trade:grocery    ("mart" ⊂ "smart")
        "I sell horseshoes and saddles"  → trade:clothing   ("shoes" ⊂ "horseshoes")
        "solomon islands handicrafts"    → solo             ("solo" ⊂ "solomon")
        "we have no POS, just invoices"  → {}               (negation invisible)
        "no repairs here, only sales"    → trade:repairs    (negation inverted)
```

These facts drive trade filtering, terminology and the detected preset. The correct matcher already exists in the same codebase — `ConfigurationAIService::matchesAlias()` (`:319-331`) is word-boundary and its docblock documents this exact bug class ("'nag' matched 'manage'"). It was fixed there and not here.

**Fix.** Replace `str_contains` with `matchesAlias()`, or delete this extractor entirely and rely on `BusinessTypes::match()` (already tokenised, plural-folding, 1-edit-typo-tolerant) plus `BusinessUnderstanding`. Add negation handling: a `\b(no|not|don'?t|without)\s+(\w+\s+){0,2}` prefix window before a keyword inverts it to an explicit rejection fact. Fixture-test every string in the table above.

## H-08 — The modification parser toggles real modules from unrelated words

`ModificationParser::matchModule()` (`:262-266`) uses `str_contains` against module aliases as short as `pos`, `ai`, `po`, `kg`, `set`, `due`, `pay`, `nag`. `BuilderController::modify()` applies the result immediately, writes a version snapshot, and returns `success: true`.

**[RUNTIME]:**
```
[A-6.2] "add a deposit box"        → ENABLE  pos
        "remove the purpose field" → DISABLE pos
        "I want to add compost"    → ENABLE  pos
        "remove nag"               → DISABLE variants
```

"Remove the purpose field" switches off the till for the whole shop.

**Fix.** Same fix as H-07 — use `matchesAlias()`. Additionally: require aliases under 4 characters to match as whole words only; when two modules tie, ask instead of silently picking by label order; and never apply a DISABLE from free text without an explicit confirmation step showing the cascade.

## H-09 — Builder's disable guard is inverted; `modify` reports success without disabling

`BuilderController::apply()` (`:151-163`) computes `$beingRemoved = array_diff($currentlyEnabled, $result['modules'])` and then calls `canDisable($currentlyEnabled, X)`. But `resolve()` has already re-added any module that a surviving module requires — so anything genuinely in `$beingRemoved` has all its dependents also being removed. The check therefore only ever fires on legitimate cascade removals.

**[RUNTIME] — a tenant with `products, pos, expenses, reports` unticking both `products` and `pos`:**
```
[A-1.6] status=422 {"reason":"disable_blocked","module":"products",
        "message":"POS / Counter needs Products. I can remove both, or keep Products just for POS / Counter."}
```
The message offers a choice the code will never accept: removing both is exactly what the customer asked for, and it is refused. The `messages.disable_load_bearing` path is unreachable.

`modify()` (`:214-221`) has the mirror bug: "remove products" while POS is on → `resolve()` re-adds products → the guard passes → `apply()` writes the unchanged set → `success: true` with a question that has no follow-up.

**Fix.** Check dependents against the **target** set, not the current one: `$stillOn = array_intersect(ModuleService::dependents($x), $result['modules']); if ($stillOn) block;`. For `modify()` DISABLE, when `resolve()` re-adds the module, return 422 with the cascade list and a `confirm` flag — never `success: true`.

## H-10 — Write paths are missing the subscription / view-only lock

517 of 726 store routes carry neither `SubscriptionLifecycleMiddleware` nor `EnforceHostedUntil` [ROUTE]. The group at `routes/web.php:1117` omits both, and the comment at `:2232-2234` claims parity with the v3 group that has them.

**[RUNTIME]:**
```
[B-02] write routes without lifecycle/hosted-until middleware:
       store.sales.store, store.purchases.store, store.expenses.store,
       store.payments.store, store.production.store
```

A tenant past subscription end, or over usage limits plus grace, keeps posting sales through the primary screens.

**Fix.** Add `'lifecycle'` and `EnforceHostedUntil::class` to the group at `:1117` and to the `routes/api.php:23` sync group. Add a test walking all `s/{store_slug}` non-GET routes asserting both are present.

## H-11 — A logged-in non-member can enumerate another tenant's module configuration

`EnsureModule` runs **before** `TenantMiddleware` [ROUTE — position 12 vs 19] and resolves the tenant itself from the URL (`:88-93`), before membership is checked.

**[RUNTIME] — owner of tenant B requesting tenant A's URLs:**
```
[B-07a] A/cookbook (module OFF) = 403 code="module_disabled"
        A/pos      (module ON)  = 302 → /hub
```
The two responses differ, so any authenticated user can map any tenant's configuration and confirm slug existence.

The same block also has a `segment(2)` fallback that binds `current.tenant` on **every** web route. `SubdomainGenerator::RESERVED` does not reserve route words, so a store named "Provision" takes the slug `provision`, and every subsequent `POST /workspace/provision` by any visitor runs with that tenant bound — `HasTenant` then scopes reads and stamps writes with it. I did not trace every write on every affected route, so the exploitability beyond context confusion is **[UNVERIFIED]**, but the binding itself is certain.

**Fix.** Register `EnsureModule` on the three store route groups instead of globally on `web`, positioned after `TenantMiddleware`, and have it read only `app('current.tenant')` — never the URL. Add all first path segments of non-store routes and all `/tools/*` slugs to `SubdomainGenerator::RESERVED`.

## H-12 — Nothing in the background respects module state

Zero scheduled commands and zero jobs reference `ModuleService` (`grep` over `app/Jobs`, `app/Console`, `routes/console.php` → 0 hits). Five of them send e-mail on module-owned data:

| Schedule | Command | Module it ignores | Side effect |
|---|---|---|---|
| daily 00:01 | `recurring-invoices:generate` | recurring_invoices | **creates sales + ledger rows** |
| daily 09:00 | `inventory:send-low-stock-alerts` | inventory | e-mail to owner |
| daily 10:00 | `invoices:send-payment-reminders` | recurring_invoices / khata_credit | **e-mail to customers** |
| daily 08:30 | `services:send-reminders` | services | e-mail |
| 00:05 | `staff:generate-daily-summaries` | staff_attendance | DB writes |
| 06:30 + hourly | `growth:analyze` | ai_insights (+ plan `growth_engine`) | AI spend for tenants who cannot see the output |

Offline POS sync is worse: `Api\SyncController::batchOrders` builds a synthetic Request and calls `SaleController::store()` directly (`:234-237`), bypassing `EnsureModule`, `EnsurePlanFeature`, the lifecycle lock and the route's `permission:`. Orders queued before POS was disabled post unchanged; per-order exceptions are swallowed and the batch still returns 200.

**Fix.** `continue` unless `ModuleService::enabled($tenant, '<module>')` at the top of each tenant loop — six one-line guards. In `batchOrders`, refuse with 409 `module_disabled` (or park the orders) when `pos` is off, and route it through the real HTTP stack rather than calling the controller directly. Also: `finance:depreciate` exists and is **never scheduled**, so the live `fixed_assets` module never posts depreciation.

## H-13 — Dashboards, readings and insights have three disagreeing ownership maps

| Surface | Count | Module-gated |
|---|---|---|
| `DashboardRegistry` cards | 20 | **0** (uses data-existence probes; 6 query the DB directly) |
| Reckoner readings (`MODULE_MAP`) | 60 | 29 — 11 with an obvious owner are missing: `reminders.count`, `recurring_invoices.*`, `batch_tracking.*`, `proposals.count`, `purchase_orders.count`, `sales_orders.count`, `returns.*` |
| `InsightCatalog` | 35 | **0** |
| Client `READING_MODULE_RULES` (`NewDashboard.jsx:185-210`) | regex map | disagrees with the server |

`ModuleNavBuilder::cards()` exists to filter cards by module and has **zero callers**; no card carries a `module` key, so it would be a no-op anyway. The client map sends `proposals.*` → `quotations` — a `building` module that `allVisible()` never returns — so **proposals cards are hidden from every tenant, including those with B2B Proposals on**. `SPECIAL_MODULES` uses `'sales'` and `'finance'`, which are not module keys, making `store_health` permanently unavailable.

Two runtime bugs in the same area:
- `Reckoner`'s `has_restaurant` capability probes `restaurant_tables`, **dropped** by migration `2026_08_13_000001` (canonical tables are `positions`/`occupancies`). **[RUNTIME]** confirms `restaurant_tables` absent, `occupancies` present. Every restaurant tenant silently loses both restaurant cards.
- `OwnerDailyPulseService` requests `inventory.stock_value`, `finance.payables`, `finance.receivables`, `finance.total_liquidity` with `period: 'custom'`; those readings accept only `as_of`/`live`, so all four fail and are coerced to `0.0` (`:80`) — and then **e-mailed nightly** as the day's figures.

**Fix.** One ownership table, server-side: add the 11 missing `MODULE_MAP` rows; add `'module'` to every `DashboardRegistry` card from `config/modules.php`'s `cards` declarations and call `ModuleNavBuilder::cards()` in `availableFor()`; add `'module'` to each `InsightCatalog` entry and filter in `GrowthEngine`; emit module ownership through `api.reckoner.catalogue` and delete `READING_MODULE_RULES`. Re-point `has_restaurant` and `RestaurantSource::tablesOccupied` at `occupancies`. Use `as_of` for the four balance readings in the pulse and add a test asserting they are non-zero on seeded data.

## H-14 — Payment-failed, cancellation and refund e-mails are sent to nobody

**Severity: High. Money events, silently unannounced.**

Three Lemon Squeezy webhook jobs resolve their notification recipient the same wrong way:

```php
// HandleSubscriptionPaymentRefundedJob.php:88, HandlePaymentFailedJob.php:57,
// HandleSubscriptionCancelledJob.php:54
$adminUser = User::whereHas('memberships', function ($q) use ($tenant) {
    $q->where('tenant_id', $tenant->id)->where('role', 'platform_admin');
})->first();

if ($adminUser) {                       // ← always false in practice
    Mail::to($adminUser->email)->send(new SubscriptionPaymentRefundedMail(...));
}
```

`platform_admin` is a **platform-level** role, carried on `users.is_platform_admin` / `users.platform_role`. Store membership roles are `owner|admin|manager|cashier|viewer|accountant` — `tenant_users.role` is never `platform_admin`. The lookup returns `null`, the `if` skips, and the job logs success.

So: a customer's card is declined → no e-mail. Their subscription is cancelled → no e-mail. Their payment is refunded and **their tenant is suspended** (`:69` sets `status = 'suspended'`) → no e-mail. They discover it by finding themselves locked out.

Your suite catches all three and is red on them [RUNTIME]:
```
FAILED Tests\tests\Feature\Billing\RefundWebhookTest > a refunded subscription payment suspends the tenant and notifies the admin
       The expected [App\Mail\SubscriptionPaymentRefundedMail] mailable was not sent.
FAILED ... > refunding a purchase …
FAILED ... > a failed subscription payment …
```
(The fourth refund test passes — `order_refunded` → `OrderRefundNeedsReviewMail` goes to `config('mail.notifications.contact')` and does not use this lookup.)

**Fix.** `Tenant::ownerEmail()` already exists for exactly this (`Tenant.php:300-304`, via `ownerMembership()` → `role = 'owner'`). Replace the `whereHas` in all three jobs with it, and drop the `if ($adminUser)` guard in favour of a logged warning when no owner e-mail resolves — a money event that notifies nobody should be loud, not silent. Same root cause as L-12 (`SendTrialReminders` querying a non-existent `users.tenant_id`): there are three different wrong ways to find a store's owner in this codebase and one right one. Grep for the other two and delete them.

---

# 5. Medium findings

| ID | Finding | Fix |
|---|---|---|
| M-01 | `ApplyConfigurationService` invalidates the module cache **inside** the transaction, before commit (`:98-102`). A concurrent read repopulates the old map for the 300 s TTL — the builder says "applied" while nav and gate serve the previous config. | Move `ModuleService::invalidate()` and `Terms::invalidateCache()` into `DB::afterCommit()`. |
| M-02 | No concurrency control. `snapshot()` computes `max(version)+1` with no lock; the unique `(tenant_id, version)` index turns a second concurrent apply into an uncaught `QueryException` → 500 (`BuilderController` catches only `InvalidArgumentException`). | `lockForUpdate()` on the tenant row inside the transaction; map the unique violation to 409; accept an optional `expected_version` from the client. |
| M-03 | `restore()` and `history()` are implemented and have **no route and no caller**. Safety rule 10 ("with a working undo") is unwired. `dashboard` is always snapshotted as `[]` and `apply()` ignores the `dashboard` key entirely. | Wire `GET /builder/history` + `POST /builder/restore/{version}`; filter non-live keys in `restore()`; persist `config['dashboard']` or remove the parameter. |
| M-04 | `OnboardingExperienceController::applyPreset()` calls `apply()` with no `resolve()` and no try/catch → any incomplete set is a 500 with the exception text. | Mirror `BuilderController::apply()`: resolve, 422 on pending questions, catch. |
| M-05 | Provisioning **throws** on an unmet `requires_one` instead of resolving it. On the OTP path the user row is already created and logged in, the challenge is consumed, and then the tenant silently fails — the customer lands on `/hub` with no store and their builder answers gone. **[RUNTIME]** `InvalidArgumentException: Refusing to apply an invalid configuration: Sales Returns & Refunds needs one of: products or services.` | In `StoreProvisioner::create()`, call `resolve()` and take the first member of each pending set (as `BusinessTypes::withDependencies()` already does). Never throw after the user row exists; create the tenant before `Auth::login` and roll both back together. |
| M-06 | `DiscoveryResolver::merge()` ignores `default_on`, so the onboarding path merges all `recommended` modules (`reports, expenses, ai_insights`) without consent — contradicting `config/ai_builder.php:990-1013`. | Read `default_on` in `merge()`; show the rest in the labelled band only. |
| M-07 | `detected_preset` is a **trade** key, not a preset key. `repairs` and `electronics` match no preset and fall back to `retail_shop.core`. Last-match-wins, so "bakery … repair" resolves to `bakery` and "garment factory, apparel wholesale" loses the clothing preset. | Map trades to preset keys, or drop `detected_preset` and use `guessPresetDetailed()` (which already consults the 85-type catalogue). |
| M-08 | Mixed businesses collapse to one trade. **[RUNTIME]** `"bakery with home delivery and repair of coffee machines"` → `preset=bakery, modules=["products","pos","expenses","reports"]`. No delivery. No repair jobs. `reasons=[]`. | Let `BusinessTypes::match()` return multiple confident types and union their `coreModulesFor()`. Surface the second trade as a question ("you mentioned repairs — do you want job tracking?") rather than discarding it. |
| M-09 | Ambiguous-but-known trades degrade to `retail_shop` and pollute the demand log. "mobile shop, workshop for repairs" scores `phone_repair` 14 but `confident=false`, so `guessPresetDetailed` falls to `retail_shop`, `matched=false`, and a `feature_requests` row is written for a business the catalogue knows. | When the top candidates are all shippable, use the top one and show "Did you mean…" — do not log demand for a supported trade. |
| M-10 | `store.v3.reports.export` is mapped `null` (always visible) but exports trial balance, P&L, balance sheet, aged AR/AP, inventory valuation, purchases and tax. A tenant with `accounting_workspace` off still pulls the trial balance as CSV. | Map the `report` parameter to the same `ReportModuleMap` suffix and call `visible()` inside `export()`. |
| M-11 | `ReportsLayout.jsx:12-82` re-exposes all 40 reports in the left rail with no gating, undoing the correct server-side filtering that `ReportsHub` applies. Used by 37 report pages. | Filter `REPORT_GROUPS` through `props.modules` using the same map `ReportsNavigation` already has — better, ship `hiddenReports` as a prop and use it in both. |
| M-12 | Admin data export/import (`store.admin.data.*`, always-on) moves products, parties, sales, purchases, expenses with no module check; the legacy twin at `:1938` also lacks the `plan.feature:bulk_upload` gate its modern counterpart has. | Check `ModuleService::enabled()` per type; delete the legacy routes. |
| M-13 | IDOR candidate in `ReturnController::store`: `items.*.product_id` uses an unscoped `exists:products,id`, never tied to the sale line, then `DB::table('products')->where('id',…)->increment('stock_quantity')` raw and unscoped (`:442`). Price/tax/discount are client-supplied and drive the refund. **Not executed — candidate.** | `Rule::exists('products','id')->where('tenant_id', …)`; assert `product_id` matches the referenced `sale_items` row; derive price and tax from the original line. |
| M-14 | 20 of 85 `owns_data` entries (15 modules) name tables that do not exist, so the "N rows at stake" dialog under-reports — silently, because `dataAtStake()` skips missing tables. **[RUNTIME]** exact list below. | Fix the 6 renames (`price_tiers`→`product_price_tiers`, `uom_conversions`→`product_uom_conversions`, `staff_attendance`→`staff_attendances`, `signals`→`growth_signal_events`, `channels`→`ecommerce_channels`, `restaurant_tables`→`occupancies`); for the 8 modules whose data genuinely lives only in journal rows, either point at the journal `reference_type` or empty the array. Add `test_every_owned_table_exists`. |
| M-15 | `/workspace/analyze`, `converse/step` and `converse/deepen` each make a model call with **no turnstile** (only `throttle:30,1`). `VerifyTurnstileToken` also fails **open** on any Cloudflare network error, in every environment. | Add `turnstile` to `analyze` and `converse/step`; fail closed on upstream error in production. |
| M-16 | `converseDeepen()` is replayable: it resets `isComplete`, does not increment `turnCount`, and immediately makes a model call. Bounded only by the 60/IP/day anonymous limit. The "replays cannot burn tokens" comment (`WorkspaceBuilderController.php:699-702`) does not hold for deepen. | Guard on `depth === 1`; make deepen cost a turn. |
| M-17 | OTP dev master codes (`0000`, `000000`) are accepted when `APP_ENV=local` **and** (dev host **or** `$request->ip()` is private). No trusted-proxy configuration exists, so behind a load balancer the private-IP branch is true for every visitor. | Require `app()->isLocal() && config('app.debug')` **and** an explicit `VQ_OTP_DEV_MASTER_CODE` with an empty default; delete the private-IP branch; configure `trustProxies`. |
| M-18 | `BusinessUnderstanding::read()` caches a `'miss'` for 3600 s on **any** gateway failure including per-IP rate limiting, under a global key (sha1 of the sentence). One rate-limited visitor poisons that sentence for everyone for an hour. | Do not cache `rate_limited` / `spend_capped` outcomes. |
| M-19 | The test base class binds a fake tenant with `id => null, slug => 'test-store'`; both `EnsurePlanFeature` and `EnsureModule` treat that as "no tenant". Every test inheriting `Tests\TestCase` without `createTenant()` runs with plan and module gates **disabled**. | Make the fake tenant opt-in; assert in CI that `test-store` appears nowhere outside the base class. |
| M-21 | The plan rename (counter/growth/business → solo/starter/core/scale) shipped with four tests still asserting the legacy names, so they are red at HEAD: `Phase4PricingLiveTest` (`-'counter'` / `+'solo'`), `SubscriptionStatusMappingTest:97` and `Module11\BillingTest:157` (both `-'business'` / `+'scale'`). The application code is right — `PlanCatalog::canonical()` maps them correctly — but these are the three tests that would catch a genuine Lemon Squeezy variant→plan mis-mapping, and they currently always fail, so they protect nothing. | Update the assertions to canonical slugs. Add one test asserting `PlanCatalog::canonical()` maps every legacy alias, so the aliases stay covered after the rename. |
| M-20 | `EnsureModule`'s `slug === 'test-store'` bypass (`:83`) has **no environment guard**, unlike `EnsurePlanFeature` (`:35`, scoped to `testing`), and `test-store` is a registrable slug. **Correction to an earlier read:** this is *not* exploitable via URL — the middleware re-resolves the tenant from the route slug immediately after nulling it. **[RUNTIME]** `/s/test-store/cookbook` with cookbook off returned **403**, correctly gated. | Still add `&& app()->environment('testing')` for symmetry, and reserve `test-store` and `demo-store` in `SubdomainGenerator`. Low urgency, real smell. |

### M-14 detail — `owns_data` tables that do not exist [RUNTIME]

```
sales_returns   → sale_returns, sale_return_items      pricing_tiers  → price_tiers
park_recall     → parked_sales                          table_service  → restaurant_tables
pre_sales       → stock_reservations                    units_of_measure → uom_conversions
cash_register   → funds, cash_shortages                 bank_accounts  → bank_transfers
bank_reconciliation → bank_reconciliations              tax_compliance → tax_rates, einvoice_submissions
fixed_assets    → assets, depreciation_entries          loans          → loans, loan_repayments
ai_insights     → signals                               marketplace_sync → channels
staff_attendance → staff_attendance
```

Eight of these modules (`loans`, `fixed_assets`, `tax_compliance`, `bank_reconciliation`, `cash_register`, `bank_accounts`, `pre_sales`, `sales_returns`) name **no existing table at all**. Either their data lives only in journal rows — in which case the registry should say so — or the module is not what the registry claims it is. Worth a decision, not just a rename.

---

# 6. Low-severity findings and drift

| ID | Finding | Fix |
|---|---|---|
| L-01 | Discovery session is keyed by a bare server UUID with no binding to the browser session, IP or user. Anyone holding the UUID can advance or `forget()` it. **[RUNTIME]** reset-then-step returns `{"ok":false,"fallback":true,"message":"Session expired…"}` — degrades gracefully. | Bind to `hash(session()->getId())` at `start()`, check on `load()`. |
| L-02 | `ConfigurationAIService::propose()` has **no callers**. Its plan allowances (`onboarding_builds`, `reconfigure_monthly`, `modifications_monthly`) and `logUnsupported()` are dead. The `unsupported` field the roadmap depends on is returned to the client and never written to `feature_requests`. | Wire `unsupported` into the demand log, or delete the dead path and its config. |
| L-03 | `finalizeProposal()`'s terminology is always discarded: `resolveTerminology()` returns flat strings keyed `item/customer/sale/order`; `cleanTerminology()` requires `['singular','plural']` arrays with keys from `Terms::$fallbacks` (`item` is not one). Net result `[]`. | Return the correct shape; use `product` not `item`. |
| L-04 | `history_probe` (registry) and `qore.history_sources` have **no reader**. The documented "it was recording all along" screen does not exist. | Wire it — it is a genuinely good moment for a customer switching Inventory on — or delete both keys. |
| L-05 | `ReckonerCatalog.json` (58 keys, consumed by `NewDashboard.jsx:48`) is hand-maintained with no generator. Currently in sync; will drift on the next registry change. | `php artisan vq:reckoner:export` + a sync test, exactly like `test_site_json_is_in_sync_with_the_config` does for business types. |
| L-06 | `store.reports.analytics` is registered twice (`web.php:1473` and `:1787`) with different actions; name lookup resolves to the second, dispatch to the first. | Delete one. |
| L-07 | Two report routes are `abort(501)` stubs while listed in `ReportModuleMap::OWNERS` and linkable from the index: `discount-report`, `inventory-valuation` (`web.php:2162-2163`). | Implement or remove from both. |
| L-08 | 18 dead page files under `resources/js/Pages` (0 imports, 0 renders) — 16 legacy report pages superseded by `GenericReport`, plus `QrMenuPublic` and `HistoryUnlockedModal`. They still ship in the bundle via `import.meta.glob`. | Delete. |
| L-09 | `terms` is defined **twice** in `HandleInertiaRequests::share()` (`:190` and `:260`); PHP keeps the later literal. The first is dead code. | Delete the first. |
| L-10 | `AiRetentionService` is dead (0 callers) and reads the legacy `invoices` tables. | Delete. |
| L-11 | `amd:sync-stock` runs every 5 minutes and can do nothing: it queries under CLI with no tenant bound, so `HasTenant` hard-blocks it, and its HTTP call is commented out. | Remove the schedule entry. |
| L-12 | `SendTrialReminders` and `ProcessExpiredTrials` query `users.tenant_id`, a column that does not exist. | Use `TenantUser` membership, as `OwnerDailyPulseService` does. |
| L-13 | All 8 AI-assistant tools check permission keys (`sales_view`, `pos`, `finance`, `reports`, `purchases`, `customers`) that are **not** in `config/permissions.php` (which uses dotted keys). Only owner/admin pass — by short-circuit, not by check. Non-owners are denied every tool. The SQL-intent router runs **before** any tool permission check and its receivables/payables fallback bypasses the Reckoner gates entirely. | Map to canonical dotted keys; route intents through Reckoner with valid periods; delete the raw fallback. |
| L-14 | Sync read endpoints (`/api/sync/users|products|customers|suppliers|inventory`) have no permission middleware — any active member including `viewer` can pull the full customer and supplier list with balances. | Add `permission:` matching the web equivalents. |
| L-15 | `SettingsController::update` validates `settings => required|array` with typed sub-rules but no enumeration, so `validated()` keeps every key — any `settings.<anything>` is writable by a holder of `admin.settings_manage`. Own-tenant only. | Enumerate allowed keys. |
| L-16 | `store.builder` and `store.builder.data-at-stake` have **no** `permission:` middleware — any member (a cashier) can read the module map and per-table row counts. | Add `permission:admin.settings_manage` to both. |
| L-17 | Hardcoded module lists that can drift from the registry: `['products','pos','inventory','expenses','reports']` in three files; a 15-entry `capabilitiesMap` in `WorkspaceBuilderController.php:344-360` (the other 28 live modules render as "Operational module"); `MAX_MODULES = 46` in two files; `"Fifteen"` presets in a config header that has 23; stale "services is building" comments in four files (it is live); `CapabilityRegistry` docblocks claiming "eighteen capabilities" (17) and "twenty-three of the forty-three". | One test asserting every literal module key exists and is live; regenerate the labels from the registry. |
| L-18 | Barcode **scanning** and barcode **label generation** are conflated in the discovery hints. They are correctly separate in the code: scanning is a POS screen feature (`GET /api/pos/barcode/{code}`, and `store.pos.barcode` under `pos`), generation/printing is the `barcodes_labels` module (`store.labels.*`). But the `stock → catalogue` question implies `barcodes_labels` with the hint "Anything with a barcode". | Reword the hint to "print price tags and shelf labels". Scanning needs no module; say so. Note: there is no per-module settings surface to point a customer at — see P-01. |
| L-19 | Turnstile fails open on any Cloudflare error in every environment, and when keys are empty outside production. | Fail closed in production on error, not just on missing key. |
| L-20 | `DRM CHALLENGE` tokens are a plain HMAC of the device fingerprint under `APP_KEY` — anyone with a leaked `.env` can mint them. Only the demo route uses it today. | Per-license secret. |
| L-21 | Visitor chat accepts client-supplied `vena_context` (plan and feature flags) into the system prompt. An unauthenticated caller can assert any plan. | Resolve plan server-side from the tenant. |
| L-22 | `storage/app/system-manifest.json` was generated 2026-09-11 02:23; `config/ai_builder.php` (09-12 00:22), `config/business_types.php` and `config/dashboard_presets.php` (09-11 15:43) have all changed since. Verified on your machine by mtime. `SystemManifestTest > manifest is not stale` is a release gate and is red at HEAD. | `php artisan venqore:manifest`, commit the result, and add it to the release checklist next to `ziggy:generate` (BL-08) — both are "regenerate a derived file" gates that drift for the same reason. |

---

# 7. Product and architecture gaps (not bugs — decisions needed)

**P-01 — There is no way to express a sub-feature preference.** The registry deliberately defers field-level settings to V1.2, and confirms it: no module carries a `settings` key. But your promise — *"show and enable the relevant workflows, including details inside screens"* — is a sub-feature promise. Today the only vocabulary is module on/off, plus an unrelated legacy `settings` table that some UI already keys on (batch fields, POS return mode, barcode scanning toggle). Three vocabularies, none of them the registry.

Recommendation: add an explicit `subfeatures` array to the registry schema (key, label, default, the surfaces it controls) and drive the existing settings toggles from it, so there is one place a customer preference lives. Until then, do not let the AI imply it can turn individual fields off — it cannot.

**P-02 — The migration chain does not build on MariaDB.** `expenses.purchase_id` (`char(36)`) → `invoices.id` (`uuid`) fails with errno 150 on MariaDB 10.11; it succeeds on MySQL. Production is documented as MariaDB 10.5, and both phpunit configs pin `mariadb`. Either production was built by another route (a dump restore), or the documentation is wrong. Resolve this before launch — it decides whether you can ever run `migrate:fresh` on a replica.
Fix either way: change the migration to `$table->uuid('purchase_id')->nullable()` so both engines emit a matching type.

**P-03 — The backend suite depends on a frontend build.** Any test that renders a page dies with `Vite manifest not found` unless `public/build/manifest.json` exists. On your machine it does, so the suite passes — but it couples the PHP suite to a build artifact, and it is why a fresh clone or a CI job without `npm run build` sees unrelated red. Not a defect today; a fragility.
Fix: call `$this->withoutVite()` in `VenQoreTestCase::setUp()`, or make `npm ci && npm run build` an explicit documented prerequisite in `tests/README.md`.

**P-04 — Two capability vocabularies coexist.** `config/modules.php` + `ModuleDependencyResolver` (the new world) and the `capabilities` / `tenant_plan_overrides` tables + `CapabilityDependencyResolver` (the legacy world, still seeded by `BusinessTemplatesSeeder` on every provision). The resolver's own docblock admits it. Two sources of truth for "what can this tenant do" is one too many.

---

# 8. Coverage — what was and was not verified

Denominators, not percentages.

| Area | Inventoried | Statically reviewed | Runtime-tested | Not verified |
|---|---|---|---|---|
| Modules | 46/46 | 46/46 | 46 via `EnsureModuleTest` + 22 audit probes | — |
| Store routes | 726/726 [ROUTE] | ownership computed for all | 6 probed directly | 720 individually |
| Capabilities | 17/17 | 17/17 | 6 resolved live | 11 |
| Discovery questions | 4 opening turns / 10 deep (turns, **not** questions — `MAX_TURNS=4`, `MAX_TURNS_DEEP=10`) | yes | 2 full traces (plumber, bakery) | multi-turn conversations with a live model |
| Business types | 85/85, 5 sectors | all → shippable preset, no duplicate aliases | 2 | 83 |
| Presets | 23 (22 shippable) | all | all 22 via `PresetSmokeTest` | — |
| Reckoner readings | 60/60 | all | via suite | individually |
| Dashboard cards | 20/20 registry + 157 preset entries | all | — | render output |
| Reports | 65 suffixes | all mapped, 10 `null` | via suite | 65 individually |
| Insights | 35/35 | all | — | generation |
| Scheduled jobs | 38 entries / 31 commands / 5 jobs | all | — | execution |
| JSX pages | 320 (288 rendered, 18 dead) | key surfaces | — | **no browser test of any page** |
| PHP tests | 296 test files | — | **full suite executed: 2709 tests, 26040 assertions, 18 failures** (§8.1) | — |
| JS tests | 7 files / 126 tests, `environment: node` | yes | — | **no component, DOM or browser test exists** |

## 8.1 Full suite result, and which failures are real

`vendor/bin/pest -c tests/phpunit.xml` against the disposable database: **2709 tests, 26040 assertions, 18 failures, 651 PHPUnit deprecations.**

Twelve of the 18 are real; six were caused by my own transfer exclusions and I verified each corresponding file exists on your machine.

| Failing test | Real? | Finding |
|---|---|---|
| `Routes\FullRouteSweepTest > every laravel route is present in ziggy` | **Real** | **BL-08** — `workspace.converse.deepen` missing |
| `Billing\RefundWebhookTest` × 3 | **Real** | **H-14** — refund/failure mail sent to nobody |
| `Billing\SubscriptionStatusMappingTest` | **Real** | **M-21** — stale legacy plan name |
| `Module11\BillingTest` × 2 | **Real** | **M-21** |
| `Phase4PricingLiveTest` | **Real** | **M-21** |
| `SystemManifestTest > manifest is not stale` | **Real** | **L-22** — confirmed stale by mtime on your machine |
| `Audit\PrelaunchAuditProbesTest > b06` | **Real, expected** | my own probe; it *disproved* M-20, which is why it fails |
| `Core\RegistryDriftTest` × 5 | Artifact | needs `tests/VerificationCenter/registry/*.yaml` — present on your machine |
| `Guardrails\PermissionBypassGuardTest` | Artifact | needs `permission_ratchet.yaml` — present on your machine |
| `Golden\LaunchGateSelfTest` | Artifact | needs `quarantine.yaml` — present on your machine |
| `FrontendSyntaxIntegrityTest` | Artifact | npx fetched eslint 10 because `node_modules` was absent; `package.json` pins `^8.57.1` correctly |

Two things worth saying about this number. **2709 tests passing at 26040 assertions is a real asset** — the ledger, POS, inventory and tenant-isolation suites are thorough, and `ServiceOnlySaleTest` proves the accounting engine handles service-only businesses correctly even though the intake path (BL-03) does not. And `RegistryDriftTest` + `PermissionBypassGuardTest` are exactly the right kind of guard to have built.

But the suite's blind spot is precise and it maps onto this audit's blockers one-to-one: **nothing asserts the converse of route ownership** (BL-04), **nothing provisions a single-module tenant and exercises its routes** (BL-02, BL-03), **nothing checks a registry-referenced key actually exists** (BL-07, M-14), and **no test renders any UI** (H-01, the entire §4/§5 frontend set). Four assertions, listed at the end of §9, close three of those four.

**Explicitly not verified:**
- Any rendered page. There is no jsdom, no Testing Library, no Playwright, no Cypress in the repository. Every frontend finding in §4 and §5 is static: it says what the JSX *can* render given the props the middleware sends, not what a browser showed.
- `app-code/mobile-app` and `app-code/windows-app`.
- Behaviour against production data (tenant counts, whether `storage/app/private/backups` holds dumps, whether `test-store` exists, reverse-proxy topology).
- The M-01 cache race (needs two concurrent requests against a shared cache store).
- M-13 was not executed.
- Live-provider AI behaviour. All AI findings are about the deterministic path and the validation around the model; `BusinessUnderstanding` outputs are model-dependent. No repeated-run consistency measurement was possible.
- `npm run build` was not run; the frontend was not compiled.

**A note on the existing suite.** `tests/tests/Feature/Module/` is good work — `EnsureModuleTest` (19 tests), `ModuleRegistryIntegrityTest` (19), `ConfigurationValidatorTest` (15), `BusinessTypeCatalogueTest` (8), `PresetSmokeTest` (2), `ServiceOnlySaleTest` (9). All 99 tests in `Feature/Module` + `Unit/AiBuilder` pass once the Vite manifest exists. They did not catch the blockers because of what they *assert*: `test_every_route_pattern_matches_at_least_one_real_route` proves every registry pattern resolves, but nothing proves the converse — that every store route is claimed. That single missing assertion is BL-04, and the `test-store` fake tenant (M-19) is why gate regressions can hide elsewhere.

---

# 9. Remediation sequence

Ordered by risk retired per hour, not by severity.

**Day 1 — stop the bleeding (≈3 hours, all one-liners)**
1. BL-01: delete three routes, one `qore.php` line. Rotate keys if ever deployed.
2. BL-02: add `store.sales.store` to `invoicing.routes`. One line.
3. BL-06: add the status check to `ModuleDependencyResolver::validate()`. Three lines.
4. BL-07: fix the eight `implies_modules` keys. Eight lines.
5. BL-08: `php artisan ziggy:generate && npm run build`; commit. One command.
6. H-14: swap three `whereHas(role=platform_admin)` lookups for `Tenant::ownerEmail()`. Three lines, and it turns three red tests green.
7. L-22: `php artisan venqore:manifest`; commit.

**Day 2 — close the gate (≈1 day)**
5. Write the route-ownership integrity test (BL-04 fix 5) and let it name the 41 + 10 + 11. Triage each.
6. BL-05: make `StoreProvisioner::create()` always call `apply()`; add `default_enabled`; write and run the backfill command.
7. H-10: add lifecycle middleware to the `:1117` group.
8. H-11: move `EnsureModule` after `TenantMiddleware`; delete the `segment(2)` fallback.

**Day 3 — make the promise true (≈2 days)**
9. BL-03: services catalogue route + ad-hoc invoice lines.
10. H-01: render the sidebar from `props.nav`; delete the three label maps.
11. C-02 (via H-01's `useModules()` hook): gate the five `*ModuleTabs`, `ReportsLayout`, mobile nav, drop-ups, `CommandPalette`, `AppRegistry`, `useGlobalShortcuts`, `KeyboardShortcutsModal`.
12. H-02: fix the plan matrix, delete the seven `plan.feature:` middlewares, add the billing-promise test — or change the marketing copy.

**Day 4 — make the conversation honest (≈1 day)**
13. H-05: rename confidence → coverage, drop the floor, fix the completion copy.
14. H-06: resolve capabilities from the option's `implies`.
15. H-07 / H-08: replace both `str_contains` matchers with `matchesAlias()`; add negation.
16. H-09: fix the disable guard against the target set.
17. H-03 / H-04: signed proposal token; persist exclusions.

**Day 5 — consistency and background (≈1 day)**
18. H-12: six module guards in scheduled commands; fix `batchOrders`; schedule `finance:depreciate`.
19. H-13: one ownership table for cards, readings and insights; fix `has_restaurant` and the daily pulse periods.
20. M-01 / M-02: `afterCommit` invalidation; row lock + 409.
21. M-14: fix the six table renames; decide on the eight phantom modules.
22. M-21: update the four stale plan-name assertions so the suite is green and the billing guards work again.

**Decide, don't code (P-01 … P-04)**
Sub-feature vocabulary, the MariaDB/MySQL question, the Vite-suite coupling and the two capability worlds are architecture calls, not tickets. P-02 in particular should be settled before launch — it determines whether you can rebuild the schema on a replica.

**Before you call it done**, add these four tests — each one is a class of bug, not an instance:
- every store route is claimed or explicitly always-on;
- every registry-referenced key (module, capability, card, term, table, permission) exists and is live;
- every `billing: included` module's `legacy_gate` is `'1'` on every plan;
- for each module, a tenant with only that module plus its `requires` gets non-403 on every route the module claims.

---

## Appendix A — reproduction

The 22 audit probes are in `PrelaunchAuditProbesTest.php` (delivered alongside this report; **not committed**). Each test passes when the defect reproduces — they are evidence collectors, not regression tests. When a fix lands, the corresponding probe should start failing and be rewritten as its inverse.

```bash
# disposable database only — never venqore_pos
mysql -uroot -e "CREATE DATABASE amd_pos_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
cp .env.testing .env && sed -i 's/^DB_CONNECTION=.*/DB_CONNECTION=mysql/' .env   # see P-02
php artisan migrate:fresh --force
php artisan db:seed --class=PlanFeatureMatrixSeeder --force
npm ci && npm run build                                    # see P-03
cp PrelaunchAuditProbesTest.php tests/tests/Feature/Audit/
DB_CONNECTION=mysql vendor/bin/pest -c tests/phpunit.xml tests/tests/Feature/Audit/
```

Result at the audited commit: **21 passed, 1 failed** — the failure is M-20 (`test-store`), which is the one finding the probe *disproved*. That is the intended use of this file: a finding that stops reproducing is a finding that was wrong or is fixed, and either way the probe should be rewritten rather than deleted.

## Appendix B — raw probe output

```
[B-03]  tenant_modules rows for StoreProvisioner::create without 'modules': 0
[A-1.1] POST /workspace/provision status=200 → {"success":true,"tenant_slug":"forged-modules-ltd"}
[A-1.1] rows: {"composite_items":1,"landed_cost":1,"quotations":1}
[A-1.2] InvalidArgumentException: Refusing to apply an invalid configuration:
        Sales Returns & Refunds needs one of: products or services.
[B-04]  tables=200 tables/state=200 manufacturing-rules=200 kitchen/state=200 cookbook(control)=403
[B-01]  GET backups/{file} status=200 content-disposition=attachment; filename=audit-probe-2026.sql
[B-06]  /s/test-store/cookbook with cookbook OFF → status=403      ← gate held; finding downgraded
[B-07a] non-member: A/cookbook(off)=403 code="module_disabled" | A/pos(on)=302 → /hub
[B-05]  solo + recurring_invoices ON → 403 {"type":"plan_limit","feature":"recurring_invoices"}
[B-02]  write routes without lifecycle middleware: store.sales.store, store.purchases.store,
        store.expenses.store, store.payments.store, store.production.store
[A-4.1] customer_khata_credit → [products,pos,expenses,reports,customers,sales_orders]  (no khata_credit)
        table_and_kot_management → [products,pos,expenses,reports]                      (no table_service)
        serial_imei_tracking → [products,pos,expenses,reports,inventory]                (no serials)
[A-4.3] readiness=0.3, all rejected → confidence=0.9, "I have all the details needed"
[A-6.2] "add a deposit box"→ENABLE pos · "remove the purpose field"→DISABLE pos
        "I want to add compost"→ENABLE pos · "remove nag"→DISABLE variants
[A-6.1] "spare parts"→trade:salon · "smart phone"→trade:grocery · "horseshoes"→trade:clothing
        "solomon islands"→solo · "we have no POS"→{} · "no repairs here"→trade:repairs
[A-1.6] apply(['expenses','reports']) from products+pos → 422 disable_blocked
[C-4.2] services-only → GET /inventory/list?type=service → 403 module="products"
[INV-1] invoicing ON, pos OFF → POST /sales → 403 module="pos"; GET /sales/invoice/create → 200
[TERMS] plumber tenant → {"customer":"Client","job":"Job","product":"Material","technician":"Plumber"}
[NAV]   invoicing=Invoices · customers=Clients · payments=Payments · services=Jobs
        · expenses=Expenses · reports=Reports
[ANALYZE] "plumbing service on my own, no stock" → field_service / plumber
        → [services,customers,invoicing,payments,expenses,reports]  reasons=[]
[ANALYZE] "bakery with home delivery and repair of coffee machines" → bakery
        → [products,pos,expenses,reports]     ← no delivery, no repair
[F-6.1] owns_data tables absent: 20 entries across 15 modules (full list in M-14)
```

From the full suite (`vendor/bin/pest -c tests/phpunit.xml`, 2709 tests):

```
FullRouteSweepTest: Routes exist in Laravel but are missing from resources/js/ziggy.js.
  - workspace.converse.deepen  [POST workspace/converse/deepen]        ← BL-08

RefundWebhookTest: The expected [App\Mail\SubscriptionPaymentRefundedMail]
  mailable was not sent.  (×3)                                         ← H-14

SubscriptionStatusMappingTest:97   -'business' / +'scale'              ← M-21
Module11\BillingTest:157           -'business' / +'scale'              ← M-21
Phase4PricingLiveTest:101          -'counter'  / +'solo'               ← M-21

SystemManifestTest: The system manifest is stale or missing.
  Registries changed without regenerating it.  readings 60, cards 20   ← L-22
```

Verified on your machine (`E:\AMD POS\AMD POS\app-code\main-app`):

```
$ grep -o "workspace\.converse\.[a-z]*" resources/js/ziggy.js | sort -u
workspace.converse.reset · workspace.converse.start · workspace.converse.step    (no .deepen)

$ ls --time-style=+%Y-%m-%dT%H:%M config/ai_builder.php storage/app/system-manifest.json
2026-09-12T00:22  config/ai_builder.php
2026-09-11T02:23  storage/app/system-manifest.json                (manifest predates the config)
```

---

*No certification is claimed. This audit covers `app-code/main-app` at commit `4980a8cb` and states its own limits in §8. Findings marked [RUNTIME] were reproduced; findings marked [STATIC] were read, not executed; anything unverified is named as such.*
