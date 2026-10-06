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

        // 1. Server-Side Shift & Capability Verification (Never trust client claims)
        $membership = \App\Models\TenantUser::where('tenant_id', $tenant->id)
            ->where('user_id', $user->id)
            ->first();

        $isPosStaff = $membership?->isPosStaff() ?? false;
        $isOwner = ($membership?->role === 'owner') || $user->isPlatformAdmin();

        if ($isPosStaff && !$membership->hasPosCapability(\App\Models\TenantUser::CAP_TAKE_PAYMENTS)) {
            return response()->json([
                'success' => false,
                'message' => 'Your POS staff role does not have permission to take payments and complete checkout.',
            ], 403);
        }

        $registerId = $request->input('register_id');
        $shiftQuery = RegisterShift::where('tenant_id', $tenant->id)
            ->where('status', 'open');

        if ($isOwner) {
            // Owners have no mandatory personal shift; they can use an open station shift or owner session
            if ($registerId) {
                $shiftQuery->where('register_id', $registerId);
            }
        } else {
            // POS staff must have their own open shift
            $shiftQuery->where('opened_by', $user->id);
            if ($registerId) {
                $shiftQuery->where('register_id', $registerId);
            }
        }

        $openShift = $shiftQuery->latest('id')->first();
        $isTrustedPos = ($openShift !== null || $isOwner);

        if (!$isOwner && !$openShift) {
            return response()->json([
                'success' => false,
                'message' => 'POS Checkout requires an active, open shift for the current cashier.',
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

        $mergeData = [
            'items' => $items,
            'source' => 'pos',
        ];

        if ($openShift) {
            $mergeData['register_shift_id'] = $openShift->id;
            $mergeData['register_id'] = $openShift->register_id;
        }

        if ($request->filled('order_taker_id')) {
            $mergeData['order_taker_id'] = $request->input('order_taker_id');
        }

        $request->merge($mergeData);
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
