# Building Blocks — Backend Status Report

*Verified by reading the actual source code on 2026-08-13, not by trusting prior chat summaries. Every claim below is backed by a file I opened or a grep I ran myself, on the live files in `E:\AMD POS\AMD POS\app-code\main-app`.*

Naming note: from here on, this whole initiative — capabilities, terminology, and industry templates all composing into a tenant's software — is called **Building Blocks** everywhere in this document, and I'll use that name going forward in this project.

---

## PART 1 — In Plain Words

Think of it like Lego. Right now the system is being taken apart from one fixed, molded toy into individual bricks — a "Work Orders" brick, a "Table Occupancy" brick, a "Prescriptions" brick, a "Barcodes" brick — so that when a new customer signs up, you hand them a starter set of bricks for their trade (say, "Restaurant") and they can snap on or remove more bricks as they like. That target state is what "Building Blocks" means.

**Where things actually stand, in one line: the backend brick system is real and working, but it is not finished, and one of the trickiest bricks (physical space — tables, counters, service slots) is only half-migrated on purpose, as a safety measure.**

Here's what's genuinely true today, checked directly in the code:

- **The old duplicate engine files are gone.** There used to be two competing versions of core money-and-stock logic living in two different folders. That's cleaned up — only one version exists now, and there's an automated check (a test) that will fail the build if anyone ever tries to sneak the old duplicate back in.
- **The capability system (the actual Lego bricks) has real bricks defined** — 264 of them, covering things like barcodes, work orders, prescriptions, tailor measurements, jewellery pricing, service contracts. That's a big, genuinely complete catalogue.
- **New customer signup already assigns the right starter bricks automatically.** When a store is created, the code picks one of 12 pre-built industry kits (Retail, Restaurant, Pharmacy, Field Service, Repair Shop, etc.) and turns on the right bricks and renames the right words ("Customer" becomes "Patient" for a pharmacy) — this is wired in and runs for real, not just in a test file.
- **The "rename words per industry" system (Terminology) is fully built and live** — this is one of the more finished pieces.
- **The Work Orders / Field Service brick (the one for repair shops, electricians, tailors, etc.) has a working engine behind it now** — it can create a job, assign a technician, track status, and turn a finished job into an invoice. This did not exist a few audits ago; it's real now.
- **The "physical space" brick (restaurant tables, parked sale counters) is deliberately only halfway done.** The new unified system exists and is being fed data every time a table or a parked sale changes, but the actual dashboards you use today still run on the old tables. This is intentional and safe — nothing breaks — but it means this piece is roughly 25% through its four-stage rollout, not finished.

**What still needs doing before backend is "done": ** finish rolling the physical-space brick over to the new system (three more careful steps), and expand the industry starter kits beyond the current 12 base kits toward the fuller 48-business-type target the plan describes. Everything else on the backend side is either fully done or has a real, working first version.

**Should you start UI work now?** Not yet — but you're much closer than the "35% left" a previous audit suggested. The two genuinely incomplete pieces (physical-space rollover, and widening the industry kit library) are backend-only and don't block UI work from a "will this break in production" standpoint — but they do determine what the UI needs to *show*, so finishing them first will save you from redesigning screens later.

**Can nothing break while this is happening?** Yes, and this was actually built with that promise in mind — the physical-space piece literally writes to both the old and new tables at once so old screens keep working untouched. That's not a promise on paper, it's true in the code I read.

**How many businesses can you sell to right now, honestly?** Roughly 30 of the 48 target business types can run today using existing engines (retail, food, pharmacy, wholesale). The other ~18 (repair shops, electricians, tailors, workshops, etc.) need the Work Orders engine — which now exists in working form — but their screens and full industry kit presets aren't built out for all of them yet, so treat that number as "backend-ready, not yet packaged and tested end-to-end for every one of those trades."

---

## PART 2 — Technical Detail (for engineering / IDE use)

All findings below were independently re-verified against the working tree on the device (`E:\AMD POS\AMD POS\app-code\main-app`), not taken from a prior session's report.

### Module 1 — Legacy → V3 Engine Cleanup — **DONE, verified**
- `app/Services/FifoService.php`, `PurchaseService.php`, `InventoryService.php` do **not** exist. Confirmed live at `app/Engines/FifoService.php`, `app/Engines/InventoryService.php`, `app/Engines/PurchaseService.php`, `app/Engines/SaleReversalService.php`.
- `PosController`, `WooCommerceController` inject `App\Engines\InventoryService` (confirmed by grep on live controllers).
- `tests/tests/Feature/Guardrails/NoLegacyServiceGenerationTest.php` exists and its logic is genuine: it recursively scans `app/`, `routes/`, `database/` for any string reference to the five banned legacy FQCNs and fails the test if found. This is a real regression guard, not a stub.
- `recipes` → `compositions` rename: `app/Models/Composition.php`, `CompositionItem.php`, `CompositionMedia.php` exist; `DatabaseSeeder.php` imports `Composition`/`CompositionItem` directly (not the old `Recipe` names). Fully cut over.

