<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Services\LemonSqueezyStatus;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;

/**
 * Repairs `tenants.status` rows that drifted away from Lemon Squeezy.
 *
 * Needed because ProvisionTenantJob and LemonSqueezySyncService used to write
 * 'active' unconditionally on a completed checkout. A variant carrying a
 * free-trial period opens its subscription as `on_trial` and bills $0, so those
 * stores were recorded as paying customers while no money had been taken.
 *
 * The mapping is fixed going forward (see LemonSqueezyStatus); this command
 * corrects the rows written before the fix. Read-only by default.
 *
 *   php artisan billing:repair-statuses          # report only
 *   php artisan billing:repair-statuses --apply  # write the corrections
 */
class RepairSubscriptionStatuses extends Command
{
    protected $signature = 'billing:repair-statuses
                            {--apply : Write the corrections (default is a dry run)}
                            {--tenant= : Restrict to a single tenant ID}';

    protected $description = 'Re-sync tenants.status with Lemon Squeezy (fixes trials wrongly marked active)';

    public function handle(): int
    {
        $apiKey = config('services.lemon_squeezy.api_key');

        if (!$apiKey) {
            $this->error('services.lemon_squeezy.api_key is not configured.');
            return self::FAILURE;
        }

        $apply = (bool) $this->option('apply');

        $query = Tenant::whereNotNull('lemon_squeezy_subscription_id');

        if ($tenantId = $this->option('tenant')) {
            $query->where('id', $tenantId);
        }

        $tenants = $query->get();

        if ($tenants->isEmpty()) {
            $this->info('No tenants with a Lemon Squeezy subscription ID.');
            return self::SUCCESS;
        }

        $this->info(($apply ? 'APPLYING' : 'DRY RUN') . " — checking {$tenants->count()} tenant(s).");
        $this->newLine();

        $rows    = [];
        $changed = 0;

        foreach ($tenants as $tenant) {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Accept'        => 'application/vnd.api+json',
            ])->timeout(15)->get(
                'https://api.lemonsqueezy.com/v1/subscriptions/' . $tenant->lemon_squeezy_subscription_id
            );

            if ($response->failed()) {
                $rows[] = [$tenant->id, $tenant->slug, $tenant->status, 'API ERROR', '—'];
                continue;
            }

            $attributes = $response->json('data.attributes') ?? [];
            $lsStatus   = $attributes['status'] ?? null;
            $correct    = LemonSqueezyStatus::toTenantStatus($lsStatus, $tenant->status);

            // Renewal window travels with the status fix: a store wrongly marked
            // active also tends to carry a stale subscription_ends_at.
            $renewal = $attributes['ends_at'] ?? $attributes['renews_at'] ?? null;

            $updates = [];

            if ($tenant->status !== $correct) {
                $updates['status'] = $correct;
            }

            if ($renewal) {
                try {
                    $parsed = Carbon::parse($renewal);

                    if (!$tenant->subscription_ends_at
                        || !$parsed->isSameDay($tenant->subscription_ends_at)) {
                        $updates['subscription_ends_at'] = $parsed;
                    }
                } catch (\Throwable) {
                    // Unparseable date — leave the column alone.
                }
            }

            // A Lemon-Squeezy-side trial should drive our trial countdown too.
            if ($lsStatus === 'on_trial' && ($attributes['trial_ends_at'] ?? null)) {
                try {
                    $updates['trial_ends_at'] = Carbon::parse($attributes['trial_ends_at']);
                } catch (\Throwable) {
                }
            }

            if (empty($updates)) {
                $rows[] = [$tenant->id, $tenant->slug, $tenant->status, $lsStatus, 'ok'];
                continue;
            }

            $changed++;

            if ($apply) {
                $tenant->update($updates);
                \App\Services\PlanRepository::invalidateTenantCache($tenant->id);
            }

            $rows[] = [
                $tenant->id,
                $tenant->slug,
                $tenant->status,
                $lsStatus,
                ($apply ? 'FIXED → ' : 'WOULD FIX → ') . implode(', ', array_keys($updates)),
            ];
        }

        $this->table(['ID', 'Store', 'Local status', 'Lemon Squeezy', 'Action'], $rows);
        $this->newLine();

        if ($changed === 0) {
            $this->info('Every tenant already matches Lemon Squeezy.');
        } elseif ($apply) {
            $this->info("Corrected {$changed} tenant(s).");
        } else {
            $this->warn("{$changed} tenant(s) need correcting. Re-run with --apply to write the changes.");
        }

        return self::SUCCESS;
    }
}
