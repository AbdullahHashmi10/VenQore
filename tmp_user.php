<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;

echo "Email | Platform Admin | Passcode | Trashed\n";
echo "--- | --- | --- | ---\n";
foreach (User::withTrashed()->get() as $u) {
    echo "{$u->email} | " . ($u->is_platform_admin ? "YES" : "NO") . " | " . ($u->passcode ?? "none") . " | " . ($u->deleted_at ? "YES" : "NO") . "\n";
}
