<?php

namespace App\Services\Commerce;

use App\Models\Commerce\CommerceOrder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Rider deliveries for online-store orders (Phase C).
 *
 * Rules: every query is tenant-scoped; the rider is an `employees` row with is_rider;
 * status changes are idempotent and audited in commerce_delivery_events; customer cash
 * is money owed to the business and is NEVER netted against rider earnings; a rider can
 * not change order amounts, refund, or complete the sale (the manager completes it).
 */
class DeliveryService
{
    /** Forward steps a rider may take. failed/returned are handled separately. */
    public const FLOW = [
        'assigned' => 'accepted',
        'accepted' => 'collected',
        'collected' => 'out_for_delivery',
        'out_for_delivery' => 'delivered',
    ];

    public function __construct(private OrderService $orders)
    {
    }

    private function event(string $deliveryId, int $tenantId, string $type, ?string $from, ?string $to, string $actorType, ?string $actorId, ?string $note = null, ?array $meta = null): void
    {
        DB::table('commerce_delivery_events')->insert([
            'delivery_id' => $deliveryId, 'tenant_id' => $tenantId, 'type' => $type, 'from_status' => $from, 'to_status' => $to,
            'actor_type' => $actorType, 'actor_id' => $actorId, 'note' => $note ? mb_substr($note, 0, 255) : null,
            'meta' => $meta ? json_encode($meta) : null, 'created_at' => now(),
        ]);
    }

    private function lockDelivery(string $id, int $tenantId): object
    {
        $d = DB::table('commerce_deliveries')->where('id', $id)->where('tenant_id', $tenantId)->lockForUpdate()->first();
        if (! $d) {
            throw new CommerceException('Delivery not found.', 'not_found', [], 404);
        }
        return $d;
    }

    private function riderFee(int $tenantId): float
    {
        return (float) (DB::table('settings')->where('tenant_id', $tenantId)->where('key', 'rider_delivery_fee')->value('value') ?? 0);
    }

    /** Manager assigns (or reassigns) a rider to a delivery order. */
    public function assign(string $orderId, int $tenantId, string $riderId, ?int $actor, ?string $note = null): object
    {
        return DB::transaction(function () use ($orderId, $tenantId, $riderId, $actor, $note) {
            $o = CommerceOrder::where('tenant_id', $tenantId)->where('id', $orderId)->lockForUpdate()->first();
            if (! $o) {
                throw new CommerceException('Order not found.', 'not_found', [], 404);
            }
            if ($o->fulfilment !== 'delivery') {
                throw new CommerceException('Only delivery orders can be given to a rider.', 'not_delivery', [], 422);
            }
            if (! in_array($o->status, ['confirmed', 'preparing', 'ready', 'out_for_delivery'], true)) {
                throw new CommerceException('Accept the order before assigning a rider (and not after it is closed).', 'bad_state', [], 409);
            }
            $rider = DB::table('employees')->where('id', $riderId)->where('tenant_id', $tenantId)
                ->where('is_rider', 1)->where('status', 'active')->first();
            if (! $rider) {
                throw new CommerceException('That rider is not available.', 'bad_rider', [], 422);
            }

            $existing = DB::table('commerce_deliveries')->where('order_id', $o->id)->lockForUpdate()->first();
            if ($existing) {
                if (in_array($existing->status, ['delivered'], true)) {
                    throw new CommerceException('This order was already delivered.', 'bad_state', [], 409);
                }
                if ($existing->rider_id === $riderId && ! in_array($existing->status, ['failed', 'returned'], true)) {
                    return DB::table('commerce_deliveries')->where('id', $existing->id)->first(); // idempotent
                }
                DB::table('commerce_deliveries')->where('id', $existing->id)->update([
                    'rider_id' => $riderId, 'status' => 'assigned', 'fail_reason' => null,
                    'assigned_by' => $actor, 'assigned_at' => now(), 'version' => $existing->version + 1, 'updated_at' => now(),
                ]);
                $this->event($existing->id, $tenantId, 'reassigned', $existing->status, 'assigned', 'staff', $actor ? (string) $actor : null, $note, ['from_rider' => $existing->rider_id, 'to_rider' => $riderId]);
                return DB::table('commerce_deliveries')->where('id', $existing->id)->first();
            }

            $id = (string) Str::uuid();
            DB::table('commerce_deliveries')->insert([
                'id' => $id, 'tenant_id' => $tenantId, 'order_id' => $o->id, 'rider_id' => $riderId, 'status' => 'assigned',
                'cash_expected' => ($o->payment_method === 'cod' && $o->payment_status === 'unpaid') ? (float) $o->total : 0,
                'rider_fee' => $this->riderFee($tenantId),
                'assigned_by' => $actor, 'assigned_at' => now(), 'created_at' => now(), 'updated_at' => now(),
            ]);
            $this->event($id, $tenantId, 'assigned', null, 'assigned', 'staff', $actor ? (string) $actor : null, $note);
            return DB::table('commerce_deliveries')->where('id', $id)->first();
        });
    }

