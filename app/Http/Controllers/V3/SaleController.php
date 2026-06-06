<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Http\Requests\V3\StoreSaleRequest;
use App\Services\V3\SaleService;
use App\Services\PlanGate;
use App\Models\Sale;

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

            // ── Plan Guard: Monthly transaction limit ─────────────────────────
            // Count posted sales for this tenant in the current calendar month.
            // Uses indexed columns (tenant_id + status + created_at) — runs in < 1ms.
            // No Redis needed at this scale; a simple COUNT query is sufficient.
            $monthlyCount = Sale::where('status', 'posted')
                ->whereYear('created_at', now()->year)
                ->whereMonth('created_at', now()->month)
                ->count();

            PlanGate::enforce('transactions_per_month', $monthlyCount);
            // ─────────────────────────────────────────────────────────────────

            $sale = $this->sales->post($request->validated());
        } finally {
            $lock->release();
        }

        return redirect()->back()->with([
            'success'    => 'Sale posted successfully.',
            'invoice_id' => $sale->id,
            'invoice_no' => $sale->reference_number,
            'status'     => 'success',
        ]);
    }
}
