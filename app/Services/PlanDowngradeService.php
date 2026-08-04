<?php

namespace App\Services;

use App\Models\Tenant;
use App\Models\Product;
use App\Models\TenantUser;
use App\Models\Warehouse;
use Illuminate\Support\Facades\DB;

class PlanDowngradeService
{
    /**
     * Check if a tenant is allowed to downgrade to target plan.
     */
    public function validateDowngrade(Tenant $tenant, string $targetPlanSlug): array
    {
        $targetLimits = PlanRepository::getLimits($targetPlanSlug);
        $reasons = [];

        // 1. Check open payables & receivables balance
        $openReceivables = DB::table('parties')
            ->where('tenant_id', $tenant->id)
            ->where('type', 'customer')
            ->where('current_balance', '>', 0)
            ->sum('current_balance');

        $openPayables = DB::table('parties')
            ->where('tenant_id', $tenant->id)
            ->where('type', 'supplier')
            ->where('current_balance', '>', 0)
            ->sum('current_balance');

        $isTargetCounter = ($targetPlanSlug === 'counter');
        if ($isTargetCounter && ($openReceivables > 0 || $openPayables > 0)) {
            $reasons[] = "You have active receivables (Rs " . number_format($openReceivables, 2) . ") or payables (Rs " . number_format($openPayables, 2) . "). Settle or archive balances before downgrading to Counter.";
        }

        // 2. Check SKU limit
        $targetSkuLimit = isset($targetLimits['sku_limit']) ? (int) $targetLimits['sku_limit'] : null;
        if ($targetSkuLimit > 0) {
            $skuCount = Product::where('tenant_id', $tenant->id)->count();
            if ($skuCount > $targetSkuLimit) {
                $reasons[] = "Your current SKU count ({$skuCount}) exceeds the {$targetPlanSlug} limit of {$targetSkuLimit}.";
            }
        }

        // 3. Check staff limit
        $targetStaffLimit = isset($targetLimits['staff_limit']) ? (int) $targetLimits['staff_limit'] : null;
        if ($targetStaffLimit > 0) {
            $staffCount = TenantUser::where('tenant_id', $tenant->id)->where('status', 'active')->count();
            if ($staffCount > $targetStaffLimit) {
                $reasons[] = "Your active staff count ({$staffCount}) exceeds the {$targetPlanSlug} limit of {$targetStaffLimit}. Remove seats to continue.";
            }
        }

        // 4. Check location limit
        $targetLocationLimit = isset($targetLimits['location_limit']) ? (int) $targetLimits['location_limit'] : null;
        if ($targetLocationLimit > 0) {
            $locationCount = Warehouse::where('tenant_id', $tenant->id)->count();
            if ($locationCount > $targetLocationLimit) {
                $reasons[] = "Your location count ({$locationCount}) exceeds the {$targetPlanSlug} limit of {$targetLocationLimit}.";
            }
        }

        return [
            'allowed' => empty($reasons),
            'reasons' => $reasons,
        ];
    }
}
