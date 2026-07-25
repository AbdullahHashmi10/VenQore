<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use App\Models\Tenant;
use App\Services\DemoStoreService;
use Carbon\Carbon;

class DemoRestore extends Command
{
    protected $signature = 'demo:restore {--force : Skip confirmation}';
    protected $description = 'Restores the demo tenant to its Golden Master state from JSON snapshot';

    /**
     * Date-like columns that get shifted forward so a snapshot restored
     * weeks or months after it was captured still looks "recent" on the
     * dashboard, instead of showing the fixed date the snapshot happened
     * to be taken on. Mirrors the approach already used in
     * TenantCloner::cloneFrom() for per-visitor sandbox clones.
     */
    private const DATE_COLUMNS = ['created_at', 'updated_at', 'posted_at', 'date', 'due_date', 'paid_at', 'sold_at'];

    public function handle()
    {
        $this->info('Restoring Demo Store to Golden Master state...');

        $path = storage_path('demo-snapshots/golden_master.json');

        if (!file_exists($path)) {
            $this->warn("Golden Master snapshot not found at {$path}. Falling back to full deploy...");
            Artisan::call('demo:full-deploy');
            $this->info(Artisan::output());
            $this->info('Full deploy fallback complete.');
            return 0;
        }

        $snapshot = json_decode(file_get_contents($path), true);
        if (!$snapshot || empty($snapshot['tenant'])) {
            $this->error('Invalid golden master snapshot format!');
            return 1;
        }

        // Resolve (never create-a-duplicate) via the shared resolver. This
        // is the fix for the bug where every restore with no existing
        // Golden Master created ANOTHER unflagged "demo" tenant from the
        // snapshot payload (whose is_golden_master value was false, since
        // that's what got serialized at snapshot time).
        $demoTenant = DemoStoreService::goldenMaster(createIfMissing: false);

        if (!$demoTenant) {
            // Truly nothing exists yet (fresh install) — safe to create
            // from the snapshot's tenant payload this one time.
            $tenantData = $snapshot['tenant'];
            unset($tenantData['id'], $tenantData['created_at'], $tenantData['updated_at'], $tenantData['deleted_at']);
            $demoTenant = Tenant::create($tenantData);
        }

        // Regardless of what the snapshot payload says, or what state the
        // tenant was in before: force it to be the flagged Golden Master.
        // This is what actually stops duplicate demo tenants from ever
        // being created again by this command.
        $demoTenant->update([
            'is_demo'          => true,
            'is_golden_master' => true,
            'slug'             => DemoStoreService::DEFAULT_SLUG,
        ]);

        $tenantId = $demoTenant->id;

        // Compute a date offset so restored data reads as "recent". Anchor
        // to the newest date found anywhere in the snapshot's sales table
        // (falls back to today if sales are empty/missing).
        $offsetDays = 0;
        if (!empty($snapshot['data']['sales'])) {
            $maxDate = collect($snapshot['data']['sales'])
                ->pluck('created_at')
                ->filter()
                ->map(fn ($d) => Carbon::parse($d))
                ->max();
            if ($maxDate) {
                $offsetDays = $maxDate->diffInDays(Carbon::now(), false);
            }
        }

        DB::transaction(function () use ($snapshot, $demoTenant, $tenantId, $offsetDays) {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');

            // Wipe existing data for this tenant using the shared table
            // list — previously this list only covered 18 tables and
            // missed journal_items, sales, purchases, stocks, expenses,
            // transactions entirely, leaving orphan rows behind on every
            // restore.
            $tables = DemoStoreService::existingTenantDataTables();

            foreach ($tables as $table) {
                DB::table($table)->where('tenant_id', $tenantId)->delete();
            }

            // Restore from snapshot in reverse order (parents before the
            // children that reference them) to avoid FK errors.
            $insertOrder = array_reverse($tables);
            foreach ($insertOrder as $table) {
                if (empty($snapshot['data'][$table]) || !Schema::hasTable($table)) {
                    continue;
                }
                foreach (array_chunk($snapshot['data'][$table], 500) as $chunk) {
                    $rows = [];
                    foreach ($chunk as $row) {
                        $row['tenant_id'] = $tenantId;
                        foreach (self::DATE_COLUMNS as $col) {
                            if (!empty($row[$col])) {
                                try {
                                    $row[$col] = Carbon::parse($row[$col])->addDays($offsetDays)->toDateTimeString();
                                } catch (\Exception $e) {
                                    // Leave malformed dates as-is.
                                }
                            }
                        }
                        $rows[] = $row;
                    }
                    try {
                        DB::table($table)->insert($rows);
                    } catch (\Exception $e) {
                        Log::error("demo:restore — failed inserting into {$table}: " . $e->getMessage());
                        throw $e;
                    }
                }
            }

            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        });

        $demoTenant->update(['demo_reset_at' => now(), 'demo_visit_today' => 0]);

        // Verify the restore actually produced a healthy store rather than
        // silently reporting success on an empty/broken one.
        $health = DemoStoreService::healthCheck($tenantId);
        if (!$health['ok']) {
            $this->warn('Restore completed, but health check found issues:');
            foreach ($health['issues'] as $issue) {
                $this->warn("  - {$issue}");
            }
            Log::warning('demo:restore completed with health check issues.', $health);
        }

        $this->info('Demo store Golden Master restore successful! (date offset applied: ' . $offsetDays . ' days)');
        $this->info('Row counts: ' . json_encode($health['counts']));
        return 0;
    }
}
