<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class SalesAnalyticsController extends Controller
{
    public function index()
    {
        // Date Ranges
        $today = Carbon::today();
        $startOfWeek = Carbon::now()->startOfWeek();
        $startOfMonth = Carbon::now()->startOfMonth();

        // Revenue Stats (Exclude returns for pure revenue, or include them for net)
        // Assuming 'returned' status means full return, but partial returns might be separate records with negative values.
        // Since we create negative records for returns, sum('total') will automatically calculate Net Revenue.

        $revenue = [
            'today' => Sale::where('created_at', '>=', $today)->sum('total'),
            'week' => Sale::where('created_at', '>=', $startOfWeek)->sum('total'),
            'month' => Sale::where('created_at', '>=', $startOfMonth)->sum('total'),
            'total' => Sale::sum('total'),
        ];

        // Sales Count Stats (Only count positive sales for volume)
        $counts = [
            'today' => Sale::where('created_at', '>=', $today)->where('total', '>', 0)->count(),
            'week' => Sale::where('created_at', '>=', $startOfWeek)->where('total', '>', 0)->count(),
            'month' => Sale::where('created_at', '>=', $startOfMonth)->where('total', '>', 0)->count(),
        ];

        // Top Selling Products
        $topProducts = SaleItem::select('product_id', DB::raw('sum(quantity) as total_qty'), DB::raw('sum(subtotal) as total_revenue'))
            ->with('product')
            ->groupBy('product_id')
            ->orderByDesc('total_qty')
            ->take(5)
            ->get();

        // Sales Chart Data (Last 7 Days)
        $chartData = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i)->format('Y-m-d');
            $chartData[] = [
                'date' => Carbon::now()->subDays($i)->format('D'),
                'revenue' => Sale::whereDate('created_at', $date)->sum('total'),
                'sales' => Sale::whereDate('created_at', $date)->where('total', '>', 0)->count(),
            ];
        }

        return Inertia::render('Sales/Analytics', [
            'revenue' => $revenue,
            'counts' => $counts,
            'topProducts' => $topProducts,
            'chartData' => $chartData,
        ]);
    }
}
