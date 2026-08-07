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

            // ── EXPLICIT SAFETY GUARD FOR APPSUMO / LTD TENANTS ─────────────
            // AppSumo / LTD tenants must NEVER be migrated to monthly V4 plans.
            // Their plan slugs are 'ltd', 'ltd_1', 'ltd_2', 'ltd_3' or carry is_ltd.
            if ($oldPlan === 'ltd' || str_starts_with((string)$oldPlan, 'ltd_') || !empty($tenant->plan_limits['is_ltd'])) {
                $this->line("Skipping AppSumo/LTD tenant {$tenant->id} ({$tenant->slug}) — plan remains {$oldPlan}");
                continue;
            }

            // Mapping legacy slugs to V4 matrix
            $newPlan = match ($oldPlan) {
                'lite'       => 'counter',
                'core'       => 'starter',
                'pro'        => 'growth',
                'ultimate'   => 'business',
                default      => $oldPlan, // 'counter', 'starter', 'growth', 'business'
            };

            if ($oldPlan !== $newPlan) {
                if (!$dryRun) {
                    \Illuminate\Support\Facades\DB::table('tenants')
                        ->where('id', $tenant->id)
                        ->update(['plan' => $newPlan]);
                    \App\Services\PlanRepository::invalidateTenantCache($tenant->id);

                    // Send email notification to store owner
                    $ownerEmail = $tenant->ownerEmail();
                    if ($ownerEmail) {
                        try {
                            \Illuminate\Support\Facades\Notification::route('mail', $ownerEmail)
                                ->notify(new \App\Notifications\V4PlanMigratedNotification($oldPlan, $newPlan));
                        } catch (\Throwable $e) {
                            Log::warning("MigrateTenantsToV4: Failed sending email to {$ownerEmail}: " . $e->getMessage());
                        }
                    }
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
