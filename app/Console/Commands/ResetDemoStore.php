<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use App\Services\DemoStoreService;

class ResetDemoStore extends Command
{
    protected $signature = 'demo:reset {--force : Legacy compatibility flag}';
    protected $description = 'Reset the demo store to its original state (fast snapshot restore; falls back to full reseed if no snapshot exists)';

    public function handle()
    {
        $this->info('Starting Demo Store reset...');

        // Self-heals the tenant row instead of bailing when none exists —
        // previously this used first() and returned an error, which meant
        // the very first reset on a fresh server could never succeed.
        DemoStoreService::goldenMaster();

        // Fast path: restore from the golden master snapshot (this is what
        // the nightly schedule now calls — see routes/console.php). Falls
        // back to demo:full-deploy automatically inside demo:restore if no
        // snapshot file exists yet.
        $this->info('Restoring from Golden Master snapshot...');
        $exitCode = Artisan::call('demo:restore', ['--force' => true]);
        $this->line(Artisan::output());

        if ($exitCode === 0) {
            $this->info('Demo store reset successful!');
        } else {
            $this->error('Demo store reset finished with errors — see output above.');
        }

        return $exitCode;
    }
}
