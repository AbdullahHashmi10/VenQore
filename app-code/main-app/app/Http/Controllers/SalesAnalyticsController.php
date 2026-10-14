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
    public function index(Request $request)
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

        // ---- Period-driven analytics (defaults to last 30 days) ----
        $tenantId = app('current.tenant')->id;
        try {
            $from = $request->query('from') ? Carbon::parse($request->query('from'))->startOfDay() : Carbon::now()->subDays(29)->startOfDay();
            $to = $request->query('to') ? Carbon::parse($request->query('to'))->endOfDay() : Carbon::now()->endOfDay();
        } catch (\Throwable $e) {
            $from = Carbon::now()->subDays(29)->startOfDay();
            $to = Carbon::now()->endOfDay();
        }
        if ($from->gt($to)) { [$from, $to] = [$to->copy()->startOfDay(), $from->copy()->endOfDay()]; }
        if ($from->diffInDays($to) > 400) { $from = $to->copy()->subDays(400)->startOfDay(); }

        $trendMap = $frs->getProfitByPeriod($from, $to, 'daily');
        $trend = [];
        for ($d = $from->copy(); $d->lte($to); $d->addDay()) {
            $k = $d->format('Y-m-d');
            $trend[] = ['date' => $k, 'revenue' => (float) ($trendMap[$k]['revenue'] ?? 0), 'profit' => (float) ($trendMap[$k]['profit'] ?? 0)];
        }

        $base = fn () => DB::table('sales')
            ->where('sales.tenant_id', $tenantId)
            ->whereNull('sales.deleted_at')
            ->where('sales.status', '!=', 'returned')
            ->whereBetween('sales.created_at', [$from->copy()->utc(), $to->copy()->utc()]);

        $byWeekday = $base()->selectRaw('DAYOFWEEK(sales.created_at) as d, SUM(sales.net_sales) as total, COUNT(*) as orders')->groupBy('d')->get();
        $byHour = $base()->selectRaw('HOUR(sales.created_at) as h, SUM(sales.net_sales) as total, COUNT(*) as orders')->groupBy('h')->get();
        $byMethod = $base()->select('payment_method', DB::raw('SUM(net_sales) as total'))->groupBy('payment_method')->get();
        $topCustomers = $base()->join('parties', 'sales.party_id', '=', 'parties.id')
            ->select('parties.name', DB::raw('COUNT(*) as orders'), DB::raw('SUM(sales.net_sales) as total'))
            ->groupBy('parties.id', 'parties.name')->orderByDesc('total')->take(8)->get();
        $byCategory = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
            ->where('sales.tenant_id', $tenantId)->whereNull('sales.deleted_at')->where('sales.status', '!=', 'returned')
            ->whereBetween('sales.created_at', [$from->copy()->utc(), $to->copy()->utc()])
            ->select(DB::raw("COALESCE(categories.name, 'Uncategorised') as name"), DB::raw('SUM(sale_items.net_amount) as total'))
            ->groupBy('name')->orderByDesc('total')->take(8)->get();
        $periodTotals = $base()->selectRaw('SUM(sales.net_sales) as total, COUNT(*) as orders')->first();

        return Inertia::render('Sales/Analytics', [
            'period' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
            'periodTrend' => $trend,
            'byWeekday' => $byWeekday,
            'byHour' => $byHour,
            'byMethod' => $byMethod,
            'byCategory' => $byCategory,
            'topCustomers' => $topCustomers,
            'periodTotals' => ['total' => (float) ($periodTotals->total ?? 0), 'orders' => (int) ($periodTotals->orders ?? 0)],
            'revenue' => $revenue,
            'counts' => $counts,
            'topProducts' => $topProducts,
            'chartData' => $chartData,
        ]);
    }
}