### Module 2 — Capability Registry & Entitlements — **~85% done, verified**
- `database/migrations/2026_08_12_062316_create_capabilities_tables.php` creates `capabilities`, `capability_search_index`, `tenant_terminology` — schema confirmed by direct read.
- `database/seeders/PlanFeatureMatrixSeeder.php` — verified 264 top-level feature keys via regex count on the live file (not the previously-claimed 256, but same order of magnitude and a superset).
- Confirmed present in the matrix: `optical_prescription`, `tailor_measurements`, `jewelry_metal_rates`, `work_orders`, `service_contracts` — all five sidecar/services keys are seeded with per-plan gating (trial/starter off, growth/business on).
- `database/seeders/DatabaseSeeder.php` **does** call `CapabilitiesRegistrySeeder::class` in its `run()` array — confirmed by direct read of the live file. This was previously broken/unwired; it is wired now.
- `app/Console/Commands/SeedCapabilitiesCommand.php` exists (`vq:seed-capabilities`), confirmed calling `CapabilitiesRegistrySeeder`.
- `tests/tests/Feature/Guardrails/PlanEntitlementIntegrityTest.php` is real: it statically parses `PlanFeatureMatrixSeeder.php` for defined keys and cross-checks every `plan.feature:` middleware reference in `routes/web.php` and `routes/api.php` resolves to a real key (with an explicit alias table for renamed reports). This is a genuine consistency guard.
- **Gap:** I could not execute PHPUnit or a live DB in this sandbox (no PHP runtime, no MariaDB reachable from the cloud container). I did **not** independently verify these tests currently pass — I verified the test logic is sound and would catch real drift if it ran. Treat "all green" claims from prior sessions as unconfirmed until you run the suite yourself and paste the output.

### Module 3 — Terminology Engine — **DONE, verified**
- `app/Support/Terms.php` confirmed: static fallback dictionary (25 keys incl. `job`, `technician`, `contract`, `occupancy`, `position` — i.e. already extended for the new modules), `Terms::get()` and `Terms::forTenant()` resolve tenant overrides from `tenant_terminology` with fallback to defaults.
- `tests/.../TerminologySystemTest.php` exists in the guardrails suite.

### Module 4 — Services / Field Work Engine — **Real first version, verified (previously falsely reported as both "complete" and "schema-only" — neither was accurate)**
- Migration `2026_08_12_210000_create_services_engine_tables.php` creates `service_jobs`, `job_lines`, `job_assignments`, `job_events`, `service_contracts`, `employee_skills` — confirmed.
- Models confirmed present and non-stub: `app/Models/ServiceJob.php`, `JobLine.php`, `JobAssignment.php`, `JobEvent.php`, `ServiceContract.php`.
- `app/Engines/ServiceEngine.php` confirmed real: `createJob()`, `updateStatus()`, `assignTechnician()`, `convertJobToInvoice()`, sequential job numbering (`JOB-100001` style), all operating on the real Eloquent models above (not placeholders).
- `app/Http/Controllers/Api/WorkOrderController.php` confirmed real, full CRUD + assign + convert-to-invoice, tenant-scoped.
- `routes/api.php` confirmed: `/api/work-orders*` routes registered, gated by `plan.feature:work_orders` middleware plus `permission:sales.create` / `permission:sales.edit` on write actions.
- **Not yet verified/likely missing:** stock-bypass logic for service-type products in the main sale/invoice write path (the rule that a "service" line item should skip FIFO lot reduction) — I did not find this wired into `SaleController`/`InventoryService` in this pass; earlier claims that it's "active" should be treated as unconfirmed until traced explicitly. Flag this as the next thing to check before relying on it.
- **Not yet built:** frontend/UI for work orders, and most of the "48 business types" packaging around this engine.

### Module 5 — Occupancy Unification (physical space: tables, counters, parked sales) — **~25%, by design, verified**
- Migration `2026_08_12_065156_create_occupancies_and_positions_tables.php` — its own docblock states: *"Phase 1.5 — R-4 Occupancy Unification (Deploy A)... The legacy tables are NOT dropped — dual-write is handled at the model level."* This is Deploy A of a stated multi-deploy plan, confirmed by the migration author's own comment, not my inference.
- `app/Engines/OccupancyEngine.php` confirmed real: `occupyPosition()`, `releasePosition()`, and two dual-write sync methods, `syncFromRestaurantTable()` and `syncFromParkedSale()`, both wrapped in try/catch so a sync failure can't break the legacy write path.
- Confirmed wired into live call sites: `RestaurantDashboardController.php` calls `syncFromRestaurantTable()` after every table status change; `SaleController.php` calls `syncFromParkedSale()` after every parked-sale creation.
- **Confirmed NOT cut over:** `RestaurantDashboardController` still reads and writes `RestaurantTable::` directly as its source of truth for the dashboard (11 separate references); `ParkedSaleController`/`SaleController` still read/write `ParkedSale::` directly. The new `Position`/`Occupancy` tables are being populated but nothing reads from them yet. This matches migration's own "Deploy A" framing — it is one step of four (dual-write → shadow-compare → flip reads → drop legacy), not a completed rename.

