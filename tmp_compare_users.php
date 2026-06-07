<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;

$emails = ['Hashmi@venqore.com', 'platform@venqore.com'];

foreach ($emails as $email) {
    $u = User::where('email', $email)->first();
    if ($u) {
        $isAdmin = $u->is_platform_admin ? "YES" : "NO";
        $stores = DB::table('tenant_users')->where('user_id', $u->id)->count();
        echo "User: $email | Platform Admin: $isAdmin | Owned Stores (Directly): $stores\n";
    } else {
        echo "User: $email | NOT FOUND\n";
    }
}
