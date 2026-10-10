<?php

namespace App\Support;

use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Http\RedirectResponse;

/**
 * Where a user goes once a FULL session has been granted (after the emailed
 * code, or after a verified Google sign-in). Extracted from
 * AuthenticatedSessionController so every entry point routes identically.
 *
 *   invite pending → accept invite
 *   gift pending   → gift page
 *   0 stores       → create-or-join
 *   1 store        → that store
 *   2+ stores      → last used store, else hub
 */
class PostLoginRedirect
{
    public static function for(User $user): RedirectResponse
    {
        if ($redirect = InviteRedirect::pending()) {
            return $redirect;
        }

        if ($redirect = GiftRedirect::pending()) {
            return $redirect;
        }

        $memberships = TenantUser::where('user_id', $user->id)
            ->where('status', 'active')
            ->with('tenant')
            ->get()
            ->filter(fn ($m) => in_array($m->tenant?->status, ['trial', 'active', 'suspended']));

        if ($memberships->isEmpty()) {
            return redirect()->route('store.create-or-join');
        }

        if ($memberships->count() === 1) {
            $m = $memberships->first();
            if (self::isRider($m)) {
                return redirect()->route('store.commerce.my-rides', ['store_slug' => $m->tenant->slug]);
            }
            if ($m->isPosStaff()) {
                return redirect()->route('store.pos', ['store_slug' => $m->tenant->slug]);
            }
            return redirect()->route('store.dashboard', ['store_slug' => $m->tenant->slug]);
        }

        if ($user->last_store_id) {
            $last = $memberships->firstWhere('tenant_id', $user->last_store_id);
            if ($last && $last->tenant) {
                if (self::isRider($last)) {
                    return redirect()->route('store.commerce.my-rides', ['store_slug' => $last->tenant->slug]);
                }
                if ($last->isPosStaff()) {
                    return redirect()->route('store.pos', ['store_slug' => $last->tenant->slug]);
                }
                return redirect()->route('store.dashboard', ['store_slug' => $last->tenant->slug]);
            }
        }

        return redirect()->route('hub');
    }

    /** A Custom-role member linked to a rider employee opens straight on their rides. */
    private static function isRider(TenantUser $m): bool
    {
        return $m->role === 'custom'
            && \Illuminate\Support\Facades\DB::table('commerce_rider_accounts')->where('tenant_id', $m->tenant_id)->where('user_id', $m->user_id)->exists();
    }
}
