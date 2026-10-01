<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Occupancy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Dispatch — the screen a dispatcher uses to run a delivery service.
 *
 * WHY THIS IS SEPARATE FROM THE FLOOR
 * ------------------------------------
 * The floor plan is about tables. A delivery dispatch screen is about time,
 * riders and addresses. They do not share a mental model. A dispatcher
 * managing twelve active deliveries does not want to scroll past twenty
 * dine-in tables to find them, and a floor manager does not need the delivery
 * feed cluttering their spatial view of the room. One screen, one job.
 *
 * The floor keeps a single summary chip per delivery ticket. This screen
 * carries the full picture.
 */
class DispatchController extends Controller
{
    /** Render the dispatch SPA page. */
    public function index(Request $request): Response
    {
        $this->ensurePreparesOrders();
        $tenant = app('current.tenant');

        return Inertia::render('Restaurant/Dispatch', [
            'storeSlug' => $tenant->slug,
            'orders'    => $this->deliveryQueue($tenant->id),
            'riders'    => $this->riderList($tenant->id),
        ]);
    }

    /** JSON poll — same shape as the initial page prop. */
    public function state(Request $request): JsonResponse
    {
        $this->ensurePreparesOrders();
        $tenant = app('current.tenant');

        return response()->json([
            'orders' => $this->deliveryQueue($tenant->id),
            'riders' => $this->riderList($tenant->id),
        ]);
    }

    /**
     * Rider cash-up for a given rider and date.
     *
     * Returns all deliveries assigned to that rider on that date so the manager
     * can see expected cash, collected cash, and variance.
     */
    public function riderCashUp(Request $request): JsonResponse
    {
        $this->ensurePreparesOrders();
        $tenant = app('current.tenant');
        $data   = $request->validate([
            'rider_id' => 'required|string',
            'date'     => 'nullable|date_format:Y-m-d',
        ]);

        $date = $data['date'] ?? now()->toDateString();

        $rider = Employee::where('tenant_id', $tenant->id)->findOrFail($data['rider_id']);

        $occs = Occupancy::where('tenant_id', $tenant->id)
            ->whereNull('position_id')
            ->whereDate('opened_at', $date)
            ->get(['id', 'label', 'session_data', 'closed_at']);

        $deliveries = [];
        $totalExpected  = 0.0;
        $totalCollected = 0.0;

        foreach ($occs as $occ) {
            $sd = $occ->session_data ?? [];
            if (($sd['order_type'] ?? '') !== 'delivery') continue;
            $del = $sd['delivery'] ?? [];
            if (($del['rider_id'] ?? null) !== $rider->id) continue;

            $orderTotal     = round((float) ($sd['order_total'] ?? 0), 2);
            $fee            = round((float) ($del['fee'] ?? 0), 2);
            $expectedCash   = round($orderTotal + $fee, 2);
            $collectedAmount = round((float) ($del['collected_amount'] ?? 0), 2);
            $paymentMethod  = $del['payment_method'] ?? 'cash';
            $handedIn       = !empty($del['cash_handed_in']);

            $totalExpected  += $paymentMethod === 'cash' ? $expectedCash : 0;
            $totalCollected += $paymentMethod === 'cash' ? $collectedAmount : 0;

            $deliveries[] = [
                'occupancy_id'    => $occ->id,
                'code'            => $occ->label,
                'status'          => $del['status'] ?? 'placed',
                'customer_name'   => $sd['customer_name'] ?? '',
                'address'         => $sd['address'] ?? '',
                'order_total'     => $orderTotal,
                'delivery_fee'    => $fee,
                'expected_cash'   => $expectedCash,
                'collected_amount'=> $collectedAmount,
                'payment_method'  => $paymentMethod,
                'cash_handed_in'  => $handedIn,
                'commission_rate' => (float) ($del['commission_rate'] ?? 0),
                'commission_due'  => round($orderTotal * ((float) ($del['commission_rate'] ?? 0) / 100), 2),
                'closed_at'       => $occ->closed_at?->toIso8601String(),
            ];
        }

        return response()->json([
            'rider'           => ['id' => $rider->id, 'name' => $rider->name],
            'date'            => $date,
            'deliveries'      => $deliveries,
            'total_expected'  => round($totalExpected, 2),
            'total_collected' => round($totalCollected, 2),
            'variance'        => round($totalCollected - $totalExpected, 2),
        ]);
    }

