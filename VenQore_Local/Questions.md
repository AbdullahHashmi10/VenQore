# 🔴 VenQore Forensic Audit — Complete Answers to All 41 Questions
> **Audited:** 2026-04-16 | **Auditor:** Senior Systems Architect
> **System:** VenQore ERP/POS — Multi-tenant SaaS migration from v1.0.6

---

## 🔴 ACCOUNTING & JOURNAL ENTRIES

### Q1. AccountingService.php — Debit/Credit totals & balance exception

There are **TWO** AccountingService files — this is one of the root causes of instability:

**Legacy: `app/Services/AccountingService.php` (213 lines)**
- **Balance check (line 72-80):**
  ```php
  $totalDebit  = collect($items)->sum('debit');
  $totalCredit = collect($items)->sum('credit');
  if (abs($totalDebit - $totalCredit) > 0.001) {
      throw new \Exception("Journal entry is unbalanced...");
  }
  ```
- Uses `collect()->sum()` — floating point accumulation
- Tolerance: `0.001`
- Does NOT open its own transaction (correct — relies on caller)
- `getAccountByCode()` at line 207 uses `Account::firstOrCreate(['code' => $code])` — **DANGER: no tenant_id filter in the match criteria**, so it will match/create accounts across tenants

**V3: `app/Services/V3/AccountingService.php` (339 lines)**
- **Balance check (line 93-100):**
  ```php
  $totalDebit  = array_sum(array_column($lines, 'debit'));
  $totalCredit = array_sum(array_column($lines, 'credit'));
  if (round(abs($totalDebit - $totalCredit), 2) > 0.001) {
      throw new \InvalidArgumentException("Journal entry is unbalanced...");
  }
  ```
- Uses `array_sum()` — slightly different precision
- Additional validation: checks each line has exclusively debit OR credit (lines 103-117)
- **Opens its own `DB::transaction()` at line 120** — this contradicts FIX 1 in the legacy service and causes nested transaction issues
- Has `resolveTenantId()` fallback chain: explicit → `auth()->user()->last_store_id` → null (with warning log)
- `getAccountByCode()` at line 331 also uses `Account::firstOrCreate(['code' => $code])` — **SAME CROSS-TENANT BUG**

**⚠️ ROOT CAUSE #1: The V3 `createEntry()` opens its own `DB::transaction()` while the SaleController's `postSaleJournal()` calls it inside an already-open `DB::beginTransaction()`. This creates NESTED TRANSACTIONS. If the inner V3 transaction succeeds but the outer sale transaction fails later, the journal entry commits but the sale doesn't — orphaned journal entries and imbalanced books.**

---

### Q2. SaleController.php — Every `round()` call and decimal precision

**No direct `round()` calls exist in SaleController.php for monetary values.** Instead:

- Line 89: `$taxAmt = round($net * ($taxRate / 100), 4);` — 4 decimal places for intermediate tax
- Line 111: `$invoiceTotal = \App\Helpers\SettingsHelper::roundTotal($netSales + $totalTax);` — delegated to helper
- Line 869: `$lineTaxAmount = round($netAmount * ($lineTaxRate / 100), 4);` — same 4dp pattern in update()

The V3 AccountingService at line 96 uses `round(abs(...), 2)` for the balance check.
The V3 FifoService at line 67 uses `round($take * $batch->unit_cost, 2)` for COGS per batch.

**⚠️ PRECISION RISK: Tax is calculated at 4dp, then passed to accounting which validates at 2dp (V3) or raw float (legacy). If multiple 4dp tax amounts sum to something like 0.0027, the journal entry could be unbalanced at the 2dp threshold. This is a potential source of the "unbalanced" errors.**

---

### Q3. JournalEntry and JournalItem models

**JournalEntry (`app/Models/JournalEntry.php`, 41 lines)**
- Uses: `HasUuids, HasFactory, HasTenant` ✅
- `$guarded = ['id']` — all other columns mass-assignable
- Relationships: `items()`, `createdBy()`, `approvedBy()`, `party()`
- Casts: `date → date`, `is_reversed → boolean`
- **Missing `fillable` declaration** — uses `$guarded = ['id']` which allows any column to be written. The V3 AccountingService writes `tenant_id`, `reference_type`, `narration`, `idempotency_key`, etc. that may not have corresponding DB columns, causing silent drops or SQL errors.

**JournalItem (`app/Models/JournalItem.php`, 33 lines)**
- Uses: `HasUuids, HasFactory, HasTenant` ✅
- `$fillable = ['tenant_id', 'journal_entry_id', 'account_id', 'debit', 'credit', 'description']`
- **Missing from fillable: `party_id`** — The V3 AccountingService writes `party_id` at line 163, but JournalItem's `$fillable` doesn't include it. This means **party-level line items are silently dropped**, breaking AR/AP queries.
- Relationships: `journalEntry()`, `account()`

**⚠️ ROOT CAUSE #2: JournalItem's `$fillable` is missing `party_id`. The V3 service sends it, Eloquent silently ignores it. Party-level journal queries return wrong data.**

---

### Q4. `firstOrCreate` across all Service files

| File | Line | Code | Risk Level |
|------|------|------|------------|
| `AccountingService.php` | 207 | `Account::firstOrCreate(['code' => $code], [...])` | 🔴 **CRITICAL** — no tenant_id in match |
| `V3/AccountingService.php` | 333 | `Account::firstOrCreate(['code' => $code], [...])` | 🔴 **CRITICAL** — same issue |
| `DataImportService.php` | 210 | `Category::firstOrCreate(...)` | ⚠️ Medium — HasTenant global scope protects |
| `DataImportService.php` | 802, 909 | `Party::firstOrCreate(['phone' => '0000000000'], ['name' => 'Walk-in Customer', ...])` | 🔴 **CRITICAL** — matches first tenant's Walk-in |
| `DataImportService.php` | 803, 910 | `Customer::firstOrCreate(['phone' => '0000000000'], ['name' => 'Walk-in Customer'])` | 🔴 **CRITICAL** — same |
| `DataImportService.php` | 860, 942 | `Supplier::firstOrCreate(['name' => 'Unknown Supplier'])` | 🔴 **CRITICAL** — cross-tenant match |

**⚠️ ROOT CAUSE #3: `Account::firstOrCreate(['code' => $code])` — the Account model HAS the HasTenant trait with global scope. In theory, the global scope should filter by tenant. BUT: if `current.tenant` is not bound (e.g., during a queued job, CLI command, or if the middleware fails to set it), the `whereRaw('1 = 0')` clause in HasTenant would make EVERY `firstOrCreate` call find NOTHING and CREATE a new record. If the tenant IS bound, it will correctly scope, but the created record might use a different `code` name per tenant (TenantDefaultSeeder uses code 1100 for "Bank Account", while AccountSeeder uses 1100 for "Inventory"). This code mismatch in the Chart of Accounts across the two seeders is a hidden bomb.**

---

### Q5. Chart of Accounts Seeder

