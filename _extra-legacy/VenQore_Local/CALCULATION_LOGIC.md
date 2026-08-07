# VenQore POS — Calculation Logic & Architecture Bible
> **Document Status:** LIVE. This is the single source of truth for how every number in this system is calculated.
> **Last Updated:** 2026-02-20
> **Written By:** Antigravity AI Architect after full forensic audit of codebase vs. Master Architecture Rollout Plan.

---

# PHASE 1.1 — FORENSIC AUDIT & COMPLETE BLUEPRINT

## The Core Mission
This document exists because **the math in this system is the product**. If a client sees a wrong profit number, they make a wrong business decision. That is not a bug. That is a betrayal. Every word in this document is written with that weight.

---

## PART 1: WHAT WE FOUND — THE FORENSIC AUDIT

After reading every relevant controller, every migration, and every calculation in the codebase, here is the exact state of the system today.

### 1.1 — The Most Dangerous Bug: Revenue Label on the Dashboard

**File:** `app/Http/Controllers/DashboardController.php`
**Function:** `getSalesStats()` (lines 258–277)

```php
// CURRENT (WRONG) CODE:
return [
    'sales' => (float) $salesTotal,
    'revenue' => (float) ($salesTotal - $cogs), // This is actually Gross Profit
];
```

**The Problem:**
The variable is named `revenue` but it is calculated as `Total Sales - COGS`. That is the definition of **Gross Profit**, not Revenue. Revenue is what a customer owes you for products. Gross Profit is what's left after deducting what those products cost you. These are two completely different financial realities.

When a business owner sees "Revenue: 50,000" on their screen and that number is actually Gross Profit, they believe they sold 50,000 worth of goods. In reality, they might have sold 150,000 worth of goods. The system is feeding them a massive financial hallucination.

Additionally, the `sales` field uses `SUM(total)` which includes **tax**. Tax is money collected for the government. It is never revenue. The "Sales" card on the dashboard is therefore also wrong.

**What it should return:**
```
sales      → Net Sales (Gross Sales minus Discounts, EXCLUDING Tax)
gross_profit → Net Sales minus FIFO COGS (not static cost_price)
```

---

### 1.2 — The Sales Table Schema: Missing the Entire Financial Waterfall

**File:** `database/migrations/2026_01_02_000002_create_sales_table.php`

**Current schema columns:**
- `subtotal` — (undefined meaning, currently = sum of item prices × quantities)
- `tax`
- `discount` — (only one discount field — no item-level vs. global discount separation)
- `total` — (currently = subtotal + tax - discount)
- `payment_status` — (a status flag being used in financial math — a time bomb)

**The Problem — The Waterfall is Collapsed into One Number:**

The Master Architecture Rollout Plan defines a precise mathematical waterfall for every sale:

```
Gross Amount (Line Level)   → quantity × unit_price
- Item Discount             → per-line discount
= Net Amount (Line Level)   → the true taxable base for this item
× Tax Rate                  → tax calculated on Net, NOT on Gross
= Tax Amount
= Line Total                → Net Amount + Tax Amount

───────────────────────────────────────
Subtotal Gross (Header)     → SUM of all line gross_amounts
- Total Item Discounts      → SUM of all line discount_amounts
- Global Discount           → one-time bill-level discount
= Net Sales (Header)        → THIS is Revenue. This is what the dashboard shows.
+ Total Tax                 → SUM of all line tax_amounts
+ Shipping Charges          → extra fees
= Invoice Total             → what the customer actually owes
```

**What the current schema does instead:**
The current `sales` table collapses ALL of this into `subtotal = sum(price × qty)` and `discount` = one global number. There is no separation between:
- Item-level discounts vs. global discounts
- Gross Sales vs. Net Sales
- What revenue is vs. what the customer owes

This means:
1. You cannot report accurate Gross Sales
2. You cannot report accurate Discount Analysis
3. You cannot know true Net Revenue
4. Tax is bundled into `total` but `subtotal` = raw price sum, creating definitional confusion

---

### 1.3 — The sale_items Table: Critically Incomplete

**File:** `database/migrations/2026_01_02_000003_create_sale_items_table.php`

**Current columns:**
- `quantity`
- `unit_price`
- `subtotal` — (= quantity × unit_price, no discount, no tax)

**Added later via migration:**
- `cost_price` — (static snapshot from `products.cost_price`)
- `free_quantity`

**What is Missing:**
Per the Master Architecture Rollout Plan, the `sale_items` table MUST store every step of the line-level waterfall:

| Column | Status | Problem |
|--------|--------|---------|
| `quantity` | ✅ Exists | — |
| `unit_price` | ✅ Exists | — |
| `gross_amount` = qty × unit_price | ❌ Missing | Derived but not stored |
| `discount_amount` | ❌ Missing | Item-level discount is nowhere tracked |
| `net_amount` = gross - discount | ❌ Missing | The actual taxable base is not stored |
| `tax_rate` | ❌ Missing | Which tax rate applied to this item? |
| `tax_amount` = net_amount × tax_rate | ❌ Missing | Item-level tax is not stored |
| `line_total` = net_amount + tax_amount | ❌ Missing | True billable amount per line not stored |
| `cost_price` | ✅ Exists (added) | But it's static — not from FIFO batches |
| `subtotal` | ✅ Exists | But = unit_price × quantity (no discount) |

**The consequence:** The `subtotal` column on `sale_items` is currently `price × quantity` (gross amount). The system then does `SUM(subtotal)` on sale_items to get the sale's `subtotal` on the header. This means the "subtotal" at the header level is actually the **Gross Sales**, not the Net Sales. But it's being *treated as* Net Sales (Revenue) everywhere — including the dashboard and P&L calculations.

**This is the core math error that corrupts every downstream report.**

---

### 1.4 — The COGS Calculation: Using Static cost_price Instead of FIFO

**File:** `app/Http/Controllers/DashboardController.php` (lines 269–271)
**File:** `app/Http/Controllers/SaleController.php` (lines 124–127)

```php
// CURRENT (WRONG) COGS CALCULATION:
$cogs = DB::table('sale_items')
    ->sum(DB::raw('cost_price * (quantity + COALESCE(free_quantity, 0))'));

// Where cost_price comes from:
$costPrice = $product->cost_price ?? $product->cost ?? 0;
```

**The Problem — The "50 vs 100 Rupee" Error:**

Imagine a product with this purchase history:
- Jan 1: Bought 2 units at **Rs. 50** each
- Jan 15: Bought 10 units at **Rs. 100** each

When a customer buys 10 units on Jan 20:
- **Current system:** Uses `products.cost_price = 100` (last updated value). Reports COGS = 10 × 100 = **Rs. 1,000**
- **Reality (FIFO):** Should consume Batch 1 (2 units × 50 = 100) + Batch 2 (8 units × 100 = 800). True COGS = **Rs. 900**

The system overstates COGS by Rs. 100 in this case, **understating Gross Profit by Rs. 100**.

In a business doing thousands of transactions, this error compounds to massive inaccuracies. Worse, when a new batch arrives at a higher cost, the static `cost_price` is overwritten. Historical sales then show wrong COGS because the column no longer reflects what was actually paid at the time of purchase.

**What does not exist in the codebase that MUST exist:**
- `inventory_batches` table — **DOES NOT EXIST** (there is a `product_batches` table but it tracks manufacturer batch numbers and expiry dates, NOT purchase costs and FIFO deductions)
- `sale_item_batches` table — **DOES NOT EXIST** (the junction table linking sales to the exact cost batches consumed)

Without these two tables, FIFO is mathematically impossible to implement.

---

### 1.5 — Inventory Value: The Accounting Fraud

**File:** `app/Http/Controllers/DashboardController.php` (lines 209–211)

```php
// CURRENT (WRONG) INVENTORY VALUE:
$inventoryValue = DB::table('stocks')
    ->join('products', 'stocks.product_id', '=', 'products.id')
    ->sum(DB::raw('stocks.quantity * products.cost_price'));
```

**The Problem:**
This multiplies `total quantity` by `current cost_price` (the latest/overwritten price). This is a textbook example of accounting fraud:

- If you bought 1,000 units at Rs. 10 last year
- And 100 units at Rs. 50 today
- `products.cost_price` now = 50
- Current system reports inventory value = 1,100 × 50 = **Rs. 55,000**
- Truth = (1,000 × 10) + (100 × 50) = **Rs. 15,000**

The system is inflating the company's assets by **Rs. 40,000**. This number goes onto their Balance Sheet. This cannot be deployed to paying clients.

**The Correct Formula:**
```
Inventory Value = SUM(inventory_batches.remaining_qty × inventory_batches.unit_cost)
```
Where `inventory_batches` tracks every purchase delivery as a separate row with its exact cost.

---

### 1.6 — Receivables & Payables: Status Flag Dependency (The Time Bomb)

**File:** `app/Http/Controllers/SaleController.php` (lines 574–588)

