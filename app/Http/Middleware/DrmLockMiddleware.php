<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DrmLockMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $licenseKey = $request->header('X-DRM-License-Key') ?: $request->input('license_key');
        $hardwareFingerprint = $request->header('X-DRM-Hardware-Fingerprint') ?: $request->input('hardware_fingerprint');

        if (!$licenseKey) {
            return response()->json([
                'error' => 'DRM license key is required.',
            ], 403);
        }

        $license = DB::table('drm_licenses')
            ->where('license_key', $licenseKey)
            ->where('is_active', 1)
            ->first();

        if (!$license) {
            return response()->json([
                'error' => 'Invalid or inactive DRM license key.',
            ], 403);
        }

        // Hardware fingerprint check
        if ($license->hardware_fingerprint && $license->hardware_fingerprint !== $hardwareFingerprint) {
            return response()->json([
                'error' => 'Hardware fingerprint mismatch.',
            ], 403);
        }

        // Grace period check
        if ($license->last_validated_at) {
            $lastValidated = Carbon::parse($license->last_validated_at);
            if ($lastValidated->diffInDays(now()) > $license->grace_period_days) {
                return response()->json([
                    'error' => 'Offline grace period has expired. Please connect to the internet to validate your license.',
                ], 403);
            }
        } else {
            // Never validated - has grace period from created_at
            $createdAt = Carbon::parse($license->created_at);
            if ($createdAt->diffInDays(now()) > $license->grace_period_days) {
                return response()->json([
                    'error' => 'Offline grace period has expired. Please connect to the internet to validate your license.',
                ], 403);
            }
        }

        return $next($request);
    }
}
