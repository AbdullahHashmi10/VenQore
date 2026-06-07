<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;

try {
    // Delete God
    $god = User::withTrashed()->where('email', 'god@venqore.com')->first();
    if ($god) {
        $god->forceDelete();
        echo "Permanently deleted god@venqore.com\n";
    }

    // Create Hashmi
    $hashmi = User::updateOrCreate(['email' => 'Hashmi@venqore.com'], [
        'name' => 'Abdullah Hashmi',
        'password' => bcrypt('Admin1234'),
        'is_platform_admin' => true,
        'email_verified_at' => now()
    ]);
    
    echo "✅ Success: Hashmi@venqore.com is now the Platform Owner with password 'Admin1234'.\n";

} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
