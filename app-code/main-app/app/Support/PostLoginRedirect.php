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
            return redirect()->route('store.dashboard', ['store_slug' => $memberships->first()->tenant->slug]);
        }

        if ($user->last_store_id) {
            $last = $memberships->firstWhere('tenant_id', $user->last_store_id);
            if ($last && $last->tenant) {
                return redirect()->route('store.dashboard', ['store_slug' => $last->tenant->slug]);
            }
        }

        return redirect()->route('hub');
    }
}
