<?php

namespace App\Services;

use App\Exceptions\PlanLimitException;
use App\Models\StaffInvitation;
use App\Models\Tenant;
use App\Models\TenantPlanOverride;
use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * SeatAllocationService
 *
 * Single source of truth for seat allocation, quotas, capacity tracking,
 * and reservation lifecycles across Full staff and POS staff memberships.
 */
class SeatAllocationService
{
    const TYPE_FULL = 'full';
    const TYPE_POS  = 'pos';

    /**
     * Get real-time capacity and reservation metrics for a tenant.
     *
     * @param Tenant $tenant
     * @param string $type 'full' | 'pos'
     * @return array
     */
    public static function getCapacity(Tenant $tenant, string $type = self::TYPE_FULL): array
    {
        $type = ($type === self::TYPE_POS) ? self::TYPE_POS : self::TYPE_FULL;

        // 1. Included plan limit
        $limitKey = ($type === self::TYPE_POS) ? 'pos_staff_limit' : 'staff_limit';
        $included = $tenant->getLimit($limitKey);

        if ($included === 'unlimited' || $included === null) {
            $isUnlimited = true;
            $includedInt = null;
        } else {
            $isUnlimited = false;
            $includedInt = (int) $included;
        }

        // 2. Purchased capacity from tenant overrides / add-ons
        $overrideKey = ($type === self::TYPE_POS) ? 'extra_pos_seats' : 'extra_full_seats';
        $purchased = (int) (TenantPlanOverride::withoutTenantScope()
            ->where('tenant_id', $tenant->id)
            ->where('override_key', $overrideKey)
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->value('override_value') ?? 0);

        // Also check legacy/alternative keys for extra seats
        if ($type === self::TYPE_FULL && $purchased === 0) {
            $purchased = (int) (TenantPlanOverride::withoutTenantScope()
                ->where('tenant_id', $tenant->id)
                ->whereIn('override_key', ['extra_seats', 'extra_seat'])
                ->where(function ($q) {
                    $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
                })
                ->value('override_value') ?? 0);
        }

        $totalCapacity = $isUnlimited ? null : ($includedInt + $purchased);

        // 3. Active memberships
        $activeQuery = TenantUser::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('status', 'active');

        if ($type === self::TYPE_POS) {
            $activeQuery->where(function ($q) {
                $q->where('membership_type', self::TYPE_POS)
                  ->orWhere(function ($sub) {
                      $sub->whereNull('membership_type')->where('role', 'cashier');
                  });
            });
        } else {
            $activeQuery->where(function ($q) {
                $q->where('membership_type', self::TYPE_FULL)
                  ->orWhere(function ($sub) {
                      $sub->whereNull('membership_type')->where('role', '!=', 'cashier');
                  });
            });
        }
        $activeCount = $activeQuery->count();

        // 4. Reserved invitations (pending or no_account, non-expired)
        $reservedQuery = StaffInvitation::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->whereIn('status', ['pending', 'no_account'])
            ->where('expires_at', '>', now());

        if ($type === self::TYPE_POS) {
            $reservedQuery->where(function ($q) {
                $q->where('membership_type', self::TYPE_POS)
                  ->orWhere(function ($sub) {
                      $sub->whereNull('membership_type')->where('role', 'cashier');
                  });
            });
        } else {
            $reservedQuery->where(function ($q) {
                $q->where('membership_type', self::TYPE_FULL)
                  ->orWhere(function ($sub) {
                      $sub->whereNull('membership_type')->where('role', '!=', 'cashier');
                  });
            });
        }
        $reservedCount = $reservedQuery->count();

        $usedCount = $activeCount + $reservedCount;
        $remaining = $isUnlimited ? 999999 : max(0, $totalCapacity - $usedCount);
        $canAllocate = $isUnlimited || ($usedCount < $totalCapacity);

        $planSlug = strtolower($tenant->plan ?? 'starter');
        $isSolo = ($planSlug === 'solo');

        return [
            'type'            => $type,
            'is_unlimited'    => $isUnlimited,
            'included'        => $includedInt,
            'purchased'       => $purchased,
            'total_available' => $totalCapacity,
            'active'          => $activeCount,
            'reserved'        => $reservedCount,
            'used'            => $usedCount,
            'remaining'       => $isUnlimited ? null : $remaining,
            'can_allocate'    => $canAllocate,
            'can_buy_addon'   => !$isSolo && !$isUnlimited,
            'price_per_month' => ($type === self::TYPE_POS) ? 5 : 15,
        ];
    }

