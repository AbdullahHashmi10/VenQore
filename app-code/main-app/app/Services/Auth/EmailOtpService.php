<?php

namespace App\Services\Auth;

use App\Mail\EmailOtpCodeMail;
use App\Models\EmailOtpChallenge;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

/**
 * AUTH-01 (2026-09-10): emailed one-time codes for sign-up, every
 * email/password sign-in, and first-time Google linking.
 *
 * Properties (see audit "OTP and abuse-control specification"):
 *   - 6-digit code from random_int; only an HMAC (keyed with APP_KEY) is stored.
 *   - Expires after `ttl_minutes` (default 5); max `max_attempts` wrong guesses.
 *   - Bound to purpose + the browser session that started it.
 *   - Single use, consumed atomically under a row lock.
 *   - Resend invalidates the previous code, keeps the attempt count, respects a
 *     cooldown and per-challenge / per-email / per-IP / global send budgets.
 *   - Budgets are enforced BEFORE a mail job is queued, so an attacker cannot
 *     burn the (free-tier) email quota. Check-and-spend is one locked step;
 *     resend runs under the challenge row lock (serialised with verify).
 *   - A queued email is dropped at send time if its code was superseded,
 *     used or has expired (EmailOtpCodeMail::send).
 * Storage is the application database + cache — no Redis required.
 */
class EmailOtpService
{
    public const OK = 'ok';
    public const INVALID = 'invalid';
    public const EXPIRED = 'expired';
    public const LOCKED = 'locked';
    public const NOT_FOUND = 'not_found';

    public function config(string $key, $default = null)
    {
        return config('venqore.otp.' . $key, $default);
    }

    /**
     * Start (or replace) a challenge and email the code.
     *
     * @return array{0: ?EmailOtpChallenge, 1: ?string} [challenge, errorMessage]
     */
    public function start(Request $request, string $purpose, string $email, ?int $userId = null, ?array $payload = null): array
    {
        $email = Str::lower(trim($email));

        if ($error = $this->reserveSend($request, $email)) {
            return [null, $error];
        }

        // Supersede any open challenge for the same email + purpose.
        EmailOtpChallenge::where('email', $email)
            ->where('purpose', $purpose)
            ->whereNull('consumed_at')
            ->update(['consumed_at' => now(), 'expires_at' => now()]);

        $code = $this->generateCode();

        $challenge = EmailOtpChallenge::create([
            'id'           => 'otp_' . Str::random(36),
            'purpose'      => $purpose,
            'email'        => $email,
            'user_id'      => $userId,
            'payload'      => $payload,
            'code_hash'    => $this->hashCode($code),
            'session_hash' => $this->sessionHash($request),
            'attempts'     => 0,
            'sends'        => 1,
            'last_sent_at' => now(),
            'expires_at'   => now()->addMinutes((int) $this->config('ttl_minutes', 5)),
            'ip'           => $request->ip(),
        ]);

        $this->deliver($email, $code, $purpose, $challenge->id);

        return [$challenge, null];
    }

    /**
     * Resend: new code on the same challenge (old code stops working).
     *
     * @return ?string error message, or null when sent
     */
    public function resend(Request $request, EmailOtpChallenge $challenge): ?string
    {
        // Serialised with verify() and with other resends by the row lock, so
        // two simultaneous requests cannot both pass the cooldown / send-count
        // checks (recheck item 5).
        $result = DB::transaction(function () use ($request, $challenge) {
            /** @var EmailOtpChallenge|null $locked */
            $locked = EmailOtpChallenge::whereKey($challenge->getKey())->lockForUpdate()->first();

            if (!$locked || $locked->consumed_at || $locked->attempts >= (int) $this->config('max_attempts', 5)) {
                return ['This code can no longer be used. Please start again.', null];
            }

            $cooldown = (int) $this->config('resend_cooldown_seconds', 60);
            if ($locked->last_sent_at && $locked->last_sent_at->diffInSeconds(now()) < $cooldown) {
                $wait = $cooldown - (int) $locked->last_sent_at->diffInSeconds(now());
                return ["Please wait {$wait} seconds before requesting another code.", null];
            }

            if ($locked->sends >= (int) $this->config('max_sends_per_challenge', 5)) {
                return ['Too many codes requested. Please start again later.', null];
            }

            if ($error = $this->reserveSend($request, $locked->email)) {
                return [$error, null];
            }

            $code = $this->generateCode();
            $locked->forceFill([
                'code_hash'    => $this->hashCode($code),
                'sends'        => $locked->sends + 1,
                'last_sent_at' => now(),
                'expires_at'   => now()->addMinutes((int) $this->config('ttl_minutes', 5)),
            ])->save();

            return [null, [$locked, $code]];
        });

        [$error, $sent] = $result;
        if ($error !== null) {
            return $error;
        }

        [$locked, $code] = $sent;
        $challenge->setRawAttributes($locked->getAttributes(), true);
        // Outside the transaction: a queued job must never be written for a
        // change that could still roll back.
        $this->deliver($locked->email, $code, $locked->purpose, $locked->id);

        return null;
    }

