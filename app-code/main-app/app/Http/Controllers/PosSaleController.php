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

        // 0. A replay of a sale that already reached the books is answered with
        //    THAT sale before any shift check: closing the shift must not turn a
        //    committed offline sale into a "rejected" one, and no new sale, shift
        //    or stock effect is created. Content must still match (else 409).
        $intentKey = $request->header('Idempotency-Key') ?: $request->input('idempotency_key');
        if ($intentKey) {
            $replayRequest = clone $request;
            $replayRequest->merge(['items' => $this->normalizeItems($request)]);
            $replay = SaleController::idempotentReplay(
                $tenant->id,
                (string) $intentKey,
                \App\Services\Sales\CheckoutIntent::requestHash($replayRequest->all())
            );
            if ($replay) {
                return $this->asPosted($replay);
            }
        }

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
        $items = $this->normalizeItems($request);

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

        return $this->asPosted(app(SaleController::class)->store($request));
    }

    /**
     * GET /s/{store}/pos/sales/intent/{intentKey} — status of one checkout
     * intent in THIS store. 'committed' with the canonical sale, or
     * 'not_found'. A not_found while the original request may still be in
     * flight is NOT permission to ring the sale under a new key: resend the
     * same key (the database unique index is the final duplicate guard).
     * Another store's sale is never revealed (tenant-scoped lookup).
     */
    public function intentStatus(Request $request, string $intentKey): JsonResponse
    {
        $tenant = app('current.tenant');
        $sale = \App\Models\Sale::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('idempotency_key', $intentKey)
            ->first();
        if (!$sale) {
            return response()->json(['success' => true, 'outcome' => 'not_found', 'idempotency_key' => $intentKey]);
        }
        return response()->json(\App\Services\Sales\CheckoutIntent::canonicalResponse($sale, [
            'status' => $sale->status,
        ]));
    }

    /**
     * POST /s/{store}/pos/queue-status — a till's queue summary on reconnect:
     * per state, how many queued sales it still holds, and how old the oldest
     * unresolved one is. Counts and ages only; stored per store + device and
     * read by `sales:reconcile`. Never affects a sale.
     */
    public function queueStatus(Request $request): JsonResponse
    {
        $states = ['pending', 'uncertain', 'awaiting_auth', 'needs_attention', 'conflict', 'quarantined'];
        $data = $request->validate([
            'device_id'          => ['required', 'string', 'max:64', 'regex:/^[A-Za-z0-9_\-]{8,64}$/'],
            'counts'             => ['present', 'array'],
            'counts.*'           => ['integer', 'min:0', 'max:100000'],
            'oldest_age_seconds' => ['nullable', 'integer', 'min:0', 'max:315360000'],
            'storage_persisted'  => ['nullable', 'boolean'],
            'client_build'       => ['nullable', 'string', 'max:64'],
        ]);
        $counts = [];
        foreach ($states as $st) {
            $counts[$st] = (int) ($data['counts'][$st] ?? 0);
        }
        $unresolved = array_sum($counts);
        $oldest = $unresolved > 0 && isset($data['oldest_age_seconds']) ? now()->subSeconds((int) $data['oldest_age_seconds']) : null;
        $tenant = app('current.tenant');

        if (\Illuminate\Support\Facades\Schema::hasTable('pos_queue_telemetry')) {
            \Illuminate\Support\Facades\DB::table('pos_queue_telemetry')->upsert([[
                'tenant_id' => $tenant->id, 'device_id' => $data['device_id'], 'user_id' => auth()->id(),
                'counts' => json_encode($counts), 'unresolved' => $unresolved, 'oldest_unresolved_at' => $oldest,
                'storage_persisted' => $data['storage_persisted'] ?? null, 'client_build' => $data['client_build'] ?? null,
                'reported_at' => now(), 'created_at' => now(), 'updated_at' => now(),
            ]], ['tenant_id', 'device_id'], ['user_id', 'counts', 'unresolved', 'oldest_unresolved_at', 'storage_persisted', 'client_build', 'reported_at', 'updated_at']);
        }

        $stuck = $oldest !== null && $oldest->lt(now()->subHour());
        \App\Support\SaleEvents::record('till_queue_status', [
            'device_id' => $data['device_id'], 'counts' => $counts, 'unresolved' => $unresolved,
            'oldest_age_seconds' => $data['oldest_age_seconds'] ?? null, 'storage_persisted' => $data['storage_persisted'] ?? null,
        ], $stuck || $counts['needs_attention'] + $counts['conflict'] + $counts['quarantined'] > 0 ? 'warning' : 'info');

        return response()->json(['success' => true, 'unresolved' => $unresolved]);
    }

    private function normalizeItems(Request $request): array
    {
        return collect((array) $request->input('items', []))->map(function ($item) {
            $item = (array) $item;
            $item['quantity'] = $item['quantity'] ?? $item['qty'] ?? 1;
            $item['price'] = $item['price'] ?? $item['unit_price'] ?? 0;
            return $item;
        })->all();
    }

    private function asPosted($response)
    {
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