```php
// CURRENT (FRAGILE) TOTAL PAID LOGIC:
$paidFully = $statsQuery->clone()->where('payment_status', 'paid')->sum('total');
$totalPaid = $paidFully + $paidPartially;
$totalUnpaid = max(0, $totalSales - $totalPaid);
```

**The Problem:**
The system uses `payment_status = 'paid'` as a financial signal. This is exactly what the Master Architecture Rollout Plan calls "a ticking time bomb." If:
- A developer manually sets `payment_status = 'paid'` in the database
- A bug flips the status prematurely
- An import sets all sales as 'paid'

...then `totalPaid` becomes wrong, and the business owner believes they have cash they don't possess.

**What the Master Plan mandates:**
Receivables must be calculated from the General Ledger Account 1200, not from status flags. The ledger formula is:
```
Outstanding (Customer X) = SUM(AR Debits for Customer X) - SUM(AR Credits for Customer X)
```
This is mathematically incorruptible because double-entry accounting requires every credit to have a corresponding debit. A status flag can be changed by anyone. The ledger can only be changed by a financial transaction.

**Current state of the accounting integration:**
The `SaleController.php` DOES fire journal entries (lines 263–396). This is a positive sign. However:
1. It credits Account 4000 (Sales Income) with `$subtotal` — which currently includes item amounts at gross (pre-discount)
2. It does NOT separate item-level discounts from the revenue credit
3. The `outstanding` section of the Dashboard (lines 51–57 in DashboardController) reads `account->balance` — a cached static column — not a real-time ledger query

---

### 1.7 — The Sales Dashboard: Wrong Metrics, Wrong Labels

**File:** `app/Http/Controllers/SaleController.php` — `dashboard()` function (lines 448–535)

```php
// CURRENT (WRONG) DASHBOARD:
'sales_today' => $todayStats->total,  // includes tax — NOT net sales
'sales_month' => $monthStats->total,  // includes tax — NOT net sales
```

**Top Selling Products query:**
```php
DB::table('sale_items')
    ->select('products.name', 'products.price', 
             DB::raw('SUM(sale_items.quantity) as qty'), 
             DB::raw('SUM(sale_items.subtotal) as revenue'))
```

**Problems:**
1. `sales_today` = `SUM(total)` which includes Tax. Shows tax as revenue.
2. Top selling products show `revenue` (Gross Sales) but NOT `Gross Profit Generated`. The Master Architecture mandates a 4th column: **Gross Profit Generated per Product** = Net Sales for item - FIFO COGS for item.
3. Average Order Value uses `total` (tax-inclusive) not `net_sales`.
4. "Monthly Revenue" label vs. actual value: `total` is tax-inclusive — mislabeled as Revenue.

---

### 1.8 — Revenue Recognition: No "Posted" Status Lock

**File:** `app/Http/Controllers/SaleController.php` (line 108)

```php
'status' => 'completed',
```

**The Problem:**
The Master Architecture Rollout Plan mandates a **"Posted"** status as the financial trigger. Right now, a sale is created with `status = 'completed'` and journal entries fire immediately. While this produces the same end result in most cases, the architecture problem is:

- There is no `Draft` state where a sale can be saved without financial impact
- If a sale is in progress and the server crashes mid-creation, partial journal entries could fire before the `DB::rollback()` is reached (though `DB::transaction()` should handle this — it does here)
- There is no formal distinction between "sale created" and "sale financially recognized"

The missing `posted` status also means you cannot build proper **Quotations** or **Draft Invoices** (Sale Orders exist but the status flow is not connected to accounting triggers).

---

### 1.9 — Account Balance Column: Cached Value Desync Risk

**File:** `database/migrations/2026_01_04_233000_create_accounting_tables.php`

```php
$table->decimal('balance', 20, 2)->default(0);
```

**The Problem:**
The `accounts` table has a `balance` column. The Dashboard reads this directly:
```php
$receivablesAccount = Account::where('code', '1200')->first();
'receivables' => (float) ($receivablesAccount->balance ?? 0),
```

This is a cached, static number. The Master Architecture mandates that Receivables must be a real-time query of the ledger:
```sql
SELECT SUM(debit) - SUM(credit) 
FROM journal_items 
WHERE account_id = [Account 1200 ID]
```

If this cached `balance` column ever desyncs from the actual ledger sum (which it will — any manual database correction, any import, any migration will break it), the Dashboard shows a wrong Receivable number. The business owner gets a false sense of how much money is owed to them.

---

## PART 2: THE MATHEMATICAL FOUNDATION — HOW IT MUST WORK

This section defines, precisely and unambiguously, every formula this system must use. This is the law.

---

### 2.1 — The Sale Waterfall (The Immutable Definitions)

Every single sale in this system is a waterfall of calculations. No step may be skipped. No step may be combined with another.

```
┌──────────────────────────────────────────────────────────────────────┐
│                    LINE ITEM LEVEL (sale_items)                       │
├──────────────────────────────────────────────────────────────────────┤
│  gross_amount    = quantity × unit_price                              │
│  discount_amount = [item-level discount entered at POS/Invoice]       │
│  net_amount      = gross_amount - discount_amount                     │
│  tax_rate        = [tax rate assigned to this product]                │
│  tax_amount      = net_amount × (tax_rate / 100)                     │
│  line_total      = net_amount + tax_amount                           │
│  cost_price      = [FIFO cost from inventory_batches — NOT static]   │
├──────────────────────────────────────────────────────────────────────┤
│                    INVOICE HEADER LEVEL (sales)                       │
├──────────────────────────────────────────────────────────────────────┤
│  subtotal_gross  = SUM(sale_items.gross_amount)                       │
│  item_discounts  = SUM(sale_items.discount_amount)                    │
│  global_discount = [bill-level discount entered at checkout]          │
│  net_sales       = subtotal_gross - item_discounts - global_discount  │
│                  ► THIS IS THE REVENUE. Dashboard shows this.         │
│  total_tax       = SUM(sale_items.tax_amount)                        │
│                  ► This goes to Tax Payable. NOT revenue.             │
│  shipping        = [shipping/extra charges]                           │
│  invoice_total   = net_sales + total_tax + shipping                  │
│                  ► This is what the customer OWES. AR = this.         │
└──────────────────────────────────────────────────────────────────────┘
```

---

### 2.2 — The Three Core Profit Calculations

These three calculations flow from the waterfall above. They are the heartbeat of the P&L.

#### Gross Profit
```
Gross Profit = Net Sales - COGS
```
Where:
- `Net Sales` = from Phase 2.1 above (NOT invoice_total, NOT subtotal_gross)
- `COGS` = SUM of (qty_deducted × unit_cost) from `sale_item_batches` table (FIFO — NOT static cost_price)

#### Gross Margin %
```
Gross Margin % = (Gross Profit / Net Sales) × 100
```
Never store this. Always calculate dynamically.

#### Net Profit
```
Net Profit = Gross Profit - Operating Expenses
```
Where:
- `Operating Expenses` = SUM of all journal_items debits in 6000-series accounts for the period
- **Never stored as a static column. Always calculated from the ledger.**

---

### 2.3 — COGS: The FIFO Algorithm

This is the engine that must replace `products.cost_price` in all profit calculations.

#### Required New Tables

**Table: `inventory_batches`** (does not currently exist)
```sql
CREATE TABLE inventory_batches (
    id              UUID PRIMARY KEY,
    product_id      UUID NOT NULL → products.id,
    purchase_invoice_id  VARCHAR NULLABLE, -- links to the vendor bill
    warehouse_id    UUID NULLABLE → warehouses.id,
    original_qty    DECIMAL(10,4) NOT NULL,
    remaining_qty   DECIMAL(10,4) NOT NULL,  -- THE CRITICAL COLUMN
    unit_cost       DECIMAL(20,4) NOT NULL,  -- what you paid per unit in this delivery
    expiry_date     DATE NULLABLE,
    created_at      TIMESTAMP,               -- used for FIFO sorting (ASC = oldest first)
    updated_at      TIMESTAMP,
    deleted_at      TIMESTAMP NULLABLE       -- soft delete
);
```

**Table: `sale_item_batches`** (does not currently exist)
```sql
CREATE TABLE sale_item_batches (
    id                  UUID PRIMARY KEY,
    sale_item_id        UUID NOT NULL → sale_items.id,
    inventory_batch_id  UUID NOT NULL → inventory_batches.id,
    qty_deducted        DECIMAL(10,4) NOT NULL,
    unit_cost           DECIMAL(20,4) NOT NULL, -- locked-in cost from batch at time of sale
    total_cogs          DECIMAL(20,4) NOT NULL, -- qty_deducted × unit_cost
    created_at          TIMESTAMP,
    updated_at          TIMESTAMP
);
```

#### The FIFO Deduction Algorithm (Backend Logic)

When a Sale is finalized (status changes to `posted`), for each `sale_item`:

