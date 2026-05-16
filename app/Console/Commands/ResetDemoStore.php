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

        // Just run the seed command. In a real environment, we'd truncate tables matching the tenant first,
        // or have a more involved "Golden Master" cloning. For this iteration, running the DemoStoreSeeder
        // updates existing records to baseline and clears recent activity.
        
        $this->info("Re-seeding database from DemoMasterSeeder...");
        Artisan::call('db:seed', ['--class' => 'DemoStoreSeeder', '--force' => true]);

        // Reset demo specific tracking
        $demoTenant->update([
            'demo_reset_at' => now(),
            'demo_visit_today' => 0
        ]);
        
        \Illuminate\Support\Facades\Cache::put('demo_visit_live', 0);

        $this->info("Demo store reset successful!");
        return 0;
    }
}
