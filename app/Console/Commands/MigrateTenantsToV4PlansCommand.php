<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class MigrateTenantsToV4PlansCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:migrate-tenants-v4 {--dry-run : Run migration without modifying database}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate all existing tenants to V4 plan matrix and refresh plan caches';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $dryRun = $this->option('dry-run');

        $this->info($dryRun ? 'Running V4 Plan Migration (DRY RUN)...' : 'Migrating all tenants to V4 plan matrix...');

        $tenants = Tenant::all();
        $migratedCount = 0;

        foreach ($tenants as $tenant) {
            $oldPlan = $tenant->plan;

            // Mapping legacy slugs to V4 matrix
            $newPlan = match ($oldPlan) {
                'lite'       => 'counter',
                'core'       => 'starter',
                'pro'        => 'growth',
                'ultimate'   => 'business',
                default      => $oldPlan, // 'counter', 'starter', 'growth', 'business', 'ltd'
            };

            if ($oldPlan !== $newPlan) {
                if (!$dryRun) {
                    \Illuminate\Support\Facades\DB::table('tenants')
                        ->where('id', $tenant->id)
                        ->update(['plan' => $newPlan]);
                    \App\Services\PlanRepository::invalidateTenantCache($tenant->id);
                }

                $this->line("Tenant {$tenant->id} ({$tenant->slug}): {$oldPlan} -> {$newPlan}");
                Log::info("MigrateTenantsToV4: Tenant {$tenant->id} ({$tenant->slug}) migrated from {$oldPlan} to {$newPlan}");
                $migratedCount++;
            }
        }

        $this->info("Completed V4 Plan Migration for {$migratedCount} tenants.");

        return Command::SUCCESS;
    }
}
