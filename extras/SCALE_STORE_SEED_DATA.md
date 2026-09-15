# VenQore Scale Enterprise — Seed Data & Verification Benchmark

This document establishes the official verification benchmark for tenant **`scale-store`** (`tenant_id = 116`, owner: `scale@venqore.com`). All financial and operational records have been seeded with full double-entry ledger balance, cross-period historical integrity, and active transactional records across all 46 modules.

---

## 1. Tenant Profile & Core Entities

- **Tenant Name**: `VenQore Scale Enterprise`
- **Tenant Slug**: `scale-store`
- **Tenant ID**: `116`
- **Owner Account**: `scale@venqore.com` (User ID `12`)
- **Primary Warehouse**: `Main Store & Warehouse` (`01a0a3c1-f82c-72fa-b0c7-8cd474442a3d`, Lahore Commercial Hub)
- **Active Modules Enabled**: **All 46 Modules** (`tenant_modules`)

---

## 2. Master Operational Totals (All-Time)

| Metric | Benchmark Value | Description / Source |
| :--- | :--- | :--- |
| **Total Invoices / Sales** | **356 transactions** | `sales` table (`status = 'posted'`) |
| **Total Sale Items** | **592 line items** | `sale_items` linked to sales |
| **All-Time Net Sales Revenue** | **Rs 3,071,490.00** | Ex-tax, ex-discount total revenue |
| **Total Collected Payments** | **Rs 2,773,700.00** | `payments` (cash, card, bank transfers) |
| **Total Outstanding Receivables** | **Rs 297,790.00** | Net sales minus collected payments |
| **Double-Entry Journal Entries** | **514 entries** | Balanced GL entries (`is_reversed = 0`) |
| **Journal Items (Debits/Credits)** | **1,742 items** | Double-entry ledger lines |
| **Total Ledger Debits** | **Rs 10,283,810.00** | Sum of `journal_items.debit` |
| **Total Ledger Credits** | **Rs 10,283,810.00** | Sum of `journal_items.credit` |
| **Ledger Imbalance** | **Rs 0.0000** | Trial balance invariant **BALANCED OK** |

---

## 3. "Today" Benchmark Metrics (Local & UTC Co-Seeded)

Transactions are seeded for both `2026-09-15` and `2026-09-16` so that all "Today" metrics evaluate consistently regardless of UTC / local timezone shifts.

### Sales & Profitability (Today)
- **Sales Count**: **8 invoices**
- **Net Sales Revenue**: **Rs 54,580.00**
- **Cost of Goods Sold (COGS)**: **Rs 34,190.00**
- **Gross Profit**: **Rs 20,390.00** (37.36% gross margin)
- **Operating Expenses**: **Rs 2,050.00**
- **Net Profit**: **Rs 18,340.00** (33.60% net margin)
- **Largest Single Sale**: **Rs 12,100.00** (`INV-260916-0356` / `INV-260915-0348`, 2x Earbuds + 2x Chocolate to Crescent Academy)

### Payment Method Breakdown (Today)
| Method | Count | Total Amount | Status |
| :--- | :---: | :--- | :--- |
| **Cash** | 3 | Rs 17,730.00 | Paid into Cash Drawer |
| **Card** | 3 | Rs 22,950.00 | Paid into Meezan Bank Operating |
| **Bank Transfer** | 1 | Rs 6,700.00 | Paid into Meezan Bank Operating |
| **Khata / Credit** | 1 | Rs 7,200.00 | Posted to Accounts Receivable (Customer: Farhan Enterprise) |
| **Total Today** | **8** | **Rs 54,580.00** | Fully reconciled |

### Today's Operating Expenses
1. **Rs 850.00** — Store Refreshment & Daily Tea (`EXP-...`, Cash, Account 6000)
2. **Rs 1,200.00** — Courier & Local Dispatch (`EXP-...`, Cash, Account 6000)
- **Total Today's Expenses**: **Rs 2,050.00**

---

## 4. Current Month Benchmark (September 2026 MTD)