    /**
     * Rider moves a delivery. $to is the next step, or 'failed'. Same-target repeat is a no-op (offline retry safe).
     * $riderId is the employee id resolved from the rider's link, never from the request body.
     */
    public function riderStep(string $deliveryId, int $tenantId, string $riderId, string $to, ?float $cashCollected = null, ?string $reason = null): object
    {
        return DB::transaction(function () use ($deliveryId, $tenantId, $riderId, $to, $cashCollected, $reason) {
            $d = $this->lockDelivery($deliveryId, $tenantId);
            if ($d->rider_id !== $riderId) {
                throw new CommerceException('Delivery not found.', 'not_found', [], 404); // never reveal other riders' work
            }
            if ($d->status === $to) {
                return $d;
            }

            if ($to === 'failed') {
                if (! in_array($d->status, ['accepted', 'collected', 'out_for_delivery'], true)) {
                    throw new CommerceException('This delivery cannot be marked failed now.', 'bad_transition', [], 409);
                }
                if (trim((string) $reason) === '') {
                    throw new CommerceException('Say why the delivery failed.', 'reason_required', [], 422);
                }
                DB::table('commerce_deliveries')->where('id', $d->id)->update(['status' => 'failed', 'fail_reason' => mb_substr($reason, 0, 255), 'version' => $d->version + 1, 'updated_at' => now()]);
                $this->event($d->id, $tenantId, 'failed', $d->status, 'failed', 'rider', $riderId, $reason);
                return DB::table('commerce_deliveries')->where('id', $d->id)->first();
            }

            if ((self::FLOW[$d->status] ?? null) !== $to) {
                throw new CommerceException("Cannot move a delivery from {$d->status} to {$to}.", 'bad_transition', [], 409);
            }

            $upd = ['status' => $to, 'version' => $d->version + 1, 'updated_at' => now()];
            if ($to === 'delivered') {
                $upd['delivered_at'] = now();
                if ((float) $d->cash_expected > 0) {
                    $upd['cash_collected'] = $cashCollected ?? (float) $d->cash_expected;
                }
            }
            DB::table('commerce_deliveries')->where('id', $d->id)->update($upd);
            $this->event($d->id, $tenantId, 'status_changed', $d->status, $to, 'rider', $riderId, null,
                $to === 'delivered' && isset($upd['cash_collected']) ? ['cash_collected' => $upd['cash_collected'], 'cash_expected' => (float) $d->cash_expected] : null);

            if ($to === 'out_for_delivery') {
                // Keep the order in step so the manager can complete it after delivery.
                try {
                    $this->orders->advance((string) $d->order_id, $tenantId, null, 'out_for_delivery');
                } catch (CommerceException $e) {
                    // order already past this stage, or not in a state that moves: the delivery still proceeds
                }
            }
            return DB::table('commerce_deliveries')->where('id', $d->id)->first();
        });
    }

