<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Services\PlanAiAllowance;
use Illuminate\Console\Command;

/**
 * Brings existing stores' AI meters in line with their plan.
 *
 * New stores get their allowance at provisioning, and any store is healed the
 * first time it uses AI. This command does it for everyone at once so the
 * numbers shown in Billing are right before anyone asks Vena a question.
 *
 *   php artisan ai:backfill-allowance           # report only
 *   php artisan ai:backfill-allowance --apply   # write the changes
 *
 * Stores on their own key (BYOK) and trials are never touched.
 */
class BackfillAiAllowance extends Command
{
    protected $signature = 'ai:backfill-allowance
                            {--apply : Write the changes (default is a dry run)}
                            {--tenant= : Restrict to a single tenant ID}';

    protected $description = 'Set each store\'s AI allowance from its plan (dry run unless --apply)';

    public function handle(): int
    {
        $apply = (bool) $this->option('apply');
        $query = Tenant::query()->where(function ($q) {
            $q->whereNull('ai_status')->orWhere('ai_status', '!=', 'byok');
        });
        if ($this->option('tenant')) {
            $query->whereKey((int) $this->option('tenant'));
        }

        $changed = 0;
        $skipped = 0;

        $query->orderBy('id')->chunkById(200, function ($tenants) use ($apply, &$changed, &$skipped) {
            foreach ($tenants as $tenant) {
                $allowance = PlanAiAllowance::allowanceFor($tenant);
                if ($allowance === null) {
                    $skipped++;
                    continue;
                }

                $same = ($tenant->ai_status ?? 'none') === 'managed'
                    && (int) $tenant->ai_queries_limit === $allowance['queries']
                    && (int) $tenant->ai_pages_limit === $allowance['pages'];
                if ($same) {
                    $skipped++;
                    continue;
                }

                $changed++;
                $this->line(sprintf(
                    '  #%d %-24s %-8s queries %s -> %s, pages %s -> %s',
                    $tenant->id, mb_substr((string) $tenant->name, 0, 24), $tenant->plan,
                    (int) $tenant->ai_queries_limit, $allowance['queries'],
                    (int) $tenant->ai_pages_limit, $allowance['pages']
                ));

                if ($apply) {
                    PlanAiAllowance::applyTo($tenant, $tenant->plan);
                }
            }
        });

        $this->info(($apply ? 'Updated ' : 'Would update ') . "{$changed} store(s); {$skipped} already correct or not eligible.");
        if (!$apply && $changed > 0) {
            $this->line('Re-run with --apply to write.');
        }

        return self::SUCCESS;
    }
}
