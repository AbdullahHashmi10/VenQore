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
     * Helper to verify password or passcode
     */
    private function verifyCredential($input)
    {
        // 1. Check User Password
        if (Hash::check($input, auth()->user()->password)) {
            return true;
        }

        // 2. Check Admin Passcode (if enabled/set)
        $passcode = \App\Models\Setting::where('key', 'admin_passcode')->value('value');
        if ($passcode && $input === $passcode) {
            return true;
        }

        return false;
    }

    /**
     * Delete All Data (Factory Reset)
     * Keeps Users, Settings, Permissions.
     */
    public function factoryReset(Request $request)
    {
        // Increase limits for large deletions
        set_time_limit(600); // 10 minutes
        ini_set('memory_limit', '512M');

        $request->validate(['password' => 'required']);

        if (!$this->verifyCredential($request->password)) {
            return response()->json(['message' => 'Invalid password or admin passcode.'], 403);
        }

        try {
            DB::beginTransaction();

            // Disable foreign key checks
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');

            // List of tables to delete (NOT TRUNCATE)
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
                if (Schema::hasTable($table)) {
                    DB::table($table)->delete();
                }
            }

            // Reset Account Balances (Keep Chart of Accounts)
            if (Schema::hasTable('accounts')) {
                DB::table('accounts')->update(['balance' => 0]);
            }



            // Re-enable foreign key checks
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');

            DB::commit();
            Log::info('Factory Reset performed by User ID: ' . auth()->id());

            return response()->json(['message' => 'System successfully reset to factory settings.']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Factory Reset Failed: ' . $e->getMessage());
            return response()->json(['message' => 'Factory Reset Failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Selective Delete
     */
    public function deleteEntity(Request $request, $entity)
    {
        set_time_limit(600);
        ini_set('memory_limit', '512M');

        $request->validate(['password' => 'required']);

        if (!$this->verifyCredential($request->password)) {
            return response()->json(['message' => 'Invalid password or admin passcode.'], 403);
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
                        if (Schema::hasTable($table)) DB::table($table)->delete();
                    }
                    
                    // Clear Product Logs
                    if (Schema::hasTable('activity_log')) {
                        DB::table('activity_log')->where('subject_type', 'like', '%Product%')->delete();
                    }
                    if (Schema::hasTable('activities')) {
                         DB::table('activities')->where('reference_type', 'like', '%Product%')->delete();
                    }
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
                        if (Schema::hasTable($table)) DB::table($table)->delete();
                    }

                    // 1. Transactions (Income/Sales)
                    if (Schema::hasTable('transactions')) {
                        DB::table('transactions')->whereIn('type', ['sale', 'payment_in', 'invoice', 'credit'])->delete();
                    }
                    
                    // 2. Payments (Received)
                    if (Schema::hasTable('payments')) {
                        DB::table('payments')->delete(); // Safer to clear logic if selective
                    }

                    // 3. Activities (Sales/Payments)
                    if (Schema::hasTable('activities')) {
                        DB::table('activities')->whereIn('type', ['sale', 'payment_in', 'invoice', 'return'])->delete();
                    }
                    if (Schema::hasTable('activity_log')) {
                        DB::table('activity_log')->where('subject_type', 'like', '%Sale%')->orWhere('subject_type', 'like', '%Invoice%')->delete();
                    }
                    
                    // 4. Journals (Sales) - Hard to isolate, but we can try removing linked entries
                    // Ideally we should iterate and find entries, but for bulk delete:
                    // Deleting all journal entries is too aggressive for 'sales' only?
                    // For now, leave journals if selective, as they are linked to accounts. Or wipe journals if user wants full clean.
                    break;

                case 'stock':
                    // Reset Stock Counts to 0
                    if (Schema::hasTable('stocks')) {
                         DB::table('stocks')->update(['quantity' => 0]);
                    }
                    if (Schema::hasTable('products')) {
                        DB::table('products')->update(['stock_quantity' => 0]);
                    }
                    if (Schema::hasTable('product_variants')) {
                        DB::table('product_variants')->update(['stock_quantity' => 0]);
                    }

                    // Clear History
                    $historyTables = ['stock_movements', 'stock_transfers', 'stock_takes', 'production_runs'];
                    foreach ($historyTables as $table) {
                        if (Schema::hasTable($table)) DB::table($table)->delete();
                    }

                    // Clear Stock-related Logs
                    if (Schema::hasTable('activities')) {
                        DB::table('activities')->whereIn('type', ['adjustment', 'transfer', 'stock_take'])->delete();
                    }
                    break;
                
                case 'transactions':
                     // Delete all financial transactions
                     $tables = ['transactions', 'payments', 'expenses', 'bank_reconciliations', 'debit_notes', 'invoice_reminders', 'journal_entries', 'journal_items'];
                     foreach ($tables as $table) {
                        if (Schema::hasTable($table)) DB::table($table)->delete();
                     }
                     // Reset Accounts
                     if (Schema::hasTable('accounts')) DB::table('accounts')->update(['balance' => 0]);
                     break;

                default:
                    throw new \Exception("Invalid entity type: $entity");
            }

            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            DB::commit();
            Log::info("Selective Delete ($entity) performed by User ID: " . auth()->id());

            return response()->json(['message' => ucfirst($entity) . ' data successfully deleted.']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Operation Failed: ' . $e->getMessage()], 500);
        }
    }
}
