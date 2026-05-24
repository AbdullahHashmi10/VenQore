# VenQore — Backend Security & Architecture Fix Plan
**Triggered by:** Deep-dive audit revealing four critical backend vulnerabilities  
**Status:** These are not UI problems. These are data integrity and security problems at the database level.  
**Priority:** Fix all four before accepting any paying customer. A single sale processed through the broken SaleService creates orphaned financial data that cannot be recovered.

---

## The Four Wounds — Plain English First

Before the technical plan, understand what each wound actually means for a paying customer:

| Wound | What actually happens to a customer |
|---|---|
| **Wound 1 — Split-brain controllers** | A customer's sale might go through the old 73KB controller instead of the V3 service. The old controller does not enforce tenant scoping. Their data may be written without a tenant_id. |
| **Wound 2 — Missing tenant_id in services** | SaleService and AccountingService use raw DB::table() instead of Eloquent. The HasTenant trait never fires. Sales and journal entries are inserted with no tenant_id — orphaned from day one. |
| **Wound 3 — Background jobs run globally** | The Growth Engine mixes ALL tenants' data together when generating AI recommendations. CleanOrphanJournalEntries runs without a tenant context in CLI mode — it could delete another tenant's entries. |
| **Wound 4 — Hard cascades on financial data** | An owner deletes an old product → all historical sale_items for that product are physically wiped from the database forever. An accountant deletes a supplier → all journal entries linked to them are gone. The audit trail is destroyed. |

---

## Fix Order

```
Fix Wound 4 FIRST  — stop the data destruction before it happens to a real customer
Fix Wound 2 SECOND — stop orphaned financial records from being created
Fix Wound 3 THIRD  — stop cross-tenant data mixing in background jobs
Fix Wound 1 LAST   — consolidate controllers after the data layer is safe
```

Reason for this order: Wounds 4 and 2 are silent and destructive. They corrupt data that cannot be recovered. Wounds 1 and 3 are also serious but do not cause immediate irreversible damage.

---

## WOUND 4 — Hard Cascade Deletes on Financial Data (Fix First)

### What is wrong

Your migrations use `cascadeOnDelete()` on financial tables. This means:

- Delete a Product → all `sale_items` referencing it are **physically deleted**
- Delete a Party (supplier/customer) → all `journal_entries` referencing them are **physically deleted**
- Delete an Account from the chart of accounts → all `journal_items` referencing it are **physically deleted**

In a retail ERP, historical financial records are legally and operationally required to be permanent. You cannot undo a hard delete. Once a business has been running for 6 months and an owner accidentally deletes a product, their entire sales history for that product is gone.

### The Rule

> **In an ERP system, no financial record is ever hard-deleted. It is soft-deleted (marked as deleted_at) or archived. The underlying data is never removed from the database.**

### Fix A — Change cascade rules in migrations

Create a new migration that alters the foreign key constraints:

```php
// database/migrations/YYYY_MM_DD_fix_erp_cascade_rules.php

public function up(): void
{
    // ── Products ──────────────────────────────────────────────────────────
    // sale_items: if product is deleted, RESTRICT — block deletion, don't cascade
    Schema::table('sale_items', function (Blueprint $table) {
        $table->dropForeign(['product_id']);
        $table->foreign('product_id')
              ->references('id')->on('products')
              ->onDelete('restrict'); // ← BLOCK deletion if sale_items exist
    });

    Schema::table('purchase_items', function (Blueprint $table) {
        $table->dropForeign(['product_id']);
        $table->foreign('product_id')
              ->references('id')->on('products')
              ->onDelete('restrict');
    });

    Schema::table('stock_movements', function (Blueprint $table) {
        $table->dropForeign(['product_id']);
        $table->foreign('product_id')
              ->references('id')->on('products')
              ->onDelete('restrict');
    });

    // ── Parties (customers/suppliers) ─────────────────────────────────────
    Schema::table('journal_entries', function (Blueprint $table) {
        $table->dropForeignIfExists(['party_id']);
        // party_id should be nullable set-null, not cascade
        $table->foreign('party_id')
              ->references('id')->on('parties')
              ->onDelete('set null');
    });

    Schema::table('invoices', function (Blueprint $table) {
        $table->dropForeign(['party_id']);
        $table->foreign('party_id')
              ->references('id')->on('parties')
              ->onDelete('restrict');
    });

    // ── Chart of Accounts ─────────────────────────────────────────────────
    Schema::table('journal_items', function (Blueprint $table) {
        $table->dropForeign(['account_id']);
        $table->foreign('account_id')
              ->references('id')->on('accounts')
              ->onDelete('restrict');
    });
}
```

