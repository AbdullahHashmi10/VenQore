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

        // In-browser POS (SyncService::pingHeartbeat → store.api.heartbeat).
        // The caller is a signed-in, active member of this store — the web
        // session and the tenant middleware already proved that — so it gets
        // the licence answer it needs (expiry / view-only) and no terminal row
        // is created or claimed. Terminal pairing (below) is only for the
        // unauthenticated desktop terminal on /api/heartbeat. Without this the
        // browser heartbeat answered 403 PAIRING_REQUIRED, the licence timer
        // never reset, and the browser POS eventually blocked itself.
        if ($request->route()?->getName() === 'store.api.heartbeat'
            && auth()->check()
            && app()->bound('current.tenant')
            && app('current.tenant')?->id) {
            $current = app('current.tenant');

            return response()->json([
                'status'               => 'alive',
                'terminal_id'          => null,
                'server_time'          => now()->toIso8601String(),
                'has_pending_updates'  => $this->checkForUpdates(now(), $current->id),
                'ack_status'           => 'OPEN',
                'subscription_ends_at' => $current->subscription_ends_at?->toIso8601String(),
                'is_view_only'         => $current->view_only_since !== null,
            ]);
        }

        // Resolve Tenant if store_slug is provided
        $tenant = null;
        if ($storeSlug) {
            $tenant = \App\Models\Tenant::where('slug', $storeSlug)->first();
        }

        // Write times in the store's clock, like every signed-in request does
        // (the store's timezone setting is applied to web requests). This API
        // call has no session, so it ran in UTC: last_heartbeat_at landed hours
        // off for any store outside UTC, terminals read as offline, and the
        // "changed in the last 5 minutes" check compared two different clocks.
        if ($tenant) {
            $storeTz = \Illuminate\Support\Facades\DB::table('settings')
                ->where('tenant_id', $tenant->id)->where('key', 'timezone')->value('value');
            if (is_string($storeTz) && in_array($storeTz, \DateTimeZone::listIdentifiers(), true)) {
                config(['app.timezone' => $storeTz]);
                date_default_timezone_set($storeTz);
            }
        }

        // L032: Proof-of-possession for first-contact tenant binding.
        // Binding a terminal to a tenant (creating a new terminal for a tenant,
        // or claiming a previously-unassigned one) requires a valid, unused,
        // unexpired pairing token issued in-app by that tenant. Ongoing
        // heartbeats from an already-paired terminal do NOT need a token.
        $pairingTokenValue = trim((string) $request->input('pairing_token', ''));
        // New codes are "ABCD-2345"; accept any case / spacing typed at the terminal.
        if ($pairingTokenValue !== '' && !str_starts_with($pairingTokenValue, 'pair_')) {
            $pairingTokenValue = strtoupper(str_replace(' ', '', $pairingTokenValue));
            // "abcd2345", "ABCD 2345", "abcd-2345" all mean ABCD-2345.
            $bare = preg_replace('/[^A-Z0-9]/', '', $pairingTokenValue);
            if (strlen($bare) === 8) {
                $pairingTokenValue = substr($bare, 0, 4) . '-' . substr($bare, 4);
            }
        }
        $pairingTokenValue = $pairingTokenValue !== '' ? $pairingTokenValue : null;
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

        // Single use, even under concurrent requests: the token is spent only
        // by the request whose conditional UPDATE flips used_at from NULL.
        $claimToken = function () use (&$validPairingToken): bool {
            if (!$validPairingToken) {
                return false;
            }
            return \App\Models\TerminalPairingToken::withoutTenantScope()
                ->whereKey($validPairingToken->getKey())
                ->whereNull('used_at')
                ->update(['used_at' => now()]) === 1;
        };
        $pairingRequired = fn (string $message) => response()->json([
            'error' => $message,
            'code'  => 'PAIRING_REQUIRED',
        ], 403);

        // Find or Create Terminal using withoutGlobalScope to bypass '1 = 0' fallback
        $terminal = null;
        
        if ($deviceId) {
            $terminal = Terminal::withoutGlobalScope('tenant')->where('device_id', $deviceId)->first();
        }
        
        // SEC-04: a caller-supplied terminal_id is only honoured for an UNPAIRED
        // terminal presenting a valid pairing token (legacy claim flow).
        if (!$terminal && $terminalId && $validPairingToken && \Illuminate\Support\Str::isUuid($terminalId)) {
            $candidate = Terminal::withoutGlobalScope('tenant')->find($terminalId);
            if ($candidate && empty($candidate->tenant_id) && empty($candidate->device_secret_hash)) {
                $terminal = $candidate;
            }
        }

        $issuedSecret = null;

        if (!$terminal) {
            // SEC-04: unauthenticated callers can no longer create terminal rows.
            // A new terminal exists only once a valid pairing token is presented.
            if (!$tenant || !$validPairingToken || !$claimToken()) {
                return $pairingRequired('Pairing required: enter the pairing code from Settings → Terminals.');
            }

            $nameSuffix = $terminalId ?: substr($deviceId, 0, 8);

            $terminal = Terminal::create([
                'name' => 'Terminal ' . $nameSuffix,
                'device_id' => $deviceId,
                'tenant_id' => $tenant->id,
                'ip_address' => $request->ip(),
                'status' => 'OPEN',
                'paired_at' => now(),
            ]);

            $validPairingToken->forceFill(['terminal_id' => $terminal->id])->save();
            $issuedSecret = \App\Support\TerminalDeviceAuth::issue($terminal);
        } else {
            // SEC-04: a terminal that holds a device secret must prove it.
            if (\App\Support\TerminalDeviceAuth::hasSecret($terminal) && !\App\Support\TerminalDeviceAuth::verify($terminal, $request)) {
                return response()->json(['error' => 'Unauthorized device', 'code' => 'DEVICE_AUTH_FAILED'], 401);
            }

            if ($tenant) {
                if (empty($terminal->tenant_id)) {
                    // Claiming a previously-unassigned terminal into a tenant also
                    // requires proof of possession.
                    if (!$claimToken()) {
                        return $pairingRequired('Pairing required: a valid pairing token is needed to claim this terminal.');
                    }
                    $terminal->update(['tenant_id' => $tenant->id, 'paired_at' => now()]);
                    $validPairingToken->forceFill(['terminal_id' => $terminal->id])->save();
                    $issuedSecret = \App\Support\TerminalDeviceAuth::issue($terminal);
                } elseif ((string) $terminal->tenant_id !== (string) $tenant->id) {
                    return response()->json(['error' => 'Terminal does not belong to this store.'], 403);
                }
            }
            if ($deviceId && !$terminal->device_id) {
                $terminal->update(['device_id' => $deviceId]);
            }

            // Terminals paired before device secrets existed hold no secret.
            // Knowing a device ID is not proof of possession (recheck, SEC-04),
            // so such a terminal re-pairs ONCE with a fresh code from
            // Settings → Terminals; the Station app shows the code box when it
            // gets PAIRING_REQUIRED. No secret is ever issued on first contact.
            if (!empty($terminal->tenant_id) && !\App\Support\TerminalDeviceAuth::hasSecret($terminal) && $issuedSecret === null) {
                if (!$validPairingToken
                    || (string) $validPairingToken->tenant_id !== (string) $terminal->tenant_id
                    || !$claimToken()) {
                    return $pairingRequired('This terminal must be paired again: enter a pairing code from Settings → Terminals.');
                }
                $validPairingToken->forceFill(['terminal_id' => $terminal->id])->save();
                $terminal->update(['paired_at' => now()]);
                $issuedSecret = \App\Support\TerminalDeviceAuth::issue($terminal);
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

        $payload = [
            'status' => 'alive',
            'terminal_id' => $terminal->id,
            'server_time' => now()->toIso8601String(),
            'has_pending_updates' => $hasUpdates,
            'ack_status' => $terminal->status,
            'subscription_ends_at' => $subscriptionEndsAt,
            'is_view_only'         => $isViewOnly,
        ];

        if ($issuedSecret !== null) {
            // Returned exactly once. The device must store it and send it as
            // the X-Device-Secret header on every later terminal API call.
            $payload['device_secret'] = $issuedSecret;
        }

        return response()->json($payload);
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
