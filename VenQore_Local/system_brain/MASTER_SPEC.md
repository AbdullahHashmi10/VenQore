# VenQore ERP — MASTER SPECIFICATION v3.0

> **Single Source of Truth** — Every financial rule, every database table, every service method, every transaction journal, and every constraint.
> Generated: 2026-03-05 | Based on: Financial Bible v3.0, Scenario Rulebook v3.0, Execution Plan v1.1

---

## SECTION 1 — CHART OF ACCOUNTS

Every journal entry must reference an account from this list. Accounts are permanent — never deleted, only deactivated.

| Code | Account Name | Type | Normal Balance | What It Tracks |
|------|-------------|------|----------------|----------------|
| 1000 | Cash in Hand | Asset | Debit | Physical cash at the counter/till |
| 1010 | Bank Account — Main | Asset | Debit | Primary bank account balance |
| 1011 | Bank Account — Other | Asset | Debit | Additional bank accounts |
| 1100 | Inventory Asset | Asset | Debit | Value of all unsold stock at FIFO cost |
| 1150 | Work-In-Progress | Asset | Debit | Cost of partially completed production runs |
| 1200 | Accounts Receivable | Asset | Debit | Total money customers owe you |
| 1300 | Advance to Supplier | Asset | Debit | Prepayments made before goods received (B21) |
| 1350 | Employee Advance | Asset | Debit | Short-term salary advances to employees |
| 1400 | Prepaid Expenses | Asset | Debit | Expenses paid in advance not yet consumed |
| 1500 | Fixed Assets | Asset | Debit | Equipment, vehicles, furniture at cost |
| 1510 | Accumulated Depreciation | Contra-Asset | Credit | Total depreciation taken on fixed assets |
| 2000 | Accounts Payable | Liability | Credit | Total money you owe suppliers |
| 2100 | Customer Advance | Liability | Credit | Customer payments received before delivery (B20) |
| 2200 | Sales Tax Payable | Liability | Credit | Tax collected — government's money |
| 2300 | Input Tax Recoverable | Asset | Debit | Tax paid on purchases — offsetable against 2200 |
| 2400 | Salary Payable | Liability | Credit | Salaries accrued but not yet paid |
| 2500 | Loan Payable | Liability | Credit | Outstanding loan principal |
| 3000 | Owner's Capital | Equity | Credit | Owner's investment in the business |
| 3100 | Retained Earnings | Equity | Credit | Accumulated profit not withdrawn |
| 4000 | Sales Revenue | Income | Credit | Net product revenue (ex-tax, ex-discount) |
| 4100 | Other Income | Income | Credit | Non-product income (interest, misc, insurance recovery) |
| 4200 | Stock Adjustment Gain | Income | Credit | Value gained from positive stock adjustments |
| 5000 | Cost of Goods Sold | Expense | Debit | FIFO cost of products actually sold |
| 5100 | Purchase Expense | Expense | Debit | Non-inventory purchases expensed directly |
| 6000 | Operating Expenses | Expense | Debit | Rent, electricity, transport, marketing |
| 6100 | Salary Expense | Expense | Debit | Employee salary costs (gross) |
| 6200 | Charity Expense | Expense | Debit | Donations and charitable gifts |
| 6300 | Stock Adjustment Loss | Expense | Debit | Write-offs, damage, theft |
| 6400 | Manufacturing Cost | Expense | Debit | Raw material cost allocated to production |
| 6410 | Applied Manufacturing Labor | Expense | Debit | Labor cost allocated to production runs |
| 6500 | Loan Interest Expense | Expense | Debit | Interest paid on business loans |
| 6600 | Depreciation Expense | Expense | Debit | Periodic depreciation of fixed assets |
| 6700 | Bad Debt Expense | Expense | Debit | Uncollectable receivables written off |
| 6800 | Gratuity & Severance Expense | Expense | Debit | Gratuity, notice pay, leave encashment |
| 6900 | Cash Shortage Loss | Expense | Debit | Physical till shortages |
| 6950 | Disaster Loss | Expense | Debit | Inventory/asset value destroyed by catastrophe |
| 6960 | Insurance Recovery | Income | Credit | Cash received from insurer offsetting a loss |
| 7000 | Opening Balance Equity | Equity | Credit | Clearing account for migration (B19) |

**Account Type Ranges:**
- 1000–1510: Assets (Debit-normal) / Contra-Asset (Credit-normal for 1510)
- 2000–2500: Liabilities (Credit-normal)
- 3000–3100: Equity (Credit-normal)
- 4000–4200: Income (Credit-normal)
- 5000–6960: Expenses/COGS (Debit-normal) — except 6960 Insurance Recovery (Credit-normal)
- 7000: Opening Balance Equity (Credit-normal)

---

## SECTION 2 — COMPLETE DATABASE SCHEMA

### 2.1 Foundation & Accounting Tables

> **Note — `users` table:** V3 does not define a `users` table. It is managed by Laravel's built-in `create_users_table` migration. V3 code depends on the following columns from that table: `id` (UUID char(36)), `name`, `email`, `password`, `role`. All `created_by` and `approved_by` columns in V3 tables reference `users.id`.

