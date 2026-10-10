<?php

namespace App\Support;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Structured, redacted events for the sale path (sale-reliability plan §5).
 *
 * Every record carries a correlation id (also returned to the till), tenant,
 * user, endpoint and the event's own safe fields. Never pass card numbers,
 * PINs, tokens or a raw request body here; keys in REDACT are masked anyway.
 */
final class SaleEvents
{
    private const REDACT = ['approval_pin', 'pin', 'password', 'token', 'card_number', 'cvv', 'authorization'];

    private static ?string $correlationId = null;

    public static function correlationId(): string
    {
        if (self::$correlationId === null) {
            $header = request()?->header('X-Correlation-Id');
            self::$correlationId = ($header && preg_match('/^[A-Za-z0-9\-]{8,64}$/', $header))
                ? $header
                : 'sale-' . Str::lower(Str::random(12));
        }
        return self::$correlationId;
    }

    /** Reset between requests in long-running workers and tests. */
    public static function reset(): void
    {
        self::$correlationId = null;
    }

    public static function record(string $event, array $context = [], string $level = 'info'): void
    {
        try {
            array_walk_recursive($context, function (&$v, $k) {
                if (is_string($k) && in_array(strtolower($k), self::REDACT, true)) {
                    $v = '[redacted]';
                }
            });
            $req = request();
            Log::log($level, 'sale.' . $event, $context + [
                'event'          => $event,
                'correlation_id' => self::correlationId(),
                'tenant_id'      => app()->bound('current.tenant') ? app('current.tenant')?->id : null,
                'user_id'        => auth()->id(),
                'endpoint'       => $req ? $req->method() . ' ' . $req->path() : null,
                'channel'        => $req?->input('channel', $req?->input('source')),
            ]);
        } catch (\Throwable) {
            // Telemetry must never break a sale.
        }
    }
}
