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
    /** Where a ticket can be printed. `none` = kitchen screen only, no paper. */
    public const PRINTERS = ['kitchen', 'bar', 'receipt', 'none'];

    /*
    | KITCHEN ROUTING — ONE PLACE UNLESS THE SHOP SAYS OTHERWISE
    | -----------------------------------------------------------
    | Tickets used to split on whatever free text sat in products.kitchen_station,
    | so a menu imported with "Grill", "Fryer", "Pasta Station" and "Beverage Bar"
    | sprayed one order across five tickets nobody had asked for. The owner now
    | decides, in the register's Kitchen settings:
    |
    |   single    every item on ONE ticket (the default, and the safe answer for
    |             a kitchen that has not set anything up)
    |   stations  items are split across the stations the owner created; an item
    |             goes to the first station that claims it by product, then by
    |             category, then (optionally) by the station name already typed
    |             on the product. Anything unclaimed goes to the main kitchen.
    |
    | Stored as one JSON row, `kitchen_routing`, in settings.
    */
    public static function normaliseRouting($raw): array
    {
        if (is_string($raw)) {
            $raw = json_decode($raw, true);
        }
        $raw = is_array($raw) ? $raw : [];

        $mainName = mb_substr(trim((string) ($raw['main_name'] ?? '')), 0, 32);
        if ($mainName === '') {
            $mainName = 'Kitchen';
        }

        /* Product and category keys are UUIDs (older rows may be integers), so
           they are kept as strings and only ever compared as strings. */
        $ids = function ($list): array {
            $out = [];
            foreach ((array) $list as $v) {
                if (!is_scalar($v)) {
                    continue;
                }
                $v = trim((string) $v);
                if ($v !== '' && strlen($v) <= 64 && preg_match('/^[A-Za-z0-9-]+$/', $v)) {
                    $out[$v] = true;
                }
            }
            return array_slice(array_map('strval', array_keys($out)), 0, 500);
        };

        $stations = [];
        $seen = [mb_strtolower($mainName) => true];
        foreach (array_slice((array) ($raw['stations'] ?? []), 0, 24) as $s) {
            if (!is_array($s)) {
                continue;
            }
            $name = mb_substr(trim((string) ($s['name'] ?? '')), 0, 32);
            if ($name === '' || isset($seen[mb_strtolower($name)])) {
                continue;
            }
            $seen[mb_strtolower($name)] = true;
            $id = preg_replace('/[^a-zA-Z0-9_-]/', '', (string) ($s['id'] ?? ''));
            $stations[] = [
                'id'         => $id !== '' ? mb_substr($id, 0, 40) : ('st_' . substr(md5($name), 0, 10)),
                'name'       => $name,
                'printer'    => in_array($s['printer'] ?? null, self::PRINTERS, true) ? $s['printer'] : 'kitchen',
                'categories' => $ids($s['categories'] ?? []),
                'products'   => $ids($s['products'] ?? []),
            ];
        }

        return [
            'mode'             => ($raw['mode'] ?? 'single') === 'stations' ? 'stations' : 'single',
            'main_name'        => $mainName,
            'main_printer'     => in_array($raw['main_printer'] ?? null, self::PRINTERS, true) ? $raw['main_printer'] : 'kitchen',
            'use_product_tags' => !array_key_exists('use_product_tags', $raw) || (bool) $raw['use_product_tags'],
            'stations'         => $stations,
        ];
    }

    public static function routingFor(int $tenantId): array
    {
        $value = Setting::withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->where('key', 'kitchen_routing')
            ->value('value');

        return self::normaliseRouting($value);
    }

    /**
     * Returns fn(array $line): ['name' => station, 'printer' => role].
     * Products are looked up once per fire, never per line.
     */
    public function stationResolver(int $tenantId, array $lines): \Closure
    {
        $cfg = self::routingFor($tenantId);
        $main = ['name' => $cfg['main_name'], 'printer' => $cfg['main_printer']];

        if ($cfg['mode'] !== 'stations' || empty($cfg['stations'])) {
            return fn (array $line) => $main;
        }

        $ids = array_values(array_unique(array_filter(array_map(fn ($l) => (string) ($l['id'] ?? ''), $lines))));
        $products = empty($ids) ? collect() : Product::where('tenant_id', $tenantId)
            ->whereIn('id', $ids)
            ->get(['id', 'category_id', 'kitchen_station'])
            ->keyBy(fn ($p) => (string) $p->id);

        $byProduct = [];
        $byCategory = [];
        $byName = [];
        foreach ($cfg['stations'] as $st) {
            $entry = ['name' => $st['name'], 'printer' => $st['printer']];
            foreach ($st['products'] as $pid) {
                $byProduct[(string) $pid] ??= $entry;
            }
            foreach ($st['categories'] as $cid) {
                $byCategory[(string) $cid] ??= $entry;
            }
            $byName[mb_strtolower($st['name'])] = $entry;
        }
        $useTags = $cfg['use_product_tags'];

        return function (array $line) use ($products, $byProduct, $byCategory, $byName, $main, $useTags) {
            $pid = (string) ($line['id'] ?? '');
            if ($pid !== '' && isset($byProduct[$pid])) {
                return $byProduct[$pid];
            }
            $p = $pid !== '' ? $products->get($pid) : null;
            $cid = $p && $p->category_id ? (string) $p->category_id : '';
            if ($cid !== '' && isset($byCategory[$cid])) {
                return $byCategory[$cid];
            }
            if ($useTags) {
                $tag = mb_strtolower(trim((string) ($line['kitchen_station'] ?? ($p?->kitchen_station ?? ''))));
                if ($tag !== '' && isset($byName[$tag])) {
                    return $byName[$tag];
                }
            }
            return $main;
        };
    }

    /** The printer a station's tickets go to, for reprints of tickets fired earlier. */
    public static function printerForStation(int $tenantId, ?string $station): string
    {
        $cfg = self::routingFor($tenantId);
        $name = mb_strtolower(trim((string) $station));
        foreach ($cfg['stations'] as $st) {
            if (mb_strtolower($st['name']) === $name) {
                return $st['printer'];
            }
        }
        return $cfg['main_printer'];
    }

    /**
     * Fire unsent lines from an open occupancy to the kitchen.
     * Supports:
     * - One ticket, or one ticket per station (see normaliseRouting)
     * - Coursing with hold & release
     */
    public function fireOccupancy(Occupancy $occ, ?array $cart = null, array $options = []): array
    {
        $tenantId = $occ->tenant_id;
        $session = $occ->session_data ?? [];
        $currentCart = $cart ?? ($session['cart'] ?? []);

        $stationFor = $this->stationResolver((int) $tenantId, $currentCart);

        $targetCourse = isset($options['only_course']) && $options['only_course'] !== null
            ? (int) $options['only_course']
            : null;

        $eligibleIndices = [];
        $eligibleLines = [];

        foreach ($currentCart as $idx => $line) {
            $qty = (float) ($line['qty'] ?? 1);
            $sentQty = (float) ($line['sent_qty'] ?? (!empty($line['sent']) ? $qty : 0));
            $unsentDelta = max(0, $qty - $sentQty);

            if ($unsentDelta <= 0 && !empty($line['sent'])) {
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

            $st = $stationFor($line);

            $lineCopy = $line;
            $lineCopy['qty'] = $unsentDelta;
            $lineCopy['resolved_station'] = $st['name'];
            $lineCopy['resolved_printer'] = $st['printer'];
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

        // Group eligible lines by station and course. Keyed by a hash rather
        // than "station:course" because a station name is owner-typed text and
        // may itself contain a colon.
        $groups = [];
        foreach ($eligibleLines as $line) {
            $key = md5($line['resolved_station'] . "\0" . $line['resolved_course']);
            $groups[$key] ??= [
                'station' => $line['resolved_station'],
                'printer' => $line['resolved_printer'],
                'course'  => $line['resolved_course'],
                'lines'   => [],
            ];
            $groups[$key]['lines'][] = $line;
        }

        $workOrders = [];
        $kots = [];

        DB::transaction(function () use (
            $tenantId, $occ, $orderType, $occLabel, $serverName, $groups,
            $eligibleIndices, &$session, &$currentCart, &$workOrders, &$kots
        ) {
            foreach ($groups as $group) {
                $station = $group['station'];
                $course = (int) $group['course'];
                $lines = $group['lines'];

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
                    'printer_role'  => $group['printer'],
                ]);
            }

            // Mark fired items as sent and unheld in occupancy, recording sent_qty
            foreach ($eligibleIndices as $idx) {
                $currentCart[$idx]['sent_qty'] = (float) ($currentCart[$idx]['qty'] ?? 1);
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
     * Send an accepted ONLINE order (the public shop, not the table QR) to the
     * kitchen. Online orders live in their own table and never had a floor tab,
     * so nothing used to tell the kitchen they existed. This writes the same
     * kitchen work orders the register does, routed by the same station rules,
     * but without inventing a table or a till tab: the order stays owned by the
     * online-orders inbox, which still decides payment and hand-over.
     *
     * Safe to call twice (it will not duplicate) and never throws for the
     * caller's sake: the order is already accepted, the kitchen ticket must not
     * be able to undo that.
     *
     * @return WorkOrder[] the tickets created (empty when nothing was needed)
     */
    public function fireOnlineOrder(\App\Models\Commerce\CommerceOrder $order): array
    {
        $tenantId = (int) $order->tenant_id;

        $alreadySent = DB::table('commerce_order_events')
            ->where('order_id', $order->id)->where('type', 'kitchen_sent')->exists();
        if ($alreadySent) {
            return [];
        }

        $prepares = Setting::where('tenant_id', $tenantId)->where('key', 'prepares_orders')->value('value');
        if ((string) $prepares === '0') {
            return [];
        }

        $lines = [];
        foreach ($order->items()->orderBy('created_at')->get() as $it) {
            $mods = $it->mods ?? [];
            if (is_string($mods)) {
                $mods = json_decode($mods, true) ?: [];
            }
            $lines[] = [
                'id'    => (string) $it->product_id,
                'name'  => (string) $it->title,
                'qty'   => (float) $it->quantity,
                'notes' => (string) ($it->notes ?? ''),
                'mods'  => array_values($mods),
            ];
        }
        if (empty($lines)) {
            return [];
        }

        $stationFor = $this->stationResolver($tenantId, $lines);
        $groups = [];
        foreach ($lines as $line) {
            $st = $stationFor($line);
            $key = md5($st['name']);
            $groups[$key] ??= ['station' => $st['name'], 'lines' => []];
            $groups[$key]['lines'][] = $line;
        }

        $orderType = $order->fulfilment === 'delivery' ? 'delivery' : 'takeaway';
        $workOrders = [];

        DB::transaction(function () use ($tenantId, $order, $orderType, $groups, &$workOrders) {
            foreach ($groups as $group) {
                $workOrders[] = WorkOrder::create([
                    'tenant_id'     => $tenantId,
                    'kind'          => 'kitchen',
                    'order_type'    => $orderType,
                    'occupancy_id'  => null,
                    'position_code' => 'ONLINE',
                    'station'       => $group['station'],
                    'course'        => 1,
                    'order_number'  => (string) $order->public_number,
                    'items'         => array_map(fn ($l) => [
                        'name'      => $l['name'],
                        'qty'       => $l['qty'],
                        'notes'     => $l['notes'],
                        'course'    => 1,
                        'mods'      => $l['mods'],
                        'modifiers' => array_map(fn ($m) => (string) ($m['name'] ?? ''), $l['mods']),
                    ], $group['lines']),
                    'status'        => 'pending',
                    'fired_at'      => now(),
                ]);
            }
            DB::table('commerce_order_events')->insert([
                'order_id' => $order->id, 'tenant_id' => $tenantId, 'type' => 'kitchen_sent',
                'from_status' => $order->status, 'to_status' => $order->status,
                'actor_type' => 'system', 'note' => count($workOrders) . ' kitchen ticket(s)',
                'created_at' => now(),
            ]);
        });

        return $workOrders;
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
            /* Which of this till's printers the ticket belongs on: kitchen, bar,
               receipt — or none, when the station works from the kitchen screen
               only. Reprints look it up again from the station's name. */
            'printer_role'    => $options['printer_role']
                ?? self::printerForStation((int) $workOrder->tenant_id, $workOrder->station),
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
            'station'         => self::routingFor((int) $occ->tenant_id)['main_name'],
            'printer_role'    => self::routingFor((int) $occ->tenant_id)['main_printer'],
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
