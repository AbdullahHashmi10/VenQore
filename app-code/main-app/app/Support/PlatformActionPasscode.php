<?php

namespace App\Support;

use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

/**
 * The Hashmi Dashboard "action passcode" — a second secret asked before
 * destructive platform actions (purge, impersonate, clear drawings).
 *
 * Stored on users.platform_action_passcode. Passcodes set before 2026-10-11
 * live on a store membership (tenant_user.security_pin at last_store_id ?: 1);
 * check() still accepts those until a passcode is set here, so nobody is
 * locked out. Clearing only clears the user column; a legacy membership PIN
 * then applies again (it is that store's own PIN and is never wiped from here).
 */
final class PlatformActionPasscode
{
    public static function isSet(User $user): bool
    {
        return (bool) self::hash($user);
    }

    public static function check(User $user, string $passcode): bool
    {
        $hash = self::hash($user);

        return $hash !== null && Hash::check($passcode, $hash);
    }

    public static function set(User $user, ?string $passcode): void
    {
        if (self::hasColumn()) {
            $user->forceFill(['platform_action_passcode' => $passcode === null ? null : Hash::make($passcode)])->save();
        }

        // The legacy copy is deliberately NOT cleared: tenant_user.security_pin is
        // also that store's own security PIN (FundController, PartyController…),
        // and the platform owner may really own that store. Once the column is
        // set, check() reads the column only, so the legacy value stops counting.
        if (!self::hasColumn() && $passcode !== null) {
            // Column not migrated yet: keep the old behaviour on an EXISTING membership only.
            TenantUser::where('user_id', $user->id)
                ->where('tenant_id', $user->last_store_id ?: 1)
                ->update(['security_pin' => Hash::make($passcode)]);
        }
    }

    private static function hash(User $user): ?string
    {
        if (self::hasColumn() && !empty($user->platform_action_passcode)) {
            return $user->platform_action_passcode;
        }

        return TenantUser::where('user_id', $user->id)
            ->where('tenant_id', $user->last_store_id ?: 1)
            ->value('security_pin') ?: null;
    }

    private static function hasColumn(): bool
    {
        static $has = null;

        return $has ??= Schema::hasColumn('users', 'platform_action_passcode');
    }
}
