<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Inertia;
use Inertia\Response;

/**
 * PlatformOwnerAuthController
 *
 * Handles the dedicated /VenQore-login flow.
 * Features:
 *   - Email + password login
 *   - Quick PIN login (no email needed — finds the platform admin)
 *   - Rate limiting on all attempts
 *   - PIN management (set, clear)
 *   - Password change from within the dashboard
 */
class PlatformOwnerAuthController extends Controller
{
    // ── Login Page ──────────────────────────────────────────────────────────

    public function create(): Response|RedirectResponse
    {
        if (Auth::check() && Auth::user()->is_platform_admin) {
            return redirect()->route('platform.dashboard');
        }
        if (Auth::check()) {
            Auth::logout();
            request()->session()->invalidate();
            request()->session()->regenerateToken();
        }

        // SEC-05: PIN login is off unless explicitly enabled outside production.
        $hasPinEnabled = self::pinLoginAllowed() && User::where('is_platform_admin', true)
            ->whereNotNull('platform_pin')
            ->exists();

        return Inertia::render('PlatformOwner/Login', [
            'status'          => session('status'),
            'has_pin_enabled' => $hasPinEnabled,
        ]);
    }

    // ── Email + Password Login ──────────────────────────────────────────────

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $throttleKey = 'platform-login|' . $request->ip();
        // SEC-05: also limit per account, so distributed guessing hits a ceiling.
        $accountKey = 'platform-login-acct|' . strtolower((string) $request->input('email'));
        if (RateLimiter::tooManyAttempts($throttleKey, 5) || RateLimiter::tooManyAttempts($accountKey, 10)) {
            $seconds = max(RateLimiter::availableIn($throttleKey), RateLimiter::availableIn($accountKey));
            return back()->withErrors(['email' => "Too many attempts. Wait {$seconds}s."]);
        }

        if (!Auth::attempt($request->only('email', 'password'), $request->boolean('remember'))) {
            RateLimiter::hit($throttleKey);
            RateLimiter::hit($accountKey, 900);
            return back()->withErrors(['email' => 'These credentials do not match our records.']);
        }

        if (!Auth::user()->is_platform_admin) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            RateLimiter::hit($throttleKey);
            return back()->withErrors(['email' => 'Access denied. This portal is restricted.']);
        }

        RateLimiter::clear($throttleKey);
        RateLimiter::clear($accountKey);
        $request->session()->regenerate();
        session(['platform_last_activity' => time()]);
        // Require2FA sends the user to setup/verify before any platform page.
        return redirect()->route('platform.dashboard');
    }

    // ── PIN Login ───────────────────────────────────────────────────────────

    /**
     * SEC-05 (2026-09-10): a 4–8 character PIN was a standalone credential for
     * the most privileged account, with only an IP throttle. Disabled unless
     * venqore.platform_pin_login_enabled is on AND the app is not production.
     * Even then, MFA (Require2FA) still applies after the PIN.
     */
    public static function pinLoginAllowed(): bool
    {
        return (bool) config('venqore.platform_pin_login_enabled', false) && !app()->environment('production');
    }

    public function storePin(Request $request): RedirectResponse
    {
        if (!self::pinLoginAllowed()) {
            abort(404);
        }

        $request->validate(['pin' => 'required|string|min:6|max:8']);

        $throttleKey = 'platform-pin|' . $request->ip();
        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return back()->withErrors(['pin' => "Too many attempts. Wait {$seconds}s."]);
        }

        // Find the platform owner with a matching PIN
        $user = User::where('is_platform_admin', true)
            ->whereNotNull('platform_pin')
            ->get()
            ->first(fn($u) => Hash::check($request->pin, $u->platform_pin));

        if (!$user) {
            RateLimiter::hit($throttleKey);
            return back()->withErrors(['pin' => 'Incorrect PIN. Please try again.']);
        }

        RateLimiter::clear($throttleKey);
        Auth::login($user, false);
        $request->session()->regenerate();
        session(['platform_last_activity' => time()]);
        return redirect()->route('platform.dashboard');
    }

    // ── Security Management (requires authenticated platform owner) ──────────

    public function setPasscode(Request $request): RedirectResponse
    {
        $request->validate([
            'pin'             => 'required|string|min:6|max:8|confirmed',
            'pin_confirmation'=> 'required',
            'current_password'=> 'required|string',
        ]);

        $user = Auth::user();

        if (!Hash::check($request->current_password, $user->password)) {
            return back()->withErrors(['current_password' => 'Your current password is incorrect.']);
        }

        $user->update(['platform_pin' => Hash::make($request->pin)]);
        return back()->with('security_success', 'PIN passcode has been set successfully.');
    }

    public function clearPasscode(Request $request): RedirectResponse
    {
        $request->validate(['current_password' => 'required|string']);

        $user = Auth::user();
        if (!Hash::check($request->current_password, $user->password)) {
            return back()->withErrors(['current_password' => 'Your current password is incorrect.']);
        }

        $user->update(['platform_pin' => null]);
        return back()->with('security_success', 'PIN passcode has been removed.');
    }

    public function changePassword(Request $request): RedirectResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'password'         => 'required|string|min:8|confirmed',
        ]);

        $user = Auth::user();
        if (!Hash::check($request->current_password, $user->password)) {
            return back()->withErrors(['current_password' => 'Your current password is incorrect.']);
        }

        $user->update(['password' => Hash::make($request->password)]);
        \App\Support\SessionRevoker::revokeOthers($user, $request);
        return back()->with('security_success', 'Password changed successfully.');
    }

    public function setActionPasscode(Request $request): RedirectResponse
    {
        $request->validate([
            'passcode'             => 'required|string|min:4|max:8|confirmed',
            'passcode_confirmation'=> 'required',
            'current_password'     => 'required|string',
        ]);

        $user = Auth::user();

        if (!Hash::check($request->current_password, $user->password)) {
            return back()->withErrors(['action_current_password' => 'Your current password is incorrect.']);
        }

        $membership = \App\Models\TenantUser::where('user_id', $user->id)
            ->where('tenant_id', $user->last_store_id ?: 1)
            ->first();

        if (!$membership) {
            $membership = \App\Models\TenantUser::create([
                'user_id' => $user->id,
                'tenant_id' => $user->last_store_id ?: 1,
                'role' => 'owner',
                'status' => 'active'
            ]);
        }

        $membership->update(['security_pin' => Hash::make($request->passcode)]);
        return back()->with('security_success', 'Action passcode has been set successfully.');
    }

    public function clearActionPasscode(Request $request): RedirectResponse
    {
        $request->validate(['current_password' => 'required|string']);

        $user = Auth::user();
        if (!Hash::check($request->current_password, $user->password)) {
            return back()->withErrors(['action_clear_current_password' => 'Your current password is incorrect.']);
        }

        $membership = \App\Models\TenantUser::where('user_id', $user->id)
            ->where('tenant_id', $user->last_store_id ?: 1)
            ->first();

        if ($membership) {
            $membership->update(['security_pin' => null]);
        }
        return back()->with('security_success', 'Action passcode has been removed.');
    }
}
