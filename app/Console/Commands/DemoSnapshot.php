<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use App\Models\Tenant;

class DemoSnapshot extends Command
{
    protected $signature = 'demo:snapshot';
    protected $description = 'Dumps the demo tenant data into a JSON golden master snapshot';

    private const TABLES = [
        'settings',
        'tenant_users',
        'warehouses',
        'categories',
        'products',
        'suppliers',
        'customers',
        'parties',
        'party_transactions',
        'stock_takes',
        'stock_take_items',
        'stock_transfers',
        'stock_adjustments',
        'inventory_batches',
        'invoices',
        'invoice_items',
        'payments',
        'journal_entries',
    ];

    public function handle()
    {
        $this->info("Creating Demo Golden Master snapshot...");

        $demoTenant = Tenant::where('is_demo', true)->first();
        if (!$demoTenant) {
            $this->error("Demo tenant not found!");
            return 1;
        }

        $snapshot = [
            'tenant' => $demoTenant->toArray(),
            'data'   => [],
        ];

        foreach (self::TABLES as $table) {
            if (Schema::hasTable($table)) {
                $rows = DB::table($table)->where('tenant_id', $demoTenant->id)->get();
                $snapshot['data'][$table] = $rows->map(fn($r) => (array) $r)->toArray();
            } else {
                $this->line("Table '{$table}' not found in database, skipping.");
            }
        }

        $dir = storage_path('demo-snapshots');
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $path = $dir . '/golden_master.json';
        file_put_contents($path, json_encode($snapshot, JSON_PRETTY_PRINT));

        $this->info("Golden Master snapshot successfully saved to: {$path}");
        return 0;
    }
}