### Fix B — Add SoftDeletes to all financial models

```php
// Add to every model that touches financial data:
// Product, Party, Account, Category, Warehouse

use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasTenant, SoftDeletes; // ← add SoftDeletes

    // deleted_at column must exist in the migration
    // Add if missing: $table->softDeletes();
}

// Same for: Party, Account, Category, Warehouse, SaleItem (archive, never delete)
```

### Fix C — Guard against deletion in controllers/observers

```php
// app/Observers/ProductObserver.php

class ProductObserver
{
    public function deleting(Product $product): void
    {
        // Block deletion if product has ANY financial history
        $hasSales     = SaleItem::withoutGlobalScope('tenant')
                            ->where('product_id', $product->id)->exists();
        $hasPurchases = PurchaseItem::withoutGlobalScope('tenant')
                            ->where('product_id', $product->id)->exists();

        if ($hasSales || $hasPurchases) {
            throw new \Exception(
                "Cannot delete '{$product->name}' — it has financial history. " .
                "Archive it instead by setting it as inactive."
            );
        }
    }
}

// Register in AppServiceProvider::boot():
Product::observe(ProductObserver::class);
Party::observe(PartyObserver::class);    // same pattern
Account::observe(AccountObserver::class); // same pattern
```

### Fix D — Add "archive" instead of delete for products

```php
// Instead of deleting, products get marked inactive
// Add to products table if not present:
// $table->boolean('is_active')->default(true);

// ProductController::destroy():
public function destroy(Product $product): RedirectResponse
{
    $hasSales = SaleItem::where('product_id', $product->id)->exists();

    if ($hasSales) {
        // Archive instead of delete
        $product->update(['is_active' => false]);
        return back()->with('info',
            "'{$product->name}' has been archived. " .
            "It will no longer appear in the POS but its history is preserved."
        );
    }

    // Only hard-delete if truly no history
    $product->delete(); // soft delete via SoftDeletes trait
    return back()->with('success', "Product deleted.");
}
```

### Verification checklist for Wound 4

```
□ Migration created and run: all cascade rules changed to restrict/set-null
□ SoftDeletes added to: Product, Party, Account, Category, Warehouse
□ deleted_at column exists on each of those tables
□ ProductObserver registered and blocks deletion when sale_items exist
□ PartyObserver registered and blocks deletion when invoices/journals exist
□ AccountObserver registered and blocks deletion when journal_items exist
□ Test: create a product, make a sale, try to delete the product → blocked with clear message
□ Test: create a party, create a journal entry for them, try to delete party → blocked
□ Test: delete an account with no history → succeeds (soft delete)
□ Test: verify soft-deleted items do not appear in lists but history is preserved
```

---

## WOUND 2 — Missing tenant_id in SaleService and AccountingService (Fix Second)

### What is wrong

`SaleService.php` and `AccountingService.php` use `DB::table()` for their inserts. The `HasTenant` global scope is an **Eloquent** feature — it fires on Model events. Raw `DB::table()` calls bypass it completely.

This means every sale created through these services is inserted with `tenant_id = null`. Every journal entry is inserted with `tenant_id = null`.

When a store owner logs in and their sales appear on the dashboard, it looks fine — because the queries probably have a `where tenant_id =` filter somewhere. But the database has nulls. A report that does a `SUM()` without filtering tenant_id will sum ALL tenants' data. A background job that runs without HTTP context will see all records.

### Fix A — Inject tenant_id explicitly in SaleService