```
FUNCTION processFifoDeduction(product_id, warehouse_id, quantity_needed):
    
    remaining_need = quantity_needed
    total_cogs     = 0
    batch_records  = []
    
    // Step 1: Get all available batches, oldest first
    batches = inventory_batches
              .where(product_id = product_id)
              .where(warehouse_id = warehouse_id)
              .where(remaining_qty > 0)
              .orderBy(created_at, ASC)    // FIFO: First-In = oldest batch
    
    // Step 2: Loop through batches until need is filled
    FOR EACH batch IN batches:
        IF remaining_need == 0: BREAK
        
        can_take     = MIN(batch.remaining_qty, remaining_need)
        batch_cogs   = can_take × batch.unit_cost
        total_cogs  += batch_cogs
        
        batch.remaining_qty  -= can_take         // Update batch
        remaining_need       -= can_take
        
        batch_records.append({
            inventory_batch_id : batch.id,
            qty_deducted       : can_take,
            unit_cost          : batch.unit_cost,
            total_cogs         : batch_cogs
        })
    
    // Step 3: Safety Check
    IF remaining_need > 0:
        THROW Exception("Insufficient stock for FIFO deduction. 
                         Needed: {quantity_needed}, Gap: {remaining_need}")
    
    RETURN {total_cogs, batch_records}
```

#### Numerical Proof

Setup: Batch 101 (2 units @ Rs. 50), Batch 102 (10 units @ Rs. 100)
Sale: 10 units at Rs. 150 each

```
Step 1 — Batch 101 (oldest):
    remaining_qty = 2, need = 10
    take = MIN(2, 10) = 2
    COGS contribution = 2 × 50 = Rs. 100
    Batch 101 remaining_qty → 0
    need remaining = 8

Step 2 — Batch 102:
    remaining_qty = 10, need = 8
    take = MIN(10, 8) = 8
    COGS contribution = 8 × 100 = Rs. 800
    Batch 102 remaining_qty → 2
    need remaining = 0

Total COGS = 100 + 800 = Rs. 900
Net Sales = 10 × 150 = Rs. 1,500
Gross Profit = 1,500 - 900 = Rs. 600

Old system would have calculated:
    COGS = 10 × 100 (current cost_price) = Rs. 1,000
    Gross Profit = 1,500 - 1,000 = Rs. 500
    ERROR: Rs. 100 of real profit was hidden from the owner.
```

---

### 2.4 — Inventory Valuation (The Real Asset)

```
Inventory Cost Value = SUM(inventory_batches.remaining_qty × inventory_batches.unit_cost)
                       WHERE remaining_qty > 0
```

**Three metrics that must be calculated separately:**

| Metric | Formula | Goes to | Stored? |
|--------|---------|---------|---------|
| Cost Value | SUM(remaining_qty × unit_cost) from batches | Balance Sheet | No — calculated |
| Retail Value | SUM(remaining_qty × products.current_selling_price) | Forecasting only | No — calculated |
| Projected Margin | Retail Value - Cost Value | Planning | No — calculated |

**Average Cost per Product** (for display only, never stored):
```
Average Cost = Total Cost Value / Total Quantity on Hand
             = SUM(remaining_qty × unit_cost) / SUM(remaining_qty)
```

---

### 2.5 — Receivables & Payables: The Ledger Law

**Receivables (Customer owes you):**
```sql
SELECT 
    SUM(ji.debit) - SUM(ji.credit) AS outstanding_balance
FROM journal_items ji
JOIN journal_entries je ON ji.journal_entry_id = je.id
WHERE ji.account_id = [Account 1200: Accounts Receivable]
  AND je.party_id = :customer_id  -- [if party-specific]
  AND je.date BETWEEN :start AND :end
```

**Payables (You owe suppliers):**
```sql
SELECT 
    SUM(ji.credit) - SUM(ji.debit) AS outstanding_balance
FROM journal_items ji
JOIN journal_entries je ON ji.journal_entry_id = je.id
WHERE ji.account_id = [Account 2000: Accounts Payable]
  AND je.party_id = :supplier_id  -- [if party-specific]
  AND je.date BETWEEN :start AND :end
```

**The Rule:** These queries NEVER read `parties.current_balance`. They never read `sales.payment_status`. They read the ledger. The ledger is truth.

---

### 2.6 — The Automated Journal Entries (What Must Fire on Every Sale)

When a sale is `posted`, these journal entries must fire automatically inside a single DB transaction:

#### Entry 1: Revenue Recognition & AR
```
DEBIT:  Accounts Receivable (1200)  → invoice_total (what customer owes)
CREDIT: Sales Revenue (4000)        → net_sales (true revenue, ex-tax, ex-discount)
CREDIT: Tax Payable (2200)          → total_tax (government money)
CREDIT: Shipping Income (4100)      → shipping (if applicable)
```

#### Entry 2: COGS & Inventory Reduction
```
DEBIT:  Cost of Goods Sold (5000)   → total_cogs (from FIFO batches)
CREDIT: Inventory Asset (1100)      → total_cogs (reduces asset by same amount)
```

#### Entry 3: When Payment is Received (separate transaction, fired separately)
```
DEBIT:  Cash/Bank (1000/1010)       → amount_received
CREDIT: Accounts Receivable (1200)  → amount_received (reduces debt)
```

**The mandatory rule:** Entry 3 must NEVER be combined with Entry 1. Revenue is recognized when goods change hands (Entry 1). Cash is recorded when money changes hands (Entry 3). These are separate events that may happen at different times.

---

### 2.7 — Dashboard Card Definitions (The Exact Labels & Logic)

#### Main Dashboard (`/dashboard`)

| Card Label | Formula | Source | ❌ Current Bug |
|------------|---------|--------|----------------|
| **Net Sales** | SUM(sales.net_sales) | `sales` table | Currently shows SUM(total) which includes tax |
| **Gross Profit** | Net Sales - FIFO COGS | `sales` table + `sale_item_batches` | Currently labeled "Revenue" |
| **Receivables** | SUM(AR debits) - SUM(AR credits) | `journal_items` WHERE account = 1200 | Currently reads cached `accounts.balance` |
| **Payables** | SUM(AP credits) - SUM(AP debits) | `journal_items` WHERE account = 2000 | Currently reads cached `accounts.balance` |
| **Net Profit** | Gross Profit - Operating Expenses | All `journal_entries` in period | Currently correct approach but COGS is wrong |
| **Inventory Value** | SUM(remaining_qty × unit_cost) | `inventory_batches` | Currently: quantity × static cost_price (WRONG) |

#### Sales Dashboard (`/sales/dashboard`)

| Card Label | Formula | Source | ❌ Current Bug |
|------------|---------|--------|----------------|
| **Sales Today** | SUM(net_sales) for today | `sales` table | Currently SUM(total) — includes tax |
| **Monthly Net Sales** | SUM(net_sales) for month | `sales` table | Currently "Monthly Revenue" = SUM(total) |
| **Avg Order Value** | Monthly Net Sales / Count | Calculated | Currently uses total (tax-inclusive) |
| **Top Selling — Revenue** | SUM(net_amount) per product | `sale_items` | Currently SUM(subtotal) = gross amount |
| **Top Selling — Gross Profit** | Net Sales - FIFO COGS per product | `sale_items` + `sale_item_batches` | ❌ DOES NOT EXIST YET |

---

## PART 3: THE SCHEMA CHANGES REQUIRED

This section lists every database change needed to implement Phase 1.1.

### 3.1 — Modify `sale_items` Table

Add the missing waterfall columns:

```php
// New migration: add_financial_waterfall_to_sale_items_table.php
Schema::table('sale_items', function (Blueprint $table) {
    // The full waterfall at line level:
    $table->decimal('gross_amount', 20, 4)->default(0)->after('unit_price');
    $table->decimal('discount_amount', 20, 4)->default(0)->after('gross_amount');
    $table->decimal('net_amount', 20, 4)->default(0)->after('discount_amount');
    $table->decimal('tax_rate', 8, 4)->default(0)->after('net_amount');
    $table->decimal('tax_amount', 20, 4)->default(0)->after('tax_rate');
    $table->decimal('line_total', 20, 4)->default(0)->after('tax_amount');
    // cost_price already exists but must come from FIFO batches
    // subtotal already exists — should be aliased to gross_amount in logic
});
```

### 3.2 — Modify `sales` (Header) Table

Add the missing waterfall columns at the invoice level:

```php
// New migration: add_financial_waterfall_to_sales_table.php
Schema::table('sales', function (Blueprint $table) {
    $table->decimal('subtotal_gross', 20, 4)->default(0)->after('subtotal');
    $table->decimal('total_item_discounts', 20, 4)->default(0)->after('subtotal_gross');
    $table->decimal('global_discount', 20, 4)->default(0)->after('total_item_discounts');
    $table->decimal('net_sales', 20, 4)->default(0)->after('global_discount');
    // total_tax → rename or use existing 'tax' column (clarify)
    $table->decimal('total_tax', 20, 4)->default(0)->after('net_sales');
    $table->decimal('shipping_charges', 20, 4)->default(0)->after('total_tax');
    $table->decimal('invoice_total', 20, 4)->default(0)->after('shipping_charges');
    // 'total' column currently = invoice_total — we will populate invoice_total and keep 'total' for backward compat
});
```

