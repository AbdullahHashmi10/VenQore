<?php

namespace App\Http\Middleware;

use App\Models\Setting;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

/**
 * EnsureSmartCaptureAccess — platform kill-switch & access gate for AI Scan (SmartCapture).
 */
class EnsureSmartCaptureAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $dbValue = null;
        try {
            $dbValue = Cache::remember('smartcapture_enabled_flag', 60, function () {
                return Setting::withoutGlobalScopes()
                    ->whereNull('tenant_id')
                    ->where('key', 'smartcapture_enabled')
                    ->value('value');
            });
        } catch (\Throwable $e) {
            // Database not ready or migration running
        }

        $enabled = $dbValue !== null ? (bool) $dbValue : (bool) config('smartcapture.enabled', true);

        if (!$enabled) {
            abort(404);
        }

        return $next($request);
    }
}
