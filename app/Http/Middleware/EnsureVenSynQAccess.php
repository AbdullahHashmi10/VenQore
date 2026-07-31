<?php

namespace App\Http\Middleware;

use App\Services\PlanGate;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * EnsureVenSynQAccess — gate for the VenSynQ multi-channel engine.
 *
 * Two layers:
 *   1. Platform switch  — config('vensynq.enabled') (SuperAdmin toggle / .env).
 *   2. Plan feature     — 'vensync_command' flag on the tenant's plan
 *                         (PlanFeatureMatrixSeeder Group 6). Tenants whose plan
 *                         doesn't include it get a 403 with an upgrade message
 *                         instead of silently accessing the module.
 *
 * Note: plans with no 'vensync_command' limit defined at all resolve to
 * null (= unlimited) and are allowed, so legacy/custom plans don't break.
 */
class EnsureVenSynQAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $dbValue = null;
        try {
            $dbValue = \Illuminate\Support\Facades\Cache::remember('vensynq_enabled_flag', 60, function () {
                return \App\Models\Setting::withoutGlobalScopes()
                    ->whereNull('tenant_id')
                    ->where('key', 'vensynq_enabled')
                    ->value('value');
            });
        } catch (\Throwable $e) {
            // Database not ready or migration running
        }

        $enabled = $dbValue !== null ? (bool) $dbValue : (bool) config('vensynq.enabled', false);

        if (!$enabled) {
            abort(404);
        }

        if (!PlanGate::check('vensync_command')) {
            abort(403, 'VenSynQ multi-channel sync is not included in your current plan. Please upgrade to unlock marketplace integrations.');
        }

        return $next($request);
    }
}
