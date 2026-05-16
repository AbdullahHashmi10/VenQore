<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$user = \App\Models\User::where('email', 'Hashmi@venqore.com')->first();
if ($user) {
    echo "User: " . $user->email . "\n";
    echo "Role: " . $user->role . "\n";
    echo "Store ID: " . $user->store_id . "\n";
    $tenant = \App\Models\Store::find($user->store_id);
    echo "Store Name: " . ($tenant ? $tenant->name : 'None') . "\n";
} else {
    echo "User not found\n";
}
