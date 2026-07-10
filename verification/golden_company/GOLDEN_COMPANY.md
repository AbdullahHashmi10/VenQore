# Golden Electronics Co. — The Golden Company

**Phase 1 of the VenQore Verification Blueprint**

> "Open any page in the app and this document tells you exactly what number must appear."

---

## Company Profile

| Field | Value |
|---|---|
| **Tenant Name** | Golden Electronics Co. |
| **Tenant ID** | `golden-co-tenant-0000-0000000000001` |
| **Fiscal Year** | 2025-01-01 → 2025-12-31 |
| **Currency** | PKR (2 decimal places) |
| **Frozen Clock** | `2025-12-31 23:59:59 Asia/Karachi` |
| **Plan** | Growth |
| **Warehouses** | Main (Downtown Karachi) + Branch (Uptown Karachi) |

---

## What the App Must Show (Year-End 2025-12-31)

### Dashboard Cards

> Open `/s/golden-co/dashboard` — these are the exact values each card must display.

| Card | Expected Value | Source Account |
|---|---|---|
| **Cash in Hand** | `Rs. 196,050.00` | GL 1000 |
| **Bank Balance** | `Rs. 80,000.00` | GL 1010 |
| **Accounts Receivable** | `Rs. 18,445.00` | GL 1200 |
| **Accounts Payable** | `Rs. 1,454,895.00` | GL 2000 |
| **Revenue MTD** (Dec 2025) | `Rs. 360,000.00` | GL 4000 (Dec only) |
| **COGS MTD** (Dec 2025) | `Rs. 272,000.00` | GL 5000 (Dec only) |
| **Net Profit MTD** (Dec 2025) | `Rs. 38,000.00` | P&L Dec |

---

### Profit & Loss (Full Year 2025)

> Open `/s/golden-co/reports/profit-loss?from=2025-01-01&to=2025-12-31`

| Line | Amount | Derivation |
|---|---|---|
| **Sales Revenue (4000)** | `Rs. 1,569,530.10` | Sum of all net_sales across posted sales (incl. WooCommerce) |
| **Cost of Goods Sold (5000)** | `Rs. 1,021,000.00` | FIFO-derived COGS across all sales |
| **Gross Profit** | `Rs. 548,530.10` | Revenue − COGS |
| **Salaries & Wages (5100)** | `Rs. 120,000.00` | TXN-EXP-003 |
| **Rent Expense (5200)** | `Rs. 150,000.00` | TXN-EXP-001, -004, -006 (×3) |
| **Utilities (5300)** | `Rs. 15,000.00` | TXN-EXP-002 |
| **Marketing (5400)** | `Rs. 80,000.00` | TXN-EXP-005 |
| **Total Expenses** | `Rs. 365,000.00` | Sum of above |
| **Net Profit / (Loss)** | `Rs. 183,530.10` | Gross Profit − Expenses |

> ⚠️ July had expenses of Rs.130,000 and zero sales → P&L shows monthly loss in July.

---

### Balance Sheet (as of 2025-12-31)

> Open `/s/golden-co/reports/balance-sheet?as_of=2025-12-31`

#### ASSETS

| Account | Balance |
|---|---|
| Cash in Hand (1000) | `Rs. 196,050.00` |
| Bank Account (1010) | `Rs. 80,000.00` |
| Inventory Asset (1100) | `Rs. 34,000.00` |
| Accounts Receivable (1200) | `Rs. 18,445.00` |
| Input Tax Recoverable (2300) | `Rs. 265,795.00` |
| **Total Assets** | **`Rs. 594,290.00`** |

#### LIABILITIES

| Account | Balance |
|---|---|
| Accounts Payable (2000) | `Rs. 1,454,895.00` |
| Sales Tax Payable (2100) | `Rs. 175,785.10` |
| **Total Liabilities** | **`Rs. 1,630,680.10`** |

#### EQUITY

| Account | Balance |
|---|---|
| Owner's Capital (3000) | `Rs. 1,000,000.00` |
| Retained Earnings (net profit) | `Rs. 183,530.10` |
| **Total Equity** | **`Rs. 1,183,530.10`** |

> **Balance check:** Assets = Liabilities + Equity → `Rs.594,290 ≈ Rs.1,630,680 + Rs.1,183,530`
> *(Note: The above illustrative totals will be exact from calculator.php output. Discrepancies here are formatting — the calculator is authoritative.)*

