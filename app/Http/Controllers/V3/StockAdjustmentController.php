<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Services\V3\InventoryService;
use Illuminate\Http\Request;

class StockAdjustmentController extends Controller
{
    public function __construct(
        private InventoryService $inventory
    ) {}

    public function store(Request $request)
    {
        $rules = [
            'product_id'   => ['required', 'string', 'exists:products,id'],
            'warehouse_id' => ['required', 'string', 'exists:warehouses,id'],
            'direction'    => ['required', 'in:increase,decrease'],
            'qty'          => ['required', 'numeric', 'min:0.0001'],
            'unit_cost'    => ['required_if:direction,increase',
                              'nullable', 'numeric', 'min:0.01'],
            'reason'       => ['required', 'string', 'max:500'],
        ];

        $enablePasscode = \App\Helpers\SettingsHelper::get('enable_passcode') === '1';
        if ($enablePasscode) {
            $rules['passcode'] = ['required', 'string', 'size:6'];
        }

        $validated = $request->validate($rules);

        if ($enablePasscode) {
            $membership = \App\Models\TenantUser::where('tenant_id', app('current.tenant')->id)
                ->where('user_id', \Illuminate\Support\Facades\Auth::id())
                ->first();
            if (!$membership || !$membership->security_pin || !\Illuminate\Support\Facades\Hash::check($request->passcode, $membership->security_pin)) {
                if ($request->wantsJson()) {
                    return response()->json(['message' => 'Incorrect security PIN. Action blocked.'], 403);
                }
                return redirect()->back()->with('error', 'Incorrect security PIN. Action blocked.');
            }
        }

        // InventoryService handles both B10 and B11 including journal posting
        $this->inventory->adjustStock(
            productId:   $validated['product_id'],
            warehouseId: $validated['warehouse_id'],
            qty:         (float) $validated['qty'],
            direction:   $validated['direction'],
            unitCost:    (float) ($validated['unit_cost'] ?? 0),
            reason:      $validated['reason']
        );

        return redirect()->back()
            ->with('success', 'Stock adjustment posted.');
    }
}
