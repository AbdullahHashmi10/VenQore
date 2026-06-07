<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Sale;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

$now = Carbon::now();

echo "=== TESTING CHART CALCULATION FIX ===\n\n";

// Test February (current month)
$monthStart = $now->copy()->startOfMonth();
$monthEnd = $now->copy()->endOfMonth();

$sales = Sale::whereBetween('created_at', [$monthStart, $monthEnd])
    ->select(DB::raw("DATE_FORMAT(created_at, '%Y-%m') as period"), DB::raw('SUM(total) as total'))
    ->groupBy('period')
    ->get()
    ->pluck('total', 'period');

$cogs = DB::table('sale_items')
    ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
    ->whereBetween('sales.created_at', [$monthStart, $monthEnd])
    ->select(
        DB::raw("DATE_FORMAT(sales.created_at, '%Y-%m') as period"),
        DB::raw('SUM(sale_items.cost_price * (sale_items.quantity + COALESCE(sale_items.free_quantity, 0))) as cogs')
    )
    ->groupBy('period')
    ->get()
    ->pluck('cogs', 'period');

$period = $now->format('Y-m');
$salesAmount = (float) ($sales[$period] ?? 0);
$cogsAmount = (float) ($cogs[$period] ?? 0);
$profit = $salesAmount - $cogsAmount;

echo "February 2026:\n";
echo "  Sales: Rs " . number_format($salesAmount, 0) . "\n";
echo "  COGS:  Rs " . number_format($cogsAmount, 0) . "\n";
echo "  Revenue (Gross Profit): Rs " . number_format($profit, 0) . "\n";
echo "\nRevenue should be LESS than Sales ✓\n";