    /**
     * Get complete usage breakdown for both Full and POS seats for the UI.
     */
    public static function getUsageSummary(Tenant $tenant): array
    {
        $full = self::getCapacity($tenant, self::TYPE_FULL);
        $pos  = self::getCapacity($tenant, self::TYPE_POS);

        $isPosEnabled = PlanGate::check('pos', $tenant);

        return [
            'full_seats' => [
                'type'            => 'full',
                'title'           => 'Full staff seat',
                'description'     => 'Store membership with business permissions assigned by owner. Includes owner in allowance.',
                'active'          => $full['active'],
                'reserved'        => $full['reserved'],
                'used'            => $full['used'],
                'total_available' => $full['total_available'],
                'remaining'       => $full['remaining'],
                'included'        => $full['included'],
                'purchased'       => $full['purchased'],
                'can_allocate'    => $full['can_allocate'],
                'can_buy_addon'   => $full['can_buy_addon'],
                'addon_price'     => 15,
                'is_unlimited'    => $full['is_unlimited'],
            ],
            'pos_seats' => [
                'type'            => 'pos',
                'title'           => 'POS staff seat',
                'description'     => 'Restricted to POS checkout, taking orders, and handling returns.',
                'active'          => $pos['active'],
                'reserved'        => $pos['reserved'],
                'used'            => $pos['used'],
                'total_available' => $pos['total_available'],
                'remaining'       => $pos['remaining'],
                'included'        => $pos['included'],
                'purchased'       => $pos['purchased'],
                'can_allocate'    => $pos['can_allocate'] && $isPosEnabled,
                'can_buy_addon'   => $pos['can_buy_addon'] && $isPosEnabled,
                'addon_price'     => 5,
                'is_unlimited'    => $pos['is_unlimited'],
                'is_pos_enabled'  => $isPosEnabled,
            ],
        ];
    }

    /**
     * Enforce seat allocation capability within a database transaction and store lock.
     * Throws PlanLimitException or ValidationException if no capacity is remaining.
     *
     * @param Tenant $tenant
     * @param string $type
     * @throws PlanLimitException|ValidationException
     */
    public static function enforceCanAllocate(Tenant $tenant, string $type = self::TYPE_FULL): void
    {
        $type = ($type === self::TYPE_POS) ? self::TYPE_POS : self::TYPE_FULL;

        if ($type === self::TYPE_POS && !PlanGate::check('pos', $tenant)) {
            throw ValidationException::withMessages([
                'seat' => ['POS module is disabled for this store. POS staff seats cannot be allocated.'],
            ]);
        }

        // Lock tenant row for update to prevent concurrent allocation race conditions
        DB::table('tenants')->where('id', $tenant->id)->lockForUpdate()->first();

        $capacity = self::getCapacity($tenant, $type);

        if (!$capacity['can_allocate']) {
            $limitKey = ($type === self::TYPE_POS) ? 'pos_staff_limit' : 'staff_limit';
            throw new PlanLimitException(
                $limitKey,
                $capacity['used'],
                $capacity['total_available']
            );
        }
    }

