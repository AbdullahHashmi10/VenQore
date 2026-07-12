<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AccessGrant;
use App\Models\Plan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

/**
 * AccessGrantController — Platform Owner "Gift Links"
 *
 * Owner-only (behind SuperAdminMiddleware, /VenQore/access-grants). Lets the
 * owner generate a link that grants a chosen Plan for a chosen duration
 * (any number of days/months/years) with zero payment, and manage/revoke
 * links already sent out. The public-facing redemption side lives in
 * GiftRedemptionController.
 */
class AccessGrantController extends Controller
{
    public function index()
    {
        $grants = AccessGrant::with(['plan', 'creator'])
            ->withCount('redemptions')
            ->orderByDesc('created_at')
            ->get();

        $plans = Plan::whereNull('archived_at')
            ->where('is_active', true)
            ->where('is_ltd', false)      // gift links provision subscription-type plans only
            ->where('type', 'subscription') // excludes 'trial' — a gift is meant to skip the trial, not grant one
            ->orderBy('sort_order')
            ->get(['id', 'name', 'slug', 'display_name']);

        return Inertia::render('SuperAdmin/AccessGrants/Index', [
            'grants' => $grants,
            'plans'  => $plans,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'plan_id'          => 'required|exists:plans,id',
            'duration_value'   => 'required|integer|min:1|max:9999',
            'duration_unit'    => 'required|in:day,month,year',
            'label'            => 'nullable|string|max:150',
            'max_redemptions'  => 'nullable|integer|min:1|max:100000',
            'expires_at'       => 'nullable|date|after:now',
        ]);

        $grant = AccessGrant::create([
            'token'            => AccessGrant::generateToken(),
            'plan_id'          => $validated['plan_id'],
            'duration_value'   => $validated['duration_value'],
            'duration_unit'    => $validated['duration_unit'],
            'label'            => $validated['label'] ?? null,
            'max_redemptions'  => $validated['max_redemptions'] ?? 1,
            'expires_at'       => $validated['expires_at'] ?? null,
            'created_by'       => Auth::id(),
        ]);

        return back()->with('success', "Gift link created.")->with('new_grant_url', $grant->url());
    }

    /**
     * Revoke a link (redeemed or not) — it stops working immediately.
     * Kept separate from destroy() so an already-redeemed grant's audit
     * trail (access_grant_redemptions) is never lost.
     */
    public function revoke(AccessGrant $grant)
    {
        $grant->update(['revoked_at' => now()]);

        return back()->with('success', 'Gift link revoked.');
    }

    public function unrevoke(AccessGrant $grant)
    {
        $grant->update(['revoked_at' => null]);

        return back()->with('success', 'Gift link re-activated.');
    }

    /**
     * Hard delete — only for links that were never redeemed. A grant with
     * redemptions must be revoked, not deleted, so history stays intact.
     */
    public function destroy(AccessGrant $grant)
    {
        if ($grant->redemption_count > 0) {
            return back()->withErrors([
                'grant' => 'This link has already been redeemed and cannot be deleted. Revoke it instead.',
            ]);
        }

        $grant->delete();

        return back()->with('success', 'Gift link deleted.');
    }
}
