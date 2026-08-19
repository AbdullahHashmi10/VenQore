<?php

namespace App\Http\Controllers;

use App\Models\Occupancy;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class ParkedSaleController extends Controller
{
    /**
     * Deploy D: Read parked sales from canonical Occupancy table (source_type = 'parked_sale').
     * Legacy parked_sales table has been retired.
     */
    public function index()
    {
        $occupancies = Occupancy::with('user')
            ->where('source_type', 'parked_sale')
            ->whereNull('closed_at')
            ->orderBy('opened_at', 'desc')
            ->get();

        $parkedSales = $occupancies->map(function (Occupancy $occ) {
            $cartData = $occ->session_data ?? [];
            $items    = $cartData['items'] ?? $cartData;

            $total = isset($cartData['total'])
                ? (float) $cartData['total']
                : collect($items)->sum(fn ($i) => ($i['quantity'] ?? 0) * ($i['price'] ?? ($i['unit_price'] ?? 0)));

            return [
                'id'          => $occ->source_id,
                'reference'   => substr((string) $occ->source_id, 0, 8),
                'created_at'  => $occ->opened_at,
                'customer'    => $occ->label !== 'Parked Cart' ? $occ->label : 'Walk-in',
                'items_count' => count(is_array($items) ? $items : []),
                'total'       => $total,
                'parked_by'   => $occ->user?->name ?? 'System',
                'note'        => $cartData['note'] ?? '',
            ];
        });

        $today = Carbon::today();
        $stats = [
            'total'         => $parkedSales->count(),
            'total_value'   => $parkedSales->sum('total'),
            'today'         => Occupancy::where('source_type', 'parked_sale')
                                  ->whereNull('closed_at')
                                  ->whereDate('opened_at', $today)
                                  ->count(),
            'with_customer' => Occupancy::where('source_type', 'parked_sale')
                                  ->whereNull('closed_at')
                                  ->whereNotNull('label')
                                  ->where('label', '!=', '')
                                  ->where('label', '!=', 'Walk-in')
                                  ->where('label', '!=', 'Parked Cart')
                                  ->count(),
        ];

        return Inertia::render('Sales/ParkedSales', [
            'parkedSales' => $parkedSales,
            'stats'       => $stats,
        ]);
    }

    /**
     * Delete a parked sale.
     * Deploy D: closes the canonical Occupancy row. No legacy table touched.
     */
    public function destroy($id)
    {
        Occupancy::where('source_type', 'parked_sale')
            ->where('source_id', (string) $id)
            ->whereNull('closed_at')
            ->update(['closed_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Parked sale deleted successfully',
        ]);
    }
}