```php
// app/Services/V3/SaleService.php

public function post(array $data): array
{
    // Get current tenant — this must exist or we abort
    $tenant = app('current.tenant');

    if (!$tenant) {
        throw new \RuntimeException(
            'SaleService::post() called without tenant context. ' .
            'This is a critical error — no sale can be created without a tenant.'
        );
    }

    $tenantId = $tenant->id;

    return DB::transaction(function () use ($data, $tenantId) {

        // ── Insert the sale ───────────────────────────────────────────────
        $saleId = DB::table('sales')->insertGetId([
            'tenant_id'    => $tenantId,  // ← ALWAYS explicit
            'user_id'      => $data['user_id'],
            'party_id'     => $data['party_id'] ?? null,
            'warehouse_id' => $data['warehouse_id'],
            'total'        => $data['total'],
            'discount'     => $data['discount'] ?? 0,
            'paid'         => $data['paid'],
            'payment_type' => $data['payment_type'],
            'notes'        => $data['notes'] ?? null,
            'created_at'   => now(),
            'updated_at'   => now(),
        ]);

        // ── Insert sale items ─────────────────────────────────────────────
        foreach ($data['items'] as $item) {
            DB::table('sale_items')->insert([
                'tenant_id'  => $tenantId,  // ← ALWAYS explicit
                'sale_id'    => $saleId,
                'product_id' => $item['product_id'],
                'qty'        => $item['qty'],
                'price'      => $item['price'],
                'cost'       => $item['cost'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // ── Insert sale_item_batches if batch tracking enabled ────────────
        if (!empty($data['batches'])) {
            foreach ($data['batches'] as $batch) {
                DB::table('sale_item_batches')->insert([
                    'tenant_id'   => $tenantId,  // ← ALWAYS explicit
                    'sale_id'     => $saleId,
                    'product_id'  => $batch['product_id'],
                    'batch_id'    => $batch['batch_id'],
                    'qty'         => $batch['qty'],
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]);
            }
        }

        return ['sale_id' => $saleId, 'status' => 'success'];
    });
}
```

### Fix B — Inject tenant_id explicitly in AccountingService

```php
// app/Services/V3/AccountingService.php

public function createEntry(array $data): int
{
    $tenant = app('current.tenant');

    if (!$tenant) {
        throw new \RuntimeException(
            'AccountingService::createEntry() called without tenant context.'
        );
    }

    $tenantId = $tenant->id;

    // Validate that debits equal credits before inserting anything
    $totalDebits  = collect($data['lines'])->where('type', 'debit')->sum('amount');
    $totalCredits = collect($data['lines'])->where('type', 'credit')->sum('amount');

    if (abs($totalDebits - $totalCredits) > 0.01) {
        throw new \InvalidArgumentException(
            "Journal entry is unbalanced. Debits: {$totalDebits}, Credits: {$totalCredits}"
        );
    }

    return DB::transaction(function () use ($data, $tenantId) {

        $entryId = DB::table('journal_entries')->insertGetId([
            'tenant_id'   => $tenantId,  // ← ALWAYS explicit
            'date'        => $data['date'],
            'reference'   => $data['reference'],
            'description' => $data['description'] ?? null,
            'party_id'    => $data['party_id'] ?? null,
            'created_by'  => $data['created_by'],
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        foreach ($data['lines'] as $line) {
            DB::table('journal_items')->insert([
                'tenant_id'         => $tenantId,  // ← ALWAYS explicit
                'journal_entry_id'  => $entryId,
                'account_id'        => $line['account_id'],
                'type'              => $line['type'],
                'amount'            => $line['amount'],
                'created_at'        => now(),
                'updated_at'        => now(),
            ]);
        }

        return $entryId;
    });
}
```

### Fix C — Find and fix every other DB::table insert in services

Run this audit command and fix every result:

```bash
# Find every DB::table()->insert() or insertGetId() call in services
grep -rn "DB::table.*insert\|insertGetId" app/Services/ --include="*.php"

# For every result: check if tenant_id is in the insert array
# If it is not: add it explicitly using app('current.tenant')->id
```

### Fix D — Add a database-level NOT NULL constraint

Once all services are fixed, make `tenant_id` NOT NULL on financial tables so future code cannot accidentally omit it:

