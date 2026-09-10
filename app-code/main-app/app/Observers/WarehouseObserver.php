<?php

namespace App\Observers;

use App\Models\Tenant;
use App\Models\Warehouse;
use App\Services\PlanGate;

class WarehouseObserver
{
    /**
     * Handle the Warehouse "creating" event.
     */
    public function creating(Warehouse $warehouse): void
    {
        $tenantId = $warehouse->tenant_id ?? (app()->bound('current.tenant') ? app('current.tenant')->id : null);
        if (!$tenantId) {
            return;
        }

        // God Admin / platform bypass
        if (PlanGate::isPlatformContext()) {
            return;
        }

        $query = Warehouse::withoutGlobalScopes()->where('tenant_id', $tenantId);
        $currentCount = $query->count();

        $tenant = Tenant::find($tenantId);
        if ($tenant) {
            PlanGate::enforce('locations', $currentCount, $tenant);
        }
    }
}
