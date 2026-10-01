<?php

namespace App\Engines;

use App\Models\Position;
use App\Models\Occupancy;
use Illuminate\Support\Facades\DB;

class OccupancyEngine
{
    /**
     * Get all positions and active occupancies for a tenant.
     */
    public function getPositions(int $tenantId, ?string $zone = null)
    {
        $query = Position::with('activeOccupancy')
            ->where('tenant_id', $tenantId);

        if ($zone) {
            $query->where('zone', $zone);
        }

        return $query->orderBy('sort_order')->orderBy('id')->get();
    }

    /**
     * Mark a physical position as occupied with session data.
     */
    public function occupyPosition(int $tenantId, int $positionId, array $sessionData = [], ?string $label = null, ?int $partyId = null): Occupancy
    {
        return DB::transaction(function () use ($tenantId, $positionId, $sessionData, $label, $partyId) {
            $position = Position::where('tenant_id', $tenantId)->findOrFail($positionId);
            $position->update(['status' => 'active']);

            // Close existing open occupancies on this position if any
            Occupancy::where('tenant_id', $tenantId)
                ->where('position_id', $positionId)
                ->whereNull('closed_at')
                ->update(['closed_at' => now()]);

            $occupancy = Occupancy::create([
                'tenant_id'    => $tenantId,
                'position_id'  => $positionId,
                'label'        => $label ?? $position->label ?? $position->code,
                'session_data' => $sessionData,
                'party_id'     => $partyId,
                'opened_by'    => auth()->id(),
                'opened_at'    => now(),
            ]);

            return $occupancy;
        });
    }

    /**
     * Release a position back to available status.
     */
    public function releasePosition(int $tenantId, int $positionId): bool
    {
        return DB::transaction(function () use ($tenantId, $positionId) {
            Position::where('tenant_id', $tenantId)
                ->where('id', $positionId)
                ->update(['status' => 'active']);

            Occupancy::where('tenant_id', $tenantId)
                ->where('position_id', $positionId)
                ->whereNull('closed_at')
                ->update(['closed_at' => now()]);

            return true;
        });
    }
}
