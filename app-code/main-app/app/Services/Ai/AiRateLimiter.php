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

            if ($row->day_limit > 0 && ($dayCount + $cost) > $row->day_limit) {
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
}
