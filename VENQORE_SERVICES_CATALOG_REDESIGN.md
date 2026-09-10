# VenQore — Services-as-Catalog Redesign

**Status:** design proposal + first backend slice already applied. Not a finished implementation.
**Date:** 7 Sep 2026
**Decision it serves:** why the current Services pages don't feel right, and what to build instead — for offering services (haircuts, repairs, consulting, AC servicing, tuition — anything billed by job or time rather than stocked and sold).

Written the way `VENQORE_TABLE_SERVICE_DESIGN.md` was — grounded in what the code actually does, not what the docs say it does — because that document is the right template for this one: a different vertical (dine-in vs. counter) instead of a different sale type (a service vs. a product), argued the same way.

**A note on "V6 standalone HTML."** `V6_PUBLIC_PAGE_REGISTER.md` is explicit that "V6" as a *file format* — a standalone `.html` file in `public/v6/`, served by `V6PageController` — names the public marketing site only (14 pages: the homepage, pricing, and preview pages like `/dashboard-preview` and `/pos.html`, none of which a logged-in tenant ever uses to run their business). The actual authenticated app — every real screen, Services included — is Laravel + Inertia + React, styled against the same **V6 design tokens** (colour, radius, type scale) through Tailwind. Rebuilding the Services screens as standalone HTML would mean rebuilding tenant scoping, permissions and everything else `OneGlanceLayout`/Inertia already give the rest of the app for free, for a screen with customer data and money on it. So this document follows V6 as a *design language* on the app's real architecture, rather than the literal file format — flagged here rather than silently doing something other than what was asked.

---

## 0. The one idea this whole document rests on

A **service is not a work order.** It only becomes one.

Today's Services module was built backwards from that: `ServiceJob` — draft → scheduled → in_progress → on_hold → awaiting_parts → completed → invoiced — is a dispatch ticket first and a sale second. That's the right model for a plumber's *visit*. It is the wrong model for the *thing you're selling*. A salon owner doesn't think "create a work order" when a walk-in wants a haircut — they think "add the service to the bill," exactly like a shopkeeper reaches for a product. The job/ticket workflow (scheduling, staff dispatch, on-site status, tools) is real and worth keeping, but it should sit **on top of** a service catalog, not stand in for one.

That's the whole redesign in one sentence: **a service is a catalog item you sell — sometimes instantly at a counter, sometimes as a scheduled booking with a technician and a van full of tools.** Both paths end at the same invoice. Today only the second path exists, and it's the slow, heavy one.

---

## 1. What already exists (so we don't rebuild it)

This matters for scoping — more of the foundation is already there than the current screens let you see.

**A service already IS a product, at the schema level.** `products.type` is `enum('standard','weighted','composite','service')` (`create_services_engine_tables.php:18`), and a service-typed product already carries `service_pricing` (`fixed | hourly | per_unit | quote`), `default_duration`, `default_rate`, `requires_visit`, and `skill_tag`. **This is exactly the "add a service the same way you add a product" idea you described — it was already built into the database, just never surfaced in `ProductModal.jsx`.** The gap is UI, not schema.

**Add-ons already exist, under a different name.** `ModifierGroup` / `Modifier` (`app/Models/ModifierGroup.php`, `Modifier.php`) is a named set of choices attached to any product, each with a signed `price_delta`, `min_select`/`max_select`, and a `required` flag. "Beard trim +Rs 500", "Rush service +Rs 1,000, pick 0–3" is precisely this, already wired to `Product::modifierGroups()`. **No new schema is needed for add-ons** — the work is surfacing modifier-group management inside the service side of the product modal, which today it likely isn't (it exists for the restaurant/menu use case).

**Named bundles and hourly billing already exist.** `service_packages` (a fixed-price bundle — "Full Service — Rs 4,500", one invoice line, not a recipe) and `service_rates` (per-employee or tenant-default hourly rate cards, with rounding rules per trade — up/down/nearest, billed in 15-minute increments by default) both point at a service-typed product and were built specifically so a package or an hourly job never tries to deduct stock (`2026_08_16_000100_create_service_packages_and_rates_tables.php`).