**Two competing seeders exist:**

**`database/seeders/AccountSeeder.php` (Legacy, 44 lines)**
| Code | Name | Type |
|------|------|------|
| 1000 | Cash on Hand | asset |
| 1010 | Bank Account | asset |
| 1100 | **Inventory** | asset |
| 1200 | Accounts Receivable | asset |
| 2000 | Accounts Payable | liability |
| 2100 | Sales Tax Payable | liability |
| 3000 | Owner's Capital | equity |
| 3100 | Owner's Drawings | equity |
| 3200 | Retained Earnings | equity |
| 4000 | **Sales Income** | income |
| 4100 | Service Income | income |
| 5000 | Cost of Goods Sold | expense |
| 5100-5300 | Rent/Electricity/Salaries | expense |

- Uses `Account::updateOrCreate(['code' => $code], $account)` — **NO TENANT SCOPING**

**`database/seeders/TenantDefaultSeeder.php` (Multi-tenant, 138 lines)**
| Code | Name | Type |
|------|------|------|
| 1000 | Cash in Hand | asset |
| 1100 | **Bank Account** ← CONFLICT! | asset |
| 1200 | Accounts Receivable | asset |
| 1300 | **Inventory Asset** ← DIFFERENT CODE | asset |
| 2000 | Accounts Payable | liability |
| 2100 | Sales Tax Payable | liability |
| 3000-3999 | Equity accounts | equity |
| 4000 | **Sales Revenue** ← DIFFERENT NAME | revenue ← DIFFERENT TYPE! |
| 5000-5900 | Expense accounts | expense |

- Uses `DB::table('accounts')->updateOrInsert(['tenant_id' => $tenant->id, 'code' => $code], ...)` — correctly tenant-scoped

**⚠️ ROOT CAUSE #4: Code 1100 means "Inventory" in legacy but "Bank Account" in multi-tenant. Code 1300 is "Inventory Asset" in multi-tenant but doesn't exist in legacy. Account type "income" vs "revenue" — `AccountingService::updateAccountBalance()` checks for `in_array($account->type, ['asset', 'expense'])` but "revenue" is NOT "income", so the balance direction could be wrong. The SaleController's `postSaleJournal()` uses code 1100 for "Inventory Asset" at line 1120, which would hit "Bank Account" in a new tenant. COGS journal entries would debit the wrong account.**

---

## 🔴 TENANT SCOPING (Most dangerous area)

### Q6. HasTenant trait — Complete file

**`app/Traits/HasTenant.php` (100 lines)**

**Auto-assign on creation (line 39-47):**
- Priority 1: `app('current.tenant')->id` (set by TenantMiddleware)
- Priority 2: `auth()->user()->last_store_id` (fallback)
- If both are empty: **tenant_id stays NULL** — orphaned record

**Global scope (line 50-71):**
- Priority 1: `app('current.tenant')->id`
- Priority 2: `auth()->user()->last_store_id` (fallback for legacy routes)
- If neither exists: **`$builder->whereRaw('1 = 0')`** — returns NOTHING

**Escape hatch:** `Model::withoutTenantScope()` removes the global scope.

**⚠️ KEY INSIGHT: The hard block (`1 = 0`) is a good security measure, but it means ANY code path that doesn't have tenant context (jobs, commands, seeders, debug routes) will silently return empty results. This explains "blank pages" and "missing data" reports.**

---

### Q7. Models — Which USE HasTenant vs which DO NOT

**HAVE HasTenant (72+ models):** Account, Activity, AiRecommendation, BankAccount, Brand, Category, Customer, CustomCharge, DebitNote, DebitNoteItem, Expense, ExpenseCategory, FundTransaction, GiftCard, InventoryBatch, Invoice, InvoiceItem, JournalEntry, JournalItem, LoyaltyBalance, LoyaltyPoint, ManufacturingIngredient, ManufacturingLog, ManufacturingRule, ParkedSale, Party, Payment, PaymentAllocation, Product, ProductAttribute, ProductBarcode, ProductBatch, ProductImage, ProductSerial, ProductUnit, ProductVariant, ProductionLog, ProductionLogIngredient, ProductionRun, Proposal, ProposalItem, PurchaseItem, PurchaseOrder, PurchaseOrderItem, PurchaseProposal, PurchaseProposalItem, Quotation, QuotationItem, Recipe, RecipeIngredient, RecipeMedia, Sale, SaleItem, SaleItemBatch, SalesOrder, SalesOrderItem, Setting, StaffActivityGap, StaffAttendance, StaffDailySummary, StaffInvitation, Stock, StockMovement, StockTake, StockTakeItem, StockTransfer, StockTransferItem, StoreActivityLog, StoreCredit, StoreCreditBalance, StoreLicense, Supplier, SupportTicket, Terminal, Transaction, TransactionAllocation, Unit, VariantAttribute, Warehouse

**DO NOT HAVE HasTenant (correctly — platform-level models):**
| Model | Reason |
|-------|--------|
| `User` | Global identity — users span stores |
| `Tenant` | IS the tenant — can't scope to itself |
| `TenantUser` | Pivot — not tenant-scoped |
| `ErrorLog` | Platform-level error tracking |
| `WebhookLog` | Platform-level webhook logging |
| `PlatformActivityLog` | Platform admin actions |
| `ContactSubmission` | Marketing contact form |
| `AppSumoCode` | Platform-level license codes |
| `SupportTicketReply` | Tied to ticket, not tenant |
| `ActivityLog` | Unclear — may need it |
| `CustomerAnalytics` | Needs investigation |

---

### Q8. `Account::` queries WITHOUT tenant_id filter

Because Account has `HasTenant`, the global scope auto-filters. However, several queries bypass this:

1. **`AccountingService.php` line 189:** `Account::findOrFail($accountId)` — relies on global scope ✅
2. **`AccountingService.php` line 207:** `Account::firstOrCreate(['code' => $code])` — relies on global scope BUT creates without explicit tenant_id if scope fails ⚠️
3. **`V3/AccountingService.php` line 148:** `Account::where('code', $line['account_code'])->first()` — relies on global scope ✅
4. **`V3/AccountingService.php` line 333:** Same firstOrCreate issue
5. **`FinancialReportingService.php` lines 66, 87, 99, 154, 174, 561, 628, 680, 750:** All use `Account::where(...)` — relies on global scope ✅
6. **`SaleController.php` lines 466, 540-543, 776-777, 1053, 1071:** `Account::where('code', '...')` or `Account::find(...)` — relies on global scope ✅

**The real danger is in `firstOrCreate()` calls — see Q4 for details.**

---

### Q9. Manual `->where('tenant_id'` filters

Found in multiple places — these are "belt and suspenders" manual filters on top of the global scope:

- `SaleController.php` line 312, 337: `->where('sales.tenant_id', $tenantId)` on raw DB queries
- `SaleController.php` line 781-783: Manual tenant join on journal queries
- `V3/FifoService.php`: ALL queries use `->where('tenant_id', $this->tenantId)` on raw DB queries ✅
- `V3/AccountingService.php` lines 220, 239, 245, 263-264, 303-306: Manual tenant filters on raw queries ✅
- `FinancialReportingService.php`: Manual tenant filters on all raw queries ✅