```php
// database/migrations/YYYY_MM_DD_enforce_tenant_id_not_null.php
// Run this AFTER verifying zero NULL tenant_id rows exist

public function up(): void
{
    // First verify: SELECT COUNT(*) FROM sales WHERE tenant_id IS NULL;
    // Must return 0 before running this

    Schema::table('sales', function (Blueprint $table) {
        $table->unsignedBigInteger('tenant_id')->nullable(false)->change();
    });

    Schema::table('sale_items', function (Blueprint $table) {
        $table->unsignedBigInteger('tenant_id')->nullable(false)->change();
    });

    Schema::table('journal_entries', function (Blueprint $table) {
        $table->unsignedBigInteger('tenant_id')->nullable(false)->change();
    });

    Schema::table('journal_items', function (Blueprint $table) {
        $table->unsignedBigInteger('tenant_id')->nullable(false)->change();
    });

    // Continue for all financial tables
}
```

### Fix E — Backfill existing orphaned records

Run this to find and fix any already-orphaned records before making the column NOT NULL:

```php
// php artisan tinker — run this before the NOT NULL migration

// Find orphaned records
$tables = ['sales', 'sale_items', 'journal_entries', 'journal_items',
           'purchase_items', 'stock_movements'];

foreach ($tables as $table) {
    $count = DB::table($table)->whereNull('tenant_id')->count();
    echo "{$table}: {$count} orphaned rows\n";
}

// If orphaned rows exist from your father's shop (Tenant 1):
$tenantOneId = Tenant::first()->id; // The AMD Outlets tenant

foreach ($tables as $table) {
    $fixed = DB::table($table)
        ->whereNull('tenant_id')
        ->update(['tenant_id' => $tenantOneId]);
    echo "Fixed {$fixed} rows in {$table}\n";
}
```

### Verification checklist for Wound 2

```
□ grep -rn "DB::table.*insert" app/Services/ — every result has tenant_id in its payload
□ Test: create a sale → SELECT tenant_id FROM sales ORDER BY id DESC LIMIT 1; must not be NULL
□ Test: the sale's journal entries → SELECT tenant_id FROM journal_entries ORDER BY id DESC LIMIT 1; must not be NULL
□ Test: all sale_items have tenant_id set
□ Run the backfill check — zero orphaned rows remain
□ NOT NULL migration run successfully
□ RuntimeException is thrown if service is called without tenant context
```

---

## WOUND 3 — Background Jobs Run Without Tenant Context (Fix Third)

### What is wrong

Two specific problems:

**Problem A — RunGrowthEngine.php** fetches from `DB::table('inventory_batches')` and `DB::table('ai_settings')` with **zero** `where tenant_id =` filters. It is analyzing aggregate data from ALL tenants together and potentially generating recommendations based on mixed multi-tenant data. Store A's inventory patterns are influencing Store B's AI recommendations.

**Problem B — CleanOrphanJournalEntries.php** runs as a CLI cron job. When Laravel runs in CLI mode (via cron or queue workers), there is no HTTP request and no active tenant context. The `HasTenant` global scope still fires — but `app('current.tenant')` returns null, which means the scope's `where(tenant_id, null)` condition may match differently than expected, or the scope silently does nothing.

### Fix A — RunGrowthEngine — Process one tenant at a time

```php
// app/Console/Commands/RunGrowthEngine.php

public function handle(): void
{
    // NEVER process all tenants globally
    // Always loop tenant by tenant, set context for each

    $tenants = Tenant::where('status', 'active')
        ->orWhere('status', 'trial')
        ->get();

    foreach ($tenants as $tenant) {
        try {
            // Explicitly bind this tenant as the current context
            app()->instance('current.tenant', $tenant);

            // Now all DB queries in this scope will be tenant-scoped
            $this->processGrowthEngineForTenant($tenant);

            // Clear the context after each tenant
            app()->forgetInstance('current.tenant');

        } catch (\Exception $e) {
            Log::error("GrowthEngine failed for tenant {$tenant->id}: {$e->getMessage()}");
            app()->forgetInstance('current.tenant');
            // Continue to next tenant — one failure should not stop others
        }
    }
}

private function processGrowthEngineForTenant(Tenant $tenant): void
{
    // All DB::table queries here MUST have where('tenant_id', $tenant->id)
    // Do NOT rely on the global scope — explicitly filter every query

    $inventory = DB::table('inventory_batches')
        ->where('tenant_id', $tenant->id)  // ← EXPLICIT, always
        ->get();

    $aiSettings = DB::table('ai_settings')
        ->where('tenant_id', $tenant->id)  // ← EXPLICIT, always
        ->first();

    // Process recommendations using ONLY this tenant's data
    // Store results with explicit tenant_id
    DB::table('ai_recommendations')->insert([
        'tenant_id'  => $tenant->id,  // ← EXPLICIT
        'data'       => json_encode($this->generateRecommendations($inventory, $aiSettings)),
        'created_at' => now(),
    ]);
}
```

