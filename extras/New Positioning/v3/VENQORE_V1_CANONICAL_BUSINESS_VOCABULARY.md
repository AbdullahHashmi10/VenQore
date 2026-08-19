# VenQore V1 — Canonical Business Vocabulary & Semantic Mapping

**Prepared:** 11 August 2026
**Status:** the semantic contract. Nothing in the composition layer is implemented until this is agreed.
**Method:** every claim about existing code was verified by reading the repository at `E:\AMD POS\AMD POS\app-code\main-app`. Where this document and the repository disagree, **the repository wins**. Where this document and an earlier audit disagree, **this document wins** and the disagreement is stated.
**Companions:** `00_MASTER_INDEX.md` (programme), `01_BACKEND_AND_DATA.md` (implementation), `06_BUSINESS_CATALOGUE_V1.md` (the V1 list this document maps).

---

# 01 — Purpose & Rules

## 01.1 — What this document is

This is the **semantic contract between VenQore's engines, its configuration system, its AI layer and its user interface.**

It exists so that a future engineer can answer, without rediscovering the architecture:

- What does this feature mean internally?
- What does it mean to a restaurant? To a pharmacy? To an electrician?
- Which model, service, controller and table currently implement it?
- What should the user actually see?
- Can another business reuse the same engine, or is this genuinely new?
- What does the AI map the user's words to?
- What must never be renamed?

## 01.2 — The core principle

> **VenQore must never become 48 separate ERPs.**
> One canonical internal vocabulary. Many business-specific presentations.

The 48 V1 businesses are **different vocabularies and configurations of the same underlying business operating system**. A pharmacy and a plumber run the same double-entry ledger, the same party balances, the same FIFO costing. They see different words.

## 01.3 — The three-layer separation

| Layer | Example | Who changes it | Where it lives | Changes how often |
|---|---|---|---|---|
| **Physical** | table `parties`, model `Party`, column `current_balance` | Engineering, via migration | Database + PHP | Almost never |
| **Canonical** | concept `party`, capability key `customer_khata`, term key `party.singular` | Engineering, via the registry | `capabilities` + `terminology_keys` | Rarely, additively |
| **Display** | "Patient", "Guest", "Client", "Member" | **Each tenant, any time** | `tenant_terminology` | Freely, per tenant |

**These three must never be conflated.** A tenant renaming "Customer" to "Patient" must not touch a column name, a model name, a capability key, a route name or an API field. If it does, the architecture has failed.

## 01.4 — The ten hard rules

1. **Never rename a database column for an industry.** `parties.name` stays `parties.name` for a clinic.
2. **Never create a `patients` table** because a clinic says "patient". Never create `students`, `members`, `guests`, `clients`.
3. **Never duplicate the accounting engine** for a vertical. There is one ledger.
4. **Never write tenant-specific code** for terminology. If a tenant needs a code branch to get their word, the terminology system is broken.
5. **Never make an industry name part of an engine's internals.** No `if ($industry === 'clinic')` inside `V3\SaleService`.
6. **Never replace typed models with a generic EAV structure.** `products.price` stays a typed decimal column. Custom fields are a sidecar, not a replacement.
7. **Never let the AI create schema.** It resolves against a finite registry or it returns UNRESOLVED.
8. **Terminology is presentation configuration**, resolved at render time, never persisted into a transaction.
9. **A new business requirement composes existing engines** unless there is an irreducible domain requirement.
10. **The financial ledger is the authoritative truth** and is the one capability that can never be switched off.

## 01.5 — What this document deliberately does not do

- It does not propose migrations. `01_BACKEND_AND_DATA.md` does that.
- It does not design screens. `05_SCREEN_SPECS.md` does that.
- It does not rename anything yet. It defines what the names *mean*.

---

# 02 — The Canonical Business Model

## 02.1 — Eleven semantic families

These are **semantic families, not database tables.** A family groups concepts that share meaning and, usually, an engine. Members of a family may remain separate typed models where that is already correct.

| # | Family | One-line definition | Can be switched off? |
|---|---|---|---|
| 1 | **Party** | Any counterparty with an identity and, usually, a running balance | No — everything references it |
| 2 | **Resource** | Anything sellable, consumable, occupiable or assignable | No — the catalogue is universal |
| 3 | **Ledger** | Money, obligation and the double-entry record of both | **Never.** The one hard wall. |
| 4 | **Event** | A dated occurrence with a financial and/or physical effect | No |
| 5 | **Schedule** | Time: when something is due, planned or recurring | Partly — **V1 has only the date-and-assignee level** |
| 6 | **Workflow** | A state machine over an object, with transitions and actors | Yes |
| 7 | **Rule** | A parameterised calculation or constraint applied to a value | No — tax and pricing always apply |
| 8 | **Document** | A rendered, numbered, retained artefact of an event | No |
| 9 | **Communication** | A message to a party through a channel, with a delivery record | Yes |
| 10 | **Integration** | A pluggable external system, in either direction | Yes |
| 11 | **Access & Audit** | Who may do what, and what was done | **Never** |

## 02.2 — Family 1 · Party

> **Canonical definition:** an identified counterparty which may hold a balance, receive documents and be referenced by events.

```
PARTY
├── customer          buys from us                     → Customer, Guest, Patient, Student, Member, Client
├── supplier          we buy from                      → Supplier, Vendor, Distributor
├── employee          performs work for us             → Staff, Technician, Teacher, Stylist, Mechanic
├── contractor        performs work, not on payroll     → Subcontractor, Freelancer  (V1: employee subtype)
└── platform_user     a login, not a business party     → User  (distinct — see below)
```

**Verified implementation.** `parties` carries `type ENUM('customer','supplier')` plus `category` and `sub_category` free-text columns, and both `customers` and `suppliers` carry a `party_id`. `employees` exists separately (created in `2026_03_05_000001_v3_foundation_schema.php`). `users` is authentication and is **not** a Party.

> **DUP-7, restated semantically.** `customers`, `suppliers` and `employees` all describe the same family, and two of the three already point at `parties`. The correct model is **Party + role**. `parties.category` is the column that already anticipated this. Unifying is `01_BACKEND_AND_DATA.md` work; the vocabulary is settled here.

**Critical distinction — Party is not User.** A patient does not log in. A cashier does. Conflating them would put authentication concerns into the receivables path. `users` ↔ `tenant_users` stays exactly where it is.

## 02.3 — Family 2 · Resource

> **Canonical definition:** anything a business sells, consumes, occupies, assigns or tracks the quantity of.

```
RESOURCE
├── inventory_item    stocked, costed, depleted        → Product, Ingredient, Medicine, Material, Part, Spare
│   ├── standard
│   ├── weighted                                        → sold by kg/litre
│   └── composite                                       → made from other resources
├── service           no stock, no lot, priced by       → Service, Treatment, Labour, Repair  [V1 build]
│                     time/unit/quote
├── position          a physical place that can be      → Table, Bay, Chair, Bench, Rack, Room, Desk
│                     occupied
├── location          a place that holds quantities     → Warehouse, Store, Godown, Van, Kitchen, Yard
├── digital_asset     delivered, not stocked            → Digital product, Download
├── equipment/asset   owned, depreciated, assigned      → Asset, Tool, Vehicle   [partial: RunDepreciation exists]
├── membership        a right for a period              → Membership, Plan       [NOT V1 — needs Period]
└── course            a right to attend over a period   → Course, Class          [NOT V1 — needs Period + Schedule]
```

**Verified implementation.** `products.type` is `ENUM('standard','weighted','composite')` (`2025_12_29_153358_create_amd_tables.php:17`). `warehouses`, `restaurant_tables`, `digital_products` all exist as separate tables. Depreciation exists as `RunDepreciation` console command.

**The rule that matters here:** do **not** say "everything is a product". Say *Resource is the family; `products` is the implementation of the `inventory_item` and `service` subtypes.* `position` and `location` are Resource-family but are correctly separate tables, because their behaviour is genuinely different — a table is not costed and a warehouse is not sold.

## 02.4 — Family 3 · Ledger

> **Canonical definition:** the balanced, immutable, reversal-only double-entry record, and every obligation and settlement that flows through it.

```
LEDGER
├── account           a node in the chart of accounts
├── journal_entry     a balanced set of debits and credits, with a mandatory source reference
├── obligation        an amount owed in either direction    → Receivable, Payable, Khata, Fee due, Dues
├── settlement        money applied against an obligation   → Payment, Receipt, Fee collection
├── allocation        which payment paid which obligation
└── balance           the materialised net position of a party
```

**Verified implementation.** `V3\AccountingService` (350 LOC), `V3\PaymentService`, `V3\SettlementService`, `journal_entries` / `journal_items`, `payments`, `payment_allocations`, `transaction_allocations`, `party_snapshots`, and `FinancialReportingService` as the single source of financial truth.

> **DUP-5 restated semantically:** `payment_allocations` and `transaction_allocations` are one concept — *allocation*. `CLAUDE.md` documents a live bug caused by the split. One table.

**This family is the one hard wall.** Every V1 business uses it identically. A school's "fee outstanding" and a wholesaler's "khata" are the *same query on the same table*. That equivalence is the single largest reuse in the whole product.

## 02.5 — Family 4 · Event

> **Canonical definition:** a dated occurrence that changes state — financial, physical, or both.

```
EVENT
├── outbound_value    we gave value, we are owed         → Sale, Order, Visit charge, Fee, Dispensing
├── inbound_value     we received value, we owe          → Purchase, GRN
├── reversal          undoing a prior event              → Return, Credit note, Refund
├── consumption       resource used without a sale       → Production, Wastage, Internal use
├── movement          resource changed location          → Transfer, Dispatch, Van load
├── count             observed reality vs recorded       → Stock take, Asset audit, Cash count
├── presence          a person was somewhere at a time   → Attendance, Check-in, Site sign-in
└── adjustment        a deliberate correction            → Stock adjustment, Journal adjustment
```

**Verified implementation.** `sales`, `purchases`, `sale_items`, `purchase_items`, `stock_movements`, `stock_transfers`, `stock_takes`, `production_runs`, `production_logs`, `staff_attendances`, `fund_transactions`.

> **The dead `transactions` table.** `CLAUDE.md` describes `Transaction` as the core model. It is not. It is a 19-line model with one write site (`WooCommerceController:209`). **`CLAUDE.md` is wrong and must be corrected.** The real event tables are `sales` and `purchases`.

## 02.6 — Family 5 · Schedule

> **Canonical definition:** the time dimension — when something is due, planned, repeating, or valid.

```
SCHEDULE
├── due_date          a date an obligation falls due          ✅ exists (payment_terms, ageing)
├── recurrence        a repeating obligation on a cycle       ✅ exists (recurring_invoices)
├── assignment_date   a date work is planned for              🟡 V1 build (jobs.scheduled_for)
├── validity_period   a start and end during which a right    ❌ NOT V1 — the Period engine
│                     is held
├── slot              a bounded interval against a resource   ❌ NOT V1 — the Scheduling engine
└── availability      when a resource can be booked           ❌ NOT V1 — the Scheduling engine
```

> **This is the honest boundary of V1.** Rows 1–3 exist or are being built. Rows 4–6 do not exist, and every Tier C business (gym, salon, clinic, lab, academy, rental, coworking) needs them. The vocabulary for them is defined here so the registry is future-proof, but **no V1 business may claim them.**

## 02.7 — Family 6 · Workflow

> **Canonical definition:** a named state machine over an object, with permitted transitions, actors and side effects.

```
WORKFLOW
├── document_lifecycle    draft → issued → paid → closed        ✅ exists across sales/quotations/orders
├── conversion            one document becomes another          ✅ exists (quotation→SO→invoice converters)
├── work_progress         a unit of work moves through stages   🟡 V1 build (kitchen_orders → work_orders)
├── approval              a human gate before an effect         🟡 partial (staff_activity_gaps approve/reject)
└── escalation            time-based transition                 ❌ not present
```

**Verified implementation.** `kitchen_orders` is a working `work_progress` machine wearing a kitchen name. `quotations` → `sales_orders` → `invoices` converters exist. `staff_activity_gaps` has a real approve/reject flow — the only generic approval in the product.

## 02.8 — Family 7 · Rule

> **Canonical definition:** a parameterised calculation or constraint applied to a value, configured rather than coded.

```
RULE
├── tax               rate, inclusive/exclusive, jurisdiction   ✅ V3\TaxService, rule-driven
├── pricing           tier, wholesale, party discount           ✅ wholesale_price, parties.default_discount
├── cost_allocation   spread a cost across received items       ✅ landing cost in PurchaseService
├── rounding          cash rounding to the nearest unit         ✅ auto_cash_rounding
├── credit            limit and terms per party                 ✅ parties.credit_limit, payment_terms
├── depreciation      value reduced over time                   ✅ RunDepreciation command
├── commission        a share of a value to a party             ❌ not present
└── threshold         a signal fires when a value crosses       ✅ Growth Engine ThresholdTuner
```

> **§09 asks whether tax, amortisation, royalty, commission, freight and salary are one capability.** The answer, verified: **they are the same *shape* — `(inputs) × (parameters) → amount, posted to a named account` — but not yet one implementation.** Tax, landing cost, rounding and depreciation each have their own code. Unifying them is *correct but not V1*: it is a refactor with no new customer-visible capability. **Record the equivalence in the registry now; unify the code after the reveal.** Commission is the only one genuinely absent, and it is not needed by any V1 business.

## 02.9 — Family 8 · Document

> **Canonical definition:** a numbered, rendered, retained artefact representing an event or a state.