**The work-order layer is real, not a mock.** `service_jobs` + `job_lines` + `job_assignments` + `job_events` + `service_contracts`, and `App\Engines\ServiceEngine` (createJob, updateStatus, assignTechnician, convertJobToInvoice) all exist and run. Converting a completed job to a real `Invoice` already works.

**"Products, Services, or Both" already exists as a foundation, not a feature to invent.** `config/modules.php` treats `products` and `services` as two independent Group-A modules (`requires_one => [['products','services']]` on nearly every downstream module — POS, invoicing, quotations, sales), and `Tenant::business_type` plus `WorkspaceBuilderController`/`OnboardingExperienceController` already resolve a tenant's business type during onboarding. **The plumbing for "ask if they sell products, offer services, or both, and only show what applies" is already built.** What needs checking (not building) is whether the onboarding *question itself* is worded plainly enough — see §6.

**Module registry already calls Services the priority.** Its own doc comment: *"THE HIGHEST-VALUE MODULE IN THE PLAN — it is the difference between retail software and business software."* (`config/modules.php`, `services.opens`). The instinct behind your message is already the product's stated direction; the screens just haven't caught up to it.

---

## 2. What's actually wrong, verified in the code

Not a style complaint — three concrete defects, plus the UX mismatch from §0.

### 2.1 Staff assignment was completely non-functional (fixed today, see §4)

Two independent bugs stacked on the same feature:

1. `employees.id` is a UUID (`v3_foundation_schema.php:148`, `$table->uuid('id')->primary()`), but `job_assignments.employee_id` was created as `bigInteger unsigned` (`create_services_engine_tables.php:94`). No real employee id can be stored in that column — the type doesn't fit.
2. `App\Models\Employee` — the class `JobAssignment::employee()` (`belongsTo(Employee::class)`) points at — **did not exist anywhere in `app/Models`.** `ServiceJobController::show()` eager-loads `assignments.employee`; the instant any job had an assignment, that line would throw `Class "App\Models\Employee" not found`.

Net effect: "assign an apprentice to a job" has never worked, not even at the data layer. This is the concrete reason your staff-assignment idea needs new work, not just new UI — the old UI was pointing at a broken foundation.

### 2.2 The catalog-first mental model has nowhere to live

`ProductModal.jsx` (1,768 lines, tabs: Details / Extra Details / Reservations / Variants / History / Purchase Stats) is inventory-shaped throughout — stock, barcodes, variants are first-class; nothing in it currently branches on `type === 'service'` to hide them or show `service_pricing` / `default_duration` / add-ons / required tools instead. So today, adding a service means going to **Services → New Job**, which asks for a customer, a priority, a scheduled date and line items *before* you've even defined what the service is or what it costs — there's no "define this service once" step at all. That's the actual complaint under "these pages were made wrong": the entry point is a dispatch form, not a catalog.

### 2.3 No calendar, no tools, no expense link — genuinely new ground

Confirmed absent, not just under-built:
- `service_jobs.scheduled_for` is a bare `DATE` — no time-of-day exists anywhere in the schema, so no calendar/timeline view can be built without guessing a time.
- No `tools` concept exists at all — nothing tracks what a service needs, who's holding it, or when it last needed maintenance.
- Nothing links an `Expense` row to the job it was bought for.

---

## 3. The proposal

### 3.1 Two front doors, one catalog, one invoice

```
Define once                     Sell (either path lands on the same invoice)
────────────                    ─────────────────────────────────────────────
"Add Service" (= Add Product,   Path A — Counter/POS: tap the service like any
 type = service)                product, add-ons pop up, add to cart, done in
 · name, description             seconds. No job, no schedule, no technician —
 · pricing: fixed / hourly /     for a walk-in haircut, a quick consult.
   per-unit / quote
 · duration (for scheduling)     Path B — Booking: same service, but it needs a
 · add-ons (ModifierGroup —      time slot, a site visit, a technician, and
   already built)                maybe tools. This is where today's ServiceJob
 · required tools (new)          machinery (status ladder, assignment, events,
 · skill tag                     convert-to-invoice) keeps doing its job —
                                  it becomes the back half of the flow, not
                                  the front door.
```

This is the fix for §0 and §2.2 together: nobody is forced through a work-order form to sell a Rs 500 haircut, but the technician-dispatch machinery is still there, untouched, for the AC repair that needs scheduling.

