<?php

namespace App\Services\Foh;

use App\Models\Occupancy;
use App\Models\WorkOrder;
use App\Support\FohSettings;

/**
 * Takeaway / delivery collection rule (FOH plan 2.9).
 *
 * A lane ticket that is PAID but still has kitchen work in flight stays open
 * (session_data.paid_at) so it shows as "Paid - cooking" / "Ready to collect"
 * instead of vanishing. It closes when it is collected, or - if the store left
 * auto-close on - the moment the kitchen bumps its last ticket to served.
 */
class LaneCollection
{
    /** Kitchen work that is neither served nor cancelled. */
    public static function hasOpenWork(int $tenantId, int $occupancyId): bool
    {
        return WorkOrder::where('tenant_id', $tenantId)
            ->where('occupancy_id', $occupancyId)
            ->whereNotIn('status', ['served', 'cancelled'])
            ->exists();
    }

    /** Close the ticket when it is paid and the kitchen has finished. Returns true if it closed. */
    public static function closeIfDone(int $tenantId, int $occupancyId): bool
    {
        $occ = Occupancy::where('tenant_id', $tenantId)->whereNull('position_id')
            ->whereNull('closed_at')->find($occupancyId);
        if (!$occ) return false;

        $s = $occ->session_data ?? [];
        if (empty($s['paid_at'])) return false;
        if (!FohSettings::all($tenantId)['takeaway_autoclose']) return false;
        if (self::hasOpenWork($tenantId, (int) $occ->id)) return false;

        $s['collected_at'] = now()->toIso8601String();
        $occ->session_data = $s;
        $occ->closed_at = now();
        $occ->save();

        return true;
    }

    /** Re-check every paid, open lane ticket (used after a bulk "clear the pass"). */
    public static function sweep(int $tenantId): void
    {
        $ids = Occupancy::where('tenant_id', $tenantId)->whereNull('position_id')
            ->whereNull('closed_at')->whereNotNull('session_data->paid_at')
            ->pluck('id');
        foreach ($ids as $id) self::closeIfDone($tenantId, (int) $id);
    }
}
