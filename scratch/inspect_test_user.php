<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\DB;

$email = 'test@venqore.com';
$user = User::where('email', $email)->first();

if (!$user) {
    echo "User {$email} not found.\n";
    exit;
}

echo "User ID: {$user->id}\n";
echo "Email: {$user->email}\n";
echo "Last Store ID: {$user->last_store_id}\n";

$memberships = DB::table('tenant_users')->where('user_id', $user->id)->get();
echo "Memberships count: " . count($memberships) . "\n";
foreach ($memberships as $m) {
    $tenant = DB::table('tenants')->where('id', $m->tenant_id)->first();
    echo "- Tenant ID: {$m->tenant_id}, Name: " . ($tenant ? $tenant->name : 'Unknown') . ", Role: {$m->role}\n";
}