```
DOCUMENT
├── demand        we are owed                → Invoice, Bill, Fee note, Charge sheet
├── offer         we propose                 → Quotation, Estimate, Proposal
├── commitment    both sides agreed          → Sales Order, Purchase Order, Contract
├── evidence      value moved                → Receipt, Payment voucher, Delivery note, Packing slip
├── correction    a prior document reversed  → Credit note, Debit note, Return note
├── statement     a period summary for a party → Statement, Ledger extract, Fee statement
└── instruction   a direction to do work     → Kitchen ticket, Work order, Job card
```

**Verified implementation.** `invoices`, `quotations`, `proposals`, `sales_orders`, `purchase_orders`, `debit_notes`, `recurring_invoices`, plus **22 standalone public document tools** in `App\Support\ToolRegistry` across four groups (Barcodes & Labels 7, Documents 6, Inventory & Data 5, Calculators 4+).

> **DUP-3 restated semantically:** there are ~20 separate `Tools/*Service` PDF generators. Document is one family with one renderer and many templates. **This is the highest-ROI refactor in the repository**, and terminology makes it urgent: a tenant who renames "Invoice" to "Fee Note" and picks their own accent colour expects the PDF to follow. Twenty generators means twenty places that will not.

## 02.10 — Family 9 · Communication

> **Canonical definition:** a message to a party through a channel, triggered by a rule, with a delivery record.

```
COMMUNICATION
├── trigger    what causes it        → invoice due, stock low, contract expiring
├── audience   who receives it       → a party, a role, a segment
├── channel    how it travels        → WhatsApp, SMS, email, in-app, print
├── template   what it says          → terminology-aware, per tenant
└── delivery   what actually happened → sent, failed, read
```

**Verified implementation.** `invoice_reminders` (with a `type` defaulting to `whatsapp`), `notifications`, SMTP and SMS gateway capability keys, `MessagingAuditService`, `chat_sessions` / `chat_messages`, `canned_responses`.

> **DUP-4 restated semantically:** five separate notification mechanisms. One Communication capability. **Templates must resolve terminology** — "Dear customer, your invoice is due" has to become "Dear patient, your fee note is due" without a code branch.

## 02.11 — Family 10 · Integration

> **Canonical definition:** a pluggable external system, inbound or outbound, behind a stable interface.

```
INTEGRATION
├── commerce_channel   → VenSynQ: PlatformRegistry + PlatformClient + 5 clients ✅
├── fiscal_authority   → FbrService (Pakistan e-invoicing) ✅
├── payment_rail       → LemonSqueezy (platform billing, not tenant payments) ✅
├── storage            → S3, Google Drive, OffsiteBackup ✅
├── document_intake    → SmartCapture: photo → structured transaction ✅
└── device             → WebUSB printing, barcode scanners, terminals ✅
```

**Verified implementation.** `WooConnection`, `WooProductLink`, `WooSyncQueue`, `WooSyncLog`, `webhook_logs`, `terminals`, `terminal_pairing_tokens`, `SmartCaptureAlias`.

## 02.12 — Family 11 · Access & Audit

> **Canonical definition:** who may do what, in which tenant, and an immutable record of what was done.

```
ACCESS & AUDIT
├── tenant        the isolation boundary                    ✅ tenants, tenant_id everywhere
├── user          an authenticating identity                ✅ users
├── membership    user ↔ tenant with role and permissions   ✅ tenant_users
├── role          a named permission set                    ✅ 7 roles
├── entitlement   what the plan and the tenant's choices permit ✅ plans, plan_limits, plan_features,
│                                                              tenant_plan_overrides
└── audit         an immutable record of change             ⚠️ six overlapping tables — DUP-6
```

**Verified implementation.** `tenant_plan_overrides` exists with `override_key`, `original_value`, `applied_by`, `expires_at`, a unique constraint per (tenant, key) and 5-minute caching, consulted by `PlanRepository::getEffectiveLimit()` **before** the plan.

> **The decisive architectural fact in this entire programme:** the per-tenant composition engine already exists. It was built as a SuperAdmin support tool. Extend it. Do not build a second one.

Audit duplication (DUP-6): `activities`, `activity_logs`, `store_activity_logs`, `platform_activity_logs`, `platform_audit_logs`, `terminal_activities`. One activity capability with a source discriminator.

---

# 03 — Canonical Capability Registry

## 03.1 — What a capability is, precisely

> A **capability** is a named unit of function that can be independently permitted, chosen, enforced, navigated to and named.

Four properties, all required:

1. **Permitted** — the plan says whether the tenant may have it (`plan_limits`)
2. **Chosen** — the tenant says whether they want it (`tenant_plan_overrides`)
3. **Enforced** — a guard makes it genuinely unreachable when off (web + API + jobs + exports + sync)
4. **Presented** — it contributes nav nodes, dashboard cards and terminology slots

**A key that fails any of the four is not a capability.** That is why `capabilities.kind` exists.

## 03.2 — The verified starting point

`PlanFeatureMatrixSeeder` contains **256 keys** across **12 named groups**, verified by direct count:

| # | Group (as named in the seeder) | Semantic families it touches |
|---|---|---|
| 1 | Onboarding & First Impression | Access, Communication |
| 2 | POS & Supercharged Checkout | Event, Resource, Document, Rule |
| 3 | Invoicing, Customer Khata & Receivables | Ledger, Party, Document, Communication |
| 4 | Procurement & Suppliers | Event, Party, Ledger, Rule |
| 5 | Inventory & Multi-Warehouse | Resource, Event |
| 6 | E-Commerce & VenSynQ | Integration |
| 7 | Double-Entry Accounting & Finance | **Ledger** |
| 8 | Report Factory (40 Reports) | all — read-only |
| 9 | Platform HQ & Infrastructure | Access (platform, not tenant) |
| 10 | AI & Automation Extras | all — advisory |
| 11 | Live Chat & Customer Engagement | Communication |
| 12 | Support & Onboarding Perks | Access, Communication |

> **Correction to Audit II.** It reported 269 capabilities. The verified count in `PlanFeatureMatrixSeeder` is **256 matrix keys**. The difference is immaterial to the architecture but the registry must be seeded from the actual file, not from the audit's number.

## 03.3 — The three kinds

Promoting 256 keys into a `capabilities` table requires classifying every one. Most of the composition work is in this classification, not in the schema.

| `kind` | Meaning | Composable? | Examples from the seeder |
|---|---|---|---|
| **`capability`** | A real unit of function with an enforcement point | Usually yes | `park_recall`, `customer_khata`, `batch_tracking`, `loyalty_points`, `bank_reconciliation` |
| **`limit`** | A numeric ceiling, not a feature | **Never** | `cart_tabs_limit` (3/3/10/50), `free_trial_days` (14) |
| **`marketing`** | Describes the product, not a switch | **Never** | `device_adaptive`, `pwa_install`, `platform_status_badge`, `high_contrast_colors` |

**Estimated split, to be confirmed key-by-key during implementation:** roughly 150 `capability`, ~25 `limit`, ~80 `marketing`. Of the ~150, roughly **80 are genuinely composable** — the rest are always-on parts of the kernel.

> **This classification pass is the single highest-value day of work in the programme.** It converts a pricing matrix into a semantic registry.

## 03.4 — The registry row

```sql
capabilities
  key            VARCHAR(64) PK      -- identical string to today's key. Never changes.
  group_key      VARCHAR(32)         -- the 12 existing groups
  family         VARCHAR(24)         -- NEW: which of the 11 semantic families
  label          VARCHAR(120)        -- canonical English
  description    TEXT
  icon           VARCHAR(48)
  kind           ENUM('capability','limit','marketing')
  is_composable  BOOL
  requires       JSON                -- ["products","inventory"]
  conflicts      JSON
  provides_nav   JSON                -- nav node descriptors
  provides_cards JSON                -- dashboard widget keys
  provides_terms JSON                -- which terminology keys this capability owns
  min_plan       VARCHAR(24) NULL
  status         ENUM('live','beta','soon')
  sort_order     INT
```

`family` is the addition this document makes. It is what lets the AI answer *"do we have X?"* by family before it searches by key, and it is what makes the equivalence tables in §08 machine-readable rather than prose.

## 03.5 — Resolution order — deliberately unchanged

```
capability_state(tenant, key) =
   1. tenant_plan_overrides    ← what the tenant chose
   2. plan_limits              ← what the plan permits at all
   3. config/plans.php         ← last-resort fallback
   4. deny                     ← fail closed
```

The **plan** answers *may they have it*. The **override** answers *did they choose it*. Active requires both.

---

# 04 — Terminology Schema

## 04.1 — Three levels of naming

### Level A — Canonical key
The stable internal identifier. **Never changes, for any reason, ever.**
```
party · resource · inventory · sale · purchase · payment · document
schedule · employee · position · location · work_order · contract
```

### Level B — Semantic role
What the object *means* in this particular business. A finite, registry-controlled set.
```
party → customer | supplier | employee | patient | student | member | guest | client
resource → inventory_item | service | position | location | membership | course
event → sale | order | visit | enrolment | check_in | dispensing | work_order
```
Level B is what the **AI resolves to**. It is not free text.

### Level C — Display vocabulary
What the customer actually sees. **Free text, per tenant, changeable any time.**
```
canonical_key: party
semantic_role: patient
singular:      "Patient"
plural:        "Patients"
```

A second clinic may set the same canonical key and semantic role but display "Client". Nothing downstream notices.

## 04.2 — Why simple word replacement fails

A naive `customer → patient` map produces this within a week:

```
"Customer balance"    → "Patient balance"       ✅ fine
"Customer statement"  → "Patient statement"     ⚠️ a clinic says "patient account statement"
"Customer history"    → "Patient history"       ❌ means medical history. Wrong and dangerous.
"New customer created"→ "New patient created"   ⚠️ a clinic says "registered"
```

**Therefore terminology keys are contextual, not word-level.** The unit of translation is a *phrase in a context*, not a noun.

## 04.3 — The schema

```sql
-- 1. The canonical registry of every translatable slot. Ships with the product.
terminology_keys
  key            VARCHAR(64) PK     -- 'party.statement'
  canonical_key  VARCHAR(32)        -- 'party'          (Level A — for grouping and search)
  context        VARCHAR(32)        -- 'label'|'action'|'report'|'notification'|'empty'|'validation'
  default_label  VARCHAR(160)       -- 'Customer Statement'
  description    TEXT               -- when this string appears, for whoever translates it
  owned_by       VARCHAR(64) NULL   -- capability key that introduces it

-- 2. Reusable industry packs. Ships with the product. Read-only to tenants.
industry_terminology
  industry_key     VARCHAR(32)
  terminology_key  VARCHAR(64)
  singular         VARCHAR(120)
  plural           VARCHAR(120) NULL
  PRIMARY KEY (industry_key, terminology_key)

-- 3. Tenant overrides. Written by the tenant, wins over everything.
tenant_terminology
  tenant_id        BIGINT UNSIGNED
  terminology_key  VARCHAR(64)
  singular         VARCHAR(120)
  plural           VARCHAR(120) NULL
  source           ENUM('template','user','ai')   -- provenance matters for support
  effective_from   DATE NULL                       -- see §25 on versioning
  effective_until  DATE NULL
  updated_by       BIGINT UNSIGNED NULL
  updated_at       TIMESTAMP NULL
  PRIMARY KEY (tenant_id, terminology_key)
```

## 04.4 — Resolution order

```
term(tenant, key) =
   1. tenant_terminology     ← what this tenant typed
   2. industry_terminology   ← the pack their template applied
   3. terminology_keys.default_label   ← canonical English
   4. the key itself         ← visible failure, never a blank
```

**Step 4 matters.** A missing translation must render as `party.statement`, not as an empty string. A visibly wrong label gets reported; a blank one gets shipped.

## 04.5 — The invisibility property

> With an empty `tenant_terminology` and an empty `industry_terminology`, every string resolves to `default_label`, which is **exactly today's English**.

That is what allows ~450 conversion sites to ship to production without a single visible change, and it is what the terminology parity test asserts on every commit.

---

# 05 — Global Terminology Keys

The starting registry. **Roughly 180 keys across 14 canonical groups.** Every one has a `default_label` identical to today's rendered string.

## 05.1 — `party.*`

```
party.label              "Contacts"          nav group
party.singular           "Customer"
party.plural             "Customers"
party.create             "Add Customer"
party.edit               "Edit Customer"
party.details            "Customer Details"
party.list               "All Customers"
party.balance            "Customer Balance"
party.statement          "Customer Statement"
party.history            "Purchase History"      ← NOT "Customer History". Context saved us.
party.ledger             "Customer Ledger"
party.credit_limit       "Credit Limit"
party.outstanding        "Outstanding"
party.empty              "No customers yet"
party.created            "New customer added"
party.search             "Search customers"
party.column_name        "Customer Name"
party.column_phone       "Phone"
party.group              "Customer Group"

party.supplier.singular  "Supplier"
party.supplier.plural    "Suppliers"
party.supplier.balance   "Supplier Balance"
party.supplier.statement "Supplier Statement"
party.supplier.empty     "No suppliers yet"
```

## 05.2 — `resource.*` and `inventory.*`