    /**
     * Verify and atomically consume.
     *
     * @return array{0: string, 1: ?EmailOtpChallenge} [status, challenge]
     */
    public function verify(Request $request, string $challengeId, string $purpose, string $code): array
    {
        $code = preg_replace('/\D/', '', $code) ?? '';

        return DB::transaction(function () use ($request, $challengeId, $purpose, $code) {
            /** @var EmailOtpChallenge|null $challenge */
            $challenge = EmailOtpChallenge::whereKey($challengeId)->lockForUpdate()->first();

            if (!$challenge || $challenge->purpose !== $purpose
                || !hash_equals($challenge->session_hash, $this->sessionHash($request))) {
                return [self::NOT_FOUND, null];
            }
            if ($challenge->consumed_at) {
                return [self::NOT_FOUND, null];
            }
            if ($challenge->expires_at->isPast()) {
                return [self::EXPIRED, $challenge];
            }
            if ($challenge->attempts >= (int) $this->config('max_attempts', 5)) {
                return [self::LOCKED, $challenge];
            }

            $challenge->attempts = $challenge->attempts + 1;

            $isLocalRequest = in_array($request->getHost(), ['127.0.0.1', 'localhost', '::1'], true)
                || in_array($request->ip(), ['127.0.0.1', '::1'], true);

            $isDevMaster = app()->environment('local')
                && $isLocalRequest
                && ($master = (string) $this->config('dev_master_code', '000000')) !== ''
                && $code === $master;

            if (!$isDevMaster && (strlen($code) !== 6 || !hash_equals($challenge->code_hash, $this->hashCode($code)))) {
                $challenge->save();
                return [$challenge->attempts >= (int) $this->config('max_attempts', 5) ? self::LOCKED : self::INVALID, $challenge];
            }

            $challenge->consumed_at = now();
            $challenge->save();

            return [self::OK, $challenge];
        });
    }

    public function find(?string $challengeId): ?EmailOtpChallenge
    {
        return $challengeId ? EmailOtpChallenge::find($challengeId) : null;
    }

    /** Delete expired/consumed rows older than a day (scheduled). */
    public function prune(): int
    {
        return EmailOtpChallenge::where('expires_at', '<', now()->subDay())->delete();
    }

    // ── internals ────────────────────────────────────────────────────────

    private function generateCode(): string
    {
        return str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    }

    private function hashCode(string $code): string
    {
        return self::codeHash($code);
    }

    /** HMAC of a code as stored on the challenge (also used by the mail job). */
    public static function codeHash(string $code): string
    {
        return hash_hmac('sha256', $code, 'email-otp|' . config('app.key'));
    }

    private function sessionHash(Request $request): string
    {
        $sid = $request->hasSession() ? $request->session()->get('_otp_binding') : null;
        if (!$sid && $request->hasSession()) {
            $sid = Str::random(40);
            $request->session()->put('_otp_binding', $sid);
        }

        return hash('sha256', (string) $sid);
    }

    /**
     * Check AND spend the send budgets in one step, under a lock, so parallel
     * requests cannot all pass the same check before any of them records a
     * send (recheck item 5). Returns a user-facing error, or null when a send
     * was reserved.
     */
    private function reserveSend(Request $request, string $email): ?string
    {
        try {
            return Cache::lock('otp-send-budget', 10)->block(5, function () use ($request, $email) {
                if ($error = $this->checkSendBudgets($request, $email)) {
                    return $error;
                }
                $this->recordSend($request, $email);
                return null;
            });
        } catch (\Illuminate\Contracts\Cache\LockTimeoutException $e) {
            return 'We are busy sending codes. Please try again in a moment.';
        }
    }

    /** Returns a user-facing error if any budget is exhausted. */
    private function checkSendBudgets(Request $request, string $email): ?string
    {
        $perEmail = (int) $this->config('max_sends_per_email_per_hour', 5);
        $perIp    = (int) $this->config('max_sends_per_ip_per_hour', 20);
        $global   = (int) $this->config('max_sends_global_per_day', 90);

        if (RateLimiter::tooManyAttempts('otp-send-email:' . sha1($email), $perEmail)
            || RateLimiter::tooManyAttempts('otp-send-ip:' . $request->ip(), $perIp)) {
            return 'Too many codes requested. Please wait a while and try again.';
        }

        $dayKey = 'otp-send-global:' . now()->format('Ymd');
        if ((int) Cache::get($dayKey, 0) >= $global) {
            Log::critical('Email OTP global daily send budget reached', ['budget' => $global]);
            return 'We cannot send sign-in codes right now. Please try again later.';
        }

        return null;
    }

    private function recordSend(Request $request, string $email): void
    {
        RateLimiter::hit('otp-send-email:' . sha1($email), 3600);
        RateLimiter::hit('otp-send-ip:' . $request->ip(), 3600);

        $dayKey = 'otp-send-global:' . now()->format('Ymd');
        Cache::add($dayKey, 0, 86400 * 2);
        $count = Cache::increment($dayKey);

        $warnAt = (int) $this->config('global_warning_at', 70);
        if ($count === $warnAt) {
            Log::warning('Email OTP daily send volume reached warning level', ['count' => $count]);
        }
    }

    private function deliver(string $email, string $code, string $purpose, ?string $challengeId = null): void
    {
        $mail = new EmailOtpCodeMail($code, $purpose, (int) $this->config('ttl_minutes', 5), $challengeId);

        // Production: queued (encrypted payload, retried by the worker).
        // Elsewhere: sent inline, so local sign-in works without a queue worker
        // (with MAIL_MAILER=log the code appears in storage/logs/laravel.log).
        $mode = $this->config('delivery') ?: (app()->environment('production') ? 'queue' : 'sync');

        if ($mode === 'sync') {
            try {
                Mail::to($email)->sendNow($mail);
            } catch (\Throwable $e) {
                report($e);
            }
            return;
        }

        Mail::to($email)->queue($mail);
    }
}
