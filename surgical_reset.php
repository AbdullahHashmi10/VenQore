<?php
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

set_time_limit(600);
ini_set('memory_limit', '512M');

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

try {
    DB::beginTransaction();
    DB::statement('SET FOREIGN_KEY_CHECKS=0;');

    foreach ($tablesToWipe as $table) {
        if (Schema::hasTable($table)) {
            DB::table($table)->delete();
            echo "Wiped table: $table" . PHP_EOL;
        }
    }

    if (Schema::hasTable('accounts')) {
        DB::table('accounts')->update(['balance' => 0]);
        echo "Reset accounts balance to 0" . PHP_EOL;
    }

    if (Schema::hasTable('bank_accounts')) {
        if (Schema::hasColumn('bank_accounts', 'current_balance')) {
            DB::table('bank_accounts')->update(['current_balance' => 0, 'opening_balance' => 0]);
        }
        echo "Reset bank accounts balance to 0" . PHP_EOL;
    }

    if (Schema::hasTable('parties')) {
         DB::table('parties')->update(['opening_balance' => 0, 'current_balance' => 0]);
         echo "Reset parties balances to 0" . PHP_EOL;
    }
    
    // Clear stocks to match WIPED movements
    if (Schema::hasTable('stocks')) {
         DB::table('stocks')->update(['quantity' => 0]);
         echo "Reset stock quantities to 0" . PHP_EOL;
    }
    
    if (Schema::hasTable('products')) {
        DB::table('products')->update(['stock_quantity' => 0]);
        echo "Reset product stock quantities to 0" . PHP_EOL;
    }

    DB::statement('SET FOREIGN_KEY_CHECKS=1;');
    DB::commit();
    echo "✅ Surgical reset completed successfully." . PHP_EOL;

} catch (\Exception $e) {
    DB::rollBack();
    echo "❌ Error during surgical reset: " . $e->getMessage() . PHP_EOL;
}