### 3.3 — Create `inventory_batches` Table (NEW)

```php
// New migration: create_inventory_batches_table.php
Schema::create('inventory_batches', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('product_id')->constrained()->cascadeOnDelete();
    $table->string('purchase_invoice_id')->nullable(); // reference to vendor bill
    $table->foreignUuid('warehouse_id')->nullable()->constrained()->nullOnDelete();
    $table->decimal('original_qty', 10, 4)->default(0);
    $table->decimal('remaining_qty', 10, 4)->default(0); // THE KEY COLUMN
    $table->decimal('unit_cost', 20, 4)->default(0);
    $table->date('expiry_date')->nullable();
    $table->text('notes')->nullable();
    $table->timestamps();
    $table->softDeletes();
    
    // Index for FIFO queries
    $table->index(['product_id', 'warehouse_id', 'remaining_qty', 'created_at']);
});
```

### 3.4 — Create `sale_item_batches` Table (NEW)

```php
// New migration: create_sale_item_batches_table.php
Schema::create('sale_item_batches', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('sale_item_id')->constrained('sale_items')->cascadeOnDelete();
    $table->foreignUuid('inventory_batch_id')->constrained('inventory_batches');
    $table->decimal('qty_deducted', 10, 4)->default(0);
    $table->decimal('unit_cost', 20, 4)->default(0); // snapshot at time of sale
    $table->decimal('total_cogs', 20, 4)->default(0); // qty_deducted × unit_cost
    $table->timestamps();
    
    // Index for COGS lookup by sale
    $table->index(['sale_item_id']);
    $table->index(['inventory_batch_id']);
});
```

---

## PART 4: THE IMPLEMENTATION PRIORITY LADDER

Work in exactly this order. Do NOT skip steps. Each step is the foundation of the next.

### Step 1 (Immediate — No Migration)
Correct the labels and comments in `DashboardController.php`:
- Change `'revenue'` key to `'gross_profit'` in `getSalesStats()`
- Add a comment clearly stating `$salesTotal` includes tax and the label shown is currently wrong until the schema is updated

### Step 2 (Migration A)
Run the `sale_items` table migration to add the full waterfall columns.
Update `SaleController.php` `store()` to populate all new columns on every `SaleItem::create()`.

### Step 3 (Migration B)
Run the `sales` table migration to add `net_sales`, `subtotal_gross`, `total_item_discounts`, `global_discount`, `invoice_total`.
Update `SaleController.php` to calculate and store all these values at checkout.

### Step 4 (Migration C — The Big One)
Create `inventory_batches` table.
Create `sale_item_batches` table.
Write the FIFO deduction service (`FifoService.php`).
On every purchase that is "Posted", create a new `inventory_batch` record.
On every sale that is "Posted", run the FIFO loop and populate `sale_item_batches`.

### Step 5 (Data Backfill)
Write a one-time migration script that:
1. Creates inventory batches from existing purchase history (using the purchase price at time of order)
2. Ensures `remaining_qty` reflects current stock levels

### Step 6 (Rewire Dashboard)
Update `DashboardController.php` and `SaleController.php`'s `dashboard()` method to use:
- `net_sales` column instead of `total` for Revenue
- `sale_item_batches` table for COGS instead of static `cost_price`
- Real-time ledger query for Receivables/Payables instead of `accounts.balance`
- `inventory_batches` for Inventory Value instead of `stocks.quantity × products.cost_price`

### Step 7 (Top Selling Products — Gross Profit Column)
Add the mandatory 4th column to the Top Selling Products widget:
- `Gross Profit Generated` = SUM(net_amount) - SUM(total_cogs from sale_item_batches) for that product in the date range

---

## PART 5: THE FINAL AUDIT TEST

Before any of this code goes to a client, run this exact test. If any number is wrong, go back to Step 1.

```
Transaction 1: Buy 10 units of Product X at Rs. 50 each
Transaction 2: Buy 10 units of Product X at Rs. 100 each
Transaction 3: Sell 15 units to Customer A at Rs. 150 each (on credit)
Transaction 4: Receive Rs. 500 payment from Customer A

EXPECTED RESULTS:
───────────────────────────────────────────────────────
FIFO COGS for Transaction 3:
    Batch 1 (oldest): 10 units × Rs. 50 = Rs. 500
    Batch 2 (next):    5 units × Rs. 100 = Rs. 500
    Total COGS = Rs. 1,000

Net Sales (Transaction 3) = 15 × 150 = Rs. 2,250

Gross Profit = Rs. 2,250 - Rs. 1,000 = Rs. 1,250

Gross Margin % = (1,250 / 2,250) × 100 = 55.6%

Inventory Cost Value after Transaction 3:
    Batch 1: 0 remaining (fully consumed)
    Batch 2: 5 units × Rs. 100 = Rs. 500
    Total Inventory Value = Rs. 500

Receivables after Transaction 3:
    AR Debit (from sale) = Rs. 2,250
    AR Credit (from payment) = Rs. 500
    Outstanding = Rs. 1,750

Cash Balance after Transaction 4:
    Cash Debit = Rs. 500
    Cash Account = Rs. 500

Trial Balance must zero out:
    All Debits = All Credits (to the cent)
───────────────────────────────────────────────────────

If your system produces these exact numbers:
✅ Net_sales = Rs. 2,250
✅ COGS = Rs. 1,000
✅ Gross Profit = Rs. 1,250
✅ Inventory Value = Rs. 500
✅ Receivables = Rs. 1,750
✅ Cash = Rs. 500
✅ Trial Balance zeroes out

...the Phase 1 architecture is complete and the business can trust this software.
```

---

## PART 6: WHAT MUST NOT BE DONE

These are absolute prohibitions. If any developer violates these, the entire system's integrity collapses.

1. ❌ **NEVER** update `products.cost_price` during a sale. It is a reference field, not a financial record.
2. ❌ **NEVER** calculate COGS from `products.cost_price` in any financial report. Always read from `sale_item_batches`.
3. ❌ **NEVER** store Net Profit as a database column. It is always dynamically calculated from the ledger.
4. ❌ **NEVER** store Gross Profit as a database column. Same rule.
5. ❌ **NEVER** use `payment_status` as a financial signal. It is a UI badge only.
6. ❌ **NEVER** calculate Receivables or Payables from the `sales` or `invoices` tables directly. Always read Account 1200 and Account 2000 from the ledger.
7. ❌ **NEVER** update `accounts.balance` directly from application code. If a cached balance column is used, it must be refreshed exclusively by a reconciliation service that reads the ledger.
8. ❌ **NEVER** mix Cash Flow with Revenue Recognition in the same journal entry. Entry 1 (Sale posted) and Entry 3 (Payment received) are separate events.
9. ❌ **NEVER** compute inventory value as `SUM(quantity × products.cost_price)`. Always use `SUM(inventory_batches.remaining_qty × inventory_batches.unit_cost)`.
10. ❌ **NEVER** skip a DB transaction when modifying `inventory_batches.remaining_qty`. A crash mid-FIFO-loop without a rollback creates permanently corrupted inventory records.

---

*Phase 1.1 Document closed. Phase 1.2 (Revenue Recognition Mechanics) is also fully implemented as of 2026-02-20. See PART 7 below for confirmed status. See PART 8 for all remaining gaps that still need to be fixed.*

---

# PART 7: PHASE 1.1 & 1.2 — CONFIRMED IMPLEMENTATION STATUS

> **Audit Date:** 2026-02-20  
> **Auditor:** Antigravity AI — full forensic read of every controller, service, and migration.  
> This section records what has been built and verified in the live codebase. Every item below has been confirmed by reading the actual source files.

---

### ✅ 7.1 — Financial Waterfall Schema: DONE

| Migration File | What It Does | Status |
|---|---|---|
| `2026_02_20_000001_add_financial_waterfall_to_sale_items_table.php` | Adds `gross_amount`, `discount_amount`, `net_amount`, `tax_rate`, `tax_amount`, `line_total` to `sale_items` | ✅ Exists |
| `2026_02_20_000002_add_financial_waterfall_to_sales_table.php` | Adds `subtotal_gross`, `total_item_discounts`, `global_discount`, `net_sales`, `total_tax`, `shipping_charges`, `invoice_total` to `sales` | ✅ Exists |
| `2026_02_20_120001_add_waterfall_columns_to_sale_items.php` | Idempotent re-apply of the above (safe, checks with `hasColumn`) | ✅ Exists |
| `2026_02_20_000004_backfill_financial_waterfall_columns.php` | One-time backfill of all historical sale and sale_item records | ✅ Exists |

**Verification:** `SaleController::store()` now populates every waterfall column on every sale (lines 59–176). The `net_sales` column is the authoritative revenue number throughout the system.

---

### ✅ 7.2 — FIFO Infrastructure: DONE

