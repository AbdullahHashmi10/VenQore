<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Models\TenantPlanOverride;
use App\Services\PlanRepository;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class GrandfatherExistingTenants extends Command
{
    protected $signature   = 'venqore:grandfather-tenants';
    protected $aliases     = ['tenants:grandfather-existing'];
    protected $description = 'Grandfather existing tenants with price/feature lock for 12 months via tenant_plan_overrides';

    public function handle(): void
    {
        $tenants = Tenant::withoutTenantScope()
            ->where('is_demo', false)
            ->where('is_internal', false)
            ->get();

        if ($tenants->isEmpty()) {
            $this->info('No existing production tenants to grandfather.');
            return;
        }

        $expiresAt = now()->addMonths(12);

        foreach ($tenants as $tenant) {
            // Lock in existing grandfathered price override
            TenantPlanOverride::updateOrCreate(
                [
                    'tenant_id'    => $tenant->id,
                    'override_key' => 'grandfathered_price_lock',
                ],
                [
                    'override_value' => '1',
                    'expires_at'     => $expiresAt,
                    'reason'         => 'V7 Launch: 12-month grandfathered pricing guarantee',
                ]
            );

            PlanRepository::invalidateTenantCache($tenant);
            Log::info("Grandfathered tenant {$tenant->id} ({$tenant->slug}) until {$expiresAt->toDateString()}");
            $this->info("✓ Grandfathered {$tenant->name} ({$tenant->slug}) until {$expiresAt->toDateString()}");
        }

        $this->info("Successfully processed {$tenants->count()} grandfathered tenant(s).");
    }
}
