<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Inertia;
use Inertia\Response;

/**
 * StaffAuthController
 *
 * Handles the dedicated /staff-login flow for internal VenQore team members only.
 */
class StaffAuthController extends Controller
{
    // ── Login Page ──────────────────────────────────────────────────────────

    public function create(): Response|RedirectResponse
    {
        if (Auth::check() && Auth::user()->isPlatformStaff()) {
            return redirect()->route('staff.hub');
        }

        return Inertia::render('Auth/StaffLogin', [
            'status' => session('status'),
        ]);
    }

    // ── Email + Password Login ──────────────────────────────────────────────

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $throttleKey = 'staff-login|' . $request->ip();
        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return back()->withErrors(['email' => "Too many attempts. Wait {$seconds}s."]);
        }

        // Attempt authentication
        if (!Auth::attempt($request->only('email', 'password'), $request->boolean('remember'))) {
            RateLimiter::hit($throttleKey);
            return back()->withErrors(['email' => 'These credentials do not match our records.']);
        }

        $user = Auth::user();

        // Check if the user is platform staff OR has an active TenantUser store membership
        $membership = \App\Models\TenantUser::where('user_id', $user->id)
            ->where('status', 'active')
            ->first();

        if (!$user->isPlatformStaff() && !$membership) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            RateLimiter::hit($throttleKey);
            return back()->withErrors(['email' => 'Access denied. This portal is restricted to authorized platform staff and active store employees.']);
        }

        // Set last_store_id dynamically to the active store membership's tenant_id if available
        if ($membership && (!$user->last_store_id || $user->last_store_id !== $membership->tenant_id)) {
            $user->update(['last_store_id' => $membership->tenant_id]);
        }

        RateLimiter::clear($throttleKey);
        $request->session()->regenerate();

        // Redirect directly to the platform Staff Hub dashboard
        return redirect()->route('staff.hub');
    }
}
