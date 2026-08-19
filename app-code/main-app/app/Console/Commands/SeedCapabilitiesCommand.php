<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Database\Seeders\CapabilitiesRegistrySeeder;

class SeedCapabilitiesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'vq:seed-capabilities';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Populate or refresh the VenQore capabilities registry table and search index from PlanFeatureMatrixSeeder.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Seeding capabilities registry...');

        $seeder = new CapabilitiesRegistrySeeder();
        $seeder->setCommand($this);
        $seeder->run();

        $this->info('Capabilities registry successfully seeded.');
        return 0;
    }
}
