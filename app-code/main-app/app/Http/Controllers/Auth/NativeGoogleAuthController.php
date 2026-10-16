<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\PostLoginRedirect;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * "Continue with Google" for the phone app, using the Google account picker on the device
 * (no browser, no web page) instead of the redirect flow Google does not allow inside an app.
 *
 *   1. The app gets a Google ID token from the device (google_sign_in) and posts it here.
 *   2. We verify it with Google (signature, audience = our client id, expiry, verified email).
 *   3. We hand back a one-time ticket (60 seconds, single use). The app opens the ticket URL in its
 *      web view, which signs the person in and sends them where their role belongs.
 *
 * The same trust rules as the browser flow (GoogleAuthController, AUTH-02): only a Google-verified
 * email counts, an existing password account is never silently linked, and the person lands where
 * PostLoginRedirect puts them. An existing email account that has not been linked yet gets
 * `link_required`: the app then runs the browser flow once, which proves ownership by emailed code.
 */
class NativeGoogleAuthController extends Controller
{
    private const TICKET_TTL_SECONDS = 60;

    /**
     * GET /api/mobile/config: what the phone app needs to start Google sign-in. The client id is public
     * (it is also in the web page's Google redirect), so the app asks the server instead of baking it in.
     */
    public function config(): JsonResponse
    {
        $id = config('services.google.client_id');
        return response()->json(['google_server_client_id' => filled($id) ? (string) $id : null]);
    }

    /** POST /api/mobile/auth/google */
    public function exchange(Request $request): JsonResponse
    {
        $v = $request->validate(['id_token' => ['required', 'string', 'max:4096']]);

        $claims = $this->verify($v['id_token']);
        if (! $claims) {
            return response()->json(['status' => 'invalid', 'message' => 'Google could not confirm this sign-in. Please try again.'], 401);
        }

        $googleId = (string) $claims['sub'];
        $email = strtolower(trim((string) ($claims['email'] ?? '')));

        $user = User::where('google_id', $googleId)->first();

        if (! $user) {
            if (User::withTrashed()->where('email', $email)->exists()) {
                // Either a deleted account, or an email/password account that must prove ownership first.
                return response()->json(['status' => 'link_required']);
            }

            $user = new User();
            $user->forceFill([
                'name' => ($claims['name'] ?? null) ?: explode('@', $email)[0],
                'email' => $email,
                'google_id' => $googleId,
                'avatar' => $claims['picture'] ?? null,
                'password' => Hash::make(Str::random(40)),
                'email_verified_at' => now(),
            ])->save();
            event(new \Illuminate\Auth\Events\Registered($user));
        }

        $ticket = Str::random(64);
        Cache::put($this->cacheKey($ticket), $user->id, now()->addSeconds(self::TICKET_TTL_SECONDS));

        return response()->json([
            'status' => 'ok',
            'ticket_url' => route('auth.native-ticket', ['ticket' => $ticket]),
        ]);
    }

    /** GET /auth/native-ticket/{ticket}: opened by the app's web view; signs the person in once. */
    public function redeem(Request $request, string $ticket): RedirectResponse
    {
        $userId = Cache::pull($this->cacheKey($ticket));
        $user = $userId ? User::find($userId) : null;

        if (! $user) {
            return redirect('/login')->withErrors(['email' => 'That sign-in link has expired. Please try again.']);
        }

        Auth::login($user, true);
        $request->session()->regenerate();

        if ($user->isPlatformAdmin()) {
            session(['platform_last_activity' => time()]);
            return redirect()->route('platform.dashboard');
        }

        return PostLoginRedirect::for($user);
    }

    private function cacheKey(string $ticket): string
    {
        return 'native_google_ticket:' . hash('sha256', $ticket);
    }

    /**
     * Ask Google to verify the ID token and check it was issued to one of OUR apps.
     *
     * @return array<string, mixed>|null
     */
    private function verify(string $idToken): ?array
    {
        try {
            $res = Http::timeout(8)->acceptJson()->get('https://oauth2.googleapis.com/tokeninfo', ['id_token' => $idToken]);
        } catch (\Throwable $e) {
            Log::warning('[NativeGoogle] tokeninfo unreachable: ' . $e->getMessage());
            return null;
        }

        if (! $res->ok()) {
            return null;
        }

        $c = $res->json();
        $allowed = array_values(array_filter(array_merge(
            [config('services.google.client_id')],
            (array) config('services.google.mobile_client_ids', []),
        )));

        $ok = is_array($c)
            && ! empty($c['sub'])
            && ! empty($c['email'])
            && in_array($c['aud'] ?? null, $allowed, true)
            && in_array($c['iss'] ?? null, ['accounts.google.com', 'https://accounts.google.com'], true)
            && filter_var($c['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN)
            && (int) ($c['exp'] ?? 0) > time();

        return $ok ? $c : null;
    }
}
