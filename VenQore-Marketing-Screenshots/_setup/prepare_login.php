<?php
// Local-only: gives the demo owner a random password (saved to demo-login.txt next to this file) and un-restricts the demo tenant so Settings/Backups pages work.
$app = $_SERVER['argv'][1];
require $app.'/vendor/autoload.php';
$l = require $app.'/bootstrap/app.php';
$k = $l->make(Illuminate\Contracts\Console\Kernel::class); $k->bootstrap();
if (config('database.connections.'.config('database.default').'.database') !== 'venqore_demo') { fwrite(STDERR,"REFUSING\n"); exit(2); }
$t = App\Models\Tenant::orderBy('id')->first();
$t->forceFill(['is_demo'=>false,'is_golden_master'=>false,'slug'=>'al-noor-mart','name'=>'Al-Noor Mart','plan'=>'scale','status'=>'active','setup_completed'=>true,'onboarding_completed'=>true,'onboarding_step'=>'completed'])->save();
$u = App\Models\User::where('email','owner@venqore-demo.internal')->first();
$pw = Illuminate\Support\Str::random(16);
$u->forceFill(['password'=>bcrypt($pw),'email_verified_at'=>now(),'name'=>'Ayesha Khan'])->save();
Illuminate\Support\Facades\DB::table('tenant_users')->updateOrInsert(['tenant_id'=>$t->id,'user_id'=>$u->id],['role'=>'owner','status'=>'active','display_name'=>'Ayesha Khan','created_at'=>now(),'updated_at'=>now()]);
$u->forceFill(['last_store_id'=>$t->id])->save();
file_put_contents(__DIR__.'/demo-login.txt', "email: owner@venqore-demo.internal\npassword: $pw\nstore slug: {$t->slug}\nurl: http://127.0.0.1:8001/s/{$t->slug}/dashboard\n");
echo "tenant {$t->id} slug {$t->slug}\n";
