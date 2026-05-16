<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Services\V3\AccountingService;
use App\Services\V3\ReportService;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function __construct(
        private AccountingService $accounting,
        private ReportService     $reports
    ) {}

    public function index()
    {
        $today     = Carbon::today();
        $monthStart = $today->copy()->startOfMonth();

        $pl = $this->reports->profitAndLoss($monthStart, $today);

        return response()->json([
            'cash'        => $this->safeGetBalance('1000'),
            'bank'        => $this->safeGetBalance('1010'),
            'receivables' => $this->safeGetBalance('1200'),
            'payables'    => $this->safeGetBalance('2000'),
            'revenue_mtd' => $pl['total_revenue'],
            'cogs_mtd'    => $pl['total_cogs'],
            'net_profit_mtd' => $pl['net_profit'],
            'as_of'       => $today->toDateTimeString(),
        ]);
    }

    private function safeGetBalance(string $code): float
    {
        try {
            return $this->accounting->getBalance($code);
        } catch (\InvalidArgumentException $e) {
            return 0.0;
        }
    }
}
