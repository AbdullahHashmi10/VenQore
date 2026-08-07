<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

try {
    DB::statement('SET FOREIGN_KEY_CHECKS=0;');

    // Wipe all transaction data
    $tablesToWipe = [
        'journal_entries',
        'journal_items',
        'sales',
        'sale_items',
        'payments',
        'purchases',
        'purchase_items',
        'expenses',
        'inventory_batches',
        'sale_item_batches',
        'activities',
        'stock_movements',
        'payment_allocations',
        'party_snapshots',
        'transactions',
        'invoices',
        'invoice_items',
        'audit_logs',
        'activity_log',
        'stock_takes',
        'stock_transfers',
        'returns',
        'return_items',
        'debit_notes',
        'debit_note_items',
        'recurring_invoices',
        'parked_sales',
        'sales_orders',
        'sales_order_items',
        'purchase_orders',
        'production_runs',
        'production_log_ingredients',
        'production_logs',
        'fund_transactions',
        'custom_charges',
        'gift_cards',
        'loyalty_points',
        'loyalty_balances',
        'manufacturing_ingredients',
        'manufacturing_logs',
        'manufacturing_rules',
        'product_batches',
        'product_serials',
        'proposal_items',
        'proposals',
        'purchase_proposal_items',
        'purchase_proposals',
        'stock_take_items',
        'stock_transfer_items',
        'store_credit_balances',
        'store_credits',
        'transaction_allocations',
    ];

    foreach ($tablesToWipe as $table) {
        if (Schema::hasTable($table)) {
            DB::table($table)->truncate();
            echo "Truncated table: $table\n";
        }
    }

    // Delete products and parties to make it a fresh store
    if (Schema::hasTable('products')) {
        DB::table('products')->delete();
        echo "Deleted all products\n";
    }
    if (Schema::hasTable('parties')) {
        DB::table('parties')->delete();
        echo "Deleted all parties/contacts\n";
    }
    if (Schema::hasTable('categories')) {
        DB::table('categories')->delete();
        echo "Deleted all categories\n";
    }
    if (Schema::hasTable('brands')) {
        DB::table('brands')->delete();
        echo "Deleted all brands\n";
    }

    if (Schema::hasTable('accounts')) {
        DB::table('accounts')->update(['balance' => 0]);
        echo "Reset accounts balance to 0\n";
    }

    if (Schema::hasTable('bank_accounts')) {
        if (Schema::hasColumn('bank_accounts', 'current_balance')) {
            DB::table('bank_accounts')->update(['current_balance' => 0, 'opening_balance' => 0]);
        }
        echo "Reset bank accounts balance to 0\n";
    }
    
    if (Schema::hasTable('stocks')) {
         DB::table('stocks')->update(['quantity' => 0]);
         echo "Reset stock quantities to 0\n";
    }

    // Reset onboarding step to welcome and onboarding_completed to false for the tenant
    if (Schema::hasTable('tenants')) {
        DB::table('tenants')->update([
            'onboarding_step' => 'welcome',
            'onboarding_completed' => 0,
            'onboarding_steps_done' => null
        ]);
        echo "Reset all tenants onboarding steps to 'welcome', completed status to false, and steps done to null\n";
    }

    DB::statement('SET FOREIGN_KEY_CHECKS=1;');
    echo "✅ Onboarding and transaction data successfully reset to welcome state!\n";
} catch (\Exception $e) {
    echo "❌ Error during reset: " . $e->getMessage() . "\n";
}