```
resource.singular        "Product"
resource.plural          "Products"
resource.create          "Add Product"
resource.details         "Product Details"
resource.category        "Category"
resource.brand           "Brand"
resource.empty           "No products yet"
resource.column_name     "Product Name"
resource.column_price    "Price"
resource.variant         "Variant"
resource.composite       "Composite Product"
resource.composition     "Recipe"                ← "Cookbook" today; see §16 conflict C-2

service.singular         "Service"               [V1 build]
service.plural           "Services"
service.duration         "Duration"
service.rate             "Rate"

inventory.label          "Stock"                 nav group
inventory.item           "Stock Item"
inventory.items          "Stock Items"
inventory.balance        "Stock on Hand"
inventory.movement       "Stock Movement"
inventory.low            "Low Stock"
inventory.take           "Stock Audit"
inventory.transfer       "Stock Transfer"
inventory.adjust         "Stock Adjustment"
inventory.batch          "Batch"
inventory.expiry         "Expiry"
inventory.serial         "Serial"
inventory.empty          "No stock recorded"

location.singular        "Warehouse"
location.plural          "Warehouses"
position.singular        "Table"                 [restaurant default]
position.plural          "Tables"
occupancy.singular       "Parked Sale"
occupancy.plural         "Parked Sales"
occupancy.open           "Park Sale"
occupancy.resume         "Recall Sale"
```

## 05.3 — `sale.*`, `purchase.*`, `payment.*`

```
sale.label               "Sell"                  nav group
sale.singular            "Sale"
sale.plural              "Sales"
sale.create              "New Sale"
sale.details             "Sale Details"
sale.total               "Sale Total"
sale.return              "Return"
sale.empty               "No sales yet"
sale.completed           "Sale completed"

purchase.label           "Buy"                   nav group
purchase.singular        "Purchase"
purchase.plural          "Purchases"
purchase.create          "New Purchase"
purchase.return          "Purchase Return"

payment.label            "Money"                 nav group
payment.singular         "Payment"
payment.plural           "Payments"
payment.received         "Payment Received"
payment.made             "Payment Made"
payment.due              "Amount Due"
payment.allocate         "Allocate Payment"

expense.singular         "Expense"
expense.plural           "Expenses"
expense.category         "Expense Category"
```

## 05.4 — `document.*`

```
document.invoice.singular    "Invoice"
document.invoice.plural      "Invoices"
document.invoice.number      "Invoice No."
document.receipt.singular    "Receipt"
document.quotation.singular  "Quotation"
document.order.singular      "Sales Order"
document.po.singular         "Purchase Order"
document.credit_note         "Credit Note"
document.debit_note          "Debit Note"
document.statement           "Statement"
document.delivery_note       "Delivery Note"
document.instruction         "Kitchen Ticket"    ← becomes "Job Card", "Work Order"
```

## 05.5 — `employee.*`, `work.*`, `contract.*`

```
employee.singular        "Staff"
employee.plural          "Staff"
employee.attendance      "Staff Attendance"
employee.shift           "Shift"
employee.role            "Role"

work.singular            "Work Order"            [V1 build]
work.plural              "Work Orders"
work.create              "New Job"
work.status              "Job Status"
work.assignee            "Assigned To"
work.site                "Site Address"
work.parts               "Parts Used"
work.labour              "Labour"
work.empty               "No open jobs"

contract.singular        "Contract"              [V1 build]
contract.plural          "Contracts"
contract.visits          "Visits Included"
contract.expiry          "Contract Expiry"
```

## 05.6 — `report.*` and `nav.*`

```
report.label             "Insights"              nav group
report.receivables       "Customer Receivables"
report.payables          "Supplier Payables"
report.profit_loss       "Profit & Loss"
report.stock_valuation   "Stock Valuation"
report.sales_summary     "Sales Summary"
report.top_products      "Top Products"

nav.home                 "Home"
nav.sell                 "Sell"
nav.buy                  "Buy"
nav.stock                "Stock"
nav.work                 "Work"                  [appears only with work_orders]
nav.money                "Money"
nav.people               "People"
nav.insights             "Insights"
nav.studio               "Studio"
```

## 05.7 — The rule for adding a key

> A capability that introduces a user-visible noun **must** declare its terminology keys in `capabilities.provides_terms` in the same pull request that introduces it. A CI check asserts that every string rendered through `t()` exists in `terminology_keys`, and that every key in `terminology_keys` is either used or explicitly marked deprecated.

Without that check, the registry drifts out of date within two months and the whole feature becomes untrustworthy.

---

# 06 — The V1 Business List

## 06.1 — Conflict identified and resolved

Three documents in this repository contain different business lists:

| Source | List | Problem |
|---|---|---|
| `VENQORE_FINAL_IMPLEMENTATION_BLUEPRINT.md` §04 | 67 across five tiers | Includes Tier C/D/E which need engines that do not exist |
| `config/industries.php` | 21 presets | Includes **MobileRepair, Solar, IT, Consulting** with no engine behind them |
| `06_BUSINESS_CATALOGUE_V1.md` | **48**, three tiers | Built from verified capability lists |

> **Canonical V1 list = the 48 in `06_BUSINESS_CATALOGUE_V1.md`.** The 67-business list remains the roadmap. The four unsupported presets in `config/industries.php` become true when §03's Services build lands, and until then they must not be shown as supported.

## 06.2 — The 48, by tier

**Tier A — ready today, zero new engines (30)**
grocery · supermarket · general store · apparel · footwear · electronics · mobile accessories · computer shop · hardware · auto parts · tyre shop · paint · building materials · furniture · cosmetics · sports goods · toys · optical · pet shop · jewellery · bookstore · stationery · agri inputs · restaurant · café · bakery · sweet shop · juice bar · cloud kitchen · caterer · pharmacy · wholesale · distribution · van/route sales

*(34 names, 30 distinct capability configurations — several share an identical configuration and differ only in terminology.)*

**Tier B — needs the Work Order engine (11)**
mobile repair · auto workshop · appliance repair · tailoring · printing press · laundry & dry cleaning · furniture making · small manufacturing · food processing · solar installation · IT services & AMC

**Tier S — needs Services + Work Order + contracts (7)**
electrician · plumber · AC/HVAC technician · handyman/general trades · pest control · cleaning services · consultant/freelancer/training provider

## 06.3 — Not V1 — vocabulary reserved, capability absent

Defined in this document so the registry is future-proof. **Must not appear in any marketing material.**

| Tier | Businesses | Missing engine |
|---|---|---|
| **C** | gym · fitness studio · salon · barber · spa · clinic · dental · physiotherapy · diagnostic lab · veterinary · tuition centre · driving school · equipment rental · car rental · event rental · photography studio · coworking | **Scheduling + Non-stock Resource + Period** — one family, 16 businesses |
| **D** | construction · interior design · engineering consultancy · marketing agency · law firm · accounting practice · property management | **Relationship (projects) + Work**, on top of C |
| **E** | hotel · guest house · travel agency | C + D + rate calendars + channel integration |

---

# 07 — Business-by-Business Mapping

Twelve archetypes are mapped in full. Every one of the 48 businesses resolves to one of these twelve plus a terminology delta — that is the point of the architecture, and §23's master matrix shows the mapping for all 48.

---

## 07.1 — Retail store

**Business key:** `retail` · **Category:** Tier A · **Pack:** `retail`

| Customer term | Canonical concept | Semantic role | Existing implementation |
|---|---|---|---|
| Customer | Party | `customer` | `Party` + `Customer`, `V3\PartyService` |
| Product | Resource | `inventory_item` | `Product`, `products.type='standard'` |
| Stock | Resource state | — | `Stock`, `V3\InventoryService`, `V3\FifoService` |
| Sale | Event | `sale` | `Sale`, `V3\SaleService` |
| Invoice | Document | `demand` | `Invoice`, `InvoiceItem` |
| Customer Balance | Ledger | `obligation` | `party_snapshots`, `PartyBalanceQuery` |
| Supplier | Party | `supplier` | `Party` + `Supplier` |
| Purchase | Event | `inbound_value` | `Purchase`, `V3\PurchaseService` |
| Expense | Event + Ledger | — | `ExpenseCategory` + `V3\AccountingService` |
| Warehouse | Resource | `location` | `Warehouse` |
| Staff | Party | `employee` | `employees`, `StaffAttendance` |

**Capabilities on:** `pos`, `customer_khata`, `customer_statements`, `credit_limit_rules`, `barcode_scanner`, `split_payments`, `daily_cash_audit`, `park_recall`, `double_entry_ledger`, `expense_manager`, `report_*`
**Capabilities off:** `batch_tracking`, `imei_lifecycle`, `bill_of_materials`, `production`, `qr_menu`, `work_orders`, `services`
**Missing:** nothing.

---

## 07.2 — Restaurant

**Business key:** `restaurant` · **Category:** Tier A · **Pack:** `restaurant`

| Customer term | Canonical concept | Semantic role | Existing implementation |
|---|---|---|---|
| Guest | Party | `customer` | `Party` — identical to retail |
| Menu Item | Resource | `inventory_item` | `Product` |
| Recipe | Resource relationship | `composition` | `Recipe`, `RecipeIngredient`, `V3\ManufacturingService` (685 LOC) |
| Ingredient | Resource | `inventory_item` | `Product` — same table, different role |
| Order | Event | `sale` | `Sale` — **the same engine as a retail sale** |
| Bill | Document | `demand` | `Invoice` |
| Kitchen Ticket | Workflow | `work_progress` | `kitchen_orders` |
| Table | Resource | `position` | `restaurant_tables` |
| Open Table | Event | `occupancy` | `ParkedSale` — **duplicates `restaurant_tables`, DUP-1** |
| QR Menu | Document | `catalogue` | `QrMenu` |
| Staff | Party | `employee` | `employees` |

**Terminology delta from retail:**
```
party.singular          = Guest
resource.singular       = Menu Item
resource.composition    = Recipe
inventory.item          = Ingredient
sale.singular           = Order
document.invoice        = Bill
document.instruction    = Kitchen Ticket
position.singular       = Table
employee.singular       = Staff
```

**Capabilities on:** retail set + `bill_of_materials`, `production`, `auto_assembly_logic`, `qr_menu`, `occupancy`, `work_orders(kitchen)`
**Missing:** nothing. **A restaurant is a retail store with composition, occupancy and a kitchen workflow.**

---

## 07.3 — Pharmacy

**Business key:** `pharmacy` · **Category:** Tier A · **Pack:** `pharmacy`

| Customer term | Canonical concept | Semantic role | Existing implementation |
|---|---|---|---|
| Patient | Party | `customer` | `Party` — **not a new table** |
| Medicine | Resource | `inventory_item` | `Product` |
| Batch | Resource lot | `lot` | `Batch`, `ProductBatch`, `InventoryBatch` |
| Expiry | Rule + Event | `shelf_life` | batch expiry, FIFO-aware |
| Dispensing | Event | `sale` | `Sale` |
| Held Prescription | Event | `occupancy` | `ParkedSale` |
| Medical Invoice | Document | `demand` | `Invoice` |
| Patient Account | Ledger | `obligation` | `party_snapshots` |
| FBR Invoice | Integration | `fiscal_authority` | `FbrService` |

**Terminology delta:** `party.singular = Patient` · `resource.singular = Medicine` · `sale.singular = Dispensing` · `occupancy.singular = Held Prescription`

> **`party.history` must NOT become "Patient History".** In a clinical context that means medical history, which VenQore does not hold. It becomes **"Purchase History"** or **"Dispensing History"**. This is the clearest example of why terminology keys are contextual — see §16, rule A-3.

**Missing:** nothing for retail pharmacy. Clinical records (diagnosis, prescription authoring) are **out of scope and must not be implied.**

---

## 07.4 — Wholesale / Distribution

**Business key:** `wholesale` · **Category:** Tier A · **Pack:** `wholesale`

| Customer term | Canonical concept | Existing implementation |
|---|---|---|
| Party | Party (`customer`) | `Party` |
| Quotation → Sales Order → Invoice | Document (`offer` → `commitment` → `demand`) | `Quotation`, `SalesOrder`, `Invoice` + converters |
| Khata | Ledger (`obligation`) | `party_snapshots`, `aged_receivables` |
| Godown | Resource (`location`) | `Warehouse` |
| Landing Cost | Rule (`cost_allocation`) | in `PurchaseService` |
| Van | Resource (`location`) | `Warehouse` + `StockTransfer` |
| Wholesale Price | Rule (`pricing`) | `products.wholesale_price`, `wholesale_min_quantity` |

**Capabilities on:** retail set + `wholesale_pricing`, `b2b_proposal_builder`, `quotation_conversion`, `aged_receivables`, `locations`, `stock_transfer`, `landing_costs`
**Missing:** nothing.

---

## 07.5 — Electrician / Plumber / HVAC *(the Services archetype)*

**Business key:** `field_service` · **Category:** Tier S · **Pack:** `field_service`

| Customer term | Canonical concept | Semantic role | Implementation |
|---|---|---|---|
| Client | Party | `customer` | `Party` ✅ |
| Service | Resource | `service` | `products.type='service'` 🟡 V1 build |
| Material / Part | Resource | `inventory_item` | `Product` ✅ |
| Van | Resource | `location` | `Warehouse` ✅ |
| Job | Workflow + Event | `work_progress` | `jobs` 🟡 V1 build, from `kitchen_orders` |
| Electrician | Party | `employee` | `employees` ✅ |
| Quotation | Document | `offer` | `Quotation` ✅ |
| Job Card | Document | `instruction` | `work_orders` 🟡 |
| Invoice | Document | `demand` | `Invoice` ✅ |
| AMC / Contract | Schedule + Ledger | `recurrence` | `RecurringInvoice` + `service_contracts` 🟡 |
| Site visit | Event | `presence` | `StaffAttendance` + `jobs.site_address` 🟡 |

