<?php

namespace App\Services;

use App\Models\Tenant;
use App\Models\User;
use App\Models\UserDevice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class DeviceSessionService
{
    /**
     * Handle user login or session registration.
     *
     * @return array ['success' => bool, 'message' => string, 'device' => UserDevice|null, 'evicted' => bool]
     */
    public static function registerSession(User $user, ?Tenant $tenant, Request $request, ?string $explicitSessionId = null): array
    {
        // Till logins / Cashiers are free & unlimited and bypass session eviction & device caps
        $isCashier = false;
        if ($tenant) {
            $membership = $tenant->memberships()->where('user_id', $user->id)->first();
            if ($membership && $membership->role === 'cashier') {
                $isCashier = true;
            }
        }

        if ($isCashier) {
            return ['success' => true, 'message' => 'Cashier session registered', 'device' => null, 'evicted' => false];
        }

        $sessionId = $explicitSessionId
            ?: ($request->hasSession() ? $request->session()->getId() : null)
            ?: $request->header('X-Session-ID')
            ?: $request->cookie('vq_session_id')
            ?: (session()->isStarted() ? session()->getId() : null)
            ?: Str::random(40);
        $deviceToken = $request->cookie('vq_device_token') ?: Str::random(64);
        $tokenHash = hash('sha256', $deviceToken);

        $deviceLabel = $request->header('User-Agent') ? substr($request->header('User-Agent'), 0, 100) : 'Web Browser';
        $ipCountry = $request->header('CF-IPCountry') ?: $request->header('X-Country') ?: null;

        // 1. Evict any prior active sessions for this full seat user
        $priorSessions = UserDevice::where('user_id', $user->id)
            ->where('is_active', true)
            ->where('current_session_id', '!=', $sessionId)
            ->get();

        foreach ($priorSessions as $prior) {
            if ($prior->current_session_id) {
                Cache::put("evicted_session:{$prior->current_session_id}", [
                    'evicted_by' => $user->email,
                    'message'    => "You were signed out — {$user->email} signed in on another device.",
                    'time'       => now()->toIso8601String(),
                ], 86400);
            }
            $prior->update(['is_active' => false]);
        }

        // 2. Check devices_per_seat limit for the tenant's plan
        $tenantLimit = $tenant ? (int) ($tenant->getLimit('devices_per_seat') ?: 3) : 3;
        $activeDevicesCount = UserDevice::where('user_id', $user->id)->where('is_active', true)->count();

        // 3. Find or create device record
        $device = UserDevice::where('user_id', $user->id)
            ->where('device_token_hash', $tokenHash)
            ->first();

        if (!$device) {
            if ($activeDevicesCount >= $tenantLimit) {
                // Soft device cap exceeded: deactivate the oldest active device to make room
                $oldest = UserDevice::where('user_id', $user->id)
                    ->where('is_active', true)
                    ->oldest('last_active_at')
                    ->first();
                if ($oldest) {
                    $oldest->update(['is_active' => false]);
                }
            }

            $device = UserDevice::create([
                'user_id'            => $user->id,
                'tenant_id'          => $tenant?->id,
                'device_token_hash'  => $tokenHash,
                'device_label'       => $deviceLabel,
                'ip_country'         => $ipCountry,
                'current_session_id' => $sessionId,
                'is_active'          => true,
                'last_active_at'     => now(),
            ]);
        } else {
            $device->update([
                'current_session_id' => $sessionId,
                'is_active'          => true,
                'last_active_at'     => now(),
                'ip_country'         => $ipCountry ?: $device->ip_country,
            ]);
        }

        return [
            'success'      => true,
            'device'       => $device,
            'device_token' => $deviceToken,
            'evicted'      => $priorSessions->isNotEmpty(),
        ];
    }

    /**
     * Check if the current session was evicted by another login.
     */
    public static function checkEviction(?string $sessionId): ?array
    {
        if (!$sessionId) {
            return null;
        }

        return Cache::get("evicted_session:{$sessionId}");
    }

    /**
     * Self-service device deactivation.
     */
    public static function deactivateDevice(User $user, int $deviceId): bool
    {
        $device = UserDevice::where('user_id', $user->id)->where('id', $deviceId)->first();
        if ($device) {
            if ($device->current_session_id) {
                Cache::put("evicted_session:{$device->current_session_id}", [
                    'evicted_by' => $user->email,
                    'message'    => "You were signed out from device settings.",
                    'time'       => now()->toIso8601String(),
                ], 86400);
            }
            $device->update(['is_active' => false]);
            return true;
        }
        return false;
    }
}
