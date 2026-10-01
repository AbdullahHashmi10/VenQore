<?php

namespace App\Http\Controllers;

use App\Models\AccessGrant;
use App\Models\AccessGrantRedemption;
use App\Models\StoreLicense;
use App\Models\TenantUser;
use App\Support\GiftRedirect;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * GiftRedemptionController — public-facing "Accept your gift" flow.
 *
 * Reached via /gift/{token}, generated from the owner's /VenQore Gift Links
 * page (AccessGrantController). No SuperAdminMiddleware here — anyone with
 * the link can view it; only an authenticated user can accept it.
 *
 * Provisioning strategy (deliberately does NOT create Tenants directly):
 *   - If the redeemer already owns a store, upgrade that tenant in place:
 *     set plan + subscription_ends_at, clear view_only_since.
 *   - If the redeemer has no store yet, create an `available` StoreLicense
 *     (source = 'gift', valid_until = computed grant expiry) and send them
 *     into the EXISTING store-creation wizard (StoreController), which
 *     already knows how to safely claim an available license (slug
 *     collision handling, per-user creation lock, LTD store-count logic).
 *     A small addition in StoreController::store() copies the license's
 *     valid_until onto the new tenant's subscription_ends_at when the
 *     license source is 'gift' — see that file for the 4-line change.
 *   This avoids duplicating StoreController's battle-tested, lock-guarded
 *   tenant-creation logic here.
 */
class GiftRedemptionController extends Controller
{
    /**
     * Show the "You've been gifted..." page, or a specific rejection state
     * if the link is revoked / expired / already fully redeemed.
     */
    public function show(string $token): Response
    {
        GiftRedirect::captureFromIntended();

        $grant = AccessGrant::with('plan')->where('token', $token)->first();

        if (!$grant) {
            return Inertia::render('Gift/Invalid', ['reason' => 'not_found']);
        }

        $reason = $grant->invalidReason();
        if ($reason !== null) {
            return Inertia::render('Gift/Invalid', ['reason' => $reason]);
        }

        $user = Auth::user();

        // Has this specific user already redeemed this specific grant?
        // (Relevant for multi-use links — prevents one account grabbing
        // the same link's benefit twice.)
        $alreadyRedeemedByMe = $user
            ? AccessGrantRedemption::where('access_grant_id', $grant->id)
                ->where('user_id', $user->id)
                ->exists()
            : false;

        return Inertia::render('Gift/Show', [
            'token'                => $grant->token,
            'plan_name'            => $grant->plan->display_name ?? $grant->plan->name,
            'plan_description'     => $grant->plan->description,
            'duration_label'       => $grant->durationLabel(),
            'label'                => $grant->label,
            'is_authenticated'     => (bool) $user,
            'already_redeemed_by_me' => $alreadyRedeemedByMe,
        ]);
    }

    /**
     * Accept the gift. Requires auth — if not logged in, bounce through
     * login/register and back here via GiftRedirect (same pattern as
     * StaffInvitation's magic-link flow).
     */
    public function accept(Request $request, string $token): RedirectResponse
    {
        if (!Auth::check()) {
            session(['pending_gift_token' => $token]);
            return redirect()->route('login');
        }

        $user = Auth::user();

        $result = DB::transaction(function () use ($token, $user, $request) {
            /** @var AccessGrant|null $grant */
            $grant = AccessGrant::where('token', $token)
                ->lockForUpdate()
                ->first();

            if (!$grant || $grant->invalidReason() !== null) {
                return ['success' => false, 'error' => 'This gift link is no longer valid.'];
            }

            $alreadyRedeemedByMe = AccessGrantRedemption::where('access_grant_id', $grant->id)
                ->where('user_id', $user->id)
                ->exists();

            if ($alreadyRedeemedByMe) {
                return ['success' => false, 'error' => 'You have already redeemed this gift link.'];
            }

            $grantedUntil = $grant->computeGrantedUntil();
            $planSlug = $grant->plan->slug;

            // Does this user already own an active store?
            $ownedMembership = TenantUser::where('user_id', $user->id)
                ->where('role', 'owner')
                ->where('status', 'active')
                ->with('tenant')
                ->first();

            $tenantId = null;

            if ($ownedMembership && $ownedMembership->tenant) {
                // ── Path A: existing store — upgrade in place ──────────────
                // Setting `plan` to a subscription slug (starter/growth/business)
                // is sufficient on its own: Tenant::getLimit() resolves limits
                // live from the seeded plan_limits TABLE by slug via
                // PlanRepository — no JSON snapshot needed. (The JSON snapshot
                // in setPlanAttribute() only fires for 'ltd_*' slugs, since
                // those collapse to the single literal 'ltd' and would
                // otherwise lose which tier was granted.)
                $tenant = $ownedMembership->tenant;
                $tenant->plan = $planSlug;
                $tenant->subscription_ends_at = $grantedUntil;
                $tenant->status = 'active';
                $tenant->view_only_since = null; // regain full access even if previously lapsed
                $tenant->save();

                $tenantId = $tenant->id;
            } else {
                // ── Path B: no store yet — issue a license, let the existing
                // store-creation wizard claim it (StoreController::store()) ──
                StoreLicense::create([
                    'user_id'          => $user->id,
                    'type'             => 'subscription',
                    'status'           => 'available',
                    'plan'             => $planSlug,
                    'source'           => 'gift',
                    'source_reference' => $grant->token,
                    'valid_until'      => $grantedUntil,
                ]);
            }

            $grant->increment('redemption_count');

            AccessGrantRedemption::create([
                'access_grant_id' => $grant->id,
                'user_id'         => $user->id,
                'tenant_id'       => $tenantId,
                'granted_until'   => $grantedUntil,
                'redeemed_at'     => now(),
                'ip_address'      => $request->ip(),
            ]);

            return ['success' => true, 'has_store' => $tenantId !== null];
        });

        if (!$result['success']) {
            return redirect()->route('gift.show', ['token' => $token])
                ->withErrors(['grant' => $result['error']]);
        }

        // Existing store upgraded → straight to their dashboard.
        // No store yet → hub, same landing normal registration uses; their
        // new available license is picked up by the store-creation wizard.
        return redirect()->route('hub')
            ->with('success', $result['has_store']
                ? 'Your gift has been applied — enjoy your upgraded plan!'
                : 'Your gift has been accepted! Create your store to activate it.');
    }
}
