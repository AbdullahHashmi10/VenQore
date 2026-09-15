<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use App\Models\Tenant;
use App\Services\DemoStoreService;

class DemoSnapshot extends Command
{
    protected $signature = 'demo:snapshot';
    protected $description = 'Dumps the demo tenant data into a JSON golden master snapshot';

    public function handle()
    {
        $this->info("Creating Demo Golden Master snapshot...");

        // Must resolve to the Golden Master specifically, not any live
        // visitor's ephemeral demo clone (see DemoSessionService).
        $demoTenant = Tenant::where('is_golden_master', true)->first();
        if (!$demoTenant) {
            $this->error("Demo tenant not found! Run 'php artisan demo:full-deploy' first to create and seed one.");
            return 1;
        }

        // Loudly verify the tenant is actually in a healthy, fully-seeded
        // state before snapshotting it — otherwise we'd bake a broken
        // Golden Master into the file that every future restore/update
        // relies on.
        $health = DemoStoreService::healthCheck($demoTenant->id);
        if (!$health['ok']) {
            $this->error('Refusing to snapshot — the demo tenant looks broken or incompletely seeded:');
            foreach ($health['issues'] as $issue) {
                $this->error("  - {$issue}");
            }
            $this->line('Row counts: ' . json_encode($health['counts']));
            $this->line("Run 'php artisan demo:full-deploy' to reseed, then try 'demo:snapshot' again. Use --force is not supported here on purpose.");
            return 1;
        }

        $snapshot = [
            'tenant' => $demoTenant->toArray(),
            'data'   => [],
        ];

        // Shared table list — see DemoStoreService::TENANT_DATA_TABLES.
        // This used to be a separately hand-maintained list here that had
        // drifted out of sync with the real schema (missing journal_items,
        // sales, purchases, stocks, expenses, transactions entirely), which
        // silently produced a hollow snapshot. Now there is exactly one
        // list, shared by snapshot, restore, and the full-deploy wiper.
        foreach (DemoStoreService::existingTenantDataTables() as $table) {
            $rows = DB::table($table)->where('tenant_id', $demoTenant->id)->get();
            $snapshot['data'][$table] = $rows->map(fn($r) => (array) $r)->toArray();
            $this->line("  Captured {$table}: " . count($snapshot['data'][$table]) . ' rows');
        }

        $dir = storage_path('demo-snapshots');
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $path = $dir . '/golden_master.json';
        file_put_contents($path, json_encode($snapshot, JSON_PRETTY_PRINT));

        $this->info("Golden Master snapshot successfully saved to: {$path}");
        $this->info('Row counts: ' . json_encode($health['counts']));
        return 0;
    }
}
