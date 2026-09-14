<?php

namespace App\Observers;

use App\Models\Register;
use App\Models\Tenant;
use App\Services\PlanGate;

class RegisterObserver
{
    /**
     * Handle the Register "creating" event.
     */
    public function creating(Register $register): void
    {
        $tenantId = $register->tenant_id ?? (app()->bound('current.tenant') ? app('current.tenant')->id : null);
        if (!$tenantId) {
            return;
        }

        // God Admin / platform bypass
        if (PlanGate::isPlatformContext()) {
            return;
        }

        $currentCount = Register::withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->whereNull('deleted_at')
            ->count();

        $tenant = Tenant::find($tenantId);
        if ($tenant) {
            PlanGate::enforce('registers', $currentCount, $tenant);
        }
    }
}
