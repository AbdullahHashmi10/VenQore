<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Terminal;
use Illuminate\Support\Facades\DB;

class HeartbeatController extends Controller
{
    /**
     * Handle the heartbeat ping from VenQore Station
     */
    public function store(Request $request)
    {
        $terminalId = $request->input('terminal_id');
        $deviceId = $request->input('device_id');
        $storeSlug = $request->input('store_slug');
        $status = $request->input('status', 'OPEN');
        $reason = $request->input('reason', null);

        if (!$deviceId) {
            return response()->json(['error' => 'Device ID required'], 400);
        }

        // Resolve Tenant if store_slug is provided
        $tenant = null;
        if ($storeSlug) {
            $tenant = \App\Models\Tenant::where('slug', $storeSlug)->first();
        }

        // Find or Create Terminal using withoutGlobalScope to bypass '1 = 0' fallback
        $terminal = null;
        
        if ($deviceId) {
            $terminal = Terminal::withoutGlobalScope('tenant')->where('device_id', $deviceId)->first();
        }
        
        if (!$terminal && $terminalId && \Illuminate\Support\Str::isUuid($terminalId)) {
            $terminal = Terminal::withoutGlobalScope('tenant')->find($terminalId);
        }

        if (!$terminal && $terminalId) {
            // Find by name pattern
            $terminal = Terminal::withoutGlobalScope('tenant')->where('name', 'Terminal ' . $terminalId)->first();
        }

        if (!$terminal) {
            $nameSuffix = $terminalId ?: substr($deviceId, 0, 8);
            $terminal = Terminal::create([
                'name' => 'Terminal ' . $nameSuffix,
                'device_id' => $deviceId,
                'tenant_id' => $tenant ? $tenant->id : null,
                'ip_address' => $request->ip(),
                'status' => 'OPEN',
            ]);
        } else {
            if ($tenant) {
                if (empty($terminal->tenant_id)) {
                    $terminal->update(['tenant_id' => $tenant->id]);
                } elseif ((string) $terminal->tenant_id !== (string) $tenant->id) {
                    return response()->json(['error' => 'Terminal does not belong to this store.'], 403);
                }
            }
            if ($deviceId && !$terminal->device_id) {
                $terminal->update(['device_id' => $deviceId]);
            }
        }

        // Logic to clear "CLOSED_NORMALLY" if it's sending pings again (it woke up)
        // But if the status sent IS "CLOSED_NORMALLY" (shutdown signal), we respect it.
        $newStatus = $status;

        // If the request didn't send a status (just a heartbeat), and the current status is CLOSED_NORMALLY,
        // it means the app restarted. We should flip it to OPEN.
        if (!$request->has('status') && ($terminal->status === 'CLOSED_NORMALLY' || $terminal->status === 'CLOSED')) {
            $newStatus = 'OPEN';
        }

        $terminal->update([
            'last_heartbeat_at' => now(),
            'ip_address' => $request->ip(),
            'status' => $newStatus,
            'last_status_reason' => $reason,
        ]);

        // Check for Pending Updates
        // Optimization: Use separate 'last_synced_at' in the future.
        // For now, we check if any critical table was updated in the last 2 minutes.
        $hasUpdates = $this->checkForUpdates($terminal->last_heartbeat_at);

        return response()->json([
            'status' => 'alive',
            'terminal_id' => $terminal->id,
            'server_time' => now()->toIso8601String(),
            'has_pending_updates' => $hasUpdates,
            'ack_status' => $terminal->status
        ]);
    }

    private function checkForUpdates($since)
    {
        // Check if Admin made changes to Products or Settings recently
        // Ideally, 'since' should be the client's last sync time, but we use last heartbeat for "recent" check
        $threshold = now()->subMinutes(5);

        $productsChanged = DB::table('products')->where('updated_at', '>', $threshold)->exists();
        $settingsChanged = DB::table('settings')->where('updated_at', '>', $threshold)->exists();

        return $productsChanged || $settingsChanged;
    }
}
