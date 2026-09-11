<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\InviteRedirect;
use App\Support\GiftRedirect;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;

class GoogleAuthController extends Controller
{
    /**
     * Redirect to Google for authentication.
     */
    public function redirect()
    {
        return Socialite::driver('google')->redirect();
    }

    /**
     * Handle the callback from Google.
     */
    public function callback()
    {
        try {
            $googleUser = Socialite::driver('google')->user();

            // AUTH-02 (2026-09-10): trust only what Google verified.
            $raw = is_array($googleUser->user ?? null) ? $googleUser->user : [];
            $googleId = (string) $googleUser->getId();
            $email = strtolower(trim((string) $googleUser->getEmail()));
            $emailVerified = filter_var($raw['email_verified'] ?? $raw['verified_email'] ?? false, FILTER_VALIDATE_BOOLEAN);

            if ($googleId === '' || $email === '' || !$emailVerified) {
                return redirect('/login')->withErrors(['email' => 'Google did not confirm this email address. Please sign in with email instead.']);
            }

            // 1. Returning linked user: resolve by the stable Google ID only.
            $user = User::where('google_id', $googleId)->first();

            if (!$user) {
                $existing = User::withTrashed()->where('email', $email)->first();

                if ($existing) {
                    if ($existing->trashed()) {
                        return redirect('/login')->withErrors(['email' => 'This account is not available.']);
                    }

                    // An existing email/password account is NOT silently attached
                    // to a Google identity just because the email strings match.
                    // Prove ownership once with an emailed code; after that,
                    // Google sign-in is instant.
                    [$challenge, $error] = app(\App\Services\Auth\EmailOtpService::class)->start(
                        request(), 'link_google', $existing->email, $existing->id,
                        ['google_id' => $googleId, 'avatar' => $googleUser->getAvatar()]
                    );
                    if (!$challenge) {
                        return redirect('/login')->withErrors(['email' => $error]);
                    }
                    EmailOtpController::begin(request(), $challenge->id, 'link_google');

                    return redirect()->route('otp.show')->with('status', 'You already have an account with this email. Enter the code we sent to link Google to it.');
                }

                // 2. New user: Google verified the address, so no extra email code.
                $user = new User();
                $user->forceFill([
                    'name'              => $googleUser->getName() ?: explode('@', $email)[0],
                    'email'             => $email,
                    'google_id'         => $googleId,
                    'avatar'            => $googleUser->getAvatar(),
                    'password'          => Hash::make(Str::random(40)), // unusable; reset flow can set one
                    'email_verified_at' => now(),
                ])->save();
                event(new \Illuminate\Auth\Events\Registered($user));
            }

            // 3. Log in (platform accounts still pass Require2FA before any page)
            Auth::login($user, true);
            request()->session()->regenerate();

            // 3. Platform Admin initialization (if needed)
            if ($user->isPlatformAdmin()) {
                session(['platform_last_activity' => time()]);
                return redirect()->route('platform.dashboard');
            }

            // 3b. Invited user: finish accepting the invite before store routing.
            if ($redirect = InviteRedirect::pending()) {
                return $redirect;
            }

            // 3c. Pending gift link: finish viewing/accepting it before store routing.
            if ($redirect = GiftRedirect::pending()) {
                return $redirect;
            }

            // 3d. Pending workspace builder from BuildWorkspace page
            if (session()->has('pending_workspace_builder')) {
                $builderData = (array) session()->pull('pending_workspace_builder');
                $tenant = app(\App\Http\Controllers\WorkspaceBuilderController::class)
                    ->provisionForUser($user, $builderData);
                if ($tenant) {
                    return redirect()->route('store.dashboard', [
                        'store_slug' => $tenant->slug
                    ]);
                }
            }

            // 4. Multi-tenant routing (see AuthenticatedSessionController logic)
            $memberships = $user->activeMemberships()
                ->with('tenant')
                ->get()
                ->filter(fn($m) => in_array($m->tenant?->status, ['trial', 'active', 'suspended']));

            $membershipsCount = $memberships->count();

            if ($membershipsCount === 0) {
                return redirect()->route('store.create-or-join');
            }
            
            if ($membershipsCount === 1) {
                return redirect()->route('store.dashboard', [
                    'store_slug' => $memberships->first()->tenant->slug
                ]);
            }

            return redirect()->route('hub');

        } catch (\Exception $e) {
            return redirect('/login')->withErrors(['email' => 'Google authentication failed. Please try again.']);
        }
    }
}
