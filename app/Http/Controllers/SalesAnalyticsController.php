<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Services\FinancialReportingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class SalesAnalyticsController extends Controller
{
    public function index()
    {
        // Date Ranges (calendar-based per CLAUDE.md Date & Time Period Naming Conventions)
        $today = Carbon::today();
        $startOfWeek = Carbon::now()->startOfWeek();
        $startOfMonth = Carbon::now()->startOfMonth();
        $now = Carbon::now();

        // Ledger-derived (Single Source of Truth per CLAUDE.md).
        // OLD: Sale::sum('total') — tax-inclusive gross invoice total, read directly
        //      from the operational sales table. Disagreed with every other revenue
        //      figure in the app (Dashboard, Sell Command Center, Reports all use
        //      the ledger). Also never deducted partial returns correctly.
        // NEW: FinancialReportingService::getProfitAndLoss()['revenue'] — same
        //      engine every other card/report reads, already round()ed to 2dp,
        //      already nets returns via their journal reversal entries.
        $frs = app(FinancialReportingService::class);

        $revenue = [
            'today' => $frs->getProfitAndLoss($today->toDateString(), $today->toDateString())['revenue'],
            'week'  => $frs->getProfitAndLoss($startOfWeek->toDateString(), $now->toDateString())['revenue'],
            'month' => $frs->getProfitAndLoss($startOfMonth->toDateString(), $now->toDateString())['revenue'],
            'total' => $frs->getProfitAndLoss('1970-01-01', $now->toDateString())['revenue'],
        ];

        // Sales Count Stats — legitimately operational (counting transactions, not
        // a financial total), so counting from the sales table is fine here. Excludes
        // fully returned sales so counts reflect real transaction volume.
        $counts = [
            'today' => Sale::where('created_at', '>=', $today)->where('status', '!=', 'returned')->count(),
            'week' => Sale::where('created_at', '>=', $startOfWeek)->where('status', '!=', 'returned')->count(),
            'month' => Sale::where('created_at', '>=', $startOfMonth)->where('status', '!=', 'returned')->count(),
        ];

        // Top Selling Products
        $topProducts = SaleItem::select('product_id', DB::raw('sum(quantity) as total_qty'), DB::raw('sum(subtotal) as total_revenue'))
            ->with('product')
            ->groupBy('product_id')
            ->orderByDesc('total_qty')
            ->take(5)
            ->get();

        // Sales Chart Data (Last 7 Days — rolling window, explicitly labeled as such
        // per CLAUDE.md; "revenue" here is ledger-derived, "sales" count stays
        // transaction-count from the operational table).
        $periodMap = $frs->getProfitByPeriod(Carbon::now()->subDays(6)->startOfDay(), Carbon::now()->endOfDay(), 'daily');
        $chartData = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i)->format('Y-m-d');
            $row = $periodMap[$date] ?? null;
            $chartData[] = [
                'date' => Carbon::now()->subDays($i)->format('D'),
                'revenue' => (float) ($row['revenue'] ?? 0),
                'sales' => Sale::whereDate('created_at', $date)->where('status', '!=', 'returned')->count(),
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