    /** Rider is back at the store after a failed delivery. Manager confirms the goods are back. */
    public function markReturned(string $deliveryId, int $tenantId, ?int $actor, ?string $note = null): object
    {
        return DB::transaction(function () use ($deliveryId, $tenantId, $actor, $note) {
            $d = $this->lockDelivery($deliveryId, $tenantId);
            if ($d->status === 'returned') {
                return $d;
            }
            if ($d->status !== 'failed') {
                throw new CommerceException('Only a failed delivery can be marked returned.', 'bad_transition', [], 409);
            }
            DB::table('commerce_deliveries')->where('id', $d->id)->update(['status' => 'returned', 'version' => $d->version + 1, 'updated_at' => now()]);
            $this->event($d->id, $tenantId, 'returned', 'failed', 'returned', 'staff', $actor ? (string) $actor : null, $note);
            return DB::table('commerce_deliveries')->where('id', $d->id)->first();
        });
    }

    /** Manager confirms the cash the rider handed in. A difference is recorded, never hidden or netted. */
    public function acknowledgeCash(string $deliveryId, int $tenantId, ?int $actor, ?float $received = null): object
    {
        return DB::transaction(function () use ($deliveryId, $tenantId, $actor, $received) {
            $d = $this->lockDelivery($deliveryId, $tenantId);
            if ($d->cash_acknowledged_at) {
                return $d; // idempotent
            }
            if ($d->status !== 'delivered' || $d->cash_collected === null) {
                throw new CommerceException('There is no collected cash to acknowledge on this delivery.', 'no_cash', [], 409);
            }
            $received = $received ?? (float) $d->cash_collected;
            DB::table('commerce_deliveries')->where('id', $d->id)->update([
                'cash_acknowledged_at' => now(), 'cash_acknowledged_by' => $actor, 'version' => $d->version + 1, 'updated_at' => now(),
            ]);
            $this->event($d->id, $tenantId, 'cash_acknowledged', null, null, 'staff', $actor ? (string) $actor : null,
                abs($received - (float) $d->cash_collected) > 0.004 ? 'Handed-in amount differs from what the rider recorded' : null,
                ['rider_recorded' => (float) $d->cash_collected, 'manager_received' => $received, 'expected' => (float) $d->cash_expected]);
            return DB::table('commerce_deliveries')->where('id', $d->id)->first();
        });
    }

    /** Cash a rider holds that the manager has not acknowledged yet. */
    public function outstandingCash(int $tenantId, string $riderId): float
    {
        return (float) DB::table('commerce_deliveries')->where('tenant_id', $tenantId)->where('rider_id', $riderId)
            ->where('status', 'delivered')->whereNull('cash_acknowledged_at')->sum('cash_collected');
    }

    /** New rider link: revokes older ones. The plain token is returned once and never stored. */
    public function issueRiderLink(int $tenantId, string $employeeId, ?int $actor): string
    {
        $ok = DB::table('employees')->where('id', $employeeId)->where('tenant_id', $tenantId)->where('is_rider', 1)->exists();
        if (! $ok) {
            throw new CommerceException('That rider was not found.', 'bad_rider', [], 404);
        }
        $token = Str::random(48);
        DB::transaction(function () use ($tenantId, $employeeId, $actor, $token) {
            DB::table('commerce_rider_links')->where('tenant_id', $tenantId)->where('employee_id', $employeeId)->whereNull('revoked_at')->update(['revoked_at' => now(), 'updated_at' => now()]);
            DB::table('commerce_rider_links')->insert([
                'id' => (string) Str::uuid(), 'tenant_id' => $tenantId, 'employee_id' => $employeeId,
                'token_hash' => hash('sha256', $token), 'created_by' => $actor, 'created_at' => now(), 'updated_at' => now(),
            ]);
        });
        return $token;
    }


    public const RIDER_KEY = 'online.rider_deliveries';