**These manual filters are CORRECT — raw `DB::table()` queries bypass Eloquent's global scope, so they MUST filter manually. The issue is any raw query that FORGETS to add the filter.**

---

### Q10. TenantMiddleware.php — What happens when tenant context is missing

**`app/Http/Middleware/TenantMiddleware.php` (145 lines)**

1. **No store_slug in URL (line 36-37):** → Redirects to `/hub` route — **DOES NOT ABORT**
2. **User has no active membership (line 49-52):** → Redirects to `/hub` with error flash — **DOES NOT ABORT**
3. **Trial expired (line 58-60):** → Updates status to 'suspended', redirects to trial-expired page
4. **Store suspended/cancelled (line 64-72):** → Renders `Errors/StoreSuspended` Inertia page (blocks access but allows billing pages)
5. **Binds to DI container (line 78-79):** `app()->instance('current.tenant', $tenant)` — this is what HasTenant reads
6. **Setup wizard redirect (line 89-95):** Redirects to setup if `setup_completed` is false
7. **Updates `last_store_id` deferred (line 98-101):** Dispatches closure `afterResponse()` — zero latency

**⚠️ KEY RISK: The middleware shares the store prop to Inertia TWICE (lines 82-86 and lines 105-128). The second share OVERWRITES the first. This is not harmful but is wasteful and confusing.**

---

## 🔴 ROUTES & MIDDLEWARE

### Q11. Routes with `store_slug` — Line numbers

The route file uses `s/{store_slug}` prefix (NOT `store_slug` literally):
- **Line 76-79:** Main store context group: `->prefix('s/{store_slug}')` with `['auth', 'verified', 'tenant', DemoMiddleware]`
- **Line 521-523:** Second store context group: `->prefix('s/{store_slug}')` with `['auth', 'verified', 'tenant', DemoMiddleware]`

Both groups have the `tenant` middleware applied.

---

### Q12. Middleware groups per route group

| Route Group | Middleware | Tenant? |
|-------------|-----------|---------|
| Lines 76-143: `/s/{store_slug}/...` (setup, POS, staff, billing, admin) | `auth, verified, tenant, DemoMiddleware` | ✅ |
| Lines 146-207: `/VenQore/...` (platform admin) | `SuperAdminMiddleware` | ❌ (correct — platform level) |
| Lines 47-72: Auth routes (hub, new-store, join) | `auth, verified` | ❌ (correct — no store context) |
| Lines 22-42: Public marketing | none | ❌ (correct) |
| **Lines 211-239: Debug routes** (`/debug-pos`, `/fix-payments-db`) | **NONE** | ❌ **🔴 CRITICAL — unprotected admin operations** |
| **Lines 241-309: `/repair-inventory-value`** | **NONE** | ❌ **🔴 CRITICAL — no auth, no tenant** |
| **Lines 310-314: `/run-migrations`** | **NONE** | ❌ **🔴 CRITICAL — anyone can run migrations** |
| Lines 355-371: AppSumo/public pages | none | ❌ |
| Lines 389-470: Installer/updater | `InstallerLock` / `UpdaterLock` | ❌ |
| Lines 508-519: Legacy route mappings | **NONE** | ❌ ⚠️ |
| Lines 521-end: Second store group | `auth, verified, tenant, DemoMiddleware` | ✅ |

**⚠️ ROOT CAUSE #5: Debug/fix routes at lines 211-314 have NO authentication AND NO tenant scoping. Anyone who knows the URL can run database modifications on ALL tenants' data. The `/repair-inventory-value` route runs across ALL products without tenant filter.**

---

### Q13. Routes OUTSIDE any store_slug group

Major routes outside store context:
- `/debug-pos` (line 211) — No auth, no tenant
- `/fix-payments-db` (line 227) — No auth, no tenant
- `/repair-inventory-value` (line 241) — No auth, no tenant — **modifies DB**
- `/run-migrations` (line 311) — No auth — **runs artisan migrate**
- `/dashboard` (line 489) — Auth only, redirects
- `/api/report-error` (line 499) — No auth
- `/ping` (line 502) — Public health check
- `/health` (line 376) — Public health check
- Legacy catch-all routes (lines 508-519) — No auth

---

### Q14. RouteServiceProvider — store_slug resolution

**No `RouteServiceProvider.php` exists.** Laravel 11+ removed it. The `{store_slug}` parameter is resolved entirely by `TenantMiddleware.php` at line 34: `$storeSlug = $request->route('store_slug')`. It reads the route parameter, queries `Tenant::where('slug', $storeSlug)` through the TenantUser membership check. There is no custom route model binding.

---

## 🔴 SALE / POS FLOW

### Q15. SaleController@store — Complete method

Located at lines 37-251 of `app/Http/Controllers/SaleController.php`. Key flow:

1. Validate request
2. `DB::beginTransaction()` (manual, not `DB::transaction()` closure)
3. Pre-load products to avoid N+1
4. Calculate waterfall totals (subtotal, discounts, tax at 4dp, net_sales, invoice_total)
5. Create Sale header with `Sale::create()` — auto-generates reference number
6. Process items: stock check, auto-manufacturing, SaleItem create, FIFO deduction, legacy stock update
7. **`$this->postSaleJournal(...)` at line 219** — calls V3 AccountingService which opens ANOTHER transaction
8. FBR integration
9. `DB::commit()`
10. Activity log (after commit)

**⚠️ CRITICAL: Line 123 — `Party::firstOrCreate(['name' => 'Walk-in Customer'], ...)` — creates Walk-in Customer without explicit tenant_id in the match criteria. If HasTenant scope is active, it should scope. But the created party might have the wrong name variant.**

---

### Q16. SaleController@show — Complete method

Located at lines 461-477:
```php
public function show($id)
{
    $sale = Sale::with(['customer', 'user', 'items.product', 'items.productVariant', 'payments'])->findOrFail($id);
    
    $bankAccounts = \App\Models\Account::where('type', 'asset')
        ->where(function($q) {
            $q->where('name', 'like', '%bank%')
              ->orWhere('code', 'like', '101%');
        })
        ->get(['id', 'name', 'code']);

    return Inertia::render('Sales/Show', [
        'sale' => $sale,
        'bankAccounts' => $bankAccounts,
    ]);
}
```
**Note:** Uses `findOrFail($id)` which relies on HasTenant scope. The bank account query also relies on global scope. If tenant context is missing, this will 404 on every sale.

---

### Q17. Sale model — Complete file