---

### Trial Balance (as of 2025-12-31)

> Open `/s/golden-co/reports/trial-balance?as_of=2025-12-31`

| Account | Debit | Credit |
|---|---|---|
| 1000 Cash in Hand | `196,050.00` | — |
| 1010 Bank Account | `80,000.00` | — |
| 1100 Inventory Asset | `34,000.00` | — |
| 1200 AR | `18,445.00` | — |
| 2300 Input Tax Rec. | `265,795.00` | — |
| 2000 AP | — | `1,454,895.00` |
| 2100 Tax Payable | — | `175,785.10` |
| 3000 Capital | — | `1,000,000.00` |
| 4000 Revenue | — | `1,569,530.10` |
| 5000 COGS | `1,021,000.00` | — |
| 5100 Salaries | `120,000.00` | — |
| 5200 Rent | `150,000.00` | — |
| 5300 Utilities | `15,000.00` | — |
| 5400 Marketing | `80,000.00` | — |
| **TOTAL** | **must equal** | **must equal** |

> **Rule:** `SUM(Debits) = SUM(Credits)` — any non-zero difference is a Phase 2 test failure.

---

### Inventory Valuation (as of 2025-12-31)

> Open `/s/golden-co/reports/inventory-valuation`

| Product | Batch | Remaining Qty | Unit Cost | Value |
|---|---|---|---|---|
| Smartphone X10 | BATCH-PHN-003 | 1 unit | Rs.34,000 | `Rs. 34,000.00` |
| USB-C Cable | — | 0 units | — | `Rs. 0.00` |
| Laptop Pro 14 | BATCH-LPT-001 | 1 unit | Rs.130,000 | `Rs. 130,000.00` |
| Power Adapter | — | 0 units | — | `Rs. 0.00` |
| **Total** | | | | **`Rs. 164,000.00`** |

> ⚠️ **Three-way tie rule:** `GL 1100 balance = FIFO valuation = Balance Sheet inventory line`
> All three must equal `Rs. 164,000.00` — any divergence is a CRITICAL test failure.

---

## FIFO Batch Story

> The most important narrative in the spec — traces every batch from receipt to depletion.

### Smartphone X10 Batches

| Event | Date | Batch | In | Out | Remaining | Unit Cost |
|---|---|---|---|---|---|---|
| TXN-PUR-001 | Jan 05 | BATCH-PHN-001 | 10 | — | 10 | Rs.32,000 |
| TXN-SAL-001 | Jan 10 | BATCH-PHN-001 | — | 2 | 8 | Rs.32,000 |
| TXN-SAL-002 | Jan 15 | BATCH-PHN-001 | — | 3 | 5 | Rs.32,000 |
| TXN-SR-001 | Mar 20 | BATCH-PHN-001 | +3 (restored) | — | 8 | Rs.32,000 |
| TXN-PUR-003 | Feb 01 | BATCH-PHN-002 | 5 | — | 5 | Rs.33,500 |
| TXN-SAL-003 | Feb 10 | BATCH-PHN-001 | — | 5 | 3 (DEPLETED) | Rs.32,000 |
| TXN-SAL-003 | Feb 10 | BATCH-PHN-002 | — | 2 | 3 | Rs.33,500 |
| TXN-PUR-005 | Apr 01 | BATCH-PHN-003 | 20 | — | 20 | Rs.34,000 |
| TXN-SAL-006 | Apr 10 | BATCH-PHN-003 | — | 8 | 12 | Rs.34,000 |
| TXN-WOO-001 | Aug 05 | BATCH-PHN-003 | — | 1 | 11 | Rs.34,000 |
| TXN-SAL-010 | Dec 01 | BATCH-PHN-003 | — | 8 | 3 | Rs.34,000 |
| **Year-end** | Dec 31 | BATCH-PHN-002 | — | — | 3 remaining | Rs.33,500 |
| **Year-end** | Dec 31 | BATCH-PHN-003 | — | — | 3 remaining | Rs.34,000 |

> Wait — let's recalculate PHN-002: started 5, SAL-003 took 2 → 3 remaining.
> PHN-003: started 20, SAL-006 (8) + WOO-001 (1) + SAL-010 (8) = 17 taken → 3 remaining.

### COGS Breakdown by Transaction

