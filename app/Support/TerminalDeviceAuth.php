<?php

namespace App\Support;

use App\Models\Terminal;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * SEC-04 (2026-09-10): device credentials for VenQore Station terminals.
 *
 * A device_id is an identifier, not a secret — it was the only thing the
 * terminal APIs checked. Each paired terminal now holds a random secret; the
 * server stores only its SHA-256. The device sends it in the X-Device-Secret
 * header. Revoke a device by clearing device_secret_hash and tenant_id.
 */
class TerminalDeviceAuth
{
    public const HEADER = 'X-Device-Secret';

    /** Issue (or rotate) a secret. Returns the plain value — show it once. */
    public static function issue(Terminal $terminal): string
    {
        $secret = Str::random(64);
        $terminal->forceFill([
            'device_secret_hash'      => hash('sha256', $secret),
            'device_secret_issued_at' => now(),
        ])->save();

        return $secret;
    }

    public static function hasSecret(Terminal $terminal): bool
    {
        return !empty($terminal->device_secret_hash);
    }

    /** Constant-time check of the request's secret against the terminal. */
    public static function verify(Terminal $terminal, Request $request): bool
    {
        $presented = (string) ($request->header(self::HEADER) ?? $request->input('device_secret', ''));
        if ($presented === '' || empty($terminal->device_secret_hash)) {
            return false;
        }

        return hash_equals((string) $terminal->device_secret_hash, hash('sha256', $presented));
    }
}
