<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class SerialTrackingController extends Controller
{
    public function index(Request $request)
    {
        $query = \App\Models\ProductSerial::with(['product', 'warehouse']);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('serial_number', 'like', "%{$search}%")
                  ->orWhereHas('product', function($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%");
                  });
        }
        
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $serials = $query->orderBy('created_at', 'desc')->paginate(10)->withQueryString();

        return Inertia::render('SerialTracking/SerialTracking', [
            'serials' => $serials,
            'filters' => $request->only(['search', 'status']),
            'stats' => [
                'total_serials' => \App\Models\ProductSerial::count(),
                'in_stock' => \App\Models\ProductSerial::where('status', 'available')->count(),
                'sold' => \App\Models\ProductSerial::where('status', 'sold')->count(),
                'returned' => \App\Models\ProductSerial::where('status', 'returned')->count(),
            ]
        ]);
    }
    
    public function show($id)
    {
        // NOTE: ProductSerial::purchase() belongsTo App\Models\Purchase (table
        // "purchases"), but product_serials.purchase_id is actually a FK into
        // purchase_orders (per the create_product_serials_table migration). That
        // relation therefore cannot resolve correctly, so we do not rely on it here
        // — the raw purchase_id is still shown for traceability.
        $serial = \App\Models\ProductSerial::with(['product', 'warehouse', 'sale.customer'])
            ->findOrFail($id);

        return Inertia::render('SerialTracking/Show', ['serial' => $serial]);
    }
}