**Terminology:**
```
party.singular      = Client
resource.singular   = Material
service.singular    = Service
work.singular       = Job
employee.singular   = Electrician
location.singular   = Van
contract.singular   = Contract
document.instruction= Job Card
```

**Genuinely missing (the only new build in V1):** the service product type, the job record, technician assignment, parts issue with estimated-vs-actual consumption, and service contracts. All specified in `03_SERVICES_AND_FIELD_WORK.md`.

> **What is NOT missing and must not be built:** a second ledger, a second stock engine, a second party table, a second document renderer, a second recurring biller.

---

## 07.6 — Auto workshop / Mobile repair *(the Repair archetype)*

**Business key:** `repair_shop` · **Category:** Tier B · **Pack:** `repair_shop`

Identical canonical mapping to §07.5 with three deltas:

| Delta | Canonical | Implementation |
|---|---|---|
| Work happens at **our** place, not theirs | Resource `position` | `positions` (from R-4) — Bay, Bench |
| The item under repair has an identity | Resource `inventory_item` + serial | `ProductSerial` — IMEI in, IMEI out |
| No van stock | — | `location` = the shop |

```
work.singular       = Repair Order        (auto)  |  Repair  (mobile)
employee.singular   = Mechanic            (auto)  |  Technician
position.singular   = Bay                 (auto)  |  Bench
resource.singular   = Spare               (auto)  |  Part
```

---

## 07.7 — Bakery / Food processing *(the Production archetype)*

**Business key:** `production` · **Category:** Tier A/B · **Pack:** `production`

| Customer term | Canonical | Implementation |
|---|---|---|
| Finished Item | Resource (`inventory_item`, composite) | `products.type='composite'` |
| Raw Material | Resource (`inventory_item`) | `Product` |
| Recipe | Resource composition | `Recipe`, `RecipeIngredient`, `ManufacturingRule` |
| Production Run | Event (`consumption`) | `ProductionRun`, `ProductionLog`, `ProductionLogIngredient` |
| Batch | Resource lot | `Batch`, `ProductBatch` |
| Shelf life | Rule | batch expiry |

**Two production modes already implemented** (per `CLAUDE.md`, verified against `AutoManufacturingService`): **Make Now** — auto-deduct raw materials when composite stock is zero; **Ready Made** — sell from pre-manufactured stock. Both are configuration, not code branches per industry.

---

## 07.8 — Jewellery *(the Weighted + Making-charge archetype)*

| Customer term | Canonical | Implementation |
|---|---|---|
| Item | Resource (`inventory_item`, weighted) | `products.type='weighted'` |
| Making charge | Rule (`pricing`) + ad-hoc line | `CustomCharge` |
| Hallmark / certificate no. | Resource identity | `ProductSerial` |
| Gold rate | Rule (`pricing`) | ⚠️ **no live-rate mechanism** — entered manually |

> **Honest gap:** daily metal-rate driven repricing does not exist. A jeweller enters today's rate. That is workable and is how most shops operate, but do not claim automatic rate feeds.

---

## 07.9 — Optical / Apparel / Footwear *(the Variant archetype)*

| Customer term | Canonical | Implementation |
|---|---|---|
| Article / Frame / Pair | Resource (`inventory_item`) | `Product`, `products.has_variants` |
| Size / Colour / Shade | Resource variant | `ProductVariant`, `VariantAttribute`, `ProductAttribute` |
| Prescription (optical) | ⚠️ custom fields | **not present** — needs the custom-field sidecar |

> **Optical is on the V1 list but has one honest gap:** lens prescription data has nowhere to live until custom fields exist. Either ship custom fields with V1, or sell optical as a variant retailer without prescription capture. **Do not pretend.**

---

## 07.10 — Electronics / Mobile *(the Serial archetype)*

| Customer term | Canonical | Implementation |
|---|---|---|
| IMEI / Serial | Resource unique identity | `ProductSerial`, `imei_scanner`, `imei_lifecycle` |
| Warranty | Schedule (`validity_period`) | ⚠️ **partial** — a date field, no entitlement logic |

> Warranty as a *tracked entitlement* (what it covers, whether a repair is free) is the same shape as `service_contracts` in §03. **Reuse that**, do not build a warranty engine.

---

## 07.11 — Caterer / Printing press *(the Quote-to-Order archetype)*

| Customer term | Canonical | Implementation |
|---|---|---|
| Enquiry → Quote | Document (`offer`) | `Quotation`, `Proposal` |
| Event / Print job | Workflow (`work_progress`) | `work_orders` 🟡 |
| Deposit | Ledger (`settlement`, partial) | `Payment` + allocation |
| Delivery date | Schedule (`assignment_date`) | `jobs.scheduled_for` 🟡 |

---

## 07.12 — IT services & AMC / Consultant *(the Recurring-service archetype)*

| Customer term | Canonical | Implementation |
|---|---|---|
| Client | Party (`customer`) | `Party` ✅ |
| Service (hourly) | Resource (`service`) | `products.type='service'` 🟡 |
| Ticket | Workflow (`work_progress`) | `work_orders` 🟡 |
| Engineer | Party (`employee`) | `employees` ✅ |
| AMC | Schedule (`recurrence`) + Ledger | `RecurringInvoice` ✅ + `service_contracts` 🟡 |
| Retainer invoice | Document (`demand`) | `RecurringInvoice` ✅ |

**Notably: a consultant needs no stock at all.** With `inventory` off, the entire Stock nav group disappears and the product becomes a services-and-invoicing system. That configuration is worth demonstrating, because it is the clearest possible proof that VenQore is not a POS with extras.

---

# 08 — Cross-Business Equivalence Matrix

## 08.1 — The core five

| Canonical | Retail | Restaurant | Pharmacy | Wholesale | Electrician | Auto workshop | Bakery | IT/AMC |
|---|---|---|---|---|---|---|---|---|
| **Party** (customer) | Customer | Guest | Patient | Party | Client | Customer | Customer | Client |
| **Resource** (sold) | Product | Menu Item | Medicine | Product | Service + Material | Labour + Spare | Finished Item | Service |
| **Event** (outbound) | Sale | Order | Dispensing | Invoice | Job | Repair Order | Sale | Ticket |
| **Ledger** (obligation) | Customer Balance | Guest Account | Patient Account | Khata | Client Account | Customer Balance | Customer Balance | Client Account |
| **Document** (demand) | Invoice | Bill | Medical Invoice | Invoice | Invoice | Job Invoice | Invoice | Retainer Invoice |

## 08.2 — Supporting concepts

| Canonical | Retail | Restaurant | Pharmacy | Wholesale | Electrician | Auto workshop | Bakery | IT/AMC |
|---|---|---|---|---|---|---|---|---|
| **Party** (employee) | Staff | Staff | Pharmacist | Staff | Electrician | Mechanic | Baker | Engineer |
| **Resource** (location) | Store | Kitchen | Store | Godown | Van | Store | Kitchen | — |
| **Resource** (position) | — | Table | Counter | — | — | Bay | — | — |
| **Event** (occupancy) | Parked Sale | Open Table | Held Rx | — | — | Job in Bay | — | — |
| **Resource** (composition) | — | Recipe | — | — | Service Package | — | Recipe | Service Package |
| **Workflow** (instruction) | — | Kitchen Ticket | — | — | Job Card | Repair Docket | Prep List | Ticket |
| **Schedule** (recurrence) | — | — | — | Standing Order | AMC | Service Plan | Standing Order | Retainer |
| **Resource** (lot) | — | — | Batch | Batch | — | — | Batch | — |
| **Resource** (identity) | — | — | — | — | — | VIN / IMEI | — | Asset Tag |

## 08.3 — Vocabulary reserved for post-V1 tiers

Defined now so the registry never needs restructuring. **None of these is claimable in V1.**

| Canonical | Clinic | School | Gym | Salon | Rental | Construction | Hotel |
|---|---|---|---|---|---|---|---|
| **Party** (customer) | Patient | Student | Member | Client | Renter | Client | Guest |
| **Party** (employee) | Practitioner | Teacher | Trainer | Stylist | Staff | Worker | Staff |
| **Resource** | Treatment | Course | Membership | Service | Rentable Asset | Work Package | Room |
| **Event** | Visit | Enrolment | Check-in | Appointment | Hire | Work Order | Stay |
| **Ledger** | Patient Account | Fee Account | Member Dues | Client Account | Hire Account | Client Account | Folio |
| **Document** | Medical Invoice | Fee Invoice | Receipt | Bill | Hire Agreement | Progress Invoice | Folio Bill |
| **Position** | Room | Classroom | Court | Chair | — | Site | Room |
| **Schedule** | Appointment slot | Timetable | Class slot | Booking | Hire period | Milestone | Reservation |
| **Missing engine** | Scheduling | Scheduling + Period | Period | Scheduling | Period + Scheduling | Project | all three |

**Read the last row.** Every Tier C/D/E column is blocked by **Schedule** or **Period** — never by Party, Resource, Ledger, Event or Document. That is the strongest possible evidence that the canonical model is right, and it is why Scheduling is the single highest-leverage build after V1.

---

# 09 — Feature → Canonical Concept Matrix

## 09.1 — Method

Every one of the 256 keys in `PlanFeatureMatrixSeeder` is assigned a family, a kind and a composability flag. Below is the mapping **by group**, with the keys that carry semantic weight named explicitly. The full 256-row assignment is produced during the seeding pass in `01_BACKEND_AND_DATA.md` §03; this section fixes the *rules* that pass must follow.

| Seeder group | Primary family | Notable keys | Kind split |
|---|---|---|---|
| 1 · Onboarding & First Impression | Access, Communication | `demo_store`, `industry_seeding`, `multi_store_hub`, `cashier_pin_login`, `smtp_mail`, `sms_gateway`, `security_activity_log` | mostly `marketing`; `free_trial_days` is a `limit` |
| 2 · POS & Checkout | Event, Resource, Document, Rule | `park_recall`, `split_payments`, `auto_cash_rounding`, `daily_cash_audit`, `imei_scanner`, `auto_assembly_checkout`, `negative_stock_lock`, `custom_charge_toggle`, `service_fee_additions` | `capability`; `cart_tabs_limit` is a `limit`; `high_contrast_colors`, `device_adaptive` are `marketing` |
| 3 · Invoicing, Khata & Receivables | Ledger, Party, Document, Communication | `customer_khata`, `customer_statements`, `aged_receivables`, `credit_limit_rules`, `customer_payment_alloc`, `loyalty_points`, `customer_wallet`, `digital_gift_cards`, `wholesale_pricing`, `quotation_conversion`, `whatsapp_reminders` | `capability`, highly composable |
| 4 · Procurement & Suppliers | Event, Party, Ledger, Rule | purchase orders, supplier khata, landing costs, debit notes | `capability` |
| 5 · Inventory & Multi-Warehouse | Resource, Event | `batch_tracking`, `imei_lifecycle`, `locations`, `stock_transfer`, `stock_take_audit`, `bill_of_materials`, `production` | `capability`, highly composable |
| 6 · E-Commerce & VenSynQ | Integration | WooCommerce sync, platform clients | `capability` |
| 7 · Double-Entry Accounting & Finance | **Ledger** | chart of accounts, journal, trial balance, P&L, cash flow, `bank_reconciliation`, `fund_management` | `capability`, **the ledger core is never composable** |
| 8 · Report Factory (40 reports) | all — read-only | `report_*` keys | `capability`, composable, but each gated by the family it reads |
| 9 · Platform HQ & Infrastructure | Access (platform) | superadmin, licensing, backups | **not tenant-composable at all** |
| 10 · AI & Automation Extras | all — advisory | Vena, SmartCapture, Growth Engine, AI descriptions | `capability`; **must be optional** |
| 11 · Live Chat & Engagement | Communication | visitor chat, canned responses | `capability` |
| 12 · Support & Onboarding Perks | Access, Communication | support tiers, onboarding help | `marketing` |

## 09.2 — The classification rules

1. **If disabling it changes no behaviour anywhere, it is `marketing`.** `pwa_install` is true of the product, not a switch.
2. **If it holds a number rather than a boolean, it is a `limit`.** Never composable.
3. **If it belongs to the Ledger core, it is `capability` but `is_composable = false`.** A tenant may not switch off double-entry.
4. **If it is a report, it is composable but must declare `requires`** on the family it reads. A stock valuation report without `inventory` is a broken menu item.
5. **If it has no enforcement point today, it is `is_composable = false` until F-3 wires one.** A toggle that changes nothing is worse than no toggle.

## 09.3 — Falsely different features — the highest-value section for reuse

Each row below is a set of things that *look* like separate features and are the same canonical concept. **None of them justifies new code.**

