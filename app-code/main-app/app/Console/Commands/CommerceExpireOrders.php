<?php

namespace App\Console\Commands;

use App\Services\Commerce\OrderService;
use Illuminate\Console\Command;

class CommerceExpireOrders extends Command
{
    protected $signature = 'commerce:expire-orders';
    protected $description = 'Expire online orders that were not accepted before their deadline.';

    public function handle(OrderService $orders): int
    {
        $n = $orders->expireDue();
        $this->info("Expired {$n} online order(s).");
        return self::SUCCESS;
    }
}
