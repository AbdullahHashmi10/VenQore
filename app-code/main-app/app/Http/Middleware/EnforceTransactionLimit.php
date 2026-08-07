<?php

namespace App\Http\Middleware;

use App\Services\PlanRepository;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

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

                // Reset monthly counter if target date is reached
                if ($tenant->transactions_reset_at && now()->gte($tenant->transactions_reset_at)) {
                    $tenant->update([
                        'transactions_this_month' => 0,
                        'transactions_reset_at'   => now()->addMonth(),
                    ]);
                }

                if ($tenant->transactions_this_month >= $limit) {
                    if ($request->expectsJson()) {
                        return response()->json([
                            'error'   => "Monthly transaction limit reached ({$limit} transactions). Upgrade your plan or add transaction top-ups to process more sales.",
                            'code'    => 'TRANSACTION_LIMIT_REACHED',
                            'limit'   => $limit,
                            'current' => $tenant->transactions_this_month,
                        ], 403);
                    }

                    return redirect()->back()->with('error', "Monthly transaction limit reached ({$limit} transactions). Upgrade your plan to continue processing sales.");
                }
            }
        }

        return $next($request);
    }
}