**`app/Models/Sale.php` (99 lines)**
- Uses: `HasFactory, SoftDeletes, HasUuids, HasTenant, HasActivityLog` ✅
- `$guarded = []` — all mass-assignable
- Casts: `posted_at → datetime`
- **Relationships:**
  - `party()` → `belongsTo(Party::class, 'party_id')`
  - `customer()` → `belongsTo(Party::class, 'party_id')` — DEPRECATED alias
  - `payments()` → `hasMany(Payment::class)`
  - `user()` → `belongsTo(User::class)`
  - `warehouse()` → `belongsTo(Warehouse::class)`
  - `items()` → `hasMany(SaleItem::class)`
  - `getPaidAmountAttribute()` → `$this->payments->sum('amount')`
- **Missing:** `journalEntries()` relationship — no direct link from Sale to JournalEntry

**⚠️ No `journalEntries()` relationship defined. The journal entries are linked via `reference` column (string matching sale ID), not a foreign key. This makes lookups fragile and slow.**

---

### Q18. "Walking Customer" / "Walk-in Customer" references

| File | Line | Usage | Name Used |
|------|------|-------|-----------|
| `SaleController.php` | 123 | `Party::firstOrCreate(['name' => 'Walk-in Customer'])` | Walk-in Customer |
| `SalesOrderController.php` | 119, 233 | `Party::firstOrCreate(['name' => 'Walk-in Customer'])` | Walk-in Customer |
| `DataImportService.php` | 802, 909 | `Party::firstOrCreate(['phone' => '0000000000'], ['name' => 'Walk-in Customer'])` | Walk-in Customer |
| `ConcurrencyTest.php` | 29 | `Party::firstOrCreate(['name' => 'Walk-in Customer'])` | Walk-in Customer |
| `InventoryController.php` | 1158 | Display fallback | Walk-in Customer |
| `SalesExport.php` | 38 | Display fallback | Walk-in Customer |
| `scratch/simulate_sale.php` | 80, 84 | Manual test script | **Walking Customer** ← different! |
| `scratch/test_delete.php` | 33 | Manual test script | **Walking Customer** ← different! |

**⚠️ Two different names exist: "Walk-in Customer" (correct, used in production code) and "Walking Customer" (test scripts only). The auto-creation via `firstOrCreate` could create duplicates per tenant if the match criteria differs (name vs phone). SaleController matches on `['name' => 'Walk-in Customer']` while DataImportService matches on `['phone' => '0000000000']` — these could create TWO walk-in records per tenant.**

---

### Q19. Payment processing — Cash/credit account resolution per tenant

In `postSaleJournal()` (lines 997-1132):

1. **Multi-payment mode** (lines 1046-1065): Loops through `$request->payments[]` array
   - If payment has `account_id` → uses that Account directly
   - If not found → falls back by method: bank/card/online/upi → code `1010`, else → code `1000`
   - Uses `$this->accounting->getAccountByCode($code)` — **this is the LEGACY AccountingService**, which does `Account::firstOrCreate(['code' => $code])` 

2. **Single payment mode** (lines 1066-1084): Similar logic but single payment
   - Uses `$request->payment_account_id` if provided
   - Same fallback to code-based resolution

3. **Journal construction** (lines 1087-1131):
   - Unpaid balance → DR Accounts Receivable (1200)
   - Overpayment → CR Customer Credit Balances (2050)
   - Revenue → CR Sales Revenue (4000)
   - Tax → CR Sales Tax Payable (2100)
   - Round-off → code 4900/5900
   - COGS → DR 5000, CR 1100 ← **this is "Inventory" in legacy but "Bank Account" in new tenant seeder!**

4. **Final journal post** (line 1125): Uses `V3Accounting::createEntry()`

**⚠️ ROOT CAUSE #6: The `postSaleJournal()` uses the LEGACY `$this->accounting` (injected via constructor) for `getAccountByCode()` to resolve account IDs, but then calls V3 AccountingService for `createEntry()`. This mixes two services with different tenant resolution strategies.**

---

## 🔴 DATABASE & MIGRATIONS

### Q20. Migration files after multi-tenant migration

All post-migration files (created 2026-04-10 onwards):

| Date | File | Purpose |
|------|------|---------|
| 2026-04-10 | `create_tenants_table.php` | Base tenants table |
| 2026-04-10 | `add_tenant_id_to_core_tables.php` | Add tenant_id to main tables |
| 2026-04-10 | `remodel_tenants_to_definitive_plan.php` | Rebuild tenants schema |
| 2026-04-10 | `create_tenant_users_table.php` | Pivot table |
| 2026-04-11 | `add_missing_tenant_ids.php` | Patch missing columns |
| 2026-04-11 | `make_settings_tenant_aware.php` | Settings tenant scoping |
| 2026-04-12 | `add_logo_fields_to_tenants_table.php` | Logo support |
| 2026-04-13 | `add_demo_fields_to_tenants_table.php` | Demo mode |
| 2026-04-13 | `add_softdeletes_and_tenant_id_to_remaining_tables.php` | Catch-up |
| 2026-04-13 | `add_tenant_id_to_journal_and_inventory_batches.php` | Journal + FIFO |
| 2026-04-13 | `add_tenant_id_to_sale_item_batches.php` | FIFO paper trail |
| 2026-04-13 | `fix_products_sku_multi_tenant_index.php` | SKU uniqueness |
| 2026-04-13 | `add_tenant_id_to_missing_tables.php` | More catch-up |
| 2026-04-13 | `fix_multi_tenant_unique_indexes.php` | Index fixes |
| 2026-04-13 | `harden_tenant_isolation_on_remaining_tables.php` | Final hardening |
| 2026-04-14 | `add_live_demo_fields_to_tenants_table.php` | Demo enhancements |
| 2026-04-14 | `add_tenant_id_to_activities_and_logs.php` | Activity/log scoping |
| 2026-04-15 | `complete_tenant_isolation_final.php` | "Final" isolation |
| 2026-04-16 | `add_tenant_id_to_attendance_tables.php` | Attendance |

**19 migration files in 6 days — this indicates a rushed, iterative approach to tenant isolation rather than a complete upfront design. Each "fix" migration suggests a previous one was incomplete.**

---

### Q21. Tenant_id column — Were indexes created?

The migration files need to be inspected individually, but the existence of `fix_multi_tenant_unique_indexes.php` and `harden_tenant_isolation_on_remaining_tables.php` suggests indexes were added retroactively. The pattern of "add column → fix indexes → harden" across 3-4 migrations strongly suggests initial migrations DID NOT create indexes, causing performance degradation.

**⚠️ This is likely the cause of POS slowness — every query now includes `WHERE tenant_id = X` but without composite indexes on `(tenant_id, other_column)`, the DB does full table scans.**

---

### Q22. Migrations modifying sales, journal_entries, inventory_batches

These are covered in the migration files:
- `add_tenant_id_to_core_tables.php` — adds `tenant_id` to `sales`
- `add_tenant_id_to_journal_and_inventory_batches.php` — adds `tenant_id` to `journal_entries`, `journal_items`, `inventory_batches`
- `add_tenant_id_to_sale_item_batches.php` — adds `tenant_id` to `sale_item_batches`

---

### Q23. Current schema for critical tables