| Apparently different | Canonical | Verdict |
|---|---|---|
| Customer khata · Supplier khata · Patient account · Student fees · Member dues · Guest folio | **Ledger `obligation`** | One engine. Party role and terminology are the only differences. |
| Product · Ingredient · Medicine · Material · Spare · Part · Article · Frame | **Resource `inventory_item`** | One table. `products`. |
| Recipe · BOM · Assembly · Service package · Treatment pack · Procedure kit · Prep list | **Resource `composition`** | One engine. `V3\ManufacturingService`, 685 LOC, already generic. |
| Parked sale · Restaurant table · Held prescription · Job in bay · Salon chair · Hotel folio | **Event `occupancy`** | One engine — **and it is currently two (DUP-1). Fix before adding a third.** |
| Kitchen ticket · Work order · Job card · Repair docket · Lab request · Prescription fill | **Workflow `work_progress`** | One engine. `kitchen_orders`, generalised in V1. |
| Recurring invoice · Membership dues · Rent · Tuition fee · AMC · Retainer · Maintenance contract | **Schedule `recurrence`** | One engine. `recurring_invoices` + generator command. |
| Staff attendance · Student attendance · Member check-in · Site sign-in · Visitor log | **Event `presence`** | One engine. `staff_attendances` + gap approval flow. |
| Serial · IMEI · VIN · Asset tag · Membership card · Hallmark number | **Resource `unique identity`** | One table. `product_serials`. |
| Warehouse · Branch · Godown · Kitchen · Van · Site store · Yard | **Resource `location`** | One table. `warehouses`. |
| Gift card · Store credit · Class pack · Prepaid course · Deposit · Advance · Wallet | **Ledger `prepaid value`** | Two tables today (`gift_cards`, `store_credits`) — should be one. |
| Tax · Landing cost · Cash rounding · Depreciation · Commission · Freight | **Rule `calculation`** | Same *shape*, four separate implementations. Unify after the reveal, not in V1. |
| Barcode label · Price tag · QR menu · Shelf label | **Document `render`** | One renderer, many templates. DUP-3. |
| Invoice reminder · Low-stock alert · Plan notification · Chat message · Marketing campaign | **Communication** | Five mechanisms today (DUP-4). One capability. |
| Activity log · Store activity · Platform activity · Platform audit · Terminal activity · Chat learning log | **Access & Audit `activity`** | Six tables (DUP-6). One with a source discriminator. |

## 09.4 — Genuinely different — do NOT merge these

Equally important. Forcing these together would be a worse error than leaving the duplication.

| Looks similar | Actually | Why they must stay separate |
|---|---|---|
| `Party` vs `User` | Counterparty vs authenticating identity | A patient never logs in; a cashier is not owed money. Merging puts auth into the receivables path. |
| `Position` (table/bay) vs `Location` (warehouse) | Occupiable place vs quantity-holding place | A bay holds no stock; a warehouse is not occupied. Different behaviour, different indexes. |
| `Service` vs `inventory_item` | No lot, no cost basis vs FIFO-costed | Sharing the row in `products` is fine; sharing the stock path is not. This is why §03's guards exist. |
| `Quotation` vs `Sales Order` vs `Invoice` | Offer vs commitment vs demand | Three legal states with different reversibility. One table would lose that. |
| `sales`/`purchases` vs new document types | Carry FIFO + ledger wiring | DUP-2: keep these; new document types go on the shared Document capability. |
| Ledger `journal_entry` vs Event `sale` | Financial record vs business occurrence | One sale may produce several journal entries. Collapsing them destroys auditability. |
| `Batch` (lot with expiry) vs `Serial` (unique unit) | Many units share a lot; a serial is one unit | Different cardinality. Different costing behaviour. |
| Tenant `settings` vs `tenant_plan_overrides` | Preference vs entitlement | A preference is free; an entitlement is sold. Merging makes every preference a billing question. |

---

# 10 — Canonical Concept → Existing Code Matrix

Verified against the repository, 11 August 2026.

| Canonical concept | Model(s) | Service(s) | Controller(s) | Frontend surface |
|---|---|---|---|---|
| **Party** | `Party`, `Customer`, `Supplier` | `V3\PartyService`, `LedgerService`*(→`PartyBalanceQuery`)* | `PartyController`, `CustomerController`, `SupplierController` | `Pages/Parties/*` |
| **Party · employee** | `employees` (no model file at root), `StaffAttendance`, `StaffDailySummary`, `StaffActivityGap`, `StaffInvitation` | — | `StaffController`, `StaffHubController`, `StaffAttendanceController`, `AttendanceController`, `StaffInvitationController` | `Pages/Staff/*` |
| **Resource · inventory_item** | `Product`, `ProductVariant`, `VariantAttribute`, `ProductAttribute`, `ProductBarcode`, `ProductImage`, `ProductUnit`, `SharedProduct` | `V3\InventoryService`, `V3\UomService`, `SharedCatalogService` | `InventoryController`, `ProductVariantController`, `ProductAttributeController` | `Pages/Inventory/*` |
| **Resource · composition** | `Recipe`, `RecipeIngredient`, `RecipeMedia`, `ManufacturingRule`, `ManufacturingIngredient` | `V3\ManufacturingService` (685 LOC), `AutoManufacturingService` | `CookbookController`, `ProductionController` | `Pages/Cookbook/*`, `Pages/Production/*` |
| **Resource · lot** | `Batch`, `ProductBatch`, `InventoryBatch`, `SaleItemBatch` | (inside FIFO) | `BatchTrackingController` | `Pages/Batches/*` |
| **Resource · identity** | `ProductSerial` | — | `SerialTrackingController` | `Pages/Serials/*` |
| **Resource · location** | `Warehouse`, `StockTransfer`, `StockTransferItem` | — | `StockOperationsController`, `StockTransferController` | `Pages/Stock*` |
| **Resource · position** | `RestaurantTable` | — | `RestaurantDashboardController` ⚠️ | `Pages/Restaurant/*` |
| **Ledger** | `JournalEntry`, `JournalItem`, `Payment`, `PaymentAllocation`, `TransactionAllocation` | **`V3\AccountingService`**, `V3\PaymentService`, `V3\SettlementService`, **`FinancialReportingService`** | `AccountingController`, `PaymentController`, `FinanceController`, `FundController`, `BankReconciliationController` | `Pages/Accounting/*`, `Pages/Finance/*` |
| **Ledger · prepaid** | `GiftCard`, `StoreCredit`, `StoreCreditBalance`, `LoyaltyPoint`, `LoyaltyBalance` | — | `GiftRedemptionController` | — |
| **Event · outbound** | `Sale`, `SaleItem`, `Invoice`, `InvoiceItem` | **`V3\SaleService`** (805 LOC), `V3\FifoService`, `SaleReversalService` | `SaleController`, `PosController`, `InvoiceController` | `Pages/Pos.jsx`, `Pages/Sales/*` |
| **Event · inbound** | `Purchase`, `PurchaseItem`, `PurchaseOrder`, `PurchaseOrderItem` | `V3\PurchaseService` | `PurchaseOrderController` | `Pages/Purchases/*` |
| **Event · reversal** | `DebitNoteItem`, returns | `SaleReversalService` | `ReturnController`, `PosReturnController`, `DebitNoteController` | `Pages/Returns/*` |
| **Event · occupancy** | `ParkedSale` **+** `RestaurantTable` ⚠️ DUP-1 | — | `ParkedSaleController` | POS park/recall |
| **Event · movement** | `StockMovement`, `StockTransfer` | `V3\InventoryService` | `StockTransferController` | `Pages/StockTransfers/*` |
| **Event · count** | `StockTake`, `StockTakeItem` | — | `StockTakeController` | `Pages/StockTakes/*` |
| **Event · presence** | `StaffAttendance`, `StaffDailySummary`, `StaffActivityGap` | — | `StaffAttendanceController` | `Pages/Staff/*` |
| **Schedule · recurrence** | `RecurringInvoice` | `GenerateRecurringInvoices` command | `RecurringInvoiceController` | `Pages/RecurringInvoices/*` |
| **Workflow · instruction** | `kitchen_orders` (table) | — | `RestaurantDashboardController` ⚠️ | `Pages/Restaurant/*` |
| **Rule · tax** | — | `V3\TaxService` | `SettingsController` | tax settings section |
| **Rule · threshold** | — | `Growth\ThresholdTuner`, `InsightCatalog`, `OutcomeEvaluator` | `GrowthEngineController` | `Pages/Growth/*` |
| **Document** | `Quotation`, `QuotationItem`, `Proposal`, `ProposalItem`, `SalesOrder`, `SalesOrderItem`, `PurchaseProposal`, `QrMenu`, `CustomCharge` | ~20 `Services/Tools/*` PDF generators ⚠️ DUP-3 | `ProposalController`, `SalesOrderController`, `PublicToolController`, `BarcodeController`, `LabelController` | `Pages/Tools/*` |
| **Communication** | `InvoiceReminder`, `ChatSession`, `ChatMessage`, `CannedResponse`, `NewsletterSubscriber` | `MessagingAuditService`, `ChatAIService`, `ChatRoutingService` | `CommunicationController`, `InvoiceReminderController`, `NotificationController`, `MarketingCampaignController`, `VisitorChatController` | `Components/ChatWidget.jsx` |
| **Integration** | `WooConnection`, `WooProductLink`, `WooSyncQueue`, `WooSyncLog`, `WebhookLog`, `SmartCaptureAlias` | `FbrService`, 8 `SmartCapture/*` services, `PlatformRegistry`/`PlatformClient` | `WooCommerceController`, `VenSynQController`, `EInvoicingController` | `Pages/VenSynQ/*` |
| **Access & Audit** | `Tenant`, `User`, `TenantUser`, `Plan`, `PlanLimit`, `PlanFeature`, **`TenantPlanOverride`**, `Terminal`, 6 activity models ⚠️ DUP-6 | **`PlanRepository`**, `PlanGate`, `ReportTierGate`, `AuditService`, `TenantCloner` | `AdminController`, `SettingsController`, `SuperAdmin/*` | `Pages/Settings/*` |
| **Appearance** | `UserPreference`, `dashboard_layouts` | **`App\Support\Appearance`** | `AppearanceController`, `AppearanceSettingsController` | `theme/appearance.js`, `theme/color.js` |

### ⚠️ Two flags raised by this matrix

**`RestaurantDashboardController` is vertical-specific code.** It is the only controller in the repository named after an industry, and it violates hard rule 5 (§01.4). It must become a *configuration of the occupancy + work-order capabilities*, not a restaurant controller. Doing so is what makes salon chairs and workshop bays free instead of requiring `SalonDashboardController` and `WorkshopDashboardController`.

**`CookbookController` is vertical-adjacent naming.** "Cookbook" is restaurant vocabulary sitting at the canonical layer. The canonical name is **composition**; "Recipe" and "Cookbook" are display terms. See §16, conflict C-2.

---

# 11 — Canonical Concept → Database Matrix

| Canonical | Table(s) | Tenant-scoped | Change proposed | Rationale |
|---|---|---|---|---|
| Party | `parties`, `customers`, `suppliers`, `employees`, `party_snapshots` | ✅ `tenant_id` | **Unify on Party + role.** `parties.category` already anticipates it. | DUP-7 |
| Resource · item | `products`, `product_variants`, `variant_attributes`, `product_attributes`, `product_barcodes`, `product_images`, `product_units`, `shared_products` | ✅ | `type` enum **+= `'service'`** | §03 |
| Resource · composition | `recipes`, `recipe_ingredients`, `recipe_media`, `manufacturing_rules`, `manufacturing_ingredients` | ✅ | rename → `compositions`, `composition_items` | R-6 |
| Resource · lot | `batches`, `product_batches`, `inventory_batches`, `sale_item_batches` | ✅ | **none** — leave alone | Four tables, but they are genuinely different joins |
| Resource · identity | `product_serials` | ✅ | none | Already generic |
| Resource · location | `warehouses`, `stock_transfers`, `stock_transfer_items` | ✅ | none (terminology only) | R-7 |
| Resource · position | `restaurant_tables` | ✅ | → `positions` | R-4 |
| Ledger | `journal_entries`, `journal_items`, `payments`, `accounts` | ✅ | **none. Protect absolutely.** | The one hard wall |
| Ledger · allocation | `payment_allocations` **+** `transaction_allocations` | ✅ | **merge into one `allocations`** | DUP-5, live bug in `CLAUDE.md` |
| Ledger · prepaid | `gift_cards`, `store_credits`, `store_credit_balances`, `loyalty_points`, `loyalty_balances` | ✅ | merge value-holding tables post-V1 | Not urgent |
| Event · outbound | `sales`, `sale_items`, `invoices`, `invoice_items` | ✅ | **none** — carries FIFO + ledger wiring | DUP-2 |
| Event · inbound | `purchases`, `purchase_items`, `purchase_orders`, `purchase_order_items` | ✅ | none | |
| Event · occupancy | `parked_sales` **+** `restaurant_tables` | ✅ | **merge into `occupancies` + `positions`** | **DUP-1 — do first** |
| Event · movement | `stock_movements`, `stock_transfers` | ✅ | none | |
| Event · count | `stock_takes`, `stock_take_items` | ✅ | none | |
| Event · presence | `staff_attendances`, `staff_daily_summaries`, `staff_activity_gaps` | ✅ | none | Already generic |
| Schedule · recurrence | `recurring_invoices` | ✅ | none | |
| Workflow · instruction | `kitchen_orders` | ✅ | → `work_orders` **+ `kind`** | R-3, feeds §03 |
| Rule | `settings`, tax config, `parties.credit_limit` | ✅ | none in V1 | Unify post-reveal |
| Document | `quotations`, `proposals`, `sales_orders`, `debit_notes`, `qr_menus`, `custom_charges` | ✅ | `custom_charges` → `ad_hoc_lines` | R-5 |
| Communication | `invoice_reminders`, `notifications`, `chat_sessions`, `chat_messages`, `canned_responses`, `newsletter_subscribers` | ✅ | one Communication capability post-V1 | DUP-4 |
| Integration | `woo_connections`, `woo_product_links`, `woo_sync_queue`, `woo_sync_logs`, `webhook_logs`, `smart_capture_aliases` | ✅ | none | |
| Access | `tenants`, `users`, `tenant_users`, `plans`, `plan_limits`, `plan_features`, **`tenant_plan_overrides`** | mixed | **extend, never replace** | The decisive asset |
| Audit | `activities`, `activity_logs`, `store_activity_logs`, `platform_activity_logs`, `platform_audit_logs`, `terminal_activities` | mixed | merge post-V1 | DUP-6 |
| Appearance | `user_preferences`, `dashboard_layouts` | ✅ | `dashboard_layouts` → `layout_preferences`, `dashboard_key` → `surface` | R-10 |
| **Dead** | `transactions` + 19-line `Transaction` model | ✅ | **retire.** One write site: `WooCommerceController:209` | `CLAUDE.md` wrongly calls it the core model |

