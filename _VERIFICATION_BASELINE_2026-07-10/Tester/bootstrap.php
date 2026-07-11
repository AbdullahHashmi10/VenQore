<?php

require __DIR__ . '/../vendor/autoload.php';

// Boot Laravel
$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Run seeder once globally before tests
echo "Seeding Golden Company master...\n";
\Illuminate\Support\Facades\Artisan::call('db:seed', ['--class' => 'GoldenCompanySeeder', '--force' => true]);
echo "Database ready.\n";
