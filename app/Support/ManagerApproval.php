<?php

namespace App\Support;

use App\Models\TenantUser;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;

/**
 * Server-side verification of a manager approval (S-011 below-cost sales,
 * S-044 over-limit discounts, B26 bad-debt write-offs).
 *
 * Until this existed the V3 endpoints accepted ANY non-empty `approved_by`
 * value — a cashier could type their own user id (or any id at all) and the
 * rule was bypassed. An approval is now valid only when:
 *
 *   1. the approver is an ACTIVE member of the CURRENT store,
 *   2. their store role is owner, admin or manager, and
 *   3. if the approver is not the logged-in user, the approver's action PIN
 *      (tenant_users.security_pin — the same PIN the elevated-PIN modal,
 *      V3 FundController and StockAdjustmentController check) is supplied
 *      and correct. A manager approving their own action is already
 *      authenticated by their session.
 *
 * Wrong PINs are rate-limited exactly like
 * ProfileSecurityController::verifyElevatedPin() (5 tries / 5 minutes).
 */
class ManagerApproval
{
    public const ROLES = ['owner', 'admin', 'manager'];

    /**
     * @return string|null  null when the approval is valid, otherwise the reason it is not.
     */
    public static function check(int|string|null $approverId, ?string $pin, int|string $tenantId, int|string|null $actorId): ?string
    {
        if ($approverId === null || $approverId === '') {
            return 'Manager approval is required.';
        }

        $membership = TenantUser::where('tenant_id', $tenantId)
            ->where('user_id', $approverId)
            ->where('status', 'active')
            ->first();

        if (!$membership) {
            return 'The approver is not an active member of this store.';
        }

        if (!in_array($membership->role, self::ROLES, true)) {
            return 'Only a manager, admin or owner of this store can approve this.';
        }

        if ((string) $approverId === (string) $actorId) {
            return null;
        }

        $key = 'manager-approval:' . $approverId . ':' . $tenantId;
        if (RateLimiter::tooManyAttempts($key, 5)) {
            return 'Too many incorrect approval PINs. Try again in ' . RateLimiter::availableIn($key) . ' seconds.';
        }

        if (empty($membership->security_pin) || $pin === null || $pin === '' || !Hash::check($pin, $membership->security_pin)) {
            RateLimiter::hit($key, 300);
            return "The approver's PIN is missing or incorrect.";
        }

        RateLimiter::clear($key);
        return null;
    }

    /** Store role of an active member, or null. */
    public static function roleOf(int|string|null $userId, int|string $tenantId): ?string
    {
        if ($userId === null || $userId === '') {
            return null;
        }
        return DB::table('tenant_users')
            ->where('tenant_id', $tenantId)
            ->where('user_id', $userId)
            ->where('status', 'active')
            ->value('role');
    }

    /**
     * Max discount % for a role: this store's own setting first, then the
     * global default (tenant_id NULL). null = no limit configured.
     */
    public static function discountLimit(?string $role, int|string|null $tenantId): ?float
    {
        if ($role === null) {
            return null;
        }
        $value = DB::table('discount_limits')
            ->where('role', $role)
            ->where(function ($q) use ($tenantId) {
                $q->whereNull('tenant_id');
                if ($tenantId !== null) {
                    $q->orWhere('tenant_id', $tenantId);
                }
            })
            ->orderByRaw('tenant_id IS NULL') // store-specific row wins over the global default
            ->value('max_discount_percent');

        return $value === null ? null : (float) $value;
    }
}
