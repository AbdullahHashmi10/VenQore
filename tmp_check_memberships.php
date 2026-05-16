<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$user = \App\Models\User::where('email', 'Hashmi@venqore.com')->first();
if ($user) {
    $memberships = \App\Models\TenantUser::where('user_id', $user->id)->get();
    foreach ($memberships as $m) {
        $tenant = \App\Models\Tenant::find($m->tenant_id);
        echo "Tenant: " . ($tenant ? $tenant->name : 'Unknown') . " (ID: $m->tenant_id) | Role: $m->role\n";
    }
} else {
    echo "User not found\n";
}