### 3.2 The "Add Service" modal — same popup, service mode

Concretely, in `ProductModal.jsx`: when `type` is set to `service` —

| Tab | Standard product | Service mode |
|---|---|---|
| Details | name, SKU, category, brand, price, tax | name, category, price **or** rate type, tax — SKU hidden |
| Extra Details | stock unit, min/secondary unit, expiry tracking | duration, `requires_visit`, skill tag |
| Reservations | — | — (unchanged) |
| **Variants** | size/colour variants | **replaced by Add-ons** — reuses `ModifierGroup`/`Modifier` management, same min/max/required controls, just relabelled |
| **Stock / Barcode fields** | quantity, alert level, barcodes | **hidden entirely** — a service has no stock, "obviously services are unlimited," exactly as you said |
| **Required tools (new tab or section)** | — | multi-select against the `tools` table (§4), each with a quantity — "an AC repair needs the gauge set and the pump" |
| History / Purchase Stats | purchase history | job history for this service (jobs booked, revenue) |

Pricing type drives what's asked: `fixed` shows a price field, `hourly` links to a `service_rates` card (with the rounding/increment rule already built), `per_unit` asks for the unit, `quote` shows neither — it's priced at sale time.

### 3.3 POS — add a service exactly like a product

The register already lists products by category/search; a service-typed product needs no new POS architecture, only two adjustments: (1) suppress the stock/over-stock badge and quantity stepper's "stock left" ceiling for `type === 'service'` rows — quantity here means "how many of this service," not "how many left," and (2) when a service with add-ons is tapped, open the same modifier-picker sheet the restaurant/menu path already has for choice sets. This is the "quickly add services on their phone" ask, and it rides entirely on POS's existing product-tap flow — no new screen.

### 3.4 The invoice / document editor

`VENQORE_POS_AND_DOCUMENT_SPEC.md` already plans one unified document editor for all 13 document types, capability-driven rather than forked per type. A service line is just another line referencing a `type='service'` product — nothing document-editor-specific needs to change for "add a service to an invoice and send it to a customer." The one addition worth making there: when a line's product is a service with `requires_visit = true`, offer a one-tap "Turn into a booking" action that creates the `ServiceJob` behind it (title, party and line pre-filled) rather than making the user re-enter everything in a second screen.

### 3.5 Calendar + staff assignment

Booking a service that needs a time slot should show a real calendar — day/week view, one column or lane per technician — built on the two new columns from §4.2 (`scheduled_start_at`, `scheduled_end_at`). Assigning "apprentices or people who work for them" is `JobAssignment` (now backed by a working `Employee` model, §4.1); the calendar tile shows the assignee's initials the same way `VENQORE_TABLE_SERVICE_DESIGN.md` proposes for the restaurant floor tiles — worth the visual consistency since it's the same "who owns this" question in both places.

### 3.6 Tools — required list, checked-out tracking, maintenance

Three questions, three joins, all schema'd in §4.3:
- *"What should I take?"* — `Product::requiredTools()`, the default packing list for that service, editable from the Add Service modal (§3.2) and correctable after the fact ("first time they forgot to add something, next time they should be able to add it").
- *"Where are my tools right now?"* — `job_tools`: a row with `taken_at` set and `returned_at` null means it's out, and on which job. A tools-overview screen is just this table joined to open jobs.
- *"What needs maintenance?"* — `tools.maintenance_interval_days` + `last_maintenance_at` → `next_maintenance_due_at`, recalculated by `Tool::recalculateNextMaintenanceDue()` whenever a maintenance event is logged. A simple "due this week" list is a `where next_maintenance_due_at <= now()->addDays(7)` query — no new engine needed.

### 3.7 Expenses tied to a job

