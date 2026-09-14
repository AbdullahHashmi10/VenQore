<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Auth\EmailOtpService;
use App\Support\GiftRedirect;
use App\Support\InviteRedirect;
use App\Support\PostLoginRedirect;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

/**
 * AUTH-01 (2026-09-10): the "enter the code we emailed you" step.
 *
 * Nothing before this step grants a session: no login, no remember cookie,
 * no API token, no user row (signup), no store. Only a verified, unexpired,
 * single-use code bound to this browser session does.
 */
class EmailOtpController extends Controller
{
    public const SESSION_KEY = 'otp_pending';

    public function __construct(private readonly EmailOtpService $otp) {}

    /** Put a challenge in the session and send the browser to the code page. */
    public static function begin(Request $request, string $challengeId, string $purpose, array $extra = []): void
    {
        $request->session()->put(self::SESSION_KEY, array_merge([
            'id'      => $challengeId,
            'purpose' => $purpose,
        ], $extra));
    }

    public function show(Request $request): Response|RedirectResponse
    {
        $pending = $request->session()->get(self::SESSION_KEY);
        if (!is_array($pending)) {
            return redirect()->route('login');
        }

        $challenge = $this->otp->find($pending['id'] ?? null);
        $email = $challenge?->email ?? ($pending['display_email'] ?? '');
        $cooldown = (int) $this->otp->config('resend_cooldown_seconds', 60);
        $resendIn = $challenge?->last_sent_at
            ? max(0, $cooldown - (int) $challenge->last_sent_at->diffInSeconds(now()))
            : $cooldown;

        return Inertia::render('Auth/VerifyCode', [
            'purpose'      => $pending['purpose'] ?? 'login',
            'maskedEmail'  => self::mask($email),
            'ttlMinutes'   => (int) $this->otp->config('ttl_minutes', 5),
            'resendIn'     => $resendIn,
            'status'       => session('status'),
            // Local testing only — null everywhere else, so the page shows no hint.
            'devCode'      => $this->otp->devBypassActive($request) ? ($this->otp->devMasterCodes()[0] ?? null) : null,
        ]);
    }

    public function verify(Request $request): RedirectResponse
    {
        $request->validate(['code' => ['required', 'string', 'max:12']]);

        $pending = $request->session()->get(self::SESSION_KEY);
        if (!is_array($pending) || empty($pending['id'])) {
            return redirect()->route('login')->withErrors(['email' => 'Your sign-in expired. Please start again.']);
        }

        // Pretend-challenge for a signup whose email already has an account:
        // behaves exactly like a wrong code, so the page reveals nothing.
        if (!empty($pending['decoy'])) {
            return back()->withErrors(['code' => 'That code is not correct. Check the latest email and try again.']);
        }

        [$status, $challenge] = $this->otp->verify($request, $pending['id'], $pending['purpose'], (string) $request->input('code'));

        switch ($status) {
            case EmailOtpService::OK:
                break;
            case EmailOtpService::INVALID:
                $left = max(0, (int) $this->otp->config('max_attempts', 5) - (int) $challenge->attempts);
                return back()->withErrors(['code' => "That code is not correct. {$left} " . ($left === 1 ? 'try' : 'tries') . ' left.']);
            case EmailOtpService::EXPIRED:
                return back()->withErrors(['code' => 'That code has expired. Request a new one.']);
            case EmailOtpService::LOCKED:
                $request->session()->forget(self::SESSION_KEY);
                return redirect()->route($pending['purpose'] === 'signup' ? 'register' : 'login')
                    ->withErrors(['email' => 'Too many wrong codes. Please start again.']);
            default:
                $request->session()->forget(self::SESSION_KEY);
                return redirect()->route('login')->withErrors(['email' => 'Your sign-in expired. Please start again.']);
        }

        $request->session()->forget(self::SESSION_KEY);

        return match ($challenge->purpose) {
            'signup'      => $this->completeSignup($request, $challenge, $pending),
            'link_google' => $this->completeGoogleLink($request, $challenge),
            default       => $this->completeLogin($request, $challenge, $pending),
        };
    }

    public function resend(Request $request): RedirectResponse
    {
        $pending = $request->session()->get(self::SESSION_KEY);
        if (!is_array($pending)) {
            return redirect()->route('login');
        }
        if (!empty($pending['decoy'])) {
            return back()->with('status', 'If that address can be used, a new code is on its way.');
        }

        $challenge = $this->otp->find($pending['id'] ?? null);
        if (!$challenge) {
            return redirect()->route('login')->withErrors(['email' => 'Your sign-in expired. Please start again.']);
        }

        if ($error = $this->otp->resend($request, $challenge)) {
            return back()->withErrors(['code' => $error]);
        }

        return back()->with('status', 'A new code is on its way. The previous code no longer works.');
    }