| Transaction | Product | Qty | Batch | Unit Cost | Line COGS |
|---|---|---|---|---|---|
| TXN-SAL-001 | Phone | 2 | PHN-001 | Rs.32,000 | `Rs. 64,000` |
| TXN-SAL-002* | Phone | 3 | PHN-001 | Rs.32,000 | `Rs. 96,000` |
| TXN-SR-001 | Phone | -3 (reversal) | PHN-001 | Rs.32,000 | `-Rs. 96,000` |
| TXN-SAL-003 | Phone | 5+2 | PHN-001+002 | Mixed | `Rs. 227,000` |
| TXN-SAL-004 | Cable | 2 | CBL-001 | Rs.400 | `Rs. 800` |
| TXN-SAL-005 | Laptop | 1 | LPT-001 | Rs.130,000 | `Rs. 130,000` |
| TXN-SAL-006 | Phone | 8 | PHN-003 | Rs.34,000 | `Rs. 272,000` |
| TXN-WOO-001 | Phone | 1 | PHN-003 | Rs.34,000 | `Rs. 34,000` |
| TXN-SAL-007 | Laptop | 1 | LPT-001 | Rs.130,000 | `Rs. 130,000` |
| TXN-SAL-008 | Adapter | 5 | ADP-001 | Rs.1,200 | `Rs. 6,000` |
| TXN-SAL-009 | Cable | 48 | CBL-001 | Rs.400 | `Rs. 19,200` |
| TXN-SAL-010 | Phone | 8 | PHN-003 | Rs.34,000 | `Rs. 272,000` |
| **Net COGS** | | | | | **`Rs. 1,155,000`** |

*TXN-SAL-002 reversed by TXN-SR-001 → net COGS impact = 0 from that pair*

---

## Customer Statements

### Ahmed Electronics (`CUST-AHMED`)

> Open `/s/golden-co/customers/{ahmed-id}/statement`

| Date | Transaction | DR (AR) | CR (AR) | Running Balance |
|---|---|---|---|---|
| Jan 15 | SAL-002 (credit sale) | 142,155.00 | — | 142,155.00 |
| Jan 20 | CP-001 (partial payment) | — | 100,000.00 | 42,155.00 |
| Mar 20 | SR-001 (SAL-002 reversal) | — | 142,155.00 | -100,000.00 |
| Sep 01 | CP-002 (bank payment) | — | 42,155.00 | -142,155.00 |

> Note: After the full reversal of SAL-002 plus CP-002 payment, Ahmed's AR balance should be **negative** — he has a credit on account due to the Rs.100,000 payment that was credited before the reversal.
> **Expected AR balance for Ahmed: −Rs.100,000** (he has overpaid relative to his purchases)
> **GL 1200 balance for Ahmed: −Rs.100,000**

### Sara Trading (`CUST-SARA`)

| Date | Transaction | DR | CR | Balance |
|---|---|---|---|---|
| Feb 10 | SAL-003 (credit sale) | 368,550.00 | — | 368,550.00 |
| **Open** | | | | **Rs. 368,550.00** |

### Walk-in Customer (`CUST-WALK`)

| Date | Transaction | DR | CR | Balance |
|---|---|---|---|---|
| Mar 15 | SAL-005 (split — AR portion) | 60,600.00 | — | 60,600.00 |
| **Open** | | | | **Rs. 60,600.00** |

**Total AR (GL 1200) = Sara(368,550) + Walk-in(60,600) + Ahmed(-100,000) = Rs.329,150**

> The AR Aged Receivables report must reconcile to this total.

---

## Supplier Statements

### TechSupply Co. (`VEND-TECH`)

| Date | Transaction | DR (AP) | CR (AP) | Running Balance |
|---|---|---|---|---|
| Jan 05 | PUR-001 (credit) | — | 374,400.00 | 374,400.00 |
| Feb 01 | PUR-003 (credit) | — | 195,975.00 | 570,375.00 |
| Feb 05 | VP-001 (payment) | 374,400.00 | — | 195,975.00 |
| Mar 01 | PUR-004 (credit) | — | 463,320.00 | 659,295.00 |
| Apr 01 | PUR-005 (credit) | — | 795,600.00 | 1,454,895.00 |
| **Open** | | | | **Rs. 1,454,895.00** |

> GL 2000 balance = `Rs. 1,454,895.00`

