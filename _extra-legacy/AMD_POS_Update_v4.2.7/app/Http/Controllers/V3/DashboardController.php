<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Services\V3\AccountingService;
use App\Services\FinancialReportingService;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function __construct(
        private AccountingService        $accounting,
        private FinancialReportingService $frs
    ) {}

    public function index()
    {
        abort_unless(
            auth()->user()->hasPermission('finance.transactions') ||
            auth()->user()->hasPermission('finance.balances') ||
            auth()->user()->hasPermission('reports.summary'),
            403,
            'Unauthorized'
        );

        $tz  = app('current.tenant')->timezone ?: config('app.timezone', 'UTC');
        $now = Carbon::now($tz);
        $today = $now->copy()->startOfDay();
        $monthStart = $now->copy()->startOfMonth();
        $pl = $this->frs->getProfitAndLoss($monthStart->toDateString(), $today->toDateString());

        return response()->json([
            'cash'        => $this->safeGetBalance('1000'),
            'bank'        => $this->safeGetBalance('1010'),
            'receivables' => $this->safeGetBalance('1200'),
            'payables'    => $this->safeGetBalance('2000'),
            'revenue_mtd' => $pl['revenue'],
            'cogs_mtd'    => $pl['cogs'],
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
