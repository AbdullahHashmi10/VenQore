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
        DB::beginTransaction();
        
        echo "Purging dependencies for {$email}...\n";
        
        // Delete from tenant_users
        DB::table('tenant_users')->where('user_id', $user->id)->delete();
        
        // Delete sessions
        DB::table('sessions')->where('user_id', $user->id)->delete();
        
        // Delete personal access tokens (if exists)
        if (Schema::hasTable('personal_access_tokens')) {
            DB::table('personal_access_tokens')->where('tokenable_id', $user->id)->where('tokenable_type', User::class)->delete();
        }
        
        // Final Purge
        $user->forceDelete();
        
        DB::commit();
        echo "✅ Successfully purged platform@venqore.com and all its relationships.\n";
    } catch (\Exception $e) {
        DB::rollBack();
        echo "❌ Error: " . $e->getMessage() . "\n";
    }
} else {
    echo "User platform@venqore.com not found.\n";
}