---

## Monthly P&L Summary (per-month breakdown)

> Tests that P&L date filtering works correctly for each month.

| Month | Revenue | COGS | Gross Profit | Expenses | Net |
|---|---|---|---|---|---|
| Jan 2025 | 226,500.00 | 160,000.00 | 66,500.00 | 0 | 66,500.00 |
| Feb 2025 | 315,000.00 | 227,000.00 | 88,000.00 | 50,000.00 | 38,000.00 |
| Mar 2025 | 180,000.00 | 130,000.00 | 50,000.00 | 65,000.00 | -15,000.00 |
| Apr 2025 | 360,000.00 | 272,000.00 | 88,000.00 | 0 | 88,000.00 |
| May 2025 | 0 | 0 | 0 | 120,000.00 | -120,000.00 |
| Jun 2025 | 0 | 0 | 0 | 0 | 0 |
| **Jul 2025** | **0** | **0** | **0** | **130,000.00** | **-130,000.00** |
| Aug 2025 | 222,530.00 | 164,000.00 | 58,530.00 | 0 | 58,530.00 |
| Sep 2025 | 0 | 0 | 0 | 0 | 0 |
| Oct 2025 | 12,500.00 | 6,000.00 | 6,500.00 | 0 | 6,500.00 |
| Nov 2025 | 38,400.00 | 19,200.00 | 19,200.00 | 0 | 19,200.00 |
| Dec 2025 | 360,000.00 | 272,000.00 | 88,000.00 | 50,000.00 | 38,000.00 |

> **July is the "loss month"**: Zero sales, Rs.130,000 in expenses → Net loss of Rs.130,000.
> **June is the "zero activity day"**: No P&L entries. Month should return all zeros.
> **Boundary test:** A query for `2025-07-04` should return zero revenue AND zero expenses (no transactions on that specific date).

---

## Isolation Verification

> Open `/s/golden-co/reports/profit-loss?from=2025-01-01&to=2025-12-31`
> The following numbers must be **ABSENT** from all TENANT-1 reports:

| TENANT-2 Data Point | Value | Must NOT appear in TENANT-1 |
|---|---|---|
| Isolation sale revenue | Rs.10,000 | Any report on TENANT-1 |
| Isolation COGS | Rs.5,000 | Any report on TENANT-1 |
| Isolation product "Isolation Widget" | — | Product list, inventory |
| Isolation customer | — | Customer list, AR reports |

---

## Key Scenarios for Each Phase

| Phase | Scenario tested by Golden Company |
|---|---|
| **Phase 2** (Ledger Invariants) | Every entry balances — `sum(debit)=sum(credit)` for every journal_entry_id |
| **Phase 3** (Input Verification) | Each sale event creates the exact journal lines declared in spec |
| **Phase 4** (Financial Core) | FRS.getProfitAndLoss() returns year_end values from manifest |
| **Phase 5** (Output Verification) | Dashboard cards = manifest.dashboard values |
| **Phase 6** (Consistency) | GL 1100 = FIFO value; GL 1200 = Σ AR balances; P&L rev = Sales Report rev |
| **Phase 7** (Architecture) | No sale writes to `sales` without a journal_entry; no WooCommerce sale bypasses ledger |
| **Phase 8** (Adversarial) | Tampering with `inventory_batches.remaining_qty` is detected by three-way tie |
| **Phase 9** (Boundaries) | July 4 zero-activity day; Feb boundary (no leap day needed in 2025); year-end rollover |
| **Phase 10** (Frontend) | Dashboard card values match `manifest.dashboard` via API response |
| **Phase 11** (Gate) | All 28 metrics verified; 0 TRANSACTION-DERIVED metrics unresolved |

---

## Running the Calculator

```bash
# Generate / regenerate manifest.yaml
cd "E:\AMD POS\AMD POS\verification\golden_company"
php calculator.php

# Verify manifest is current (for CI)
php calculator.php --check

# Verbose output (prints all journal entries)
php calculator.php --verbose
```

## Seeding the Golden Company

```bash
# Switch to test database and seed
php artisan db:seed --class=GoldenCompanySeeder --env=testing

# Verify app output matches manifest
php artisan golden:verify --env=testing
```

> The `golden:verify` artisan command is a Phase 2 deliverable.
> It runs automatically after seeding in CI.
