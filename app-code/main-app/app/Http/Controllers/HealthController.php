<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Storage;

/**
 * HealthController — Pre-Launch Checklist §14
 *
 * GET /health
 *
 * Returns a JSON status object that verifies all critical dependencies.
 * Used by:
 *   - UptimeRobot (monitor every 5 min)
 *   - Deploy script (post-deploy health check)
 *   - Internal alerting
 *
 * Returns HTTP 200 when all components are "ok".
 * Returns HTTP 503 when any component is "fail".
 *
 * Response format:
 * {
 *   "status": "ok" | "degraded" | "fail",
 *   "database": "ok" | "fail",
 *   "redis": "ok" | "fail",
 *   "storage": "ok" | "fail",
 *   "queue": "ok" | "fail",
 *   "timestamp": "2026-04-10T09:00:00Z"
 * }
 *
 * IMPORTANT: This route must be public (no auth middleware).
 * But it should NOT expose sensitive server info.
 */
class HealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $checks = [];
        $allOk  = true;

        // ── 1. Database ───────────────────────────────────────────────
        try {
            DB::select('SELECT 1');
            $checks['database'] = 'ok';
        } catch (\Throwable) {
            $checks['database'] = 'fail';
            $allOk = false;
        }

        // ── 2. Redis ──────────────────────────────────────────────────
        try {
            $pong = Redis::ping();
            $checks['redis'] = ($pong === true || $pong === '+PONG' || $pong === 'PONG') ? 'ok' : 'fail';
            if ($checks['redis'] === 'fail') {
                $allOk = false;
            }
        } catch (\Throwable) {
            $checks['redis'] = 'fail';
            $allOk = false;
        }

        // ── 3. Cache (writes through Redis) ──────────────────────────
        try {
            $key = 'health:check:' . time();
            Cache::put($key, 'ok', 10);
            $val = Cache::get($key);
            Cache::forget($key);
            $checks['cache'] = ($val === 'ok') ? 'ok' : 'fail';
            if ($checks['cache'] === 'fail') {
                $allOk = false;
            }
        } catch (\Throwable) {
            $checks['cache'] = 'fail';
            $allOk = false;
        }

        // ── 4. Storage (write test — uses default disk) ───────────────
        try {
            $testPath = 'health/ping.txt';
            Storage::put($testPath, 'ok');
            $content = Storage::get($testPath);
            Storage::delete($testPath);
            $checks['storage'] = ($content === 'ok') ? 'ok' : 'fail';
            if ($checks['storage'] === 'fail') {
                $allOk = false;
            }
        } catch (\Throwable) {
            // Storage is degraded but not critical (app can operate without it temporarily)
            $checks['storage'] = 'degraded';
        }

        // ── 5. Queue workers (Horizon) ────────────────────────────────
        // We check if Horizon's heartbeat was updated recently (within 10 minutes)
        try {
            $lastPulse = Cache::store('redis')->get('horizon:master:' . config('horizon.prefix', 'horizon') . ':pulse');
            if ($lastPulse && (time() - $lastPulse) < 600) {
                $checks['queue'] = 'ok';
            } else {
                // Try an alternative approach: check if any Horizon process is registered
                $masters = Redis::smembers('horizon:' . config('horizon.prefix', 'horizon') . ':masters');
                $checks['queue'] = (!empty($masters)) ? 'ok' : 'degraded';
            }
        } catch (\Throwable) {
            $checks['queue'] = 'degraded'; // degraded, not fail — app still works without queue
        }

        // ── Aggregate status ──────────────────────────────────────────
        $hasFail     = collect($checks)->contains('fail');
        $hasDegraded = collect($checks)->contains('degraded');
        $status      = $hasFail ? 'fail' : ($hasDegraded ? 'degraded' : 'ok');

        $response = array_merge(
            ['status' => $status],
            $checks,
            ['timestamp' => now()->toIso8601String()]
        );

        $httpCode = $hasFail ? 503 : 200;

        return response()->json($response, $httpCode);
    }
}
