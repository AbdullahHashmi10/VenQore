<?php

namespace App\Http\Middleware;

use App\Services\PlanRepository;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * EnforceTransactionLimit
 *
 * Blocks new sales once a tenant exceeds their monthly transaction allowance.
 *
 * Counting strategy: this reads the live count of posted sales in the current
 * month rather than the `tenants.transactions_this_month` column.
 *
 * The column was added by migration 2026_08_05_000013 and is read here, reset
 * here, and surfaced by PlanUsageController — but **nothing in the codebase ever
 * increments it**. It therefore sat permanently at 0, meaning this middleware
 * never blocked anything and every LTD tenant had an effectively unlimited
 * transaction allowance.
 *
 * Counting live from the `sales` table matches what SaleController::store()
 * already does via PlanGate::enforce(), so both enforcement paths now agree.
 * The counter column is kept in sync below purely so the usage meter and any
 * reporting that reads it show a truthful number.
 */
class EnforceTransactionLimit
{
    public function handle(Request $request, Closure $next): Response
    {
        $tenant = app()->bound('current.tenant')
            ? app('current.tenant')
            : ($request->user() ? \App\Models\Tenant::find($request->user()->last_store_id) : null);

        if ($tenant) {
            $limitStr = PlanRepository::getEffectiveLimit($tenant->id, $tenant->plan ?? 'starter', 'transactions_per_month');

            if ($limitStr !== null && $limitStr !== '' && $limitStr !== '-1') {
                $limit = (int) $limitStr;

                // Authoritative count: max of denormalized column and live count of posted sales in the current calendar month.
                // Tenant-scoped automatically via the Sale model's HasTenant scope.
                $liveCount = \App\Models\Sale::where('status', 'posted')
                    ->whereBetween('created_at', [
                        now()->startOfMonth(),
                        now()->endOfMonth(),
                    ])
                    ->count();

                $used = max((int) $tenant->transactions_this_month, $liveCount);

                // Keep the denormalised counter honest for the usage meter.
                // Only write when it has actually drifted, to avoid an UPDATE on
                // every single sale request.
                if ((int) $tenant->transactions_this_month !== $liveCount
                    || $tenant->transactions_reset_at === null
                    || now()->gte($tenant->transactions_reset_at)) {
                    $tenant->forceFill([
                        'transactions_this_month' => $liveCount,
                        'transactions_reset_at'   => now()->addMonth()->startOfMonth(),
                    ])->saveQuietly();
                }

                if ($used >= $limit) {
                    throw new \App\Exceptions\PlanLimitException('transactions_per_month', $used);
                }
            }
        }

        return $next($request);
    }
}
