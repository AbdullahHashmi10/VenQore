<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\TwoFactorService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Crypt;
use Inertia\Inertia;

class TwoFactorController extends Controller
{
    protected $twoFactorService;

    public function __construct(TwoFactorService $twoFactorService)
    {
        $this->twoFactorService = $twoFactorService;
    }

    /**
     * Show the 2FA setup page.
     */
    public function showSetup(Request $request)
    {
        $user = Auth::user();

        $attrs = $user->getAttributes();
        if (!empty($attrs['two_factor_secret']) && !empty($attrs['two_factor_confirmed_at'])) {
            return redirect()->to($this->homeFor($user));
        }

        // The pending secret lives on the user row (encrypted, unconfirmed),
        // not in the session: a background request finishing after this page
        // could overwrite the session and drop it, so the next code was
        // checked against a NEW secret and the key on screen changed after a
        // single typo (found in browser testing 2026-09-10). Until
        // two_factor_confirmed_at is set it does not count as enrolled.
        $secret = $this->pendingSecret($user);

        // SEC-05: the QR is rendered in the browser from the otpauth:// URI.
        // It used to be sent to api.qrserver.com, which handed the TOTP secret
        // to a third party.
        $otpauthUrl = $this->twoFactorService->getQRCodeUrl($secret, $user->email);

        return Inertia::render('Auth/TwoFactorSetup', [
            'secret'     => $secret,
            'otpauthUrl' => $otpauthUrl,
        ]);
    }

    /**
     * Confirm the 2FA setup.
     */
    public function confirmSetup(Request $request)
    {
        $request->validate([
            'code' => 'required|string|size:6',
        ]);

        $user = Auth::user();
        $attrs = $user->getAttributes();
        $secret = (!empty($attrs['two_factor_secret']) && empty($attrs['two_factor_confirmed_at']))
            ? $this->decryptSecret($attrs['two_factor_secret'])
            : null;

        if (!$secret) {
            return redirect()->route('2fa.setup')->withErrors(['code' => 'Session expired. Please try again.']);
        }

        if ($this->twoFactorService->verifyCode($secret, $request->code)) {
            // Save the encrypted secret
            $user->two_factor_secret = Crypt::encryptString($secret);
            $user->two_factor_confirmed_at = now();

            // Generate 8 recovery codes
            $recoveryCodes = [];
            for ($i = 0; $i < 8; $i++) {
                $recoveryCodes[] = bin2hex(random_bytes(5)); // e.g. 10-char recovery code
            }
            $user->two_factor_recovery_codes = Crypt::encryptString(json_encode($recoveryCodes));
            $user->save();

            // Store verification state in session
            $request->session()->regenerate();
            session(['2fa_verified_at' => now()]);

            // Show the recovery codes exactly once.
            session()->flash('2fa_recovery_codes', $recoveryCodes);

            return redirect()->route('2fa.recovery');
        }

        return back()->withErrors(['code' => 'Invalid verification code. Please try again.']);
    }

    /** The unconfirmed secret for this user, created (encrypted) on first visit. */
    private function pendingSecret($user): string
    {
        $attrs = $user->getAttributes();
        if (!empty($attrs['two_factor_secret']) && empty($attrs['two_factor_confirmed_at'])) {
            $existing = $this->decryptSecret($attrs['two_factor_secret']);
            if ($existing) {
                return $existing;
            }
        }

        $secret = $this->twoFactorService->generateSecret();
        $user->forceFill([
            'two_factor_secret'       => Crypt::encryptString($secret),
            'two_factor_confirmed_at' => null,
        ])->save();

        return $secret;
    }

    private function decryptSecret(?string $stored): ?string
    {
        if (!$stored) {
            return null;
        }
        try {
            return Crypt::decryptString($stored);
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * SEC-05: show freshly generated recovery codes once, then never again.
     */
    public function showRecoveryCodes(Request $request)
    {
        $codes = session('2fa_recovery_codes');
        if (!is_array($codes) || empty($codes)) {
            return redirect()->to($this->homeFor(Auth::user()));
        }

        return Inertia::render('Auth/TwoFactorSetup', [
            'recoveryCodes' => array_values($codes),
            'continueUrl'   => $this->homeFor(Auth::user()),
        ]);
    }

    /**
     * Where a verified user lands.
     */
    private function homeFor($user): string
    {
        if ($user && !empty($user->getAttributes()['is_platform_admin'])) {
            return route('platform.dashboard');
        }
        return route('dashboard');
    }

    /**
     * SEC-05: a TOTP code is single-use. Remember accepted codes for the
     * validity window so a phished/observed code cannot be replayed.
     */
    private function consumeTotp(int $userId, string $code): bool
    {
        $key = '2fa_used:' . $userId . ':' . $code;
        return \Illuminate\Support\Facades\Cache::add($key, 1, 120);
    }

    /**
     * Show the 2FA verification page.
     */
    public function showVerify(Request $request)
    {
        return Inertia::render('Auth/TwoFactorVerify');
    }

    /**
     * Verify the 2FA code.
     */
    public function verify(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
        ]);

        $user = Auth::user();
        if (empty($user->getAttributes()['two_factor_secret'])) {
            return redirect()->to($this->homeFor($user));
        }

        $secret = Crypt::decryptString($user->two_factor_secret);

        // Check standard 6-digit code
        if (strlen($request->code) === 6 && is_numeric($request->code)) {
            if ($this->twoFactorService->verifyCode($secret, $request->code) && $this->consumeTotp($user->id, $request->code)) {
                $request->session()->regenerate();
                session(['2fa_verified_at' => now()]);
                return redirect()->intended($this->homeFor($user));
            }
        }

        // Check recovery codes
        if ($user->two_factor_recovery_codes) {
            $recoveryCodes = json_decode(Crypt::decryptString($user->two_factor_recovery_codes), true);
            if (is_array($recoveryCodes)) {
                $index = array_search(trim((string) $request->code), $recoveryCodes, true);
                if ($index !== false) {
                    // Remove recovery code
                    unset($recoveryCodes[$index]);
                    $user->two_factor_recovery_codes = Crypt::encryptString(json_encode(array_values($recoveryCodes)));
                    $user->save();

                    $request->session()->regenerate();
                    session(['2fa_verified_at' => now()]);
                    \Illuminate\Support\Facades\Log::warning('2FA recovery code used', ['user_id' => $user->id, 'remaining' => count($recoveryCodes)]);
                    return redirect()->intended($this->homeFor($user));
                }
            }
        }

        return back()->withErrors(['code' => 'Invalid authentication code.']);
    }
}
