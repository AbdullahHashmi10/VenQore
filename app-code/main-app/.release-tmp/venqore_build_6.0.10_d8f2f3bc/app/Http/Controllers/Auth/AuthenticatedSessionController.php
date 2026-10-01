<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\TenantUser;
use App\Support\InviteRedirect;
use App\Support\GiftRedirect;
use App\Support\PostLoginRedirect;
use App\Services\Auth\EmailOtpService;
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

        // Preserve an invite token if the user was sent here from an invite link.
        InviteRedirect::captureFromIntended();

        // Preserve a gift-link token if the user was sent here from /gift/{token}.
        GiftRedirect::captureFromIntended();

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
        // AUTH-01 (2026-09-10): the password is checked, but NO session is
        // created here. Every new email/password sign-in must also enter the
        // 6-digit code we email (EmailOtpController). A previously verified
        // email does not skip this.
        $user = $request->validateCredentials();

        // ── Platform owners must use the /VenQore-login portal (+ MFA) ─────
        if ($user->isPlatformAdmin()) {
            return redirect()->route('platform.login')
                ->withErrors(['email' => 'Platform admins must use the secure HQ portal to log in.']);
        }

        if (!config('venqore.email_otp_required', true)) {
            Auth::login($user, $request->boolean('remember'));
            $request->session()->regenerate();

            return PostLoginRedirect::for($user);
        }

        [$challenge, $error] = app(EmailOtpService::class)->start(
            $request,
            'login',
            $user->email,
            $user->id,
            ['remember' => $request->boolean('remember')]
        );

        if (!$challenge) {
            return back()->withErrors(['email' => $error]);
        }

        EmailOtpController::begin($request, $challenge->id, 'login');

        return redirect()->route('otp.show');
    }



    public function storePasscode(Request $request): RedirectResponse
    {
        return $this->storePosPin($request);
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

        $rateKey = 'pos-pin-login:' . $storeId . '|' . $request->ip();

        // Per-store ceiling across all IPs, so distributed PIN guessing is bounded.
        $storeKey = 'pos-pin-login-store:' . $storeId;
        if (\Illuminate\Support\Facades\RateLimiter::tooManyAttempts($storeKey, 30)) {
            return back()->withErrors(['pin' => 'Too many login attempts for this store. Please try again later.']);
        }

        if (\Illuminate\Support\Facades\RateLimiter::tooManyAttempts($rateKey, 5)) {
            $seconds = \Illuminate\Support\Facades\RateLimiter::availableIn($rateKey);
            return back()->withErrors([
                'pin' => "Too many login attempts. Please try again in {$seconds} seconds."
            ]);
        }

        // Find matching active membership with this PIN
        $membership = TenantUser::where('tenant_id', $storeId)
            ->where('status', 'active')
            ->whereNotNull('pos_pin')
            ->with('user')
            ->get()
            ->first(fn($m) => \Illuminate\Support\Facades\Hash::check($pin, $m->pos_pin));

        if (!$membership || !$membership->user) {
            \Illuminate\Support\Facades\RateLimiter::hit($rateKey, 60);
            \Illuminate\Support\Facades\RateLimiter::hit($storeKey, 600);
            return back()->withErrors(['pin' => 'Invalid PIN.']);
        }

        \Illuminate\Support\Facades\RateLimiter::clear($rateKey);

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