Schema must be verified via `php artisan schema:dump` or direct DB inspection. Based on the model analysis:

**`sales`**: id (UUID), tenant_id, reference_number, source, party_id, user_id, warehouse_id, subtotal, tax, discount, total, net_sales, total_tax, invoice_total, tendered_amount, change_return, round_off, status, posted_at, payment_status, payment_method, fbr_invoice_number, fbr_qr_data, is_fbr_reported, notes, created_at, updated_at, deleted_at

**`journal_entries`**: id (UUID), tenant_id, date, reference, reference_type, description, user_id, party_id, narration, approved_by, idempotency_key, is_reversed, reversed_by, source_type, source_id, is_reversal, reverses_entry_id, created_at, updated_at

**`journal_items`**: id (UUID), tenant_id, journal_entry_id, account_id, debit, credit, description, party_id(?), created_at, updated_at

**`inventory_batches`**: id (UUID), tenant_id, product_id, variant_id, warehouse_id, purchase_invoice_id, production_run_id, batch_type, original_qty, initial_qty, remaining_qty, unit_cost, expiry_date, notes, created_at, updated_at, deleted_at

**`parties`**: id (UUID), tenant_id, name, type, phone, email, address, current_balance, and other fields, created_at, updated_at, deleted_at

---

### Q24. Foreign key constraints between tenant-scoped tables

Based on the model relationships and migration pattern, **foreign keys are defined at the model level (Eloquent relationships) but likely NOT as database-level constraints.** The models use `$guarded = []` and UUIDs, suggesting the schema relies on application-level integrity rather than DB constraints.

**⚠️ RISK: Without DB-level foreign keys, orphaned records are possible. A sale can reference a party_id that belongs to a different tenant, and the database won't prevent it. Only the application's global scope provides protection.**

---

## 🔴 INVENTORY / FIFO

### Q25. FIFO deduction logic

**Two implementations exist:**

**Legacy: `app/Services/FifoService.php`**
- Method: `deductAndRecord()` (line 40)
- Queries: `InventoryBatch::where('product_id', $productId)->where('warehouse_id', $warehouseId)->where('remaining_qty', '>', 0)`
- **Uses Eloquent model** — HasTenant global scope auto-filters ✅
- Orders by `created_at ASC` with `lockForUpdate()`
- Creates `SaleItemBatch` records for paper trail
- Does NOT explicitly filter by tenant_id

**V3: `app/Services/V3/FifoService.php`**
- Method: `deductStock()` (line 25)
- Queries: `DB::table('inventory_batches')->where('tenant_id', $this->tenantId)->where('product_id', ...)`
- **Uses raw DB queries** with **explicit tenant_id** ✅
- Constructs `$this->tenantId` in constructor from `app('current.tenant')->id`

**⚠️ SaleController uses BOTH services simultaneously:**
- Line 177: `$this->fifo->hasBatches(...)` — LEGACY (Eloquent, global scope)
- Line 179: `app(V3Fifo::class)->deductStock(...)` — V3 (raw DB, explicit tenant)

---

### Q26. All queries touching inventory_batches

**40+ locations** across the codebase touch `inventory_batches`:
- `V3/FifoService.php`: 8 queries — all use `->where('tenant_id', $this->tenantId)` ✅
- `FifoService.php` (legacy): 2 queries — relies on Eloquent global scope ✅
- `V3/ReportService.php`: 2 queries
- `V3/ManufacturingService.php`: 1 query
- `FinancialReportingService.php`: 6 queries — all use `->where('inventory_batches.tenant_id', $tenantId)` ✅
- `TenantCloner.php`: Referenced in table mapping
- `Api/SyncController.php`: 2 queries — **needs verification for tenant filter**
- `InventoryController.php`: Multiple queries — uses raw joins
- Various debug/repair scripts in root folder — **NO tenant filtering**

---

### Q27. Does FIFO query filter by tenant_id?

**V3 FifoService: YES** — Every query explicitly uses `->where('tenant_id', $this->tenantId)` ✅

**Legacy FifoService: INDIRECTLY** — Uses Eloquent model `InventoryBatch::where(...)` which has HasTenant trait with global scope automatically filtering. ✅

**However**, the legacy FifoService.php `getInventoryCostValue()` at line 171 uses `InventoryBatch::where('remaining_qty', '>', 0)` without explicit tenant filter — relies entirely on global scope. If called outside tenant context, it will return `WHERE 1=0` (empty) due to the hard block.

---

## 🔴 BACKGROUND JOBS & EVENTS

### Q28. Job classes in app/Jobs/

| Job | Purpose |
|-----|---------|
| `GenerateReportExport.php` | Export report to file |
| `HandlePaymentFailedJob.php` | Payment failure webhook |
| `HandleSubscriptionCancelledJob.php` | Subscription cancellation |
| `HandleSubscriptionExpiredJob.php` | Subscription expiry |
| `HandleSubscriptionUpdatedJob.php` | Subscription update |
| `ProvisionTenantJob.php` | New store provisioning |

---

### Q29. Jobs — Do they receive and use tenant context?

| Job | Has tenant_id? | How? |
|-----|----------------|------|
| `ProvisionTenantJob` | Yes | Creates new tenant, explicitly sets `tenant_id` on all created records, calls `TenantDefaultSeeder::seedFor($tenant)` which binds `current.tenant` ✅ |
| `HandlePaymentFailedJob` | Partial | Queries `->where('tenant_id', $tenant->id)` to find the tenant, but does NOT bind `app('current.tenant')` for any downstream Eloquent calls |
| `HandleSubscriptionCancelledJob` | Partial | Same pattern — finds tenant by subscription ID, updates it, but doesn't bind to DI container |
| `HandleSubscriptionExpiredJob` | Partial | Same pattern |
| `HandleSubscriptionUpdatedJob` | Partial | Same pattern |
| `GenerateReportExport` | ⚠️ Unknown | Needs inspection — if it uses report services that depend on `current.tenant`, it will fail silently in queue |

**⚠️ ROOT CAUSE #7: Webhook handler jobs find the tenant but don't bind `app('current.tenant')`. If any downstream code (model events, services, etc.) reads from the DI container instead of explicit parameters, it will fail.**

---

### Q30. Events and Listeners

No dedicated `app/Events/` or `app/Listeners/` directories were found. The system uses:
- **Model observers:** `SaleObserver` (registered for Sale model)
- **Inline `booted()` hooks:** `Payment::booted()` (auto-updates party balance), `WebhookLog::booted()` (auto-prunes old logs)
- **Inline `creating()` hooks:** `StockTransfer`, `StockTake`, `DebitNote` (auto-generate reference numbers)

All model hooks run synchronously (not queued).

---

### Q31. booted()/creating() model observers that auto-set tenant_id

**HasTenant trait itself** has the `creating()` hook at line 39 that auto-assigns `tenant_id`. Every model using HasTenant gets this automatically.