`expenses.service_job_id` (nullable, added in §4) is enough for "the AC technician had to buy gas for this job" — file the expense as usual, pick the job from a dropdown, and it shows up on that job's detail page and rolls into that job's true cost versus its price. Deliberately not wired into any total or report yet (per the migration's own comment) — that's a separate, smaller follow-up once the column exists and has real data to look at.

---

## 4. What was actually built today (not just proposed)

Applied directly to the repo, not run yet — see §7.

1. **`database/migrations/2026_09_07_150000_services_tools_calendar_and_employee_fk_fix.php`** — new migration:
   - Fixes `job_assignments.employee_id` from `bigint` to `char(36)` to match `employees.id` (guarded: only runs the type change if the table is empty, which it is expected to be, and logs a warning instead of guessing if it isn't).
   - Adds `service_jobs.scheduled_start_at` / `scheduled_end_at` (nullable `datetime`, additive — `scheduled_for` untouched).
   - Adds `expenses.service_job_id` (nullable, additive).
   - Creates `tools`, `service_tools` (a service's default tool list), `job_tools` (what actually went out on a job).
2. **`app/Models/Employee.php`** — did not exist before; created, mapped to the real `employees` table (UUID primary key, no `tenant_id` column — flagged explicitly in the file's doc comment as something to confirm before trusting tenant scoping on it).
3. **`app/Models/Tool.php`**, **`app/Models/JobTool.php`** — new models for §3.6.
4. **`app/Models/ServiceJob.php`** — added `tools()` relation (one line, additive).
5. **`app/Models/Product.php`** — added `requiredTools()` relation (one line, additive).

Every schema change is guarded (`hasTable`/`hasColumn` checks) and every new table is additive — nothing existing was dropped, renamed, or had its type changed except the one employee-id fix, which is guarded to no-op if it would be unsafe.

**Not done, and deliberately left for you or your IDE agent** (it has PHP, your local database, and a browser — I have none of the three from here): running the migration, and every piece of §3 that touches a rendered screen — `ProductModal.jsx` service mode, the POS suppression of stock UI on service rows, the calendar view, and the tools screens. That split is the same one `venqore_remaining_work_brief.md` already uses for exactly this reason, and it's the right one here too: a schema change I can reason about correctness for from the migration file alone; a screen I cannot verify without seeing it render.

---

## 5. Suggested build order

| Phase | What | Depends on |
|---|---|---|
| **1** | Run the new migration; smoke-test that existing Services pages still load (nothing in §4 removes a column they read) | — |
| **2** | `ProductModal.jsx` service mode (§3.2) — this alone lets "add a service like a product" happen | Phase 1 |
| **3** | POS suppression of stock UI for service rows + add-on sheet reuse (§3.3) | Phase 2 |
| **4** | Tools UI — required-tools picker in the modal, a tools list/maintenance screen, checked-out view (§3.6) | Phase 1, 2 |
| **5** | Calendar view + staff assignment UI on top of `scheduled_start_at/end_at` and the now-working `JobAssignment` (§3.5) | Phase 1 |
| **6** | Expense-to-job linkage on the expense form (§3.7) | Phase 1 |
| **7** | "Turn into a booking" action from the unified document editor (§3.4) | Phase 2, and the document editor unification already planned in `VENQORE_POS_AND_DOCUMENT_SPEC.md` |

Each phase ships independently and none leaves the app broken — same discipline as the other build-order tables in this repo's docs.

---

## 6. The one thing worth your judgement, not a guess

Everything else above I've made a call on and built or specified accordingly. Two things I didn't want to decide for you:

1. **Onboarding wording.** The `products`/`services`/`business_type` plumbing already exists (§1). I did not check whether the onboarding question is actually phrased as plainly as "Do you sell products, offer services, or both?" — if it isn't, that's a copy fix, not a build; worth five minutes in `onboarding.html` / `SetupWizardModal.jsx` to confirm before assuming a bigger gap exists than does.
2. **Job workflow depth for the booking path.** §3.1's Path B keeps the full `draft → scheduled → in_progress → on_hold → awaiting_parts → completed → invoiced` ladder as-is. If most of your service businesses are closer to "book a slot, show up, get paid" than "multi-day repair with parts delays," that ladder is heavier than they need and could collapse to `scheduled → done → invoiced`. I left it alone because removing states is a one-way door for anyone already relying on them; narrowing it later is easy, widening a narrowed one back out after data has been recorded against it is not.

Everything else — add-ons over variants, no stock/barcode on services, tools tracking, the calendar, expense linkage, keeping products and services independently toggleable — is a straightforward yes from what you described, and is written above as a decision, not a question.
