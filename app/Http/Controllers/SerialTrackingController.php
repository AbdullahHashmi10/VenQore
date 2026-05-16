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
        $serial = \App\Models\ProductSerial::with(['product', 'warehouse', 'sale', 'purchase'])->findOrFail($id);
        return Inertia::render('SerialTracking/Show', ['serial' => $serial]);
    }
}