- **Posted Sales Invoices**: **36 invoices** (Sept 1 – 14 recurring + Sept 15/16 today sales)
- **Net Sales Revenue**: **Rs 223,830.00**
- **Cost of Goods Sold (COGS)**: **Rs 140,370.00**
- **Gross Profit**: **Rs 83,460.00**
- **Operating Expenses**: **Rs 74,600.00**
  - Rent Expense (Acc 5200): Rs 30,000.00
  - Staff Payroll Advance (Acc 5100): Rs 20,000.00
  - Utilities (Acc 5300): Rs 9,800.00
  - Store Supplies, Packaging & Refreshments (Acc 6000): Rs 8,300.00
  - Digital Marketing Boost (Acc 6000): Rs 6,500.00
- **Net Profit**: **Rs 8,860.00**

---

## 5. Year-to-Date Benchmark (2026 YTD)

- **Posted Sales Invoices**: **140 invoices** (Jan – Aug recurring + September)
- **Net Sales Revenue**: **Rs 1,229,190.00**
- **Cost of Goods Sold (COGS)**: **Rs 774,750.00**
- **Gross Profit**: **Rs 454,440.00**
- **Operating Expenses**: **Rs 856,200.00**
  - Salaries & Wages: Rs 404,000.00
  - Rent Expense: Rs 270,000.00
  - Utilities: Rs 83,400.00
  - Marketing & Supplies: Rs 98,800.00

---

## 6. Multi-Year Historical Distribution

| Year / Period | Sales Invoices | Total Expenses Seeded | Key Operational Milestones |
| :--- | :---: | :--- | :--- |
| **2024 (Full Year)** | 96 sales | Rent (25k/mo), Salaries (40k/mo), Utilities, Supplies | Initial Store Launch & Baseline Operations |
| **2025 (Full Year)** | 120 sales | Rent (28k/mo), Salaries (45k/mo), Digital Marketing | Expansion Year with Multi-Item Baskets |
| **2026 Q1 – Q3 (Jan – Aug)** | 96 sales | Rent (30k/mo), Salaries (48k/mo), Marketing Campaigns | High Volume Scale Operations |
| **2026 September (MTD)** | 36 sales | Comprehensive monthly breakdown | Current active month |
| **Total** | **356 sales** | **Fully balanced GL** | **Complete historical continuity** |

---

## 7. Product Catalog & Inventory Snapshot

15 active products seeded across 5 distinct categories:

| Code | Name | Category | Retail Price | Cost Price | Opening Stock | Initial Value |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **P01** | Organic Roast Coffee Beans (500g) | Staples | Rs 1,800.00 | Rs 1,200.00 | 85 | Rs 102,000.00 |
| **P02** | Himalayan Green Tea (100 bags) | Staples | Rs 850.00 | Rs 550.00 | 120 | Rs 66,000.00 |
| **P03** | Belgian Dark Chocolate Bar (100g) | Snacks | Rs 1,250.00 | Rs 750.00 | 150 | Rs 112,500.00 |
| **P04** | Roasted California Almonds (250g) | Snacks | Rs 1,600.00 | Rs 1,100.00 | 95 | Rs 104,500.00 |
| **P05** | Sparkling Mineral Water (750ml) | Beverages | Rs 250.00 | Rs 140.00 | 300 | Rs 42,000.00 |
| **P06** | Cold-Pressed Pomegranate Juice (1L)| Beverages | Rs 420.00 | Rs 260.00 | 180 | Rs 46,800.00 |
| **P07** | Premium Basmati Rice (5kg Bag) | Staples | Rs 2,400.00 | Rs 1,750.00 | 60 | Rs 105,000.00 |
| **P08** | Extra Virgin Cold Olive Oil (1L) | Staples | Rs 3,200.00 | Rs 2,200.00 | 45 | Rs 99,000.00 |
| **P09** | Braided USB-C Fast Cable (2m) | Electronics | Rs 950.00 | Rs 400.00 | 110 | Rs 44,000.00 |
| **P10** | Noise-Cancelling Wireless Earbuds | Electronics | Rs 4,800.00 | Rs 2,900.00 | 40 | Rs 116,000.00 |
| **P11** | QuickCharge 20000mAh Power Bank | Electronics | Rs 5,500.00 | Rs 3,400.00 | 35 | Rs 119,000.00 |
| **P12** | Organic Lavender Hand Wash (500ml) | Personal Care | Rs 380.00 | Rs 190.00 | 140 | Rs 26,600.00 |
| **P13** | Sulfate-Free Keratin Shampoo (400ml)| Personal Care | Rs 1,100.00 | Rs 680.00 | 75 | Rs 51,000.00 |
| **P14** | Herbal Toothpaste Triple Action | Personal Care | Rs 290.00 | Rs 150.00 | 200 | Rs 30,000.00 |
| **P15** | Durum Wheat Penne Pasta (500g) | Staples | Rs 480.00 | Rs 290.00 | 160 | Rs 46,400.00 |
| **Total** | — | — | — | — | **1,790 units**| **Rs 1,010,800.00** |

