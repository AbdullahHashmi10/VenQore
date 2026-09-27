<?php

namespace App\Http\Controllers;

use App\Models\RegisterShift;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PosSaleController extends Controller
{
    /**
     * Dedicated POS sale checkout endpoint.
     * Enforces server-side register shift verification.
     */
    public function store(Request $request): JsonResponse
    {
        $tenant = app('current.tenant');
        $user = auth()->user();

        // 1. Server-Side Shift Verification (Never trust client claims)
        $registerId = $request->input('register_id');
        $shiftQuery = RegisterShift::where('tenant_id', $tenant->id)
            ->where('status', 'open')
            ->where('opened_by', $user->id);

        if ($registerId) {
            $shiftQuery->where('register_id', $registerId);
        }

        $openShift = $shiftQuery->latest('id')->first();
        $isTrustedPos = ($openShift !== null);

        if (!$isTrustedPos) {
            return response()->json([
                'success' => false,
                'message' => 'POS Checkout requires an active, open cash register shift for the current cashier.',
                'errors'  => [
                    'register_shift' => ['No open register shift found for this cashier in the current store. Please open a shift before checkout.'],
                ],
            ], 422);
        }

        // Reuse the canonical checkout implementation after adding only
        // server-derived POS trust. This preserves discounts, split payments,
        // taxes, serials, FIFO costing and manager-PIN validation in one path.
        $items = collect((array) $request->input('items', []))->map(function (array $item) {
            $item['quantity'] = $item['quantity'] ?? $item['qty'] ?? 1;
            $item['price'] = $item['price'] ?? $item['unit_price'] ?? 0;
            return $item;
        })->all();

        $request->merge([
            'items' => $items,
            'register_shift_id' => $openShift->id,
            'register_id' => $openShift->register_id,
            'source' => 'pos',
        ]);
        $request->attributes->set('trusted_pos_verified', true);

        $response = app(SaleController::class)->store($request);
        if ($response instanceof JsonResponse && $response->getStatusCode() === 200) {
            $data = $response->getData(true);
            if (($data['success'] ?? false) === true) {
                $data['status'] = 'posted';
                $response->setData($data)->setStatusCode(201);
            }
        }

        return $response;
    }
}