| Item | Status |
|---|---|
| `inventory_batches` table migration (`2026_02_20_000003`) | ✅ Creates table with correct schema matching §3.3 |
| `sale_item_batches` table migration (same file) | ✅ Creates table with correct schema matching §3.4 |
| `FifoService.php` — `deductAndRecord()` | ✅ Correct FIFO algorithm with `lockForUpdate()` for concurrency |
| `FifoService.php` — `receiveBatch()` | ✅ Called by `PurchaseController` on every received purchase |
| `FifoService.php` — `hasBatches()` | ✅ Graceful static-cost fallback during transition |
| `PurchaseController.php` — wired to `receiveBatch()` | ✅ Lines 317 and 468 |
| `SaleController.php` — wired to `deductAndRecord()` | ✅ Lines 252–277 |
| Historical backfill from purchases (`2026_02_20_100002`) | ✅ Seeds `inventory_batches` from all existing received purchase history |
| `sale_item_batches` audit trail columns (`2026_02_20_100003`) | ✅ Adds `is_reversed`, `reversed_at`, `reversal_reason`, `deleted_at` |

---

### ✅ 7.3 — Revenue Recognition State Machine: DONE

| Item | Status |
|---|---|
| Migration `2026_02_20_100001` — renamed `completed → posted`, added `posted_at` | ✅ All historical sales backfilled |
| `SaleController` creates sales with `status = 'posted'` and `posted_at = now()` | ✅ |
| All P&L queries filter on `sales.posted_at` (not `created_at`) | ✅ Confirmed in `FinancialReportingService` |

---

### ✅ 7.4 — Dashboard Cards: All Fixed

| Card | Old Formula | New Formula | Status |
|---|---|---|---|
| Net Sales | `SUM(total)` (includes tax) | `SUM(net_sales)` | ✅ Fixed |
| Gross Profit | Labeled "Revenue", wrong formula | `net_sales - FIFO COGS` | ✅ Fixed |
| Receivables | `accounts.balance` (cached) | Real-time `journal_items` WHERE account 1200 | ✅ Fixed |
| Payables | `accounts.balance` (cached) | Real-time `journal_items` WHERE account 2000 | ✅ Fixed |
| Inventory Value | `stocks.quantity × products.cost_price` | `SUM(inventory_batches.remaining_qty × unit_cost)` | ✅ Fixed |
| Top Selling — Gross Profit | Did not exist | `net_amount - FIFO COGS` via `FinancialReportingService` | ✅ Added |

---

### ✅ 7.5 — Sale Reversal Engine: DONE

`SaleReversalService.php` atomically:
1. Posts a counter journal entry (every debit ↔ credit flipped) — new entry, never edits the past
2. Restores `inventory_batches.remaining_qty` exactly per `sale_item_batches` paper trail
3. Updates `stocks.quantity` aggregate cache
4. Marks `sale_item_batches` records as `is_reversed = true` (never deletes them)
5. Transitions `sales.status` to `returned` or `cancelled`

The migration `2026_02_20_150001` adds `party_id`, `source_type`, `source_id`, `is_reversal`, `reverses_entry_id` to `journal_entries` for a complete audit trail.

---

### ✅ 7.6 — Financial Reporting Service: DONE

`FinancialReportingService.php` is the single source of truth for:
- `getProfitAndLoss($start, $end)` — reads exclusively from `journal_items`
- `getReceivables($asOf)` — real-time AR from Account 1200 ledger
- `getPayables($asOf)` — real-time AP from Account 2000 ledger
- `getGrossProfitByProduct($start, $end)` — FIFO COGS, no static cost
- `getGrossProfitBySale($start, $end)` — bill-wise profit
- `getGrossProfitByParty($start, $end)` — customer profitability
- `getGrossProfitByCategory($start, $end)` — category profitability
- `getInventoryValue()` — correct formula: `SUM(remaining_qty × unit_cost)`
- `getInventoryValuationReport()` — product-level batch breakdown
- `getStockAging()` — frozen cash analysis
- `getExpiringSoon($days)` — expiry tracking
- `getAccountLedger($accountId, $start, $end)` — running balance per account
- `getTaxSummary($start, $end)` — output/input tax from Account 2100
- `getCashFlowReport($start, $end)` — direct method cash flow

---

## PART 8: REMAINING BUGS & GAPS — THE FIX LIST

> **Status:** These are confirmed bugs found by reading the live codebase against this document.  
> **Priority:** 🔴 Critical | 🟡 Important | 🟢 Minor  
> Every item below has the exact file, exact line number, exact problem, and exact fix.

---

### ~~🔴 BUG-01 — Trial Balance reads the cached `accounts.balance` column~~ ✅ FIXED 2026-02-20

> **Fixed in:** `app/Http/Controllers/ReportController.php` → `trialBalance()`  
> **Also updated:** `resources/js/Pages/Reports/TrialBalance.jsx`  
> **What changed:** Rewrote `trialBalance()` to read from `journal_items` exclusively. Added `asOf` date filter (defaults to today), real-time debit/credit per account, `isBalanced` flag, and zero-balance account filtering. Frontend updated to show a prominent Balanced/UNBALANCED status banner, a date picker, and a Net (Dr−Cr) column.

**Severity:** Critical — This is the financial integrity check. If it reads a stale cache, it can appear balanced when the ledger is not.


**File:** `app/Http/Controllers/ReportController.php`  
**Function:** `trialBalance()` — approximately lines 697–709

**Current WRONG code:**
```php
public function trialBalance(Request $request) {
    $accounts = Account::all()->map(function ($account) {
        return [
            'name'   => $account->name,
            'code'   => $account->code,
            'debit'  => max(0, $account->balance),   // ← WRONG: reads cached column
            'credit' => max(0, -$account->balance)   // ← WRONG: reads cached column
        ];
    });
    return Inertia::render('Reports/TrialBalance', compact('accounts'));
}
```

**Required CORRECT code:**
```php
public function trialBalance(Request $request)
{
    $asOf = $request->input('date', now()->toDateString());

    // SINGLE EFFICIENT AGGREGATION QUERY (O(1) database calls)
    $balances = DB::table('journal_items')
        ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
        ->where('journal_entries.date', '<=', $asOf)
        ->selectRaw('journal_items.account_id, SUM(journal_items.debit) as total_debit, SUM(journal_items.credit) as total_credit')
        ->groupBy('journal_items.account_id')
        ->get()
        ->keyBy('account_id');

    $rawAccounts = Account::orderBy('code')->get();

    $accounts = $rawAccounts->map(function ($account) use ($balances) {
        $ledger = $balances->get($account->id);
        $totalDebit  = $ledger ? (float) $ledger->total_debit : 0.0;
        $totalCredit = $ledger ? (float) $ledger->total_credit : 0.0;

        return [
            'id'     => $account->id,
            'code'   => $account->code,
            'name'   => $account->name,
            'type'   => $account->type,
            'debit'  => $totalDebit,
            'credit' => $totalCredit,
            'net'    => round($totalDebit - $totalCredit, 4),
        ];
    });

    $totalDebits  = $accounts->sum('debit');
    $totalCredits = $accounts->sum('credit');
    $isBalanced   = abs($totalDebits - $totalCredits) < 0.01; // tolerance for float rounding

    return Inertia::render('Reports/TrialBalance', [
        'accounts'     => $accounts,
        'totalDebits'  => $totalDebits,
        'totalCredits' => $totalCredits,
        'isBalanced'   => $isBalanced,
        'asOf'         => $date,
    ]);
}
```

**Rule violated:** CALCULATION_LOGIC.md §6 Rule #7 — *"NEVER update `accounts.balance` directly from application code... If a cached column is used, it must be refreshed exclusively by a reconciliation service."*

**What to do:** Replace the function completely. The trial balance MUST read from `journal_items` with a date filter. Also expose `isBalanced` to the frontend so the UI can alert if debits ≠ credits.

---

### ~~🔴 BUG-02 — Balance Sheet reads the cached `accounts.balance` column and has NO date filter~~ ✅ FIXED 2026-02-20

> **Fixed in:** `app/Services/FinancialReportingService.php` → added `getBalanceSheet(string $asOf)`  
> **Also updated:** `app/Http/Controllers/ReportController.php` → `balanceSheet()`  
> **Also updated:** `app/Http/Controllers/AccountingController.php` → `balanceSheet()` + `dashboard()`  
> **Also updated:** `resources/js/Pages/Accounting/BalanceSheet.jsx`  
> **What changed:** Added `getBalanceSheet($asOf)` public method to `FinancialReportingService`. It uses the existing private `netBalance()` helper to read `journal_items` with `WHERE date <= $asOf`. Both controllers now delegate to this method. Dashboard stats also fixed. Frontend shows `isBalanced` status banner, "As Of" date picker, account code column, and correctly named props.

**Severity:** Critical — The Balance Sheet is a legally required financial statement.


**File:** `app/Http/Controllers/ReportController.php`  
**Function:** `balanceSheet()` — approximately lines 612–626

