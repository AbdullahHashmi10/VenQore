<?php

namespace App\Console\Commands;

use App\Models\Occupancy;
use Illuminate\Console\Command;

class CleanupExpiredParkedSales extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'parked-sales:cleanup';

    /**
     * The console command description.
     */
    protected $description = 'Close parked sale occupancies that have expired (older than 24 hours)';

    /**
     * Execute the console command.
     * Deploy D: legacy parked_sales table retired — closes expired Occupancy rows instead.
     */
    public function handle()
    {
        $count = Occupancy::where('source_type', 'parked_sale')
            ->whereNull('closed_at')
            ->where('expires_at', '<=', now())
            ->update(['closed_at' => now()]);

        $this->info("Closed {$count} expired parked sale occupancies.");

        return Command::SUCCESS;
    }
}
