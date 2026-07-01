<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Http\Requests\V3\StoreSaleRequest;
use App\Services\V3\SaleService;
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

        return redirect()->back()->with([
            'success'    => 'Sale posted successfully.',
            'invoice_id' => $sale->id,
            'invoice_no' => $sale->reference_number,
            'status'     => 'success',
        ]);
    }
}
