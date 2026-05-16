<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class BatchTrackingController extends Controller
{
    public function index(Request $request)
    {
        $query = \App\Models\ProductBatch::with(['product', 'supplier']);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('batch_number', 'like', "%{$search}%")
                  ->orWhereHas('product', function($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%");
                  });
        }

        $batches = $query->orderBy('expiry_date', 'asc')->paginate(10)->withQueryString();

        return Inertia::render('BatchTracking/BatchTracking', [
            'batches' => $batches,
            'filters' => $request->only('search'),
            'stats' => [
                'total_batches' => \App\Models\ProductBatch::count(),
                'expiring_soon' => \App\Models\ProductBatch::whereBetween('expiry_date', [now(), now()->addDays(30)])->count(),
                'expired' => \App\Models\ProductBatch::where('expiry_date', '<', now())->count(),
                'total_quantity' => \App\Models\ProductBatch::sum('current_quantity'),
            ]
        ]);
    }
    
    // Future: Create method could be added for manual batch entry
    public function show($id) 
    {
        // 
    }
}
