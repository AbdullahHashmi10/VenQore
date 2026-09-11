<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\ConfirmablePasswordController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\EmailVerificationPromptController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\VerifyEmailController;
use App\Http\Controllers\Auth\PlatformOwnerAuthController;
use App\Http\Controllers\Auth\GoogleAuthController;
use Illuminate\Support\Facades\Route;

Route::get('/auth/google', [GoogleAuthController::class, 'redirect'])->name('auth.google');
Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback'])->middleware('throttle:20,1');

// AUTH-01 (2026-09-10): emailed one-time code step (sign-up, every email/password
// sign-in, first-time Google linking). Guests only — no session exists yet.
Route::middleware(['guest', \App\Http\Middleware\NoIndexMiddleware::class])->group(function () {
    Route::get('verify-code', [\App\Http\Controllers\Auth\EmailOtpController::class, 'show'])->name('otp.show');
    Route::post('verify-code', [\App\Http\Controllers\Auth\EmailOtpController::class, 'verify'])->middleware('throttle:10,1')->name('otp.verify');
    Route::post('verify-code/resend', [\App\Http\Controllers\Auth\EmailOtpController::class, 'resend'])->middleware('throttle:3,1')->name('otp.resend');
    Route::post('verify-code/cancel', [\App\Http\Controllers\Auth\EmailOtpController::class, 'cancel'])->name('otp.cancel');
});

Route::middleware(['guest', \App\Http\Middleware\NoIndexMiddleware::class])->group(function () {
    Route::get('login', [AuthenticatedSessionController::class, 'create'])
        ->name('login');

    Route::post('login', [AuthenticatedSessionController::class, 'store'])
        ->middleware('throttle:auth');
    Route::post('login/passcode', [AuthenticatedSessionController::class, 'storePasscode'])
        ->middleware('throttle:auth')
        ->name('login.passcode');
    Route::post('login/pin', [AuthenticatedSessionController::class, 'storePosPin'])
        ->middleware('throttle:auth')
        ->name('login.pin');

    Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])
        ->name('password.request');

    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])
        ->middleware('throttle:auth')
        ->name('password.email');

    Route::get('reset-password/{token}', [NewPasswordController::class, 'create'])
        ->name('password.reset');

    Route::post('reset-password', [NewPasswordController::class, 'store'])
        ->middleware('throttle:auth')
        ->name('password.store');
});

Route::middleware('guest')->group(function () {
    Route::get('register', [RegisteredUserController::class, 'create'])
        ->name('register');

    Route::post('register', [RegisteredUserController::class, 'store'])
        ->middleware('throttle:auth');
});

Route::middleware(['auth', \App\Http\Middleware\NoIndexMiddleware::class])->group(function () {
    Route::get('verify-email', EmailVerificationPromptController::class)
        ->name('verification.notice');

    Route::get('verify-email/{id}/{hash}', VerifyEmailController::class)
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');

    Route::post('email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('verification.send');

    Route::get('confirm-password', [ConfirmablePasswordController::class, 'show'])
        ->name('password.confirm');

    Route::post('confirm-password', [ConfirmablePasswordController::class, 'store']);

    Route::put('password', [PasswordController::class, 'update'])->name('password.update');

    // SEC-05 (2026-09-10): authenticator-app MFA (enforced by Require2FA).
    Route::get('2fa/setup', [\App\Http\Controllers\Auth\TwoFactorController::class, 'showSetup'])->name('2fa.setup');
    Route::post('2fa/confirm', [\App\Http\Controllers\Auth\TwoFactorController::class, 'confirmSetup'])->middleware('throttle:6,1')->name('2fa.confirm');
    Route::get('2fa/recovery-codes', [\App\Http\Controllers\Auth\TwoFactorController::class, 'showRecoveryCodes'])->name('2fa.recovery');
    Route::get('2fa/verify', [\App\Http\Controllers\Auth\TwoFactorController::class, 'showVerify'])->name('2fa.verify');
    Route::post('2fa/verify', [\App\Http\Controllers\Auth\TwoFactorController::class, 'verify'])->middleware('throttle:6,1')->name('2fa.post-verify');

    Route::get('logout', [AuthenticatedSessionController::class, 'destroy']);
    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');
});

// ── Platform Owner Secure HQ Login ──────────────────────────────────────────
Route::middleware([\App\Http\Middleware\NoIndexMiddleware::class])->group(function () {
    Route::get('/VenQore-login',         [PlatformOwnerAuthController::class, 'create'])->name('platform.login');
    Route::post('/VenQore-login',        [PlatformOwnerAuthController::class, 'store'])->middleware('throttle:10,1')->name('platform.login.store');
    Route::post('/VenQore-login/pin',    [PlatformOwnerAuthController::class, 'storePin'])->middleware('throttle:5,1')->name('platform.login.pin');

    // ── Staff Member Login ──────────────────────────────────────────────────────
    Route::get('/staff-login',           [\App\Http\Controllers\Auth\StaffAuthController::class, 'create'])->name('staff.login');
    Route::post('/staff-login',          [\App\Http\Controllers\Auth\StaffAuthController::class, 'store'])->name('staff.login.store');
});
