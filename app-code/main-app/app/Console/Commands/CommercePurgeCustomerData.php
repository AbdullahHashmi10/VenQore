<?php

namespace App\Console\Commands;

use App\Services\Commerce\OrderService;
use Illuminate\Console\Command;

class CommercePurgeCustomerData extends Command
{
    protected $signature = 'commerce:purge-customer-data {--days=180}';
    protected $description = 'Remove customer names, phones, addresses and notes from closed online orders after N days.';

    public function handle(OrderService $orders): int
    {
        $n = $orders->purgeCustomerData(max(30, (int) $this->option('days')));
        $this->info("Purged personal details from {$n} closed order(s).");
        return self::SUCCESS;
    }
}
