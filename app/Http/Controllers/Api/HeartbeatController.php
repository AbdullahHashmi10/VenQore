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

        // L032: Proof-of-possession for first-contact tenant binding.
        // Binding a terminal to a tenant (creating a new terminal for a tenant,
        // or claiming a previously-unassigned one) requires a valid, unused,
        // unexpired pairing token issued in-app by that tenant. Ongoing
        // heartbeats from an already-paired terminal do NOT need a token.
        $pairingTokenValue = $request->input('pairing_token');
        $validPairingToken = null;
        if ($tenant && $pairingTokenValue) {
            $validPairingToken = \App\Models\TerminalPairingToken::withoutTenantScope()
                ->where('tenant_id', $tenant->id)
                ->where('token', $pairingTokenValue)
                ->whereNull('used_at')
                ->where(function ($q) {
                    $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
                })
                ->first();
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

            // Only bind the new terminal to the tenant when a valid pairing token
            // was presented; otherwise create it UNASSIGNED (tenant_id null) so an
            // unauthenticated caller can't claim a terminal into someone's store.
            $bindTenantId = ($tenant && $validPairingToken) ? $tenant->id : null;

            $terminal = Terminal::create([
                'name' => 'Terminal ' . $nameSuffix,
                'device_id' => $deviceId,
                'tenant_id' => $bindTenantId,
                'ip_address' => $request->ip(),
                'status' => 'OPEN',
                'paired_at' => $bindTenantId ? now() : null,
            ]);

            if ($bindTenantId && $validPairingToken) {
                $validPairingToken->update([
                    'used_at'     => now(),
                    'terminal_id' => $terminal->id,
                ]);
            }
        } else {
            if ($tenant) {
                if (empty($terminal->tenant_id)) {
                    // Claiming a previously-unassigned terminal into a tenant also
                    // requires proof of possession.
                    if (!$validPairingToken) {
                        return response()->json([
                            'error' => 'Pairing required: a valid pairing token is needed to claim this terminal.',
                            'code'  => 'PAIRING_REQUIRED',
                        ], 403);
                    }
                    $terminal->update(['tenant_id' => $tenant->id, 'paired_at' => now()]);
                    $validPairingToken->update([
                        'used_at'     => now(),
                        'terminal_id' => $terminal->id,
                    ]);
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
        $hasUpdates = $this->checkForUpdates($terminal->last_heartbeat_at, $terminal->tenant_id);

        // ── Gift Access Links / subscription expiry — offline enforcement ──
        // The device needs the tenant's REAL expiry date (not just "resync
        // within 30 days") so it can enforce that exact date locally even
        // while fully offline. Only meaningful once $tenant is resolved
        // (requires store_slug — always sent by an already-paired terminal).
        $subscriptionEndsAt = null;
        $isViewOnly         = false;
        if ($tenant) {
            $subscriptionEndsAt = $tenant->subscription_ends_at?->toIso8601String();
            $isViewOnly         = $tenant->view_only_since !== null;
        }

        return response()->json([
            'status' => 'alive',
            'terminal_id' => $terminal->id,
            'server_time' => now()->toIso8601String(),
            'has_pending_updates' => $hasUpdates,
            'ack_status' => $terminal->status,
            'subscription_ends_at' => $subscriptionEndsAt,
            'is_view_only'         => $isViewOnly,
        ]);
    }

    private function checkForUpdates($since, $tenantId = null)
    {
        // Check if Admin made changes to Products or Settings recently
        // Ideally, 'since' should be the client's last sync time, but we use last heartbeat for "recent" check
        $threshold = now()->subMinutes(5);

        // Scope the existence check to the resolved tenant so a heartbeat cannot
        // leak cross-tenant activity signals (another store editing its products).
        $productsChanged = DB::table('products')
            ->where('updated_at', '>', $threshold)
            ->when($tenantId, fn ($q) => $q->where('tenant_id', $tenantId))
            ->exists();
        $settingsChanged = DB::table('settings')
            ->where('updated_at', '>', $threshold)
            ->when($tenantId, fn ($q) => $q->where('tenant_id', $tenantId))
            ->exists();

        return $productsChanged || $settingsChanged;
    }
}