#### `accounts`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | Auto-increment |
| code | VARCHAR(10) UNIQUE NOT NULL | 1000–7000 per COA |
| name | VARCHAR(100) NOT NULL | e.g. "Cash in Hand" |
| type | ENUM(asset,contra_asset,liability,equity,income,expense) | |
| normal_balance | ENUM(debit,credit) | |
| is_active | TINYINT(1) DEFAULT 1 | Deactivated = no new entries |
| is_system | TINYINT(1) DEFAULT 0 | 1 = cannot be deleted/renamed |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### `journal_entries`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | Auto-increment |
| entry_date | DATE NOT NULL | Accounting date |
| reference_type | VARCHAR(50) NOT NULL | e.g. "sale","purchase","B-REV","B26","B27" |
| reference_id | BIGINT UNSIGNED NOT NULL | FK to source record |
| description | VARCHAR(500) | Human-readable |
| party_id | BIGINT UNSIGNED NULL | FK → parties.id |
| is_reversed | TINYINT(1) DEFAULT 0 | 1 = has a reversal posted |
| reversed_by | BIGINT UNSIGNED NULL | FK → journal_entries.id |
| narration | TEXT NULL | Mandatory for B28 |
| approved_by | BIGINT UNSIGNED NULL | FK → users.id |
| idempotency_key | VARCHAR(36) UNIQUE NULL | Prevents duplicate submissions |
| created_by | BIGINT UNSIGNED NOT NULL | FK → users.id |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

**Indexes:** `(entry_date)`, `(reference_type, reference_id)`, `(party_id)`, `(is_reversed)`

#### `journal_items`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | |
| journal_entry_id | BIGINT UNSIGNED NOT NULL | FK → journal_entries.id |
| account_id | BIGINT UNSIGNED NOT NULL | FK → accounts.id |
| party_id | BIGINT UNSIGNED NULL | FK → parties.id |
| debit | DECIMAL(15,2) DEFAULT 0.00 | |
| credit | DECIMAL(15,2) DEFAULT 0.00 | |
| created_at | TIMESTAMP | |

**CHECK constraint:** `CHECK ((debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0))`
**Indexes:** `(journal_entry_id)`, `(account_id)`, `(party_id)`

#### `payment_allocations`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | |
| payment_journal_entry_id | BIGINT UNSIGNED NOT NULL | FK → journal_entries.id |
| sale_id | BIGINT UNSIGNED NULL | FK → sales.id |
| purchase_id | BIGINT UNSIGNED NULL | FK → purchases.id |
| allocated_amount | DECIMAL(15,2) NOT NULL | |
| status | ENUM('active','reversed','written_off') DEFAULT 'active' | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

**Trigger:** `SUM(allocated_amount WHERE sale_id=X AND status='active') <= sales.total_amount`
**Indexes:** `(payment_journal_entry_id)`, `(sale_id)`, `(purchase_id)`

#### `party_snapshots`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | |
| party_id | BIGINT UNSIGNED NOT NULL | FK → parties.id |
| account_id | BIGINT UNSIGNED NOT NULL | FK → accounts.id (1200 or 2000) |
| cached_balance | DECIMAL(15,2) NOT NULL DEFAULT 0.00 | |
| last_journal_id | BIGINT UNSIGNED NULL | Last journal entry that triggered rebuild |
| last_updated_at | TIMESTAMP | |

**UNIQUE:** `(party_id, account_id)`

### 2.2 Party & User Tables

#### `parties`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | |
| name | VARCHAR(200) NOT NULL | |
| type | ENUM('customer','supplier','both') NOT NULL DEFAULT 'customer' | **Required** — filters customer vs supplier lists in UI; drives aged receivables vs payables queries |
| phone | VARCHAR(50) NULL | |
| email | VARCHAR(100) NULL | |
| address | TEXT NULL | |
| tax_number | VARCHAR(50) NULL | NTN/STRN |
| default_discount | DECIMAL(5,2) DEFAULT 0 | |
| is_active | TINYINT(1) DEFAULT 1 | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |
| deleted_at | TIMESTAMP NULL | Soft delete |

#### `employees`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | |
| name | VARCHAR(200) NOT NULL | |
| monthly_salary | DECIMAL(15,2) NOT NULL | |
| hire_date | DATE NOT NULL | |
| termination_date | DATE NULL | Set when B27 posted |
| status | ENUM('active','terminated') DEFAULT 'active' | |
| commission_rate | DECIMAL(5,2) DEFAULT 0 | |
| party_id | BIGINT UNSIGNED NULL | FK → parties.id |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### 2.3 Inventory Tables

#### `categories`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | |
| name | VARCHAR(100) NOT NULL | |
| parent_id | BIGINT UNSIGNED NULL | FK → categories.id (for sub-categories) |
| is_active | TINYINT(1) DEFAULT 1 | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### `products`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | |
| name | VARCHAR(200) NOT NULL | |
| sku | VARCHAR(100) UNIQUE NOT NULL | |
| base_uom | VARCHAR(20) NOT NULL DEFAULT 'PCS' | Inventory unit |
| category_id | BIGINT UNSIGNED NULL | FK → categories.id |
| cost_price | DECIMAL(15,2) DEFAULT 0 | Display only — NEVER for COGS |
| sale_price | DECIMAL(15,2) DEFAULT 0 | Default sale price |
| tax_rate | DECIMAL(5,2) DEFAULT 0.00 | Default tax % |
| price_includes_tax | TINYINT(1) DEFAULT 0 | |
| reorder_level | DECIMAL(10,4) DEFAULT 0 | |
| is_manufactured | TINYINT(1) DEFAULT 0 | Has BOM |
| is_expiry_tracked | TINYINT(1) DEFAULT 0 | |
| is_active | TINYINT(1) DEFAULT 1 | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |
| deleted_at | TIMESTAMP NULL | Soft delete |