**New tables introduced by this programme — nine, total.**
`capabilities` · `capability_search_index` · `terminology_keys` · `industry_terminology` · `tenant_terminology` · `occupancies` · `positions` · `jobs` (+ `job_lines`, `job_assignments`, `job_events`) · `service_contracts` (+ `employee_skills`)

> **Nine new tables to serve 48 business types.** That number is the whole argument for this architecture. A vertical-per-vertical approach would need dozens.

---

# 12 — Canonical Concept → UI Surface Matrix

Every surface where terminology must resolve. **A key missed on any of these produces a screen that is half-translated, which reads worse than no translation at all.**

| Surface | Where it lives today | Resolution point | Risk if missed |
|---|---|---|---|
| Sidebar / nav | `Layouts/OneGlanceLayout.jsx` — **hard-coded array with `locked: !store?.features?.X`** | registry `provides_nav` + `t()` | 🔴 The most visible failure |
| Page title | per page `<Head title=...>` | `t()` | 🔴 |
| Breadcrumb | layout | `t()` | 🟠 |
| Buttons | per page | `t('*.create')` | 🔴 |
| Form field labels | `Components/InputLabel.jsx` consumers | `t('*.column_*')` | 🔴 |
| Table column headers | `Components/DataTable.jsx` consumers | `t()` | 🔴 |
| Filters | `Components/FilterPanel.jsx` | `t()` | 🟠 |
| Global search | `Components/OmniSearch.jsx`, `SearchController` | `t()` **+ reverse map (§24)** | 🔴 search must accept "patients" |
| Command palette | `Components/CommandPalette.jsx` | `t()` + reverse map | 🟠 |
| Empty states | `Components/EmptyState.jsx` | `t('*.empty')` | 🟠 |
| Toasts / notifications | `Components/Toast.jsx`, `notifications` table | `t('*.created')` | 🟠 |
| Validation errors | Laravel `FormRequest` messages | **server-side `Terms::get()`** | 🟠 "The customer field is required" |
| Reports | `Pages/Reports/*`, `ReportController` | `t('report.*')` | 🔴 |
| Dashboard cards | `DashboardController` + widgets | `t()` + `provides_cards` | 🔴 |
| Export headers | `app/Exports/*` (maatwebsite) | **server-side** | 🟠 often forgotten |
| PDF documents | ~20 `Services/Tools/*` generators | **server-side — DUP-3 makes this hard** | 🔴 |
| Email templates | `app/Mail/*` | server-side | 🟠 |
| SMS / WhatsApp templates | `InvoiceReminder`, SMS gateway | server-side | 🟠 |
| Chat / AI responses | `AiController`, `VenaAssistController`, `ChatAIService` | `t()` + reverse map | 🔴 Vena saying "customer" to a clinic breaks the illusion |
| Help text / tours | 8 `*TourGuide.jsx` components | `t()` | 🟡 |
| Offline cache | `LocalDB.js` (12 Dexie stores) | **terms cached client-side with the catalogue** | 🟠 offline POS must not revert to English |

> **The offline row is the one that gets missed.** The Dexie catalogue is populated once and used while disconnected. If terminology is not cached with it, a plumber's offline POS says "Customer" while the online one says "Client".

---

# 13 — Terminology Packs

## 13.1 — Structure

A **pack** is a row set in `industry_terminology`, not code. Twelve ship with V1 — one per template in `06_BUSINESS_CATALOGUE_V1.md` §06.

```
base            (canonical English — the implicit fallback, not a stored pack)
├── retail
│   ├── fashion_variants      Size/Colour/Shade deltas
│   ├── electronics_serial    IMEI, Warranty deltas
│   ├── hardware_materials    Godown, multi-unit deltas
│   └── jewellery             Making charge, Hallmark deltas
├── food
│   ├── restaurant            Guest, Menu Item, Order, Bill, Table, Kitchen Ticket
│   └── production            Finished Item, Raw Material, Batch Run
├── pharmacy                  Patient, Medicine, Dispensing, Held Prescription
├── wholesale                 Party, Khata, Godown, Van
├── field_service             Client, Material, Job, Technician, Van, Contract
├── repair_shop               Customer, Part, Repair Order, Mechanic, Bay
├── workshop                  Client, Material, Work Order, Bench
└── services_contracts        Client, Service, Ticket, Engineer, AMC
```

`extends` is a real column: a pack inherits its parent's rows and overrides only its deltas. `fashion_variants` stores **four** rows, not forty.

## 13.2 — Worked pack — `field_service`

```
party.singular          Client            party.plural            Clients
party.balance           Client Balance    party.statement         Client Statement
party.history           Job History
resource.singular       Material          resource.plural         Materials
service.singular        Service           service.plural          Services
inventory.label         Van Stock         location.singular       Van
sale.singular           Invoice           sale.plural             Invoices
work.singular           Job               work.plural             Jobs
work.create             New Job           work.assignee           Assigned Electrician
work.site               Site Address      work.parts              Parts Used
employee.singular       Electrician       employee.plural         Electricians
contract.singular       Contract          contract.visits         Visits Included
document.instruction    Job Card
document.quotation      Estimate
nav.stock               Van Stock         nav.work                Jobs
report.receivables      Client Receivables
```

**24 rows. That is an entire vertical.**

## 13.3 — Pack authoring rules

1. **A pack may only set keys that exist in `terminology_keys`.** CI fails otherwise.
2. **A pack must set `plural` wherever the English plural is irregular.** "Staff"/"Staff", "Person"/"People".
3. **A pack must never set a key owned by a capability the pack does not enable.** A retail pack setting `work.singular` is a bug.
4. **Every pack is walked end-to-end by a human before it ships.** A pack that has never been used produces a broken first impression at the worst possible moment.

---

# 14 — Capability Dependencies

## 14.1 — The graph, derived from real code coupling

```
ledger ──┬── expense_manager
         ├── customer_khata ── aged_receivables ── customer_statements
         ├── supplier_khata ── aged_payables
         ├── bank_reconciliation
         ├── fund_management
         └── report_profit_loss / trial_balance / cash_flow

products ─┬── inventory ─┬── fifo_costing ──── (ledger)
          │              ├── batch_tracking ── batch_expiry
          │              ├── imei_lifecycle
          │              ├── locations ─────── stock_transfer
          │              └── stock_take_audit
          ├── product_variants
          ├── composition ── production ── auto_assembly
          └── barcode_label_factory

parties ──┬── customers ── loyalty / wallet / gift_cards
          ├── suppliers ── purchase_orders ── landing_costs
          └── employees ── attendance ── summaries

pos ──────┬── occupancy
          ├── split_payments / cash_rounding / daily_cash_audit
          └── webusb_printing

services ─┬── work_orders ─┬── job_parts_issue   requires inventory
          │                ├── job_technicians   requires employees
          │                ├── job_quotations    requires quotations
          │                └── job_site_address
          ├── van_stock                          requires locations + stock_transfer
          └── service_contracts                  requires recurring_invoices + parties
```

## 14.2 — Three behavioural rules

1. **The ledger is the one hard wall.** Never composable. Everything financial hangs off it.
2. **Enabling pulls in its `requires` closure**, shown to the user *before* they confirm — never applied silently.
3. **Disabling with live dependents is refused**, with the dependents named. **Never cascade a disable.** That is how a tenant loses their ageing report by switching off "khata".

## 14.3 — The `conflicts` column

Rare but real. `negative_stock_lock` conflicts with configurations that require negative stock (van sales issuing before the load is recorded). Two capabilities that cannot both be true must say so in the registry, not fail at runtime.

---

# 15 — Worked Examples & Test Cases

Twenty scenarios proving *one backend capability → many business experiences*. Each is a test case, not an illustration: the assertion column is what CI checks.

| # | Business | User does | Canonical path | Assertion |
|---|---|---|---|---|
| 1 | Retail | Sells a bag of rice | Event `sale` → FIFO → Ledger | stock −1, COGS at lot cost, Dr Receivable |
| 2 | Restaurant | Rings up a biryani | **identical path** + composition deducts rice, chicken, oil | same journal shape; raw materials deducted |
| 3 | Pharmacy | Dispenses a strip | **identical path** + batch selected by earliest expiry | correct batch consumed, expiry respected |
| 4 | Electrician | Invoices a job | **identical path**; service line no stock, part line FIFO off the van | zero stock rows for the service line |
| 5 | Wholesale | Converts a quote to an order to an invoice | Document `offer`→`commitment`→`demand` | one converter, three states, one ledger entry at invoice |
| 6 | Restaurant | Opens table 4 | Event `occupancy`, `position_id` set | `occupancies` row, not `restaurant_tables` |
| 7 | Retail | Parks a sale for "Ahmed" | **identical**, `position_id` NULL | same table, same code |
| 8 | Auto workshop | Puts a car in bay 2 | **identical**, position = bay | proof that DUP-1 was worth fixing |
| 9 | Bakery | Runs a production batch | Event `consumption` via composition | raws down, finished up, WIP posted |
| 10 | Electrician | Builds an "AC service" package | **same composition engine**, members include a service | service member not deducted from stock |
| 11 | IT/AMC | Bills a monthly retainer | Schedule `recurrence` | `recurring_invoices` generates; no new engine |
| 12 | Wholesale | Bills a standing monthly order | **identical mechanism** | same command, same table |
| 13 | Retail | Records staff attendance | Event `presence` | `staff_attendances` |
| 14 | Field service | Technician checks into a site | **identical mechanism** + `jobs.site_address` | same table, gap approval flow reused |
| 15 | Electronics | Sells a phone by IMEI | Resource `identity` | serial moves from stock to sold |
| 16 | Auto workshop | Books a car in by VIN | **identical**, terminology only | `product_serials`, label "VIN" |
| 17 | Pharmacy | Prints a shelf label | Document `render` | same generator as a retail price tag |
| 18 | Restaurant | Publishes a QR menu | **same renderer**, different template | proves DUP-3's value |
| 19 | Any | Renames "Customer" → "Patient" | Terminology Level C | **zero code change**; nav, forms, reports, PDF, WhatsApp all follow |
| 20 | Consultant | Switches `inventory` off | Capability composition | Stock nav gone; API returns 403; P&L still balances |

**Cases 19 and 20 are the acceptance tests for the entire programme.** If both pass across all eight reference tenants, the semantic layer works.

---

# 16 — Ambiguity & Conflict Rules

Real collisions found while writing this document. Each has a decided resolution.

| # | Conflict | Resolution |
|---|---|---|
| **C-1** | "Table" means a database table **and** a restaurant table | Canonical name is **`position`**. "Table" is display-only. Never use "table" in a capability key. |
| **C-2** | "Recipe"/"Cookbook" are restaurant words sitting at the canonical layer (`recipes`, `CookbookController`) | Canonical is **`composition`**. "Recipe" is the food pack's display term. Rename the table (R-6); rename the controller with it. |
| **C-3** | "Customer history" means purchase history in retail and **medical history** in a clinic | Never expose a `party.history` key that resolves to a bare "History". The canonical default is **"Purchase History"**; packs override it. Clinical records are out of scope. |
| **C-4** | "Order" means a sales order (commitment) in wholesale and a completed sale in a restaurant | Two keys: `document.order` (commitment) and `sale.singular` (event). A restaurant sets `sale.singular = Order` and never touches `document.order`. |
| **C-5** | "Service" means a sellable resource **and** a PHP service class | Canonical resource subtype is **`service`**; the code layer is being renamed to `app/Engines/` (R-2), which removes the collision entirely. |
| **C-6** | "Location" (warehouse) vs "site" (where a job happens) | `location` is a Resource that holds quantity. A job site is an **attribute of the job** (`jobs.site_address`), not a location. Do not create warehouses for customer addresses. |
| **C-7** | "Staff"/"Employee" is singular-plural irregular and varies by business | Packs must set both `singular` and `plural`. `terminology_keys` marks irregulars so the editor warns. |
| **C-8** | `RestaurantDashboardController` is vertical-specific code | Violates hard rule 5. Becomes a configuration of occupancy + work orders. **No further industry-named controllers may be created.** CI check on controller names. |
| **C-9** | `config/industries.php` presets vs terminology packs — two overlapping concepts | **Presets seed data** (categories, units, attributes). **Packs set vocabulary.** A template references one of each. Do not merge them; do not let them disagree. |
| **C-10** | A tenant renames "Invoice" to "Bill" but the legal document must say "Tax Invoice" | Terminology has a **`legal` context** that packs may not override where a jurisdiction mandates wording. FBR e-invoicing output is exempt from tenant terminology. |

## 16.1 — The tie-break rule

> When two businesses need the same canonical concept to behave *differently* — not just be named differently — that is a **subtype**, not a new concept. Add a discriminator column to the existing table. Only when the subtype needs different *storage* does it become a new table, and that decision needs a written justification in this document.

Applied: `work_orders.kind` (kitchen vs job) is a subtype. `positions` vs `locations` is a genuine split, justified in §09.4.

---

# 17 — AI Resolution Rules

## 17.1 — What Vena is, stated as law

> **Vena understands. VenQore presents. The user decides. The engines execute.**

