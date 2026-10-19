<?php

namespace App\Services;

use App\Models\Terminal;
use App\Models\TerminalPairingToken;
use App\Support\TerminalDeviceAuth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class TerminalReplacementService
{
    /** Keep terminal identity/history and rotate credentials in one transaction. */
    public static function redeem(TerminalPairingToken $candidate, int $tenantId, string $deviceId): array
    {
        return DB::transaction(function () use ($candidate, $tenantId, $deviceId) {
            // Lock order is always terminal then token, including token issuance.
            $terminal = Terminal::withoutGlobalScope('tenant')->where('tenant_id', $tenantId)
                ->whereKey($candidate->replacement_terminal_id)->lockForUpdate()->first();
            $token = TerminalPairingToken::withoutTenantScope()->where('tenant_id', $tenantId)
                ->whereKey($candidate->id)->lockForUpdate()->first();
            if (!$terminal || !$token || !$token->isUsable()
                || (string) $token->replacement_terminal_id !== (string) $terminal->id) {
                throw ValidationException::withMessages(['pairing_token' => 'This replacement code has expired or was already used. Create a new code.']);
            }
            $other = Terminal::withoutGlobalScope('tenant')->where('device_id', $deviceId)->where('id', '!=', $terminal->id)->exists();
            if ($other) {
                throw ValidationException::withMessages(['device_id' => 'This device is already paired to another terminal. Disconnect it before replacing this terminal.']);
            }
            $terminal->update(['device_id' => $deviceId, 'paired_at' => now(), 'status' => 'OPEN']);
            $secret = TerminalDeviceAuth::issue($terminal);
            $token->forceFill(['used_at' => now(), 'terminal_id' => $terminal->id])->save();
            TerminalPairingToken::withoutTenantScope()->where('tenant_id', $tenantId)
                ->where('replacement_terminal_id', $terminal->id)->whereNull('used_at')->update(['used_at' => now()]);
            // No memberships, seat allocations, registers or shifts are created/closed here.
            return ['terminal' => $terminal, 'secret' => $secret, 'approved_by' => $token->created_by];
        }, 3);
    }
}