    /**
     * Link a store member's login to a rider employee. The member must belong to this store and may not
     * be an owner/admin (they already have wider access and should not be a rider account). A 'custom' member
     * gets exactly one permission: the rider key. Anyone else must be switched to Custom in Staff first, so
     * linking can never silently narrow or widen a working staff member's access.
     */
    public function linkAccount(int $tenantId, string $employeeId, int $userId, ?int $actor): object
    {
        return DB::transaction(function () use ($tenantId, $employeeId, $userId, $actor) {
            if (! DB::table('employees')->where('id', $employeeId)->where('tenant_id', $tenantId)->where('is_rider', 1)->where('status', 'active')->exists()) {
                throw new CommerceException('That rider was not found.', 'bad_rider', [], 404);
            }
            $m = \App\Models\TenantUser::where('tenant_id', $tenantId)->where('user_id', $userId)->where('status', 'active')->lockForUpdate()->first();
            if (! $m) {
                throw new CommerceException('That person is not an active member of this store.', 'bad_member', [], 422);
            }
            if (in_array($m->role, ['owner', 'admin', 'franchise_admin'], true) || $m->isPosStaff()) {
                throw new CommerceException('Owners, admins and POS staff cannot be rider accounts. Invite the rider as a separate Custom staff member.', 'bad_member', [], 422);
            }
            if (DB::table('commerce_rider_accounts')->where('tenant_id', $tenantId)->where('user_id', $userId)->where('employee_id', '!=', $employeeId)->exists()) {
                throw new CommerceException('That login is already linked to another rider.', 'taken', [], 409);
            }
            if ($m->role === 'custom' && $m->permission_override_mode !== 'custom') {
                $m->forceFill(['permission_override_mode' => 'custom', 'permissions' => [self::RIDER_KEY]])->save();
            } elseif ($m->permission_override_mode === 'custom') {
                $perms = is_array($m->permissions) ? $m->permissions : [];
                if (! in_array(self::RIDER_KEY, $perms, true)) {
                    $m->forceFill(['permissions' => array_values(array_merge($perms, [self::RIDER_KEY]))])->save();
                }
            } else {
                throw new CommerceException('Set this person\'s access to Custom in Staff first, so linking does not change their current access.', 'needs_custom', [], 422);
            }

            DB::table('commerce_rider_accounts')->where('employee_id', $employeeId)->delete();
            DB::table('commerce_rider_accounts')->updateOrInsert(
                ['tenant_id' => $tenantId, 'user_id' => $userId],
                ['id' => (string) Str::uuid(), 'employee_id' => $employeeId, 'linked_by' => $actor, 'created_at' => now(), 'updated_at' => now()]
            );
            return DB::table('commerce_rider_accounts')->where('tenant_id', $tenantId)->where('user_id', $userId)->first();
        });
    }

    /** Remove the login link and the rider key from that member. */
    public function unlinkAccount(int $tenantId, string $employeeId): void
    {
        DB::transaction(function () use ($tenantId, $employeeId) {
            $acc = DB::table('commerce_rider_accounts')->where('tenant_id', $tenantId)->where('employee_id', $employeeId)->first();
            if (! $acc) {
                return;
            }
            $m = \App\Models\TenantUser::where('tenant_id', $tenantId)->where('user_id', $acc->user_id)->first();
            if ($m && $m->permission_override_mode === 'custom' && is_array($m->permissions)) {
                $m->forceFill(['permissions' => array_values(array_diff($m->permissions, [self::RIDER_KEY]))])->save();
            }
            DB::table('commerce_rider_accounts')->where('id', $acc->id)->delete();
        });
    }

    /** The rider employee a signed-in store member is linked to, or null. Always scoped by tenant AND user. */
    public function accountFor(int $tenantId, int $userId): ?object
    {
        $a = DB::table('commerce_rider_accounts')->where('tenant_id', $tenantId)->where('user_id', $userId)->first(['tenant_id', 'employee_id']);
        if (! $a) {
            return null;
        }
        $ok = DB::table('employees')->where('id', $a->employee_id)->where('tenant_id', $tenantId)->where('is_rider', 1)->where('status', 'active')->exists();
        return $ok ? $a : null;
    }

    /** Resolve a rider link to [tenant_id, employee_id], or null. */
    public function resolveLink(string $token): ?object
    {
        if (strlen($token) !== 48) {
            return null;
        }
        $l = DB::table('commerce_rider_links')->where('token_hash', hash('sha256', $token))->whereNull('revoked_at')->first(['tenant_id', 'employee_id']);
        if (! $l) {
            return null;
        }
        $active = DB::table('employees')->where('id', $l->employee_id)->where('tenant_id', $l->tenant_id)->where('is_rider', 1)->where('status', 'active')->exists();
        return $active ? $l : null;
    }
}