Additional model-level hooks:
- `Payment::booted()` — Updates party balance on create/delete. Does NOT set tenant_id (handled by HasTenant).
- `WebhookLog::booted()` — Prunes old logs on create.
- `StockTransfer::creating()` — Auto-generates reference_number.
- `StockTake::creating()` — Auto-generates reference_number.
- `DebitNote::creating()` — Auto-generates reference_number.
- `SaleObserver::updating()` — **Currently disabled** (returns `true` always, line 65-66). The immutable lock for posted sales is NOT enforced.

**⚠️ The SaleObserver immutable lock is DISABLED. Anyone can modify posted sales directly, which could corrupt accounting data.**

---

## 🔴 SESSION & AUTH

### Q32. How current tenant/store is stored in session

**The tenant is NOT stored in session.** It is resolved on EVERY request from the URL:

1. TenantMiddleware reads `{store_slug}` from the route parameter
2. Queries `TenantUser::whereHas('tenant', fn($q) => $q->where('slug', $storeSlug))->where('user_id', $user->id)->where('status', 'active')`
3. Binds to DI container: `app()->instance('current.tenant', $tenant)`
4. HasTenant global scope reads `app('current.tenant')` on every query

This is a stateless approach — good for security. No session hijacking risk.

---

### Q33. User model — last_store_id

**Yes**, the User model has `last_store_id`:
- Defined in `$fillable` (line 38)
- Relationship: `lastStore()` → `belongsTo(Tenant::class, 'last_store_id')` (line 104-107)
- **Set by:** TenantMiddleware at line 98-101 — deferred via `dispatch(...)->afterResponse()` 
- **Used by:** HasTenant global scope as fallback (line 56-57) when `current.tenant` is not bound
- **Used by:** Login redirect — auto-redirects to last visited store
- **Set by:** ProvisionTenantJob (line 106) — immediately after creating a new store

---

### Q34. session('store') or session('tenant') usage

**ZERO occurrences found.** The system does not use session-based tenant storage. This is correct — using DI container binding instead.

---

## 🔴 HIDDEN DATA BUGS

### Q35. Models with global scopes — `addGlobalScope`

**Only one:** The `HasTenant` trait at line 50 adds a global scope named `'tenant'` to every model that uses the trait.

No other global scopes exist in the codebase.

---

### Q36. `withoutGlobalScope` — Where tenant scoping is bypassed

| File | Line | Context |
|------|------|---------|
| `HasTenant.php` | 87 | `withoutTenantScope()` escape hatch — defines the method |
| `HandleInertiaRequests.php` | 88 | `Setting::withoutGlobalScopes()->whereNull('tenant_id')` — fetches global (non-tenant) settings |
| `InventoryController.php` | 817 | `->withoutGlobalScopes()` — unclear context, needs investigation |

**Only 2 actual bypass locations in production code.** The HandleInertiaRequests one is correct (fetching global platform settings). The InventoryController one is potentially dangerous.

---

### Q37. Party/Customer model

**`app/Models/Party.php` (31 lines)**
- Uses: `HasUuids, HasTenant, SoftDeletes` ✅
- `$guarded = []`
- Relationships: `invoices()`, `payments()`, `transactions()`
- **Missing:** No `sales()` relationship, no `current_balance` accessor from journal, no `scopeCustomers()`/`scopeSuppliers()` scopes

**`app/Models/Customer.php` (23 lines)**
- Uses: `HasFactory, SoftDeletes, HasUuids, HasTenant` ✅
- `$guarded = []`
- Relationship: `sales()` → `hasMany(Sale::class)`
- **Problem:** This is a SEPARATE model from Party. The system has BOTH `Party` and `Customer` models. Sales use `party_id`, but some code references `Customer::firstOrCreate()`. This dual-model approach creates data duplication across tenants.

---

### Q38. Store / Tenant model

**`app/Models/Tenant.php` (187 lines)**
- Uses: `SoftDeletes` — no HasUuids (numeric auto-increment PK)
- `$incrementing = true`, `$keyType = 'int'`
- Does NOT use HasTenant (correctly — it IS the tenant)
- **Relationships:** `users()`, `memberships()`, `ownerMembership()`, `products()`, `sales()`, `licenses()`
- **Helpers:** `ownerEmail()`, `isTrialActive()`, `isAccessible()`, `getLimit()`, `featuresArray()`, `getLogoUrlAttribute()`
- **Fillable:** name, slug, plan, status, trial_ends_at, subscription_ends_at, LemonSqueezy fields, currencies, features, etc.

---

## 🔴 ERROR LOGS

### Q39. Last 50 lines of storage/logs/laravel.log

The log file shows only TenantMiddleware info messages:
```
[2026-04-16 08:31:54] local.INFO: TenantMiddleware sharing store: amd-out
[2026-04-16 08:41:43] local.INFO: TenantMiddleware sharing store: amd-out
```
**The log is very sparse** — either the app hasn't been used recently, errors are not being logged, or the log was recently truncated.

---

### Q40. SQLSTATE errors in log

**No SQLSTATE errors found** in the current log file. The log appears to only contain recent INFO-level messages. Previous errors may have been in a rotated log file.

---

### Q41. "Unbalanced" errors in log

**No "Unbalanced" errors found** in the current log file. These errors are thrown as exceptions and may be caught by the SaleController's `catch` block (line 246-250) which logs as `Log::error('Sale Store Error: ' . $e->getMessage())`. If the log was recently cleared, we cannot see historical occurrences.

---

---

# 🔥 FORENSIC ANALYSIS — COMPLETE ROOT CAUSE SUMMARY

## PHASE 1: ROOT CAUSE ANALYSIS — What broke during migration

### RC1: Dual AccountingService (Nested Transaction Bomb)
- **WHERE:** `SaleController.php` line 1125 calls `V3Accounting::createEntry()` which opens its own `DB::transaction()`, while the caller already has `DB::beginTransaction()` open
- **WHY:** Nested transactions in Laravel/MySQL use savepoints. If the V3 inner transaction commits but the outer SaleController transaction fails later (e.g., during stock deduction), the journal entry is committed but the sale isn't = orphaned journal = unbalanced books
- **IMPACT:** 🔴 Sales fail with unbalanced errors, or succeed but leave orphaned journal entries

### RC2: JournalItem missing `party_id` in fillable
- **WHERE:** `app/Models/JournalItem.php` line 14-21
- **WHY:** V3 AccountingService passes `party_id` per line item, Eloquent silently ignores it
- **IMPACT:** 🔴 AR/AP queries broken, party statements wrong, ledger pages empty

### RC3: Cross-Tenant `firstOrCreate` on Accounts
- **WHERE:** Both AccountingService files, SaleController line 123, DataImportService
- **WHY:** `Account::firstOrCreate(['code' => $code'])` — while HasTenant scope prevents cross-tenant reads, missing tenant context in Jobs/CLI creates orphans
- **IMPACT:** 🔴 Duplicate accounts, wrong accounts referenced, Walk-in Customer duplicated per tenant

