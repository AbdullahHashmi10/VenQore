<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class SystemResetController extends Controller
{
    /**
     * Verify the credential supplied for a dangerous operation.
     *
     * Priority order:
     *   1. Password  — any user who has set a password must supply it.
     *   2. Admin passcode — store-level passcode set in Settings.
     *      SEC-1 (2026-07-03): the stored passcode is now a bcrypt hash
     *      (hashed on save in SettingsController + backfill migration).
     *      A legacy plaintext value still verifies once and is upgraded
     *      to a hash on the spot, so no store gets locked out mid-migration.
     *
     * Every failed attempt is logged with user, tenant and IP.
     */
    private function verifyCredential($input, Request $request)
    {
        $user = auth()->user();

        // 1. Check User Password (works for everyone who has one)
        if ($user->password && Hash::check($input, $user->password)) {
            return true;
        }

        // 2. Check Admin Passcode (if enabled/set) — hashed compare (SEC-1)
        $stored = \App\Models\Setting::where('key', 'admin_passcode')->value('value');
        if ($stored) {
            $isHash = str_starts_with($stored, '$2y$') || str_starts_with($stored, '$argon2');
            if ($isHash && Hash::check($input, $stored)) {
                return true;
            }
            // Legacy plaintext value: verify once, then self-upgrade to a hash.
            if (!$isHash && hash_equals($stored, (string) $input)) {
                \App\Models\Setting::where('key', 'admin_passcode')
                    ->update(['value' => Hash::make($input)]);
                Log::info('SEC-1: legacy plaintext admin_passcode auto-upgraded to hash.', [
                    'tenant_id' => app()->bound('current.tenant') ? app('current.tenant')->id : null,
                ]);
                return true;
            }
        }

        Log::warning('Dangerous-operation credential check FAILED.', [
            'user_id'   => $user?->id,
            'tenant_id' => app()->bound('current.tenant') ? app('current.tenant')->id : null,
            'ip'        => $request->ip(),
            'route'     => $request->path(),
        ]);

        return false;
    }

    /**
     * Delete rows from a table for the CURRENT TENANT ONLY.
     *
     * CRITICAL FIX (2026-07-03): this controller previously ran
     * DB::table($table)->delete() with FOREIGN_KEY_CHECKS=0 and NO tenant
     * scope — a store-level "factory reset" would have wiped every tenant
     * on the platform. All destructive statements are now scoped to the
     * current tenant, and tables without a tenant_id column are skipped
     * (never mass-deleted) and reported in the log.
     *
     * @return bool true if the table was wiped, false if skipped
     */
    private function wipeTenantTable(string $table, int $tenantId, ?callable $extraWhere = null): bool
    {
        if (!Schema::hasTable($table)) {
            return false;
        }

        if (!Schema::hasColumn($table, 'tenant_id')) {
            Log::info("SystemReset: skipped table without tenant_id column: {$table}");
            return false;
        }

        $query = DB::table($table)->where('tenant_id', $tenantId);
        if ($extraWhere) {
            $extraWhere($query);
        }
        $query->delete();

        return true;
    }

    /**
     * Delete All Data (Factory Reset) — for the current store (tenant) only.
     * Keeps Users, Settings, Permissions.
     */
    public function factoryReset(Request $request)
    {
        // Increase limits for large deletions
        set_time_limit(600); // 10 minutes
        ini_set('memory_limit', '512M');

        $request->validate(['password' => 'required']);

        $user = auth()->user();
        if (!$user->password) {
            $stored = \App\Models\Setting::where('key', 'admin_passcode')->value('value');
            if (!$stored) {
                return response()->json([
                    'message' => 'For security, please set a password in your Profile settings first, then return to confirm this action.'
                ], 403);
            }
        }

        if (!$this->verifyCredential($request->password, $request)) {
            return response()->json(['message' => 'Invalid password or admin passcode.'], 403);
        }

        $tenantId = app()->bound('current.tenant') ? app('current.tenant')?->id : null;
        if (!$tenantId) {
            return response()->json(['message' => 'No active store context — reset aborted.'], 422);
        }

        try {
            DB::beginTransaction();

            // Disable foreign key checks (session-level) so deletion order doesn't matter
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');

            // List of tables to delete (NOT TRUNCATE) — tenant-scoped
            $tables = [
                // Sales & Transactions
                'sales',
                'sale_items',
                'transactions',
                'payments',
                'expenses',
                'expense_categories',

                // Inventory
                'products',
                'product_variants',
                'stocks',
                'stock_movements',
                'inventory_batches',
                'sale_item_batches',
                'stock_transfers',
                'activities',    // App\Models\Activity
                'stock_takes',
                'categories',
                'brands',
                'warranties',

                // CRITICAL: Accounting Data
                'journal_entries',
                'journal_items',
                'bank_reconciliations',
                'debit_notes',
                'invoice_reminders',
                'invoices',
                'invoice_items',
                'payment_allocations',

                // Parties
                'customers',
                'suppliers',
                'parties',
                'party_opening_balances',

                // Purchases
                'purchases',
                'purchase_items',
                'purchase_orders',
                'purchase_order_items',

                // Other Sales Documents
                'returns',
                'return_items',
                'proposals',
                'proposal_items',
                'sales_orders',
                'sales_order_items',
                'parked_sales',
                'recurring_invoices',

                // Manufacturing
                'production_runs',
                'production_run_items',
                'manufacturing_rules',

                // Logs
                'audit_logs',
                'activity_log',
                'notifications',
                'failed_jobs',
                'job_batches',
                'bank_accounts',
            ];

            foreach ($tables as $table) {
                $this->wipeTenantTable($table, $tenantId);
            }

            // Reset Account Balances (Keep Chart of Accounts) — this tenant only
            if (Schema::hasTable('accounts') && Schema::hasColumn('accounts', 'tenant_id')) {
                DB::table('accounts')->where('tenant_id', $tenantId)->update(['balance' => 0]);
            }

            // Re-enable foreign key checks
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');

            DB::commit();
            Log::info("Factory Reset performed for tenant {$tenantId} by User ID: " . auth()->id());

            return response()->json(['message' => 'Store data successfully reset to factory settings.']);

        } catch (\Exception $e) {
            DB::rollBack();
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            Log::error('Factory Reset Failed: ' . $e->getMessage());
            return response()->json(['message' => 'Factory Reset Failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Selective Delete — for the current store (tenant) only.
     */
    public function deleteEntity(Request $request, $entity)
    {
        set_time_limit(600);
        ini_set('memory_limit', '512M');

        $request->validate(['password' => 'required']);

        $user = auth()->user();
        if (!$user->password) {
            $stored = \App\Models\Setting::where('key', 'admin_passcode')->value('value');
            if (!$stored) {
                return response()->json([
                    'message' => 'For security, please set a password in your Profile settings first, then return to confirm this action.'
                ], 403);
            }
        }

        if (!$this->verifyCredential($request->password, $request)) {
            return response()->json(['message' => 'Invalid password or admin passcode.'], 403);
        }

        $tenantId = app()->bound('current.tenant') ? app('current.tenant')?->id : null;
        if (!$tenantId) {
            return response()->json(['message' => 'No active store context — operation aborted.'], 422);
        }

        try {
            DB::beginTransaction();
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');

            switch ($entity) {
                case 'products':
                    // Delete Products & Logic
                    $tables = [
                        'products', 'product_variants', 'stocks',
                        'stock_movements', 'stock_transfers', 'stock_takes',
                        'manufacturing_rules', 'production_runs', 'production_run_items'
                    ];
                    foreach ($tables as $table) {
                        $this->wipeTenantTable($table, $tenantId);
                    }

                    // Clear Product Logs (tenant-scoped; skipped if no tenant_id column)
                    $this->wipeTenantTable('activity_log', $tenantId, function ($q) {
                        $q->where('subject_type', 'like', '%Product%');
                    });
                    $this->wipeTenantTable('activities', $tenantId, function ($q) {
                        $q->where('reference_type', 'like', '%Product%');
                    });
                    break;

                case 'sales':
                    // Delete Sales, Invoices, & Financials related to Revenue
                    $tables = [
                        'sales', 'sale_items',
                        'proposals', 'proposal_items',
                        'sales_orders', 'sales_order_items',
                        'parked_sales',
                        'invoices', 'invoice_items',
                        'recurring_invoices',
                        'returns', 'return_items',
                        'payment_allocations'
                    ];

                    foreach ($tables as $table) {
                        $this->wipeTenantTable($table, $tenantId);
                    }

                    // 1. Transactions (Income/Sales)
                    $this->wipeTenantTable('transactions', $tenantId, function ($q) {
                        $q->whereIn('type', ['sale', 'payment_in', 'invoice', 'credit']);
                    });

                    // 2. Payments (Received)
                    $this->wipeTenantTable('payments', $tenantId);

                    // 3. Activities (Sales/Payments)
                    $this->wipeTenantTable('activities', $tenantId, function ($q) {
                        $q->whereIn('type', ['sale', 'payment_in', 'invoice', 'return']);
                    });
                    $this->wipeTenantTable('activity_log', $tenantId, function ($q) {
                        $q->where(function ($qq) {
                            $qq->where('subject_type', 'like', '%Sale%')
                               ->orWhere('subject_type', 'like', '%Invoice%');
                        });
                    });
                    break;

                case 'stock':
                    // Reset Stock Counts to 0 — this tenant only
                    if (Schema::hasTable('stocks') && Schema::hasColumn('stocks', 'tenant_id')) {
                        DB::table('stocks')->where('tenant_id', $tenantId)->update(['quantity' => 0]);
                    }
                    if (Schema::hasTable('products') && Schema::hasColumn('products', 'tenant_id')) {
                        DB::table('products')->where('tenant_id', $tenantId)->update(['stock_quantity' => 0]);
                    }
                    if (Schema::hasTable('product_variants') && Schema::hasColumn('product_variants', 'tenant_id')) {
                        DB::table('product_variants')->where('tenant_id', $tenantId)->update(['stock_quantity' => 0]);
                    }

                    // Clear History
                    $historyTables = ['stock_movements', 'stock_transfers', 'stock_takes', 'production_runs'];
                    foreach ($historyTables as $table) {
                        $this->wipeTenantTable($table, $tenantId);
                    }

                    // Clear Stock-related Logs
                    $this->wipeTenantTable('activities', $tenantId, function ($q) {
                        $q->whereIn('type', ['adjustment', 'transfer', 'stock_take']);
                    });
                    break;

                case 'transactions':
                    // Delete all financial transactions — this tenant only
                    $tables = ['transactions', 'payments', 'expenses', 'bank_reconciliations', 'debit_notes', 'invoice_reminders', 'journal_entries', 'journal_items'];
                    foreach ($tables as $table) {
                        $this->wipeTenantTable($table, $tenantId);
                    }
                    // Reset Accounts — this tenant only
                    if (Schema::hasTable('accounts') && Schema::hasColumn('accounts', 'tenant_id')) {
                        DB::table('accounts')->where('tenant_id', $tenantId)->update(['balance' => 0]);
                    }
                    break;

                default:
                    throw new \Exception("Invalid entity type: $entity");
            }

            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            DB::commit();
            Log::info("Selective Delete ($entity) performed for tenant {$tenantId} by User ID: " . auth()->id());

            return response()->json(['message' => ucfirst($entity) . ' data successfully deleted.']);

        } catch (\Exception $e) {
            DB::rollBack();
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            return response()->json(['message' => 'Operation Failed: ' . $e->getMessage()], 500);
        }
    }
}
