<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

$store = Tenant::where('slug', 'vq-test-store')->first();
if (!$store) {
    die("Error: vq-test-store not found.");
}

$roles = [
    'admin' => 'admin@venqore-demo.internal',
    'manager' => 'manager@venqore-demo.internal',
    'cashier' => 'cashier@venqore-demo.internal',
    'accountant' => 'accountant@venqore-demo.internal',
    'purchasing' => 'purchasing_officer@venqore-demo.internal',
    'viewer' => 'viewer@venqore-demo.internal'
];

foreach ($roles as $role => $email) {
    $user = User::updateOrCreate(['email' => $email], [
        'name' => ucwords(str_replace(['@', '.', '-'], ' ', explode('@', $email)[0])),
        'password' => bcrypt('password'),
        'email_verified_at' => now()
    ]);

    // Assign to store
    DB::table('tenant_users')->updateOrInsert(
        ['tenant_id' => $store->id, 'user_id' => $user->id],
        ['role' => $role, 'status' => 'active', 'created_at' => now(), 'updated_at' => now()]
    );
    
    echo "✅ Set up $email as $role in vq-test-store.\n";
}
