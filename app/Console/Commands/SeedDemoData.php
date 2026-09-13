<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Database\Seeders\DemoStoreSeeder;

class SeedDemoData extends Command
{
    protected $signature = 'demo:seed';
    protected $description = 'Seed the system with realistic demo data for AppSumo/Public testing';

    public function handle()
    {
        $this->info('Starting Demo Seeding...');
        $seeder = new DemoStoreSeeder();
        $seeder->run();
        $this->info('Demo Seeding Complete!');
        return 0;
    }
}