#### `warehouses`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | |
| name | VARCHAR(100) NOT NULL | |
| address | TEXT NULL | |
| is_default | TINYINT(1) DEFAULT 0 | |
| is_active | TINYINT(1) DEFAULT 1 | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### `inventory_batches`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | |
| product_id | BIGINT UNSIGNED NOT NULL | FK → products.id |
| warehouse_id | BIGINT UNSIGNED NOT NULL | FK → warehouses.id |
| purchase_id | BIGINT UNSIGNED NULL | FK → purchases.id |
| production_run_id | BIGINT UNSIGNED NULL | FK → production_runs.id |
| batch_type | ENUM('purchase','opening','manufactured','adjustment','disassembly') | |
| unit_cost | DECIMAL(15,4) NOT NULL | LOCKED at creation — never overwritten |
| initial_qty | DECIMAL(10,4) NOT NULL | |
| remaining_qty | DECIMAL(10,4) NOT NULL | |
| expiry_date | DATE NULL | Only if product.is_expiry_tracked |
| notes | TEXT NULL | |
| created_at | TIMESTAMP NOT NULL | FIFO ordering key |
| updated_at | TIMESTAMP | |
| deleted_at | TIMESTAMP NULL | Soft delete |

**CHECK:** `CHECK (remaining_qty >= 0)` — no negative stock
**CHECK:** `CHECK (unit_cost >= 0)` — no negative cost
**CHECK:** `CHECK (unit_cost > 0 OR batch_type != 'opening')` — S-055
**Indexes:** `(product_id, warehouse_id, remaining_qty, created_at)`, `(purchase_id)`

#### `sale_item_batches`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | |
| sale_item_id | BIGINT UNSIGNED NOT NULL | FK → sale_items.id |
| inventory_batch_id | BIGINT UNSIGNED NOT NULL | FK → inventory_batches.id |
| qty_deducted | DECIMAL(10,4) NOT NULL | |
| unit_cost | DECIMAL(15,4) NOT NULL | Copied from batch — immutable |
| total_cost | DECIMAL(15,4) NOT NULL | qty_deducted × unit_cost — **DECIMAL(15,4) to prevent rounding loss on fractional costs** |
| is_reversed | TINYINT(1) DEFAULT 0 | |
| created_at | TIMESTAMP | |

**Indexes:** `(sale_item_id)`, `(inventory_batch_id)`