### Fix B — CleanOrphanJournalEntries — Safe tenant-aware cleanup

```php
// app/Console/Commands/CleanOrphanJournalEntries.php

public function handle(): void
{
    // NEVER run a global cleanup without tenant context
    // Process each tenant separately

    Tenant::chunk(50, function ($tenants) {
        foreach ($tenants as $tenant) {
            app()->instance('current.tenant', $tenant);

            try {
                $this->cleanForTenant($tenant);
            } catch (\Exception $e) {
                Log::error("CleanOrphan failed for tenant {$tenant->id}: {$e->getMessage()}");
            } finally {
                app()->forgetInstance('current.tenant');
            }
        }
    });
}

private function cleanForTenant(Tenant $tenant): void
{
    // Orphaned = journal entry with no matching journal_items
    // Use explicit tenant_id filter on EVERY query

    $orphanIds = DB::table('journal_entries as je')
        ->where('je.tenant_id', $tenant->id)  // ← EXPLICIT
        ->whereNotExists(function ($q) use ($tenant) {
            $q->from('journal_items as ji')
              ->whereColumn('ji.journal_entry_id', 'je.id')
              ->where('ji.tenant_id', $tenant->id);  // ← EXPLICIT
        })
        ->pluck('je.id');

    if ($orphanIds->isEmpty()) return;

    // Soft-delete, never hard-delete financial records
    DB::table('journal_entries')
        ->where('tenant_id', $tenant->id)  // ← EXPLICIT safety check
        ->whereIn('id', $orphanIds)
        ->update(['deleted_at' => now()]);

    Log::info("Cleaned {$orphanIds->count()} orphan journal entries for tenant {$tenant->id}");
}
```

### Fix C — The tenant context helper for all background jobs

Create a reusable trait for any job or command that needs to run per-tenant:

```php
// app/Traits/RunsWithTenantContext.php

trait RunsWithTenantContext
{
    /**
     * Execute a callback within a specific tenant's context.
     * Cleans up automatically even if the callback throws.
     */
    protected function withTenant(Tenant $tenant, callable $callback): mixed
    {
        app()->instance('current.tenant', $tenant);

        try {
            return $callback($tenant);
        } finally {
            app()->forgetInstance('current.tenant');
        }
    }

    /**
     * Execute a callback for every active tenant.
     * Failures for one tenant do not stop others.
     */
    protected function forEachTenant(callable $callback): void
    {
        Tenant::where('status', 'active')
            ->orWhere('status', 'trial')
            ->chunk(50, function ($tenants) use ($callback) {
                foreach ($tenants as $tenant) {
                    $this->withTenant($tenant, $callback);
                }
            });
    }
}
```

Usage in any job or command:
```php
class SyncStockToWooCommerce implements ShouldQueue
{
    use RunsWithTenantContext;

    public function __construct(private int $tenantId) {}

    public function handle(): void
    {
        $tenant = Tenant::find($this->tenantId);
        if (!$tenant) return;

        $this->withTenant($tenant, function ($tenant) {
            // All queries here are tenant-scoped
            $products = Product::where('wc_sync_needed', true)->get();
            // HasTenant global scope fires correctly because context is set
        });
    }
}
```

### Fix D — Audit all jobs and commands

Run this and fix every file it returns:

```bash
# Find all commands and jobs
find app/Console/Commands/ app/Jobs/ -name "*.php" -type f

# For each file, check: does it set tenant context before querying?
grep -L "current.tenant\|withTenant\|makeCurrent" app/Console/Commands/*.php app/Jobs/*.php
# Files returned here have NO tenant context — audit each one
```

### Verification checklist for Wound 3

