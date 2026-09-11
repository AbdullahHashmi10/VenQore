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

        // AUTH-01: check the password without creating a session.
        $credentials = $request->only('email', 'password');
        $user = Auth::getProvider()->retrieveByCredentials($credentials);
        if (!$user || !Auth::getProvider()->validateCredentials($user, $credentials)) {
            RateLimiter::hit($throttleKey);
            return back()->withErrors(['email' => 'These credentials do not match our records.']);
        }

        // Check if the user is platform staff OR has an active TenantUser store membership
        $membership = \App\Models\TenantUser::where('user_id', $user->id)
            ->where('status', 'active')
            ->first();

        if (!$user->isPlatformStaff() && !$membership) {
            RateLimiter::hit($throttleKey);
            return back()->withErrors(['email' => 'Access denied. This portal is restricted to authorized platform staff and active store employees.']);
        }

        // Set last_store_id dynamically to the active store membership's tenant_id if available
        if ($membership && (!$user->last_store_id || $user->last_store_id !== $membership->tenant_id)) {
            $user->update(['last_store_id' => $membership->tenant_id]);
        }

        RateLimiter::clear($throttleKey);

        if (!config('venqore.email_otp_required', true)) {
            Auth::login($user, $request->boolean('remember'));
            $request->session()->regenerate();
            return redirect()->route('staff.hub');
        }

        // AUTH-01: the session is granted only after the emailed code.
        [$challenge, $error] = app(\App\Services\Auth\EmailOtpService::class)->start(
            $request, 'login', $user->email, $user->id,
            ['remember' => $request->boolean('remember'), 'then' => 'staff.hub']
        );
        if (!$challenge) {
            return back()->withErrors(['email' => $error]);
        }
        EmailOtpController::begin($request, $challenge->id, 'login');

        return redirect()->route('otp.show');
    }
}
