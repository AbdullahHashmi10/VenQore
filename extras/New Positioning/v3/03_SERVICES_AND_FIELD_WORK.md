# 03 — Services & Field Work

**The one genuinely new engine family in V1.**
Everything else in this programme is renaming, wiring and presentation. This is a build.

**Target businesses:** electrician · plumber · AC / HVAC technician · appliance repair · mobile repair · auto workshop · solar installer · IT services & AMC · tailoring · printing press · laundry & dry cleaning · furniture making · small manufacturing · food processing

**Scope decision:** full field service, **without** the Scheduling family. Jobs have a *date* and an *assignee*. They do not have calendar slots, availability windows or resource conflict detection. That is the next build and it unlocks 16 more businesses (salon, gym, clinic, lab, academy, rentals, coworking) in one go — see `06_BUSINESS_CATALOGUE_V1.md` §05.

---

## 01 — What already exists

Verified 11 August 2026. This build is smaller than it looks because most of it is a rename.

| Need | Already in the repo |
|---|---|
| A non-stock sellable thing | `products.type` is `ENUM('standard','weighted','composite')` — **add `'service'`** |
| A work instruction issued to a station | `kitchen_orders` — this **is** a work order with a kitchen-shaped name (R-3 in §01) |
| Estimate → commitment → bill | `quotations` → `sales_orders` → `invoices`, with converters already written |
| Recurring obligation on a cycle | `recurring_invoices` + generator command — **this is an AMC contract** |
| Labour and materials on one document | `custom_charges` (→ `ad_hoc_lines`) alongside normal product lines |
| Who did the work | `employees` + `staff_attendances` + `staff_daily_summaries` |
| Stock in a van | `warehouses` + `stock_transfers` — a van is a location |
| A resumable session against a position | `occupancies` + `positions` after R-4 — a workshop bay is a position |
| Parts consumption costed correctly | `V3\FifoService` — unchanged, jobs consume through it |
| Photo → structured document | `SmartCapture` — 8 services, alias book, learning loop |

**Four industry presets already claim this market with no engine behind them:** `MobileRepair`, `Solar`, `IT`, `Consulting` in `config/industries.php`. That is currently a promise the code cannot keep. This document closes it.

---

## 02 — Services as a product type

### 02.1 — The schema change

```sql
ALTER TABLE products
  MODIFY COLUMN type ENUM('standard','weighted','composite','service')
  NOT NULL DEFAULT 'standard';
```

One `ALTER`. No existing row changes. Every existing query that filters `type = 'standard'` keeps working.

Then a small set of service-specific columns, all nullable:

```sql
ALTER TABLE products
  ADD COLUMN service_pricing   ENUM('fixed','hourly','per_unit','quote') NULL AFTER type,
  ADD COLUMN default_duration  SMALLINT UNSIGNED NULL,   -- minutes, for estimates
  ADD COLUMN default_rate      DECIMAL(15,4) NULL,       -- per hour / per unit
  ADD COLUMN requires_visit    TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN skill_tag         VARCHAR(64) NULL;         -- 'electrical','plumbing','hvac'
```

### 02.2 — The behavioural rules a service must obey

This is where a naive "just add a type" goes wrong. Every one of these is a guard that must be written and tested.

| Rule | Why |
|---|---|
| A service **never** creates a stock row | `InventoryService` must skip `type = 'service'` on both sale and purchase |
| A service **never** consumes a FIFO lot | `FifoService` must skip it. Its cost is labour, not a lot. |
| A service **can** appear in a composition | A "Full AC Service" is labour + gas + filter. `ManufacturingService` must accept service items as composition members without attempting to deduct them. |
| Selling a service **still** posts to the ledger | Debit receivable, credit **service income** — a different income account from goods income. Add it to the seeded chart of accounts. |
| A service line **can** carry a cost | Technician cost per hour, so job profitability is real. Posts to a labour cost account. |
| Negative-stock warnings **never** fire for services | The existing negative-stock tracking path must exclude them |
| A service **can** be tax-treated differently | Many jurisdictions tax services at a different rate. `TaxService` is already rule-driven — this is configuration, not code. |
| The offline POS **must** handle services | Dexie's `LocalDB.js` caches products; a service has no stock to decrement, so the sync path must not try |