```
□ RunGrowthEngine: processes one tenant at a time, never global
□ RunGrowthEngine: every DB::table query has explicit where('tenant_id', $tenant->id)
□ RunGrowthEngine: AI recommendations stored with correct tenant_id
□ CleanOrphanJournalEntries: loops per tenant, uses explicit tenant_id filters
□ CleanOrphanJournalEntries: uses soft-delete, not hard delete
□ RunsWithTenantContext trait created and available
□ All queue jobs: constructor accepts tenant_id and sets context in handle()
□ Test: create data in Tenant A, run RunGrowthEngine, verify Tenant B's recommendations unchanged
□ Test: run CleanOrphanJournalEntries, verify it only touches the tenant whose ID matches
□ grep -rn "DB::table" app/Console/ — every result has explicit tenant_id filter
```

---

## WOUND 1 — Split-Brain Controllers (Fix Last)

### What is wrong

Two versions of every major controller exist side by side:

| Legacy (broken) | V3 (correct) | Risk |
|---|---|---|
| `SaleController.php` (73 KB) | `V3/SaleController.php` (672 bytes) | Some routes hit the legacy one |
| `InventoryController.php` (50 KB) | V3 version | Legacy bypasses V3 validation |
| `ReportController.php` (78 KB) | V3 version | Legacy may do global queries |
| `PurchaseController.php` (36 KB) | V3 version | Same |

If your routes point to the legacy controllers, the V3 services (now fixed with tenant_id) may not be called at all.

### Fix A — Audit which controller each route actually calls

```bash
# Check which SaleController your routes point to
grep -n "SaleController" routes/web.php routes/api.php

# Check which InventoryController
grep -n "InventoryController" routes/web.php routes/api.php

# If any route points to the non-V3 controller, fix it
```

### Fix B — Route all store endpoints to V3 controllers

In `routes/web.php`, every store route must use the V3 namespace:

```php
// routes/web.php — inside the Zone 3 (s/{store_slug}) group

use App\Http\Controllers\V3\SaleController;
use App\Http\Controllers\V3\InventoryController;
use App\Http\Controllers\V3\ReportController;
use App\Http\Controllers\V3\PurchaseController;
use App\Http\Controllers\V3\PartyController;
use App\Http\Controllers\V3\FinanceController;

Route::middleware(['auth', 'verified', 'tenant'])
    ->prefix('s/{store_slug}')
    ->name('store.')
    ->group(function () {
        // V3 controllers only — legacy controllers must not be referenced here
        Route::resource('sales', SaleController::class);
        Route::resource('inventory', InventoryController::class);
        Route::resource('purchases', PurchaseController::class);
        Route::resource('parties', PartyController::class);
        Route::get('reports/{type}', [ReportController::class, 'show']);
        // etc.
    });
```

### Fix C — Make V3 controllers thin and complete

The V3 controllers should be thin — they only validate, authorize, call the service, and return:

```php
// app/Http/Controllers/V3/SaleController.php — the correct pattern

class SaleController extends Controller
{
    public function __construct(private SaleService $saleService) {}

    public function store(StoreSaleRequest $request): InertiaResponse|JsonResponse
    {
        // StoreSaleRequest handles validation
        // TenantMiddleware already verified membership
        // SaleService now correctly inserts with tenant_id

        $result = $this->saleService->post($request->validated());

        return Inertia::render('Sales/Receipt', ['sale_id' => $result['sale_id']]);
    }
}
```

### Fix D — Delete or quarantine legacy controllers

Once all routes point to V3, the legacy controllers become dead code:

```bash
# Step 1: Confirm no route references legacy controllers
grep -rn "use App\\Http\\Controllers\\SaleController" routes/
grep -rn "use App\\Http\\Controllers\\InventoryController" routes/
# etc. — must return zero results

# Step 2: Move legacy controllers to a quarantine folder
mkdir -p app/Http/Controllers/Legacy_Quarantine
mv app/Http/Controllers/SaleController.php app/Http/Controllers/Legacy_Quarantine/
mv app/Http/Controllers/InventoryController.php app/Http/Controllers/Legacy_Quarantine/
# etc.

# Step 3: After 30 days of stable production — delete quarantine folder
```

### Verification checklist for Wound 1

```
□ grep "SaleController" routes/ — only V3\SaleController referenced
□ grep "InventoryController" routes/ — only V3\InventoryController referenced
□ grep "ReportController" routes/ — only V3\ReportController referenced
□ grep "PurchaseController" routes/ — only V3\PurchaseController referenced
□ Legacy controllers moved to quarantine (not deleted yet)
□ All store routes use V3 controllers
□ Test: create a sale, verify it goes through V3\SaleController → SaleService → DB with tenant_id
□ Test: check reports load correctly from V3 controller
□ No 500 errors in logs after route changes
```

