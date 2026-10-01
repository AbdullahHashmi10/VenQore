<?php

namespace App\Observers;

use App\Models\Product;
use App\Models\Tenant;
use App\Services\PlanGate;

class ProductObserver
{
    /**
     * Handle the Product "creating" event.
     */
    public function creating(Product $product): void
    {
        $tenantId = $product->tenant_id ?? (app()->bound('current.tenant') ? app('current.tenant')->id : null);
        if (!$tenantId) {
            return;
        }

        // God Admin / platform bypass
        if (PlanGate::isPlatformContext()) {
            return;
        }

        $currentCount = Product::withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->whereNull('deleted_at')
            ->count();

        $tenant = Tenant::find($tenantId);
        if ($tenant) {
            PlanGate::enforce('sku_limit', $currentCount, $tenant);
        }
    }
}