    /**
     * Mark a set of deliveries as cash_handed_in = true.
     * Called when a rider returns and hands over their cash.
     */
    public function markHandedIn(Request $request): JsonResponse
    {
        $this->ensurePreparesOrders();
        $tenant = app('current.tenant');
        $data   = $request->validate([
            'occupancy_ids'   => 'required|array|min:1',
            'occupancy_ids.*' => 'integer',
            'collected_amounts' => 'nullable|array',
        ]);

        $updated = 0;
        foreach ($data['occupancy_ids'] as $idx => $occId) {
            $occ = Occupancy::where('tenant_id', $tenant->id)->find($occId);
            if (!$occ) continue;

            $session  = $occ->session_data ?? [];
            $delivery = $session['delivery'] ?? [];

            $delivery['cash_handed_in'] = true;
            if (isset($data['collected_amounts'][$idx])) {
                $delivery['collected_amount'] = round((float) $data['collected_amounts'][$idx], 2);
            }

            $session['delivery']  = $delivery;
            $occ->session_data    = $session;
            $occ->save();
            $updated++;
        }

        return response()->json(['updated' => $updated]);
    }

    // ── Private helpers ────────────────────────────────────────────────────

    /**
     * Abort 404 if the store does not have kitchen order preparation enabled.
     */
    private function ensurePreparesOrders(): void
    {
        $tenant = app('current.tenant');
        $preparesOrders = \App\Models\Setting::where('tenant_id', $tenant->id)
            ->where('key', 'prepares_orders')
            ->value('value');

        if ((string) $preparesOrders !== '1') {
            abort(404, 'Page not found.');
        }
    }

    private function deliveryQueue(int $tenantId): array
    {
        /* Today's open deliveries + delivered in last 4 hours. */
        $today   = now()->startOfDay();
        $cutoff  = now()->subHours(4);

        $occs = Occupancy::with('user')
            ->where('tenant_id', $tenantId)
            ->whereNull('position_id')
            ->where(function ($q) use ($today, $cutoff) {
                $q->whereNull('closed_at')
                  ->orWhere('closed_at', '>=', $cutoff);
            })
            ->where('opened_at', '>=', $today)
            ->orderBy('opened_at')
            ->get();

        $shaped = [];
        foreach ($occs as $occ) {
            $sd  = $occ->session_data ?? [];
            if (($sd['order_type'] ?? '') !== 'delivery') continue;

            $del = $sd['delivery'] ?? [];
            $status = $del['status'] ?? 'placed';

            // is_late: out longer than eta_minutes
            $isLate = false;
            if ($status === 'out' && !empty($del['eta_minutes']) && !empty($del['status_at'])) {
                $minutesOut = max(0, (int) floor((time() - strtotime($del['status_at'])) / 60));
                $isLate     = $minutesOut > (int) $del['eta_minutes'];
            }

            $shaped[] = [
                'occupancy_id'   => $occ->id,
                'code'           => $occ->label,
                'customer_name'  => $sd['customer_name'] ?? '',
                'phone'          => $sd['phone'] ?? '',
                'address'        => $sd['address'] ?? '',
                'order_total'    => round((float) ($sd['order_total'] ?? 0), 2),
                'opened_at'      => $occ->opened_at?->toIso8601String(),
                'closed_at'      => $occ->closed_at?->toIso8601String(),
                'delivery'       => [
                    'status'           => $status,
                    'status_at'        => $del['status_at'] ?? null,
                    'rider'            => $del['rider'] ?? '',
                    'rider_id'         => $del['rider_id'] ?? null,
                    'fee'              => (float) ($del['fee'] ?? 0),
                    'eta_minutes'      => isset($del['eta_minutes']) ? (int) $del['eta_minutes'] : null,
                    'note'             => $del['note'] ?? '',
                    'payment_method'   => $del['payment_method'] ?? 'cash',
                    'collected_amount' => (float) ($del['collected_amount'] ?? 0),
                    'cash_handed_in'   => !empty($del['cash_handed_in']),
                    'tracking_token'   => $del['tracking_token'] ?? null,
                    'is_late'          => $isLate,
                ],
                'server'         => $occ->user ? ['name' => $occ->user->name] : null,
            ];
        }

        return $shaped;
    }

    private function riderList(int $tenantId): array
    {
        return Employee::where('tenant_id', $tenantId)
            ->riders()
            ->orderBy('name')
            ->get(['id', 'name', 'commission_rate'])
            ->map(fn ($r) => [
                'id'              => $r->id,
                'name'            => $r->name,
                'commission_rate' => (float) $r->commission_rate,
            ])
            ->all();
    }
}
