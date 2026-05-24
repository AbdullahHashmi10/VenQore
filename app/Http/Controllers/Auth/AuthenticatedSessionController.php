<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\TenantUser;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

/**
 * AuthenticatedSessionController — Definitive Plan
 *
 * Login flow (3-case routing):
 *   Case 0: User has no active stores → redirect to store.create-or-join
 *   Case 1: User has 1 active store → go straight in (most users)
 *   Case 2: User has 2+ stores → try last used, else show hub
 *
 * This replaces the old single-tenant redirect to 'dashboard'.
 */
class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response|RedirectResponse
    {
        // Guard: redirect to installer if app is not set up
        if (!\Illuminate\Support\Facades\Schema::hasTable('settings') && !request()->is('installer*')) {
            return redirect()->to('/installer');
        }

        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status'           => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     *
     * Definitive Plan 3-case routing:
     *   0 stores → create-or-join page
     *   1 store  → go straight in
     *   2+ stores → last used or hub
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();
        $request->session()->regenerate();

        $user = Auth::user();

        // ── Case Platform Owner: Block regular login ──────────────────────
        // Security requirement: Platform owners MUST use the /VenQore-login portal.
        if ($user->isPlatformAdmin()) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('platform.login')
                ->withErrors(['email' => 'Platform admins must use the secure HQ portal to log in.']);
        }

        // Load all active memberships with their tenant statuses
        $memberships = TenantUser::where('user_id', $user->id)
            ->where('status', 'active')
            ->with('tenant')
            ->get()
            ->filter(fn($m) => in_array($m->tenant?->status, ['trial', 'active', 'suspended']));

        // ── Case 0: New user, no stores yet ───────────────────────────
        if ($memberships->isEmpty()) {
            return redirect()->route('store.create-or-join');
        }

        // ── Case 1: Exactly one store → go straight in ────────────────
        if ($memberships->count() === 1) {
            return redirect()->route('store.dashboard', [
                'store_slug' => $memberships->first()->tenant->slug,
            ]);
        }

        // ── Case 2: Multiple stores ────────────────────────────────────
        // Try their last-used store first
        if ($user->last_store_id) {
            $lastStore = $memberships->firstWhere('tenant_id', $user->last_store_id);
            if ($lastStore && $lastStore->tenant) {
                return redirect()->route('store.dashboard', [
                    'store_slug' => $lastStore->tenant->slug,
                ]);
            }
        }

        // No last preference → show the store hub
        return redirect()->route('hub');
    }

    /**
     * Handle POS PIN login for cashiers on shared tablets.
     * PIN is per-store (stored in tenant_users.pos_pin).
     */
    public function storePosPin(Request $request): RedirectResponse
    {
        $request->validate([
            'store_id' => 'required|integer|exists:tenants,id',
            'pin'      => 'required|string|min:4|max:6',
        ]);

        $storeId = (int) $request->store_id;
        $pin     = $request->pin;

        // Find matching active membership with this PIN
        $membership = TenantUser::where('tenant_id', $storeId)
            ->where('status', 'active')
            ->whereNotNull('pos_pin')
            ->with('user')
            ->get()
            ->first(fn($m) => \Illuminate\Support\Facades\Hash::check($pin, $m->pos_pin));

        if (!$membership || !$membership->user) {
            return back()->withErrors(['pin' => 'Invalid PIN.']);
        }

        Auth::login($membership->user);
        $request->session()->regenerate();

        return redirect()->route('store.dashboard', ['store_slug' => $membership->tenant->slug]);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
