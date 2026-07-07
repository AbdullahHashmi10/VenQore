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

        if ($user->two_factor_secret && $user->two_factor_confirmed_at) {
            return redirect()->route('dashboard');
        }

        // Generate a new secret if not already in session
        $secret = session('2fa_secret') ?: $this->twoFactorService->generateSecret();
        session(['2fa_secret' => $secret]);

        $qrCodeUrl = $this->twoFactorService->getQRCodeUrl($secret, $user->email);
        
        // Use a secure Google Charts or QR Server API to render the QR Code
        $qrImageUrl = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" . urlencode($qrCodeUrl);

        return Inertia::render('Auth/TwoFactorSetup', [
            'secret' => $secret,
            'qrCodeUrl' => $qrImageUrl,
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
        $secret = session('2fa_secret');

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
            session(['2fa_verified_at' => now()]);
            session()->forget('2fa_secret');

            return redirect()->route('dashboard')->with('success', 'Two-factor authentication enabled successfully.');
        }

        return back()->withErrors(['code' => 'Invalid verification code. Please try again.']);
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
        if (!$user->two_factor_secret) {
            return redirect()->route('dashboard');
        }

        $secret = Crypt::decryptString($user->two_factor_secret);

        // Check standard 6-digit code
        if (strlen($request->code) === 6 && is_numeric($request->code)) {
            if ($this->twoFactorService->verifyCode($secret, $request->code)) {
                session(['2fa_verified_at' => now()]);
                return redirect()->intended(route('dashboard'));
            }
        }

        // Check recovery codes
        if ($user->two_factor_recovery_codes) {
            $recoveryCodes = json_decode(Crypt::decryptString($user->two_factor_recovery_codes), true);
            if (is_array($recoveryCodes)) {
                $index = array_search($request->code, $recoveryCodes);
                if ($index !== false) {
                    // Remove recovery code
                    unset($recoveryCodes[$index]);
                    $user->two_factor_recovery_codes = Crypt::encryptString(json_encode(array_values($recoveryCodes)));
                    $user->save();

                    session(['2fa_verified_at' => now()]);
                    return redirect()->intended(route('dashboard'));
                }
            }
        }

        return back()->withErrors(['code' => 'Invalid authentication code.']);
    }
}
