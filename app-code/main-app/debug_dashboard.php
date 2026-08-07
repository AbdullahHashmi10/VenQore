<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

$now = Carbon::now();

echo "=== DASHBOARD DATA DEBUG ===\n\n";

// Today Stats
$todaySales = Sale::whereDate('created_at', $now->toDateString())->sum('total');
echo "TODAY Sales Total: Rs " . number_format($todaySales, 0) . "\n";

// Month Stats
$monthStart = $now->copy()->startOfMonth();
$monthEnd = $now->copy()->endOfMonth();
$monthSalesTotal = Sale::whereBetween('created_at', [$monthStart, $monthEnd])->sum('total');
echo "MONTH Sales Total: Rs " . number_format($monthSalesTotal, 0) . "\n";

// Year Stats
$yearStart = $now->copy()->startOfYear();
$yearEnd = $now->copy()->endOfYear();
$yearSalesTotal = Sale::whereBetween('created_at', [$yearStart, $yearEnd])->sum('total');
echo "YEAR Sales Total: Rs " . number_format($yearSalesTotal, 0) . "\n";

// All Time
$allTimeSales = Sale::sum('total');
echo "ALL TIME Sales Total: Rs " . number_format($allTimeSales, 0) . "\n";

echo "\n=== CHART DATA DEBUG (YEAR) ===\n";
$yearRange = [];
for ($i = 11; $i >= 0; $i--) {
    $date = Carbon::now()->subMonths($i);
    $yearRange[$date->format('M')] = $date->format('Y-m');
}

$sales = Sale::whereBetween('created_at', [$now->copy()->subMonths(11)->startOfMonth(), $now->copy()->endOfMonth()])
    ->select(DB::raw("DATE_FORMAT(created_at, '%Y-%m') as period"), DB::raw('SUM(total) as total'))
    ->groupBy('period')
    ->get()
    ->pluck('total', 'period');

foreach ($yearRange as $label => $key) {
    $value = $sales[$key] ?? 0;
    echo "$label ($key): Rs " . number_format($value, 0) . "\n";
}

echo "\n=== SALE ITEMS COST ANALYSIS ===\n";
$totalSalesAmount = Sale::sum('total');
$totalCOGS = SaleItem::sum(DB::raw('cost_price * quantity'));
$grossProfit = $totalSalesAmount - $totalCOGS;
echo "Total Sales: Rs " . number_format($totalSalesAmount, 0) . "\n";
echo "Total COGS: Rs " . number_format($totalCOGS, 0) . "\n";
echo "Gross Profit (Revenue): Rs " . number_format($grossProfit, 0) . "\n";

echo "\n=== SAMPLE SALE ITEMS (Check for 0 cost_price) ===\n";
$zeroCount = SaleItem::where('cost_price', 0)->count();
$totalCount = SaleItem::count();
echo "Sale Items with cost_price=0: $zeroCount / $totalCount\n";