> **DECIMAL precision rule (Issue #7):** `unit_cost` = DECIMAL(15,4). `total_cost` = DECIMAL(15,4). `sale_items.cogs_amount` = DECIMAL(15,4) — all three must use 4 decimal places. The multiplication `qty_deducted × unit_cost` is done at DECIMAL(15,4) precision before rounding. This prevents the scenario where Rs.0.0033 × 100 = Rs.0.33 is stored correctly but 0.0033 × 100 at DECIMAL(15,2) rounds to Rs.0.00.

#### `product_uom_conversions`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | |
| product_id | BIGINT UNSIGNED NOT NULL | FK → products.id |
| sale_uom | VARCHAR(20) NOT NULL | e.g. "GRAMS", "ML" |
| conversion_factor | DECIMAL(15,6) NOT NULL | base_qty = sale_qty / factor |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

**UNIQUE:** `(product_id, sale_uom)`

#### `product_price_tiers`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | |
| product_id | BIGINT UNSIGNED NOT NULL | FK → products.id |
| min_qty | DECIMAL(10,4) NOT NULL | |
| max_qty | DECIMAL(10,4) NULL | NULL = no upper limit |
| unit_price | DECIMAL(15,2) NOT NULL | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### 2.4 Sales Tables

#### `sales`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | |
| invoice_number | VARCHAR(50) UNIQUE NOT NULL | Auto-generated |
| party_id | BIGINT UNSIGNED NOT NULL | FK → parties.id |
| sale_date | DATE NOT NULL | |
| subtotal | DECIMAL(15,2) NOT NULL | Before tax/discount |
| discount_amount | DECIMAL(15,2) DEFAULT 0 | |
| tax_amount | DECIMAL(15,2) DEFAULT 0 | |
| total_amount | DECIMAL(15,2) NOT NULL | subtotal - discount + tax |
| payment_status | ENUM('unpaid','partial','paid','written_off') DEFAULT 'unpaid' | DISPLAY BADGE ONLY |
| payment_method | VARCHAR(20) NULL | cash, bank, split |
| source_order_id | BIGINT UNSIGNED NULL | FK → sales_orders.id |
| journal_entry_id | BIGINT UNSIGNED NOT NULL | FK → journal_entries.id |
| warehouse_id | BIGINT UNSIGNED NOT NULL | FK → warehouses.id |
| status | ENUM('posted','reversed') DEFAULT 'posted' | |
| created_by | BIGINT UNSIGNED NOT NULL | FK → users.id |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### `sale_items`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | |
| sale_id | BIGINT UNSIGNED NOT NULL | FK → sales.id |
| product_id | BIGINT UNSIGNED NOT NULL | FK → products.id |
| qty | DECIMAL(10,4) NOT NULL | In sale UOM |
| sale_uom | VARCHAR(20) NOT NULL | May differ from base_uom |
| unit_price | DECIMAL(15,2) NOT NULL | Per sale UOM unit |
| discount_percent | DECIMAL(5,2) DEFAULT 0 | |
| tax_rate | DECIMAL(5,2) DEFAULT 0 | Locked at sale time |
| line_total | DECIMAL(15,2) NOT NULL | |
| cogs_amount | DECIMAL(15,4) NOT NULL DEFAULT 0 | **Written by SaleService::post() after FifoService::deductStock() returns** — equals SUM(sale_item_batches.total_cost) for this sale_item. DECIMAL(15,4) to match sale_item_batches.total_cost. |
| is_promotional | TINYINT(1) DEFAULT 0 | Free item per S-040 |
| created_at | TIMESTAMP | |

### 2.5 Purchase Tables

#### `purchases`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | |
| invoice_number | VARCHAR(50) NOT NULL | Supplier's invoice # |
| party_id | BIGINT UNSIGNED NOT NULL | FK → parties.id (supplier) |
| purchase_date | DATE NOT NULL | |
| subtotal | DECIMAL(15,2) NOT NULL | |
| tax_amount | DECIMAL(15,2) DEFAULT 0 | Input tax |
| total_amount | DECIMAL(15,2) NOT NULL | |
| payment_status | ENUM('unpaid','partial','paid') DEFAULT 'unpaid' | Badge only |
| payment_method | VARCHAR(20) NULL | |
| journal_entry_id | BIGINT UNSIGNED NOT NULL | FK → journal_entries.id |
| warehouse_id | BIGINT UNSIGNED NOT NULL | FK → warehouses.id |
| status | ENUM('posted','reversed') DEFAULT 'posted' | |
| created_by | BIGINT UNSIGNED NOT NULL | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### `purchase_items`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | |
| purchase_id | BIGINT UNSIGNED NOT NULL | FK → purchases.id |
| product_id | BIGINT UNSIGNED NOT NULL | FK → products.id |
| qty | DECIMAL(10,4) NOT NULL | |
| unit_cost | DECIMAL(15,4) NOT NULL | |
| tax_rate | DECIMAL(5,2) DEFAULT 0 | |
| line_total | DECIMAL(15,2) NOT NULL | |
| inventory_batch_id | BIGINT UNSIGNED NULL | FK → inventory_batches.id |
| created_at | TIMESTAMP | |

### 2.6 Manufacturing Tables

#### `bill_of_materials`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | |
| product_id | BIGINT UNSIGNED NOT NULL | FK → products.id (finished good) |
| version | INT DEFAULT 1 | BOM versioning |
| effective_from | DATE NOT NULL | |
| is_active | TINYINT(1) DEFAULT 1 | |
| notes | TEXT NULL | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### `bom_items`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | |
| bom_id | BIGINT UNSIGNED NOT NULL | FK → bill_of_materials.id |
| product_id | BIGINT UNSIGNED NOT NULL | FK → products.id (raw material) |
| qty_per_unit | DECIMAL(10,4) NOT NULL | Qty needed per 1 finished unit |
| is_byproduct | TINYINT(1) DEFAULT 0 | |
| byproduct_nrv | DECIMAL(15,2) DEFAULT 0 | NRV per unit for by-products |
| created_at | TIMESTAMP | |

#### `disassembly_boms`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | |
| product_id | BIGINT UNSIGNED NOT NULL | FK → products.id (the set) |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### `disassembly_bom_items`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | |
| disassembly_bom_id | BIGINT UNSIGNED NOT NULL | FK |
| component_product_id | BIGINT UNSIGNED NOT NULL | FK → products.id |
| allocation_percent | DECIMAL(5,2) NOT NULL | Must sum to 100% per BOM |
| created_at | TIMESTAMP | |

#### `production_runs`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | |
| bom_id | BIGINT UNSIGNED NOT NULL | FK → bill_of_materials.id |
| warehouse_id | BIGINT UNSIGNED NOT NULL | FK → warehouses.id |
| planned_qty | DECIMAL(10,4) NOT NULL | |
| actual_qty | DECIMAL(10,4) NULL | Set on completion |
| status | ENUM('in_progress','completed','partially_reversed','reversed') | |
| wip_balance | DECIMAL(15,2) DEFAULT 0 | |
| labor_cost | DECIMAL(15,2) DEFAULT 0 | |
| labor_type | ENUM('external','internal') NULL | |
| material_cost | DECIMAL(15,2) DEFAULT 0 | |
| total_cost | DECIMAL(15,2) DEFAULT 0 | |
| journal_entry_id | BIGINT UNSIGNED NULL | FK → journal_entries.id |
| completed_at | TIMESTAMP NULL | |
| created_by | BIGINT UNSIGNED NOT NULL | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### 2.7 HR & Operational Tables

#### `discount_limits`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | |
| role | VARCHAR(50) NOT NULL | Role name |
| max_discount_percent | DECIMAL(5,2) NOT NULL | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### `disaster_claims`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | |
| description | TEXT NOT NULL | |
| loss_journal_entry_id | BIGINT UNSIGNED NULL | FK → journal_entries.id (Step 1) |
| recovery_journal_entry_id | BIGINT UNSIGNED NULL | FK → journal_entries.id (Step 2) |
| loss_amount | DECIMAL(15,2) NOT NULL | |
| recovery_amount | DECIMAL(15,2) DEFAULT 0 | |
| status | ENUM('loss_recorded','recovery_pending','closed') | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### `system_settings`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | |
| key | VARCHAR(100) UNIQUE NOT NULL | |
| value | TEXT NULL | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

**Default settings:** `roundoff_tolerance` = 1.00, `period_lock_date` = NULL, `max_future_days` = 30

### 2.8 Pre-Transaction Document Tables

#### `sales_orders`, `purchase_orders`, `quotations`
These create no journal entries and move no stock. They convert into B1/B3 transactions when fulfilled.

---

## SECTION 3 — ALL 32 TRANSACTION JOURNALS (B1–B32)

### B1 — Cash Sale
**Trigger:** Customer receives products, pays cash immediately. AR is never touched.
**Service:** `SaleService::post()` → `FifoService::deductStock()` → `AccountingService::createEntry()`
**Journal (single atomic entry):**
- DR 1000 Cash in Hand = total_amount
- CR 4000 Sales Revenue = net_sales (ex-tax, ex-discount)
- CR 2200 Sales Tax Payable = total_tax
- DR 5000 COGS = FIFO cost (SUM of sale_item_batches.total_cost)
- CR 1100 Inventory Asset = FIFO cost

**After `createEntry()` returns:** `SaleService` writes `sale_items.cogs_amount` = FifoService deduction total for each line.

> ⚠️ Account 1200 (AR) is NEVER used in a cash sale. Cash sale → DR 1000 directly. Using AR on a cash sale creates ghost receivable movements that inflate AR and distort aged receivables reports.

**Scenarios:** S-001, S-003, S-005, S-006, S-011, S-039, S-046, S-049

### B2 — Credit Sale
**Trigger:** Customer receives products but does not pay fully at time of sale (credit terms).
**Service:** `SaleService::post()` → `FifoService::deductStock()` → `AccountingService::createEntry()`
**Journal (single atomic entry):**
- DR 1200 Accounts Receivable = total_amount (full invoice)
- CR 4000 Sales Revenue = net_sales
- CR 2200 Sales Tax Payable = total_tax
- DR 5000 COGS = FIFO cost
- CR 1100 Inventory Asset = FIFO cost

**Split payment (partial cash + partial credit):**
- DR 1000 Cash = amount_paid_now
- DR 1200 AR = remaining_balance
- CR 4000 Sales Revenue = net_sales
- CR 2200 Sales Tax Payable = total_tax
- DR 5000 COGS / CR 1100 Inventory

**After `createEntry()` returns:** `SaleService` writes `sale_items.cogs_amount` for each line.
**Scenarios:** S-001, S-018, S-033

### B3 — Cash Purchase
**Journal:**
- DR 1100 Inventory Asset = total_cost
- DR 2300 Input Tax Recoverable = tax_paid
- CR 1000 Cash in Hand = total_paid
**Creates:** `inventory_batches` record via `InventoryService::receivePurchase()`
**Scenarios:** S-003, S-010

### B4 — Payment In (Customer Pays)
**Journal:**
- DR 1000/1010 Cash or Bank = amount
- CR 1200 Accounts Receivable = amount
**Requires:** `PaymentService::allocate()` to create `payment_allocations` rows
**Triggers:** `PartyService::rebuildSnapshot()`
**Scenarios:** S-017, S-018, S-022, S-028, S-029

### B5 — Payment Out (Paying Supplier)
**Journal:**
- DR 2000 Accounts Payable = amount
- CR 1000/1010 Cash or Bank = amount
**Requires:** `PaymentService::allocate()` for purchase invoice allocation
**Scenarios:** S-025

### B6 — Credit Purchase
**Same as B3** but CR 2000 Accounts Payable instead of CR 1000 Cash.

### B7 — Salary Accrual
**Journal:**
- DR 6100 Salary Expense = gross_salary
- CR 2400 Salary Payable = gross_salary

### B8 — Salary Payment
**Journal:**
- DR 2400 Salary Payable = net_amount
- CR 1000/1010 Cash or Bank = net_amount
**With advance deduction:** CR 1350 Employee Advance = advance_amount
**Scenarios:** S-078, S-082

### B9 — Sale Return (Credit Note)
**Journal:**
- DR 4000 Sales Revenue = returned_net
- DR 2200 Sales Tax Payable = returned_tax
- CR 1200 Accounts Receivable = total_returned
- DR 1100 Inventory Asset = FIFO cost (restored)
- CR 5000 COGS = FIFO cost
**Uses:** `FifoService::restoreStock()` — restores to EXACT original batch
**Scenarios:** S-002, S-009, S-024, S-030, S-031, S-032, S-033, S-034, S-035, S-037, S-038

### B10 — Stock Adjustment (Loss)
**Journal:** DR 6300 Stock Adjustment Loss / CR 1100 Inventory (FIFO oldest-first)
**Scenarios:** S-007, S-069, S-071, S-102

### B11 — Stock Adjustment (Gain)
**Journal:** DR 1100 Inventory / CR 4200 Stock Adjustment Gain
**Scenarios:** S-105

### B12 — Stock Transfer (No journal — logistics only)
Updates `inventory_batches.warehouse_id`. Zero ledger effect.
**Scenarios:** S-006, S-101

### B13 — Operating Expense
**Journal:** DR 6000 Operating Expenses / CR 1000/1010 Cash or Bank
**With input tax:** + DR 2300 Input Tax Recoverable
**Scenarios:** S-083

### B14 — Owner Drawing (Fund Out)
**Journal:** DR 3000 Owner's Capital / CR 1000/1010

### B15 — Owner Capital Injection (Fund In)
**Journal:** DR 1000/1010 / CR 3000 Owner's Capital

### B16 — Manufacturing/Production Run *(canonical per Financial Bible v3.0)*
**Step 1 — Deduct raw materials:** DR 6400 Manufacturing Cost / CR 1100 Inventory (FIFO oldest-first per warehouse)
**Step 2A (external labor):** DR 6410 Applied Manufacturing Labor / CR 1000/1010 Cash
**Step 2B (salaried labor):** DR 6410 Applied Manufacturing Labor / CR 2400 Salary Payable
**Step 3 — Book finished goods:** DR 1100 Inventory = total_cost / CR 6400 Manufacturing Cost + CR 6410 Applied Labor
**Scenarios:** S-013, S-014, S-015, S-094, S-095, S-096, S-097, S-098

### B17 — Bank Transfer *(canonical per Financial Bible v3.0)*
**Journal:** DR destination account / CR source account (e.g. DR 1010 Bank / CR 1000 Cash)
**Scenarios:** S-062

> 🔒 **B-NUMBER LOCK:** The above numbering (B16=Production, B17=Bank Transfer) matches the Financial Bible v3.0 canonical order. All references in REBUILD_PLAN.md and TASK_CHECKLIST.md must use this numbering. Do not swap.

### B18 — Purchase Return (Debit Note)
**Journal:** DR 2000 AP / CR 1100 Inventory (original batch cost)
**Scenarios:** S-059

### B19 — Opening Balance
**Journal:** DR/CR real accounts / CR/DR 7000 Opening Balance Equity
**Rule:** Account 7000 MUST net to zero after all entries.
**Scenarios:** S-053, S-054, S-055, S-056

### B20 — Customer Advance Receipt
**Journal:** DR 1000/1010 / CR 2100 Customer Advance — NO TAX posted here
**Scenarios:** S-023, S-048

### B21 — Supplier Advance Payment
**Journal:** DR 1300 Advance to Supplier / CR 1000/1010

### B22 — Charitable Donation
**Journal:** DR 6200 Charity Expense / CR 1100 Inventory (FIFO) or CR 1000 Cash

### B23 — Depreciation
**Journal:** DR 6600 Depreciation Expense / CR 1510 Accumulated Depreciation

### B24 — Loan Drawdown/Repayment
**Drawdown:** DR 1000/1010 / CR 2500 Loan Payable
**Repayment:** DR 2500 (principal) + DR 6500 (interest) / CR 1000/1010

### B25 — Bounced Cheque Reversal
**Journal:** DR 1200 AR / CR 1000 Cash (mirror of original B4)
**Sets:** `payment_allocations.status = 'reversed'`
**Scenarios:** S-020

### B26 — Bad Debt Write-Off
**Journal:** DR 6700 Bad Debt Expense / CR 1200 AR
**Requires:** Manager approval (`journal_entries.approved_by`)
**Scenarios:** S-021, S-090

### B27 — Final Employee Settlement
**Journal:**
- DR 6100 Salary Expense = partial_month
- DR 6800 Gratuity & Severance = gratuity + notice + leave
- CR 2400 Salary Payable = total
- Then: DR 2400 / CR 1000/1010 Cash
**Scenarios:** S-080

### B28 — Cash Shortage Recording
**Journal:** DR 6900 Cash Shortage Loss / CR 1000 Cash
**Requires:** Manager-only, mandatory narration
**Scenarios:** S-104

### B29 — Insurance Claim (2-step)
**Step 1:** DR 6950 Disaster Loss / CR 1100 Inventory (FIFO)
**Step 2:** DR 1000/1010 Cash / CR 6960 Insurance Recovery
**Both reference:** `disaster_claims.id`
**Scenarios:** S-107

### B30 — Set Disassembly
**Journal:** CR 1100 Inventory (set FIFO cost) / DR 1100 Inventory per component at allocated_cost
**Allocation %** from `disassembly_bom_items` — must sum to 100%
**Scenarios:** S-108

### B31 — UOM Conversion Sale
Normal B1/B2 journal. `FifoService` deducts `base_qty = sale_qty / conversion_factor`
**Scenarios:** S-012

### B32 — WIP Transfer
**Start:** DR 1150 WIP / CR 1100 Inventory + CR 6410 Labor
**Complete:** DR 1100 Inventory / CR 1150 WIP
**Scenarios:** S-074

---

## SECTION 4 — SERVICE CLASS CONTRACTS

### 4.1 AccountingService
**Owns:** `journal_entries`, `journal_items` — the ONLY class that writes to these tables.
**Must never:** Be bypassed. No controller or other service writes journal entries directly.

| Method | Signature | Description |
|--------|-----------|-------------|
| createEntry | `(array $data, array $lines): JournalEntry` | Creates balanced journal entry. Validates SUM(debit)=SUM(credit). Calls `PartyService::rebuildSnapshot()` for each party_id. |
| reverseEntry | `(int $journalEntryId, string $reason): JournalEntry` | Posts mirror-image entry. MUST call `PaymentService::voidAllocations()` in same transaction. |
| getBalance | `(string $accountCode, ?Carbon $asOf): float` | Returns account balance from journal_items WHERE is_reversed=0. |

### 4.2 FifoService
**Owns:** `inventory_batches.remaining_qty`, `sale_item_batches` — the ONLY class that writes these.

| Method | Signature | Description |
|--------|-----------|-------------|
| deductStock | `(int $productId, int $warehouseId, float $qty, ?string $saleUom): array` | Oldest-first FIFO. Returns [{batch_id, qty_taken, unit_cost, total_cost}]. Throws InsufficientStockException. |
| restoreStock | `(int $saleItemId): array` | Restores to EXACT original batch from sale_item_batches. Most-recent deduction first. |
| receiveBatch | `(int $productId, int $warehouseId, float $qty, float $unitCost, ...): InventoryBatch` | Creates new batch. |
| checkAvailability | `(int $productId, int $warehouseId, float $qty): bool` | Pre-flight check without locking. |

### 4.3 PaymentService
**Owns:** `payment_allocations`, `sales.payment_status`, `purchases.payment_status`

| Method | Signature | Description |
|--------|-----------|-------------|
| allocate | `(int $paymentJournalEntryId, array $allocations): void` | Creates allocation rows. Checks over-allocation. |
| updatePaymentBadge | `(int $saleId): void` | Recomputes payment_status from allocations. ONLY writer of this column. |
| voidAllocations | `(int $journalEntryId): void` | Sets status='reversed'. Called ONLY by AccountingService::reverseEntry(). |

### 4.4 InventoryService
**Owns:** Batch creation on purchase, adjustment batches, disassembly component batches.

| Method | Signature | Description |
|--------|-----------|-------------|
| receivePurchase | `(Purchase $purchase): void` | Creates inventory_batches for each purchase item. |
| adjustStock | `(int $productId, int $warehouseId, float $qty, float $unitCost, string $direction): void` | B10/B11 |

### 4.5 ManufacturingService
**Owns:** `production_runs`, BOM processing, WIP tracking.

| Method | Signature | Description |
|--------|-----------|-------------|
| startProductionRun | `(int $bomId, float $qty, int $warehouseId): ProductionRun` | Deducts materials, posts WIP if enabled. |
| completeProductionRun | `(int $runId, float $actualQty): void` | Creates finished goods batch, closes WIP. |
| partialReverse | `(int $runId, float $reverseQty): void` | Reverses unsold qty only. |
| disassemble | `(int $productId, float $qty, int $warehouseId): void` | B30 disassembly. |

### 4.6 PartyService
**Owns:** `party_snapshots`

| Method | Signature | Description |
|--------|-----------|-------------|
| rebuildSnapshot | `(int $partyId, ?string $accountCode): void` | Rebuilds cached_balance from journal_items. |
| getBalance | `(int $partyId, string $accountCode): float` | Reads snapshot, falls back to live ledger. |

### 4.7 ReportService
**Owns:** All financial report compilation. Zero caching — always live ledger.

| Method | Signature | Description |
|--------|-----------|-------------|
| trialBalance | `(?Carbon $asOf): array` | All accounts, debit/credit totals. |
| profitAndLoss | `(Carbon $from, Carbon $to): array` | Revenue − COGS − Expenses. |
| balanceSheet | `(Carbon $asOf): array` | Assets = Liabilities + Equity. |
| cashFlow | `(Carbon $from, Carbon $to): array` | Operating, investing, financing. |
| agedReceivables | `(?Carbon $asOf): array` | Per customer (parties.type=customer), per invoice, per bucket. |
| agedPayables | `(?Carbon $asOf): array` | Per supplier (parties.type=supplier), per invoice. |
| inventoryValuation | `(?int $warehouseId): array` | SUM(remaining_qty × unit_cost). |

### 4.8 TaxService
| Method | Signature | Description |
|--------|-----------|-------------|
| calculateLineTax | `(float $amount, float $taxRate, bool $priceIncludesTax): array` | Returns [net, tax]. |
| taxReport | `(Carbon $from, Carbon $to): array` | 2200 vs 2300 breakdown. |

### 4.9 UomService
| Method | Signature | Description |
|--------|-----------|-------------|
| toBaseQty | `(int $productId, float $saleQty, string $saleUom): float` | Converts sale UOM to base UOM. |
| getConversionFactor | `(int $productId, string $saleUom): float` | Returns factor or throws. |

### 4.10 SettlementService
| Method | Signature | Description |
|--------|-----------|-------------|
| processSettlement | `(int $employeeId, array $components): void` | B27 composite transaction. |

### 4.11 SaleService *(previously missing — fixes Issue #5)*
**Owns:** `sales`, `sale_items`, `sale_items.cogs_amount` — the ONLY class that orchestrates a complete sale transaction.
**Calls in order (all inside DB::transaction()):**
1. Validate discount vs `discount_limits` for user role
2. Validate unit_price vs batch cost (below-cost → require approved_by PIN)
3. `FifoService::deductStock()` for each line item → get FIFO deduction array
4. `AccountingService::createEntry()` with B1 or B2 journal lines
5. Write `sale_items.cogs_amount` = SUM(deduction.total_cost) per line
6. `PaymentService::allocate()` if any payment collected
7. `PaymentService::updatePaymentBadge()`

| Method | Signature | Description |
|--------|-----------|-------------|
| post | `(array $saleData, array $items, array $payments): Sale` | Full B1/B2 orchestration. Atomic. Never partial. |
| reverse | `(int $saleId, string $reason): Sale` | Full B9 return — reverses journal + restores stock. |
| validateDiscount | `(float $discountPct, int $userId): void` | Throws if discount > discount_limits for user's role. |
| validateBelowCost | `(array $items, int $warehouseId, ?int $approvedBy): void` | Throws if below cost and no manager PIN. |

---

## SECTION 5 — THE 15 THINGS THAT MUST NEVER HAPPEN

| # | Thing | Prevention Mechanism |
|---|-------|---------------------|
| 1 | A journal entry deleted from the database | No DELETE permission on journal_entries. UI has no delete button. Reversals only. |
| 2 | inventory_batches.unit_cost overwritten after creation | No UPDATE on unit_cost column (app-level). Column is SET once at INSERT. |
| 3 | products.cost_price used for COGS or inventory valuation | Code review. FifoService is the ONLY COGS source. |
| 4 | bank_accounts.current_balance or parties.current_balance used in financial calculations | All financial queries go through AccountingService::getBalance() or party_snapshots. |
| 5 | SUM(debit) ≠ SUM(credit) on a journal_entry | AccountingService validates before INSERT. Rejects if unbalanced. |
| 6 | payment_allocations sum exceeding invoice total | DB trigger + PaymentService app validation. |
| 7 | inventory_batches.remaining_qty going negative | DB CHECK constraint + SELECT FOR UPDATE locking. |
| 8 | Tax posted when customer advance received | B20 posts to 2100 only. TaxService not called on advances. |
| 9 | B28 Cash Shortage posted by non-manager | Middleware role check + journal_entries.approved_by required. |
| 10 | Payment reversal without voiding allocations | AccountingService::reverseEntry() hardcodes call to PaymentService::voidAllocations(). |
| 11 | Disassembly BOM allocation_% not summing to 100% | DB CHECK + app validation on disassembly_bom_items. |
| 12 | Opening stock (B19) at zero cost | CHECK (unit_cost > 0 OR batch_type != 'opening') on inventory_batches. |
| 13 | Below-cost sale without manager PIN | SaleController checks unit_price < batch cost → requires approved_by. |
| 14 | party_snapshots not rebuilt after party-linked journal entry | AccountingService::createEntry() calls PartyService::rebuildSnapshot() for every party_id. |
| 15 | Account 7000 non-zero after all opening entries | Verification query after B19. UI warning if 7000 ≠ 0. |

---

## SECTION 6 — THE 5 GOLDEN RULES

| Rule | Statement | Enforcement |
|------|-----------|-------------|
| 1 | Every transaction has two sides | AccountingService requires ≥2 journal_items per entry |
| 2 | Debits must equal Credits | `SUM(debit) = SUM(credit)` validated before save — throws if not |
| 3 | Entries are never deleted | No DELETE route. No delete button. Reversals only. |
| 4 | Posting is atomic | `DB::transaction()` wraps business record + journal entries |
| 5 | Every entry has a reference | `reference_type` + `reference_id` are NOT NULL on journal_entries |

---

## SECTION 7 — ALL 18 DESIGN DECISIONS

| ID | Decision | Choice Made | Code Implication |
|----|----------|-------------|-----------------|
| S-004 | Zero-cost items | Warn but allow, acknowledgement required | Warning UI + promotional flag |
| S-006 | Multi-warehouse FIFO | Per-warehouse FIFO | FifoService filters by warehouse_id first |
| S-011 | Selling below cost | Warn + Manager PIN required | PIN modal, approved_by on journal_entry |
| S-012 | UOM conversion | Support conversion factor | product_uom_conversions table, UomService |
| S-014 | Sub-assembly depth | Max 5 levels BOM nesting | Circular BOM check, depth limiter |
| S-015 | Production reversal | Partial reversal of unsold qty only | ManufacturingService::partialReverse() |
| S-022 | Round-off tolerance | Configurable, default Rs.1 | system_settings, PaymentService auto-close |
| S-026 | Multi-currency | Phase 2 — manual PKR entry now | All amounts in PKR for Phase 1 |
| S-040 | Promotional free items | 3-row approach (2 paid + 1 at Rs.0) | is_promotional flag on sale_items |
| S-042 | Tiered pricing | Multiple sale_item rows per tier | product_price_tiers table |
| S-044 | Max discount | Configurable per role | discount_limits table, server validation |
| S-045 | Price lock on Sales Orders | Lock at order creation | sales_orders.unit_price is immutable |
| S-048 | Tax on advances | Tax at delivery, not receipt | B20 posts no tax, B1 conversion posts tax |
| S-050 | Partial input tax | Manual split, user enters business_pct | PurchaseController stores split |
| S-073 | Future-dated transactions | Allow up to 30 days with warning | DatePicker blocks >30 days |
| S-074 | Work-in-Progress | Account 1150 WIP on Balance Sheet | B32 transaction, production_runs.wip_balance |
| S-094 | By-product from manufacturing | Record at NRV, reduces main cost | bom_items.is_byproduct + byproduct_nrv |
| S-106 | Sales commission | Monthly bulk expense (B7) | employees.commission_rate for reference |