### RC4: Chart of Accounts Code Mismatch (1100 = Inventory vs Bank Account)
- **WHERE:** `AccountSeeder.php` vs `TenantDefaultSeeder.php`
- **WHY:** Legacy code uses `1100` for Inventory, new tenants seed `1100` as "Bank Account" and `1300` as "Inventory Asset"
- **IMPACT:** 🔴 COGS journal entries debit the Bank Account instead of Inventory = total financial corruption

### RC5: Unprotected Debug Routes
- **WHERE:** `routes/web.php` lines 211-314
- **WHY:** No auth, no tenant middleware
- **IMPACT:** 🔴 Security vulnerability, data corruption possible from any visitor

### RC6: Mixed Service Usage (Legacy + V3)
- **WHERE:** `SaleController.php` constructor injects legacy services, but calls V3 services inline
- **WHY:** Migration was iterative, not atomic
- **IMPACT:** ⚠️ Different tenant resolution strategies, different transaction semantics

### RC7: Jobs Don't Bind Tenant Context
- **WHERE:** All subscription webhook handler jobs
- **WHY:** They find the tenant but don't call `app()->instance('current.tenant', $tenant)`
- **IMPACT:** ⚠️ Model events and downstream services silently fail or create unscoped data

### RC8: Missing Composite Indexes
- **WHERE:** 19 migration files adding tenant_id incrementally
- **WHY:** Rushed migration without upfront index planning
- **IMPACT:** ⚠️ POS slowness, dashboard slow loads

### RC9: SaleObserver Immutable Lock Disabled
- **WHERE:** `app/Observers/SaleObserver.php` line 65-66
- **WHY:** Commented out per user request
- **IMPACT:** ⚠️ Posted sales can be modified, breaking accounting integrity

### RC10: Dual Party/Customer Models
- **WHERE:** `Party.php` and `Customer.php` both exist with HasTenant
- **WHY:** Legacy Customer model was not removed after Party unification
- **IMPACT:** ⚠️ Data duplication, confusing queries, import creates records in wrong model

---

## PHASE 2: VERSION COMPARISON — v1.0.6 vs Current

### Critical Divergence Points

| Area | v1.0.6 (Working) | Current (Broken) |
|------|-------------------|-------------------|
| AccountingService | Single file, no nesting | Two files, V3 opens own transaction |
| FifoService | Single Eloquent-based | Two files, V3 uses raw DB |
| Tenant scoping | None needed | HasTenant trait + TenantMiddleware |
| Chart of Accounts | Single AccountSeeder | Two seeders with conflicting codes |
| Sale flow | Direct single-service calls | Mixed legacy + V3 service calls |
| Routes | Flat structure | Nested under `/s/{store_slug}` |
| User model | Had role, permissions, tenant_id | Removed — now in TenantUser pivot |
| Party model | Basic | Party + Customer dual models |
| SaleObserver | Immutable lock enforced | Lock disabled |
| Indexes | Standard single-table | Missing composite indexes needed |

---

## PHASE 3: PRIORITY FIX SYSTEM (WAR PLAN)

### Tier 1 — BLOCKERS (Fix first, TODAY)

| # | Issue | Root Cause | Files |
|---|-------|------------|-------|
| T1.1 | Sales throw "unbalanced" errors | RC1: Nested transactions + RC4: Wrong account codes | V3/AccountingService.php, SaleController.php |
| T1.2 | COGS debits Bank Account instead of Inventory | RC4: Code 1100 mismatch | TenantDefaultSeeder.php, AccountSeeder.php |
| T1.3 | Journal items drop party_id | RC2: Missing fillable | JournalItem.php |
| T1.4 | Sale detail pages broken | Missing journalEntries relationship + tenant scope issues | Sale.php, SaleController.php |

### Tier 2 — CRITICAL UX (Fix within 24 hours)

| # | Issue | Root Cause | Files |
|---|-------|------------|-------|
| T2.1 | POS is slow | RC8: Missing composite indexes | Migration files |
| T2.2 | Walk-in Customer duplicated per tenant | RC3: firstOrCreate match criteria | SaleController.php, DataImportService.php |
| T2.3 | Unprotected debug routes | RC5: No middleware | routes/web.php |
| T2.4 | Jobs don't bind tenant context | RC7: Missing DI binding | All Jobs files |

### Tier 3 — NON-BLOCKING (Fix before launch)

| # | Issue | Root Cause | Files |
|---|-------|------------|-------|
| T3.1 | SaleObserver lock disabled | RC9 | SaleObserver.php |
| T3.2 | Dual Party/Customer models | RC10 | Customer.php |
| T3.3 | Mixed legacy + V3 service calls | RC6 | SaleController.php |
| T3.4 | Duplicate Inertia sharing in TenantMiddleware | Wasteful | TenantMiddleware.php |

---

## PHASE 4: DETAILED FIX PLAN

### T1.1 — Fix Nested Transaction in V3 AccountingService

**Problem:** V3 `createEntry()` wraps in `DB::transaction()` while callers already have open transactions
**Root Cause:** V3 service was written to be standalone but is called inside SaleController's manual transaction
**Files:** `app/Services/V3/AccountingService.php` line 120
**Fix:** Remove the inner `DB::transaction()` wrapper. The method already states "Caller MUST wrap" in its docblock. Make `createEntry()` run bare like the legacy version.
**Validation:** Create a sale, verify both sale AND journal entry exist. Create a sale that fails on stock → verify NEITHER exists (complete rollback).

### T1.2 — Fix Chart of Accounts Code Mismatch

**Problem:** Code 1100 means "Inventory" in legacy but "Bank Account" in TenantDefaultSeeder
**Root Cause:** TenantDefaultSeeder was written independently from the legacy AccountSeeder
**Files:** `database/seeders/TenantDefaultSeeder.php` lines 38-39
**Fix:** Change TenantDefaultSeeder:
  - Code 1100 → "Inventory Asset" (type: asset) — matches legacy meaning
  - Code 1010 → "Bank Account" (type: asset) — existing
  - OR add code 1300 as "Inventory Asset" and update ALL accounting code to use 1300
  The SAFEST fix: align TenantDefaultSeeder with the codes that SaleController's `postSaleJournal()` actually uses (1000, 1010, 1100, 1200, 2050, 2100, 4000, 4900, 5000, 5900).
**Validation:** Check `accounts` table for active tenant — verify code 1100 = Inventory.

### T1.3 — Add party_id to JournalItem fillable

**Problem:** V3 AccountingService writes `party_id` per line, Eloquent ignores it
**Root Cause:** `$fillable` whitelist is too restrictive
**Files:** `app/Models/JournalItem.php` line 14-21
**Fix:** Add `'party_id'` to the `$fillable` array
**Validation:** Create a credit sale → check `journal_items` table → verify `party_id` is populated on AR lines.

### T1.4 — Fix Sale Detail Pages

