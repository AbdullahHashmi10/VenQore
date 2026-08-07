<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DrmLockMiddleware
{
    /**
     * Tolerance for "future" timestamps before treating them as clock tampering.
     * Absorbs timezone offsets (~14h max) and minor clock skew so honest users
     * are never locked out, while a real backwards clock roll of days is caught.
     */
    private const CLOCK_TOLERANCE_HOURS = 24;

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

        // 1. HMAC-SHA256 row integrity check
        if (!is_null($license->signature)) {
            $expectedSignature = hash_hmac('sha256', $license->id . $license->tenant_id . $license->license_key . $license->hardware_fingerprint . $license->grace_period_days . $license->is_active, config('app.key'));
            if ($license->signature !== $expectedSignature) {
                return response()->json([
                    'error' => 'Cryptographic integrity check failed. License file has been tampered with.',
                ], 403);
            }
        }

        // Hardware fingerprint check
        if ($license->hardware_fingerprint && $license->hardware_fingerprint !== $hardwareFingerprint) {
            return response()->json([
                'error' => 'Hardware fingerprint mismatch.',
            ], 403);
        }

        // 2. Cryptographic challenge-response check
        if (str_contains($licenseKey, 'CHALLENGE')) {
            $sigToken = $request->header('X-DRM-Signature-Token') ?: $request->input('signature_token');
            if (!$sigToken) {
                return response()->json([
                    'error' => 'Cryptographic device verification failed. Hardware signature token is missing.',
                ], 403);
            }
            $expectedToken = hash_hmac('sha256', $hardwareFingerprint, config('app.key'));
            if ($sigToken !== $expectedToken) {
                return response()->json([
                    'error' => 'Cryptographic device verification failed. Invalid hardware signature token.',
                ], 403);
            }
        }

        // 3. Cross-context session verification
        if (auth()->check()) {
            $user = auth()->user();
            $activeStoreId = app()->bound('current.tenant') ? app('current.tenant')->id : $user->last_store_id;
            
            if ($activeStoreId && $license->tenant_id && (int) $activeStoreId !== (int) $license->tenant_id) {
                return response()->json([
                    'error' => 'DRM License context mismatch. Request store session does not match license owner.',
                ], 403);
            }
        }

        // 4. Auto-bind current.tenant
        if (!app()->bound('current.tenant') && $license->tenant_id) {
            $tenant = \App\Models\Tenant::find($license->tenant_id);
            if ($tenant) {
                app()->instance('current.tenant', $tenant);
            }
        }

        // Clock tampering check (with timezone/skew tolerance)
        if ($license->last_validated_at && now()->addHours(self::CLOCK_TOLERANCE_HOURS)->lt(Carbon::parse($license->last_validated_at))) {
            return response()->json([
                'error' => 'Clock tampering detected. Please set your system clock to the correct time.',
            ], 403);
        }

        $tenantId = app()->bound('current.tenant') ? app('current.tenant')->id : $license->tenant_id;
        if ($tenantId) {
            $maxPostedAt = DB::table('sales')
                ->where('tenant_id', $tenantId)
                ->where('status', 'posted')
                ->max('posted_at');
            
            if ($maxPostedAt && now()->addHours(self::CLOCK_TOLERANCE_HOURS)->lt(Carbon::parse($maxPostedAt))) {
                return response()->json([
                    'error' => 'Clock tampering detected. Please set your system clock to the correct time.',
                ], 403);
            }
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
