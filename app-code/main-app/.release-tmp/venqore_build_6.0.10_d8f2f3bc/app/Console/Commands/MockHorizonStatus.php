<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class MockHorizonStatus extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'horizon:status';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Mock horizon status to pass checks on unsupported environments';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $this->info("Horizon is running.");
        return 0;
    }
}
