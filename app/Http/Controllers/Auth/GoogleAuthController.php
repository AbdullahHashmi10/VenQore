<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
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
            
            // 1. Find or create the user
            $user = User::where('google_id', $googleUser->id)
                ->orWhere('email', $googleUser->email)
                ->first();

            if ($user) {
                // Update Google ID if not set
                if (!$user->google_id) {
                    $user->update([
                        'google_id' => $googleUser->id,
                        'avatar'    => $googleUser->avatar
                    ]);
                }
            } else {
                // Create new user
                $user = User::create([
                    'name'      => $googleUser->name,
                    'email'     => $googleUser->email,
                    'google_id' => $googleUser->id,
                    'avatar'    => $googleUser->avatar,
                    'password'  => Hash::make(Str::random(24)), // Random password for safety
                ]);
            }

            // 2. Log in
            Auth::login($user, true);

            // 3. Platform Admin initialization (if needed)
            if ($user->isPlatformAdmin()) {
                session(['platform_last_activity' => time()]);
                return redirect()->route('platform.dashboard');
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
