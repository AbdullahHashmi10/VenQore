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
        // RELAXED VALIDATION FOR DEBUGGING / FRESH INSTALL
        $terminalId = $request->input('terminal_id', 1); // Default to Terminal 1
        $status = $request->input('status', 'OPEN');
        $reason = $request->input('reason', null);

        // Find or Create Terminal (Auto-register logic for simplicity)
        // We handle legacy integer IDs by looking for a "Terminal X" name if the ID isn't a valid UUID
        $terminal = null;
        
        if (\Illuminate\Support\Str::isUuid($terminalId)) {
            $terminal = Terminal::find($terminalId);
        } else {
            // Probably legacy ID '1', find by name
            $terminal = Terminal::where('name', 'Terminal ' . $terminalId)->first();
        }

        if (!$terminal) {
            $terminal = Terminal::create([
                'name' => 'Terminal ' . $terminalId,
                'ip_address' => $request->ip(),
                'status' => 'OPEN',
            ]);
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
