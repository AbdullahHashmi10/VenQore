<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\DB;

$email = 'platform@venqore.com';
$user = User::withTrashed()->where('email', $email)->first();

if ($user) {
    try {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        
        // Delete the user
        DB::table('users')->where('id', $user->id)->delete();
        
        // Delete their roles to be clean
        DB::table('tenant_users')->where('user_id', $user->id)->delete();
        
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        
        echo "✅ Force Purged platform@venqore.com.\n";
    } catch (\Exception $e) {
        echo "❌ Error: " . $e->getMessage() . "\n";
    }
} else {
    echo "User platform@venqore.com already gone.\n";
}