> **The eighth row is the one that gets forgotten.** The offline layer is retail-shaped. A plumber's phone selling a service offline and then syncing must not attempt a stock decrement, or sync fails silently.

### 02.3 — Where services show up

- **POS:** a "Services" tab alongside categories. Tapping a service adds a line with quantity = hours or units.
- **Invoice / Quotation:** service lines and product lines coexist on one document, subtotalled separately (customers want to see labour vs parts).
- **Reports:** service revenue vs goods revenue as separate lines in P&L. Margin per service.

---

## 03 — The Work Order engine

### 03.1 — Generalising `kitchen_orders`

`kitchen_orders` is already *"a work instruction issued to a station, with a status lifecycle."* Rename it and add a discriminator:

```sql
RENAME TABLE kitchen_orders TO work_orders;

ALTER TABLE work_orders
  ADD COLUMN kind ENUM('kitchen','job','repair','prep','install') NOT NULL DEFAULT 'kitchen' AFTER tenant_id;
```

**Every existing restaurant row becomes `kind = 'kitchen'` and behaves exactly as before.** That is the no-op default.

### 03.2 — The job record

```sql
CREATE TABLE jobs (
    id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    tenant_id       BIGINT UNSIGNED NOT NULL,
    number          VARCHAR(32) NOT NULL,        -- via SequenceService
    party_id        BIGINT UNSIGNED NOT NULL,    -- the client
    contract_id     BIGINT UNSIGNED NULL,        -- if under an AMC
    quotation_id    BIGINT UNSIGNED NULL,        -- what it came from
    invoice_id      BIGINT UNSIGNED NULL,        -- what it became
    occupancy_id    BIGINT UNSIGNED NULL,        -- the bay it is sitting in, if any
    title           VARCHAR(180) NOT NULL,
    description     TEXT NULL,
    site_address    TEXT NULL,                   -- where the work happens
    site_lat        DECIMAL(10,7) NULL,
    site_lng        DECIMAL(10,7) NULL,
    priority        ENUM('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
    status          ENUM('draft','scheduled','in_progress','on_hold',
                         'awaiting_parts','completed','invoiced','cancelled')
                    NOT NULL DEFAULT 'draft',
    scheduled_for   DATE NULL,                   -- a DATE, not a slot. Deliberate.
    started_at      TIMESTAMP NULL,
    completed_at    TIMESTAMP NULL,
    estimated_total DECIMAL(15,4) NULL,
    actual_total    DECIMAL(15,4) NULL,
    created_by      BIGINT UNSIGNED NOT NULL,
    UNIQUE (tenant_id, number),
    INDEX (tenant_id, status, scheduled_for),
    INDEX (tenant_id, party_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE job_lines (
    id           BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    job_id       BIGINT UNSIGNED NOT NULL,
    kind         ENUM('service','part','ad_hoc') NOT NULL,
    product_id   BIGINT UNSIGNED NULL,
    description  VARCHAR(255) NOT NULL,
    quantity     DECIMAL(15,4) NOT NULL DEFAULT 1,
    unit_price   DECIMAL(15,4) NOT NULL DEFAULT 0,
    unit_cost    DECIMAL(15,4) NULL,
    tax_rate     DECIMAL(6,3) NULL,
    warehouse_id BIGINT UNSIGNED NULL,   -- which van the part came off
    consumed_at  TIMESTAMP NULL,         -- NULL = estimated, set = actually used
    INDEX (job_id, kind)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE job_assignments (
    id           BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    job_id       BIGINT UNSIGNED NOT NULL,
    employee_id  BIGINT UNSIGNED NOT NULL,
    role         VARCHAR(48) NULL,       -- 'lead', 'helper'
    assigned_at  TIMESTAMP NOT NULL,
    checked_in_at  TIMESTAMP NULL,
    checked_out_at TIMESTAMP NULL,
    hours        DECIMAL(8,2) NULL,      -- billable hours, feeds job_lines
    UNIQUE (job_id, employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE job_events (
    id          BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    job_id      BIGINT UNSIGNED NOT NULL,
    type        VARCHAR(40) NOT NULL,   -- status_change, note, photo, signature, part_added
    body        TEXT NULL,
    media_path  VARCHAR(255) NULL,
    user_id     BIGINT UNSIGNED NULL,
    created_at  TIMESTAMP NOT NULL,
    INDEX (job_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 03.3 — The lifecycle, and where money moves

```
  Enquiry
     │
     ▼
  QUOTATION ──────── (existing engine, unchanged)
     │  accepted
     ▼
  JOB (draft → scheduled → in_progress)
     │
     ├── parts issued from a van/warehouse
     │      └──▶ V3\InventoryService + V3\FifoService  ← the ONLY stock movement
     │
     ├── technician hours logged via job_assignments
     │      └──▶ labour cost, no stock effect
     │
     └── ad-hoc lines (call-out fee, disposal, permit)
     │
     ▼
  COMPLETED  ── customer signature captured as a job_event
     │
     ▼
  INVOICE ───────── (existing V3\SaleService, unchanged)
     │
     └──▶ ledger: Dr Receivable │ Cr Service Income + Cr Goods Income + Cr Tax
                                 Dr COGS (parts, at FIFO cost) │ Cr Inventory
                                 Dr Labour Cost │ Cr Accrued Wages
