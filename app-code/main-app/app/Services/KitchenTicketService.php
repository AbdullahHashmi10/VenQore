<?php

namespace App\Services;

use App\Models\Occupancy;
use App\Models\WorkOrder;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Product;
use App\Models\Setting;
use Illuminate\Support\Facades\DB;

class KitchenTicketService
{
    /**
     * Fire unsent lines from an open occupancy to the kitchen.
     * Supports:
     * - Multi-station splitting (e.g. bar vs kitchen vs grill)
     * - Coursing with hold & release
     */
    public function fireOccupancy(Occupancy $occ, ?array $cart = null, array $options = []): array
    {
        $tenantId = $occ->tenant_id;
        $session = $occ->session_data ?? [];
        $currentCart = $cart ?? ($session['cart'] ?? []);

        // Resolve product stations for products in cart
        $productIds = array_filter(array_column($currentCart, 'id'));
        $productStations = [];
        if (!empty($productIds)) {
            $productStations = Product::where('tenant_id', $tenantId)
                ->whereIn('id', $productIds)
                ->pluck('kitchen_station', 'id')
                ->toArray();
        }

        $targetCourse = isset($options['only_course']) && $options['only_course'] !== null
            ? (int) $options['only_course']
            : null;

        $eligibleIndices = [];
        $eligibleLines = [];

        foreach ($currentCart as $idx => $line) {
            if (!empty($line['sent'])) {
                continue; // Already sent
            }

            $lineCourse = (int) ($line['course'] ?? 1);
            $isHeld = !empty($line['is_held']);

            if ($targetCourse !== null) {
                // Firing/releasing a specific course
                if ($lineCourse !== $targetCourse) {
                    continue;
                }
            } else {
                // Normal fire: skip held lines (held courses fire on demand)
                if ($isHeld) {
                    continue;
                }
            }

            $st = $line['kitchen_station']
                ?? ($productStations[$line['id'] ?? 0] ?? 'kitchen')
                ?: 'kitchen';

            $lineCopy = $line;
            $lineCopy['resolved_station'] = $st;
            $lineCopy['resolved_course'] = $lineCourse;

            $eligibleIndices[] = $idx;
            $eligibleLines[] = $lineCopy;
        }

        if (empty($eligibleLines)) {
            return [
                'sent_count'  => 0,
                'message'     => 'Nothing new to send.',
                'kot'         => null,
                'kots'        => [],
                'work_order'  => null,
                'work_orders' => [],
                'occupancy'   => $occ,
            ];
        }

        $orderType = $session['order_type'] ?? ($occ->position_id ? 'dine_in' : 'takeaway');
        $occLabel = $occ->label ?: ($occ->position?->code ?: ('#' . $occ->id));
        $serverName = $occ->user?->name ?? (auth()->user()?->name ?? 'Server');

        // Group eligible lines by station and course
        $groups = [];
        foreach ($eligibleLines as $line) {
            $station = $line['resolved_station'];
            $course = $line['resolved_course'];
            $key = $station . ':' . $course;
            $groups[$key][] = $line;
        }

        $workOrders = [];
        $kots = [];

        DB::transaction(function () use (
            $tenantId, $occ, $orderType, $occLabel, $serverName, $groups,
            $eligibleIndices, &$session, &$currentCart, &$workOrders, &$kots
        ) {
            foreach ($groups as $groupKey => $lines) {
                [$station, $course] = explode(':', $groupKey);
                $course = (int) $course;

                $wo = WorkOrder::create([
                    'tenant_id'     => $tenantId,
                    'kind'          => 'kitchen',
                    'order_type'    => $orderType,
                    'occupancy_id'  => $occ->id,
                    'position_code' => $occ->position?->code ?? $occLabel,
                    'station'       => $station,
                    'course'        => $course,
                    'order_number'  => $occLabel,
                    'items'         => array_map(fn ($l) => [
                        'name'      => $l['name'],
                        'qty'       => (float) ($l['qty'] ?? 1),
                        'notes'     => $l['notes'] ?? '',
                        'course'    => $course,
                        'mods'      => array_values($l['mods'] ?? []),
                        'modifiers' => array_map(fn ($m) => (string) ($m['name'] ?? ''), array_values($l['mods'] ?? [])),
                    ], $lines),
                    'status'        => 'pending',
                    'fired_at'      => now(),
                ]);

                $workOrders[] = $wo;
                $kots[] = $this->formatKot($wo, $occ, [
                    'server_name'   => $serverName,
                    'customer_name' => $session['customer_name'] ?? null,
                ]);
            }

            // Mark fired items as sent and unheld in occupancy
            foreach ($eligibleIndices as $idx) {
                $currentCart[$idx]['sent'] = true;
                $currentCart[$idx]['is_held'] = false;
            }
            $session['cart'] = $currentCart;
            $session['sent_at'] = now()->toIso8601String();
            $occ->session_data = $session;
            $occ->save();
        });

        return [
            'sent_count'  => count($eligibleLines),
            'work_orders' => $workOrders,
            'work_order'  => $workOrders[0] ?? null,
            'kots'        => $kots,
            'kot'         => $kots[0] ?? null,
            'occupancy'   => $occ->fresh(),
        ];
    }

