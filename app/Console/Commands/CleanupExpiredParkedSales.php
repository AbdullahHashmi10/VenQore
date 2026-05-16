<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class CleanupExpiredParkedSales extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'parked-sales:cleanup';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Delete parked sales that have expired (older than 24 hours)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $count = \App\Models\ParkedSale::where('expires_at', '<=', now())->delete();

        $this->info("Deleted {$count} expired parked sales.");

        return Command::SUCCESS;
    }
}