**Current WRONG code:**
```php
public function balanceSheet(Request $request) {
    $assets      = Account::where('type', 'asset')->get();      // ← raw models with cached .balance
    $liabilities = Account::where('type', 'liability')->get();  // ← raw models with cached .balance
    $equity      = Account::where('type', 'equity')->get();     // ← raw models with cached .balance
    // No date filter — impossible to generate historical statements
}
```

**Problems:**
1. Uses `accounts.balance` (cached, can desync)
2. No date parameter — cannot generate Balance Sheet as-of any past date
3. Does NOT verify `Assets = Liabilities + Equity` (the fundamental accounting equation)
4. Inventory Asset (1100) balance does NOT come from `inventory_batches` — it comes from the cached column

**Required Solution — add to `FinancialReportingService.php`:**
```php
/**
 * Balance Sheet as of a specific date.
 * Assets = Liabilities + Equity (if not, the books don't balance — show a warning)
 *
 * RULE: Every balance reads from journal_items WHERE date <= $asOf.
 *       NEVER from accounts.balance.
 *
 * @param  string  $asOf  e.g. '2026-02-20'
 * @return array
 */
public function getBalanceSheet(string $asOf): array
{
    $accountTypes = ['asset', 'liability', 'equity'];
    $result = [];

    foreach ($accountTypes as $type) {
        $accounts = Account::where('type', $type)->orderBy('code')->get();
        $lines = [];
        $typeTotal = 0;

        foreach ($accounts as $account) {
            $balance = $this->netBalance($account->id, $account->type, $asOf);
            if ($balance == 0) continue; // skip zero-balance accounts

            $lines[] = [
                'id'      => $account->id,
                'code'    => $account->code,
                'name'    => $account->name,
                'balance' => $balance,
            ];
            $typeTotal += $balance;
        }

        $result[$type] = [
            'accounts' => $lines,
            'total'    => $typeTotal,
        ];
    }

    $totalAssets      = $result['asset']['total']     ?? 0;
    $totalLiabilities = $result['liability']['total'] ?? 0;
    $totalEquity      = $result['equity']['total']    ?? 0;
    $isBalanced       = abs($totalAssets - ($totalLiabilities + $totalEquity)) < 0.01;

    return [
        'assets'            => $result['asset']      ?? ['accounts' => [], 'total' => 0],
        'liabilities'       => $result['liability']  ?? ['accounts' => [], 'total' => 0],
        'equity'            => $result['equity']     ?? ['accounts' => [], 'total' => 0],
        'total_assets'      => $totalAssets,
        'total_liabilities' => $totalLiabilities,
        'total_equity'      => $totalEquity,
        'is_balanced'       => $isBalanced,
        'as_of'             => $asOf,
    ];
}
```

**Then update `ReportController::balanceSheet()`:**
```php
public function balanceSheet(Request $request)
{
    $date   = $request->input('date', now()->toDateString());
    $report = (new FinancialReportingService())->getBalanceSheet($date);

    return Inertia::render('Reports/BalanceSheet', $report);
}
```

**Rule violated:** §1.9 — *"The `accounts` table has a `balance` column... this is a cached, static number. The Master Architecture mandates that balances must be a real-time query of the ledger."*

---

### ~~🔴 BUG-03 — SalesHistory `index()` stats use tax-inclusive `total` instead of `net_sales`~~ ✅ FIXED 2026-02-20

> **Fixed in:** `app/Http/Controllers/SaleController.php` → `index()`  
> **What changed:** `$totalSales` now reads `SUM(net_sales)` (ex-tax, ex-discount). The entire paid/unpaid calculation was rewritten — removed `payment_status` flag usage entirely. `$totalPaid` now reads `SUM(payments.amount WHERE amount > 0)` for all sale IDs in the filtered set. `$totalUnpaid = max(0, net_sales - collected)`.

**Severity:** Critical — The "Total Sale" stat on the Sales History page shows inflated figures that include tax.


**File:** `app/Http/Controllers/SaleController.php`  
**Function:** `index()` — approximately line 667

**Current WRONG code:**
```php
$totalSales = $statsQuery->sum('total');  // ← 'total' = invoice_total (includes tax)
```

**Required CORRECT code:**
```php
$totalSales = $statsQuery->sum('net_sales');  // ← net_sales = true revenue (ex-tax, ex-discount)
```

**Additionally on line 672 — partial payment calculation still uses `payment_status` as a financial signal:**
```php
// CURRENT (violates §6 Rule #5):
$paidFully = $statsQuery->clone()->where('payment_status', 'paid')->sum('total');
```

**Required fix:** The paid/unpaid calculation on the Sales History stats panel must use actual payment records, not `payment_status` status flags. The correct approach:
```php
// Get all sales IDs in the filtered set
$filteredSaleIds = (clone $statsQuery)->pluck('id');

// Total billed = SUM(net_sales) for those sales
$totalSales = (clone $statsQuery)->sum('net_sales');

// Total collected = SUM of all payments against those sales
$totalPaid = DB::table('payments')
    ->whereIn('sale_id', $filteredSaleIds)
    ->where('amount', '>', 0)  // exclude negative (refund) payments
    ->sum('amount');

// Outstanding = billed - collected (never negative)
$totalUnpaid = max(0, $totalSales - $totalPaid);
```

**Rule violated:** §2.7 Net Sales definition. §6 Rule #5 — *"NEVER use `payment_status` as a financial signal. It is a UI badge only."*

---

### ~~🟡 BUG-04 — Partial Return uses `unit_price × qty` instead of `net_amount`~~ ✅ FIXED 2026-02-20

> **Fixed in:** `app/Http/Controllers/SaleController.php` → `returnSale()`  
> **What changed (3 fixes in one commit):**  
> 1. **Partial return** `$lineRevenue` now uses `net_amount / original_qty × return_qty` — the pro-rated discounted price. Falls back to `unit_price` only for legacy rows where `net_amount = 0`. Rounded to 4dp.  
> 2. **Full return** `$returnTotal` now uses `$sale->net_sales ?: $sale->total` (true revenue, not tax-inclusive invoice total).  
> 3. **Success message** now shows `$returnTotal` (the actual reversed amount) not `$sale->total`.

**Severity:** Important — Creates an accounting imbalance when a discounted item is returned. The refund amount exceeds what was ever charged.


**File:** `app/Http/Controllers/SaleController.php`  
**Function:** `returnSale()` — approximately line 793

**Current WRONG code:**
```php
// WRONG: uses gross price, not the discounted price the customer actually paid
$lineRevenue = (float) $originalItem->unit_price * $qty;
```

**The Problem in Numbers:**
```
Sale: 2 units at Rs. 500 each, with a Rs. 100 item discount
  gross_amount   = 2 × 500 = Rs. 1,000
  discount_amount = Rs. 100
  net_amount     = Rs. 900  ← what the customer actually paid

Customer returns 1 unit.

WRONG (current): refund = 500 × 1 = Rs. 500 (more than 900/2 = Rs. 450)
CORRECT:         refund = net_amount / original_qty × return_qty
                        = 900 / 2 × 1 = Rs. 450
```

**Required CORRECT code:**
```php
// CORRECT: pro-rate the net_amount by the fraction of quantity returned
$originalNetPerUnit = $originalItem->quantity > 0
    ? ((float) $originalItem->net_amount / (float) $originalItem->quantity)
    : (float) $originalItem->unit_price;

$lineRevenue = $originalNetPerUnit * $qty;
$returnTotal += $lineRevenue;
```

**Rule violated:** §2.1 waterfall definition. The `net_amount` column exists on `sale_items` precisely for this reversal calculation. If `net_amount` is 0 on a legacy row, fall back to `unit_price × qty`.

---

### ~~🟡 BUG-05 — ProductVariants are Excluded from FIFO — Architecture Gap~~ ✅ FIXED 2026-02-20

> **Fixed in:** `FifoService.php`, `InventoryBatch.php`, `SaleController.php`, `PurchaseController.php`, plus new migrations.  
> **What changed:** Added `variant_id` to `inventory_batches` and `product_variant_id` to `invoice_items`. The FIFO engine now creates and consumes variant-specific batches. The skip-variants guard in `SaleController` has been removed. Purchase receiving (both immediate and delayed) now correctly creates variant batches.

**Severity:** Important — All products with variants (size, color, etc.) bypass FIFO and use static `cost_price`. For any business selling variants, COGS is wrong for all variant products.


**File:** `app/Http/Controllers/SaleController.php` — approximately line 253

**Current WRONG code:**
```php
if (
    $isStockEnabled
    && empty($lineItem['variant_id'])  // ← FIFO deliberately skipped for variants
    && $this->fifo->hasBatches($lineItem['product_id'], $sale->warehouse_id)
) {
    // FIFO runs only for non-variant products
}
```

**Root Cause:** The `inventory_batches` table has no `variant_id` column. When you receive stock for a product with variants, you cannot create separate batches per variant. The FIFO engine therefore cannot tell "how many size-M units at cost X vs. size-L units at cost Y" are in stock.