```

> **The rule that keeps this safe:** a job never writes to the ledger or to stock itself. It **calls** `V3\SaleService`, `V3\InventoryService` and `V3\FifoService`, exactly as the POS does. `JobService` is orchestration only. If a job ever needs its own journal logic, something has been modelled wrong.

### 03.4 — Parts consumption: estimated vs actual

`job_lines.consumed_at` is the whole mechanism, and it matters more than it looks.

- Line added during quoting → `consumed_at = NULL`. **No stock movement.** It is a forecast.
- Technician confirms the part was fitted → `consumed_at` set. **Stock moves now**, off `warehouse_id` (the van), at FIFO cost.

Without this distinction you either move stock for parts that were never fitted, or you invoice parts that never left the warehouse. Both are common failure modes in field-service software and both destroy trust in the stock figure.

---

## 04 — Technicians and van stock

**Technicians are `employees`.** Do not create a `technicians` table. Add:

```sql
CREATE TABLE employee_skills (
    employee_id BIGINT UNSIGNED NOT NULL,
    skill_tag   VARCHAR(64) NOT NULL,   -- matches products.skill_tag
    level       ENUM('trainee','competent','expert') DEFAULT 'competent',
    PRIMARY KEY (employee_id, skill_tag)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE employees
  ADD COLUMN default_warehouse_id BIGINT UNSIGNED NULL,  -- their van
  ADD COLUMN hourly_cost DECIMAL(15,4) NULL,
  ADD COLUMN hourly_rate DECIMAL(15,4) NULL;             -- what the client is charged
```

**A van is a `warehouse`.** No new concept. Loading a van is a `stock_transfer` from the main store to the van's warehouse record. Van stock reports, van stock takes, van-to-van transfers — all of it already works.

**Check-in / check-out reuses `staff_attendances`.** A technician checking into a job is presence with a location, which is the shape that table already has.

---

## 05 — Contracts (AMC / maintenance)

`recurring_invoices` already generates a document on a cycle. A maintenance contract is that, plus an entitlement.

```sql
CREATE TABLE service_contracts (
    id                 BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    tenant_id          BIGINT UNSIGNED NOT NULL,
    party_id           BIGINT UNSIGNED NOT NULL,
    number             VARCHAR(32) NOT NULL,
    recurring_invoice_id BIGINT UNSIGNED NULL,   -- the billing side, existing engine
    starts_on          DATE NOT NULL,
    ends_on            DATE NULL,
    visits_included    SMALLINT NULL,            -- e.g. 4 services a year
    visits_used        SMALLINT NOT NULL DEFAULT 0,
    labour_covered     TINYINT(1) NOT NULL DEFAULT 1,
    parts_covered      TINYINT(1) NOT NULL DEFAULT 0,
    parts_discount_pct DECIMAL(5,2) NULL,
    response_hours     SMALLINT NULL,            -- the SLA promise
    status             ENUM('active','expired','cancelled') DEFAULT 'active',
    UNIQUE (tenant_id, number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Behaviour when a job is raised against a contract:**

- `visits_included` not exhausted and `labour_covered` → labour lines price at zero, still cost-posted so profitability stays honest
- `parts_covered = 0` with a discount → parts price at list less `parts_discount_pct`
- `visits_used` increments on completion, not on creation
- Contract expiring within 30 days → a renewal signal, which is exactly the shape the existing **Growth Engine** consumes. Wire it in; do not build a second reminder system.

This is where the recurring revenue story for trades lives, and it is close to free because the billing engine already exists.

---

## 06 — What we deliberately are NOT building in V1

| Not building | Why | When |
|---|---|---|
| Calendar / time-slot scheduling | It is the Scheduling family, 52–73 days, and it unlocks 16 *other* businesses. Doing a half-version for trades means building it twice. | Next build after V1 |
| Technician availability & conflict detection | Same family | Next build |
| Route optimisation / live GPS tracking | Needs a maps vendor, ongoing cost, and it is not why anyone buys | Post-V1, if asked for |
| A separate technician mobile app | The POS is already offline-capable and installable. A job view inside it is enough. | Post-V1 |
| Customer self-service booking portal | Needs scheduling first | With Scheduling |

**Say this plainly in sales material.** "Jobs have a date and an assigned technician" is honest and sufficient for a two-van electrician. "Scheduling" implies a calendar with availability, and claiming it before it exists is the fastest way to a refund.

---

## 07 — Capability keys added to the registry

```
services                 (parent — enables the service product type)
  ├── service_pricing_hourly
  ├── service_composition        (labour + parts packages)
  └── service_tax_class

work_orders              (parent — the job engine)
  ├── job_quotations             requires: quotations
  ├── job_parts_issue            requires: inventory, work_orders
  ├── job_technicians            requires: employees, work_orders
  ├── job_photos_signature       requires: work_orders
  ├── job_site_address           requires: work_orders
  └── van_stock                  requires: locations, stock_transfer

service_contracts        requires: recurring_invoices, parties
  ├── contract_visit_entitlement
  ├── contract_parts_discount
  └── contract_sla_response
```

Every one is `is_composable = 1`. A retail tenant sees none of them. A restaurant tenant gets `work_orders` with `kind = 'kitchen'` and none of the job children.

---

## 08 — Terminology defaults per business

| Term key | Electrician | Plumber | AC/HVAC | Auto workshop | Mobile repair | IT / AMC |
|---|---|---|---|---|---|---|
| `job` | Job | Job | Service call | Repair order | Repair | Ticket |
| `technician` | Electrician | Plumber | Technician | Mechanic | Technician | Engineer |
| `service` | Service | Service | Service | Labour | Repair | Service |
| `product` | Material | Material | Part | Spare | Part | Item |
| `position` | — | — | — | Bay | Bench | — |
| `contract` | Contract | Contract | AMC | Service plan | — | AMC |
| `customer` | Client | Client | Client | Customer | Customer | Client |
| `location` | Van | Van | Van | Store | Store | Store |

---

## 09 — Acceptance criteria

**Services**

- [ ] `products.type` accepts `'service'`; every existing row and query unaffected
- [ ] A service sale creates **zero** stock rows and **zero** FIFO lot consumption — proven by test
- [ ] A service sale posts to a **service income** account, distinct from goods income
- [ ] A composition may contain service members without attempting deduction
- [ ] Offline POS sells a service and syncs cleanly with no stock decrement attempted
- [ ] P&L separates service revenue from goods revenue

**Jobs**

- [ ] `kitchen_orders` → `work_orders` with `kind` — **every existing restaurant flow byte-identical**
- [ ] Quotation → job → invoice round-trips with correct ledger postings
- [ ] `consumed_at NULL` moves no stock; setting it moves stock at FIFO cost off the correct warehouse
- [ ] Job profitability = revenue − FIFO parts cost − technician hours × `hourly_cost`
- [ ] Photos and a customer signature attach as `job_events`
- [ ] Job never writes a journal entry directly — architecture test asserts it

**Contracts**

- [ ] Covered labour prices at zero but still cost-posts
- [ ] `visits_used` increments on completion only
- [ ] Expiring contracts surface through the existing Growth Engine, not a new reminder system

**Composition**

- [ ] A retail tenant with services off sees no service field anywhere, and the API returns 403 for every service and job route
- [ ] A restaurant tenant gets `work_orders` without any job child capability
- [ ] Terminology map switches "Job/Technician/Van" per §08 with zero code change

**Estimate:** 25–32 working days solo with AI assistance. Service product type is ~6 days; the Job engine ~14; contracts ~5; offline and reporting the rest.
