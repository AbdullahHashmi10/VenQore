<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

for($i=1;$i<=12;$i++) {
    DB::table('accounts')->insertOrIgnore([
        'id' => Str::uuid()->toString(),
        'code' => '90' . str_pad($i, 2, '0', STR_PAD_LEFT),
        'name' => 'Dummy Account ' . $i,
        'type' => 'expense',
        'is_active' => 1,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
}
DB::table('users')->insertOrIgnore([
    'id' => Str::uuid()->toString(),
    'name' => 'Admin',
    'email' => 'admin@amd.com',
    'password' => bcrypt('password'),
    'role' => 'admin',
    'created_at' => now(),
    'updated_at' => now(),
]);
echo "Seeded successfully.\n";