**The Correct Architecture:**

**Step 1:** Add `variant_id` to `inventory_batches`:
```php
// New migration: add_variant_id_to_inventory_batches.php
Schema::table('inventory_batches', function (Blueprint $table) {
    $table->uuid('variant_id')->nullable()->after('product_id')
        ->comment('If set, this batch is for a specific product variant');
    $table->foreign('variant_id')
        ->references('id')->on('product_variants')->nullOnDelete();

    // New index: FIFO query must filter by variant too
    $table->index(['product_id', 'variant_id', 'warehouse_id', 'remaining_qty', 'created_at'],
        'inv_batches_variant_fifo_idx');
});
```

**Step 2:** Update `FifoService::deductAndRecord()` and `receiveBatch()` to accept `?string $variantId = null` and filter by it.

**Step 3:** Update `SaleController` to pass `$lineItem['variant_id']` to the FIFO methods.

**Step 4:** Update `PurchaseController` to pass the variant ID when receiving stock for a variant product.

**Until Step 1 migration runs:** The `empty($lineItem['variant_id'])` guard is the correct safeguard. Document it as a known limitation.

---

### ~~🟡 BUG-06 — Per-Item Tax Rate is Always Zero — Undocumented Deferral~~ ✅ FIXED 2026-02-20

> **Fixed in:** `SaleController.php`, plus new migration for `products`.  
> **What changed:** Added `tax_rate` to `products` table. The `SaleController` waterfall now fetches this rate per item, calculates `tax_amount` based on the line's `net_amount`, and sums them up for the header `total_tax`. Manual tax input is now bypassed in favor of this automated per-item logic.

**Severity:** Important (architectural completeness) — The waterfall in §2.1 defines `tax_rate` and `tax_amount` as required per-line columns. Both are always stored as `0`.


**File:** `app/Http/Controllers/SaleController.php` — lines 97–98

**Current state:**
```php
'tax_rate'   => 0,  // per-item tax rates: Phase 2 scope
'tax_amount' => 0,
```

**Current bill-level tax (from POS screen):**
```php
$totalTax = (float) ($request->tax ?? 0);
// This is a single number entered at checkout — not calculated from product tax rates.
// It is stored in sales.total_tax and credited to Account 2100 (Tax Payable).
// The per-item tax_rate and tax_amount columns are always 0.
```

**Implication:**
- The Tax Report shows taxes *collected* (from Account 2100 journal entries) ✅
- But `total_taxable` on the Tax Report is `0.0` — it cannot show the taxable base ❌
- Tax authorities often require: "taxable amount × rate = tax due" — the system cannot produce this
- The `tax_rate` column on `sale_items` is populated for FBR integration (`FbrService.php:49`) but with a default value, not a product-level assignment

**What Phase 2 must implement:**
1. Add `tax_rate` (percentage) to the `products` table
2. When creating a `SaleItem`, read `product->tax_rate` and compute:
   ```
   tax_amount  = net_amount × (tax_rate / 100)
   line_total  = net_amount + tax_amount
   ```
3. Roll up to the header:
   ```
   total_tax = SUM(sale_items.tax_amount)   ← no longer a manually entered number
   ```
4. The POS screen stops accepting manual tax input — tax is computed automatically
5. The Tax Report gains `total_taxable = SUM(sale_items.net_amount)` per tax rate

**For now:** The current bill-level tax entry is acceptable for Phase 1. But developers must NOT read `sale_items.tax_rate` as if it contains real data — it is always 0 until Phase 2 is implemented.

---

### ~~🟢 BUG-07 — `salePurchaseByItemCategory` report uses `subtotal` instead of `net_amount`~~ ✅ FIXED 2026-02-20

> **Fixed in:** `app/Http/Controllers/ReportController.php` → `salePurchaseByItemCategory()`  
> **What changed:** Changed `sale_items.subtotal` to `COALESCE(NULLIF(sale_items.net_amount, 0), sale_items.subtotal)`. This ensures revenue reports reflect true net sales (ex-tax, ex-discount) while maintaining compatibility with legacy data.

**Severity:** Minor — One secondary report shows gross revenue instead of net revenue.


**File:** `app/Http/Controllers/ReportController.php` — approximately line 1074

**Current WRONG code:**
```php
DB::raw('SUM(CASE WHEN sales.id IS NOT NULL THEN sale_items.subtotal ELSE 0 END) as sales')
//                                                   ↑ WRONG: subtotal = gross, pre-discount
```

**Required CORRECT code:**
```php
DB::raw('SUM(CASE WHEN sales.id IS NOT NULL THEN COALESCE(NULLIF(sale_items.net_amount, 0), sale_items.subtotal) ELSE 0 END) as sales')
//                                                   ↑ CORRECT: net_amount = revenue after discount
```

**Rule violated:** §2.7 — all revenue aggregates must use `net_amount` / `net_sales`, never `subtotal`.

---

### ~~🟢 BUG-08 — Cash in Hand / Bank balance reads cached `accounts.balance`~~ ✅ FIXED 2026-02-20

> **Fixed in:** `app/Http/Controllers/DashboardController.php`  
> **What changed:** Replaced `$glCash->balance` with a real-time ledger query `SUM(debit) - SUM(credit)` from `journal_items`. This ensures the primary dashboard cash display is always accurate and ledger-driven.

**Severity:** Minor — The right sidebar on the main Dashboard shows Cash and Bank balances from the cached column, not from a real-time ledger query.


**File:** `app/Http/Controllers/DashboardController.php` — line 215

**Current code:**
```php
$cashData = [
    'balance' => (float) $glCash->balance,  // ← reads Account.balance (cached column)
    'transactions' => $cashTx
];
```

**Required fix:** Use `FinancialReportingService::netBalance()` (already exists as a private method) or compute inline:
```php
$cashBalance = (float) DB::table('journal_items')
    ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
    ->where('journal_items.account_id', $glCash->id)
    ->selectRaw('SUM(debit) - SUM(credit) as balance')
    ->value('balance');

$cashData = [
    'balance'      => $cashBalance ?? 0.0,
    'transactions' => $cashTx
];
```

---

## PART 9: WHAT THE DOCUMENT WAS MISSING — FORWARD ARCHITECTURE

These are complete sections that were not written in the original document but MUST exist for the system to be complete. They are the specification for Phase 2.

---

### 9.1 — The `accounts.balance` Column — The Definitive Policy

The `accounts` table has a `balance` column. This section defines exactly when it is permissible to read or write it.

**When writing `accounts.balance` is ALLOWED:**
- `AccountingService::createEntry()` — updates `balance` for each account after posting a journal entry. This is the ONLY location.
- `SaleReversalService` — updates `balance` during reversal (same logic, reversed sign).

**When reading `accounts.balance` is ALLOWED:**
- Administrative displays (e.g., "Account Overview" in the Chart of Accounts screen — not a financial report, just a quick reference)
- Low-value UI helpers where a slight lag is acceptable

**When reading `accounts.balance` is PROHIBITED:**
- Trial Balance — must read `journal_items`
- Balance Sheet — must read `journal_items` with date filter
- P&L Statement — must read `journal_items`
- Dashboard Receivables/Payables — must read `journal_items`
- Any calculation that is presented to the business owner as a financial figure

**The Rule in One Sentence:** `accounts.balance` is a performance cache for the Chart of Accounts admin screen. It is not a financial source of truth.

---

### 9.2 — The Partial Return Waterfall (What Was Missing)

This section defines how reversals must be calculated for partial returns, mirroring the sale waterfall from §2.1.

```
PARTIAL RETURN — LINE ITEM LEVEL:
─────────────────────────────────────────────────────────────────────
  original_qty       → from sale_items.quantity
  return_qty         → from user input (must be ≤ original_qty)
  fraction           = return_qty / original_qty

  returned_net       = sale_items.net_amount × fraction
                     ↑ The amount of revenue being reversed

  returned_cogs      = SUM(sale_item_batches.total_cogs) × fraction
                     ↑ The FIFO cost being restored (proportional)
                     ↑ If no FIFO records: cost_price × return_qty

JOURNAL ENTRY for partial return of this line:
─────────────────────────────────────────────────────────────────────
  DEBIT:  Sales Revenue (4000)      → returned_net       (undo revenue)
  CREDIT: Accounts Receivable (1200)→ returned_net       (reduce debt)

  DEBIT:  Inventory Asset (1100)    → returned_cogs      (restore asset)
  CREDIT: Cost of Goods Sold (5000) → returned_cogs      (undo expense)
```

**The current code uses `unit_price × qty` for `returned_net`. This is wrong.** See BUG-04 above. The fix is to use `net_amount × fraction`.

---

### 9.3 — ProductVariant FIFO Architecture (Phase 2 Scope)

The `inventory_batches` table currently has no `variant_id`. This means:

**Current state:** Variant products share a single `inventory_batch` pool per product. FIFO is skipped for all variant products (see BUG-05). They use static `cost_price`.

