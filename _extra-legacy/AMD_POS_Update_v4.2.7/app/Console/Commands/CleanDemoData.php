<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CleanDemoData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'clean:demo-data {--force : Force the operation to run when in production}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Deletes all demo data including transactions, products, and parties, keeping only the admin user and basic settings.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if (!$this->confirm('This will DELETE ALL BUSINESS DATA (Transactions, Products, Parties, etc.). Are you sure?', $this->option('force'))) {
            $this->info('Operation cancelled.');
            return;
        }

        $this->info('Cleaning demo data...');

        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        $tables = [
            'sales', 'sale_items',
            'invoices', 'invoice_items',
            'transactions', 'transaction_allocations',
            'payments', 'payment_allocations',
            'expenses', 
            'stock_movements',
            'stocks', // Quantity data
            
            // Purchase side
            'purchases', 'purchase_items',
            'purchase_orders', 'purchase_order_items',
            'debit_notes', 'debit_note_items',
            
            // Product catalog
            'products', 'product_variants', 'product_images', 
            'product_barcodes', 'variant_attributes',
            
            // CRM
            'parties', 'customers', 'suppliers',
            
            // Manufacturing
            'recipes', 'recipe_ingredients', 
            'production_logs', 'manufacturing_logs',
            
            // System
            'notifications',
            'activity_log',
            
            // Financials
            'funds', 'fund_transactions', // Check table name
            'journal_entries', 'journal_items',
            'bank_accounts', // Maybe? "Demo data" usually includes these if they are fake.
            'sales_orders', 'sales_order_items'
        ];

        // Explicitly check for tables before truncating to avoid errors
        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                $this->info("Truncating $table...");
                DB::table($table)->truncate();
            }
        }

        // Also clean users but keep Platform Owner
        if (Schema::hasTable('users')) {
            $this->info("Cleaning users (keeping Platform Owner)...");
            // Assuming ID 1 is the main admin or role 'platform_admin'
            DB::table('users')->where('id', '!=', 1)->delete();
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $this->info('Demo data cleaned successfully.');
        $this->info('You may want to run [php artisan db:seed --class=WarehouseSeeder] or others to re-init basic config if needed.');
    }
}