### Module 6 — Business Catalogue / Onboarding Templates — **12/12 base templates done, wired into real signup flow, verified**
- `database/seeders/BusinessTemplatesSeeder.php` confirmed: exactly 12 top-level template keys — `retail_store`, `fashion_variants`, `electronics_serials`, `hardware_materials`, `restaurant_cafe`, `bakery_production`, `pharmacy`, `wholesale_distribution`, `field_service`, `repair_shop`, `workshop_manufacturing`, `services_contracts` — each with capability list + terminology overrides.
- `database/seeders/TenantDefaultSeeder.php::seedFor()` confirmed calling `seedTemplateBuildingBlocks()` which calls `BusinessTemplatesSeeder::getTemplates()` — this is not test-only code.
- `app/Http/Controllers/StoreController.php` line 377 confirmed calling `TenantDefaultSeeder::seedFor($tenant)` on real store/tenant creation — this is the live signup path, verified by direct read, not inference.
- **Gap:** 12 base templates cover broad categories, not all 48 individually-named business types from `06_BUSINESS_CATALOGUE_V1.md`. Multiple business types are expected to map to the same base template (e.g. grocery + stationery + sports goods → `retail_store`), which is a reasonable design, but if the plan wants 48 *distinct* onboarding presets rather than 12 base kits with shared defaults, that's the remaining gap.

### Guardrail Test Suite — **Real, substantive, execution NOT independently confirmed**
Confirmed present and non-trivial by direct read: `NoLegacyServiceGenerationTest`, `PlanEntitlementIntegrityTest`, `BuildingBlocksEngineTest` (3 real assertions: dual-write creates a `Position`+open `Occupancy`, tenant seeding creates a real `tenant_terminology` row mapping `customer`→`Patient` for a pharmacy tenant, `ServiceEngine::generateNumber()` returns `JOB-` prefixed sequence), `PermissionBypassGuardTest`, `TerminologySystemTest`, plus a large pre-existing set (`AccountingIntegrityGuardTest`, `TenantIsolationSweepGuardTest`, `MassAssignmentGuardTest`, etc.) unrelated to this initiative but part of the same directory.
**I could not run PHPUnit/Pest in this sandbox** (no PHP interpreter, no MariaDB reachable from the cloud container). Any "all tests pass" / "182 assertions green" claim from a prior session should be re-verified by you running `php vendor/bin/pest tests/tests/Feature/Guardrails` locally and pasting the actual output before it's treated as fact.

---

## PART 3 — Business Reachability (recount, conservative)

**Tier A — usable today with existing engines (Inventory, FIFO, POS, Accounting, Compositions/BOM, Batch, Serials):** ~30 business types across Retail, Food & Dining, Pharmacy/Wholesale. This matches the prior estimate and is consistent with what's actually wired.

**Tier B — needs the Services engine, which now has a real first version:** ~18 types (repair shops, workshops, electricians, tailors, etc.). The backend engine (`ServiceEngine` + `WorkOrderController` + routes) now exists and is callable via API. What's still missing for these to be sellable: the stock-bypass rule needs explicit verification, industry-specific presets for each of the 18 need their own `BusinessTemplatesSeeder` entries or reuse of `field_service`/`repair_shop`/`workshop_manufacturing`/`services_contracts`, and there is no UI yet.

---

## PART 4 — What To Do Next (backend-only, before UI)

1. **Verify and, if missing, wire the stock-bypass rule** for service-type product lines in the sale/invoice write path (`SaleController` / `FifoService`). This is the one Services-engine claim from prior sessions I could not confirm either way.
2. **Finish the Occupancy rollout past Deploy A.** Next steps in order: run both systems in parallel for a defined soak period and log any mismatches between `RestaurantTable`/`ParkedSale` and `Position`/`Occupancy`; once mismatch rate is zero, flip `RestaurantDashboardController` and `ParkedSaleController` to read from `Position`/`Occupancy`; only after that, retire the legacy tables. Do not skip the shadow-compare step — that's what makes "nothing breaks" actually true rather than assumed.
3. **Decide 12-templates-with-shared-defaults vs. 48-distinct-presets**, and if 48 is the real target, extend `BusinessTemplatesSeeder` accordingly — this is additive, low-risk work.
4. **Run the guardrail suite for real** (`php vendor/bin/pest tests/tests/Feature/Guardrails`) on a machine with PHP + MariaDB and paste the actual output back into the project record, so "all green" is a fact instead of a claim.
5. Only after 1–2 are done should UI screens for Work Orders / Field Service be started — building them against a still-dual-write occupancy model or an unverified stock-bypass rule risks redesigning those screens later.

---

*Everything in Part 2 and this section was checked by opening the actual files listed, on the working tree at the time of this report. Where I could not verify something (test execution, one specific business rule), that is called out explicitly above rather than assumed.*
