<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Tenant;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

$email = 'staff@venqore.com';
$password = 'password';

$user = User::where('email', $email)->first();
if (!$user) {
    $user = User::create([
        'name' => 'Staff Cashier',
        'email' => $email,
        'password' => Hash::make($password),
        'is_platform_admin' => false,
    ]);
    echo "User {$email} created.\n";
} else {
    $user->update([
        'password' => Hash::make($password),
        'is_platform_admin' => false,
    ]);
    echo "User {$email} updated.\n";
}

$tenant = Tenant::where('slug', 'venqore-business')->first();
if ($tenant) {
    DB::table('tenant_users')
        ->where('tenant_id', $tenant->id)
        ->where('user_id', $user->id)
        ->delete();

    DB::table('tenant_users')->insert([
        'tenant_id' => $tenant->id,
        'user_id' => $user->id,
        'role' => 'cashier',
        'status' => 'active',
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    echo "Linked {$email} to tenant {$tenant->slug} as cashier.\n";
} else {
    echo "Tenant venqore-business not found!\n";
}
