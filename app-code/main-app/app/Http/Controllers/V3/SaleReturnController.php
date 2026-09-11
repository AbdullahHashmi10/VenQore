<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Engines\SaleService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SaleReturnController extends Controller
{
    public function __construct(
        private SaleService $sales
    ) {}

    public function store(Request $request, string $saleId)
    {
        // Each returned line must be a line of THIS sale, in this store.
        $validated = $request->validate([
            'return_date' => ['required', 'date', 'before_or_equal:today'],
            'reason'      => ['required', 'string', 'max:500'],
            'items'       => ['nullable', 'array'],
            'items.*.sale_item_id' => ['required', 'string', Rule::exists('sale_items', 'id')
                ->where('tenant_id', app('current.tenant')->id)
                ->where('sale_id', $saleId)],
            'items.*.return_qty'   => ['required', 'numeric', 'min:0.0001'],
        ]);

        $this->sales->reverse(
            saleId:     $saleId,
            reason:     $validated['reason'],
            returnDate: $validated['return_date'],
            items:      $validated['items'] ?? []
        );

        return redirect()->back()->with('success', 'Sale return posted.');
    }
}