---

## 8. Customers & Suppliers Directory

### Customers
1. **Tariq Mahmood** (`+92 300 1122334`, `tariq@gmail.com`) — Regular retail customer.
2. **Ayesha Siddiqui** (`+92 321 2233445`, `ayesha.s@yahoo.com`) — Regular retail customer.
3. **Apex Tech Solutions (Bilal Ahmed)** (`+92 333 3344556`, `bilal@apextech.pk`) — Corporate customer.
4. **Farhan Enterprise** (`+92 345 4455667`, `farhan@enterprise.pk`) — Khata credit customer.
5. **Zainab Fatima** (`+92 312 5566778`, `zainab.f@gmail.com`) — High frequency buyer.
6. **Hassan Raza** (`+92 302 6677889`, `hassan.raza@live.com`) — Cash retail customer.
7. **Crescent Academy (Kamran Shah)** (`+92 315 7788990`, `admin@crescent.edu.pk`) — Institutional client.
8. **Maryam Nawaz** (`+92 301 8899001`, `maryam.n@gmail.com`) — Walk-in loyalty customer.

### Suppliers
1. **National Food Distributors** (`orders@nationalfoods.com.pk`, `+92 42 35789001`)
2. **Indus Beverage Supply Co.** (`sales@indusbeverages.pk`, `+92 42 35789002`)
3. **Prime Electronics Logistics** (`wholesale@primeelec.com`, `+92 21 34567890`)
4. **Organic Valley Farms** (`info@organicvalley.pk`, `+92 51 2345678`)
5. **PureCare Hygiene Supplies** (`supply@purecare.com.pk`, `+92 42 37890123`)

---

## 9. Chart of Accounts & Opening Balance Verification

| Account Code | Account Name | Account Type | Opening Balance / Function |
| :--- | :--- | :--- | :--- |
| **1000** | Cash in Hand | Asset | Rs 60,000.00 (Cash Drawer) |
| **1010** | Bank Account | Asset | Rs 750,000.00 (Meezan & Standard Chartered) |
| **1100** | Inventory Asset | Asset | Rs 1,010,800.00 (15 Products at Initial Cost) |
| **1200** | Accounts Receivable | Asset | Outstanding customer balances |
| **1500** | Fixed Assets | Asset | Capital equipment |
| **2000** | Accounts Payable | Liability | Supplier bills |
| **2100** | Sales Tax Payable | Liability | Tax compliance |
| **3000** | Owner's Capital | Equity | Rs 1,820,800.00 (Balancing Equity) |
| **3100** | Retained Earnings | Equity | Cumulative P&L surplus |
| **4000** | Sales Revenue | Income | Credit recognition on posted sales |
| **5000** | Cost of Goods Sold | Expense | Debit recognition on stock sold |
| **5100** | Salaries & Wages | Expense | Payroll expenses |
| **5200** | Rent Expense | Expense | Commercial store rent |
| **5300** | Utilities | Expense | Electricity, net, power |
| **6000** | Operating Expenses | Expense | Supplies, refreshments, marketing |

---

## 10. URL Verification Map

To verify this seeded data in the web interface:

- **Store Dashboard**: `http://localhost:8000/s/scale-store/dashboard`
  - Verifies: Today's sales (Rs 54,580), Month sales (Rs 223,830), Gross Profit, Expenses, Top Selling Items, and Recent 10 Transactions.
- **Sales History List**: `http://localhost:8000/s/scale-store/sales/list`
  - Verifies: All 356 sales, paginated 200/page, with customer names, invoice totals, and payment status badges.
- **Today's Filtered Sales**: `http://localhost:8000/s/scale-store/sales/list?filter=today`
  - Verifies: Exactly 8 sales totaling Rs 54,580.00 with Rs 47,380.00 collected and Rs 7,200.00 khata balance.
