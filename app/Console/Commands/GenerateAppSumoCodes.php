<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\AppSumoCode;
use Illuminate\Support\Str;

class GenerateAppSumoCodes extends Command
{
    protected $signature = 'appsumo:generate {count=100} {--tier=Tier 1}';
    protected $description = 'Bulk generate unique AppSumo redemption codes';

    public function handle()
    {
        $count = (int) $this->argument('count');
        $tier = $this->option('tier');

        $this->info("🚀 Generating {$count} codes for {$tier}...");

        $bar = $this->output->createProgressBar($count);
        $bar->start();

        for ($i = 0; $i < $count; $i++) {
            // Format: VQ-XXXX-XXXX (Premium look)
            $code = 'VQ-' . strtoupper(Str::random(4)) . '-' . strtoupper(Str::random(4));
            
            // Ensure uniqueness
            while (AppSumoCode::where('code', $code)->exists()) {
                $code = 'VQ-' . strtoupper(Str::random(4)) . '-' . strtoupper(Str::random(4));
            }

            AppSumoCode::create([
                'code' => $code,
                'plan_tier' => $tier,
            ]);

            $bar->advance();
        }

        $bar->finish();
        $this->info("\n✅ Successfuly generated {$count} codes.");
        
        return 0;
    }
}
