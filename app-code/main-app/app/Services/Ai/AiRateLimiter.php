<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\DB;

class AiRateLimiter
{
    /**
     * Attempts to acquire token capacity from a single-row locked bucket table.
     * Uses InnoDB row locking (lockForUpdate) for atomic token bucket evaluation without Redis.
     */
    public function tryAcquire(string $bucketKey, int $cost = 1): array
    {
        return DB::transaction(function () use ($bucketKey, $cost) {
            $row = DB::table('ai_rate_buckets')
                ->where('bucket_key', $bucketKey)
                ->lockForUpdate()
                ->first();

            if (!$row) {
                $feature = explode(':', $bucketKey)[0] ?? 'default';
                $config = config("ai_limits.features.{$feature}") ?? config('ai_limits.default', [
                    'capacity'       => 10,
                    'refill_per_sec' => 0.5,
                    'day_limit'      => 100,
                ]);

                $capacity = (float) ($config['capacity'] ?? 10);
                $refillPerSec = (float) ($config['refill_per_sec'] ?? 0.5);
                $dayLimit = (int) ($config['day_limit'] ?? 100);
                $anonDayLimit = self::anonDayLimit($bucketKey);
                if ($anonDayLimit !== null) {
                    $dayLimit = $anonDayLimit;
                }
                $now = microtime(true);
                $todayStr = today()->toDateString();

                DB::table('ai_rate_buckets')->insertOrIgnore([
                    'bucket_key'     => $bucketKey,
                    'tokens'         => $capacity,
                    'capacity'       => $capacity,
                    'refill_per_sec' => $refillPerSec,
                    'last_refill_at' => $now,
                    'day_count'      => 0,
                    'day_limit'      => $dayLimit,
                    'day_date'       => $todayStr,
                    'created_at'     => now(),
                    'updated_at'     => now(),
                ]);

                $row = DB::table('ai_rate_buckets')
                    ->where('bucket_key', $bucketKey)
                    ->lockForUpdate()
                    ->first();
            }

            $now = microtime(true);
            $lastRefill = (float) $row->last_refill_at;
            $capacity = (float) $row->capacity;
            $refillPerSec = (float) $row->refill_per_sec;
            $currentTokens = (float) $row->tokens;

            // Refill tokens based on elapsed time
            $elapsedSec = max(0, $now - $lastRefill);
            $tokens = min($capacity, $currentTokens + ($elapsedSec * $refillPerSec));

            $todayStr = today()->toDateString();
            $dayCount = ($row->day_date === $todayStr) ? (int) $row->day_count : 0;

            // Anonymous buckets follow the (tighter) anon_day_limit even when the
            // row was created before that setting existed — config is the authority.
            $rowDayLimit = (int) $row->day_limit;
            $anonDayLimit = self::anonDayLimit($bucketKey);
            if ($anonDayLimit !== null) {
                $rowDayLimit = $rowDayLimit > 0 ? min($rowDayLimit, $anonDayLimit) : $anonDayLimit;
            }

            if ($rowDayLimit > 0 && ($dayCount + $cost) > $rowDayLimit) {
                return ['ok' => false, 'reason' => 'daily_limit'];
            }

            if ($tokens < $cost) {
                $waitMs = $refillPerSec > 0
                    ? (int) ceil(($cost - $tokens) / $refillPerSec * 1000)
                    : 1000;

                return ['ok' => false, 'reason' => 'rate', 'wait_ms' => $waitMs];
            }

            DB::table('ai_rate_buckets')->where('bucket_key', $bucketKey)->update([
                'tokens'         => $tokens - $cost,
                'last_refill_at' => $now,
                'day_count'      => $dayCount + $cost,
                'day_date'       => $todayStr,
                'updated_at'     => now(),
            ]);

            return ['ok' => true];
        }, 3);
    }

    /**
     * Per-IP daily cap for anonymous callers. AiGateway keys anonymous traffic
     * as "{feature}:anon:{ipHash}"; config('ai_limits.features.{feature}.anon_day_limit')
     * overrides the tenant day_limit for those buckets.
     */
    public static function anonDayLimit(string $bucketKey): ?int
    {
        $parts = explode(':', $bucketKey);
        if (count($parts) < 3 || $parts[1] !== 'anon') {
            return null;
        }

        $limit = config("ai_limits.features.{$parts[0]}.anon_day_limit");

        return is_numeric($limit) ? (int) $limit : null;
    }
}
