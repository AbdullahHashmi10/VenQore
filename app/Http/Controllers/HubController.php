<?php

namespace App\Http\Controllers;

use App\Models\TenantUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/**
 * HubController — Definitive Plan
 *
 * The store picker shown when a user has 2+ active stores.
 * Single-store users never see this — they go straight in.
 *
 * Also provides /api/my-stores endpoint for the in-app store switcher dropdown.
 */
class HubController extends Controller
{
    /**
     * Store hub page — shows all accessible stores with their status.
     */
    public function index(): Response
    {
        $user = Auth::user();

        $memberships = TenantUser::where('user_id', $user->id)
            ->where('status', 'active')
            ->with(['tenant' => function ($q) {
                $q->select('id', 'name', 'slug', 'plan', 'status', 'currency_symbol', 'trial_ends_at');
            }])
            ->get()
            ->map(fn($m) => [
                'store_id'        => $m->tenant_id,
                'store_name'      => $m->tenant->name,
                'plan'            => $m->tenant->plan,
                'status'          => $m->tenant->status,
                'role'            => $m->role,
                'currency_symbol' => $m->tenant->currency_symbol,
                'trial_ends_at'   => $m->tenant->trial_ends_at,
                'url'             => route('store.dashboard', ['store_slug' => $m->tenant->slug]),
                'is_last_used'    => $m->tenant_id === $user->last_store_id,
            ]);

        // Also fetch pending invites for this user's email from StaffInvitation model
        $pendingInvites = \App\Models\StaffInvitation::where('invitee_email', $user->email)
            ->whereIn('status', ['pending', 'no_account'])
            ->where('expires_at', '>', now())
            ->with(['tenant:id,name,plan'])
            ->get()
            ->map(fn($inv) => [
                'token'      => $inv->token,
                'store_name' => $inv->tenant->name,
                'plan'       => $inv->tenant->plan,
                'role'       => $inv->role ?? 'cashier',
                'accept_url' => route('invite.accept', ['token' => $inv->token]),
            ]);

        return Inertia::render('Hub/Index', [
            'memberships'    => $memberships,
            'pending_invites' => $pendingInvites,
        ]);
    }

    /**
     * API endpoint for the in-app store switcher dropdown.
     * Lazy-loaded — only called when user opens the switcher.
     *
     * GET /api/my-stores
     */
    public function apiList(): JsonResponse
    {
        $user = Auth::user();

        $stores = TenantUser::where('user_id', $user->id)
            ->where('status', 'active')
            ->with(['tenant:id,name,slug,plan,status,currency_symbol'])
            ->get()
            ->filter(fn($m) => in_array($m->tenant?->status, ['trial', 'active', 'suspended']))
            ->values()
            ->map(fn($m) => [
                'store_id'   => $m->tenant_id,
                'name'       => $m->tenant->name,
                'plan'       => $m->tenant->plan,
                'role'       => $m->role,
                'url'        => route('store.dashboard', ['store_slug' => $m->tenant->slug]),
                'is_current' => $m->tenant->slug === request()->route('store_slug'),
            ]);

        return response()->json($stores);
    }
}