Vena is a **translator and recommender**. It never writes code, never creates schema, never changes state without approval, and never returns a key that is not in the registry.

```
User language
    ↓
[1] Normalise            lowercase, strip, transliterate (Urdu/Roman-Urdu → tokens)
    ↓
[2] Reverse-map          "patients" → semantic_role 'patient' → canonical 'party'      §24
    ↓
[3] Capability search    capability_search_index: soundex + metaphone + FULLTEXT
    ↓
[4] Dependency resolve   requires-closure, conflicts check
    ↓
[5] Validate             every key exists · every key is composable · plan permits
    ↓
[6] Propose              rendered in the tenant's OWN terminology, editable
    ↓
[7] User approves        writes tenant_plan_overrides + tenant_terminology
    ↓
[8] Audit                applied_by, reason, original_value — already in the table
```

**Steps 1–5 cost nothing.** They are SQL and PHP. An LLM is only reached at step 6, and only when steps 2–3 return nothing.

## 17.2 — The four tiers

| Tier | Method | Cost | Handles |
|---|---|---|---|
| **0** | Exact match against `terminology_keys` + capability labels | £0 | "batch tracking", "khata" |
| **1** | `capability_search_index` — soundex + metaphone + FULLTEXT, the pattern already proven in `product_search_index` | £0 | "godown", "maal", "stock ka record" |
| **2** | Embedding cosine — 256 floats per capability, computed in PHP. **No vector database.** ~250 capabilities is microseconds. | £0 after one-off | "I need to know what's about to expire" |
| **3** | LLM, grounded, constrained to registry keys, cached in the `visitor_chat_cached_answers` pattern | pennies | "I run a small AC repair setup with two vans" |

**Expected tier-3 firing rate: one to three times in a tenant's entire lifetime** — onboarding and one or two later expansions.

## 17.3 — Worked resolutions

**Input:** *"I need to keep track of my patients and what they owe me."*
```
patients        → role 'patient'  → canonical 'party'
owe me          → 'obligation'    → canonical 'ledger'
Capabilities:     parties, customer_khata, aged_receivables, customer_statements, ledger
Terminology:      party.singular = Patient · party.plural = Patients
                  party.balance  = Patient Balance
                  party.history  = Purchase History        ← C-3 enforced, never "Patient History"
Tier reached:     1
```

**Input:** *"I run a restaurant. I need tables, orders, kitchen tickets, ingredients, staff and customer accounts."*
```
tables          → 'position'        kitchen tickets → 'work_progress'
orders          → 'sale'            ingredients     → 'inventory_item'
staff           → 'employee'        customer accounts → 'obligation'
Capabilities:     pos, occupancy, work_orders(kitchen), composition, production,
                  inventory, employees, attendance, customer_khata, ledger, qr_menu
Pack:             restaurant
Tier reached:     0–1 for every token
```

**Input:** *"I run a fitness studio. I need members, memberships, trainers, attendance, payments."*
```
members         → 'party'         ✅
trainers        → 'employee'      ✅
attendance      → 'presence'      ✅
payments        → 'settlement'    ✅
memberships     → 'validity_period'  ❌ NOT V1 — the Period engine
Resolution:       PARTIAL
Response:         "Members, trainers, check-in and payments work today. Memberships
                   that run for a period and expire are not available yet — they're
                   in the next release. Would you like to be told when?"
```

> **That last response is the product working correctly.** An honest partial answer plus a waiting-list entry beats a confident wrong configuration every time.

## 17.4 — Hard prohibitions

Vena must **never**:

- return a capability key absent from `capabilities`
- invent a terminology key absent from `terminology_keys`
- propose a table, column, index or migration
- enable a capability the plan does not permit — it may only *offer an upgrade*
- disable anything without explicit confirmation naming the dependents
- write to `tenant_plan_overrides` or `tenant_terminology` without an approval step
- claim a Tier C/D/E capability exists
- answer a financial question from anywhere but `FinancialReportingService`

## 17.5 — Vena must be optional

> **The ERP must be fully usable with Vena switched off.** Every path Vena offers must also be reachable manually through Studio → My ERP. Build the manual browser **before** the AI panel, not after — otherwise the manual path becomes an afterthought and the AI becomes load-bearing, which is the one thing it must never be.

---

# 18 — Validation Rules

Every configuration change — from a template, from a user, or from Vena — passes the same gate.

## 18.1 — The gate

```
1. KEY EXISTS          capability key ∈ capabilities · term key ∈ terminology_keys
2. COMPOSABLE          kind = 'capability' AND is_composable = 1
3. PERMITTED           plan_limits allows it (else: offer upgrade, do not enable)
4. DEPENDENCIES MET    every key in requires resolves true after this change
5. NO CONFLICT         no key in conflicts resolves true after this change
6. ENFORCED            an enforcement point exists (web + API). No point → cannot enable.
7. REVERSIBLE          disabling restores the prior state with no data loss
8. AUDITED             applied_by, reason, original_value written
```

Failing 1, 2, 5 or 6 → **reject**. Failing 3 → **offer upgrade**. Failing 4 → **offer the closure**.

## 18.2 — The UNRESOLVED contract

When any input cannot be resolved, the system returns `UNRESOLVED` with the unmatched token. It does **not** guess, and it does **not** silently drop the token.

```json
{
  "status": "PARTIAL",
  "resolved":   ["parties", "customer_khata", "ledger"],
  "unresolved": [
    { "token": "appointment slots",
      "nearest_family": "schedule",
      "reason": "Scheduling engine not available in this release",
      "action": "waiting_list" }
  ]
}
```

**Silently dropping "appointment slots" is the worst possible behaviour** — the tenant is onboarded, believes they bought scheduling, and discovers on day three that they did not.

## 18.3 — CI-enforced invariants

| Invariant | Test |
|---|---|
| Every capability key in code exists in `capabilities` | key↔registry guard |
| Every composable capability has ≥1 enforcement point on web **and** API | capability↔enforcement guard |
| Every `t()` key exists in `terminology_keys` | terminology guard |
| Every `terminology_keys` row is used or marked deprecated | dead-key guard |
| No pack sets a key outside `terminology_keys` | pack guard |
| No pack sets a key owned by a capability it does not enable | pack coherence guard |
| No controller is named after an industry | naming guard (C-8) |
| No file in `Next/` contains logic or a hardcoded hex | UI guards (`04_UI_PROGRAM.md` §06) |
| Empty terminology map → zero rendered string diffs | terminology parity |
| Zero override rows → every capability resolves as today | enforcement parity |

---

# 19 — Things That Must NEVER Be Renamed

## 19.1 — Absolutely frozen

| Frozen | Why |
|---|---|
| `parties`, `parties.name`, `parties.current_balance` | Renaming for a vertical breaks the universal balance query |
| `journal_entries`, `journal_items`, `accounts`, and every column in them | The ledger is the authoritative truth. Nothing about it is presentation. |
| `products.price`, `products.cost_price`, `products.type` | Typed financial columns. Custom fields are a sidecar, never a replacement. |
| `tenant_id` — every occurrence | The isolation boundary. A renamed tenant scope is a cross-tenant leak. |
| **Capability keys** (`batch_tracking`, `customer_khata`, …) | 134 route enforcement points, `tenant_plan_overrides` rows and existing customer configurations reference them by string |
| **Canonical keys** (`party`, `resource`, `ledger`, …) | The AI, the registry and the search index all key off them |
| **Terminology key names** (`party.statement`) | Only the *value* is tenant-editable. The key is a code identifier. |
| Route names (`sales.store`, `inventory.index`) | Ziggy-generated frontend references; `CLAUDE.md` already mandates regeneration discipline |
| API field names | Offline sync, WooCommerce and terminals all depend on them |
| `V3\AccountingService`, `V3\SaleService`, `FinancialReportingService` — public method signatures | Everything financial routes through them |

## 19.2 — Renameable, once, by engineering, with the four-step discipline

Physical names that are *wrong* and should be corrected — each via `01_BACKEND_AND_DATA.md` §02.3's add → dual-write → shadow-compare → flip sequence:

```
LedgerService              → PartyBalanceQuery       (R-1)
app/Services/V3/           → app/Engines/            (R-2)
kitchen_orders             → work_orders + kind      (R-3)
restaurant_tables + parked_sales → occupancies + positions   (R-4)
custom_charges             → ad_hoc_lines            (R-5)
recipes                    → compositions            (R-6)
payment_allocations + transaction_allocations → allocations  (R-8)
dashboard_layouts          → layout_preferences      (R-10)
RestaurantDashboardController → OccupancyController  (C-8)
CookbookController         → CompositionController   (C-2)
```

## 19.3 — Freely renameable, by any tenant, at any time

**Every value in `tenant_terminology`. Nothing else.**

---

# 20 — Implementation & Migration Rules

## 20.1 — Order of operations

```
1. Classify the 256 keys into kind / family / composable        ← this document's output
2. Seed capabilities + terminology_keys with today's English    ← invisible by construction
3. Fix F-1, F-2, F-3 (enforcement)                              ← ENFORCE BEFORE YOU HIDE
4. Physical renames R-1 … R-11, four-step discipline each
5. Convert ~450 render sites to t()                             ← empty map = zero diffs
6. Navigation from the registry                                 ← byte-identical output
7. Ship the 12 packs (data only)
8. Services + Work Order engine
9. The new UI in Next/
```

**Step 3 gates everything visible.** Hiding a capability whose API route is open is a data-exposure vulnerability, not a UX choice.

## 20.2 — The migration invariant

> **Every step must be a no-op for a tenant with no configuration.**
> The registry seeded to today's answers. The terminology map empty. The nav byte-identical.
> If a pull request changes what such a tenant sees, it does not merge.

## 20.3 — Existing tenant migration

Existing tenants get **no pack and no overrides**. They resolve to canonical English and everything their plan allows — which is exactly today. They opt into a pack, or into the new experience, or neither. Reversible in both directions with zero data change.

## 20.4 — What is explicitly forbidden during this migration

- Renaming a column for an industry
- Creating a vertical-named table, model or controller
- Adding an `if ($industry === …)` branch inside any engine
- Letting a pack write to anything except `tenant_terminology` and `tenant_plan_overrides`
- Shipping a capability toggle with no enforcement point
- Claiming a Tier C/D/E business anywhere public

---

# 21 — The DO-NOT-DUPLICATE List

The single most useful page for a future engineer. **Before building anything, check this list.**

| If you are about to build… | Stop. Use this instead. |
|---|---|
| A patients / students / members / guests table | `parties` + role + terminology |
| A second balance or receivables engine | `party_snapshots` + `PartyBalanceQuery` |
| A fee-collection module | `payments` + allocation |
| A membership-dues module | `recurring_invoices` |
| A treatments / courses / services catalogue | `products` + `type` |
| A menu-item table | `products` |
| A medicines table | `products` + `batches` |
| A materials table | `products` |
| A salon-chair / clinic-room / workshop-bay table | `positions` (R-4) |
| A booking-in-progress table | `occupancies` (R-4) |
| A second work-queue or ticket engine | `work_orders` (R-3) |
| A prescription-fill queue | `work_orders` + `kind` |
| A second attendance system | `staff_attendances` |
| A student-attendance module | `staff_attendances` + terminology |
| A warranty-entitlement engine | `service_contracts` |
| A second PDF generator | the Document Engine (DUP-3) |
| A second notification mechanism | the Communication capability (DUP-4) |
| A second activity log | the Audit capability (DUP-6) |
| A second allocation table | `allocations` (DUP-5) |
| A vector database for capability search | `capability_search_index` — 250 rows, cosine in PHP |
| A per-tenant configuration table | `tenant_plan_overrides` — it already exists, audited and cached |
| A second theme or colour system | `theme/contract.js` |
| A second experience switch | `Appearance::EXPERIENCES` |
| A layout-preferences table | `dashboard_layouts` → `layout_preferences` (R-10) |
| An industry-specific dashboard controller | widget registry + `provides_cards` |

---

# 22 — The GENUINELY NEW List

Everything the canonical model cannot express today, grouped into **reusable engines** rather than per-business features.

| Engine | Unlocks | Effort | When |
|---|---|---|---|
| **Service resource type** | 7 Tier S businesses + 4 Tier B | ~6 days | **V1** |
| **Work Order / Job** *(generalise `kitchen_orders`)* | 11 Tier B + 7 Tier S | ~14 days | **V1** |
| **Service contracts** *(on `recurring_invoices`)* | AMC, warranty, cleaning, pest control | ~5 days | **V1** |
| **Custom fields (sidecar)** | optical prescriptions, clinic DOB, site details — and it removes the temptation to add columns per vertical | ~8 days | **V1 if optical is claimed** |
| **Scheduling** — slot, availability, conflict | gym · salon · barber · spa · clinic · dental · physio · lab · vet · academy · driving school · 4 rental types · photography · coworking = **16** | ~52–73 days as a family | **Next after V1 — highest ratio on the roadmap** |
| **Non-stock Resource** — bookable capacity | same 16 | in the family | with Scheduling |
| **Period** — validity windows, expiry, entitlement drawdown | memberships, courses, hire periods, warranties | in the family | with Scheduling |
| **Project / Relationship** | 7 Tier D businesses | ~30–40 days on top | after C |
| **Rate calendar + booking channel** | hotel, guest house, travel | large | last |
| **Commission** | none in V1 | small | on demand |
| **Unified Rule engine** | no new business — a refactor | ~15 days | post-reveal |

> **Read the Scheduling row again.** One engine family moves 16 businesses from impossible to serveable. Nothing else on the roadmap has that ratio, and **hotel is the worst possible early target** — it sits behind three families.

