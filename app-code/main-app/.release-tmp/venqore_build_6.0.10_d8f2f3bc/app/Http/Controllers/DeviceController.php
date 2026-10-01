<?php

namespace App\Http\Controllers;

use App\Models\UserDevice;
use App\Services\DeviceSessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DeviceController extends Controller
{
    /**
     * List all devices for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['devices' => []], 401);
        }

        $devices = UserDevice::where('user_id', $user->id)
            ->where('is_active', true)
            ->orderByDesc('last_active_at')
            ->get(['id', 'device_label', 'ip_country', 'last_active_at', 'current_session_id']);

        $currentSessionId = $request->session()->getId();

        $formatted = $devices->map(function ($dev) use ($currentSessionId) {
            return [
                'id'             => $dev->id,
                'device_label'   => $dev->device_label,
                'ip_country'     => $dev->ip_country ?: 'Unknown',
                'last_active_at' => $dev->last_active_at?->diffForHumans() ?? 'Just now',
                'is_current'     => $dev->current_session_id === $currentSessionId,
            ];
        });

        return response()->json(['devices' => $formatted]);
    }

    /**
     * Deactivate / sign out a device.
     */
    public function deactivate(Request $request, int $id): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $success = DeviceSessionService::deactivateDevice($user, $id);

        return response()->json([
            'success' => $success,
            'message' => $success ? 'Device signed out successfully.' : 'Device not found.',
        ]);
    }

    /**
     * Check eviction status for current session.
     */
    public function evictionStatus(Request $request): JsonResponse
    {
        $sessionId = $request->session()->getId();
        $notice = DeviceSessionService::checkEviction($sessionId);

        return response()->json([
            'evicted' => !is_null($notice),
            'notice'  => $notice,
        ]);
    }
}
