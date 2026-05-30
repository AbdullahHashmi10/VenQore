<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use App\Models\Tenant;

class ResetDemoStore extends Command
{
    protected $signature = 'demo:reset';
    protected $description = 'Reset the demo store to its original state';

    public function handle()
    {
        $this->info("Starting Demo Store reset...");
        
        $demoTenant = Tenant::where('is_demo', true)->first();
        
        if (!$demoTenant) {
            $this->error("No demo tenant found!");
            return 1;
        }

        // Run the full nuclear deploy command to seed rich 5-year data across all modules
        $this->info("Running full nuclear demo store deploy...");
        Artisan::call('demo:full-deploy');
        
        $this->info("Demo store reset successful!");
        return 0;
    }
}