    public function cancel(Request $request): RedirectResponse
    {
        $pending = $request->session()->pull(self::SESSION_KEY);

        return redirect()->route(is_array($pending) && ($pending['purpose'] ?? '') === 'signup' ? 'register' : 'login');
    }

    // ── completion ─────────────────────────────────────────────────────────

    private function completeLogin(Request $request, $challenge, array $pending): RedirectResponse
    {
        $user = User::find($challenge->user_id);
        if (!$user || strcasecmp($user->email, $challenge->email) !== 0) {
            return redirect()->route('login')->withErrors(['email' => 'This account is no longer available.']);
        }

        Auth::login($user, (bool) ($challenge->payload['remember'] ?? false));
        $request->session()->regenerate();

        // The mailbox was just proven.
        if (!$user->email_verified_at) {
            $user->forceFill(['email_verified_at' => now()])->save();
        }

        if (($challenge->payload['then'] ?? null) === 'staff.hub') {
            return redirect()->route('staff.hub');
        }

        return PostLoginRedirect::for($user);
    }

    private function completeSignup(Request $request, $challenge, array $pending): RedirectResponse
    {
        $data = (array) $challenge->payload;

        try {
            $user = DB::transaction(function () use ($challenge, $data) {
                // Uniqueness is enforced at activation, inside the transaction.
                if (User::withTrashed()->where('email', $challenge->email)->lockForUpdate()->exists()) {
                    return null;
                }

                $user = new User();
                $user->forceFill([
                    'name'              => (string) ($data['name'] ?? explode('@', $challenge->email)[0]),
                    'email'             => $challenge->email,
                    'password'          => (string) $data['password_hash'], // already a bcrypt hash
                    'email_verified_at' => now(),
                ])->save();

                return $user;
            });
        } catch (\Illuminate\Database\UniqueConstraintViolationException $e) {
            $user = null;
        }

        if (!$user) {
            return redirect()->route('login')->withErrors(['email' => 'An account with this email already exists. Please sign in.']);
        }

        event(new Registered($user));
        Auth::login($user);
        $request->session()->regenerate();

        // Workspace builder: provision the workspace only now that the email is proven.
        if (!empty($data['workspace_builder']) && is_array($data['workspace_builder'])) {
            $tenant = app(\App\Http\Controllers\WorkspaceBuilderController::class)
                ->provisionForUser($user, $data['workspace_builder']);
            if ($tenant) {
                return redirect()->route('store.dashboard', ['store_slug' => $tenant->slug]);
            }
            Log::warning('Workspace provisioning after signup OTP failed', ['user_id' => $user->id]);
        }

        if ($redirect = InviteRedirect::pending()) {
            return $redirect;
        }
        if ($redirect = GiftRedirect::pending()) {
            return $redirect;
        }

        return redirect()->intended(route('hub', absolute: false));
    }

    private function completeGoogleLink(Request $request, $challenge): RedirectResponse
    {
        $user = User::find($challenge->user_id);
        $googleId = (string) ($challenge->payload['google_id'] ?? '');

        if (!$user || $googleId === '' || ($user->google_id && $user->google_id !== $googleId)
            || User::where('google_id', $googleId)->where('id', '!=', $user->id)->exists()) {
            return redirect()->route('login')->withErrors(['email' => 'We could not link that Google account. Please sign in with your password.']);
        }

        $user->forceFill([
            'google_id' => $googleId,
            'avatar'    => $user->avatar ?: ($challenge->payload['avatar'] ?? null),
        ])->save();
        if (!$user->email_verified_at) {
            $user->forceFill(['email_verified_at' => now()])->save();
        }

        Log::info('Google account linked after email proof', ['user_id' => $user->id]);

        Auth::login($user, true);
        $request->session()->regenerate();

        if ($user->isPlatformAdmin()) {
            session(['platform_last_activity' => time()]);
            return redirect()->route('platform.dashboard');
        }

        return PostLoginRedirect::for($user);
    }

    public static function mask(string $email): string
    {
        if (!str_contains($email, '@')) {
            return '';
        }
        [$local, $domain] = explode('@', $email, 2);
        $visible = mb_substr($local, 0, min(2, mb_strlen($local)));

        return $visible . str_repeat('•', max(1, mb_strlen($local) - mb_strlen($visible))) . '@' . $domain;
    }
}
