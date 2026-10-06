<?php

namespace App\Observers;

use App\Models\Tenant;
use App\Models\TenantUser;
use App\Services\PlanGate;
use App\Services\SeatAllocationService;

class TenantUserObserver
{
    /**
     * Handle the TenantUser "creating" event.
     * Enforces seat allocation capacity using the unified SeatAllocationService.
     */
    public function creating(TenantUser $tenantUser): void
    {
        $tenantId = $tenantUser->tenant_id ?? (app()->bound('current.tenant') ? app('current.tenant')->id : null);
        if (!$tenantId) {
            return;
        }

        // God Admin / platform bypass
        if (PlanGate::isPlatformContext()) {
            return;
        }

        $tenant = Tenant::find($tenantId);
        if (!$tenant) {
            return;
        }

        $type = $tenantUser->isPosStaff() ? SeatAllocationService::TYPE_POS : SeatAllocationService::TYPE_FULL;

        SeatAllocationService::enforceCanAllocate($tenant, $type);
    }
}