---

## Additional Problems the Audit May Have Missed

These are architectural issues that commonly accompany the four wounds above. Check each one.

### Additional 1 — Stock movements on sale creation

When a sale is created, stock must be decremented. Check whether SaleService decrements stock and whether that decrement includes tenant_id:

```bash
grep -n "stocks\|stock_movements" app/Services/V3/SaleService.php
# Every update/insert must have where('tenant_id', ...) or include tenant_id in payload
```

```
□ Stock decrement on sale: explicit where('tenant_id', $tenantId) on the UPDATE
□ stock_movements insert: includes tenant_id in the insert array
```

### Additional 2 — Report queries

Reports are the most likely place for cross-tenant data bleed because they aggregate data (SUM, COUNT, GROUP BY). Every report query must filter by tenant_id:

```bash
# Find every report query file
grep -rn "DB::table.*SUM\|DB::table.*COUNT\|DB::table.*GROUP BY" app/Services/ app/Http/Controllers/V3/ --include="*.php"
# Every result must have ->where('tenant_id', app('current.tenant')->id)
```

```
□ P&L report: all queries filtered by tenant_id
□ Balance Sheet: all queries filtered by tenant_id
□ Sales Summary: filtered by tenant_id
□ Test: Tenant A has Rs 50,000 in sales. Tenant B has Rs 20,000. Tenant A's P&L shows Rs 50,000, not Rs 70,000.
```

### Additional 3 — The WooCommerce sync job

```bash
grep -n "tenant_id" app/Jobs/SyncStockToWooCommerce.php
# Must accept tenantId in constructor and filter all queries
```

```
□ SyncStockToWooCommerce: accepts tenant ID in constructor
□ All inventory queries scoped to that tenant
□ WooCommerce credentials fetched per-tenant (not a global setting)
```

### Additional 4 — POS session data

POS sessions (open cash drawer, session totals) must be tenant-scoped:

```bash
grep -n "pos_sessions\|cash_sessions" app/Services/ app/Http/Controllers/ --include="*.php" -r
# Every query must filter by tenant_id
```

```
□ POS open session: stores tenant_id
□ POS close session: only closes sessions belonging to current tenant
□ POS session summary: only shows current tenant's data
```

### Additional 5 — Settings are per-tenant

The `SettingsHelper` or equivalent must cache settings per tenant, not globally:

```bash
grep -n "cache\|Cache::" app/Helpers/SettingsHelper.php
# Cache key must include tenant_id: "settings:{tenant_id}" not just "settings"
```

```
□ Cache key includes tenant_id: Cache::remember("settings:{$tenantId}", ...)
□ Clearing one tenant's settings cache does not clear another's
□ Test: change currency in Tenant A. Tenant B's currency is unchanged.
```

### Additional 6 — Password reset does not expose store structure

The password reset flow should work without any store context (user may have forgotten which store URL to go to):

```
□ /forgot-password exists at root URL (no store slug required)
□ Password reset link goes to venqore.com/reset-password/{token}
□ After reset, user is redirected to /login (not to a store-specific URL)
□ Reset email does not contain any store-specific URL or slug
```

### Additional 7 — API rate limiting is per-tenant

Verify rate limiting from the RouteServiceProvider is keyed on tenant, not just IP:

```bash
grep -n "RateLimiter" app/Providers/RouteServiceProvider.php
# Key must be: 'tenant:' . $tenant->id (not just IP address)
```

```
□ API rate limit key is tenant-based
□ One tenant hitting rate limit does not affect other tenants
□ Webhook endpoint has separate stricter rate limit
```

---

## Complete Execution Checklist

Work through this top to bottom. Tick only when you have actually tested it, not just when you have written the code.

### Phase 1 — Stop the Data Destruction (Wound 4)

