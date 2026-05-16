<?php

namespace App\Http\Controllers;

use App\Models\ParkedSale;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class ParkedSaleController extends Controller
{
    public function index()
    {
        $parkedSales = ParkedSale::with(['customer', 'user'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($sale) {
                $items = $sale->cart_data ?? [];
                return [
                    'id' => $sale->id,
                    'reference' => substr($sale->id, 0, 8),
                    'created_at' => $sale->created_at,
                    'customer' => $sale->customer_name ?? 'Walk-in',
                    'items_count' => count($items),
                    'total' => collect($items)->sum(fn($i) => ($i['quantity'] ?? 0) * ($i['price'] ?? ($i['unit_price'] ?? 0))),
                    'parked_by' => $sale->user->name ?? 'System',
                    'note' => $sale->note ?? ''
                ];
            });

        // Calculate stats
        $today = Carbon::today();
        $stats = [
            'total' => $parkedSales->count(),
            'total_value' => $parkedSales->sum('total'),
            'today' => ParkedSale::whereDate('created_at', $today)->count(),
            'with_customer' => ParkedSale::whereNotNull('customer_id')->count()
        ];

        return Inertia::render('Sales/ParkedSales', [
            'parkedSales' => $parkedSales,
            'stats' => $stats
        ]);
    }

    public function destroy($id)
    {
        $sale = ParkedSale::findOrFail($id);
        $sale->delete();

        return response()->json([
            'success' => true,
            'message' => 'Parked sale deleted successfully'
        ]);
    }
}