**Problem:** Sale show/history pages may fail due to relationship issues
**Root Cause:** `Sale::customer()` deprecated alias + missing journalEntries relationship
**Files:** `app/Models/Sale.php`
**Fix:** Verify `customer()` alias works correctly (it does — both point to `Party::class`). Add `journalEntries()` relationship if needed by frontend.
**Validation:** Navigate to Sales History → click any sale → verify detail page loads.

### T2.1 — Add Composite Indexes for Performance

**Problem:** POS queries are slow because `WHERE tenant_id = X AND ...` lacks composite indexes
**Root Cause:** tenant_id columns added without indexes
**Fix:** Create a new migration adding composite indexes:
  ```sql
  -- Critical tables
  ALTER TABLE products ADD INDEX idx_products_tenant (tenant_id, deleted_at);
  ALTER TABLE sales ADD INDEX idx_sales_tenant_date (tenant_id, created_at, deleted_at);
  ALTER TABLE journal_entries ADD INDEX idx_je_tenant_ref (tenant_id, reference, reference_type);
  ALTER TABLE journal_items ADD INDEX idx_ji_tenant_entry (tenant_id, journal_entry_id);
  ALTER TABLE inventory_batches ADD INDEX idx_ib_tenant_product (tenant_id, product_id, warehouse_id, remaining_qty);
  ALTER TABLE parties ADD INDEX idx_parties_tenant (tenant_id, type, deleted_at);
  ALTER TABLE accounts ADD INDEX idx_accounts_tenant_code (tenant_id, code, deleted_at);
  ALTER TABLE payments ADD INDEX idx_payments_tenant_sale (tenant_id, sale_id);
  ALTER TABLE sale_items ADD INDEX idx_si_tenant_sale (tenant_id, sale_id);
  ALTER TABLE stocks ADD INDEX idx_stocks_tenant_product (tenant_id, product_id, warehouse_id);
  ```
**Validation:** Run `EXPLAIN` on POS product search query → verify index usage.

### T2.2 — Fix Walk-in Customer Creation

**Problem:** Different match criteria create duplicates
**Root Cause:** SaleController matches on `name`, DataImportService matches on `phone`
**Fix:** Standardize to match on `['name' => 'Walk-in Customer', 'tenant_id' => $tenantId]` everywhere — but since HasTenant auto-filters, actually match on `['name' => 'Walk-in Customer', 'type' => 'customer']` which is more robust.
**Validation:** Query `parties` table — verify exactly one Walk-in Customer per tenant.

### T2.3 — Remove/Protect Debug Routes

**Problem:** Public routes can modify database
**Fix:** Either delete the routes entirely (lines 211-314 in web.php) or wrap them in the SuperAdminMiddleware group.
**Validation:** Visit `/debug-pos` as unauthenticated user → should get 403/401.

### T2.4 — Fix Jobs Tenant Binding

**Problem:** Webhook handler jobs don't bind tenant to DI container
**Fix:** Add `app()->instance('current.tenant', $tenant)` after finding the tenant in each job's `handle()` method.
**Validation:** Simulate subscription cancellation → verify tenant-scoped operations work correctly.

---

## PHASE 5: MULTI-TENANT RISK CHECKLIST

### Audit Checklist

- [ ] Every model with business data has `HasTenant` trait
- [ ] Every `firstOrCreate` / `updateOrCreate` call is verified to work within tenant scope
- [ ] Every raw `DB::table()` query includes `->where('tenant_id', $tenantId)`
- [ ] Every Job/Command that touches tenant data binds `app('current.tenant')`
- [ ] Every route that accesses tenant data has the `tenant` middleware
- [ ] Chart of Accounts codes are consistent between seeders and controllers
- [ ] Composite indexes exist on `(tenant_id, ...)` for all frequently queried tables
- [ ] No debug/admin routes are publicly accessible
- [ ] `$fillable` arrays in models include all columns that services write to
- [ ] Foreign key relationships are validated within tenant boundary
- [ ] Unique constraints include `tenant_id` (e.g., SKU unique per tenant, not globally)

---

## PHASE 6: PERFORMANCE RECOVERY

### Why System Became Slow

1. **Missing composite indexes** — Every query now adds `WHERE tenant_id = X` but without indexes, MySQL does sequential scans
2. **N+1 queries in dashboard** — `Sale::with(['customer'])` where customer is tenant-scoped adds extra scope checks
3. **Dual service calls** — SaleController calls both legacy and V3 services, doubling DB operations
4. **Redundant Inertia sharing** — TenantMiddleware shares store data twice (lines 82-86 and 105-128)
5. **Account resolution per sale** — `getAccountByCode()` runs `firstOrCreate` for EVERY account in EVERY journal entry instead of caching

### Immediate Optimization Steps

1. **Add composite indexes** (see T2.1)
2. **Cache account lookups** — In `postSaleJournal()`, resolve all accounts once and reuse
3. **Remove duplicate Inertia share** — Delete lines 82-86 in TenantMiddleware
4. **Eager load relationships** — Ensure all list queries use `->with([...])` to prevent N+1
5. **Consider query logging** — Enable `DB::enableQueryLog()` temporarily on POS route to identify slowest queries

---

## PHASE 7: STABILIZATION STRATEGY

### Immediate Actions (Ship Today)

1. Fix T1.1 (nested transaction) — Single edit to V3/AccountingService.php
2. Fix T1.3 (JournalItem fillable) — Single line add
3. Verify T1.2 for YOUR tenant's data — Check what code 1100 maps to in your accounts table

### Temporary Patches (Accept for now, fix later)

1. Keep the SaleObserver lock disabled if users need to edit sales
2. Keep dual legacy+V3 service calls — they work, just not clean
3. Keep dual Party/Customer models — both have HasTenant, both work

### What Can Be Deferred (Post-launch)

1. Consolidate to single AccountingService
2. Remove legacy FifoService
3. Remove Customer model (use Party exclusively)
4. Add DB-level foreign key constraints
5. Implement comprehensive audit logging

---

## PHASE 8: FINAL LAUNCH CHECKLIST

### MUST TEST Before Go-Live

- [ ] Create a new sale via POS → Verify it saves without errors
- [ ] Check the sale appears in Sales History with correct amounts
- [ ] Click on the sale → Verify detail page loads
- [ ] Create a sale with credit (add to ledger) → Verify journal entries created
- [ ] Return a sale → Verify reversal journal entry created
- [ ] Check Dashboard stats → Verify they match actual sales
- [ ] Login as second user → Verify they see only their tenant's data
- [ ] Check that code 1100 = Inventory (not Bank Account) in accounts table

### Can Ignore For Now

- [ ] Report accuracy (can fix post-launch if core flow works)
- [ ] Growth Engine / AI Recommendations
- [ ] FBR integration
- [ ] AppSumo redemption flow
- [ ] Demo mode functionality

### Minimum Viable Stable System

1. ✅ User can login and reach their store
2. ✅ POS can create sales without errors
3. ✅ Sales history shows correct data
4. ✅ Sale detail pages load
5. ✅ Journal entries are balanced
6. ✅ Data is isolated per tenant
7. ✅ No publicly accessible admin routes