<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Tenant;

echo "Email | Role | Store Slug | Password\n";
echo "--- | --- | --- | ---\n";

foreach (User::all() as $u) {
    $roles = DB::table('tenant_users')->where('user_id', $u->id)->get();
    if ($roles->isEmpty()) {
        $store = $u->is_platform_admin ? "Platform (All Stores)" : "No Store Assigned";
        echo "{$u->email} | Admin | {$store} | password\n";
    } else {
        foreach ($roles as $r) {
            $tenant = Tenant::find($r->tenant_id);
            $slug = $tenant ? $tenant->slug : "Unknown";
            echo "{$u->email} | {$r->role} | {$slug} | password\n";
        }
    }
}
