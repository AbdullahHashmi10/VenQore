<?php
// Boots the app against DB_DATABASE=venqore_demo, logs in a demo owner so the engines can stamp user_id, then runs demo:full-deploy.
$app = $_SERVER['argv'][1] ?? null;
require $app.'/vendor/autoload.php';
$laravel = require $app.'/bootstrap/app.php';
$kernel = $laravel->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
if (config('database.connections.'.config('database.default').'.database') !== 'venqore_demo') { fwrite(STDERR, "REFUSING: not venqore_demo\n"); exit(2); }
$tenant = App\Services\DemoStoreService::goldenMaster();
$user = App\Models\User::firstOrCreate(['email' => 'owner@venqore-demo.internal'], [
  'name' => 'Demo Owner', 'password' => bcrypt(Illuminate\Support\Str::random(40)), 'last_store_id' => $tenant->id,
]);
Illuminate\Support\Facades\DB::table('tenant_users')->updateOrInsert(
  ['tenant_id' => $tenant->id, 'user_id' => $user->id],
  ['role' => 'owner', 'status' => 'active', 'display_name' => 'Demo Owner', 'created_at' => now(), 'updated_at' => now()]);
auth()->login($user);
$code = $kernel->call('demo:full-deploy', [], new Symfony\Component\Console\Output\StreamOutput(fopen('php://stdout','w')));
echo "EXIT $code\n";
