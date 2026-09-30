<?php

namespace App\Http\Controllers;

use App\Models\Position;
use App\Models\TableReservation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReservationController extends Controller
{
    /**
     * List reservations & waitlist for the floor.
     */
    public function list(Request $request): JsonResponse
    {
        $tenant = app('current.tenant');
        $date   = $request->query('date', now()->toDateString());

        $reservations = TableReservation::with('position')
            ->where('tenant_id', $tenant->id)
            ->whereDate('reserved_at', $date)
            ->orderBy('reserved_at')
            ->get();

        return response()->json([
            'reservations' => $reservations->map(fn ($r) => [
                'id'            => $r->id,
                'customer_name' => $r->customer_name,
                'phone'         => $r->phone,
                'party_size'    => $r->party_size,
                'reserved_at'   => $r->reserved_at?->toIso8601String(),
                'time_label'    => $r->reserved_at?->format('h:i A'),
                'position_id'   => $r->position_id,
                'table_name'    => $r->position ? ($r->position->label ?: $r->position->code) : null,
                'status'        => $r->status,
                'notes'         => $r->notes,
            ]),
        ]);
    }

    /**
     * Create a new reservation or waitlist entry.
     */
    public function store(Request $request): JsonResponse
    {
        $tenant = app('current.tenant');
        $data   = $request->validate([
            'customer_name' => 'required|string|max:120',
            'phone'         => 'nullable|string|max:40',
            'party_size'    => 'required|integer|min:1|max:100',
            'reserved_at'   => 'nullable|date',
            'position_id'   => 'nullable|integer',
            'status'        => 'nullable|string|in:booked,waiting',
            'notes'         => 'nullable|string|max:500',
        ]);

        $status     = $data['status'] ?? 'booked';
        $reservedAt = !empty($data['reserved_at']) ? $data['reserved_at'] : now();

        $res = TableReservation::create([
            'tenant_id'     => $tenant->id,
            'customer_name' => $data['customer_name'],
            'phone'         => $data['phone'] ?? null,
            'party_size'    => $data['party_size'],
            'reserved_at'   => $reservedAt,
            'position_id'   => $data['position_id'] ?? null,
            'status'        => $status,
            'notes'         => $data['notes'] ?? null,
        ]);

        return response()->json(['success' => true, 'reservation' => $res]);
    }

    /**
     * Seat a reservation at a table.
     */
    public function seat(Request $request, int $id): JsonResponse
    {
        $tenant = app('current.tenant');
        $res    = TableReservation::where('tenant_id', $tenant->id)->findOrFail($id);

        $positionId = $request->input('position_id', $res->position_id);
        if ($positionId) {
            $pos = Position::where('tenant_id', $tenant->id)->find($positionId);
            if ($pos) {
                $pos->update(['status' => 'active']);
            }
            $res->position_id = $positionId;
        }

        $res->status = 'seated';
        $res->save();

        return response()->json(['success' => true, 'reservation' => $res]);
    }

    /**
     * Cancel or mark no-show.
     */
    public function cancel(Request $request, int $id): JsonResponse
    {
        $tenant = app('current.tenant');
        $res    = TableReservation::where('tenant_id', $tenant->id)->findOrFail($id);

        $status = $request->input('status', 'cancelled');
        if (!in_array($status, ['cancelled', 'no_show'], true)) {
            $status = 'cancelled';
        }

        $res->status = $status;
        $res->save();

        return response()->json(['success' => true, 'reservation' => $res]);
    }
}