    /**
     * Atomically accept an invitation and convert the reservation into an active membership.
     * Prevents double-counting by consuming the reservation in the same transaction.
     */
    public static function consumeInvitation(StaffInvitation $invitation, User $user, array $attributes = []): TenantUser
    {
        return DB::transaction(function () use ($invitation, $user, $attributes) {
            $tenant = Tenant::withoutGlobalScopes()->where('id', $invitation->tenant_id)->lockForUpdate()->firstOrFail();

            $type = ($invitation->membership_type === self::TYPE_POS) ? self::TYPE_POS : self::TYPE_FULL;

            // Find existing membership or instantiate new
            $membership = TenantUser::withoutGlobalScopes()
                ->where('tenant_id', $tenant->id)
                ->where('user_id', $user->id)
                ->first();

            if ($membership && $membership->status === 'active') {
                // Already active, just mark invite accepted
                $invitation->update([
                    'status'      => 'active',
                    'accepted_at' => now(),
                    'approved_at' => now(),
                ]);
                return $membership;
            }

            if (!$membership) {
                $membership = new TenantUser();
                $membership->tenant_id = $tenant->id;
                $membership->user_id   = $user->id;
            }

            $membership->membership_type      = $type;
            $membership->pos_capabilities     = $invitation->pos_capabilities;
            $membership->assigned_location_id = $invitation->assigned_location_id;
            $membership->role                 = $type === self::TYPE_POS ? 'cashier' : $invitation->primaryRole();
            $membership->status               = 'active';
            $membership->display_name         = $invitation->invitee_name;
            $membership->permissions          = $type === self::TYPE_POS ? $membership->getDerivedPosPermissions() : ($invitation->permissions ?? []);
            $membership->transaction_approval_mode = $type === self::TYPE_POS ? 'inherit' : ($invitation->transaction_approval_mode ?? 'inherit');
            $membership->joined_at            = now();

            foreach ($attributes as $k => $v) {
                $membership->{$k} = $v;
            }

            $membership->save();

            // Mark invitation consumed
            $invitation->update([
                'status'      => 'active',
                'accepted_at' => now(),
                'approved_at' => now(),
            ]);

            return $membership;
        });
    }

    /**
     * Atomically convert a membership between POS staff and Full staff.
     */
    public static function convertMembership(TenantUser $membership, string $targetType, array $options = []): void
    {
        $targetType = ($targetType === self::TYPE_POS) ? self::TYPE_POS : self::TYPE_FULL;
        $currentType = $membership->isPosStaff() ? self::TYPE_POS : self::TYPE_FULL;

        if ($currentType === $targetType) {
            return;
        }

        if ($membership->role === 'owner') {
            abort(403, 'Owner cannot be converted to POS staff.');
        }

        DB::transaction(function () use ($membership, $targetType, $options) {
            $tenant = Tenant::withoutGlobalScopes()->where('id', $membership->tenant_id)->lockForUpdate()->firstOrFail();

            // Enforce capacity for target type
            self::enforceCanAllocate($tenant, $targetType);

            if ($targetType === self::TYPE_POS) {
                // Full -> POS
                $caps = $options['pos_capabilities'] ?? [TenantUser::CAP_TAKE_ORDERS, TenantUser::CAP_TAKE_PAYMENTS];
                if (empty($caps)) {
                    throw ValidationException::withMessages([
                        'pos_capabilities' => ['At least one POS capability must be selected.'],
                    ]);
                }

                $membership->membership_type      = self::TYPE_POS;
                $membership->pos_capabilities     = array_values(array_intersect($caps, TenantUser::POS_CAPABILITIES));
                $membership->assigned_location_id = $options['assigned_location_id'] ?? $membership->assigned_location_id;
                $membership->role                 = 'cashier';
                $membership->permissions          = $membership->getDerivedPosPermissions();
                $membership->transaction_approval_mode = 'inherit';
                $membership->permission_override_mode  = 'inherit';
                $membership->custom_role_name          = null;
                $membership->save();

            } else {
                // POS -> Full
                $role = $options['role'] ?? 'manager';
                if ($role === 'owner') {
                    abort(403, 'Cannot convert member to owner.');
                }

                $membership->membership_type      = self::TYPE_FULL;
                $membership->pos_capabilities     = null;
                $membership->role                 = $role;
                $membership->permissions          = $options['permissions'] ?? config("permissions.{$role}", []);
                $membership->permission_override_mode = $options['permission_override_mode'] ?? 'inherit';
                $membership->custom_role_name     = $options['custom_role_name'] ?? null;
                $membership->save();
            }
        });
    }

    /**
     * Release capacity upon member suspension or removal.
     */
    public static function releaseOnSuspension(TenantUser $membership): void
    {
        DB::transaction(function () use ($membership) {
            $membership->update(['status' => 'suspended']);

            // Close any active open shift for this user
            \App\Models\RegisterShift::withoutGlobalScopes()
                ->where('tenant_id', $membership->tenant_id)
                ->where('opened_by', $membership->user_id)
                ->where('status', 'open')
                ->update([
                    'status'               => 'closed',
                    'closed_by'            => auth()->id() ?? $membership->user_id,
                    'closed_at'            => now(),
                    'manager_close_reason' => 'Closed due to staff suspension.',
                ]);
        });
    }
}