    /**
     * Fire an order directly from a counter till (without requiring a floor plan or pre-existing table).
     * Automatically creates a takeaway lane occupancy and fires it to the kitchen.
     */
    public function fireCounter(int $tenantId, array $cart, array $meta = [], ?User $user = null): array
    {
        $userId = $user?->id ?? auth()->id();
        $serverName = $user?->name ?? (auth()->user()?->name ?? 'Cashier');

        // Generate next ticket code for Takeaway
        $code = $this->generateNextTicketNumber($tenantId, 'takeaway');

        $session = [
            'order_type'    => $meta['order_type'] ?? 'takeaway',
            'covers'        => 0,
            'cart'          => array_map(fn ($l) => array_merge($l, ['sent' => false]), $cart),
            'order_total'   => 0.0,
            'note'          => (string) ($meta['note'] ?? ''),
            'customer_name' => (string) ($meta['customer_name'] ?? ''),
            'phone'         => (string) ($meta['phone'] ?? ''),
            'sent_at'       => null,
        ];

        $occ = Occupancy::create([
            'tenant_id'    => $tenantId,
            'position_id'  => null,
            'label'        => $code,
            'party_id'     => $meta['party_id'] ?? null,
            'opened_by'    => $userId,
            'opened_at'    => now(),
            'session_data' => $session,
        ]);

        $res = $this->fireOccupancy($occ, $session['cart'], [
            'station'     => $meta['station'] ?? null,
            'only_course' => $meta['course'] ?? null,
        ]);

        return [
            'occupancy_id' => $occ->id,
            'ticket_code'  => $code,
            'sent_count'   => $res['sent_count'],
            'work_orders'  => $res['work_orders'],
            'work_order'   => $res['work_order'],
            'kots'         => $res['kots'],
            'kot'          => $res['kot'],
            'occupancy'    => $occ->fresh(),
        ];
    }

    /**
     * Format a clean KOT docket payload ready for ESC/POS or browser thermal printing.
     * STRICTLY NO PRICES. Bold legible hierarchy for kitchen environments.
     */
    public function formatKot(WorkOrder $workOrder, ?Occupancy $occ = null, array $options = []): array
    {
        $orderType = $workOrder->order_type ?? 'dine_in';
        $typeBanner = match ($orderType) {
            'takeaway' => 'TAKEAWAY',
            'delivery' => 'DELIVERY',
            default    => 'DINE-IN',
        };

        $server = $options['server_name']
            ?? $occ?->user?->name
            ?? auth()->user()?->name
            ?? 'Staff';

        $customer = $options['customer_name']
            ?? $occ?->session_data['customer_name']
            ?? '';

        $firedAt = $workOrder->fired_at ?? now();

        return [
            'ticket_id'       => $workOrder->id,
            'order_number'    => $workOrder->order_number,
            'table_number'    => $workOrder->position_code ?: $workOrder->order_number,
            'order_type'      => $orderType,
            'order_type_badge'=> $typeBanner,
            'customer_name'   => $customer,
            'server_name'     => $server,
            'station'         => $workOrder->station ?: 'kitchen',
            'printer_name'    => $options['printer_name'] ?? null,
            'course'          => (int) ($workOrder->course ?? 1),
            'fired_at'        => $firedAt->toIso8601String(),
            'fired_at_human'  => $firedAt->format('h:i A · d M Y'),
            'items'           => array_map(fn ($it) => [
                'name'      => $it['name'] ?? 'Item',
                'qty'       => (float) ($it['qty'] ?? 1),
                'notes'     => $it['notes'] ?? '',
                'course'    => (int) ($it['course'] ?? $workOrder->course ?? 1),
                'modifiers' => $it['modifiers'] ?? (
                    isset($it['mods']) && is_array($it['mods'])
                        ? array_map(fn ($m) => is_array($m) ? ($m['name'] ?? '') : (string) $m, $it['mods'])
                        : []
                ),
            ], $workOrder->items ?? []),
            'is_reprint'      => (bool) ($options['is_reprint'] ?? false),
            'is_cancellation' => (bool) ($options['is_cancellation'] ?? false),
        ];
    }

    /**
     * Build reprint KOT payload.
     */
    public function reprint(WorkOrder $workOrder): array
    {
        return $this->formatKot($workOrder, $workOrder->occupancy, [
            'is_reprint' => true,
        ]);
    }

    /**
     * Build cancellation KOT docket payload for voided lines.
     */
    public function formatCancellation(Occupancy $occ, array $cancelledItems): array
    {
        $orderType = $occ->session_data['order_type'] ?? ($occ->position_id ? 'dine_in' : 'takeaway');
        $typeBanner = match ($orderType) {
            'takeaway' => 'TAKEAWAY',
            'delivery' => 'DELIVERY',
            default    => 'DINE-IN',
        };

        return [
            'ticket_id'       => $occ->id,
            'order_number'    => $occ->label ?: ('#' . $occ->id),
            'table_number'    => $occ->position?->code ?: ($occ->label ?: ('#' . $occ->id)),
            'order_type'      => $orderType,
            'order_type_badge'=> $typeBanner,
            'customer_name'   => $occ->session_data['customer_name'] ?? '',
            'server_name'     => auth()->user()?->name ?? 'Staff',
            'station'         => 'kitchen',
            'course'          => 1,
            'fired_at'        => now()->toIso8601String(),
            'fired_at_human'  => now()->format('h:i A · d M Y'),
            'items'           => array_map(fn ($it) => [
                'name'      => $it['name'] ?? 'Item',
                'qty'       => (float) ($it['qty'] ?? 1),
                'notes'     => $it['notes'] ?? 'CANCELLED BY WAITER/CASHIER',
                'modifiers' => $it['modifiers'] ?? [],
            ], $cancelledItems),
            'is_reprint'      => false,
            'is_cancellation' => true,
        ];
    }

    private function generateNextTicketNumber(int $tenantId, string $orderType): string
    {
        $prefix = $orderType === 'delivery' ? 'D' : 'T';
        $todayStart = now()->startOfDay();

        $count = Occupancy::withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->where('opened_at', '>=', $todayStart)
            ->whereJsonContains('session_data->order_type', $orderType)
            ->count();

        return sprintf('%s-%03d', $prefix, $count + 1);
    }
}
