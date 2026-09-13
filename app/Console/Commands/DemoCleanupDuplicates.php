<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Services\DemoStoreService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * One-off repair command.
 *
 * Prior to the DemoStoreService fix, every failed update that found no
 * Golden Master tenant would run `demo:restore`, which called
 * `Tenant::create($tenantData)` from the snapshot payload. Because the
 * snapshot's `is_golden_master` value was `false`, this created a *new*,
 * unflagged tenant at slug 'demo' every time — instead of adopting the
 * existing one. Repeated across updates this produces a pile of duplicate
 * "demo" tenants, none of them flagged, so `is_golden_master = true`
 * never resolves to anything and /demo 404s forever.
 *
 * This command finds all of those duplicates, keeps exactly one (the
 * oldest, or the one with the most data if --keep-richest is passed),
 * deletes the rest along with their orphaned tenant-scoped data, and
 * flags the survivor as the Golden Master. It deliberately does NOT touch
 * ephemeral per-visitor demo clones (slug like "demo-xxxxxxxx",
 * is_golden_master=false, demo_expires_at set — see DemoSessionService) —
 * only tenants that look like failed Golden Master bootstrap attempts.
 */
class DemoCleanupDuplicates extends Command
{
    protected $signature = 'demo:cleanup-duplicates
                            {--force : Skip the confirmation prompt}
                            {--dry-run : List what would happen without changing anything}';

    protected $description = 'Find and merge duplicate/orphaned demo Golden Master tenants left behind by failed updates.';

    public function handle(): int
    {
        // Candidates: anything that looks like a Golden Master bootstrap
        // attempt — slug is exactly 'demo', OR is_demo=true with no expiry
        // (visitor clones always have demo_expires_at set; see
        // DemoSessionService::create()). withTrashed() is essential here:
        // Tenant uses SoftDeletes, `slug` has a DB-level unique index that
        // does NOT exclude soft-deleted rows, and a soft-deleted duplicate
        // "demo" tenant left behind by a prior bug run would otherwise be
        // invisible to this query while still blocking any future
        // Tenant::create(['slug' => 'demo', ...]) with a duplicate-key error.
        $candidates = Tenant::withTrashed()
            ->where(function ($q) {
                $q->where('slug', DemoStoreService::DEFAULT_SLUG)
                  ->orWhere(function ($q2) {
                      $q2->where('is_demo', true)->whereNull('demo_expires_at');
                  });
            })
            ->orderBy('id')
            ->get();

        if ($candidates->isEmpty()) {
            $this->info('No demo tenants found at all. Nothing to clean up.');
            return 0;
        }

        if ($candidates->count() === 1) {
            $only = $candidates->first();
            $this->info("Exactly one demo tenant found (#{$only->id}, slug={$only->slug}). Flagging it as Golden Master.");
            if (!$this->option('dry-run')) {
                $only->update(['is_demo' => true, 'is_golden_master' => true]);
            }
            $this->info('Done.');
            return 0;
        }

        $this->warn("Found {$candidates->count()} duplicate demo tenants:");
        $rows = [];
        foreach ($candidates as $t) {
            $salesCount = Schema::hasTable('sales') ? DB::table('sales')->where('tenant_id', $t->id)->count() : 0;
            $rows[] = [$t->id, $t->slug, $t->is_golden_master ? 'yes' : 'no', $t->created_at, $salesCount];
        }
        $this->table(['ID', 'Slug', 'is_golden_master', 'Created', 'Sales rows'], $rows);

        // Pick the survivor: prefer an existing flagged one; else the tenant
        // with the most sales data (richest / most fully seeded); else the
        // oldest by ID.
        $survivor = $candidates->firstWhere('is_golden_master', true);
        if (!$survivor) {
            $survivor = $candidates->sortByDesc(function ($t) {
                return Schema::hasTable('sales') ? DB::table('sales')->where('tenant_id', $t->id)->count() : 0;
            })->first();
        }

        $toDelete = $candidates->reject(fn ($t) => $t->id === $survivor->id);

        $this->info("Survivor: tenant #{$survivor->id} (slug={$survivor->slug}).");
        $this->warn('Will delete tenants: ' . $toDelete->pluck('id')->implode(', '));

        if ($this->option('dry-run')) {
            $this->info('Dry run — no changes made.');
            return 0;
        }

        if (!$this->option('force') && !$this->confirm('Proceed with deleting the duplicate tenants and their data?')) {
            $this->info('Aborted.');
            return 1;
        }

        DB::transaction(function () use ($survivor, $toDelete) {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');

            foreach ($toDelete as $dup) {
                foreach (DemoStoreService::existingTenantDataTables() as $table) {
                    DB::table($table)->where('tenant_id', $dup->id)->delete();
                }
                // Force-delete the tenant row itself (bypass soft-delete so
                // it can never be resolved again by a stray query).
                DB::table('tenants')->where('id', $dup->id)->delete();
                Log::info("demo:cleanup-duplicates: deleted duplicate demo tenant #{$dup->id} (slug={$dup->slug}).");
            }

            DB::statement('SET FOREIGN_KEY_CHECKS=1;');

            $survivor->update([
                'is_demo'          => true,
                'is_golden_master' => true,
                'slug'             => DemoStoreService::DEFAULT_SLUG,
            ]);
        });

        $this->info("Cleanup complete. Tenant #{$survivor->id} is now the single Golden Master.");
        return 0;
    }
}