```
□ Run migration: change cascadeOnDelete to onDelete('restrict') on financial tables
□ Add SoftDeletes to: Product, Party, Account, Category, Warehouse
□ Add deleted_at columns to those tables (migration)
□ Register ProductObserver — blocks deletion if sale history exists
□ Register PartyObserver — blocks deletion if invoice/journal history exists
□ Register AccountObserver — blocks deletion if journal_items exist
□ Update product delete flow: archive (is_active = false) instead of delete when history exists
□ TEST: product with sales cannot be deleted
□ TEST: product without sales can be soft-deleted
□ TEST: soft-deleted product does not appear in POS or inventory list
□ TEST: historical sales for soft-deleted product still appear in reports
```

### Phase 2 — Fix the Data (Wound 2)

```
□ Run orphan audit: SELECT COUNT(*) FROM sales WHERE tenant_id IS NULL
□ Run orphan audit: same for sale_items, journal_entries, journal_items
□ If any orphans found: run backfill script to assign to Tenant 1 (AMD Outlets)
□ Fix SaleService.php: every DB::table insert has explicit tenant_id
□ Fix AccountingService.php: every DB::table insert has explicit tenant_id
□ Run: grep -rn "DB::table.*insert" app/Services/ — verify every result has tenant_id
□ Run NOT NULL migration on tenant_id columns (after backfill confirms zero nulls)
□ TEST: create a sale, check tenant_id in database — must not be null
□ TEST: check sale's journal entries — tenant_id must not be null
□ TEST: call SaleService without tenant context — must throw RuntimeException
```

### Phase 3 — Fix Background Jobs (Wound 3)

```
□ Create RunsWithTenantContext trait
□ Fix RunGrowthEngine.php: process one tenant at a time, explicit tenant_id everywhere
□ Fix CleanOrphanJournalEntries.php: per-tenant loop, explicit filters, soft-delete only
□ Audit all other jobs/commands: grep -L "current.tenant\|withTenant" app/Jobs/ app/Console/Commands/
□ Fix every job returned by the audit above
□ TEST: run RunGrowthEngine, verify recommendations have correct tenant_id
□ TEST: run CleanOrphanJournalEntries, verify no cross-tenant data touched
```

### Phase 4 — Consolidate Controllers (Wound 1)

```
□ Audit routes: grep "SaleController\|InventoryController\|ReportController" routes/
□ Fix all routes pointing to legacy controllers → point to V3 namespace
□ Confirm V3 controllers are thin and call the (now-fixed) services
□ Move legacy controllers to Legacy_Quarantine folder
□ TEST: full sale flow — create sale, verify V3 controller, V3 service, correct DB insert
□ TEST: all reports load via V3 controller
□ TEST: no 500 errors after route changes
```

### Phase 5 — Additional Checks

```
□ Stock movements: explicit tenant_id on all inserts
□ All 38 reports: every query filtered by tenant_id
□ WooCommerce sync job: tenant-scoped
□ POS sessions: tenant-scoped
□ SettingsHelper: cache key includes tenant_id
□ Password reset: works without store context, redirects to /login
□ Rate limiting: keyed on tenant ID not just IP
```

### Final Verification — The Data Integrity Test

Run this before going live. Zero rows returned from each query means the system is clean:

```sql
-- These must ALL return 0
SELECT COUNT(*) FROM sales WHERE tenant_id IS NULL;
SELECT COUNT(*) FROM sale_items WHERE tenant_id IS NULL;
SELECT COUNT(*) FROM journal_entries WHERE tenant_id IS NULL;
SELECT COUNT(*) FROM journal_items WHERE tenant_id IS NULL;
SELECT COUNT(*) FROM purchase_items WHERE tenant_id IS NULL;
SELECT COUNT(*) FROM stock_movements WHERE tenant_id IS NULL;
SELECT COUNT(*) FROM ai_recommendations WHERE tenant_id IS NULL;

-- No cross-tenant contamination in recommendations
SELECT DISTINCT tenant_id FROM ai_recommendations;
-- Count should equal number of active tenants, each with their own ID
```

---

## One Rule to Govern All Future Code

> **Any query that reads or writes business data must have an explicit `where('tenant_id', ...)` or be operating on an Eloquent model with the HasTenant trait applied.**
>
> No exceptions. Not in services. Not in jobs. Not in commands. Not in reports.
>
> If you find yourself writing `DB::table('sales')->get()` without a tenant_id filter anywhere in the call chain, stop and add it before committing.

This rule should be in your contributing guidelines and code review checklist. Every future developer (including you six months from now) needs to know this is not optional.