---

# 23 — Master V1 Matrix — all 48

Every V1 business, its pack, its distinguishing capabilities and its status. **`base` = pos · parties · inventory · ledger · documents · reports.**

| # | Business | Tier | Pack | Beyond base | Missing |
|---|---|---|---|---|---|
| 1 | Grocery / karyana | A | retail | weighted items | — |
| 2 | Supermarket | A | retail | locations, stock_take, loyalty | — |
| 3 | General store | A | retail | — | — |
| 4 | Stationery | A | retail | — | — |
| 5 | Toys | A | retail | — | — |
| 6 | Sports goods | A | fashion_variants | variants | — |
| 7 | Pet shop | A | retail | batch_expiry | — |
| 8 | Bookstore | A | retail | ISBN barcode | — |
| 9 | Apparel | A | fashion_variants | variants | — |
| 10 | Footwear | A | fashion_variants | variants | — |
| 11 | Cosmetics | A | fashion_variants | batch_tracking, batch_expiry | — |
| 12 | Electronics | A | electronics_serial | imei_lifecycle, warranty date | — |
| 13 | Mobile accessories | A | electronics_serial | imei_lifecycle | — |
| 14 | Computer shop | A | electronics_serial | imei_lifecycle, composition | — |
| 15 | Tyre shop | A | electronics_serial | serial (DOT) | — |
| 16 | Hardware | A | hardware_materials | multi_unit | — |
| 17 | Auto parts | A | hardware_materials | supplier catalogue | — |
| 18 | Paint | A | hardware_materials | variants (shade), multi_unit | — |
| 19 | Building materials | A | hardware_materials | multi_unit, delivery, van sales | — |
| 20 | Agri inputs | A | hardware_materials | batch_tracking, batch_expiry | — |
| 21 | Furniture | A | hardware_materials | variants, quotations, delivery | — |
| 22 | Optical | A | fashion_variants | variants, serial | ⚠️ **custom fields** for prescriptions |
| 23 | Jewellery | A | jewellery | weighted, making charge, serial | ⚠️ no live metal-rate feed |
| 24 | Restaurant | A | restaurant | composition, occupancy, work_orders(kitchen), qr_menu | — |
| 25 | Café | A | restaurant | same | — |
| 26 | Juice bar | A | restaurant | composition | — |
| 27 | Cloud kitchen | A | restaurant | composition, work_orders(kitchen), channel | — |
| 28 | Bakery | A | production | composition, production, batch_expiry | — |
| 29 | Sweet shop | A | production | composition, weighted, batch_expiry | — |
| 30 | Caterer | A | production | composition, quotations, sales_orders, ad_hoc_lines | — |
| 31 | Pharmacy | A | pharmacy | batch_tracking, batch_expiry, serial, FBR, occupancy | — |
| 32 | Wholesale | A | wholesale | quotation→SO→invoice, ageing, wholesale_pricing | — |
| 33 | Distribution | A | wholesale | + locations, stock_transfer, van stock | — |
| 34 | Van / route sales | A | wholesale | + van stock, offline POS, daily cash audit | — |
| 35 | Mobile repair | B | repair_shop | work_orders, job_parts_issue, serial, positions | 🟡 Job engine |
| 36 | Auto workshop | B | repair_shop | + job_technicians, positions (bay), quotations | 🟡 Job engine |
| 37 | Appliance repair | B | field_service | work_orders, job_site_address, van_stock | 🟡 Job engine |
| 38 | Laundry & dry cleaning | B | repair_shop | work_orders, occupancy, positions (rack) | 🟡 Job engine |
| 39 | Tailoring | B | workshop | work_orders, composition | 🟡 Job + ⚠️ custom fields (measurements) |
| 40 | Printing press | B | workshop | work_orders, quotations, composition | 🟡 Job engine |
| 41 | Furniture making | B | workshop | work_orders, composition, quotations, landing cost | 🟡 Job engine |
| 42 | Small manufacturing | B | production | composition, production, work_orders, stock_take | 🟡 Job engine |
| 43 | Food processing | B | production | composition, production, batch_tracking, work_orders | 🟡 Job engine |
| 44 | Solar installation | B | field_service | work_orders, job_site_address, quotations, van_stock, contracts | 🟡 Job + Services |
| 45 | IT services & AMC | B | services_contracts | services, work_orders, service_contracts, recurring | 🟡 Job + Services |
| 46 | Electrician / Plumber / HVAC / Handyman | S | field_service | services, work_orders, job_technicians, job_site_address, van_stock, quotations, service_contracts | 🟡 Job + Services |
| 47 | Pest control / Cleaning services | S | services_contracts | services, work_orders, service_contracts, batch_tracking (chemicals) | 🟡 Job + Services |
| 48 | Consultant / Freelancer / Training | S | services_contracts | services (hourly), quotations, recurring_invoices — **no inventory at all** | 🟡 Services |

**Three observations to act on.**

1. **Thirty-four of forty-eight need nothing built.** They are composition and vocabulary.
2. **Two engines cover the remaining fourteen** — Services and Work Orders. Not fourteen features; two.
3. **Two honest gaps sit inside Tier A** — optical prescriptions and tailoring measurements both need the custom-field sidecar. Either ship it in V1, or sell those two without the field capture and say so. **Do not pretend.**

---

# 24 — Bidirectional Mapping

Terminology must resolve **both** directions, or search and AI break the moment a tenant renames anything.

## 24.1 — Forward: canonical → display

```
party (canonical) + tenant 42 → "Patient"
```
Used by: nav, titles, buttons, columns, forms, empty states, reports, PDFs, notifications.

## 24.2 — Reverse: human → canonical

```
"patient" | "patients" | "Patient" | "client" | "customer" | "party" | "gahak" → party
```

Sources for the reverse index, in priority order:

1. **This tenant's own `tenant_terminology` values** — whatever they typed, both cases, both numbers
2. **Every `industry_terminology` value across all packs** — so "guest" resolves even for a retail tenant
3. **Curated aliases in `capability_search_index.aliases`** — "godown", "maal", "stock ka record", "khata"
4. **Phonetic fallback** — soundex + metaphone, the pattern already live in `product_search_index`

```sql
capability_search_index
  capability_key VARCHAR(64) PK
  name_norm      VARCHAR(191)
  name_soundex   VARCHAR(32)
  name_metaphone VARCHAR(64)
  aliases        TEXT           -- 'stock, goods, items, godown, maal, inventory'
  tokens         TEXT
  embedding      BLOB NULL      -- 256 floats, optional
  FULLTEXT (tokens)
```

## 24.3 — Why this is more than UI translation

> *"Show me all my patients who haven't paid."*

```
patients      → party
haven't paid  → obligation with a non-zero outstanding balance
              → PartyBalanceQuery WHERE net > 0
Renders as:     "Patients with an outstanding balance"  ← their word, back to them
```

Neither the query nor the ledger knows the word "patient" exists. **That is the architecture working.**

## 24.4 — Rebuild triggers

The reverse index rebuilds when: a tenant edits terminology · a pack is applied · a capability is added to the registry · a new alias is curated. It is small — a few hundred rows per tenant — and rebuilding it is milliseconds.

---

# 25 — Terminology Versioning

## 25.1 — The problem

A tenant runs for eight months calling them "Patients", then rebrands and switches to "Clients". Every historical invoice, statement and reminder now renders "Client". Is that right?

## 25.2 — The rule

| Surface | Behaviour | Why |
|---|---|---|
| **Live UI** — nav, forms, lists, dashboard | **Always current terminology** | The user thinks in today's words |
| **New documents** | Current terminology | Obvious |
| **Reprinted historical documents** | **Terminology as at the document's date** | A reprinted invoice must match the one the customer holds |
| **Reports over a historical period** | Current terminology | A report is a view, not an artefact |
| **The transaction record itself** | **Never stores a label at all** | The point of the architecture |

## 25.3 — The mechanism

`tenant_terminology.effective_from` / `effective_until`. Editing a term closes the current row and opens a new one. Document rendering resolves terms **as at `document.issued_at`**; everything else resolves as at now.

```php
Terms::get('party.singular');                    // live UI — current
Terms::asAt($invoice->issued_at)->get(...);      // reprint — historical
```

## 25.4 — Scope discipline

**Only `document.*` and `legal.*` keys are versioned.** Versioning nav labels would be absurd and would triple the table size for no benefit. V1 may ship without versioning entirely — but the columns exist from day one, because retrofitting effective dates onto a table with history is genuinely painful.

> **This is another reason never to put an industry word into a core table.** If `invoices` had a `patient_name` column, a rebrand would be a data migration. Because it has `party_id`, a rebrand is one row in `tenant_terminology`.

---

# 26 — The Final Architecture

```
                        ┌────────────────────────────────┐
                        │            USER                │
                        │   "I run an AC repair          │
                        │    business with two vans"     │
                        └───────────────┬────────────────┘
                                        │
                                        ▼
                        ┌────────────────────────────────┐
                        │     VENA — INTENT RESOLUTION   │
                        │  tier 0 exact · 1 phonetic ·   │
                        │  2 embedding · 3 LLM (rare)    │
                        │  NEVER writes code or schema   │
                        └───────────────┬────────────────┘
                                        │
                                        ▼
                        ┌────────────────────────────────┐
                        │   CANONICAL BUSINESS VOCABULARY│
                        │                                │
                        │  Party · Resource · Ledger     │
                        │  Event · Schedule · Workflow   │
                        │  Rule · Document ·             │
                        │  Communication · Integration · │
                        │  Access & Audit                │
                        │                                │
                        │  ← THIS DOCUMENT               │
                        └───────────────┬────────────────┘
                                        │
                     ┌──────────────────┼──────────────────┐
                     ▼                  ▼                  ▼
          ┌──────────────────┐ ┌────────────────┐ ┌────────────────┐
          │   CAPABILITY     │ │  TERMINOLOGY   │ │  DEPENDENCY    │
          │   REGISTRY       │ │  ENGINE        │ │  RESOLVER      │
          │  256 keys        │ │  ~180 keys     │ │  requires /    │
          │  12 groups       │ │  12 packs      │ │  conflicts     │
          └────────┬─────────┘ └───────┬────────┘ └───────┬────────┘
                   └───────────────────┼──────────────────┘
                                       ▼
                        ┌────────────────────────────────┐
                        │     TENANT CONFIGURATION       │
                        │                                │
                        │  tenant_plan_overrides ← exists│
                        │  tenant_terminology            │
                        │  layout_preferences            │
                        │  user_preferences   ← exists   │
                        │  roles              ← exists   │
                        └───────────────┬────────────────┘
                                        │
                                        ▼
                        ┌────────────────────────────────┐
                        │      VENQORE ENGINES           │
                        │                                │
                        │  Accounting · FIFO · Payment · │
                        │  Settlement · Tax · Party ·    │
                        │  Inventory · Manufacturing ·   │
                        │  Sale · Purchase · UoM · Audit │
                        │  + FinancialReportingService   │
                        │                                │
                        │  These never see a business    │
                        │  name or a tenant's vocabulary │
                        └───────────────┬────────────────┘
                                        │
                                        ▼
                        ┌────────────────────────────────┐
                        │  DATABASE — FINANCIAL TRUTH    │
                        │  MariaDB 10.5 · tenant-scoped  │
                        │  balanced · immutable ·        │
                        │  reversal-only                 │
                        └────────────────────────────────┘
```

## 26.1 — Read the diagram bottom-up

The bottom two boxes are **already built and working, today, for paying customers.** They do not change in this programme beyond duplicate removal.

The middle two boxes are **70% built** — `tenant_plan_overrides`, `PlanRepository`, `user_preferences`, `Appearance`, 256 catalogued keys — and were labelled internal tooling.

The top two boxes are **the actual new work**, and they are the two smallest boxes on the page.

> **That ratio is the entire argument.** VenQore is not becoming a different product. It is exposing, naming and composing what it already is.

## 26.2 — The one-sentence contract

> **The customer sees their business. The application understands canonical concepts. The engines do the work. The database holds the truth. Nothing in the bottom three layers ever learns a business's vocabulary.**

---

# 27 — Sign-off Checklist

This document may be marked agreed only when every line is true.

**Completeness**

- [x] All 11 semantic families defined with a verified implementation mapping
- [x] All 48 V1 businesses appear in §23 — none omitted
- [x] All 12 terminology packs specified
- [x] Cross-business equivalence tables cover the core five and the supporting nine
- [x] Post-V1 vocabulary reserved so the registry never needs restructuring

**Verification**

- [x] Every model, service, controller and table named in §10–§11 confirmed present
- [x] Capability count taken from `PlanFeatureMatrixSeeder`, not from an audit
- [x] Every "missing" claim confirmed absent, not merely differently named
- [x] Every "exists" claim confirmed by reading the file

**Consistency**

- [x] No canonical key collides with a display term (§16 conflicts C-1…C-10 all resolved)
- [x] No business in §23 claims a capability listed as missing in §22
- [x] The V1 list matches `06_BUSINESS_CATALOGUE_V1.md` exactly
- [x] Terminology keys in §05 cover every surface in §12

**Safety**

- [x] The ten hard rules (§01.4) stated and not contradicted anywhere
- [x] The never-rename list (§19) complete
- [x] The do-not-duplicate list (§21) covers every reuse opportunity found
- [x] AI prohibitions (§17.4) explicit
- [x] Every honest gap declared: **optical prescriptions · tailoring measurements · jewellery metal rates · warranty entitlement · all Tier C/D/E**

---
**Agreed & Signed-off: August 12, 2026**
