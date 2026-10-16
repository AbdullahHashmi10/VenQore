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
    /**
     * Which side of the phone app is asking: 'customer' or 'store' (the app adds VenQoreSide/<side> to its
     * browser identity), or null for the website and for older app builds.
     */
    public static function appSide(): ?string
    {
        return preg_match('~VenQoreSide/(customer|store)~', (string) request()->userAgent(), $m) ? $m[1] : null;
    }

    public static function for(User $user): RedirectResponse
    {
        if ($redirect = InviteRedirect::pending()) {
            return $redirect;
        }

        if ($redirect = GiftRedirect::pending()) {
            return $redirect;
        }

        // The customer side of the app only ever opens the customer pages, whatever else the account holds.
        if (self::appSide() === 'customer') {
            return redirect('/my-orders');
        }

        $memberships = TenantUser::where('user_id', $user->id)
            ->where('status', 'active')
            ->with('tenant')
            ->get()
            ->filter(fn ($m) => in_array($m->tenant?->status, ['trial', 'active', 'suspended']));

        if ($memberships->isEmpty()) {
            // Signing in does not make anyone a store owner. In the phone app a person with no store is a
            // customer: they land on their orders, with "Create your own store" offered there. On the
            // website they still go to the create-or-join page.
            // The store side chose to run a business, so it goes on to create or join one.
            if (self::appSide() !== 'store' && preg_match('/VenQoreMobile/i', (string) request()->userAgent())) {
                return redirect('/my-orders');
            }

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

    /** The page a membership opens on: rides for a rider, the till for POS staff, otherwise the dashboard. */
    public static function homeUrl(TenantUser $m): string
    {
        $slug = $m->tenant->slug;
        if (self::isRider($m)) {
            return route('store.commerce.my-rides', ['store_slug' => $slug], false);
        }
        if ($m->isPosStaff()) {
            return route('store.pos', ['store_slug' => $slug], false);
        }
        return route('store.dashboard', ['store_slug' => $slug], false);
    }

    /** A Custom-role member linked to a rider employee opens straight on their rides. */
    private static function isRider(TenantUser $m): bool
    {
        return $m->role === 'custom'
            && \Illuminate\Support\Facades\DB::table('commerce_rider_accounts')->where('tenant_id', $m->tenant_id)->where('user_id', $m->user_id)->exists();
    }
}