**Phase 2 Goal:** Each variant gets its own independent FIFO batch pool.

**Schema change required:**
```sql
ALTER TABLE inventory_batches
    ADD COLUMN variant_id UUID NULL REFERENCES product_variants(id) ON DELETE SET NULL,
    DROP INDEX inv_batches_fifo_idx,
    ADD INDEX inv_batches_fifo_idx (product_id, variant_id, warehouse_id, remaining_qty, created_at);
```

**FIFO query change (in `FifoService::deductAndRecord()`):**
When `$variantId` is provided:
```sql
WHERE product_id = ? AND variant_id = ? AND warehouse_id = ? AND remaining_qty > 0
ORDER BY created_at ASC
```
When `$variantId` is NULL (non-variant product):
```sql
WHERE product_id = ? AND variant_id IS NULL AND warehouse_id = ? AND remaining_qty > 0
ORDER BY created_at ASC
```

**Until Phase 2 is implemented:** The `empty($lineItem['variant_id'])` guard in `SaleController` is correct and must remain. It prevents corrupted FIFO data from being written for variants.

---

### 9.4 — Per-Item Tax (Phase 2 Scope)

**Required database change:**
```php
// Migration: add_tax_rate_to_products_table.php
Schema::table('products', function (Blueprint $table) {
    $table->decimal('tax_rate', 8, 4)->default(0)->after('price')
        ->comment('Default GST/VAT rate for this product (%). Applied at line level.');
});
```

**Required `SaleController` change (when Phase 2 is active):**
```php
// Per-item tax (Phase 2 — reads from product model):
$product   = Product::find($item['product_id']);
$taxRate   = (float) ($product->tax_rate ?? 0);
$taxAmount = round($netAmount * ($taxRate / 100), 4);
$lineTotal = $netAmount + $taxAmount;

// No longer: 'tax_rate' => 0, 'tax_amount' => 0
// Instead:   these values come from the product definition
```

**POS screen change:** Remove the manual "Tax Amount" input field. Tax must be computed automatically from the product's `tax_rate`. The POS can show a "Tax Included" toggle for tax-inclusive pricing.

---

## PART 10: THE IMPLEMENTATION PRIORITY LADDER (CURRENT)

Work in exactly this order. Each step is the foundation of the next.

### 🔴 STEP A — Fix Trial Balance (BUG-01)
**File:** `app/Http/Controllers/ReportController.php` → `trialBalance()`  
**Time estimate:** 30 minutes  
**Risk:** Low (read-only change)  
Rewrite the function to read from `journal_items`. Add `isBalanced` output. Add `date` filter parameter.

---

### 🔴 STEP B — Fix Balance Sheet (BUG-02)
**File:** `app/Services/FinancialReportingService.php` → add `getBalanceSheet($asOf)`  
**File:** `app/Http/Controllers/ReportController.php` → `balanceSheet()`  
**Time estimate:** 45 minutes  
**Risk:** Low (read-only change)  
Add the `getBalanceSheet()` method to `FinancialReportingService`. Update the controller to use it with a date filter. Update the frontend `BalanceSheet` view to accept and display the new structured data.

---

### 🔴 STEP C — Fix SalesHistory `total_sale` stat (BUG-03)
**File:** `app/Http/Controllers/SaleController.php` → `index()`  
**Time estimate:** 15 minutes  
**Risk:** Low (one line change)  
Change `sum('total')` to `sum('net_sales')` for `$totalSales`. Fix the `$totalPaid` calculation to read from the `payments` table directly (not via `payment_status` flag).

---

### 🟡 STEP D — Fix Partial Return revenue calculation (BUG-04)
**File:** `app/Http/Controllers/SaleController.php` → `returnSale()`  
**Time estimate:** 20 minutes  
**Risk:** Medium (changes a financial calculation in the return flow)  
Replace `$originalItem->unit_price * $qty` with the pro-rated `net_amount` formula defined in §9.2 above.

---

### 🟡 STEP E — Fix `salePurchaseByItemCategory` report (BUG-07)
**File:** `app/Http/Controllers/ReportController.php` → `salePurchaseByItemCategory()`  
**Time estimate:** 10 minutes  
**Risk:** Low (one line change in a report query)  
Change `sale_items.subtotal` to `COALESCE(NULLIF(sale_items.net_amount, 0), sale_items.subtotal)`.

---

### 🟢 STEP F — Fix Dashboard Cash balance (BUG-08)
**File:** `app/Http/Controllers/DashboardController.php`  
**Time estimate:** 15 minutes  
**Risk:** Low (read-only change)  
Replace `$glCash->balance` with a real-time `journal_items` sum.

---

### 🟡 STEP G — Variant FIFO (BUG-05) — Phase 2
**Files:** New migration, `FifoService.php`, `SaleController.php`, `PurchaseController.php`  
**Time estimate:** 2–3 hours  
**Risk:** High (schema change, touches purchase and sale flows)  
Add `variant_id` to `inventory_batches`. Update `FifoService` to accept and filter by variant. Remove the `empty($lineItem['variant_id'])` guard in `SaleController`. Test thoroughly.

---

### 🟡 STEP H — Per-Item Tax (BUG-06) — Phase 2
**Files:** New migration for `products.tax_rate`, `SaleController.php`, POS frontend  
**Time estimate:** 3–4 hours  
**Risk:** High (changes POS checkout calculation, invoice display, Tax Report)  
Add `tax_rate` to products. Compute `tax_amount` per line in `SaleController`. Remove manual tax input from POS. Update Tax Report to show `total_taxable`.

---

## PART 11: THE COMPLETE AUDIT TEST (UPDATED)

This is the updated version of the final audit test from Part 5, which now includes the fixes from PART 8. If your system passes all checks below, the Phase 1 + Phase 2 (Steps A–F) implementation is complete.

```
PRE-CONDITIONS:
  Product X:  Start with 0 stock.
  No existing sales.

Transaction 1: Buy 10 units of X at Rs. 50 each  (Purchase received → inventory_batch created)
Transaction 2: Buy 10 units of X at Rs. 100 each (Purchase received → inventory_batch created)
Transaction 3: Sell 15 units to Customer A at Rs. 200 each, 5% item discount, on credit
Transaction 4: Receive Rs. 500 payment from Customer A
Transaction 5: Return 2 units from Transaction 3 (partial return)

─────────────────────────────────────────────────────────────────────

TRANSACTION 3 CALCULATIONS:
  gross_amount    = 15 × 200 = Rs. 3,000
  discount_amount = 5% × 3,000 = Rs. 150
  net_amount      = 3,000 - 150 = Rs. 2,850     ← revenue
  tax_amount      = 0 (Phase 1 — bill-level only)
  invoice_total   = Rs. 2,850                   ← what customer owes

  FIFO COGS:
    Batch 1 (oldest): 10 units × Rs. 50 = Rs. 500  (batch fully consumed)
    Batch 2 (next):    5 units × Rs. 100 = Rs. 500
    Total COGS = Rs. 1,000

  Gross Profit = 2,850 - 1,000 = Rs. 1,850
  Gross Margin = 1,850 / 2,850 × 100 = 64.9%

TRANSACTION 5 CALCULATIONS (partial return of 2 units):
  fraction       = 2 / 15 = 0.1333...
  returned_net   = 2,850 × 0.1333 = Rs. 380      ← revenue reversed
  returned_cogs  = 1,000 × 0.1333 = Rs. 133.33   ← COGS restored

EXPECTED STATE OF ALL REPORTS:
─────────────────────────────────────────────────────────────────────
✅ Net Sales (after return)         = Rs. 2,850 - Rs. 380   = Rs. 2,470
✅ COGS (after return)              = Rs. 1,000 - Rs. 133   = Rs. 867
✅ Gross Profit (after return)      = Rs. 2,470 - Rs. 867   = Rs. 1,603
✅ Inventory Value (Batch 2 left)   = 5 units × Rs. 100     = Rs. 500
     (minus 2 units returned  ↑)   → 5 + 2 = 7 remaining in Batch 2
     Corrected Inventory Value      = 7 × Rs. 100            = Rs. 700
✅ Receivables (after Tx4 + Tx5)   = Rs. 2,850 - Rs. 500 (Tx4 payment) - Rs. 380 (Tx5 return AR credit)
                                   = Rs. 1,970
✅ Cash Account                     = Rs. 500 (from Tx4 payment)
✅ Trial Balance                    : Total Debits = Total Credits (to the cent)
✅ Balance Sheet                    : Assets = Liabilities + Equity
✅ SalesHistory Stats               : Shows Rs. 2,470 net sales (NOT Rs. 2,850 or Rs. 3,000)
─────────────────────────────────────────────────────────────────────
```

**If every number above is correct, the entire Phase 1 + Phase 2 (Steps A–F) architecture is complete and production-safe.**

---

*Document last updated: 2026-02-20. This document is LIVE — update it every time a bug is fixed or a section is implemented.*
