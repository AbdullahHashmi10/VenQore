<?php

namespace App\Jobs;

use App\Services\V3\ReportService;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;

class GenerateReportExport implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 2;
    public int $timeout = 600; // Phase 3.2: heavy queue — 10 min max for large datasets
    public string $queue = 'heavy';

    public function __construct(
        private string  $reportType,
        private string  $from,
        private string  $to,
        private string  $cacheKey,
    ) {}

    public function handle(ReportService $reports): void
    {
        $from = Carbon::parse($this->from);
        $to   = Carbon::parse($this->to);

        $data = match($this->reportType) {
            'profit_loss'   => $reports->profitAndLoss($from, $to),
            'balance_sheet' => $reports->balanceSheet($to),
            'sales'         => $reports->salesReport($from, $to),
            'cogs'          => $reports->cogsReport($from, $to),
            default         => $reports->trialBalance($to),
        };

        // Cache result for 10 minutes — controller polls this key
        Cache::put($this->cacheKey, $data, now()->addMinutes(10));
    }
}
