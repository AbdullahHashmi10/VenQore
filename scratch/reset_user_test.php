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

echo "Resetting user {$email} (ID: {$user->id})...\n";

// Clear last_store_id
$user->last_store_id = null;
$user->save();

// Delete memberships in tenant_users
$deleted = DB::table('tenant_users')->where('user_id', $user->id)->delete();
echo "Deleted {$deleted} store memberships.\n";

echo "Reset completed successfully! User will now land on the Hub.\n";
