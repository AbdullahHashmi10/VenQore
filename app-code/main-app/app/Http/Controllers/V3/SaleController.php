<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Http\Requests\V3\StoreSaleRequest;
use App\Engines\SaleService;
use App\Services\PlanGate;
use App\Models\Sale;
use Carbon\Carbon;

class SaleController extends Controller
{
    public function __construct(
        private SaleService $sales
    ) {}

    public function store(StoreSaleRequest $request)
    {
        $tenantId = app('current.tenant')->id;
        $lock = \Illuminate\Support\Facades\Cache::lock("tenant_{$tenantId}_checkout_lock", 10);

        try {
            $lock->block(5); // Wait up to 5 seconds to acquire the lock

            $date = Carbon::parse($request->input('sale_date', Carbon::now()->toDateString()));
            $start = $date->copy()->startOfMonth();
            $end = $date->copy()->endOfMonth();

            $monthlyCount = Sale::where('status', 'posted')
                ->whereBetween('created_at', [$start, $end])
                ->count();

            PlanGate::enforce('transactions_per_month', $monthlyCount);
            // ─────────────────────────────────────────────────────────────────

            $sale = $this->sales->post($request->validated());
        } finally {
            $lock->release();
        }

        // ── Loyalty auto-award (2026-07-03) — plan-gated, never blocks the sale ──
        $this->awardLoyaltyPointsForSale($sale);

        return redirect()->back()->with([
            'success'    => 'Sale posted successfully.',
            'invoice_id' => $sale->id,
            'invoice_no' => $sale->reference_number,
            'status'     => 'success',
        ]);
    }

    /**
     * Award loyalty points for a posted sale (2026-07-03).
     *
     * - Gated on the `loyalty_points` plan key (Enterprise/ltd_3 per the seeder),
     *   matching the pricing page's "Loyalty & Gift Cards — Enterprise" promise.
     * - Earn rate: `loyalty_earn_rate` in ai_settings = points per 100 currency
     *   units of the sale total (default 1). Configurable per tenant.
     * - NON-FATAL: any failure is logged and swallowed. Loyalty must never
     *   roll back or delay a posted sale — the money engine stays untouched.
     */
    private function awardLoyaltyPointsForSale($sale): void
    {
        try {
            if (!$sale || !$sale->party_id) {
                return;
            }
            if (!\App\Services\PlanGate::check('loyalty_points')) {
                return;
            }

            $tenantId = app('current.tenant')->id;
            $rate = (float) (\Illuminate\Support\Facades\DB::table('ai_settings')
                ->where('tenant_id', $tenantId)
                ->where('key', 'loyalty_earn_rate')
                ->value('value') ?? 1);

            $total  = (float) ($sale->total_amount ?? 0);
            $points = (int) floor(($total / 100) * $rate);

            if ($points < 1) {
                return;
            }

            \App\Models\LoyaltyBalance::awardPoints(
                $sale->party_id,
                $points,
                'Points earned on sale ' . ($sale->reference_number ?? $sale->id),
                null
            );
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Loyalty auto-award failed (sale unaffected): ' . $e->getMessage(), [
                'sale_id' => $sale->id ?? null,
            ]);
        }
    }
}
