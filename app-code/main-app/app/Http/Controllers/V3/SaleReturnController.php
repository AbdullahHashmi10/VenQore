<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Services\V3\SaleService;
use Illuminate\Http\Request;

class SaleReturnController extends Controller
{
    public function __construct(
        private SaleService $sales
    ) {}

    public function store(Request $request, string $saleId)
    {
        $validated = $request->validate([
            'return_date' => ['required', 'date', 'before_or_equal:today'],
            'reason'      => ['required', 'string', 'max:500'],
            'items'       => ['nullable', 'array'],
            'items.*.sale_item_id' => ['required', 'string', 'exists:sale_items,id'],
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
