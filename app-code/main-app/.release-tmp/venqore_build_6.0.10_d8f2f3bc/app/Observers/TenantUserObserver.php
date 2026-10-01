<?php

namespace App\Observers;

use App\Models\Tenant;
use App\Models\TenantUser;
use App\Services\PlanGate;

class TenantUserObserver
{
    /**
     * Handle the TenantUser "creating" event.
     * Cashiers are free & unlimited till logins and do not consume a seat.
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

        // Till logins / cashier accounts
        if ($tenantUser->role === 'cashier') {
            $tillLoginsCount = TenantUser::where('tenant_id', $tenantId)
                ->where('role', 'cashier')
                ->whereIn('status', ['active', 'invited'])
                ->count();

            PlanGate::enforce('till_logins', $tillLoginsCount, $tenant);
            return;
        }

        $fullSeatsCount = TenantUser::where('tenant_id', $tenantId)
            ->where('role', '!=', 'cashier')
            ->whereIn('status', ['active', 'invited'])
            ->count();

        PlanGate::enforce('staff_limit', $fullSeatsCount, $tenant);
    }
}
